import { createClient } from '@supabase/supabase-js';

// IMPORTANT: On Vercel serverless functions, VITE_ prefixed variables are NOT available.
// These must be configured separately in the Vercel dashboard under "Environment Variables":
//   - SUPABASE_URL  (same value as VITE_SUPABASE_URL)
//   - SUPABASE_SERVICE_ROLE_KEY  (Service Role key from Supabase > Settings > API)
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[create-user] Missing Supabase credentials in environment variables.');
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic config check
  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Server configuration error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel Environment Variables.',
    });
  }

  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Criar usuário no Auth com Admin API
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || 'Novo Usuário', role: role || 'user' },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User was not created');

    // 2. Upsert profile — sem o campo "email" (não existe na tabela profiles)
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        name: name || 'Novo Usuário',
        role: role || 'user',
        active: true,
      }, { onConflict: 'id' });

    if (profileError) {
      // Log but don't fail — the auth user was created; the trigger may handle the profile
      console.warn('[create-user] Profile upsert warning:', profileError.message);
    }

    return res.status(200).json({ success: true, user: authData.user });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('[create-user] Error:', msg);
    return res.status(500).json({ error: msg });
  }
}
