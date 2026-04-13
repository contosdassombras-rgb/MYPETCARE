import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
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
}

const DEFAULT_USER: UserProfile = {
  name: 'Tutor MyPetCare',
  photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  phone: '',
  pushEnabled: localStorage.getItem('mypetcare_push') === 'true',
  emailEnabled: localStorage.getItem('mypetcare_email') !== 'false',
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('mypetcare_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  useEffect(() => {
    localStorage.setItem('mypetcare_user', JSON.stringify(user));
    localStorage.setItem('mypetcare_push', String(user.pushEnabled));
    localStorage.setItem('mypetcare_email', String(user.emailEnabled));
  }, [user]);

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const resetPhoto = () => {
    setUser(prev => ({ ...prev, photo: DEFAULT_USER.photo }));
  };

  return (
    <UserContext.Provider value={{ user, updateUser, resetPhoto }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};
