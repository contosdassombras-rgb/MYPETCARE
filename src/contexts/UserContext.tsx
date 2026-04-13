import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id?: string;
  name: string;
  photo: string | null;
  phone: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  resetPhoto: () => void;
  loading: boolean;
}

const DEFAULT_USER: UserProfile = {
  name: 'Tutor MyPetCare',
  photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  phone: '',
  pushEnabled: false,
  emailEnabled: true,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth changes to load/reset profile
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setUser(DEFAULT_USER);
        setLoading(false);
      }
    });

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Bypass ID for development speed/direct access
      const devModeId = '24b2f3ec-aca9-4eaf-8e36-a8538a274c7f';
      if (user) loadProfile(user.id);
      else loadProfile(devModeId);
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
        setUser({
          id: data.id,
          name: data.name || DEFAULT_USER.name,
          photo: data.photo_url || DEFAULT_USER.photo,
          phone: data.phone || '',
          pushEnabled: data.push_enabled,
          emailEnabled: data.email_enabled,
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

    const session = await supabase.auth.getSession();
    const devModeId = '24b2f3ec-aca9-4eaf-8e36-a8538a274c7f';
    const userId = session.data.session?.user.id || devModeId;

    if (userId) {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name || null;
      if (updates.photo !== undefined) dbUpdates.photo_url = updates.photo || null;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone || '';
      if (updates.pushEnabled !== undefined) dbUpdates.push_enabled = updates.pushEnabled;
      if (updates.emailEnabled !== undefined) dbUpdates.email_enabled = updates.emailEnabled;

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
    <UserContext.Provider value={{ user, updateUser, resetPhoto, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
