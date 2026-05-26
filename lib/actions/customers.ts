"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
import { revalidatePath } from "next/cache";

export async function getCustomers(searchQuery?: string) {
  const supabase = await createClient();
  let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
  
  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch customers: " + error.message);
  
  return data;
}

export async function getCustomerById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      orders (*),
      customer_transactions (*),
      cash_transactions:cash_transactions(id, type, category, amount, description, created_at, created_by)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error("Failed to fetch customer details: " + error.message);
  return data;
}

export async function createCustomer(data: { name: string; phone: string; address: string; balance?: number }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  
  // Check phone uniqueness
  const { count } = await supabase.from('customers').select('*', { count: 'exact', head: true }).eq('phone', data.phone);
  if (count && count > 0) throw new Error("A customer with this phone number already exists");

  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert([{
      name: data.name,
      phone: data.phone,
      address: data.address,
      balance: data.balance || 0
    }])
    .select()
    .single();
    
  if (error) throw new Error("Failed to create customer: " + error.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'create_customer',
    entity_type: 'customer',
    entity_id: newCustomer.id,
    details: { name: data.name, phone: data.phone, balance: data.balance || 0 }
  }]);

  revalidatePath('/customers');
  return newCustomer;
}

export async function updateCustomer(id: string, data: { name?: string; phone?: string; address?: string }) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  
  const supabase = await createClient();
  
  if (data.phone) {
    const { data: existing } = await supabase.from('customers').select('id').eq('phone', data.phone).single();
    if (existing && existing.id !== id) {
      throw new Error("This phone number is already used by another customer");
    }
  }

  const { error } = await supabase
    .from('customers')
    .update(data)
    .eq('id', id);
    
  if (error) throw new Error("Failed to update customer: " + error.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'update_customer',
    entity_type: 'customer',
    entity_id: id,
    details: data
  }]);

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
}

export async function deleteCustomer(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Unauthorized: Only admins can delete customers");
  }

  const supabase = await createClient();
  
  const { count, error: countError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', id);

  if (countError) throw countError;
  if (count && count > 0) {
    throw new Error("Cannot delete customer because they have existing orders.");
  }

  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw new Error("Failed to delete customer: " + error.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'delete_customer',
    entity_type: 'customer',
    entity_id: id,
    details: { deleted_customer_id: id }
  }]);

  revalidatePath('/customers');
}

export async function adjustBalance(id: string, type: 'debit' | 'credit', amount: number, description: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const supabase = await createClient();
  
  const { data: customer } = await supabase.from('customers').select('balance').eq('id', id).single();
  if (!customer) throw new Error("Customer not found");

  // A 'debit' to customer ledger means they owe us more, so balance decreases (becomes more negative)
  // A 'credit' to customer ledger means we owe them more, so balance increases (becomes more positive)
  const balanceChange = type === 'debit' ? -amount : amount;
  const newBalance = customer.balance + balanceChange;

  const { error: txError } = await supabase.from('customer_transactions').insert([{
    customer_id: id,
    type,
    amount,
    description
  }]);

  if (txError) throw new Error("Failed to record transaction: " + txError.message);

  const { error: updateError } = await supabase
    .from('customers')
    .update({ balance: newBalance })
    .eq('id', id);

  if (updateError) throw new Error("Failed to update balance: " + updateError.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'adjust_balance',
    entity_type: 'customer',
    entity_id: id,
    details: { type, amount, description, old_balance: customer.balance, new_balance: newBalance }
  }]);

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
}

export async function recordCashCollection(id: string, amount: number, description: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const supabase = await createClient();
  
  const { data: customer } = await supabase.from('customers').select('balance').eq('id', id).single();
  if (!customer) throw new Error("Customer not found");

  // Collection means customer is paying us what they owe. 
  // It reduces their debt. If balance is -100 (they owe 100), collecting 40 makes balance -60. So balance increases by amount.
  // This is a 'credit' to their ledger.
  const newBalance = customer.balance + amount;

  // 1. Customer Transaction
  const { error: txError } = await supabase.from('customer_transactions').insert([{
    customer_id: id,
    type: 'credit',
    amount,
    description: description || "Cash Collection"
  }]);

  if (txError) throw new Error("Failed to record customer transaction: " + txError.message);

  // 2. Global Cash Transaction
  const { error: cashError } = await supabase.from('cash_transactions').insert([{
    type: 'in',
    category: 'collection',
    amount,
    description: description || `Collection from customer`,
    customer_id: id,
    created_by: profile.id
  }]);

  if (cashError) throw new Error("Failed to record cash transaction: " + cashError.message);

  // 3. Update Customer Balance
  const { error: updateError } = await supabase
    .from('customers')
    .update({ balance: newBalance })
    .eq('id', id);

  if (updateError) throw new Error("Failed to update customer balance: " + updateError.message);

  await supabase.from('activity_log').insert([{
    user_id: profile.id,
    action: 'cash_collection',
    entity_type: 'customer',
    entity_id: id,
    details: { amount, description, old_balance: customer.balance, new_balance: newBalance }
  }]);

  revalidatePath('/customers');
  revalidatePath(`/customers/${id}`);
  revalidatePath('/dashboard'); // Cash flow changes
}
