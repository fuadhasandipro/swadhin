"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
import { revalidatePath } from "next/cache";
import { startOfDay, startOfMonth, endOfDay, endOfMonth } from "date-fns";
import { logActivity } from "@/lib/utils/activityLogger";

export async function getCashInHand() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('cash_transactions').select('type, amount');
  if (error) throw new Error("Failed to calculate cash in hand: " + error.message);

  let total = 0;
  for (const tx of data) {
    if (tx.type === 'in') total += Number(tx.amount);
    else total -= Number(tx.amount);
  }
  return total;
}

export async function getCashSummary() {
  const supabase = await createClient();
  const todayStart = startOfDay(new Date()).toISOString();
  const todayEnd = endOfDay(new Date()).toISOString();
  const monthStart = startOfMonth(new Date()).toISOString();
  const monthEnd = endOfMonth(new Date()).toISOString();

  // We could do this in SQL, but for simplicity we fetch the month and filter for today
  const { data: monthTx, error } = await supabase
    .from('cash_transactions')
    .select('type, amount, created_at')
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd);

  if (error) throw new Error("Failed to fetch cash summary: " + error.message);

  let cashInMonth = 0;
  let cashOutMonth = 0;
  let cashInToday = 0;
  let cashOutToday = 0;

  for (const tx of monthTx) {
    const amount = Number(tx.amount);
    if (tx.type === 'in') {
      cashInMonth += amount;
      if (tx.created_at >= todayStart && tx.created_at <= todayEnd) cashInToday += amount;
    } else {
      cashOutMonth += amount;
      if (tx.created_at >= todayStart && tx.created_at <= todayEnd) cashOutToday += amount;
    }
  }

  const cashInHand = await getCashInHand();

  return {
    today: { in: cashInToday, out: cashOutToday, net: cashInToday - cashOutToday },
    month: { in: cashInMonth, out: cashOutMonth, net: cashInMonth - cashOutMonth },
    cashInHand
  };
}

export async function getCashTransactions(typeFilter: 'all' | 'in' | 'out' | 'collection' | 'salary' = 'all') {
  const supabase = await createClient();
  let query = supabase
    .from('cash_transactions')
    .select('*, customer:customers(name), profile:profiles(full_name)')
    .order('created_at', { ascending: false });

  if (typeFilter === 'in' || typeFilter === 'out') {
    query = query.eq('type', typeFilter);
  } else if (typeFilter === 'collection') {
    query = query.eq('category', 'collection');
  } else if (typeFilter === 'salary') {
    query = query.eq('category', 'salary');
  }

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch transactions: " + error.message);
  return data;
}

export async function addCashTransaction(data: {
  type: 'in' | 'out';
  category: string;
  amount: number;
  description: string;
  customer_id?: string;
  date?: string; // Optional backdate
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Unauthorized");

  if (data.amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const supabase = await createClient();

  const payload: any = {
    type: data.type,
    category: data.category,
    amount: data.amount,
    description: data.description,
    created_by: profile.id,
  };

  if (data.customer_id) payload.customer_id = data.customer_id;
  if (data.date) payload.created_at = new Date(data.date).toISOString();

  const { data: tx, error } = await supabase
    .from('cash_transactions')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error("Failed to add transaction: " + error.message);

  // Log activity
  await logActivity(supabase, {
    userId: profile.id,
    action: 'CASH_TRANSACTION',
    entityType: 'cash_transactions',
    entityId: tx.id,
    details: { type: data.type, amount: data.amount, category: data.category }
  });

  revalidatePath('/cash');
  return tx;
}

export async function deleteCashTransaction(id: string) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Only admins can delete cash transactions");
  }

  const supabase = await createClient();
  const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
  if (error) throw new Error("Failed to delete transaction: " + error.message);

  revalidatePath('/cash');
}
