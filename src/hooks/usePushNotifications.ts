import { useEffect, useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';

const INSTANCE_ID = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID as string | undefined;

/**
 * Pusher Beams push notification hook.
 * - Gated behind user authentication (only initializes when session exists)
 * - Completely non-blocking: errors are silently logged, never crash the UI
 * - Handles all browser permission states gracefully
 * - Uses dynamic import to avoid breaking the app if SDK fails to load
 */
export const usePushNotifications = () => {
  const { session } = useUser();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const initAttempted = useRef(false);

  useEffect(() => {
    // Only initialize when a user is authenticated and we have an instance ID
    if (!session?.user?.id || !INSTANCE_ID) return;
    // Only attempt init once per session
    if (initAttempted.current) return;
    initAttempted.current = true;

    // Check browser support — don't error if not supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Beams] Push notifications not supported in this browser.');
      return;
    }

    // Check permission before doing anything — don't prompt if already denied
    if (Notification.permission === 'denied') {
      console.warn('[Beams] Push notification permission has been denied by user.');
      return;
    }

    let mounted = true;

    const initBeams = async () => {
      try {
        // Dynamic import: prevents SDK errors from crashing the app bundle
        const PusherPushNotifications = await import('@pusher/push-notifications-web');
        if (!mounted) return;

        const client = new PusherPushNotifications.Client({
          instanceId: INSTANCE_ID!,
        });

        // start() requests permission internally if needed and registers the service worker
        await client.start();
        if (!mounted) return;

        // Subscribe to global channel + user-specific channel
        await client.addDeviceInterest('appointments');
        await client.addDeviceInterest(`user-${session.user.id}`);

        clientRef.current = client;
        setIsSubscribed(true);
        console.log('[Beams] ✓ Subscribed to Pusher Beams successfully.');
      } catch (err: unknown) {
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        // Log as warning — this is non-fatal
        console.warn('[Beams] Non-fatal initialization error:', msg);
        setError(msg);
      }
    };

    initBeams();

    return () => {
      mounted = false;
    };
  }, [session?.user?.id]);

  // Reset init flag on logout so it can re-initialize on next login
  useEffect(() => {
    if (!session?.user?.id) {
      initAttempted.current = false;
      setIsSubscribed(false);
      setError(null);
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
