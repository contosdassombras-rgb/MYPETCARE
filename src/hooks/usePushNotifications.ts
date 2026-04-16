import { useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { usePets } from '../contexts/PetContext';
import { useLanguage } from '../contexts/LanguageContext';
import { startAppointmentMonitor, stopAppointmentMonitor, type ScheduledEvent } from '../lib/appointmentMonitor';

/**
 * Hook de Monitoramento de Agendamentos — Lembretes por E-mail.
 * - Monitora eventos próximos e envia e-mails via Resend 30 min antes.
 */
export const useAppointmentReminders = () => {
  const { session, user } = useUser();
  const { pets } = usePets();
  const { language } = useLanguage();
  const monitorStarted = useRef(false);

  useEffect(() => {
    // Só inicia se lembretes por e-mail estiverem ativos e houver um e-mail definido
    const notificationEmail = user.notificationEmail || session?.user?.email;
    
    if (!session?.user?.id || !user.emailEnabled || !notificationEmail) {
      if (monitorStarted.current) {
        stopAppointmentMonitor();
        monitorStarted.current = false;
      }
      return;
    }

    // Builder de eventos simplificado
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
          .filter(e => !!e.date && !e.completed);
      } catch {
        return [];
      }
    };

    startAppointmentMonitor(getEvents, {
      enabled: user.emailEnabled,
      email: notificationEmail,
      tutorName: user.name,
      language: (language as 'pt' | 'en' | 'es') || 'pt'
    });

    monitorStarted.current = true;
    console.log('[monitor] Email appointment monitor activated');

    return () => {
      stopAppointmentMonitor();
      monitorStarted.current = false;
    };
  }, [session?.user?.id, user.emailEnabled, user.notificationEmail, user.name, pets, language]);

  return { monitorStarted: monitorStarted.current };
};
