import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletDetails } from '../utils/wallet';
import { supabase } from '../utils/supabase';

interface WalletContextType {
  wallet: WalletDetails | null;
  setWallet: (wallet: WalletDetails | null) => void;
  loading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to load wallet from local storage on mount
    const storedWallet = localStorage.getItem('wallet');
    if (storedWallet) {
      try {
        setWallet(JSON.parse(storedWallet));
      } catch (err) {
        console.error('Failed to parse stored wallet:', err);
        setError('Failed to load stored wallet');
      }
    }
    setLoading(false);
  }, []);

  // Update local storage when wallet changes
  useEffect(() => {
    if (wallet) {
      localStorage.setItem('wallet', JSON.stringify(wallet));
    } else {
      localStorage.removeItem('wallet');
    }
  }, [wallet]);

  const value = {
    wallet,
    setWallet,
    loading,
    error
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
