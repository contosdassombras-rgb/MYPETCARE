import React, { useState } from 'react';
import * as m from 'motion/react';
const { motion, AnimatePresence } = m;
import { useLanguage } from '../contexts/LanguageContext';
import { Mail, ArrowRight, PawPrint, Loader2, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/Button';

const TUTOR_DEFAULT_PASSWORD = 'mypetcare@2024';

export const Auth: React.FC = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    
    setLoading(true);
    try {
      // Se for AdminMode, usa a senha digitada. 
      // Se for Tutor (padrão), usa a senha mypetcare@2024 de forma transparente.
      const passToUse = isAdminMode ? password : TUTOR_DEFAULT_PASSWORD;

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: passToUse
      });

      if (error) {
        if (isAdminMode) {
          throw new Error('E-mail ou senha administrativos incorretos.');
        } else {
          throw new Error('Este e-mail ainda não está liberado ou não foi encontrado.');
        }
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
      {/* Background Blobs */}
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
            {isAdminMode ? 'Painel Admin' : t('login_title')}
          </h1>
          <p className="text-on-surface-variant font-medium opacity-60">
            {isAdminMode 
              ? 'Área restrita para administradores.' 
              : 'Digite seu e-mail para acessar seus pets.'}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] ml-2">
                E-mail de Acesso
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant opacity-40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-14 pr-5 py-5 bg-surface-container-low border-none rounded-2xl focus:ring-4 focus:ring-primary/20 outline-none transition-all font-bold text-lg"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password (Only for Admin) */}
            <AnimatePresence>
              {isAdminMode && (
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
            {isAdminMode ? 'Entrar no Admin' : 'Acesse Agora'}
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>

          <div className="pt-6 border-t border-surface-container-high/30 flex flex-col items-center">
            <button
              type="button"
              onClick={() => {
                setIsAdminMode(!isAdminMode);
                setPassword('');
              }}
              className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
            >
              <Shield className="w-4 h-4" />
              {isAdminMode ? 'Voltar para Acesso Tutor' : 'Entrar como Administrador'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
