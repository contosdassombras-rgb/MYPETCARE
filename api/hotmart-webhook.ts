import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const hotmartSecret = process.env.HOTMART_SECRET;
const resendApiKey = process.env.RESEND_API_KEY;

const TUTOR_DEFAULT_PASSWORD = 'mypetcare@2024';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
      return res.status(200).json({ status: 'error', message: 'Invalid token' });
    }

    // Extração do payload Hotmart
    const event = body.event;
    const buyerEmail = body.data?.buyer?.email;
    const buyerName = body.data?.buyer?.name;
    const transactionId = body.data?.purchase?.transaction;
    const priceValue = body.data?.purchase?.price?.value;
    const priceCurrency = body.data?.purchase?.price?.currency_code;

    if (!buyerEmail) {
      return res.status(200).json({ status: 'ignored', message: 'No email' });
    }
    const normalizedEmail = buyerEmail.toLowerCase().trim();

    // 2. Mapeamento de Status
    let isActive = false;
    const status = (event || '').toLowerCase();
    if (['purchase_approved', 'purchase_completed', 'subscription_renewal_approved'].includes(status)) {
      isActive = true;
    } 

    // 3. Log do evento
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

    // 4. Garantir Usuário no Auth e Profile
    let userId = null;
    const { data: authData } = await supabase.auth.admin.getUserByEmail(normalizedEmail);

    if (authData?.user) {
      userId = authData.user.id;
      // Atualiza status ativo
      await supabase.from('profiles').update({ active: isActive, name: buyerName || undefined }).eq('id', userId);
    } else if (isActive) {
      // Criar novo usuário se estiver aprovado
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: buyerEmail,
        password: TUTOR_DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: { name: buyerName || '' }
      });
      
      if (!createError && newUser.user) {
        userId = newUser.user.id;
        await supabase.from('profiles').upsert({
          id: userId,
          email: normalizedEmail,
          name: buyerName || '',
          active: true,
          role: 'user'
        });

        // 5. ENVIAR E-MAIL DE BOAS-VINDAS (Apenas para novos usuários aprovados)
        if (resend) {
          try {
            // Buscar template do banco
            const { data: settings } = await supabase.from('system_settings').select('*');
            const welcomeSubject = settings?.find(s => s.key === 'email_welcome_subject')?.value || 'Bem-vindo ao MyPetCare! 🐾';
            const welcomeBody = settings?.find(s => s.key === 'email_welcome_body')?.value;

            if (welcomeBody) {
              await resend.emails.send({
                from: 'MyPetCare <contato@vidacare.site>', // Altere para seu domínio verificado no Resend
                to: [buyerEmail],
                subject: welcomeSubject,
                html: welcomeBody.replace('{{name}}', buyerName || 'Tutor'),
              });
              console.log(`Welcome email sent to ${buyerEmail}`);
            }
          } catch (mailErr) {
            console.error("Error sending welcome email:", mailErr);
          }
        }
      }
    } else {
        // Se não for aprovação e usuário não existe, ignoramos
    }

    return res.status(200).json({ status: 'success', email: buyerEmail, isActive });

  } catch (error: any) {
    console.error("WEBHOOK ERROR:", error.message);
    return res.status(200).json({ status: 'error', message: error.message });
  }
}
