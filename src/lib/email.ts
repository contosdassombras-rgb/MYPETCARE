/**
 * Email Service — Resend Integration
 * Módulo centralizado de envio de emails para o MyPetCare.
 * Usa a API REST do Resend para máxima compatibilidade (frontend + serverless).
 */

const RESEND_API_KEY =
  typeof process !== 'undefined' && process.env?.RESEND_API_KEY
    ? process.env.RESEND_API_KEY
    : typeof import.meta !== 'undefined'
      ? (import.meta as any).env?.VITE_RESEND_API_KEY
      : undefined;

const FROM_ADDRESS = 'MyPet Care <contato@vidacare.site>';

// ─── Helpers ──────────────────────────────────────────────────────────
async function sendRaw(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('[email] Resend API key not configured — email skipped.');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[email] Resend API error:', err);
      return;
    }

    console.log(`[email] Sent "${subject}" to ${to}`);
  } catch (error) {
    console.error('[email] Failed to send email:', error);
    // Nunca quebra o fluxo
  }
}

// ─── Templates ────────────────────────────────────────────────────────

/**
 * Email de boas-vindas após compra aprovada na Hotmart.
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const subject = 'Seu acesso ao MyPet Care foi liberado 🐾';

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);padding:40px 40px 30px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
              MYPET CARE APP
            </h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">
              Cuidado inteligente para o seu pet
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:700;">
              Olá ${name || 'Tutor'},
            </h2>
            <p style="margin:0 0 12px;color:#4a4a4a;font-size:16px;line-height:1.6;">
              Sua assinatura foi confirmada!<br>
              Seu acesso está liberado.
            </p>
            <p style="margin:0 0 32px;color:#4a4a4a;font-size:16px;line-height:1.6;">
              Acesse agora:<br>
              <a href="https://app.vidacare.site" style="color:#0d9488;font-weight:700;">https://app.vidacare.site</a>
            </p>

            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:16px;border:1px solid #ccfbf1;margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
                    Seu email de acesso
                  </p>
                  <p style="margin:0;color:#1a1a1a;font-size:18px;font-weight:700;">
                    ${email}
                  </p>
                </td>
              </tr>
            </table>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="https://app.vidacare.site" style="display:inline-block;background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:16px;font-size:18px;font-weight:800;letter-spacing:-0.3px;box-shadow:0 4px 16px rgba(13,148,136,0.3);">
                  Acessar MyPet Care Agora
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;font-weight:600;">
              Equipe MyPet Care
            </p>
            <p style="margin:6px 0 0;color:#d1d5db;font-size:11px;">
              Este é um email automático. Não responda a esta mensagem.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendRaw(email, subject, html);
}

/**
 * Email de confirmação de agendamento.
 */
export async function sendAppointmentEmail(
  email: string,
  nome: string,
  pet: string,
  data: string,
  tipo: string
): Promise<void> {
  const subject = `Agendamento confirmado: ${pet} 🗓️`;

  const tipoLabel: Record<string, string> = {
    vaccine: '💉 Vacina',
    medication: '💊 Medicamento',
    appointment: '🩺 Consulta',
    special_care: '❤️ Cuidado Especial',
  };

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
              MYPET CARE APP
            </h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:700;">
              Olá ${nome || 'Tutor'},
            </h2>
            <p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;line-height:1.6;">
              Seu agendamento foi registrado com sucesso no MyPet Care!
            </p>

            <!-- Event details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:16px;border:1px solid #ccfbf1;margin-bottom:32px;">
              <tr>
                <td style="padding:24px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;width:100px;">Pet</td>
                      <td style="padding:8px 0;color:#1a1a1a;font-size:15px;font-weight:700;">${pet}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">Tipo</td>
                      <td style="padding:8px 0;color:#1a1a1a;font-size:15px;font-weight:700;">${tipoLabel[tipo] || tipo}</td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">Data</td>
                      <td style="padding:8px 0;color:#1a1a1a;font-size:15px;font-weight:700;">${data}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="https://app.vidacare.site/agenda" style="display:inline-block;background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:16px;font-size:16px;font-weight:800;box-shadow:0 4px 16px rgba(13,148,136,0.3);">
                  Ver Agenda
                </a>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;font-weight:600;">
              Equipe MyPet Care
            </p>
            <p style="margin:6px 0 0;color:#d1d5db;font-size:11px;">
              Este é um email automático. Não responda a esta mensagem.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendRaw(email, subject, html);
}
