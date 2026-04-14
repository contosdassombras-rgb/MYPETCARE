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

    const handleSession = async (currentSession: Session | null) => {
      if (!isMounted.current) return;

      const userId = currentSession?.user?.id;

      if (!userId) {
        setSession(null);
        setUser(DEFAULT_USER);
        setLoading(false);
        lastLoadedIdRef.current = null;
        return;
      }

      // evita loop
      if (lastLoadedIdRef.current === userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        setSession(currentSession);

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

          setUser({
            id: data.id,
            name: data.name || DEFAULT_USER.name,
            photo: data.photo_url || DEFAULT_USER.photo,
            phone: data.phone || '',
            pushEnabled: data.push_enabled || false,
            emailEnabled: data.email_enabled !== false,
            role: data.role === 'admin' ? 'admin' : 'user',
            active: data.active !== false,
          });
        } else {
          setUser({ ...DEFAULT_USER, id: userId });
        }

        lastLoadedIdRef.current = userId;

      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        setUser({ ...DEFAULT_USER, id: userId });
      } finally {
        setLoading(false);
      }
    };

    // listener principal
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        await handleSession(currentSession);
      }
    );

    // inicial
    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session);
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setSession(null);
      setUser(DEFAULT_USER);
      setLoading(false);

      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      await supabase.auth.signOut().catch(() => {});
    } catch (err) {
      console.error(err);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const userId = currentSession?.user.id;

      if (userId) {
        const dbUpdates: any = {};

        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.photo !== undefined) dbUpdates.photo_url = updates.photo;
        if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
        if (updates.pushEnabled !== undefined) dbUpdates.push_enabled = updates.pushEnabled;
        if (updates.emailEnabled !== undefined) dbUpdates.email_enabled = updates.emailEnabled;
        if (updates.role !== undefined) dbUpdates.role = updates.role;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', userId);
      }
    } catch (err) {
      console.error(err);
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