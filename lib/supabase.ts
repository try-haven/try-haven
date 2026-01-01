import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a function to check env vars only when actually needed (not during build)
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Only throw at runtime, not during build/import
    if (typeof window !== 'undefined') {
      console.error('[Supabase] ❌ Missing environment variables! Using placeholder client.');
      throw new Error('Missing Supabase environment variables');
    }
    // During build, use placeholder values
    return createClient(
      'https://placeholder.supabase.co',
      'placeholder-anon-key',
      {
        auth: {
          persistSession: true,
          storageKey: 'haven-auth-token',
        }
      }
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'haven-auth-token',
      autoRefreshToken: true,
      detectSessionInUrl: false, // Disable to prevent navigation issues on static sites
    }
  });
}

export const supabase = getSupabaseClient();
