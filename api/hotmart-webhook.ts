import { createClient } from '@supabase/supabase-js';

// ─── ENV ─────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const hotmartSecret = process.env.HOTMART_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── EMAIL ───────────────────────────────────
async function sendWelcomeEmail(email: string, name: string) {
  if (!resendApiKey) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'MyPet Care <contato@vidacare.site>',
      to: [email],
      subject: 'Seu acesso ao MyPet Care foi liberado 🐾',
      html: `
        <h1>MyPet Care</h1>
        <p>Olá ${name || 'Tutor'},</p>
        <p>Seu acesso foi liberado!</p>
        <a href="https://app.vidacare.site">Acessar agora</a>
      `,
    }),
  });
}

// ─── EVENTOS ─────────────────────────────────
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
];

// ─── HANDLER ─────────────────────────────────
export default async function handler(req: any, res: any) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    console.log("🔥 WEBHOOK RECEBIDO");
    console.log("BODY:", JSON.stringify(body));

    // 🔐 VALIDAÇÃO PROFISSIONAL HOTMART
    const hottok = body?.hottok;

    if (!hottok || hottok !== hotmartSecret) {
      console.warn("❌ HOTMART TOKEN INVALIDO");
      return res.status(200).json({ status: 'invalid hottok' });
    }

    console.log("✅ HOTMART VALIDADO");

    const event = (body.event || '').toLowerCase().replace(/\s/g, '_').trim();

    const email =
      body.data?.buyer?.email ||
      body.data?.purchase?.buyer?.email ||
      body.data?.subscriber?.email;

    const name =
      body.data?.buyer?.name ||
      body.data?.purchase?.buyer?.name ||
      body.data?.subscriber?.name;

    console.log("EVENT:", event);
    console.log("EMAIL:", email);

    if (!email) {
      return res.status(200).json({ status: 'no email' });
    }

    const { data: user } = await supabase.auth.admin.getUserByEmail(email);

    // ─── APROVAÇÃO ─────────────────────
    if (APPROVAL_EVENTS.includes(event)) {

      if (user?.user) {

        await supabase.from('profiles')
          .update({ active: true })
          .eq('id', user.user.id);

        console.log("ATIVADO:", email);

      } else {

        const { data: newUser } = await supabase.auth.admin.createUser({
          email,
          password: '12345678',
          email_confirm: true
        });

        await supabase.from('profiles').insert({
          id: newUser.user.id,
          email,
          name,
          role: 'user',
          active: true
        });

        console.log("CRIADO:", email);
      }

      await sendWelcomeEmail(email, name || '');

    }

    // ─── BLOQUEIO ─────────────────────
    if (BLOCK_EVENTS.includes(event)) {

      if (user?.user) {
        await supabase.from('profiles')
          .update({ active: false })
          .eq('id', user.user.id);

        console.log("BLOQUEADO:", email);
      }

    }

    return res.status(200).json({ ok: true });

  } catch (err: any) {
    console.error("ERRO:", err);
    return res.status(200).json({ error: err.message });
  }
}