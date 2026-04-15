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

// ─── Eventos de Aprovação ─────────────────────────────────────────────
const APPROVAL_EVENTS = [
  'purchase_approved',
  'purchase_completed',
  'purchase_complete',
  'first_access',
  'subscription_renewal_approved',
];

// ─── Eventos de Bloqueio ──────────────────────────────────────────────
const BLOCK_EVENTS = [
  'purchase_canceled',
  'purchase_refunded',
  'purchase_chargeback',
  'subscription_cancellation',
  'refund',
  'chargeback',
];

// ─── Email de Boas-Vindas (Resend REST) ───────────────────────────────
async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resendApiKey) {
    console.warn('[webhook/email] RESEND_API_KEY not set — skipping welcome email.');
    return;
  }

  const subject = 'Seu acesso ao MyPet Care foi liberado 🐾';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);padding:40px 40px 30px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MYPET CARE APP</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">Cuidado inteligente para o seu pet</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:700;">Olá ${name || 'Tutor'},</h2>
            <p style="margin:0 0 12px;color:#4a4a4a;font-size:16px;line-height:1.6;">Sua assinatura foi confirmada!<br>Seu acesso está liberado.</p>
            <p style="margin:0 0 32px;color:#4a4a4a;font-size:16px;line-height:1.6;">Acesse agora:<br><a href="https://app.vidacare.site" style="color:#0d9488;font-weight:700;">https://app.vidacare.site</a></p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:16px;border:1px solid #ccfbf1;margin-bottom:32px;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Seu email de acesso</p>
                <p style="margin:0;color:#1a1a1a;font-size:18px;font-weight:700;">${email}</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="https://app.vidacare.site" style="display:inline-block;background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:16px;font-size:18px;font-weight:800;letter-spacing:-0.3px;box-shadow:0 4px 16px rgba(13,148,136,0.3);">Acessar MyPet Care Agora</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;font-weight:600;">Equipe MyPet Care</p>
            <p style="margin:6px 0 0;color:#d1d5db;font-size:11px;">Este é um email automático. Não responda a esta mensagem.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [email], subject, html }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[webhook/email] Resend API error:', err);
    } else {
      console.log(`[webhook/email] Welcome email sent to ${email}`);
    }
  } catch (error) {
    console.error('[webhook/email] Failed to send welcome email:', error);
  }
}

// ─── Handler Principal ────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = req.body;
    const headers = req.headers;

    // 1. Validar Token de Segurança
    const receivedToken = headers['x-hotmart-token'];
    if (hotmartSecret && receivedToken !== hotmartSecret) {
      console.warn('[webhook] Invalid Hotmart token received.');
      return res.status(200).json({ status: 'error', message: 'Invalid token' });
    }

    // 2. Extração do payload Hotmart
    const event = (body.event || '').toLowerCase().trim();
    const buyerEmail = body.data?.buyer?.email;
    const buyerName = body.data?.buyer?.name;
    const transactionId = body.data?.purchase?.transaction;
    const priceValue = body.data?.purchase?.price?.value;
    const priceCurrency = body.data?.purchase?.price?.currency_code;

    if (!buyerEmail) {
      return res.status(200).json({ status: 'ignored', message: 'No buyer email' });
    }
    const normalizedEmail = buyerEmail.toLowerCase().trim();

    // 3. Classificar evento
    const isApproval = APPROVAL_EVENTS.includes(event);
    const isBlock = BLOCK_EVENTS.includes(event);

    console.log(`[webhook] Event: "${event}" | Email: ${normalizedEmail} | Approval: ${isApproval} | Block: ${isBlock}`);

    // 4. Log do evento no Supabase
    try {
      await supabase.from('hotmart_events').insert([{
        event_type: event,
        buyer_email: normalizedEmail,
        buyer_name: buyerName,
        transaction_id: transactionId,
        price_value: priceValue,
        price_currency: priceCurrency,
        status: event,
        payload: body
      }]);
    } catch (logErr) {
      console.error('[webhook] Failed to log event:', logErr);
    }

    // 5. Processamento do Usuário
    let userId = null;
    const { data: authData } = await supabase.auth.admin.getUserByEmail(normalizedEmail);

    if (isApproval) {
      // ── COMPRA APROVADA / COMPLETA / PRIMEIRO ACESSO ──
      if (authData?.user) {
        // Usuário já existe: ativar
        userId = authData.user.id;
        await supabase.from('profiles').update({
          active: true,
          name: buyerName || undefined
        }).eq('id', userId);

        console.log(`[webhook] Existing user activated: ${normalizedEmail}`);

        // Enviar email mesmo para reativações
        await sendWelcomeEmail(normalizedEmail, buyerName || '');

      } else {
        // Criar novo usuário
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password: TUTOR_DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: { name: buyerName || '' }
        });

        if (createError) {
          console.error('[webhook] Failed to create user:', createError);
        } else if (newUser.user) {
          userId = newUser.user.id;

          await supabase.from('profiles').upsert({
            id: userId,
            email: normalizedEmail,
            name: buyerName || '',
            active: true,
            role: 'user'
          });

          console.log(`[webhook] New user created: ${normalizedEmail}`);

          // Enviar email de boas-vindas
          await sendWelcomeEmail(normalizedEmail, buyerName || '');
        }
      }

    } else if (isBlock) {
      // ── CANCELAMENTO / REEMBOLSO / CHARGEBACK ──
      if (authData?.user) {
        userId = authData.user.id;
        await supabase.from('profiles').update({ active: false }).eq('id', userId);
        console.log(`[webhook] User blocked: ${normalizedEmail}`);
      } else {
        console.log(`[webhook] Block event for unknown user: ${normalizedEmail}`);
      }

    } else {
      console.log(`[webhook] Unhandled event type: "${event}" — ignoring.`);
    }

    return res.status(200).json({
      status: 'success',
      email: normalizedEmail,
      event,
      action: isApproval ? 'activated' : isBlock ? 'blocked' : 'ignored'
    });

  } catch (error: any) {
    console.error('[webhook] CRITICAL ERROR:', error.message);
    return res.status(200).json({ status: 'error', message: error.message });
  }
}
