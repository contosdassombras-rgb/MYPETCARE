import { createClient } from '@supabase/supabase-js';

// IMPORTANT: On Vercel serverless, VITE_ prefixed vars are NOT available at runtime.
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel dashboard.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const hotmartSecret = process.env.HOTMART_SECRET;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: any, res: any) {
  // 1. Validar Método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = req.body;
    const headers = req.headers;

    console.log("--- HOTMART WEBHOOK START ---");
    console.log("HEADERS:", JSON.stringify(headers, null, 2));
    console.log("BODY:", JSON.stringify(body, null, 2));

    // 2. Validar Token de Segurança da Hotmart
    const receivedToken = headers['x-hotmart-token'];
    if (hotmartSecret && receivedToken !== hotmartSecret) {
      console.warn("INVALID HOTMART TOKEN RECEIVED");
      // Retornamos 200 mesmo assim para evitar retentativas infinitas de um atacante ou erro de config
      return res.status(200).json({ status: 'error', message: 'Invalid token' });
    }

    // Extração básica do payload Hotmart V2
    const event = body.event;
    const buyerEmail = body.data?.buyer?.email;
    const buyerName = body.data?.buyer?.name;
    const transactionId = body.data?.purchase?.transaction;
    const product = body.data?.product?.name;
    const priceValue = body.data?.purchase?.price?.value;
    const priceCurrency = body.data?.purchase?.price?.currency_code;

    if (!buyerEmail) {
      console.warn("Ignoring event: No buyer email found");
      return res.status(200).json({ status: 'ignored', message: 'No email' });
    }

    // 3. Mapeamento de Status
    let isActive = false;
    const status = (event || '').toLowerCase();

    // 🟢 ATIVAR ACESSO
    if (['purchase_approved', 'purchase_completed', 'subscription_renewal_approved'].includes(status)) {
      isActive = true;
    } 
    // 🟡 PENDENTE / 🔴 DESATIVAR (Tudo que não for aprovado desativa por segurança)
    else {
      isActive = false;
    }

    console.log(`ACTION: ${isActive ? 'ACTIVATE' : 'DEACTIVATE'} | EMAIL: ${buyerEmail} | EVENT: ${event}`);

    // 4. Registrar evento no banco (Log)
    const { error: logError } = await supabase.from('hotmart_events').insert([{
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

    if (logError) console.error("Database Log Error:", logError);

    // 5. Buscar o uuid do comprador via Supabase Auth (por email)
    // A tabela profiles usa o UUID do auth como id e NÃO tem coluna 'email'
    const { data: authData, error: authErr } = await supabase.auth.admin.getUserByEmail(buyerEmail);

    if (authErr) {
      console.warn("Auth lookup warning (user may not exist yet):", authErr.message);
    }

    if (authData?.user) {
      // Atualiza profile existente — sem campo 'email' que não existe na tabela
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          active: isActive,
          name: buyerName || undefined,
        })
        .eq('id', authData.user.id);

      if (updateError) console.error("Profile update error:", updateError.message);
    } else if (isActive) {
      // Comprador não tem conta ainda — apenas logar. 
      // A criação de conta deve ser feita via create-user API ou trigger.
      console.log(`INFO: Buyer ${buyerEmail} approved but has no account yet. Consider creating via Admin panel.`);
    }

    console.log("--- HOTMART WEBHOOK SUCCESS ---");
    return res.status(200).json({ 
      status: 'success', 
      processed_at: new Date().toISOString(),
      event, 
      email: buyerEmail 
    });

  } catch (error: any) {
    console.error("CRITICAL WEBHOOK ERROR:", error.message);
    // Retornamos 200 para a Hotmart não ficar repetindo o erro
    return res.status(200).json({ 
      status: 'handled_error', 
      message: error.message 
    });
  }
}
