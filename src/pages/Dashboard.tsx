import React from 'react';
import * as m from 'motion/react';
const { motion, AnimatePresence } = m;
import { useLanguage } from '../contexts/LanguageContext';
import { usePets } from '../contexts/PetContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, ChevronRight, Stethoscope, FileBarChart, Users, Thermometer, Clock, Trash2 } from 'lucide-react';
import { cn, calculateAge } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, TextArea } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { pets, loading, syncLocalData, deletePet } = usePets();
  const navigate = useNavigate();
  const [syncing, setSyncing] = React.useState(false);
  const [hasLocalData, setHasLocalData] = React.useState(!!localStorage.getItem('mypetcare_pets'));

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncLocalData();
      setHasLocalData(false);
      window.location.href = '/'; 
    } catch (err) {
      console.error('Manual sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { icon: Stethoscope, label: t('my_veterinarian'), path: '/vet', variant: 'primary' as const },
    { icon: FileBarChart, label: t('reports'), path: '/reports', variant: 'secondary' as const },
    { icon: Users, label: t('search_professionals'), path: '/professionals', variant: 'surface' as const },
    { icon: Thermometer, label: t('symptom_guidance'), path: '/symptoms', variant: 'error' as const },
  ];

  const getSymptomPrompt = (language: string) => {
    const langMap: Record<string, string> = { 'pt': 'Português', 'en': 'English', 'es': 'Español' };
    return `Provide a preliminary guidance following these strict rules:
1. NEVER give a definitive diagnosis or suggest grave terminal diseases for mild symptoms.
2. ALWAYS consider common daily causes first (e.g., food change, hot weather, minor stress, new environment, recent vaccination).
3. Use cautious and realistic language like "May be related to something simple like..." or "Could be a temporary reaction to...".
4. List possible causes (3-5 items maximum), prioritizing common ones.
5. Determine urgency level: Low, Medium, High, or Emergency.
6. Provide clear, actionable, and non-alarmist recommendations.
7. Respond ENTIRELY in ${langMap[language as string] || 'English'}.
8. Return ONLY a valid JSON object with these keys:
   - possible_causes: string array
   - urgency_level: string (one of: Low, Medium, High, Emergency)
   - recommendation: string

Return only the JSON. No explanation, no markdown, no backticks.`;
  };

  // OTIMIZAÇÃO: Memoizar o cálculo de eventos para evitar re-flatMap pesado em cada render
  const allEvents = React.useMemo(() => {
    try {
      return pets
        .flatMap(p => (p.events || []).map(e => ({ ...e, petName: p.name })))
        .filter(e => {
          if (!e.date || e.completed) return false;
          const d = new Date(`${e.date}T00:00:00`);
          return !isNaN(d.getTime());
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);
    } catch (err) {
      console.warn('DEBUG: Error calculating allEvents:', err);
      return [];
    }
  }, [pets]);

  const formatEventDate = (date: string) => {
    try {
      if (!date) return '---';
      const d = new Date(`${date}T00:00:00`);
      if (isNaN(d.getTime())) return '---';
      
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      });
    } catch (err) {
      console.warn('DEBUG: Error formatting date:', date, err);
      return '---';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {hasLocalData && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-8 p-6 bg-primary-container text-on-primary-container rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary text-on-primary rounded-2xl">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-lg leading-tight">Migrar dados para a nuvem?</h4>
              <p className="text-sm font-medium opacity-80">Encontramos pets salvos localmente. Sincronize agora para acessar em qualquer dispositivo.</p>
            </div>
          </div>
          <Button 
            onClick={handleSync} 
            isLoading={syncing}
            className="w-full md:w-auto px-8 rounded-2xl bg-primary text-on-primary"
          >
            Sincronizar Agora
          </Button>
        </motion.div>
      )}

      <header className="mb-12">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="editorial-header"
        >
          {t('welcome_back')}, <br />
          <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">MyPetCare.</span>
        </motion.h1>
        <p className="mt-4 text-on-surface-variant text-lg max-w-md">
          {t('welcome_message')}
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {quickActions.map(action => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-3 p-6 bg-surface-container-lowest rounded-3xl shadow-sm border border-surface-container-high/20 hover:shadow-md transition-all group active:scale-95"
          >
            <div className={cn(
              'p-4 rounded-2xl transition-transform group-hover:scale-110',
              action.variant === 'primary' ? 'bg-primary/10 text-primary' :
              action.variant === 'secondary' ? 'bg-secondary/10 text-secondary' :
              action.variant === 'error' ? 'bg-error/10 text-error' : 'bg-surface-container-high text-on-surface'
            )}>
              <action.icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-center leading-tight opacity-70 group-hover:opacity-100">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Pet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pets.map((pet, index) => (
          <motion.div
            key={pet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card hoverable className="p-0 overflow-hidden flex flex-col h-full rounded-[2.5rem]">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={pet.photo} 
                  alt={pet.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <Badge 
                  variant={pet.status === 'up_to_date' ? 'success' : pet.status === 'pending' ? 'pending' : 'error'}
                  className="absolute top-6 right-6"
                >
                  {pet.status === 'up_to_date' ? t('everything_up_to_date') :
                   pet.status === 'pending' ? t('pending_care') : t('overdue_vaccines')}
                </Badge>
              </div>

              <div className="p-8 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-4xl font-black font-headline text-on-surface tracking-tighter mb-1">{pet.name}</h2>
                    <p className="text-on-surface-variant font-bold text-lg">{calculateAge(pet.birthDate, t)}</p>
                    <p className="text-sm text-on-surface-variant opacity-40 font-medium">{pet.breed}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="bg-surface-container-low">
                    <Heart className="w-6 h-6 text-error" fill={pet.status === 'up_to_date' ? 'currentColor' : 'none'} />
                  </Button>
                </div>

                <div className="mt-auto flex gap-3">
                  <Button
                    onClick={() => navigate(`/pet/${pet.id}`)}
                    className="flex-1 py-5 rounded-2xl group"
                  >
                    {t('view_full_profile')}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm(t('confirm_delete_pet'))) {
                        try {
                          await deletePet(pet.id);
                        } catch (err) {
                          console.error('Delete failed:', err);
                          alert(t('error_deleting_pet'));
                        }
                      }
                    }}
                    className="bg-error/10 text-error hover:bg-error hover:text-white p-5 rounded-2xl h-auto"
                  >
                    <Trash2 className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Add Pet Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/pet/new')}
          className="bg-surface-container-low border-2 border-dashed border-surface-container-high rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[400px] text-on-surface-variant hover:border-primary hover:text-primary transition-all group"
        >
          <div className="w-20 h-20 bg-surface-container-lowest rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-10 h-10" />
          </div>
          <span className="font-bold text-xl uppercase tracking-widest opacity-60">{t('add_pet')}</span>
        </motion.button>
      </div>

      {/* Upcoming Agenda */}
      <section className="mt-20 mb-12">
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-3xl font-black font-headline text-on-surface tracking-tighter">{t('this_weeks_agenda')}</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')} className="text-primary font-bold">
            {t('see_all')}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {allEvents.length > 0 ? (
            allEvents.map(event => (
              <Card key={event.id} className="flex items-center gap-6 p-6 border-l-4 border-l-primary">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex flex-col items-center justify-center text-primary shrink-0">
                  <span className="text-xs font-black uppercase">{new Date(`${event.date}T00:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span>
                  <span className="text-2xl font-black leading-none">{new Date(`${event.date}T00:00:00`).getDate()}</span>
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-black text-on-surface truncate leading-tight mb-1">{event.title}</h4>
                  <p className="text-xs font-bold text-primary mb-2 opacity-80">{event.petName}</p>
                  <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    {formatEventDate(event.date)}
                    {event.time && ` • ${event.time}`}
                  </p>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-12 bg-surface-container-low rounded-[2rem] text-center border-2 border-dashed border-surface-container-high">
              <p className="text-on-surface-variant font-bold uppercase tracking-widest opacity-40">{t('no_events')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
