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

type Lang = 'pt' | 'en' | 'es';

// ─── Helpers ──────────────────────────────────────────────────────────
async function sendRaw(to: string, subject: string, html: string): Promise<void> {
  console.log(`[email] Requesting delivery to: ${to} via Internal Proxy`);

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[email] Proxy delivery failed:', err);
      return;
    }

    console.log(`[email] Proxy accepted delivery for "${subject}" to ${to}`);
  } catch (error) {
    console.error('[email] Failed to call email proxy:', error);
  }
}

// ─── Templates Multi-Idioma ───────────────────────────────────────────

/**
 * Email de boas-vindas após compra aprovada na Hotmart.
 */
export async function sendWelcomeEmail(email: string, name: string, lang: Lang = 'pt'): Promise<void> {
  console.log(`[EMAIL] Idioma selecionado: ${lang}`);
  console.log(`[EMAIL] Tipo: welcome`);

  const t = {
    pt: {
      subject: 'Seu acesso ao MyPet Care foi liberado 🐾',
      subtitle: 'Cuidado inteligente para o seu pet',
      greeting: `Olá ${name || 'Tutor'},`,
      confirmed: 'Sua assinatura foi confirmada!',
      accessGranted: 'Seu acesso está liberado.',
      accessNow: 'Acesse agora:',
      loginEmail: 'Seu email de acesso',
      cta: 'Acessar MyPet Care Agora',
      footer: 'Equipe MyPet Care',
      autoEmail: 'Este é um email automático. Não responda a esta mensagem.',
    },
    en: {
      subject: 'Your access to MyPet Care has been granted 🐾',
      subtitle: 'Smart care for your pet',
      greeting: `Hello ${name || 'Tutor'},`,
      confirmed: 'Your subscription has been confirmed!',
      accessGranted: 'Your access has been granted.',
      accessNow: 'Access now:',
      loginEmail: 'Your login email',
      cta: 'Access MyPet Care Now',
      footer: 'MyPet Care Team',
      autoEmail: 'This is an automated email. Please do not reply.',
    },
    es: {
      subject: 'Tu acceso a MyPet Care ha sido liberado 🐾',
      subtitle: 'Cuidado inteligente para tu mascota',
      greeting: `Hola ${name || 'Tutor'},`,
      confirmed: '¡Tu suscripción ha sido confirmada!',
      accessGranted: 'Tu acceso ha sido liberado.',
      accessNow: 'Accede ahora:',
      loginEmail: 'Tu correo de acceso',
      cta: 'Acceder a MyPet Care Ahora',
      footer: 'Equipo MyPet Care',
      autoEmail: 'Este es un correo automático. No responda a este mensaje.',
    },
  };

  const s = t[lang];
  const subject = s.subject;

  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);padding:40px 40px 30px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MYPET CARE APP</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:500;">${s.subtitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:700;">${s.greeting}</h2>
            <p style="margin:0 0 12px;color:#4a4a4a;font-size:16px;line-height:1.6;">${s.confirmed}<br>${s.accessGranted}</p>
            <p style="margin:0 0 32px;color:#4a4a4a;font-size:16px;line-height:1.6;">${s.accessNow}<br><a href="https://app.vidacare.site" style="color:#0d9488;font-weight:700;">https://app.vidacare.site</a></p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:16px;border:1px solid #ccfbf1;margin-bottom:32px;">
              <tr><td style="padding:24px;">
                <p style="margin:0 0 8px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">${s.loginEmail}</p>
                <p style="margin:0;color:#1a1a1a;font-size:18px;font-weight:700;">${email}</p>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="https://app.vidacare.site" style="display:inline-block;background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#ffffff;text-decoration:none;padding:18px 48px;border-radius:16px;font-size:18px;font-weight:800;letter-spacing:-0.3px;box-shadow:0 4px 16px rgba(13,148,136,0.3);">${s.cta}</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;font-weight:600;">${s.footer}</p>
            <p style="margin:6px 0 0;color:#d1d5db;font-size:11px;">${s.autoEmail}</p>
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
 * Email de confirmação de agendamento — Multi-Idioma.
 */
export async function sendAppointmentEmail(
  email: string,
  nome: string,
  pet: string,
  data: string,
  tipo: string,
  lang: Lang = 'pt'
): Promise<void> {
  console.log(`[EMAIL] Idioma selecionado: ${lang}`);
  console.log(`[EMAIL] Tipo: appointment`);

  const tipoLabels: Record<string, Record<string, string>> = {
    pt: { vaccine: '💉 Vacina', medication: '💊 Medicamento', appointment: '🩺 Consulta', special_care: '❤️ Cuidado Especial' },
    en: { vaccine: '💉 Vaccine', medication: '💊 Medication', appointment: '🩺 Appointment', special_care: '❤️ Special Care' },
    es: { vaccine: '💉 Vacuna', medication: '💊 Medicamento', appointment: '🩺 Cita', special_care: '❤️ Cuidado Especial' },
  };

  const t = {
    pt: {
      subject: `Agendamento confirmado: ${pet} 🗓️`,
      greeting: `Olá ${nome || 'Tutor'},`,
      body: 'Seu agendamento foi registrado com sucesso no MyPet Care!',
      labelPet: 'Pet',
      labelType: 'Tipo',
      labelDate: 'Data',
      cta: 'Ver Agenda',
      footer: 'Equipe MyPet Care',
      autoEmail: 'Este é um email automático. Não responda a esta mensagem.',
    },
    en: {
      subject: `Appointment confirmed: ${pet} 🗓️`,
      greeting: `Hello ${nome || 'Tutor'},`,
      body: 'Your appointment has been successfully registered on MyPet Care!',
      labelPet: 'Pet',
      labelType: 'Type',
      labelDate: 'Date',
      cta: 'View Agenda',
      footer: 'MyPet Care Team',
      autoEmail: 'This is an automated email. Please do not reply.',
    },
    es: {
      subject: `Cita confirmada: ${pet} 🗓️`,
      greeting: `Hola ${nome || 'Tutor'},`,
      body: '¡Tu cita ha sido registrada con éxito en MyPet Care!',
      labelPet: 'Mascota',
      labelType: 'Tipo',
      labelDate: 'Fecha',
      cta: 'Ver Agenda',
      footer: 'Equipo MyPet Care',
      autoEmail: 'Este es un correo automático. No responda a este mensaje.',
    },
  };

  const s = t[lang];
  const tipoLabel = tipoLabels[lang]?.[tipo] || tipo;

  const html = `
<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">MYPET CARE APP</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:22px;font-weight:700;">${s.greeting}</h2>
            <p style="margin:0 0 24px;color:#4a4a4a;font-size:16px;line-height:1.6;">${s.body}</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdfa;border-radius:16px;border:1px solid #ccfbf1;margin-bottom:32px;">
              <tr><td style="padding:24px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;width:100px;">${s.labelPet}</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:15px;font-weight:700;">${pet}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">${s.labelType}</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:15px;font-weight:700;">${tipoLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;">${s.labelDate}</td>
                    <td style="padding:8px 0;color:#1a1a1a;font-size:15px;font-weight:700;">${data}</td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center">
                <a href="https://app.vidacare.site/agenda" style="display:inline-block;background:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:16px;font-size:16px;font-weight:800;box-shadow:0 4px 16px rgba(13,148,136,0.3);">${s.cta}</a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;font-weight:600;">${s.footer}</p>
            <p style="margin:6px 0 0;color:#d1d5db;font-size:11px;">${s.autoEmail}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendRaw(email, s.subject, html);
}
