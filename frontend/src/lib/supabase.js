import { createClient } from '@supabase/supabase-js';

const supabaseUrl = __SUPABASE_URL__;
const supabaseAnonKey = __SUPABASE_ANON_KEY__;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || localStorage.getItem('vmg_token');
}
