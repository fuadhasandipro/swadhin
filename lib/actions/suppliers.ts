"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
import { logActivity } from "@/lib/utils/activityLogger";
import { revalidatePath } from "next/cache";

export async function getSuppliers(searchQuery?: string) {
  const supabase = await createClient();
  let query = supabase.from('suppliers').select('*, supplier_transactions(count)').order('name');

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch suppliers: " + error.message);
  return data;
}

export async function getSupplierById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('suppliers')
    .select(`*, supplier_transactions(*)`)
    .eq('id', id)
    .single();

  if (error) throw new Error("Failed to fetch supplier: " + error.message);
  return data;
}

export async function createSupplier(data: {
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  notes?: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  const supabase = await createClient();

  const { data: newSupplier, error } = await supabase
    .from('suppliers')
    .insert([{
      name: data.name,
      phone: data.phone || null,
      address: data.address || null,
      balance: data.balance || 0,
      notes: data.notes || null,
    }])
    .select()
    .single();

  if (error) throw new Error("Failed to create supplier: " + error.message);

  await logActivity(supabase, {
    userId: profile.id,
    action: 'CREATE_SUPPLIER',
    entityType: 'suppliers',
    entityId: newSupplier.id,
    details: { name: data.name }
  });

  revalidatePath('/suppliers');
  return newSupplier;
}

export async function updateSupplier(id: string, data: {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase.from('suppliers').update(data).eq('id', id);
  if (error) throw new Error("Failed to update supplier: " + error.message);

  await logActivity(supabase, {
    userId: profile.id,
    action: 'UPDATE_SUPPLIER',
    entityType: 'suppliers',
    entityId: id,
    details: data
  });

  revalidatePath('/suppliers');
  revalidatePath(`/suppliers/${id}`);
}

export async function deleteSupplier(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new Error("Only admins can delete suppliers");

  const supabase = await createClient();
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw new Error("Failed to delete supplier: " + error.message);

  revalidatePath('/suppliers');
}

/**
 * Record a purchase from a supplier (cash out + supplier balance goes up).
 * Positive supplier balance = we owe them.
 */
export async function recordSupplierPurchase(data: {
  supplier_id: string;
  amount: number;
  description: string;
  paid_amount: number; // amount paid now in cash (0 = fully on credit)
  date?: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (data.amount <= 0) throw new Error("Amount must be greater than zero");
  if (data.paid_amount < 0 || data.paid_amount > data.amount) {
    throw new Error("Paid amount must be between 0 and total amount");
  }

  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('balance')
    .eq('id', data.supplier_id)
    .single();

  if (!supplier) throw new Error("Supplier not found");

  // Due = total - paid (this stays on credit = increases what we owe the supplier)
  const dueAmount = data.amount - data.paid_amount;
  const newBalance = Number(supplier.balance) + dueAmount;

  // 1. Record supplier transaction (debit = we owe them more)
  const { error: txError } = await supabase.from('supplier_transactions').insert([{
    supplier_id: data.supplier_id,
    type: 'debit',
    amount: data.amount,
    description: data.description,
  }]);
  if (txError) throw new Error("Failed to record supplier transaction: " + txError.message);

  // 2. Update supplier balance
  const { error: balanceError } = await supabase
    .from('suppliers')
    .update({ balance: newBalance })
    .eq('id', data.supplier_id);
  if (balanceError) throw new Error("Failed to update supplier balance: " + balanceError.message);

  // 3. If paid_amount > 0, record a cash-out transaction
  if (data.paid_amount > 0) {
    const payload: any = {
      type: 'out',
      category: 'expense',
      amount: data.paid_amount,
      description: data.description + ` (Supplier payment - ${data.paid_amount} of ${data.amount})`,
      supplier_id: data.supplier_id,
      created_by: profile.id,
    };
    if (data.date) payload.created_at = new Date(data.date).toISOString();

    const { error: cashError } = await supabase.from('cash_transactions').insert([payload]);
    if (cashError) throw new Error("Failed to record cash transaction: " + cashError.message);
  }

  await logActivity(supabase, {
    userId: profile.id,
    action: 'SUPPLIER_PURCHASE',
    entityType: 'suppliers',
    entityId: data.supplier_id,
    details: { amount: data.amount, paid: data.paid_amount, due: dueAmount }
  });

  revalidatePath('/suppliers');
  revalidatePath(`/suppliers/${data.supplier_id}`);
  revalidatePath('/cash');
  revalidatePath('/dashboard');
}

/**
 * Record a payment TO a supplier (we're paying off our debt).
 */
export async function recordSupplierPayment(data: {
  supplier_id: string;
  amount: number;
  description: string;
  date?: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (data.amount <= 0) throw new Error("Amount must be greater than zero");

  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('balance')
    .eq('id', data.supplier_id)
    .single();

  if (!supplier) throw new Error("Supplier not found");

  // Paying them = reducing what we owe (balance goes down)
  const newBalance = Number(supplier.balance) - data.amount;

  // 1. Record supplier transaction credit
  const { error: txError } = await supabase.from('supplier_transactions').insert([{
    supplier_id: data.supplier_id,
    type: 'credit',
    amount: data.amount,
    description: data.description || 'Payment to supplier',
  }]);
  if (txError) throw new Error("Failed to record supplier transaction: " + txError.message);

  // 2. Update supplier balance
  await supabase.from('suppliers').update({ balance: newBalance }).eq('id', data.supplier_id);

  // 3. Cash out transaction
  const payload: any = {
    type: 'out',
    category: 'expense',
    amount: data.amount,
    description: data.description || 'Payment to supplier',
    supplier_id: data.supplier_id,
    created_by: profile.id,
  };
  if (data.date) payload.created_at = new Date(data.date).toISOString();
  await supabase.from('cash_transactions').insert([payload]);

  await logActivity(supabase, {
    userId: profile.id,
    action: 'SUPPLIER_PAYMENT',
    entityType: 'suppliers',
    entityId: data.supplier_id,
    details: { amount: data.amount, old_balance: supplier.balance, new_balance: newBalance }
  });

  revalidatePath('/suppliers');
  revalidatePath(`/suppliers/${data.supplier_id}`);
  revalidatePath('/cash');
  revalidatePath('/dashboard');
}

/**
 * Record a refund FROM a supplier (supplier gives us cash back).
 */
export async function recordSupplierRefund(data: {
  supplier_id: string;
  amount: number;
  description: string;
  date?: string;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");
  if (data.amount <= 0) throw new Error("Amount must be greater than zero");

  const supabase = await createClient();

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('balance')
    .eq('id', data.supplier_id)
    .single();

  if (!supplier) throw new Error("Supplier not found");

  const newBalance = Number(supplier.balance) + data.amount;

  // 1. Record supplier transaction debit
  const { error: txError } = await supabase.from('supplier_transactions').insert([{
    supplier_id: data.supplier_id,
    type: 'debit',
    amount: data.amount,
    description: data.description || 'Refund from supplier',
  }]);
  if (txError) throw new Error("Failed to record supplier transaction: " + txError.message);

  // 2. Update supplier balance
  await supabase.from('suppliers').update({ balance: newBalance }).eq('id', data.supplier_id);

  // 3. Cash in transaction
  const payload: any = {
    type: 'in',
    category: 'refund',
    amount: data.amount,
    description: data.description || 'Refund from supplier',
    supplier_id: data.supplier_id,
    created_by: profile.id,
  };
  if (data.date) payload.created_at = new Date(data.date).toISOString();
  await supabase.from('cash_transactions').insert([payload]);

  await logActivity(supabase, {
    userId: profile.id,
    action: 'SUPPLIER_REFUND',
    entityType: 'suppliers',
    entityId: data.supplier_id,
    details: { amount: data.amount, old_balance: supplier.balance, new_balance: newBalance }
  });

  revalidatePath('/suppliers');
  revalidatePath(`/suppliers/${data.supplier_id}`);
  revalidatePath('/cash');
  revalidatePath('/dashboard');
}

export async function adjustSupplierBalance(
  supplierId: string,
  type: "debit" | "credit",
  amount: number,
  description: string
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") throw new Error("Only admins can adjust balance directly");
  if (amount <= 0) throw new Error("Amount must be greater than zero");

  const supabase = await createClient();

  const { data: supplier, error: fetchErr } = await supabase
    .from("suppliers")
    .select("balance")
    .eq("id", supplierId)
    .single();

  if (fetchErr || !supplier) throw new Error("Supplier not found");

  // For suppliers, positive balance = we owe them.
  // Debit = increases debt (we owe them more)
  // Credit = decreases debt (we owe them less)
  const balanceDelta = type === "debit" ? amount : -amount;
  const newBalance = Number(supplier.balance) + balanceDelta;

  const { error: txError } = await supabase.from("supplier_transactions").insert([
    {
      supplier_id: supplierId,
      type,
      amount,
      description: description || `Manual balance adjustment (${type})`,
    },
  ]);
  if (txError) throw new Error("Failed to record transaction");

  const { error: updateErr } = await supabase
    .from("suppliers")
    .update({ balance: newBalance })
    .eq("id", supplierId);

  if (updateErr) throw new Error("Failed to update balance");

  await logActivity(supabase, {
    userId: profile.id,
    action: "ADJUST_SUPPLIER_BALANCE",
    entityType: "suppliers",
    entityId: supplierId,
    details: { type, amount, old_balance: supplier.balance, new_balance: newBalance },
  });

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
  revalidatePath("/dashboard");
}
