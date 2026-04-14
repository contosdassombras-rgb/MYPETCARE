import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { UserProvider } from './contexts/UserContext';
import { PetProvider } from './contexts/PetContext';
import { Layout } from './components/Layout';
import { usePushNotifications } from './hooks/usePushNotifications';

import { Dashboard } from './pages/Dashboard';
import { PetProfile } from './pages/PetProfile';
import { PetForm } from './pages/PetForm';
import { Agenda } from './pages/Agenda';
import { Professionals } from './pages/Professionals';
import { Settings } from './pages/Settings';
import { Veterinarian } from './pages/Veterinarian';
import { Reports } from './pages/Reports';
import { Symptoms } from './pages/Symptoms';
import Admin from './pages/Admin';
import { Auth } from './pages/Auth';
import { LanguageSelection } from './pages/LanguageSelection';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useUser } from './contexts/UserContext';
import { useLanguage } from './contexts/LanguageContext';

// ─── Error Boundary ──────────────────────────────────────────────────────────
// Captura erros fatais para evitar tela branca permanente
interface ErrorBoundaryState { hasError: boolean }
interface ErrorBoundaryProps { children: React.ReactNode }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Fatal error:', error);
    this.setState({ error });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-surface">
          <div className="w-20 h-20 bg-error/10 text-error rounded-3xl flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter mb-2">Ops! Algo deu errado.</h1>
          <p className="text-on-surface-variant max-w-xs mb-6">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>

          {this.state.error && (
            <div className="mb-8 p-4 bg-error/5 border border-error/10 rounded-2xl text-left overflow-auto max-w-sm">
              <p className="text-[10px] font-mono text-error font-bold mb-1 uppercase tracking-widest">Detalhes:</p>
              <code className="text-[10px] text-error opacity-70 break-all leading-tight">
                {this.state.error.toString()}
              </code>
            </div>
          )}

          <button
            onClick={() => { window.location.href = '/'; }}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20"
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => {
  const { session, loading: contextLoading } = useUser();
  const { language } = useLanguage();

  // Handle PWA Installation prompting
  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  // Push notifications — fully auth-gated and non-blocking inside the hook
  usePushNotifications();

  const isAuthenticated = !!session;

  // 1. Language Gate (Mandatory on first access)
  if (language === null) {
    return <LanguageSelection />;
  }

  // Wait for Supabase to resolve the session (max 8s via safety timeout in UserContext)
  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  // Not logged in → show auth screen
  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <Routes>
      {/* Admin panel */}
      <Route path="/admin" element={<Admin />} />

      {/* User area (inside Layout) */}
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
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <UserProvider>
          <PetProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </PetProvider>
        </UserProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
