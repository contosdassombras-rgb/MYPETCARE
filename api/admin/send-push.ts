import { Resend } from 'resend';

const beamsInstanceId = process.env.PUSHER_BEAMS_INSTANCE_ID;
const beamsSecretKey = process.env.PUSHER_BEAMS_SECRET_KEY;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, title } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (!beamsInstanceId || !beamsSecretKey) return res.status(500).json({ error: 'Pusher Beams not configured' });

    // Envia para o interesse global 'appointments' que todos os usuários assinam ao entrar
    const response = await fetch(`https://${beamsInstanceId}.pushnotifications.pusher.com/publish_api/v1/instances/${beamsInstanceId}/publishes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${beamsSecretKey}`
        },
        body: JSON.stringify({
            interests: ['appointments'],
            web: {
                notification: {
                    title: title || 'Comunicado MyPetCare',
                    body: message,
                    deep_link: 'https://app.vidacare.site',
                    icon: 'https://app.vidacare.site/logo192.png'
                }
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Pusher error: ${err}`);
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error("Manual Push Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
