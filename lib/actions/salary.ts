"use server";

import { createClient } from "../supabase/server";
import { getCurrentProfile } from "./auth";
import { logActivity } from "@/lib/utils/activityLogger";
import { revalidatePath } from "next/cache";

export async function updateEmployeeSalary(profileId: string, amount: number) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') {
    throw new Error("Only Admin can update salary amounts");
  }

  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update({ salary_amount: amount }).eq('id', profileId);
  
  if (error) throw new Error(error.message);
  revalidatePath('/salary');
}

export async function getEmployeeSalaryDetails(month: string) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    throw new Error("Unauthorized to view salary details");
  }

  const supabase = await createClient();
  
  // Get all active profiles (staff, managers)
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role, salary_amount')
    .neq('role', 'admin') // exclude admin if admin doesn't take salary, or we can keep everyone
    .order('full_name');

  if (profileError) throw new Error(profileError.message);

  // Get salary records for the given month
  const { data: records, error: recordsError } = await supabase
    .from('salary_records')
    .select('*')
    .eq('month', month);

  if (recordsError) throw new Error(recordsError.message);

  // Merge records with profiles
  const employeeSalaries = profiles.map(emp => {
    const record = records.find(r => r.profile_id === emp.id);
    const expectedAmount = emp.salary_amount;
    
    if (record) {
      return {
        ...emp,
        recordId: record.id,
        paid_amount: record.paid_amount,
        due_amount: record.due_amount,
        total_salary_this_month: record.amount // what was recorded when payment was first made
      };
    } else {
      return {
        ...emp,
        recordId: null,
        paid_amount: 0,
        due_amount: expectedAmount,
        total_salary_this_month: expectedAmount
      };
    }
  });

  return employeeSalaries;
}

export async function getSalarySummary(month: string) {
  const details = await getEmployeeSalaryDetails(month);
  
  const totalSalary = details.reduce((sum, emp) => sum + Number(emp.total_salary_this_month), 0);
  const totalPaid = details.reduce((sum, emp) => sum + Number(emp.paid_amount), 0);
  const totalDue = details.reduce((sum, emp) => sum + Number(emp.due_amount), 0);

  return { totalSalary, totalPaid, totalDue };
}

export async function paySalary(profileId: string, month: string, amountToPay: number, notes?: string) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
    throw new Error("Unauthorized to pay salary");
  }

  if (amountToPay <= 0) throw new Error("Amount must be greater than 0");

  const supabase = await createClient();

  // Get employee details
  const { data: emp, error: empErr } = await supabase.from('profiles').select('full_name, salary_amount').eq('id', profileId).single();
  if (empErr || !emp) throw new Error("Employee not found");

  // Check if a record exists for this month
  const { data: existingRecord } = await supabase
    .from('salary_records')
    .select('*')
    .eq('profile_id', profileId)
    .eq('month', month)
    .single();

  if (existingRecord) {
    if (amountToPay > existingRecord.due_amount) {
      throw new Error(`Cannot pay more than due amount (৳${existingRecord.due_amount})`);
    }

    const newPaid = Number(existingRecord.paid_amount) + amountToPay;
    const newDue = Number(existingRecord.due_amount) - amountToPay;

    const { error: updateErr } = await supabase
      .from('salary_records')
      .update({
        paid_amount: newPaid,
        due_amount: newDue,
        paid_at: new Date().toISOString(),
        notes: notes || existingRecord.notes
      })
      .eq('id', existingRecord.id);
      
    if (updateErr) throw new Error(updateErr.message);
  } else {
    if (amountToPay > emp.salary_amount) {
      throw new Error(`Cannot pay more than monthly salary (৳${emp.salary_amount})`);
    }

    const { error: insertErr } = await supabase
      .from('salary_records')
      .insert({
        profile_id: profileId,
        month: month,
        amount: emp.salary_amount,
        paid_amount: amountToPay,
        due_amount: emp.salary_amount - amountToPay,
        paid_at: new Date().toISOString(),
        notes: notes
      });

    if (insertErr) throw new Error(insertErr.message);
  }

  // Deduct from cash in hand
  const { error: cashErr } = await supabase.from('cash_transactions').insert({
    type: 'out',
    category: 'salary',
    amount: amountToPay,
    description: `Salary for ${emp.full_name} (${month})`,
    created_by: profile.id
  });

  if (cashErr) throw new Error("Failed to record cash transaction: " + cashErr.message);

  // Log activity
  await logActivity(supabase, {
    userId: profile.id,
    action: 'PAY_SALARY',
    entityType: 'salary_records',
    entityId: profileId,
    details: { employee: emp.full_name, month, amount: amountToPay }
  });

  revalidatePath('/salary');
  revalidatePath('/cash');
}
