import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Phone, Mail, User, Plus, X, Trash2, Building2, ShoppingBag, Globe, MapPin, Star, Pencil } from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';

interface Contact {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email: string;
  type: 'veterinarian' | 'clinic' | 'pet_shop';
  city?: string;
  state?: string;
}

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const generateId = () => Math.random().toString(36).substring(2, 11);

export const Veterinarian: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('mypetcare_contacts');
    try {
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Dr. Sarah Mitchell', phone: '+1 234 567 890', whatsapp: '+1234567890', email: 'sarah@vet.com', type: 'veterinarian', city: 'São Paulo', state: 'SP' },
        { id: '2', name: 'Happy Paws Clinic', phone: '+1 098 765 432', email: 'contact@happypaws.com', type: 'clinic', city: 'Rio de Janeiro', state: 'RJ' },
      ];
    } catch {
      return [];
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [recommendToSocial, setRecommendToSocial] = useState(false);
  const [newContact, setNewContact] = useState<Omit<Contact, 'id'>>({
    name: '',
    phone: '',
    whatsapp: '',
    email: '',
    type: 'veterinarian',
    city: '',
    state: ''
  });


  const saveContacts = (updated: Contact[]) => {
    setContacts(updated);
    localStorage.setItem('mypetcare_contacts', JSON.stringify(updated));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = contacts.map(c => c.id === editingId ? { ...newContact, id: editingId } : c);
      saveContacts(updated);
    } else {
      const contact: Contact = { ...newContact, id: generateId() };
      saveContacts([...contacts, contact]);
    }

    if (recommendToSocial && !editingId) {
      // Social Logic already handled if not editing
      // (Optional: handle sync on edit too?)
    }

    setIsAdding(false);
    setEditingId(null);
    setNewContact({ name: '', phone: '', whatsapp: '', email: '', type: 'veterinarian', city: '', state: '' });
    setRecommendToSocial(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('delete_contact_confirm'))) {
      saveContacts(contacts.filter(c => c.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'veterinarian': return User;
      case 'clinic': return Building2;
      case 'pet_shop': return ShoppingBag;
      default: return User;
    }
  };

  const handleEdit = (contact: Contact) => {
    setNewContact({
      name: contact.name,
      phone: contact.phone,
      whatsapp: contact.whatsapp || '',
      email: contact.email || '',
      type: contact.type,
      city: contact.city || '',
      state: contact.state || ''
    });
    setEditingId(contact.id);
    setIsAdding(true);
  };

  const handleStarRecommend = async (contact: Contact) => {
    try {
      const session = await supabase.auth.getSession();
      const devModeId = '24b2f3ec-aca9-4eaf-8e36-a8538a274c7f';
      const userId = session.data.session?.user.id || devModeId;

      // 1. Inserir ou obter o profissional
      const { data: pro, error: proError } = await supabase
        .from('professionals')
        .insert({
          name: contact.name,
          type: contact.type,
          city: contact.city,
          state: contact.state,
          created_by: userId
        })
        .select()
        .single();
      
      if (proError && proError.code !== '23505') throw proError; // ignore unique constraint if already exists

      // Se já existia, buscamos o ID
      let finalProId = pro?.id;
      if (!finalProId) {
        const { data: existingPro } = await supabase
          .from('professionals')
          .select('id')
          .eq('name', contact.name)
          .eq('city', contact.city)
          .maybeSingle();
        finalProId = existingPro?.id;
      }

      if (!finalProId) throw new Error('Não foi possível identificar o profissional.');

      // 2. Inserir a avaliação automática de 5 estrelas
      const { error: ratingError } = await supabase
        .from('professional_ratings')
        .insert({
          professional_id: finalProId,
          user_id: userId,
          rating: 5,
          comment: 'Recomendo este profissional!'
        });

      if (ratingError && ratingError.code !== '23505') throw ratingError;

      alert(t('recommend_to_community_success'));
    } catch (err) {
      console.error('Social recommendation error:', err);
      alert('Erro ao recomendar. Verifique se você já recomendou este profissional.');
    }
  };

  return (
    <div className="px-6 max-w-3xl mx-auto pb-24">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="editorial-header">{t('my_veterinarian')}</h1>
          <p className="text-on-surface-variant mt-2">{t('trusted_network')}</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-4 bg-primary text-on-primary rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contacts.map(contact => {
          const Icon = getTypeIcon(contact.type);
          return (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-surface-container-lowest p-6 rounded-3xl shadow-sm border border-surface-container-high/30 group relative"
            >
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => handleStarRecommend(contact)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                  title="Recomendar à Comunidade"
                >
                  <Star className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(contact)}
                  className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
                  title={t('edit')}
                >
                  <Pencil className="w-5 h-5" /> 
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                  title={t('delete')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-primary-container text-primary rounded-2xl flex items-center justify-center">
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-headline text-on-surface">{contact.name}</h3>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest">{t(contact.type)}</p>
                  {contact.city && (
                    <p className="text-[10px] text-on-surface-variant opacity-40 font-bold uppercase mt-1">
                      {contact.city}{contact.state ? `, ${contact.state}` : ''}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-primary-container transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-on-surface">{contact.phone}</span>
                </a>
                {contact.whatsapp && (
                  <a
                    href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-[#25D366]/10 hover:text-[#25D366] transition-all group/wa"
                  >
                    <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                    <span className="text-sm font-bold text-on-surface group-hover/wa:text-[#25D366] transition-colors">{t('whatsapp')}</span>
                  </a>
                )}
                {contact.email && (

                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-primary-container transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-sm font-bold text-on-surface">{contact.email}</span>
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-lg bg-surface rounded-t-3xl md:rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold font-headline">{t('new_contact')}</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-surface-container-low rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('type')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['veterinarian', 'clinic', 'pet_shop'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewContact({ ...newContact, type })}
                        className={cn(
                          'py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border-2',
                          newContact.type === type
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-low border-transparent text-on-surface-variant opacity-60'
                        )}
                      >
                        {t(type)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('name')}</label>
                  <input
                    type="text"
                    required
                    value={newContact.name}
                    onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full p-4 bg-surface-container-low rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('phone')}</label>
                  <input
                    type="tel"
                    required
                    value={newContact.phone}
                    onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                    className="w-full p-4 bg-surface-container-low rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('whatsapp')}</label>
                  <input
                    type="tel"
                    value={newContact.whatsapp}
                    onChange={e => setNewContact({ ...newContact, whatsapp: e.target.value })}
                    className="w-full p-4 bg-surface-container-low rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="ex: 11988887777"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('email')}</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                    className="w-full p-4 bg-surface-container-low rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('city')}</label>
                    <input
                      type="text"
                      value={newContact.city}
                      onChange={e => setNewContact({ ...newContact, city: e.target.value })}
                      className="w-full p-4 bg-surface-container-low rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">{t('state')}</label>
                    <input
                      type="text"
                      value={newContact.state}
                      onChange={e => setNewContact({ ...newContact, state: e.target.value })}
                      className="w-full p-4 bg-surface-container-low rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="UF"
                    />
                  </div>
                </div>

                {!editingId && (
                  <div 
                    onClick={() => setRecommendToSocial(!recommendToSocial)}
                    className={cn(
                      "p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between",
                      recommendToSocial 
                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" 
                        : "bg-surface-container-low border-transparent opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                        recommendToSocial ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant"
                      )}>
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">{t('recommend_to_community')}</p>
                        <p className="text-[10px] font-bold opacity-60 uppercase">{t('share_with_tutors')}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      recommendToSocial ? "border-primary bg-primary" : "border-on-surface-variant opacity-20"
                    )}>
                      {recommendToSocial && <Plus className="w-4 h-4 text-on-primary" />}
                    </div>
                  </div>
                )}


                <button
                  type="submit"
                  className="w-full py-5 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all mt-4"
                >
                  {t('save')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
