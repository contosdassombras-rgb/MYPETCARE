import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (Vercel Env Vars)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    console.log("HOTMART WEBHOOK RECEIVED:", JSON.stringify(body, null, 2));

    // Extração básica do payload Hotmart V2
    const event = body.event;
    const buyerEmail = body.data?.buyer?.email;
    const buyerName = body.data?.buyer?.name;
    const transactionId = body.data?.purchase?.transaction;
    const product = body.data?.product?.name;
    const priceValue = body.data?.purchase?.price?.value;
    const priceCurrency = body.data?.purchase?.price?.currency_code;

    if (!buyerEmail) {
      console.error("No buyer email found in webhook payload.");
      return res.status(200).json({ status: 'ignored', message: 'No email' });
    }

    // 1. Mapeamento de Status
    let isActive = false;
    const status = event.toLowerCase();

    // 🟢 ATIVAR ACESSO
    if (['purchase_approved', 'purchase_completed', 'subscription_renewal_approved'].includes(status)) {
      isActive = true;
    } 
    // 🟡 PENDENTE / 🔴 DESATIVAR (Tudo que não for aprovado desativa por segurança)
    else {
      isActive = false;
    }

    console.log(`ACTION: ${isActive ? 'ACTIVATE' : 'DEACTIVATE'} for ${buyerEmail} (Event: ${event})`);

    // 2. Registrar evento no banco (Log)
    await supabase.from('hotmart_events').insert([{
      event_type: event,
      buyer_email: buyerEmail,
      buyer_name: buyerName,
      transaction_id: transactionId,
      product_id: product,
      price_value: priceValue,
      price_currency: priceCurrency,
      status: event,
      payload: body
    }]);

    // 3. Atualizar ou Criar usuário no profiles
    // Procuramos pelo email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', buyerEmail)
      .maybeSingle();

    if (profile) {
      // Atualiza usuário existente
      await supabase
        .from('profiles')
        .update({ active: isActive, name: buyerName || undefined })
        .eq('id', profile.id);
    } else if (isActive) {
      // Cria novo usuário se foi aprovado e não existe
      // NOTA: Isso cria apenas o PERFIL. O usuário precisará se cadastrar com esse email 
      // ou ser criado via Auth Admin. Para automação total, poderíamos criar o Auth User aqui.
      await supabase
        .from('profiles')
        .insert([{
          email: buyerEmail,
          name: buyerName || 'Usuário Hotmart',
          active: true,
          role: 'user'
        }]);
    }

    return res.status(200).json({ status: 'success', event, email: buyerEmail });
  } catch (error: any) {
    console.error("WEBHOOK ERROR:", error);
    return res.status(200).json({ status: 'error', message: error.message });
  }
}
