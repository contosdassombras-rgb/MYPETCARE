import { sendAppointmentEmail } from './email';
import { showLocalNotification } from './pushNotifications';

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
 * Dispara as notificações habilitadas para um agendamento.
 * Inclui Push (Web Notification API) e Email (Resend) — com suporte a idioma.
 */
export const triggerAppointmentNotifications = async (
  notification: AppointmentNotification,
  settings: { push: boolean; email: boolean; emailAddress?: string; lang?: 'pt' | 'en' | 'es' }
) => {
  // 1. Notificação Push Real (Web Notification API via Service Worker)
  if (settings.push) {
    try {
      const timeStr = notification.time ? ` às ${notification.time}` : '';
      await showLocalNotification(
        `🐾 ${notification.title}`,
        `${notification.petName} — ${notification.date}${timeStr}`,
        { tag: `appointment-new-${Date.now()}`, url: '/agenda' }
      );
      console.log('[notifications] Push notification sent');
    } catch (err) {
      console.error('[notifications] Push notification failed:', err);
    }
  }

  // 2. Notificação por E-mail (Resend)
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
      console.log(`[notifications] Appointment email sent successfully (lang=${lang})`);
    } catch (error) {
      console.error('[notifications] Failed to send appointment email:', error);
      // Nunca quebra o fluxo principal
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
