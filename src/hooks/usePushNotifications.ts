import { useEffect, useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { usePets } from '../contexts/PetContext';
import { startAppointmentChecker, stopAppointmentChecker, type ScheduledEvent } from '../lib/pushNotifications';

const INSTANCE_ID = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID as string | undefined;

/**
 * Push notification hook — Pusher Beams + Appointment Checker.
 * - Gated behind user authentication
 * - Completely non-blocking: errors are silently logged
 * - Monitors upcoming appointments and sends local push notifications
 */
export const usePushNotifications = () => {
  const { session, user } = useUser();
  const { pets } = usePets();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const initAttempted = useRef(false);
  const checkerStarted = useRef(false);

  // ─── Pusher Beams initialization ────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id || !INSTANCE_ID) return;
    if (initAttempted.current) return;
    initAttempted.current = true;

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Beams] Push notifications not supported in this browser.');
      return;
    }

    if (Notification.permission === 'denied') {
      console.warn('[Beams] Push notification permission has been denied by user.');
      return;
    }

    let mounted = true;

    const initBeams = async () => {
      try {
        const PusherPushNotifications = await import('@pusher/push-notifications-web');
        if (!mounted) return;

        const client = new PusherPushNotifications.Client({
          instanceId: INSTANCE_ID!,
        });

        await client.start();
        if (!mounted) return;

        await client.addDeviceInterest('appointments');
        await client.addDeviceInterest(`user-${session.user.id}`);

        clientRef.current = client;
        setIsSubscribed(true);
        console.log('[Beams] ✓ Subscribed to Pusher Beams successfully.');
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[Beams] Non-fatal initialization error:', msg);
        setError(msg);
      }
    };

    initBeams();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  // ─── Appointment Checker (local push notifications) ─────────────────
  useEffect(() => {
    // Only start if push is enabled, user is logged in, and permission granted
    if (!session?.user?.id || !user.pushEnabled) {
      if (checkerStarted.current) {
        stopAppointmentChecker();
        checkerStarted.current = false;
      }
      return;
    }

    if (Notification.permission !== 'granted') return;
    if (checkerStarted.current) return;

    // Build event getter from current pets
    const getEvents = (): ScheduledEvent[] => {
      try {
        return pets
          .flatMap(p => (p.events || []).map(e => ({
            id: e.id,
            title: e.title,
            petName: p.name,
            date: e.date,
            time: e.time,
            type: e.type,
          })))
          .filter(e => !e.date ? false : true);
      } catch {
        return [];
      }
    };

    startAppointmentChecker(getEvents);
    checkerStarted.current = true;
    console.log('[Push] Appointment checker activated');

    return () => {
      stopAppointmentChecker();
      checkerStarted.current = false;
    };
  }, [session?.user?.id, user.pushEnabled, pets]);

  // Reset on logout
  useEffect(() => {
    if (!session?.user?.id) {
      initAttempted.current = false;
      checkerStarted.current = false;
      setIsSubscribed(false);
      setError(null);
      stopAppointmentChecker();
    }
  }, [session?.user?.id]);

  const addInterest = async (interest: string) => {
    if (clientRef.current) {
      try {
        await clientRef.current.addDeviceInterest(interest);
      } catch (err) {
        console.warn('[Beams] addInterest error:', err);
      }
    }
  };

  const removeInterest = async (interest: string) => {
    if (clientRef.current) {
      try {
        await clientRef.current.removeDeviceInterest(interest);
      } catch (err) {
        console.warn('[Beams] removeInterest error:', err);
      }
    }
  };

  return { isSubscribed, error, addInterest, removeInterest };
};
