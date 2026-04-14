import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Bell, Shield, LogOut, ChevronRight, 
  Download, Mail, Smartphone, HelpCircle, 
  Camera, Trash2, User, Phone, Share, PlusSquare, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'motion/react';

export const Settings: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, signOut, updateUser, resetPhoto } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'app'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'profile') return 'profile';
    if (tab === 'notifications') return 'notifications';
    return 'profile';
  });

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync activeTab with URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'profile') {
      setActiveTab('profile');
      // Auto focus name field if specifically coming to complete profile
      setTimeout(() => nameInputRef.current?.focus(), 300);
    } else if (tab === 'notifications') {
      setActiveTab('notifications');
    }
  }, [window.location.search]);

  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || ''
  });

  useEffect(() => {
    setFormData({
      name: user.name || '',
      phone: user.phone || ''
    });
  }, [user.name, user.phone]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePushToggle = () => updateUser({ pushEnabled: !user.pushEnabled });
  const handleEmailToggle = () => updateUser({ emailEnabled: !user.emailEnabled });
  
  const handleSaveProfile = async () => {
    await updateUser(formData);
    alert('Perfil atualizado com sucesso!');
  };

  const handleChangeLanguage = () => {
    setLanguage(null);
  };

  const handleInstallPWA = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      const promptEvent = (window as any).__pwaInstallPrompt;
      if (promptEvent) {
        promptEvent.prompt();
      } else {
        alert(t('install_instructions_android_desc'));
      }
    }
  };

  const langLabel: Record<string, string> = {
    pt: 'Português',
    en: 'English',
    es: 'Español',
  };

  const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={cn(
        "w-14 h-8 rounded-full relative transition-all duration-300 shadow-inner",
        enabled ? 'bg-primary' : 'bg-surface-container-high'
      )}
    >
      <div
        className={cn(
          "absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300",
          enabled ? 'translate-x-[1.6rem]' : 'translate-x-1'
        )}
      />
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <header className="mb-12 px-4">
        <h1 className="editorial-header">{t('profile')}</h1>
        <p className="text-on-surface-variant mt-2 font-medium opacity-60 uppercase tracking-widest text-xs">{t('manage_account_description')}</p>
      </header>

      {/* Tab Switcher */}
      <div className="flex gap-2 p-2 mb-12 bg-surface-container-low/50 rounded-3xl mx-4">
        <button 
          onClick={() => setActiveTab('profile')}
          className={cn(
            "flex-1 py-4 rounded-2xl font-black transition-all",
            activeTab === 'profile' ? "bg-white shadow-lg text-primary scale-[1.02]" : "text-on-surface-variant opacity-40 hover:opacity-100"
          )}
        >
          {t('profile')}
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={cn(
            "flex-1 py-4 rounded-2xl font-black transition-all",
            activeTab === 'notifications' ? "bg-white shadow-lg text-primary scale-[1.02]" : "text-on-surface-variant opacity-40 hover:opacity-100"
          )}
        >
          {t('notifications')}
        </button>
        <button 
          onClick={() => setActiveTab('app')}
          className={cn(
            "flex-1 py-4 rounded-2xl font-black transition-all",
            activeTab === 'app' ? "bg-white shadow-lg text-primary scale-[1.02]" : "text-on-surface-variant opacity-40 hover:opacity-100"
          )}
        >
          {t('app_settings')}
        </button>
      </div>

      <div className="space-y-12">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.section
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="flex items-center justify-between px-4 mb-6">
                <h2 className="text-2xl font-black font-headline tracking-tighter">
                  {t('tutor_profile')}
                </h2>
              </div>

              <Card className="p-10 rounded-[3rem] space-y-10 border-none bg-surface-container-low/30 shadow-none">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-primary shadow-2xl bg-surface-container-low transition-transform group-hover:scale-105 duration-500">
                      {user.photo ? (
                        <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant opacity-20">
                          <User className="w-16 h-16" />
                        </div>
                      )}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {user.photo && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={resetPhoto}
                      className="text-error font-black opacity-60 hover:opacity-100 hover:bg-error/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t('delete')}
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">
                      {t('full_name')}
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveProfile}
                    className="w-full py-6 rounded-2xl text-lg font-black tracking-tighter shadow-xl shadow-primary/20 mt-4"
                  >
                    {t('save')}
                  </Button>
                </div>
              </Card>
            </motion.section>
          )}

          {activeTab === 'notifications' && (
            <motion.section 
              key="notifications"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black font-headline tracking-tighter px-4">
                {t('notifications')}
              </h2>
              <Card className="p-2 overflow-hidden border-none bg-surface-container-low/30 shadow-none rounded-[2.5rem]">
                <div className="flex items-center justify-between p-8 border-b border-surface-container-high/20">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-surface-container-low text-primary shadow-sm">
                      <Smartphone className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-black text-on-surface text-lg leading-tight">{t('push_notifications')}</span>
                      <p className="text-xs text-on-surface-variant opacity-60 font-medium">Alertas no seu dispositivo</p>
                    </div>
                  </div>
                  <Toggle enabled={user.pushEnabled} onToggle={handlePushToggle} />
                </div>
                <div className="flex items-center justify-between p-8">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-surface-container-low text-primary shadow-sm">
                      <Mail className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-black text-on-surface text-lg leading-tight">{t('email_reminders')}</span>
                      <p className="text-xs text-on-surface-variant opacity-60 font-medium">Lembretes por e-mail</p>
                    </div>
                  </div>
                  <Toggle enabled={user.emailEnabled} onToggle={handleEmailToggle} />
                </div>
              </Card>
            </motion.section>
          )}

          {activeTab === 'app' && (
            <motion.section 
              key="app"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-black font-headline tracking-tighter px-4">
                {t('app_settings')}
              </h2>
              <Card className="p-2 overflow-hidden border-none bg-surface-container-low/30 shadow-none rounded-[2.5rem]">
                <button 
                  onClick={handleChangeLanguage}
                  className="w-full flex items-center justify-between p-8 border-b border-surface-container-high/20 hover:bg-surface-container-low transition-colors text-left group"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-surface-container-low text-primary shadow-sm">
                      <Globe className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-black text-on-surface text-lg leading-tight">{t('choose_language')}</span>
                      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest opacity-40 mt-1">{langLabel[language || 'pt']}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-on-surface-variant opacity-30 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button 
                  onClick={handleInstallPWA}
                  className="w-full flex items-center justify-between p-8 hover:bg-primary/5 transition-colors text-left group"
                >
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-primary text-on-primary shadow-xl shadow-primary/20">
                      <Download className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="font-black text-on-surface text-lg leading-tight">{t('install_mypetcare')}</span>
                      <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest opacity-40 mt-1">Acesso Rápido PWA</p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-on-surface-variant opacity-30 group-hover:translate-x-1 transition-transform" />
                </button>
              </Card>

              <section className="space-y-6 !mt-12">
                <h2 className="text-2xl font-black font-headline tracking-tighter px-4">
                  {t('support_settings')}
                </h2>
                <Card className="p-2 overflow-hidden border-none bg-surface-container-low/30 shadow-none rounded-[2.5rem]">
                  <button 
                    onClick={signOut}
                    className="w-full flex items-center justify-between p-8 hover:bg-error/5 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="p-4 rounded-2xl bg-error/10 text-error">
                        <LogOut className="w-7 h-7" />
                      </div>
                      <span className="font-black text-error text-lg leading-tight">{t('sign_out')}</span>
                    </div>
                    <ChevronRight className="w-6 h-6 text-on-surface-variant opacity-30 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Card>
              </section>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* iOS Install Instruction Modal */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative w-full max-w-lg bg-surface rounded-[2.5rem] p-8 space-y-8 overflow-hidden"
            >
              <button 
                onClick={() => setShowIOSModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-surface-container-low hover:bg-surface-container-high"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Download className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter">
                  {t('install_instructions_ios_title')}
                </h3>
                <p className="text-on-surface-variant font-medium opacity-60">
                  {t('install_instructions_ios_desc')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm shrink-0">1</div>
                  <p className="text-sm font-bold">{t('install_instructions_ios_step1')}</p>
                </div>
                <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm shrink-0">2</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold flex items-center gap-2">
                      {t('install_instructions_ios_step2')}
                      <span className="p-1 px-2 bg-white/50 rounded flex items-center gap-1">
                        <Share className="w-4 h-4" />
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm shrink-0">3</div>
                  <div className="flex-1">
                    <p className="text-sm font-bold flex items-center gap-2">
                      {t('install_instructions_ios_step3')}
                      <span className="p-1 px-2 bg-white/50 rounded flex items-center gap-1">
                        <PlusSquare className="w-4 h-4" />
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-black text-sm shrink-0">4</div>
                  <p className="text-sm font-bold">{t('install_instructions_ios_step4')}</p>
                </div>
              </div>

              <Button onClick={() => setShowIOSModal(false)} className="w-full py-6 rounded-2xl font-black text-lg">
                Entendido
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-20">MyPetCare v1.0.0 PREMIUM</p>
      </div>
    </div>
  );
};
