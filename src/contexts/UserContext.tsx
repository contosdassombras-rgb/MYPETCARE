import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface UserProfile {
  id?: string;
  name: string;
  photo: string | null;
  phone: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  role: 'admin' | 'user';
  active: boolean;
}

import { Session } from '@supabase/supabase-js';

interface UserContextType {
  user: UserProfile;
  session: Session | null;
  updateUser: (updates: Partial<UserProfile>) => void;
  resetPhoto: () => void;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const DEFAULT_USER: UserProfile = {
  name: 'Tutor MyPetCare',
  photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  phone: '',
  pushEnabled: false,
  emailEnabled: true,
  role: 'user',
  active: true,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoadedIdRef = React.useRef<string | null>(null);

  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Função única para lidar com mudança de sessão
    const handleSesssionChange = async (newSession: Session | null, event: string) => {
      if (!isMounted.current) return;
      
      const userId = newSession?.user?.id;
      console.log(`DEBUG: Auth Event [${event}] - User: ${userId || 'none'}`);

      // Se não houver usuário, reseta e para
      if (!userId) {
        setSession(null);
        setUser(DEFAULT_USER);
        setLoading(false);
        lastLoadedIdRef.current = null;
        return;
      }

      setSession(newSession);

      // Evita carregar o mesmo perfil várias vezes se o ID for o mesmo
      // Exceto em eventos explícitos de login ou atualização de token
      if (lastLoadedIdRef.current === userId && event === 'INITIAL_SESSION') {
        console.log("DEBUG: Profile already loaded for this ID. Skipping.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        await loadProfile(userId);
        lastLoadedIdRef.current = userId;
      } catch (err) {
        console.error("DEBUG: Failed to handle session change:", err);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    // 1. Iniciar listener de Auth (que dispara INITIAL_SESSION imediatamente)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      await handleSesssionChange(currentSession, event);
    });

    // 2. Fallback manual apenas se o listener demorar ou falhar
    const checkInitialSession = async () => {
      const { data: { session: s } } = await supabase.auth.getSession();
      if (isMounted.current && !lastLoadedIdRef.current && s?.user?.id) {
        console.log("DEBUG: Manual session fallback check triggered.");
        await handleSesssionChange(s, 'MANUAL_CHECK');
      }
    };
    checkInitialSession();

    // 3. Safety timeout para não travar o app - aumentado para 10s para estabilidade
    const timeout = setTimeout(() => {
      if (isMounted.current && loading) {
        console.warn('DEBUG: Auth safety timeout reached');
        setLoading(false);
      }
    }, 10000);

    return () => {
      isMounted.current = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log("DEBUG: Loading profile for ID:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        console.log("DEBUG ROLE:", data.role);
        
        const profileData: UserProfile = {
          id: data.id,
          name: data.name || DEFAULT_USER.name,
          photo: data.photo_url || DEFAULT_USER.photo,
          phone: data.phone || '',
          pushEnabled: data.push_enabled || false,
          emailEnabled: data.email_enabled !== false,
          role: data.role === 'admin' ? 'admin' : 'user',
          active: data.active !== false,
        };
        
        setUser(profileData);
      } else {
        console.warn("DEBUG: Profile not found. Defaulting to user role...");
        setUser({ ...DEFAULT_USER, id: userId, role: 'user' });
      }
    } catch (err) {
      console.error('DEBUG: Profile load error:', err);
      // Mantemos o usuário anterior ou default se falhar feio
      if (!user.id) {
        setUser({ ...DEFAULT_USER, id: userId });
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log("DEBUG: Executing explicit SignOut...");
      
      // 1. Limpeza IMEDIATA do estado local para feedback visual instantâneo
      setSession(null);
      setUser(DEFAULT_USER);
      setLoading(false);

      // 2. Limpeza agressiva do localStorage antes de tentar a rede
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase.auth.token') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // 3. Tentar deslogar do servidor (sem bloquear a UI)
      await supabase.auth.signOut().catch(err => {
        console.warn("DEBUG: Remote SignOut failed, but local cleared:", err);
      });

      console.log("DEBUG: SignOut complete.");
    } catch (err) {
      console.error("DEBUG: Fatal error during SignOut:", err);
    } finally {
      // Garantia final de que o app não ficará em loading
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const userId = currentSession?.user.id;

      if (userId) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name || null;
        if (updates.photo !== undefined) dbUpdates.photo_url = updates.photo || null;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone || '';
        if (updates.pushEnabled !== undefined) dbUpdates.push_enabled = updates.pushEnabled;
        if (updates.emailEnabled !== undefined) dbUpdates.email_enabled = updates.emailEnabled;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        const { error } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId);

        if (error) console.error('Update error:', error);
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const resetPhoto = () => {
    updateUser({ photo: DEFAULT_USER.photo });
  };

  const isAdmin = user.role === 'admin';

  return (
    <UserContext.Provider value={{ user, session, updateUser, resetPhoto, signOut, loading, isAdmin }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
