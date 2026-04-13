/**
 * Email Service (Resend Integration)
 */

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (payload: EmailPayload) => {
  if (!RESEND_API_KEY) {
    console.warn('Resend API key not found. Email not sent.');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'MyPetCare <notifications@mypetcare.app>', // Note: usually requires domain verification
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
