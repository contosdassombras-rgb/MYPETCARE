import { sendEmail } from './emailService';

export interface AppointmentNotification {
  title: string;
  body: string;
  petName: string;
  date: string;
  time?: string;
  tutorName: string;
}

/**
 * Dispara as notificações habilitadas para um agendamento
 */
export const triggerAppointmentNotifications = async (
  notification: AppointmentNotification,
  settings: { push: boolean; email: boolean; emailAddress?: string }
) => {
  // 1. Notificação Push (Pusher Beams)
  // Nota: No mundo real, isso seria disparado pelo Backend. 
  // Aqui, apenas logamos o payload que seria enviado ao servidor.
  if (settings.push) {
    console.log('Push Notification Triggered:', {
      title: `Lembrete: ${notification.title}`,
      body: `${notification.petName}: ${notification.body} em ${notification.date} às ${notification.time || '--:--'}`,
    });
  }

  // 2. Notificação por E-mail (Resend)
  if (settings.email && settings.emailAddress) {
    try {
      await sendEmail({
        to: settings.emailAddress,
        subject: `Lembrete de Agendamento: ${notification.petName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #6366f1;">Olá, ${notification.tutorName}!</h2>
            <p>Este é um lembrete do MyPetCare sobre o próximo compromisso do seu pet.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Pet:</strong> ${notification.petName}</p>
              <p><strong>Evento:</strong> ${notification.title}</p>
              <p><strong>Data:</strong> ${notification.date}</p>
              <p><strong>Hora:</strong> ${notification.time || 'Não especificada'}</p>
              ${notification.body ? `<p><strong>Notas:</strong> ${notification.body}</p>` : ''}
            </div>
            <p>Atenciosamente,<br>Equipe MyPetCare</p>
          </div>
        `
      });
      console.log('Email sent successfully via Resend');
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
};

/**
 * Lógica para verificar agendamentos próximos no Frontend
 */
export const checkUpcomingAppointments = (events: any[]) => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return events.filter(event => {
    const eventDate = new Date(event.date);
    return !event.completed && eventDate >= now && eventDate <= tomorrow;
  });
};
