import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as m from 'motion/react';
const { motion, AnimatePresence } = m;
import { useLanguage } from '../contexts/LanguageContext';
import { usePets } from '../contexts/PetContext';
import { useUser } from '../contexts/UserContext';
import { 
  FileText, Printer, Share2, TrendingUp, Syringe, Pill, 
  MessageSquare, Paperclip, Calendar, Activity, Utensils, Send, Plus
} from 'lucide-react';
import { cn, calculateAge, formatDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const Reports: React.FC = () => {
  const { t } = useLanguage();
  const { pets } = usePets();
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '');

  useEffect(() => {
    if (!selectedPetId && pets.length > 0) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const selectedPet = pets.find(p => p.id === selectedPetId);

  const handleShare = (method: 'whatsapp' | 'email' | 'my_whatsapp') => {
    if (!selectedPet) return;
    const lines = [
      `*MyPetCare - Relatório de Saúde: ${selectedPet.name}*`,
      `${t('breed')}: ${selectedPet.breed}`,
      `${t('pet_age')}: ${calculateAge(selectedPet.birthDate, t)}`,
      `${t('weight')}: ${selectedPet.weight}kg`,
      `${t('food_type')}: ${selectedPet.foodType}`,
      `${t('allergies')}: ${selectedPet.allergies || '-'}`,
      `${t('medication')}: ${selectedPet.medications || '-'}`,
      '',
      `${t('compiled_history')}:`,
      ...(selectedPet.history || [])
        .filter(h => h.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(h => {
          const dateStr = formatDate(h.date);
          return `- ${dateStr}: [${t(h.type)}] ${h.title}${h.notes ? ` - ${h.notes}` : ''}`;
        }),
    ];
    const text = lines.join('\n');

    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    } else if (method === 'my_whatsapp') {
      if (!user.phone) {
        alert(t('register_whatsapp_first') || 'Por favor, cadastre seu WhatsApp no perfil primeiro.');
        return;
      }
      const cleanPhone = user.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.location.href = `mailto:?subject=${t('reports')}: ${selectedPet.name}&body=${encodeURIComponent(text)}`;
    }
  };

  const weightHistoryItems = [...(selectedPet?.history.filter(h => h.type === 'weight') || [])].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const hasEnoughWeightData = weightHistoryItems.length > 0;
  
  const weightBars = hasEnoughWeightData
    ? weightHistoryItems.slice(-6).map(h => {
        const val = typeof h.value === 'number' ? h.value : parseFloat(h.value as string) || 0;
        const maxWeight = Math.max(...weightHistoryItems.map(item => typeof item.value === 'number' ? item.value : parseFloat(item.value as string) || 0));
        return Math.max((val / (maxWeight || 1)) * 100, 10); // Scale relative to max seen, min 10%
      })
    : [];

  return (
    <div className="max-w-6xl mx-auto pb-24">
      <header className="mb-12 print:hidden">
        <h1 className="editorial-header">{t('reports')}</h1>
        <div className="flex gap-4 mt-8 overflow-x-auto pb-4 no-scrollbar">
          {pets.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPetId(p.id)}
              className={cn(
                'px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all whitespace-nowrap active:scale-90',
                selectedPetId === p.id 
                  ? 'bg-primary text-on-primary shadow-xl shadow-primary/20 scale-105' 
                  : 'bg-surface-container-low text-on-surface-variant opacity-50 hover:opacity-100'
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      </header>

      {selectedPet ? (
        <div className="space-y-12">
          {/* Health Summary Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/10 flex flex-col items-center text-center p-8">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">{t('pet_age')}</h4>
              <p className="text-3xl font-black text-primary leading-tight">{calculateAge(selectedPet.birthDate, t)}</p>
              <p className="text-[10px] text-on-surface-variant mt-2 font-bold">{t('birth_date')}: {formatDate(selectedPet.birthDate)}</p>
            </Card>

            <Card className="bg-secondary/5 border-secondary/10 flex flex-col items-center text-center p-8">
              <div className="p-4 bg-secondary/10 rounded-2xl text-secondary mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">{t('current_weight')}</h4>
              <p className="text-3xl font-black text-secondary leading-tight">{selectedPet.weight || 0} kg</p>
              <p className="text-[10px] text-on-surface-variant mt-2 font-bold uppercase tracking-tighter opacity-70">Monitoramento Ativo</p>
            </Card>

            <Card className="bg-surface-container-low flex flex-col items-center text-center p-8 border-none">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-4">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">{t('food_type')}</h4>
              <p className="text-xl font-black text-on-surface leading-tight truncate w-full">{selectedPet.foodType || '---'}</p>
              <p className="text-[10px] text-on-surface-variant mt-2">
                {selectedPet.allergies ? (
                  <Badge variant="error" className="py-0.5">{selectedPet.allergies}</Badge>
                ) : (
                  <span className="opacity-40 font-bold uppercase tracking-widest">{t('no_allergies')}</span>
                )}
              </p>
            </Card>
          </section>

          {/* Sharing Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden px-2">
            <Button onClick={() => handleShare('my_whatsapp')} variant="surface" className="flex-col h-32 rounded-3xl bg-green-600/10 text-green-700 hover:bg-green-600/20 shadow-none border border-green-600/10">
              <Send className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">Para Mim</span>
            </Button>
            <Button onClick={() => handleShare('whatsapp')} variant="surface" className="flex-col h-32 rounded-3xl bg-secondary-container/50 text-secondary hover:bg-secondary-container shadow-none border border-secondary/10">
              <Share2 className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('share')}</span>
            </Button>
            <Button onClick={() => handleShare('email')} variant="surface" className="flex-col h-32 rounded-3xl bg-primary/5 text-primary hover:bg-primary/10 shadow-none border border-primary/10">
              <FileText className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">E-mail</span>
            </Button>
            <Button onClick={() => window.print()} variant="surface" className="flex-col h-32 rounded-3xl shadow-none border border-surface-container-high/30">
              <Printer className="w-8 h-8" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('print_report')}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Weight Evolution */}
            <Card className="p-10 rounded-[3rem] bg-surface-container-lowest shadow-xl border-none">
              <div className="flex items-center gap-6 mb-12">
                <div className="p-4 bg-primary-container rounded-[1.5rem] text-primary">
                  <Activity className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-headline tracking-tighter">{t('weight_trend')}</h3>
                  <p className="text-sm font-bold text-on-surface-variant opacity-40 uppercase tracking-widest">{t('last_6_months')}</p>
                </div>
              </div>
              <div className="h-56 flex items-end gap-4 px-4 pb-4 border-b border-surface-container-high/30 relative">
                {!hasEnoughWeightData ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
                    <TrendingUp className="w-16 h-16 mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">{t('no_weight_data') || 'Sem registros de peso'}</p>
                  </div>
                ) : (
                  weightBars.map((height, i) => (
                    <div key={i} className="flex-1 bg-primary/5 rounded-t-2xl relative group h-full">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="absolute bottom-0 w-full bg-primary rounded-t-2xl shadow-lg shadow-primary/20 group-hover:brightness-110 transition-all flex flex-col items-center justify-end pb-2"
                      >
                        <span className="text-[10px] font-black text-on-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {weightHistoryItems.slice(-6)[i].value}kg
                        </span>
                      </motion.div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between mt-4 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                {hasEnoughWeightData ? (
                  weightHistoryItems.slice(-6).map((h, i) => (
                    <span key={i}>
                      {new Date(h.date).toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                  ))
                ) : (
                  <>
                    <span>---</span>
                    <span>---</span>
                    <span>---</span>
                  </>
                )}
              </div>
            </Card>

            {/* Compiled History List */}
            <div className="space-y-8">
              <h2 className="text-3xl font-black font-headline tracking-tighter flex items-center gap-4 px-2">
                <FileText className="w-8 h-8 text-primary" />
                {t('compiled_history')}
              </h2>
              
              <div className="space-y-4">
                {selectedPet.history && selectedPet.history.length > 0 ? (
                  [...selectedPet.history]
                    .filter(h => h.date)
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((item) => (
                      <Card key={item.id} className="p-6 rounded-3xl border-none bg-surface-container-low/40 shadow-none hover:bg-surface-container-low transition-colors group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-2xl transition-transform group-hover:scale-110",
                              item.type === 'vaccine' ? "bg-primary/20 text-primary" :
                              item.type === 'medication' ? "bg-secondary/20 text-secondary" :
                              item.type === 'weight' ? "bg-orange-500/20 text-orange-600" :
                              "bg-surface-container-high text-on-surface-variant"
                            )}>
                              {item.type === 'vaccine' ? <Syringe className="w-5 h-5" /> :
                               item.type === 'medication' ? <Pill className="w-5 h-5" /> :
                               item.type === 'weight' ? <TrendingUp className="w-5 h-5" /> :
                               item.type === 'document' ? <Paperclip className="w-5 h-5" /> :
                               <MessageSquare className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 mb-1">{t(item.type)}</p>
                              <p className="text-lg font-black text-on-surface leading-tight">{item.title}</p>
                            </div>
                          </div>
                          <Badge variant="surface" className="opacity-60">{formatDate(item.date)}</Badge>
                        </div>
                        
                        {item.notes && (
                          <p className="text-sm text-on-surface-variant font-medium mt-4 pl-16 opacity-70 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </Card>
                    ))
                ) : (
                  <Card className="text-center py-20 bg-surface-container-low/20 border-2 border-dashed border-surface-container-high/50 rounded-[3rem] shadow-none">
                    <p className="text-on-surface-variant font-black uppercase tracking-widest opacity-30">{t('no_info_registered')}</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-32 bg-surface-container-low/30 rounded-[3rem] border-2 border-dashed border-surface-container-high">
          <p className="text-on-surface-variant font-black uppercase tracking-widest opacity-40">{pets.length === 0 ? t('no_pets') : t('no_pet_selected')}</p>
          {pets.length === 0 && (
            <Button onClick={() => navigate('/pet/new')} className="mt-8 rounded-2xl py-6 px-12 text-xl">
              <Plus className="w-6 h-6" />
              {t('add_pet')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
