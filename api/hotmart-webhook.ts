import { createClient } from '@supabase/supabase-js';

// ─── Configuração ─────────────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const hotmartSecret = process.env.HOTMART_SECRET || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

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
];

// ─── Email de Boas-Vindas ─────────────────────────────────────────────
async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (!resendApiKey) {
    console.log('[WEBHOOK] RESEND_API_KEY não configurada — email ignorado.');
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
          <td style="background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);padding:40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;">MYPET CARE APP</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Cuidado inteligente para o seu pet</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;">Olá ${name || 'Tutor'},</h2>
            <p style="color:#4a4a4a;font-size:16px;line-height:1.6;">Sua assinatura foi confirmada!<br>Seu acesso está liberado.</p>
            <p style="color:#4a4a4a;font-size:16px;line-height:1.6;">Acesse agora:<br><a href="https://app.vidacare.site" style="color:#0d9488;font-weight:700;">https://app.vidacare.site</a></p>
            <table width="100%" style="background:#f0fdfa;border-radius:16px;border:1px solid #ccfbf1;margin:24px 0;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;">Seu email de acesso</p>
                <p style="margin:0;color:#1a1a1a;font-size:18px;font-weight:700;">${email}</p>
              </td></tr>
            </table>
            <table width="100%"><tr><td align="center">
              <a href="https://app.vidacare.site" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#14b8a6);color:#fff;text-decoration:none;padding:18px 48px;border-radius:16px;font-size:18px;font-weight:800;box-shadow:0 4px 16px rgba(13,148,136,0.3);">Acessar MyPet Care Agora</a>
            </td></tr></table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;font-weight:600;">Equipe MyPet Care</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({ from: FROM_ADDRESS, to: [email], subject, html }),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error('[WEBHOOK] Erro Resend:', JSON.stringify(err));
    } else {
      console.log(`[WEBHOOK] EMAIL ENVIADO para ${email}`);
    }
  } catch (err) {
    console.error('[WEBHOOK] Falha ao enviar email:', err);
  }
}

// ─── Handler Principal ────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  console.log('========== WEBHOOK RECEBIDO ==========');

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ignored', message: 'Method not POST' });
  }

  try {
    const body = req.body || {};

    // 1. Token Hotmart — tolerante
    const hottok = body.hottok || '';
    console.log(`[WEBHOOK] HOTMART TOKEN RECEBIDO: "${hottok ? hottok.substring(0, 10) + '...' : 'NENHUM'}"`);

    if (hottok && hotmartSecret && hottok !== hotmartSecret) {
      console.warn('[WEBHOOK] Token Hotmart não confere, mas continuando execução...');
      // NÃO bloquear — apenas alertar
    }

    // 2. Extrair dados do payload
    const event = (body.event || '').toLowerCase().trim();
    const buyerEmail = body.data?.buyer?.email || '';
    const buyerName = body.data?.buyer?.name || '';
    const transactionId = body.data?.purchase?.transaction || '';

    console.log(`[WEBHOOK] EVENTO: "${event}"`);
    console.log(`[WEBHOOK] EMAIL: "${buyerEmail}"`);
    console.log(`[WEBHOOK] NOME: "${buyerName}"`);

    if (!buyerEmail) {
      console.log('[WEBHOOK] Sem email do comprador — ignorando.');
      return res.status(200).json({ status: 'ignored', message: 'No buyer email' });
    }

    const normalizedEmail = buyerEmail.toLowerCase().trim();

    // 3. Classificar evento
    const isApproval = APPROVAL_EVENTS.includes(event);
    const isBlock = BLOCK_EVENTS.includes(event);

    console.log(`[WEBHOOK] APROVAÇÃO: ${isApproval} | BLOQUEIO: ${isBlock}`);

    // 4. Log do evento no banco (não crítico)
    try {
      await supabase.from('hotmart_events').insert([{
        event_type: event,
        buyer_email: normalizedEmail,
        buyer_name: buyerName,
        transaction_id: transactionId,
        status: event,
        payload: body
      }]);
      console.log('[WEBHOOK] Evento salvo no banco.');
    } catch (logErr: any) {
      console.error('[WEBHOOK] Erro ao salvar log:', logErr?.message);
    }

    // 5. Buscar usuário EXISTENTE pela tabela profiles (NÃO usar auth.admin.getUserByEmail)
    let existingProfile: any = null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (error) {
        console.error('[WEBHOOK] Erro ao buscar profile:', error.message);
      } else {
        existingProfile = data;
      }
    } catch (err: any) {
      console.error('[WEBHOOK] Exceção ao buscar profile:', err?.message);
    }

    console.log(`[WEBHOOK] PERFIL EXISTENTE: ${existingProfile ? 'SIM (id: ' + existingProfile.id + ')' : 'NÃO'}`);

    // 6. Processar evento
    if (isApproval) {
      if (existingProfile) {
        // Usuário já existe → ativar
        try {
          await supabase
            .from('profiles')
            .update({ active: true, name: buyerName || existingProfile.name })
            .eq('id', existingProfile.id);
          console.log(`[WEBHOOK] USUARIO ATIVADO: ${normalizedEmail}`);
        } catch (err: any) {
          console.error('[WEBHOOK] Erro ao ativar usuário:', err?.message);
        }

        // Enviar email de boas-vindas mesmo na reativação
        await sendWelcomeEmail(normalizedEmail, buyerName || existingProfile.name || '');

      } else {
        // Usuário NÃO existe → criar via auth + inserir profile
        try {
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: normalizedEmail,
            password: TUTOR_DEFAULT_PASSWORD,
            email_confirm: true,
            user_metadata: { name: buyerName }
          });

          if (createError) {
            console.error('[WEBHOOK] Erro ao criar usuário no auth:', createError.message);
          } else if (newUser?.user) {
            const userId = newUser.user.id;

            await supabase.from('profiles').upsert({
              id: userId,
              email: normalizedEmail,
              name: buyerName || '',
              active: true,
              role: 'user'
            });

            console.log(`[WEBHOOK] USUARIO CRIADO: ${normalizedEmail} (id: ${userId})`);

            // Enviar email de boas-vindas
            await sendWelcomeEmail(normalizedEmail, buyerName || '');
          }
        } catch (err: any) {
          console.error('[WEBHOOK] Exceção ao criar usuário:', err?.message);
        }
      }

    } else if (isBlock) {
      if (existingProfile) {
        try {
          await supabase
            .from('profiles')
            .update({ active: false })
            .eq('id', existingProfile.id);
          console.log(`[WEBHOOK] USUARIO BLOQUEADO: ${normalizedEmail}`);
        } catch (err: any) {
          console.error('[WEBHOOK] Erro ao bloquear:', err?.message);
        }
      } else {
        console.log(`[WEBHOOK] Evento de bloqueio para usuário inexistente: ${normalizedEmail}`);
      }

    } else {
      console.log(`[WEBHOOK] Evento não mapeado: "${event}" — ignorado.`);
    }

    console.log('========== WEBHOOK FINALIZADO ==========');
    return res.status(200).json({
      status: 'success',
      email: normalizedEmail,
      event,
      action: isApproval ? 'activated' : isBlock ? 'blocked' : 'ignored'
    });

  } catch (error: any) {
    console.error('[WEBHOOK] ERRO CRITICO:', error?.message || error);
    return res.status(200).json({ status: 'error', message: error?.message || 'Unknown error' });
  }
}