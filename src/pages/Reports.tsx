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
    if (!selectedPetId && pets && pets.length > 0) {
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
          {/* Ficha Completa Premium */}
          <Card className="p-8 md:p-12 rounded-[3.5rem] bg-surface-container-lowest shadow-2xl border-none flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            {/* Foto com moldura premium */}
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] overflow-hidden shadow-2xl shrink-0 ring-8 ring-surface-container-low relative z-10">
              <img 
                src={selectedPet.photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800'} 
                alt={selectedPet.name} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-8 relative z-10 w-full">
              <div className="space-y-2">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <h2 className="text-5xl font-black font-headline tracking-tighter text-on-surface">{selectedPet.name}</h2>
                  <Badge variant="primary" className="w-fit self-center md:self-auto py-1 px-4 text-[10px] uppercase font-black tracking-widest bg-primary/10 text-primary border-none">
                    {t(selectedPet.status)}
                  </Badge>
                </div>
                <p className="text-xl font-bold text-primary uppercase tracking-widest opacity-80">{selectedPet.breed}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-surface-container-low/40 rounded-[2.5rem]">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">{t('pet_age')}</p>
                  <p className="text-lg font-black text-on-surface">{calculateAge(selectedPet.birthDate, t)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">{t('weight')}</p>
                  <p className="text-lg font-black text-on-surface">{selectedPet.weight || 0} kg</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">{t('food_type')}</p>
                  <p className="text-lg font-black text-on-surface truncate">{selectedPet.foodType || '---'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">{t('birth_date')}</p>
                  <p className="text-lg font-black text-on-surface">{formatDate(selectedPet.birthDate)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {selectedPet.allergies ? (
                  <div className="flex items-center gap-2 px-5 py-3 bg-red-500/10 text-red-600 rounded-2xl border border-red-500/20">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('allergies')}: {selectedPet.allergies}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-5 py-3 bg-green-500/10 text-green-600 rounded-2xl border border-green-500/20">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('no_allergies')}</span>
                  </div>
                )}
                
                {selectedPet.medications && (
                  <div className="flex items-center gap-2 px-5 py-3 bg-blue-500/10 text-blue-600 rounded-2xl border border-blue-500/20">
                    <Pill className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('medication')}: {selectedPet.medications}</span>
                  </div>
                ) || (
                  <div className="flex items-center gap-2 px-5 py-3 bg-surface-container-high/40 text-on-surface-variant rounded-2xl border border-surface-container-high">
                    <Pill className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{t('no_medications') || 'Sem medicamentos'}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

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
