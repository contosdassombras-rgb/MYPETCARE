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
    // Initial Session Load
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        if (initialSession?.user) {
          await loadProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error('Initial auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      if (currentSession?.user) {
        await loadProfile(currentSession.user.id);
      } else {
        setUser(DEFAULT_USER);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }
      if (data) {
        console.log('DEBUG: Profile loaded from DB:', {
          id: data.id,
          email: session?.user.email,
          role: data.role,
          active: data.active
        });

        setUser({
          id: data.id,
          name: data.name || DEFAULT_USER.name,
          photo: data.photo_url || DEFAULT_USER.photo,
          phone: data.phone || '',
          pushEnabled: data.push_enabled,
          emailEnabled: data.email_enabled,
          role: data.role as 'admin' | 'user' || 'user',
          active: data.active ?? true,
        });
      } else {
        // Create profile if it doesn't exist
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
          id: userId,
          name: newProfile.name,
          photo: newProfile.photo_url,
          phone: newProfile.phone,
          pushEnabled: newProfile.push_enabled,
          emailEnabled: newProfile.email_enabled,
          role: newProfile.role as 'admin' | 'user',
          active: newProfile.active,
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));

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

      if (error) console.error('Error updating profile in DB:', error);
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
