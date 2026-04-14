import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      console.log("ROLE:", data.role);

      setUser({
        id: data.id,
        name: data.name || DEFAULT_USER.name,
        photo: data.photo_url,
        phone: data.phone || '',
        pushEnabled: data.push_enabled || false,
        emailEnabled: data.email_enabled !== false,
        role: data.role === 'admin' ? 'admin' : 'user',
        active: data.active !== false,
      });
    } else {
      setUser({ ...DEFAULT_USER, id: userId });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setSession(session);

      if (session?.user) {
        await loadProfile(session.user.id);
      }

      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setSession(session);

        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setUser(DEFAULT_USER);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(DEFAULT_USER);
    setSession(null);
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