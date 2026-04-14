import { createClient } from '@supabase/supabase-js';

// IMPORTANT: On Vercel serverless functions, VITE_ prefixed variables are NOT available.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const TUTOR_DEFAULT_PASSWORD = 'mypetcare@2024';

export default async function handler(req: any, res: any) {
  // Always set content type to JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({
      error: 'Configuração do servidor ausente: SUPABASE_URL ou SERVICE_ROLE_KEY não encontrados.',
    });
  }

  try {
    const { email, password, name, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório.' });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Se for role 'user', usa a senha padrão se nenhuma for fornecida
    const passToUse = password || (role === 'admin' ? null : TUTOR_DEFAULT_PASSWORD);
    
    if (!passToUse) {
      return res.status(400).json({ error: 'Senha é obrigatória para administradores.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verificar se usuário já existe (usando listUsers para maior compatibilidade)
    const { data: { users: allUsers }, error: listError } = await adminSupabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = allUsers.find(u => u.email?.toLowerCase() === normalizedEmail);

    if (existingUser) {
      // Se já existe, forçamos a sincronização da senha e perfil
      const { error: authUpdateError } = await adminSupabase.auth.admin.updateUserById(
        existingUser.id, 
        { password: passToUse }
      );
      
      if (authUpdateError) {
        console.warn('[create-user] Auth update warning:', authUpdateError.message);
      }

      const { error: profileError } = await adminSupabase
        .from('profiles')
        .upsert({
          id: existingUser.id,
          email: normalizedEmail, 
          name: name || undefined,
          role: role || undefined,
          active: true,
        }, { onConflict: 'id' });
      
      if (profileError) throw profileError;
      
      return res.status(200).json({ 
        success: true, 
        message: 'Conta sincronizada com sucesso.', 
        user: existingUser 
      });
    }

    // 2. Se não existe, criar novo usuário no Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: normalizedEmail,
      password: passToUse,
      email_confirm: true,
      user_metadata: { name: name || 'Novo Usuário', role: role || 'user' },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar usuário no Auth.');

    // 3. Criar profile
    const { error: profileError } = await adminSupabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: normalizedEmail,
        name: name || 'Novo Usuário',
        role: role || 'user',
        active: true,
      }, { onConflict: 'id' });

    if (profileError) {
      console.warn('[create-user] Profile upsert warning:', profileError.message);
    }

    return res.status(200).json({ success: true, user: authData.user });
  } catch (error: any) {
    console.error('[create-user] Error:', error.message);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}

