import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFromSecureStorage, STORAGE_KEYS } from '../utils/encryption';
import { getBalance } from '../utils/wallet';

interface UserContextType {
  walletAddress: string | null;
  balance: string | null;
  isAuthenticated: boolean;
  setWalletAddress: (address: string | null) => void;
  updateBalance: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Export the provider component as default
export default function UserProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const savedAddress = getFromSecureStorage(STORAGE_KEYS.WALLET_ADDRESS);
    if (savedAddress) {
      setWalletAddress(savedAddress);
      setIsAuthenticated(true);
      updateBalance();
    }
  }, []);

  const updateBalance = async () => {
    if (walletAddress) {
      try {
        const newBalance = await getBalance(walletAddress);
        setBalance(newBalance);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(null);
      }
    }
  };

  useEffect(() => {
    if (walletAddress) {
      setIsAuthenticated(true);
      updateBalance();
    } else {
      setIsAuthenticated(false);
      setBalance(null);
    }
  }, [walletAddress]);

  const value = {
    walletAddress,
    balance,
    isAuthenticated,
    setWalletAddress,
    updateBalance,
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
