"use server";

import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/types";

export async function loginAction(phone: string, pass: string) {
  const supabase = await createClient();
  
  // Supabase phone auth requires email workaround as per instructions:
  const email = `${phone}@swadhin.local`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pass,
  });

  if (error) {
    return { error: "ফোন নম্বর বা পাসওয়ার্ড ভুল" };
  }

  return { success: true, user: data.user };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, privileges, salary_amount')
    .eq('user_id', user.id)
    .single();

  if (profile && typeof profile.privileges === 'string') {
    try {
      profile.privileges = JSON.parse(profile.privileges);
    } catch (e) {
      profile.privileges = {};
    }
  }

  return profile as Profile | null;
}
