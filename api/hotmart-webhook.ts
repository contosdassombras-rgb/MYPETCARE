import { createClient } from '@supabase/supabase-js';

// ─── Configuração ─────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const hotmartSecret = process.env.HOTMART_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;

const TUTOR_DEFAULT_PASSWORD = 'mypetcare@2024';
const FROM_ADDRESS = 'MyPet Care <contato@vidacare.site>';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── Eventos ──────────────────────────────────────────────────────────
const APPROVAL_EVENTS = [
  'purchase_approved',
  'purchase_completed',
  'purchase_complete',
  'first_access',
  'subscription_renewal_approved',
];

const BLOCK_EVENTS = [
  'purchase_canceled',
  'purchase_refunded',
  'purchase_chargeback',
  'subscription_cancellation',
  'refund',
  'chargeback',
];

// ─── Email ────────────────────────────────────────────────────────────
async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY não configurada');
    return;
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        subject: 'Seu acesso ao MyPet Care foi liberado 🐾',
        html: `
        <h1>MyPet Care</h1>
        <p>Olá ${name || 'Tutor'},</p>
        <p>Seu acesso foi liberado!</p>
        <p><a href="https://app.vidacare.site">Acessar agora</a></p>
        <p>Email: ${email}</p>
        `,
      }),
    });

    console.log("EMAIL ENVIADO:", email);

  } catch (error) {
    console.error("ERRO EMAIL:", error);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log("🔥 WEBHOOK RECEBIDO");

    const body = req.body;
    const headers = req.headers;

    console.log("BODY:", JSON.stringify(body));

    // Token (opcional)
    const receivedToken = headers['x-hotmart-token'];
    if (hotmartSecret && receivedToken !== hotmartSecret) {
      console.warn("TOKEN INVALIDO");
      return res.status(200).json({ status: 'invalid token' });
    }

    // Evento
    const event = (body.event || '').toLowerCase().replace(/\s/g, '_').trim();

    // EMAIL (corrigido completo)
    const buyerEmail =
      body.data?.buyer?.email ||
      body.data?.purchase?.buyer?.email ||
      body.data?.subscriber?.email ||
      body.data?.user?.email;

    const buyerName =
      body.data?.buyer?.name ||
      body.data?.purchase?.buyer?.name ||
      body.data?.subscriber?.name ||
      body.data?.user?.name;

    console.log("EVENTO:", event);
    console.log("EMAIL:", buyerEmail);
    console.log("NOME:", buyerName);

    if (!buyerEmail) {
      console.log("SEM EMAIL - IGNORADO");
      return res.status(200).json({ status: 'no email' });
    }

    const email = buyerEmail.toLowerCase().trim();

    const isApproval = APPROVAL_EVENTS.includes(event);
    const isBlock = BLOCK_EVENTS.includes(event);

    // ─── USUÁRIO ─────────────────────────────────

    const { data: authData } = await supabase.auth.admin.getUserByEmail(email);

    if (isApproval) {

      if (authData?.user) {
        await supabase.from('profiles').update({
          active: true,
          name: buyerName || undefined
        }).eq('id', authData.user.id);

        console.log("USUARIO ATIVADO:", email);

        await sendWelcomeEmail(email, buyerName || '');

      } else {

        const { data: newUser, error } = await supabase.auth.admin.createUser({
          email,
          password: TUTOR_DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { name: buyerName || '' }
        });

        if (error) {
          console.error("ERRO CRIAR USER:", error);
        } else {
          await supabase.from('profiles').upsert({
            id: newUser.user.id,
            email,
            name: buyerName || '',
            active: true,
            role: 'user'
          });

          console.log("USUARIO CRIADO:", email);

          await sendWelcomeEmail(email, buyerName || '');
        }
      }

    } else if (isBlock) {

      if (authData?.user) {
        await supabase.from('profiles').update({
          active: false
        }).eq('id', authData.user.id);

        console.log("USUARIO BLOQUEADO:", email);
      }

    } else {
      console.log("EVENTO IGNORADO:", event);
    }

    return res.status(200).json({
      status: 'ok',
      event,
      email
    });

  } catch (error: any) {
    console.error("ERRO GERAL:", error);
    return res.status(200).json({ error: error.message });
  }
}