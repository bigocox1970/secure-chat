import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  isEncrypted: boolean;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  upgradeToEncrypted: () => void;
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

  const value = {
    user,
    isAuthenticated: !!user,
    setUser,
    upgradeToEncrypted,
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
