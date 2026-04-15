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

// ─── Encontrar email recursivamente em qualquer objeto ────────────────
function findEmailInObject(obj: any, depth = 0): string {
  if (!obj || depth > 5) return '';
  if (typeof obj === 'string' && obj.includes('@') && obj.includes('.')) return obj;
  if (typeof obj !== 'object') return '';
  
  // Priorizar campos que costumam ter email
  const emailKeys = ['email', 'buyer_email', 'subscriber_email', 'user_email', 'contact_email'];
  for (const key of emailKeys) {
    if (obj[key] && typeof obj[key] === 'string' && obj[key].includes('@')) {
      return obj[key];
    }
  }
  
  // Buscar recursivamente
  for (const key of Object.keys(obj)) {
    const found = findEmailInObject(obj[key], depth + 1);
    if (found) return found;
  }
  return '';
}

// ─── Extrair email do payload (todos os formatos Hotmart) ─────────────
function extractBuyerEmail(body: any): string {
  // Formato Hotmart v2: data.subscriber.email
  if (body?.data?.subscriber?.email) return body.data.subscriber.email;
  // Formato Hotmart: data.buyer.email
  if (body?.data?.buyer?.email) return body.data.buyer.email;
  // Formato Hotmart: data.user.email
  if (body?.data?.user?.email) return body.data.user.email;
  // Formato flat: data.email
  if (body?.data?.email) return body.data.email;
  // Raiz: body.email
  if (body?.email) return body.email;
  // Legado
  if (body?.data?.buyer_email) return body.data.buyer_email;
  if (body?.buyer?.email) return body.buyer.email;
  if (body?.subscriber?.email) return body.subscriber.email;
  if (body?.user?.email) return body.user.email;
  
  // FALLBACK: busca recursiva por qualquer campo com email
  const found = findEmailInObject(body);
  if (found) return found;
  
  return '';
}

function extractBuyerName(body: any): string {
  if (body?.data?.subscriber?.name) return body.data.subscriber.name;
  if (body?.data?.buyer?.name) return body.data.buyer.name;
  if (body?.data?.user?.name) return body.data.user.name;
  if (body?.data?.buyer?.first_name) {
    const last = body.data.buyer.last_name || '';
    return `${body.data.buyer.first_name} ${last}`.trim();
  }
  if (body?.data?.name) return body.data.name;
  if (body?.data?.buyer_name) return body.data.buyer_name;
  if (body?.buyer?.name) return body.buyer.name;
  if (body?.subscriber?.name) return body.subscriber.name;
  if (body?.user?.name) return body.user.name;
  return '';
}

function extractEvent(body: any): string {
  const raw = body?.event || body?.data?.event || '';
  return raw.toLowerCase().trim();
}

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

// ─── Buscar ou criar usuário de forma robusta ─────────────────────────
async function ensureUser(email: string, name: string): Promise<string | null> {
  // 1. Tentar buscar na tabela profiles
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name, active')
      .eq('email', email)
      .maybeSingle();

    if (profile) {
      console.log(`[WEBHOOK] Perfil encontrado: id=${profile.id}`);
      return profile.id;
    }
  } catch (err: any) {
    console.error('[WEBHOOK] Erro ao buscar profile:', err?.message);
  }

  // 2. Não existe no profiles — tentar criar no auth
  try {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: TUTOR_DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name }
    });

    if (newUser?.user) {
      console.log(`[WEBHOOK] Usuário criado no auth: ${newUser.user.id}`);

      // Inserir profile
      await supabase.from('profiles').upsert({
        id: newUser.user.id,
        email,
        name: name || '',
        active: true,
        role: 'user'
      });

      return newUser.user.id;
    }

    if (createError) {
      console.warn(`[WEBHOOK] auth.admin.createUser falhou: ${createError.message}`);

      // Se erro é "user already exists" ou "Database error", tentar buscar pelo auth listUsers
      // Fallback: criar profile diretamente buscando pela API admin
      try {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existingAuthUser = listData?.users?.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );

        if (existingAuthUser) {
          console.log(`[WEBHOOK] Usuário já existe no auth: ${existingAuthUser.id} — inserindo profile.`);

          await supabase.from('profiles').upsert({
            id: existingAuthUser.id,
            email,
            name: name || '',
            active: true,
            role: 'user'
          });

          return existingAuthUser.id;
        }
      } catch (listErr: any) {
        console.error('[WEBHOOK] Erro ao listar usuários auth:', listErr?.message);
      }
    }
  } catch (err: any) {
    console.error('[WEBHOOK] Exceção ao criar usuário:', err?.message);
  }

  return null;
}

// ─── Handler Principal ────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  console.log('========== WEBHOOK RECEBIDO ==========');

  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ignored', message: 'Method not POST' });
  }

  try {
    const body = req.body || {};

    // LOG DO PAYLOAD COMPLETO (para debug)
    const payloadStr = JSON.stringify(body);
    console.log('[WEBHOOK] PAYLOAD COMPLETO:', payloadStr.substring(0, 2000));
    console.log('[WEBHOOK] PAYLOAD KEYS:', Object.keys(body).join(', '));
    if (body.data) {
      console.log('[WEBHOOK] DATA KEYS:', Object.keys(body.data).join(', '));
      if (body.data.subscriber) console.log('[WEBHOOK] SUBSCRIBER:', JSON.stringify(body.data.subscriber).substring(0, 300));
      if (body.data.buyer) console.log('[WEBHOOK] BUYER:', JSON.stringify(body.data.buyer).substring(0, 300));
      if (body.data.user) console.log('[WEBHOOK] USER:', JSON.stringify(body.data.user).substring(0, 300));
    }

    // 1. Token Hotmart — tolerante
    const hottok = body.hottok || '';
    if (hottok && hotmartSecret && hottok !== hotmartSecret) {
      console.warn('[WEBHOOK] Token Hotmart não confere — continuando mesmo assim.');
    } else if (!hottok) {
      console.log('[WEBHOOK] Nenhum hottok recebido — OK, continuando.');
    } else {
      console.log('[WEBHOOK] Token Hotmart válido.');
    }

    // 2. Extrair dados com fallbacks
    const event = extractEvent(body);
    const buyerEmail = extractBuyerEmail(body);
    const buyerName = extractBuyerName(body);

    console.log(`[WEBHOOK] EVENTO: "${event}"`);
    console.log(`[WEBHOOK] EMAIL EXTRAIDO: "${buyerEmail}"`);
    console.log(`[WEBHOOK] NOME EXTRAIDO: "${buyerName}"`);

    if (!buyerEmail) {
      console.log('[WEBHOOK] Sem email do comprador — ignorando.');
      console.log('[WEBHOOK] Payload completo para debug:', JSON.stringify(body).substring(0, 500));
      return res.status(200).json({ status: 'ignored', message: 'No buyer email found in payload' });
    }

    const normalizedEmail = buyerEmail.toLowerCase().trim();

    // 3. Classificar evento
    const isApproval = APPROVAL_EVENTS.includes(event);
    const isBlock = BLOCK_EVENTS.includes(event);

    console.log(`[WEBHOOK] CLASSIFICAÇÃO — Aprovação: ${isApproval} | Bloqueio: ${isBlock}`);

    // 4. Log do evento no banco (não crítico)
    try {
      await supabase.from('hotmart_events').insert([{
        event_type: event,
        buyer_email: normalizedEmail,
        buyer_name: buyerName,
        transaction_id: body.data?.purchase?.transaction || '',
        status: event,
        payload: body
      }]);
    } catch (logErr: any) {
      console.warn('[WEBHOOK] Log no banco falhou (não crítico):', logErr?.message);
    }

    // 5. Processar evento
    if (isApproval) {
      const userId = await ensureUser(normalizedEmail, buyerName);

      if (userId) {
        // Garantir que está ativo
        await supabase
          .from('profiles')
          .update({ active: true, name: buyerName || undefined })
          .eq('id', userId);

        console.log(`[WEBHOOK] USUARIO ATIVADO: ${normalizedEmail}`);

        // Enviar email de boas-vindas
        await sendWelcomeEmail(normalizedEmail, buyerName);
      } else {
        console.error(`[WEBHOOK] NÃO foi possível criar/encontrar usuário para: ${normalizedEmail}`);
      }

    } else if (isBlock) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (profile) {
          await supabase.from('profiles').update({ active: false }).eq('id', profile.id);
          console.log(`[WEBHOOK] USUARIO BLOQUEADO: ${normalizedEmail}`);
        } else {
          console.log(`[WEBHOOK] Bloqueio ignorado — usuário inexistente: ${normalizedEmail}`);
        }
      } catch (err: any) {
        console.error('[WEBHOOK] Erro ao bloquear:', err?.message);
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