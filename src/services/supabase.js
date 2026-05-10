import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('Please ensure you have a .env file with:');
  console.error('VITE_SUPABASE_URL=your_supabase_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'osos-app-auth-token-v5',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Removed flowType: 'pkce' — not needed for email/password auth and causes delays
  },
  db: {
    schema: 'public'
  }
});
