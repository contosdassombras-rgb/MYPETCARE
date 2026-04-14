import { createClient } from '@supabase/supabase-js';

// IMPORTANT: On Vercel serverless functions, VITE_ prefixed variables are NOT available.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TUTOR_DEFAULT_PASSWORD = 'mypetcare@2024';

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Server configuration error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
    });
  }

  try {
    const { email, password, name, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Se for role 'user', usa a senha padrão se nenhuma for fornecida
    const passToUse = password || (role === 'admin' ? null : TUTOR_DEFAULT_PASSWORD);
    
    if (!passToUse) {
      return res.status(400).json({ error: 'Password is required for admin role' });
    }

    // 1. Criar ou Atualizar usuário no Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: passToUse,
      email_confirm: true,
      user_metadata: { name: name || 'Novo Usuário', role: role || 'user' },
    });

    // Se o usuário já existir, authError.status será 422 ou similar. 
    // Em produção, talvez queiramos apenas atualizar o perfil.
    if (authError) {
        // Apenas atualizar o perfil e FORÇAR SENHA se o usuário já existir
        const { data: existingUser } = await adminSupabase.auth.admin.getUserByEmail(email);
        if (existingUser?.user) {
          // Forçamos a atualização da senha no Auth para o caso de dessincronização
          const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
            existingUser.user.id, 
            { password: passToUse }
          );
          
          if (authUpdateError) console.warn('[create-user] Auth update warning:', authUpdateError.message);

          const { error: profileError } = await adminSupabase
            .from('profiles')
            .upsert({
              id: existingUser.user.id,
              email: email, 
              name: name || undefined,
              role: role || undefined,
              active: true,
            }, { onConflict: 'id' });
          
          if (profileError) throw profileError;
          return res.status(200).json({ success: true, message: 'Existing user account synced and password updated', user: existingUser.user });
        }
      }
      throw authError;
    }

    if (!authData.user) throw new Error('User was not created');

    // 2. Upsert profile
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email, // E-mail agora é salvo na tabela profiles para facilitar buscas
        name: name || 'Novo Usuário',
        role: role || 'user',
        active: true,
      }, { onConflict: 'id' });

    if (profileError) console.warn('[create-user] Profile upsert warning:', profileError.message);

    return res.status(200).json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error('[create-user] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
