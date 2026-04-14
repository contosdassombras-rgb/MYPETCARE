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

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log("DEBUG: Initializing Auth Session...");
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }

        setSession(initialSession);

        if (initialSession?.user?.id) {
          console.log("DEBUG: Session found for user:", initialSession.user.id);
          await loadProfile(initialSession.user.id);
        } else {
          console.log("DEBUG: No session found. Loading = false.");
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      console.log("DEBUG: Auth State Changed Event:", event);
      setSession(newSession);

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && newSession?.user?.id) {
        setLoading(true);
        await loadProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(DEFAULT_USER);
        setLoading(false);
      } else if (event === 'INITIAL_SESSION') {
        if (newSession?.user?.id) {
          await loadProfile(newSession.user.id);
        } else {
          setLoading(false);
        }
      }
    });

    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('DEBUG: Auth safety timeout reached');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
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
        
        console.log("DEBUG: Profile Loaded Successfully", {
          id: data.id,
          role: profileData.role,
          email: session?.user.email || 'pending...'
        });
        
        setUser(profileData);
      } else {
        console.log("DEBUG: Profile not found. Creating default...");
        const newProfile = {
          id: userId,
          name: DEFAULT_USER.name,
          photo_url: DEFAULT_USER.photo,
          role: 'user',
          active: true,
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([newProfile]);

        if (insertError) throw insertError;

        setUser({
          ...DEFAULT_USER,
          id: userId,
        });
      }
    } catch (err) {
      console.error('DEBUG: Profile load error:', err);
      setUser({
        ...DEFAULT_USER,
        id: userId,
      });
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
