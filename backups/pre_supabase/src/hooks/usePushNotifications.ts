import { useEffect, useState } from 'react';
import * as PusherPushNotifications from '@pusher/push-notifications-web';

const INSTANCE_ID = import.meta.env.VITE_PUSHER_BEAMS_INSTANCE_ID;

export const usePushNotifications = () => {
  const [beamsClient, setBeamsClient] = useState<PusherPushNotifications.Client | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!INSTANCE_ID) {
      console.warn('Pusher Beams Instance ID not found in environment variables.');
      return;
    }

    const initBeams = async () => {
      try {
        const client = new PusherPushNotifications.Client({
          instanceId: INSTANCE_ID,
        });

        await client.start();
        // Inscreve no interesse global 'appointments' por padrão
        await client.addDeviceInterest('appointments');
        
        setBeamsClient(client);
        setIsSubscribed(true);
        console.log('Successfully registered and subscribed to Pusher Beams!');
      } catch (err) {
        console.error('Error initializing Pusher Beams:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initBeams();
  }, []);

  const addInterest = async (interest: string) => {
    if (beamsClient) {
      await beamsClient.addDeviceInterest(interest);
    }
  };

  return { isSubscribed, error, addInterest };
};
