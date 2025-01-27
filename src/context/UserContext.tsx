import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface User {
  id: string;
  username: string;
  email: string;
  isEncrypted: boolean;
  allowPasswordLogin?: boolean;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  upgradeToEncrypted: () => void;
  logout: () => void;
  togglePasswordLogin: (enabled: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Export the provider component as default
export default function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const upgradeToEncrypted = () => {
    if (user) {
      setUser({ ...user, isEncrypted: true });
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const togglePasswordLogin = async (enabled: boolean) => {
    if (user) {
      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ allow_password_login: enabled })
        .eq('id', user.id);

      if (error) {
        console.error('Failed to update password login setting:', error);
        return;
      }

      // Update in context
      setUser({ ...user, allowPasswordLogin: enabled });
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    setUser,
    upgradeToEncrypted,
    logout,
    togglePasswordLogin,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Export the hook separately
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
