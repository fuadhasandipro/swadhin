"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "./auth";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/utils/activityLogger";

export async function createManagerAccount(data: { full_name: string, phone: string, password: string, privileges: any, salary: number }) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') {
    throw new Error("Unauthorized: Only Admins can create new managers.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!/^01[3-9]\d{8}$/.test(data.phone)) {
    throw new Error("Invalid phone number format. Must be a valid BD number.");
  }

  if (data.salary < 0) throw new Error("Salary cannot be negative.");

  if (!supabaseServiceKey) {
    throw new Error("Server configuration error: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables.");
  }

  // Use the admin API to create the user directly
  const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const dummyEmail = `${data.phone}@swadhin.local`;

  // Create Auth User
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: dummyEmail,
    password: data.password,
    email_confirm: true, // Auto confirm so they can login immediately
    user_metadata: { full_name: data.full_name, phone: data.phone }
  });

  if (authError) {
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  const newUserId = userData.user.id;

  const supabase = await createClient();

  // Create Profile Record
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: newUserId,
    full_name: data.full_name,
    phone: data.phone,
    role: 'manager',
    privileges: data.privileges,
    salary_amount: data.salary,
    is_active: true
  });

  if (profileError) {
    // If profile fails, rollback auth user creation
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    throw new Error(`Failed to create profile: ${profileError.message}`);
  }

  // Log activity
  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'CREATE_MANAGER',
    entityType: 'profiles',
    entityId: newUserId,
    details: { manager_name: data.full_name, phone: data.phone }
  });

  return { success: true, message: "Manager created successfully." };
}

export async function updateUserPrivileges(profileId: string, privileges: any) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ privileges })
    .eq('id', profileId);

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'UPDATE_PRIVILEGES',
    entityType: 'profiles',
    entityId: profileId,
    details: privileges
  });

  return { success: true };
}

export async function updateUserSalary(profileId: string, salary: number) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ salary_amount: salary })
    .eq('id', profileId);

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'UPDATE_SALARY',
    entityType: 'profiles',
    entityId: profileId,
    details: { salary }
  });

  return { success: true };
}

export async function toggleUserStatus(profileId: string, is_active: boolean) {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ is_active })
    .eq('id', profileId);

  if (error) throw new Error(error.message);

  await logActivity(supabase, {
    userId: adminProfile.id,
    action: 'TOGGLE_USER_STATUS',
    entityType: 'profiles',
    entityId: profileId,
    details: { is_active }
  });

  return { success: true };
}

export async function getManagers() {
  const adminProfile = await getCurrentProfile();
  if (!adminProfile || adminProfile.role !== 'admin') throw new Error("Unauthorized");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'admin') // Exclude admins from management list
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}
