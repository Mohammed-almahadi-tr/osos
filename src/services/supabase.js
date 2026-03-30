import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Ensure you have a .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'osos-app-auth-token-v2', // Force new lock/storage to bypass deadlocks
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    lockAcquireTimeout: 3000
  }
});
