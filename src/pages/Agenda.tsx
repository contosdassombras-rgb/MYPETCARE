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
  const { t } = useLanguage();
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
          await triggerAppointmentNotifications(
            {
              title: newEvent.title,
              body: newEvent.notes || '',
              petName: pet.name,
              date: new Date(`${newEvent.date}T00:00:00`).toLocaleDateString(),
              time: newEvent.time,
              tutorName: user.name
            },
            {
              push: user.pushEnabled,
              email: user.emailEnabled,
              emailAddress: 'marceloneto.contato@outlook.com'
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

      <div className="space-y-4">
        {allEvents.length === 0 ? (
          <div className="text-center py-32 bg-surface-container-low/30 rounded-[3rem] border-2 border-dashed border-surface-container-high/50">
            <CalendarIcon className="w-16 h-16 text-on-surface-variant opacity-20 mx-auto mb-6" />
            <p className="text-on-surface-variant font-black uppercase tracking-widest opacity-40">{t('no_events')}</p>
          </div>
        ) : (
          allEvents.map(event => {
            const Icon = getEventIcon(event.type);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card 
                  className={cn(
                    'p-6 rounded-3xl flex items-center justify-between group border-2 transition-all',
                    event.completed
                      ? 'border-transparent bg-surface-container-low/40 opacity-50'
                      : 'border-surface-container-high/30 hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center gap-6 flex-1 min-w-0">
                    <div className={cn(
                      'w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-colors shrink-0',
                      event.completed ? 'bg-surface-container-low text-on-surface-variant' : 'bg-primary-container text-primary'
                    )}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="cursor-pointer overflow-hidden flex-1" onClick={() => handleEdit(event.petId, event)}>
                      <div className="flex items-center gap-3 mb-1.5 overflow-hidden">
                        <h3 className="font-black text-xl text-on-surface leading-tight truncate">{event.title}</h3>
                        <span className="text-[10px] font-black px-3 py-1 bg-surface-container-high rounded-full uppercase tracking-widest opacity-60 shrink-0">
                          {event.petName}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant flex items-center gap-2 font-bold opacity-70">
                        <Clock className="w-4 h-4" />
                        {formatEventDate(event.date, event.time)}
                      </p>
                      {event.recurrence && event.recurrence !== 'none' && (
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-2 flex items-center gap-1.5 italic">
                          <span className="text-lg">↻</span> {t(`recurrence_${event.recurrence}`)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    <button
                      onClick={async () => await updateEvent(event.petId, event.id, { completed: !event.completed })}
                      className={cn(
                        'p-2 rounded-full transition-all active:scale-90',
                        event.completed
                          ? 'text-primary bg-primary/10'
                          : 'text-on-surface-variant opacity-20 hover:opacity-100 hover:bg-surface-container-low'
                      )}
                    >
                      {event.completed ? <CheckCircle2 className="w-10 h-10" /> : <Circle className="w-10 h-10" />}
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm(t('confirm_delete_event'))) {
                          await deleteEvent(event.petId, event.id);
                        }
                      }}
                      className="p-3 text-error hover:bg-error/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-6 h-6" />
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
              className="relative w-full max-w-xl bg-surface rounded-t-[3rem] md:rounded-[3rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] border-t-4 md:border-t-0 border-primary"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black font-headline tracking-tighter">
                  {editingEvent ? t('edit_event') : t('add_event')}
                </h2>
                <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-2xl">
                  <X className="w-8 h-8" />
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
