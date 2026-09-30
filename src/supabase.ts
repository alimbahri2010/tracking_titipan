import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://ufijefljrtejbvwrunlz.supabase.co';
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3YwOr5bgqUKwercFSzBZsQ_FLeA_bYU';

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn('Supabase URL or Publishable Key is missing from environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabasePublishableKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
