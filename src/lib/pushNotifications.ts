/**
 * Push Notifications Service — Web Push API + Pusher Beams
 * Gerencia permissões, registro e envio local de notificações push.
 */

const BEAMS_INSTANCE_ID = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID || '';

let beamsClient: any = null;

// ─── Verificar suporte ───────────────────────────────────────────────
export function isPushSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

// ─── Solicitar permissão ─────────────────────────────────────────────
export async function requestPushPermission(): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('[push] Push notifications not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[push] Permission result:', permission);
    return permission === 'granted';
  } catch (err) {
    console.error('[push] Permission request failed:', err);
    return false;
  }
}

// ─── Verificar permissão atual ───────────────────────────────────────
export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// ─── Inicializar Pusher Beams (opcional — para push server-side) ─────
export async function initBeams(userId: string): Promise<void> {
  if (!BEAMS_INSTANCE_ID || !isPushSupported()) return;

  try {
    // Dynamic import para não bloquear o bundle
    const PusherModule = await import('@pusher/push-notifications-web');
    const PusherPushNotifications = PusherModule.default || PusherModule;

    beamsClient = new PusherPushNotifications.Client({
      instanceId: BEAMS_INSTANCE_ID,
    });

    await beamsClient.start();
    await beamsClient.addDeviceInterest(`user-${userId}`);
    await beamsClient.addDeviceInterest('global');
    console.log(`[push] Beams initialized for user-${userId}`);
  } catch (err) {
    console.warn('[push] Beams init failed (non-critical):', err);
    // Não é crítico — notificações locais continuam funcionando
  }
}

// ─── Parar Pusher Beams ──────────────────────────────────────────────
export async function stopBeams(): Promise<void> {
  if (beamsClient) {
    try {
      await beamsClient.stop();
      beamsClient = null;
      console.log('[push] Beams stopped');
    } catch (err) {
      console.warn('[push] Beams stop error:', err);
    }
  }
}

// ─── Enviar notificação local via Service Worker ─────────────────────
export async function showLocalNotification(
  title: string,
  body: string,
  options?: {
    tag?: string;
    url?: string;
    icon?: string;
  }
): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = Notification.permission;
  if (permission !== 'granted') {
    console.warn('[push] Permission not granted:', permission);
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: options?.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: options?.tag || 'mypetcare-' + Date.now(),
      data: { url: options?.url || '/agenda' },
      requireInteraction: true,
    });
    console.log(`[push] Notification shown: "${title}"`);
    return true;
  } catch (err) {
    console.error('[push] Failed to show notification:', err);
    return false;
  }
}

// ─── Agendar verificação de eventos próximos ─────────────────────────
let checkInterval: ReturnType<typeof setInterval> | null = null;

export interface ScheduledEvent {
  id: string;
  title: string;
  petName: string;
  date: string;
  time?: string;
  type: string;
}

export function startAppointmentChecker(getEvents: () => ScheduledEvent[]): void {
  if (checkInterval) return; // Já rodando

  console.log('[push] Appointment checker started');
  
  const notifiedIds = new Set<string>(
    JSON.parse(localStorage.getItem('mypetcare_notified_events') || '[]')
  );

  const check = () => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const events = getEvents();

    for (const event of events) {
      if (notifiedIds.has(event.id)) continue;

      const eventDate = new Date(`${event.date}T${event.time || '00:00'}:00`);
      const diffMs = eventDate.getTime() - now.getTime();
      const diffMinutes = diffMs / (1000 * 60);

      // Notificar 30 min antes ou se já passou (até 5 min depois)
      if (diffMinutes <= 30 && diffMinutes >= -5) {
        const timeStr = event.time || '';
        const body = timeStr
          ? `${event.petName} — Hoje às ${timeStr}`
          : `${event.petName} — Hoje`;

        showLocalNotification(
          `🐾 ${event.title}`,
          body,
          { tag: `appointment-${event.id}`, url: '/agenda' }
        );

        notifiedIds.add(event.id);
        localStorage.setItem(
          'mypetcare_notified_events',
          JSON.stringify([...notifiedIds])
        );
      }
    }
  };

  // Verificar imediatamente e a cada 1 minuto
  check();
  checkInterval = setInterval(check, 60_000);
}

export function stopAppointmentChecker(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('[push] Appointment checker stopped');
  }
}
