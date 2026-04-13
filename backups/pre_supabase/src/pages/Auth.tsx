import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, ArrowRight, PawPrint, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Auth: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      console.error('Magic link error:', err);
      alert(err.message || 'Erro ao enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed -top-20 -left-20 w-80 h-80 bg-primary-fixed/20 rounded-full blur-[100px] -z-10" />
      <div className="fixed -bottom-20 -right-20 w-80 h-80 bg-secondary-fixed/20 rounded-full blur-[100px] -z-10" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-surface-container-lowest p-8 rounded-2xl shadow-xl border border-surface-container-high/50"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-primary-container rounded-2xl mb-6 shadow-inner">
            <PawPrint className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-headline">
            {t('magic_link_title')}
          </h1>
          <p className="text-on-surface-variant mt-2">
            {t('magic_link_subtitle')}
          </p>
        </div>

        {!sent ? (
          <form className="space-y-6" onSubmit={handleSendMagicLink}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">
                {t('magic_link_email_label')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
                  placeholder="hello@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t('magic_link_send_button')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-center text-xs text-on-surface-variant opacity-60">
              {t('magic_link_note')}
            </p>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="p-4 bg-primary-container rounded-full">
                <CheckCircle2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-headline mb-2">{t('magic_link_sent_title')}</h2>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {t('magic_link_sent_message')}
              </p>
              <p className="mt-2 text-sm font-bold text-primary">{email}</p>
            </div>
            <button
              onClick={() => setSent(false)}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('magic_link_resend')}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
