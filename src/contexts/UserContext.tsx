import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

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

interface UserContextType {
  user: UserProfile;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const DEFAULT_USER: UserProfile = {
  name: 'Tutor MyPetCare',
  photo: null,
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
  // ref to prevent INITIAL_SESSION event from causing double profile loads
  const initialized = useRef(false);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[UserContext] loadProfile error:', error.message);
        // Still set a fallback user so the app doesn't stay blocked
        setUser(prev => prev.id === userId ? prev : { ...DEFAULT_USER, id: userId });
        return;
      }

      if (data) {
        setUser({
          id: data.id,
          name: data.name || DEFAULT_USER.name,
          photo: data.photo_url ?? null,
          phone: data.phone || '',
          pushEnabled: data.push_enabled || false,
          emailEnabled: data.email_enabled !== false,
          role: data.role === 'admin' ? 'admin' : 'user',
          active: data.active !== false,
        });
      } else {
        setUser({ ...DEFAULT_USER, id: userId });
      }
    } catch (err) {
      console.error('[UserContext] loadProfile unexpected error:', err);
      setUser({ ...DEFAULT_USER, id: userId });
    }
  };

  useEffect(() => {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    const resolveLoading = () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      setLoading(false);
      initialized.current = true;
    };

    const init = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[UserContext] getSession error:', error.message);
        } else {
          setSession(currentSession);
          if (currentSession?.user) {
            await loadProfile(currentSession.user.id);
          }
        }
      } catch (err) {
        console.error('[UserContext] init unexpected error:', err);
      } finally {
        // CRITICAL: always resolve loading, even on error
        resolveLoading();
      }
    };

    // Safety valve: force loading=false after 8s no matter what
    safetyTimer = setTimeout(() => {
      console.warn('[UserContext] Safety timeout: forcing loading=false after 8s');
      setLoading(false);
      initialized.current = true;
    }, 8000);

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Skip events that fire before init() completes (INITIAL_SESSION is handled by init)
        if (!initialized.current) return;

        // TOKEN_REFRESHED: just update session token, no need to reload profile
        if (event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          return;
        }

        // SIGNED_OUT
        if (event === 'SIGNED_OUT' || !newSession) {
          setUser(DEFAULT_USER);
          setSession(null);
          return;
        }

        // SIGNED_IN or USER_UPDATED: update session and reload profile
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        }
      }
    );

    return () => {
      if (safetyTimer) clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[UserContext] signOut error:', err);
    } finally {
      setUser(DEFAULT_USER);
      setSession(null);
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <UserContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
};