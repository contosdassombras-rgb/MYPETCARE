import { createClient } from '@supabase/supabase-js';

// Suporte para Vite (import.meta.env) e Next.js/Node (process.env)
const supabaseUrl = 
  import.meta.env?.VITE_SUPABASE_URL || 
  process.env?.NEXT_PUBLIC_SUPABASE_URL || 
  process.env?.SUPABASE_URL;

const supabaseAnonKey = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing in environment variables (.env)');
}

export const supabase = createClient(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);
