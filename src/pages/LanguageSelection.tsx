import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PawPrint } from 'lucide-react';

export const LanguageSelection: React.FC = () => {
  const { setLanguage } = useLanguage();

  const languages = [
    { code: 'pt', label: 'Português', flag: '🇧🇷', sub: 'Padrão do app' },
    { code: 'en', label: 'English', flag: '🇺🇸', sub: 'Default language' },
    { code: 'es', label: 'Español', flag: '🇪🇸', sub: 'Idioma predeterminado' },
  ] as const;

  const changeNotes: Record<string, string> = {
    pt: 'Você pode mudar isso depois nas configurações.',
    en: 'You can change this later in settings.',
    es: 'Puedes cambiarlo más tarde en la configuración.',
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex p-4 bg-primary-container rounded-2xl mb-6 shadow-inner">
          <PawPrint className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold font-headline mb-2 text-on-surface">
          MyPetCare
        </h1>
        <p className="text-on-surface-variant mb-10 text-sm">
          Português · English · Español
        </p>

        <div className="space-y-4">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className="w-full flex items-center justify-between p-5 bg-surface-container-lowest rounded-xl shadow-sm hover:bg-primary-container hover:text-primary transition-all group border border-surface-container-high/30"
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{lang.flag}</span>
                <div className="text-left">
                  <span className="font-bold text-lg block">{lang.label}</span>
                  <span className="text-xs text-on-surface-variant group-hover:text-primary/70">{lang.sub}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="mt-8 text-xs text-on-surface-variant opacity-60">
          {changeNotes['pt']} · {changeNotes['en']}
        </p>
      </div>
    </div>
  );
};
