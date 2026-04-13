import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { usePets } from '../contexts/PetContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { 
  ChevronLeft, Edit2, Calendar, Weight, Dog, Utensils, AlertCircle, 
  Activity, Pill, FileText, Heart, Share2, 
  Download, Trash2, Paperclip, Image as ImageIcon, Send
} from 'lucide-react';
import { cn, calculateAge, formatDate } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const PetProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pets, deleteHistory } = usePets();
  const { t } = useLanguage();
  const { user } = useUser();

  const pet = pets.find(p => p.id === id);

  if (!pet) return <div className="p-10 text-center">{t('pet_not_found')}</div>;

  const handleSendToMyWhatsApp = (title: string, petName: string) => {
    if (!user.phone) {
      alert(t('register_whatsapp_first') || 'Por favor, cadastre seu WhatsApp no perfil primeiro.');
      return;
    }
    const cleanPhone = user.phone.replace(/\D/g, '');
    const text = `*MyPetCare - Documento do Pet*\n\nPet: ${petName}\nDocumento: ${title}\n\nAcesse no app para baixar o arquivo completo.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const infoCards = [
    { icon: Dog, label: t('breed'), value: pet.breed },
    { icon: Calendar, label: t('birth_date'), value: formatDate(pet.birthDate) },
    { icon: Weight, label: t('weight'), value: `${pet.weight} kg` },
    { icon: Utensils, label: t('food_type'), value: pet.foodType },
  ];

  const healthSections = [
    { icon: AlertCircle, label: t('allergies'), value: pet.allergies },
    { icon: Activity, label: t('health_conditions'), value: pet.healthConditions },
    { icon: Pill, label: t('medication'), value: pet.medications },
  ];

  return (
    <div className="min-h-screen pb-20 max-w-5xl mx-auto">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full rounded-[3rem] overflow-hidden shadow-2xl mb-12">
        <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-12 left-10 right-10 flex justify-between items-end">
          <div>
            <h1 className="text-6xl font-black font-headline text-white mb-4 tracking-tighter">{pet.name}</h1>
            <div className="flex items-center gap-3">
              <span className="px-6 py-2 bg-white/20 backdrop-blur-xl text-white text-sm font-bold rounded-full">
                {calculateAge(pet.birthDate, t)}
              </span>
              <Badge variant={pet.status === 'up_to_date' ? 'success' : 'error'} className="py-2.5">
                {pet.status === 'up_to_date' ? t('everything_up_to_date') : t('pending_care')}
              </Badge>
            </div>
          </div>
          <Button 
            onClick={() => navigate(`/pet/edit/${pet.id}`)}
            size="icon"
            className="w-16 h-16 rounded-3xl"
          >
            <Edit2 className="w-8 h-8" />
          </Button>
        </div>
      </div>

      <div className="space-y-12">
        {/* Basic Info Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {infoCards.map((card, i) => (
            <Card key={i} className="p-8 border-none bg-surface-container-low shadow-none flex flex-col items-center text-center">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary mb-4">
                <card.icon className="w-6 h-6" />
              </div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mb-1 opacity-50">{card.label}</p>
              <p className="font-black text-on-surface leading-tight text-xl">{card.value || '---'}</p>
            </Card>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Health & Nutrition */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl font-black font-headline tracking-tighter ml-2">{t('health_nutrition')}</h2>
            <div className="space-y-4">
              {healthSections.map((section, i) => (
                <Card key={i} className="flex gap-6 items-start p-8 rounded-[2rem]">
                  <div className="p-4 bg-surface-container-low rounded-2xl text-primary">
                    <section.icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-widest mb-2 opacity-60">{section.label}</h3>
                    <p className="text-on-surface text-lg font-medium leading-relaxed">
                      {section.value || t('no_info_registered')}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar Actions/Documents */}
          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="secondary"
                className="flex-col h-32 rounded-[2rem] gap-3"
                onClick={() => navigate('/agenda')}
              >
                <Calendar className="w-8 h-8" />
                {t('agenda')}
              </Button>
              <Button 
                variant="surface"
                className="flex-col h-32 rounded-[2rem] gap-3"
                onClick={() => navigate('/reports')}
              >
                <FileText className="w-8 h-8" />
                {t('reports')}
              </Button>
            </div>

            {/* Documents */}
            <section className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-2xl font-black font-headline tracking-tighter">{t('pet_documents')}</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate(`/pet/edit/${pet.id}`)}
                  className="p-0 text-primary underline font-black"
                >
                  {t('add')}
                </Button>
              </div>

              <div className="space-y-3">
                {pet.history.filter(h => h.type === 'document').length > 0 ? (
                  pet.history
                    .filter(h => h.type === 'document')
                    .map((doc) => (
                      <Card key={doc.id} className="p-4 rounded-3xl flex items-center gap-4 group">
                        <div className="p-3 bg-surface-container-low rounded-xl text-primary shrink-0">
                          {doc.attachmentType === 'img' ? <ImageIcon className="w-5 h-5" /> : 
                           doc.attachmentType === 'pdf' ? <FileText className="w-5 h-5" /> : 
                           <Paperclip className="w-5 h-5" />}
                        </div>
                        
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-on-surface truncate leading-tight">{doc.title}</p>
                          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black opacity-40">
                            {formatDate(doc.date)} • {doc.attachmentType || 'doc'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const text = `${t('share_document')}: ${doc.title}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="text-on-surface-variant hover:text-green-600"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSendToMyWhatsApp(doc.title, pet.name)}
                            className="text-green-600"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          
                          {doc.attachments?.[0] && (
                            <a href={doc.attachments[0]} download={doc.title} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (window.confirm(t('confirm_delete_document'))) {
                                deleteHistory(pet.id, doc.id);
                              }
                            }}
                            className="text-error"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-12 bg-surface-container-low/30 rounded-[2rem] border-2 border-dashed border-surface-container-high/50">
                    <p className="text-on-surface-variant text-sm font-bold opacity-40 uppercase tracking-widest">{t('no_attachments')}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
