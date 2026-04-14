import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY;
const beamsInstanceId = process.env.PUSHER_BEAMS_INSTANCE_ID;
const beamsSecretKey = process.env.PUSHER_BEAMS_SECRET_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export default async function handler(req: any, res: any) {
  // Opcional: Validar chave de autorização do CRON para segurança
  // const authHeader = req.headers.authorization;
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).end();

  try {
    console.log("--- STARTING NOTIFICATION CRON ---");

    // 1. Calcular a data de amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    // 2. Buscar eventos agendados para amanhã que não estão completos
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*, pets(name, owner_id)')
      .eq('date', dateStr)
      .eq('completed', false);

    if (eventsError) throw eventsError;
    if (!events || events.length === 0) {
      return res.status(200).json({ status: 'success', message: 'No events for tomorrow' });
    }

    // 3. Buscar templates de notificação
    const { data: settings } = await supabase.from('system_settings').select('*');
    const pushTemplate = settings?.find(s => s.key === 'push_appointment_body')?.value || 'Lembrete: Agendamento para amanhã para {{petName}}!';
    const emailSubject = settings?.find(s => s.key === 'email_appointment_subject')?.value || 'Lembrete de Agendamento 🐾';
    const emailBodyTemplate = settings?.find(s => s.key === 'email_appointment_body')?.value || 'Olá! Amanhã o {{petName}} tem um(a) {{eventTitle}} agendado.';

    // 4. Processar cada evento
    const results = [];
    for (const event of events) {
      const pet = (event as any).pets;
      const ownerId = pet?.owner_id;
      const petName = pet?.name;

      if (!ownerId) continue;

      // Buscar preferências do dono
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, push_enabled, email_enabled')
        .eq('id', ownerId)
        .single();

      if (!profile) continue;

      // DISPARAR PUSH
      if (profile.push_enabled !== false && beamsInstanceId && beamsSecretKey) {
        const pushMessage = pushTemplate
          .replace('{{petName}}', petName)
          .replace('{{eventTitle}}', event.title);

        try {
            await fetch(`https://${beamsInstanceId}.pushnotifications.pusher.com/publish_api/v1/instances/${beamsInstanceId}/publishes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${beamsSecretKey}`
                },
                body: JSON.stringify({
                    interests: [`user-${ownerId}`], // Notifica o canal do usuário
                    web: {
                        notification: {
                            title: 'Lembrete MyPetCare',
                            body: pushMessage,
                            deep_link: 'https://app.vidacare.site/agenda',
                            icon: 'https://app.vidacare.site/logo192.png'
                        }
                    }
                })
            });
            console.log(`Push sent to user ${ownerId}`);
        } catch (e) {
            console.error("Push error:", e);
        }
      }

      // DISPARAR E-MAIL
      if (profile.email_enabled !== false && resend && profile.email) {
        const emailMsg = emailBodyTemplate
          .replace('{{petName}}', petName)
          .replace('{{eventTitle}}', event.title);

        try {
            await resend.emails.send({
                from: 'MyPetCare <contato@vidacare.site>',
                to: [profile.email],
                subject: emailSubject,
                html: `<div style="font-family: sans-serif; padding: 20px;">${emailMsg}</div>`
            });
            console.log(`Email sent to ${profile.email}`);
        } catch (e) {
            console.error("Email error:", e);
        }
      }
      
      results.push({ eventId: event.id, user: ownerId });
    }

    return res.status(200).json({ 
        status: 'success', 
        processed: results.length,
        date: dateStr 
    });

  } catch (error: any) {
    console.error("CRON ERROR:", error.message);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
