/**
 * Appointment Monitor Service
 * Monitors upcoming appointments and sends email reminders 30 minutes before.
 */

import { sendAppointmentEmail } from './email';

export interface ScheduledEvent {
  id: string;
  title: string;
  petName: string;
  date: string;
  time?: string;
  type: string;
}

export interface MonitorSettings {
  enabled: boolean;
  email: string;
  tutorName: string;
  language: 'pt' | 'en' | 'es';
}

let checkInterval: ReturnType<typeof setInterval> | null = null;
let lastGetEvents: (() => ScheduledEvent[]) | null = null;
let lastSettings: MonitorSettings | null = null;

/**
 * Force an immediate check for upcoming notifications.
 */
export async function refreshUpcomingNotifications(): Promise<void> {
  if (!lastGetEvents || !lastSettings || !lastSettings.enabled || !lastSettings.email) {
    return;
  }

  const notifiedIds = new Set<string>(
    JSON.parse(localStorage.getItem('mypetcare_emailed_events') || '[]')
  );

  const now = new Date();
  const events = lastGetEvents();

  for (const event of events) {
    const storageKey = `email_30min_${event.id}`;
    if (notifiedIds.has(storageKey)) continue;

    // Parse date in local time
    const [y, m, d] = event.date.split('-').map(Number);
    const [hh, mm] = (event.time || '00:00').split(':').map(Number);
    const eventDate = new Date(y, m - 1, d, hh, mm, 0);

    const diffMs = eventDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // USER REQUIREMENT: Send exactly 30 minutes before.
    // If registered AFTER the 30-min mark, do not notify.
    // We use a safe window [28, 30.5] to ensure we catch it in a 1-min interval,
    // but we check if it was already notified.
    if (diffMinutes <= 30.5 && diffMinutes >= 28) {
      console.log(`[monitor] Triggering 30-min email reminder for: ${event.title}`);
      
      try {
        const dateStr = eventDate.toLocaleDateString(undefined, { 
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });

        await sendAppointmentEmail(
          lastSettings.email,
          lastSettings.tutorName,
          event.petName,
          dateStr,
          event.type,
          lastSettings.language
        );

        notifiedIds.add(storageKey);
        localStorage.setItem(
          'mypetcare_emailed_events',
          JSON.stringify([...notifiedIds])
        );
        console.log(`[monitor] Email reminder sent successfully to ${lastSettings.email}`);
      } catch (err) {
        console.error('[monitor] Failed to send scheduled email:', err);
      }
    }
  }
}

export function startAppointmentMonitor(
  getEvents: () => ScheduledEvent[],
  settings: MonitorSettings
): void {
  lastGetEvents = getEvents;
  lastSettings = settings;

  if (checkInterval) {
    // If already running, just update refs and do a check
    refreshUpcomingNotifications();
    return;
  }

  console.log('[monitor] Appointment monitor started');
  refreshUpcomingNotifications();
  checkInterval = setInterval(refreshUpcomingNotifications, 60_000);
}

export function stopAppointmentMonitor(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('[monitor] Appointment monitor stopped');
  }
}
