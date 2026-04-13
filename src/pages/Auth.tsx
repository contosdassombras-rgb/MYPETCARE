import React, { useState } from 'react';
import * as m from 'motion/react';
const { motion, AnimatePresence } = m;
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, ArrowRight, PawPrint, CheckCircle2, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

type AuthMode = 'magic_link' | 'password' | 'signup';

export const Auth: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [mode, setMode] = useState<AuthMode>('password');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    
    setLoading(true);
    try {
      if (mode === 'magic_link') {
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        setSent(true);
      } else if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw new Error(t('invalid_credentials'));
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        alert(t('magic_link_sent_message'));
        setMode('password');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      alert(err.message || 'Erro ao autenticar. Tente novamente.');
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
        className="w-full max-w-md bg-surface-container-lowest p-10 rounded-[3rem] shadow-2xl border border-surface-container-high/50"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-5 bg-primary-container rounded-[2rem] mb-6 shadow-xl shadow-primary/10">
            <PawPrint className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter font-headline leading-none mb-4">
            {mode === 'signup' ? t('register_title') : t('login_title')}
          </h1>
          <p className="text-on-surface-variant font-medium opacity-60">
            {mode === 'magic_link' ? t('magic_link_subtitle') : t('welcome_message')}
          </p>
        </div>

        {!sent ? (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">
                  {t('magic_link_email_label')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-14 pr-5 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                    placeholder="hello@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <AnimatePresence>
                {(mode === 'password' || mode === 'signup') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">
                      {t('password')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-14 pr-14 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant opacity-40 hover:opacity-100 transition-opacity"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full py-6 rounded-2xl text-xl font-black tracking-tighter shadow-2xl shadow-primary/20"
            >
              {mode === 'magic_link' ? t('magic_link_send_button') : (mode === 'signup' ? t('sign_up') : t('login_with_password'))}
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>

            <div className="pt-6 border-t border-surface-container-high/30 space-y-4">
              <div className="flex flex-col gap-2">
                {mode !== 'password' && (
                  <button
                    type="button"
                    onClick={() => setMode('password')}
                    className="text-sm font-bold text-primary hover:underline transition-all"
                  >
                    {t('login_with_password')}
                  </button>
                )}
                {mode !== 'magic_link' && (
                  <button
                    type="button"
                    onClick={() => setMode('magic_link')}
                    className="text-sm font-bold text-primary hover:underline transition-all"
                  >
                    {t('login_with_magic_link')}
                  </button>
                )}
              </div>
              
              <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-surface-container-high/30">
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      // Sign in with the manually confirmed test account
                      const testEmail = 'marcellolachi111@gmail.com';
                      const testPass = 'teste123';
                      
                      const { error } = await supabase.auth.signInWithPassword({
                        email: testEmail,
                        password: testPass
                      });
                      
                      if (error) throw error;
                    } catch (err: any) {
                      console.error('Bypass error:', err);
                      alert('Erro no acesso direto: ' + (err.message || 'Verifique sua conexão.'));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full py-4 bg-secondary-fixed text-on-secondary-fixed rounded-2xl font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/20"
                >
                  {t('direct_access')}
                </button>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-on-surface-variant opacity-60">
                    {mode === 'signup' ? 'Já tem uma conta?' : t('dont_have_account')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signup' ? 'password' : 'signup')}
                    className="text-xs font-extrabold text-primary px-4 py-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-all"
                  >
                    {mode === 'signup' ? t('login_title') : t('sign_up')}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="p-6 bg-primary-container rounded-full shadow-inner">
                <CheckCircle2 className="w-16 h-16 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black font-headline mb-3 tracking-tighter">{t('magic_link_sent_title')}</h2>
              <p className="text-on-surface-variant font-medium leading-relaxed opacity-70">
                {t('magic_link_sent_message')}
              </p>
              <p className="mt-4 px-6 py-3 bg-surface-container-low rounded-xl text-lg font-black text-primary inline-block">
                {email}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button
                variant="ghost"
                onClick={() => setSent(false)}
                className="text-primary font-black"
              >
                {t('magic_link_resend')}
              </Button>
              <button
                onClick={() => { setSent(false); setMode('password'); }}
                className="text-xs font-bold text-on-surface-variant opacity-60 hover:opacity-100 hover:underline"
              >
                {t('login_with_password')}
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
