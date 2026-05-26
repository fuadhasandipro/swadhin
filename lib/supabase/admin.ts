import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Missing Supabase admin credentials. Admin functions will fail.');
}

// Note: This client bypasses RLS and should ONLY be used in secure server environments
export const supabaseAdmin = createClient(
  supabaseUrl || 'missing_url',
  supabaseServiceKey || 'missing_key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
