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
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setLoading(false);
          return;
        }

        setSession(initialSession);

        // If we have a session, load the profile
        if (initialSession?.user?.id) {
          await loadProfile(initialSession.user.id);
        } else {
          // No session = not authenticated, stop loading
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      setSession(newSession);

      if (event === 'SIGNED_IN' && newSession?.user?.id) {
        await loadProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(DEFAULT_USER);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && newSession?.user?.id) {
        await loadProfile(newSession.user.id);
      } else if (event === 'INITIAL_SESSION') {
        // Initial session already loaded above
        setLoading(false);
      }
    });

    // Safety timeout - force stop loading after 5 seconds
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Loading timeout reached');
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
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
        // Profile doesn't exist, create it
        const newProfile = {
          id: userId,
          name: DEFAULT_USER.name,
          photo_url: DEFAULT_USER.photo,
          phone: '',
          push_enabled: false,
          email_enabled: true,
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
      console.error('Profile load error:', err);
      setUser({
        ...DEFAULT_USER,
        id: userId,
      });
    } finally {
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

  return (
    <UserContext.Provider value={{ user, session, updateUser, resetPhoto, loading, isAdmin: user.role === 'admin' }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
