import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, Bell, Shield, LogOut, ChevronRight, 
  Download, Mail, Smartphone, HelpCircle, 
  Camera, Trash2, User, Phone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Settings: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { user, updateUser, resetPhoto } = useUser();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handlePushToggle = () => {
    updateUser({ pushEnabled: !user.pushEnabled });
  };

  const handleEmailToggle = () => {
    updateUser({ emailEnabled: !user.emailEnabled });
  };

  const handleChangeLanguage = () => {
    setLanguage(null);
  };

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

  const handleInstallPWA = () => {
    const promptEvent = (window as any).__pwaInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
    } else {
      alert(t('install_mypetcare'));
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

      <div className="space-y-12">
        {/* Tutor Profile Section */}
        <section>
          <div className="flex items-center justify-between px-4 mb-6">
            <h2 className="text-2xl font-black font-headline tracking-tighter">
              {t('tutor_profile')}
            </h2>
            <div className="flex items-center gap-4">
              {showSuccess && (
                <span className="text-primary font-bold text-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  {t('save_success') || 'Salvo com sucesso!'}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleSave} className="text-primary font-black">
                {t('save')}
              </Button>
            </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <Input
                  label={t('name')}
                  value={user.name}
                  onChange={(e) => updateUser({ name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="WhatsApp"
                  type="tel"
                  value={user.phone}
                  onChange={(e) => updateUser({ phone: e.target.value })}
                  placeholder="Ex: +55 11 99999-9999"
                />
              </div>
            </div>
          </Card>
        </section>

        {/* Notifications */}
        <section className="space-y-6">
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
        </section>

        {/* App Settings */}
        <section className="space-y-6">
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
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-black font-headline tracking-tighter px-4">
            {t('support_settings')}
          </h2>
          <Card className="p-2 overflow-hidden border-none bg-surface-container-low/30 shadow-none rounded-[2.5rem]">
            <button className="w-full flex items-center justify-between p-8 border-b border-surface-container-high/20 hover:bg-surface-container-low transition-colors text-left group">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-2xl bg-surface-container-low text-primary shadow-sm">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <span className="font-black text-on-surface text-lg leading-tight">{t('help_center')}</span>
              </div>
              <ChevronRight className="w-6 h-6 text-on-surface-variant opacity-30 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full flex items-center justify-between p-8 hover:bg-error/5 transition-colors text-left group">
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
      </div>

      <div className="mt-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-20">MyPetCare v1.0.0 PREMIUM</p>
      </div>
    </div>
  );
};
