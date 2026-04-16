import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePets, PetEvent } from '../contexts/PetContext';
import { useUser } from '../contexts/UserContext';
import { triggerAppointmentNotifications } from '../lib/notifications';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle, Plus, X, Trash2, Syringe, Pill, Stethoscope, Heart, Save } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

type RecurrenceOption = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const emptyEvent = (): Omit<PetEvent, 'id'> => ({
  type: 'vaccine',
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '10:00',
  completed: false,
  notes: '',
  recurrence: 'none',
});

export const Agenda: React.FC = () => {
  const { t, language } = useLanguage();
  const { pets, addEvent, updateEvent, deleteEvent } = usePets();
  const { user } = useUser();
  const [isAdding, setIsAdding] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{ petId: string; event: PetEvent } | null>(null);
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '');
  const [newEvent, setNewEvent] = useState<Omit<PetEvent, 'id'>>(emptyEvent());

  const allEvents = pets
    .flatMap(p => (p.events || []).map(e => ({ ...e, petId: p.id, petName: p.name })))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const formatEventDate = (date: string, time?: string) => {
    const d = new Date(`${date}T00:00:00`);
    const formatted = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    return time ? `${formatted} • ${time}` : formatted;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPetId) return;

    const pet = pets.find(p => p.id === selectedPetId);

    try {
      if (editingEvent) {
        await updateEvent(editingEvent.petId, editingEvent.event.id, newEvent);
        setEditingEvent(null);
      } else {
        await addEvent(selectedPetId, newEvent);
        
        if (pet) {
          // Obter email da sessão autenticada
          const { data: sessionData } = await (await import('../lib/supabaseClient')).supabase.auth.getSession();
          const userEmail = sessionData?.session?.user?.email;

          await triggerAppointmentNotifications(
            {
              title: newEvent.title,
              body: newEvent.notes || '',
              petName: pet.name,
              date: new Date(`${newEvent.date}T00:00:00`).toLocaleDateString(),
              time: newEvent.time,
              tutorName: user.name,
              eventType: newEvent.type
            },
            {
              push: user.pushEnabled,
              email: user.emailEnabled,
              emailAddress: userEmail || undefined,
              lang: (language as 'pt' | 'en' | 'es') || 'pt'
            }
          );
        }
      }
      setIsAdding(false);
      setNewEvent(emptyEvent());
      // Forçar redirecionamento para o Painel Principal conforme solicitado
      window.location.href = '/'; 
    } catch (err) {
      console.error('Error saving event:', err);
    }
  };

  const handleEdit = (petId: string, event: PetEvent) => {
    setEditingEvent({ petId, event });
    setSelectedPetId(petId);
    setNewEvent({
      type: event.type,
      title: event.title,
      date: event.date,
      time: event.time || '',
      completed: event.completed,
      notes: event.notes || '',
      recurrence: event.recurrence || 'none',
    });
    setIsAdding(true);
  };

  const handleClose = () => {
    setIsAdding(false);
    setEditingEvent(null);
    setNewEvent(emptyEvent());
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'vaccine': return Syringe;
      case 'medication': return Pill;
      case 'appointment': return Stethoscope;
      default: return Heart;
    }
  };

  const recurrenceOptions: RecurrenceOption[] = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

  return (
    <div className="max-w-4xl mx-auto pb-24">
      <header className="mb-12 flex justify-between items-end px-2">
        <div>
          <h1 className="editorial-header">{t('agenda')}</h1>
          <p className="text-on-surface-variant mt-2 font-medium opacity-60 uppercase tracking-widest text-xs">{t('manage_routine')}</p>
        </div>
        <Button
          onClick={() => { setEditingEvent(null); setIsAdding(true); }}
          className="w-16 h-16 rounded-3xl"
        >
          <Plus className="w-8 h-8" />
        </Button>
      </header>

      <div className="space-y-6 md:space-y-12">
        {allEvents.length === 0 ? (
          <div className="text-center py-20 bg-surface-container-low/20 rounded-[3rem] border-2 border-dashed border-surface-container-high/50">
            <CalendarIcon className="w-16 h-16 text-primary opacity-20 mx-auto mb-6" />
            <p className="text-on-surface-variant font-black uppercase tracking-widest opacity-40">{t('no_events')}</p>
          </div>
        ) : (
          allEvents.map((event) => {
            const pet = pets.find(p => p.id === event.petId);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                layout
              >
                <Card className="flex items-center justify-between p-4 md:p-8 bg-surface-container-low/40 border-none rounded-[2rem] md:rounded-[3rem] group hover:bg-surface-container-low transition-all duration-500">
                  <div className="flex items-center gap-4 md:gap-8 min-w-0">
                    <div className={cn(
                      "p-4 md:p-6 rounded-2xl md:rounded-[2rem] transition-all group-hover:scale-110 shrink-0",
                      event.type === 'vaccine' ? "bg-primary/10 text-primary" :
                      event.type === 'medication' ? "bg-secondary/10 text-secondary" :
                      "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {event.type === 'vaccine' ? <Syringe className="w-6 h-6 md:w-8 md:h-8" /> :
                       event.type === 'medication' ? <Pill className="w-6 h-6 md:w-8 md:h-8" /> :
                       <CalendarIcon className="w-6 h-6 md:w-8 md:h-8" />}
                    </div>
                    
                    <div className="min-w-0 pr-2">
                       <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-xl md:text-2xl font-black font-headline truncate leading-tight">{event.title}</h3>
                        <Badge variant="surface" className="text-[9px] uppercase tracking-tighter opacity-60 px-2 py-0.5 rounded-lg shrink-0">
                          {event.petName}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-on-surface-variant opacity-50 font-bold text-xs md:text-sm">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>{formatEventDate(event.date, event.time)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 md:gap-3 shrink-0">
                    <button
                      onClick={async () => await updateEvent(event.petId, event.id, { completed: !event.completed })}
                      className={cn(
                        'p-2 md:p-3 rounded-full transition-all active:scale-90',
                        event.completed
                          ? 'text-primary bg-primary/10'
                          : 'text-on-surface-variant opacity-20 hover:opacity-100 hover:bg-surface-container-low'
                      )}
                    >
                      {event.completed ? <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10" /> : <Circle className="w-8 h-8 md:w-10 md:h-10" />}
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(t('confirm_delete_event'))) {
                          await deleteEvent(event.petId, event.id);
                        }
                      }}
                      className="p-2 md:p-3 text-error hover:bg-error/10 rounded-2xl md:opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-xl bg-surface rounded-t-[2.5rem] md:rounded-[3rem] p-6 md:p-10 shadow-2xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] border-t-4 md:border-t-0 border-primary"
            >
              <div className="flex justify-between items-center mb-6 md:mb-10">
                <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tighter">
                  {editingEvent ? t('edit_event') : t('add_event')}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-xl outline-none">
                  <X className="w-6 h-6 md:w-8 md:h-8" />
                </Button>
              </div>

              <form onSubmit={handleSave} className="space-y-8">
                {/* Select Pet */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">{t('select_pet')}</label>
                  <select
                    value={selectedPetId}
                    onChange={e => setSelectedPetId(e.target.value)}
                    disabled={!!editingEvent}
                    className="w-full p-5 bg-surface-container-low rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 transition-all font-black text-lg disabled:opacity-50 border-none appearance-none"
                  >
                    {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                {/* Event Type */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">{t('event_type')}</label>
                  <div className="grid grid-cols-2 gap-4">
                    {(['vaccine', 'medication', 'appointment', 'special_care'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewEvent({ ...newEvent, type })}
                        className={cn(
                          'py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-2 active:scale-95',
                          newEvent.type === type
                            ? 'bg-primary text-on-primary border-primary shadow-lg shadow-primary/20'
                            : 'bg-surface-container-low border-transparent text-on-surface-variant opacity-40 hover:opacity-100'
                        )}
                      >
                        {t(type === 'medication' ? 'medication_event' : type)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <Input
                  label={t('event_title')}
                  required
                  value={newEvent.title}
                  onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder={t('event_title_placeholder')}
                />

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label={t('event_date')}
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                  />
                  <Input
                    label={t('event_time')}
                    type="time"
                    value={newEvent.time}
                    onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                  />
                </div>

                {/* Recurrence */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1 opacity-60">{t('event_recurrence')}</label>
                  <select
                    value={newEvent.recurrence || 'none'}
                    onChange={e => setNewEvent({ ...newEvent, recurrence: e.target.value as RecurrenceOption })}
                    className="w-full p-5 bg-surface-container-low rounded-2xl outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold border-none appearance-none"
                  >
                    {recurrenceOptions.map(opt => (
                      <option key={opt} value={opt}>{t(`recurrence_${opt}`)}</option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full py-6 rounded-3xl text-xl font-black shadow-2xl hover:brightness-110 active:scale-95 transition-all mt-6"
                >
                  <Save className="w-6 h-6 mr-2" />
                  {t('save')}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
