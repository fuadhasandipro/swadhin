"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
import { logActivity } from "@/lib/utils/activityLogger";

// ---------- SETTINGS KV STORE ----------

export async function updateSetting(key: string, value: any) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  
  // Using upsert to either insert or update
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'UPDATE_SETTING',
    entityType: 'settings',
    entityId: key,
    details: { key, value }
  });

  return { success: true };
}

export async function getSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('settings').select('*');
  
  if (error) throw new Error(error.message);

  const settingsMap: Record<string, any> = {};
  data.forEach(item => {
    settingsMap[item.key] = item.value;
  });

  return settingsMap;
}

// ---------- PRINT COLOR CONFIGS ----------

export async function getPrintColorConfigs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('print_color_configs')
    .select('*')
    .order('name');
    
  if (error) throw new Error(error.message);
  return data;
}

export async function addPrintColorConfig(name: string, colors: string[]) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from('print_color_configs')
    .insert({ name, colors, is_active: true });

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'CREATE_PRINT_CONFIG',
    entityType: 'print_color_configs',
    details: { name, colors }
  });

  return { success: true };
}

export async function togglePrintColorConfig(id: string, is_active: boolean) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from('print_color_configs')
    .update({ is_active })
    .eq('id', id);

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'TOGGLE_PRINT_CONFIG',
    entityType: 'print_color_configs',
    entityId: id,
    details: { is_active }
  });

  return { success: true };
}

// ---------- SMS ACTIONS ----------

export async function getSmsLogs() {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('sms_logs')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(50);
    
  if (error) throw new Error(error.message);
  return data;
}

export async function sendTestSMS(phone: string, message: string) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  // In a real app, you would integrate with an SMS provider here.
  // For now, we mock the success and insert into sms_logs.

  const supabase = await createClient();
  
  const { error } = await supabase
    .from('sms_logs')
    .insert({
      phone,
      message,
      status: 'sent'
    });

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'SEND_TEST_SMS',
    entityType: 'sms_logs',
    details: { phone, message }
  });

  return { success: true };
}

// ---------- EXPENSE CATEGORIES ----------

export async function getExpenseCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .order('name');
    
  if (error) throw new Error(error.message);
  return data;
}

export async function addExpenseCategory(name: string, description: string) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from('expense_categories')
    .insert({ name, description, is_active: true });

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'CREATE_EXPENSE_CATEGORY',
    entityType: 'expense_categories',
    details: { name, description }
  });

  return { success: true };
}

export async function deleteExpenseCategory(id: string) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  // Instead of hard delete, maybe just delete for now as per previous logic
  const { error } = await supabase
    .from('expense_categories')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'DELETE_EXPENSE_CATEGORY',
    entityType: 'expense_categories',
    entityId: id,
    details: { deleted_category_id: id }
  });

  return { success: true };
}
