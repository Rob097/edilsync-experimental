import { createClient } from '@supabase/supabase-js';

let browserClient;
let serverClient;

const readPublicEnv = (name) => {
  const viteEnv = import.meta.env ?? {};
  const runtimeEnv = typeof process !== 'undefined' ? process.env ?? {} : {};
  return viteEnv[name] || runtimeEnv[name] || '';
};

export function getPublicSupabaseClient() {
  const supabaseUrl = readPublicEnv('VITE_SUPABASE_URL');
  const supabaseAnonKey = readPublicEnv('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  }

  if (typeof window !== 'undefined') {
    browserClient ??= createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    return browserClient;
  }

  serverClient ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return serverClient;
}