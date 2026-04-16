import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LayoutDashboard, Calendar, MapPin, User, Plus, ArrowLeft, LogOut, Shield } from 'lucide-react';
import * as m from 'motion/react';
const { motion, AnimatePresence } = m;
import { useLanguage } from '../contexts/LanguageContext';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabaseClient';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

export const Layout: React.FC = () => {
  const { t } = useLanguage();
  const { user, isAdmin, signOut } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === '/';

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: Calendar, label: t('agenda'), path: '/agenda' },
    { icon: MapPin, label: t('clinics'), path: '/professionals' },
    { icon: User, label: t('profile'), path: '/profile' },
  ];



  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-72 bg-surface-container-lowest border-r border-surface-container-high/30 fixed h-full z-50">
        <div className="p-8">
          <Link to="/" className="text-2xl font-black text-primary tracking-tighter font-headline flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-on-primary text-sm">MP</span>
            </div>
            MyPetCare
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all duration-200 group',
                  isActive 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                )}
              >
                <item.icon className={cn('w-6 h-6 transition-transform group-hover:scale-110', isActive && 'fill-on-primary/10')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-surface-container-low rounded-3xl p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-fixed shadow-sm shrink-0">
              <img
                src={user.photo || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100'}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-on-surface truncate">{user.name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black opacity-60">{isAdmin ? 'Admin' : 'Tutor'}</p>
            </div>
            <button 
              onClick={signOut}
              className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
              title={t('logout')}
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:pl-72">
        {/* Top Bar */}
        <header className="fixed top-0 right-0 left-0 md:left-72 z-40 glass-nav border-b border-surface-container-high/30">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              {!isHome && (
                <button
                  onClick={() => navigate('/')}
                  className="p-2 -ml-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors flex items-center justify-center"
                  aria-label={t('back')}
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <h2 className="text-sm font-bold text-on-surface-variant md:hidden">MyPetCare</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/profile?tab=notifications')}
                className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors relative"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
              </button>

              <button 
                onClick={signOut}
                className="md:hidden p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                title={t('logout')}
              >
                <LogOut className="w-6 h-6" />
              </button>
              
              <Link to="/profile" className="md:hidden w-10 h-10 rounded-full overflow-hidden border-2 border-primary-fixed">
                <img
                  src={user.photo || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100'}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </Link>

              <Button 
                variant="primary" 
                size="md" 
                className="hidden md:flex" 
                onClick={() => navigate('/pet/new')}
              >
                <Plus className="w-5 h-5" />
                {t('add_pet')}
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow pt-24 pb-32 md:pb-12 px-4 md:px-8">
          <Outlet />
        </main>

        {/* Bottom Nav (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full glass-nav z-50 rounded-t-3xl shadow-2xl border-t border-surface-container-high/30 backdrop-blur-xl">
          <div className="flex justify-around items-center px-4 pb-8 pt-4">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex flex-col items-center justify-center transition-all duration-300 relative',
                    isActive ? 'text-primary scale-110' : 'text-on-surface-variant opacity-40'
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="nav-pill"
                      className="absolute -top-1 w-8 h-1 bg-primary rounded-full"
                    />
                  )}
                  <item.icon className={cn('w-6 h-6 mb-1', isActive && 'fill-primary/20')} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* FAB (Mobile Only) - Only on Dashboard as requested by user */}
        {location.pathname === '/' && (
          <Button
            onClick={() => navigate('/pet/new')}
            className="md:hidden fixed bottom-28 right-6 w-16 h-16 rounded-2xl shadow-2xl z-40 active:scale-90"
            aria-label={t('add_pet')}
          >
            <Plus className="w-10 h-10" />
          </Button>
        )}
      </div>
    </div>
  );
};
