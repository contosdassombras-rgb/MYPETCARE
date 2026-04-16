export default async function handler(req: any, res: any) {
  // Configurar headers para JSON
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress = 'MyPet Care <contato@vidacare.site>';

  if (!resendApiKey) {
    console.error('[API-EMAIL] RESEND_API_KEY missing in server environment');
    return res.status(500).json({ error: 'Configuração do servidor ausente (API Key)' });
  }

  try {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes: to, subject ou html.' });
    }

    console.log(`[API-EMAIL] Attempting to send email to: ${to}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[API-EMAIL] Resend API error:', data);
      return res.status(response.status).json({ 
        error: 'Erro na API do Resend', 
        details: data 
      });
    }

    console.log(`[API-EMAIL] Email sent successfully to ${to}. ID: ${data.id}`);
    return res.status(200).json({ success: true, id: data.id });

  } catch (error: any) {
    console.error('[API-EMAIL] Internal server error:', error.message);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
