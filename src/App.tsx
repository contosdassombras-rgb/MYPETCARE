import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import { PetProvider } from './contexts/PetContext';
import { Layout } from './components/Layout';
import { usePushNotifications } from './hooks/usePushNotifications';
import { LanguageSelection } from './pages/LanguageSelection';

import { Dashboard } from './pages/Dashboard';
import { PetProfile } from './pages/PetProfile';
import { PetForm } from './pages/PetForm';
import { Agenda } from './pages/Agenda';
import { Professionals } from './pages/Professionals';
import { Settings } from './pages/Settings';
import { Veterinarian } from './pages/Veterinarian';
import { Reports } from './pages/Reports';
import { Symptoms } from './pages/Symptoms';
import { Admin } from './pages/Admin';
import { Auth } from './pages/Auth';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useUser } from './contexts/UserContext';

const AppRoutes: React.FC = () => {
  const { language } = useLanguage();
  const { user, session, loading: contextLoading, isAdmin } = useUser();
  const [safetyLoading, setSafetyLoading] = React.useState(true);

  // Safety Timeout to prevent infinite loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSafetyLoading(false);
    }, 4000); // 4 seconds max loading
    return () => clearTimeout(timer);
  }, []);

  usePushNotifications(); 

  const isAuthenticated = !!session;
  const isLoading = contextLoading && safetyLoading;
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!language) {
    return <LanguageSelection />;
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="pet/:id" element={<PetProfile />} />
        <Route path="pet/new" element={<PetForm />} />
        <Route path="pet/edit/:id" element={<PetForm />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="professionals" element={<Professionals />} />
        <Route path="vet" element={<Veterinarian />} />
        <Route path="reports" element={<Reports />} />
        <Route path="symptoms" element={<Symptoms />} />
        <Route path="profile" element={<Settings />} />
        
        {/* Admin Routes */}
        <Route 
          path="admin" 
          element={
            !isAuthenticated ? <Auth /> : 
            contextLoading ? (
              <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                <p className="text-sm font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">Verificando permissões...</p>
              </div>
            ) : 
            (() => {
              console.log('DEBUG: Admin Access Check', {
                email: session?.user.email,
                isAdmin: isAdmin,
                userRole: user.role
              });
              return isAdmin ? <Admin /> : <Navigate to="/" replace />;
            })()
          } 
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <UserProvider>
        <PetProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </PetProvider>
      </UserProvider>
    </LanguageProvider>
  );
}
