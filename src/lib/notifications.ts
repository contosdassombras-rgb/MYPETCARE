import { sendAppointmentEmail } from './email';

export interface AppointmentNotification {
  title: string;
  body: string;
  petName: string;
  date: string;
  time?: string;
  tutorName: string;
  eventType?: string;
}

/**
 * Dispara as notificações habilitadas para um agendamento (Confirmação Imediata).
 * Focado apenas em Email (Resend) conforme nova diretriz.
 */
export const triggerAppointmentNotifications = async (
  notification: AppointmentNotification,
  settings: { email: boolean; emailAddress?: string; lang?: 'pt' | 'en' | 'es' }
) => {
  // Notificação por E-mail (Confirmação na hora)
  if (settings.email && settings.emailAddress) {
    try {
      const dataFormatada = notification.time
        ? `${notification.date} às ${notification.time}`
        : notification.date;

      const lang = settings.lang || 'pt';

      await sendAppointmentEmail(
        settings.emailAddress,
        notification.tutorName,
        notification.petName,
        dataFormatada,
        notification.eventType || 'appointment',
        lang
      );
      console.log(`[notifications] Appointment confirmation email sent to ${settings.emailAddress}`);
    } catch (error) {
      console.error('[notifications] Failed to send appointment email:', error);
    }
  }
};
