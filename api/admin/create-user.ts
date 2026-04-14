import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 1. Criar usuário no Auth (Admin)
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role }
    });

    if (authError) throw authError;

    // 2. Opcional: Atualizar perfil se o trigger não tiver funcionado
    if (authUser.user) {
      await supabase
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          email,
          name: name || 'Novo Usuário',
          role: role || 'user',
          active: true
        });
    }

    return res.status(200).json({ success: true, user: authUser.user });
  } catch (error: any) {
    console.error("CREATE USER ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
