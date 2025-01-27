import React, { createContext, useContext, useState, useEffect } from 'react';
import { WalletDetails } from '../utils/wallet';
import { supabase, saveWallet } from '../utils/supabase';

interface WalletContextType {
  wallets: WalletDetails[];
  currentWallet: WalletDetails | null;
  setCurrentWallet: (wallet: WalletDetails | null) => void;
  addWallet: (wallet: WalletDetails & { userId: string }) => Promise<{ error: Error | null }>;
  deleteWallet: (address: string) => void;
  loading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<WalletDetails[]>([]);
  const [currentWallet, setCurrentWallet] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load wallets from Supabase
  const loadWallets = async (userId: string) => {
    try {
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId);

      if (walletError) throw walletError;
      if (walletData) {
        // Convert wallets to WalletDetails format
        const wallets = walletData.map(w => ({
          address: w.address,
          seed: w.encrypted_private_key // Note: Should be decrypted in production
        }));
        setWallets(wallets);
        if (wallets.length > 0) {
          setCurrentWallet(wallets[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load wallets:', err);
      setError('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeWallet = async () => {
      // Try to get user ID from local storage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user.id) {
            console.log('User ID found, loading wallets...');
            await loadWallets(user.id);
          } else {
            console.warn('User ID not found in stored user data');
          }
        } catch (err) {
          console.warn('Failed to parse stored user:', err);
        }
      } else {
        console.log('No user data found in local storage');
      }
      setLoading(false);
    };

    initializeWallet();
  }, []);

  // Add a new useEffect to log when currentWallet changes
  useEffect(() => {
    console.log('Current wallet updated:', currentWallet);
  }, [currentWallet]);

  // Update local storage when wallets change
  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);

  // Update local storage when current wallet changes
  useEffect(() => {
    if (currentWallet) {
      localStorage.setItem('currentWallet', JSON.stringify(currentWallet));
    } else {
      localStorage.removeItem('currentWallet');
    }
  }, [currentWallet]);

  const addWallet = async (wallet: WalletDetails & { userId: string }): Promise<{ error: Error | null }> => {
    try {
      // Check if a wallet already exists
      const { data: existingWallets, error: existingWalletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', wallet.userId);

      if (existingWalletError) throw existingWalletError;

      if (existingWallets && existingWallets.length > 0) {
        console.warn('Wallet already exists for user:', wallet.userId);
        return { error: new Error('Wallet already exists') };
      }

      // Save to Supabase using the saveWallet function
      const { data: savedWallet, error: walletError } = await saveWallet({
        userId: wallet.userId,
        address: wallet.address,
        seed: wallet.seed,
        name: wallet.name || 'Primary Wallet'
      });

      if (walletError) throw walletError;
      if (!savedWallet) throw new Error('Failed to save wallet');

      // Update local state
      const newWallet = { address: wallet.address, seed: wallet.seed };
      setWallets([newWallet]);
      setCurrentWallet(newWallet);

      return { error: null };
    } catch (err) {
      console.error('Failed to save wallet:', err);
      setError('Failed to save wallet');
      return { error: err instanceof Error ? err : new Error('Failed to save wallet') };
    }
  };

  const deleteWallet = async (address: string) => {
    try {
      // Delete from Supabase
      const { error: walletError } = await supabase
        .from('wallets')
        .delete()
        .eq('address', address);

      if (walletError) throw walletError;

      // Update local state
      setWallets(prev => prev.filter(w => w.address !== address));
      if (currentWallet?.address === address) {
        const remaining = wallets.filter(w => w.address !== address);
        setCurrentWallet(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete wallet:', err);
      setError('Failed to delete wallet');
    }
  };

  const value = {
    wallets,
    currentWallet,
    setCurrentWallet,
    addWallet,
    deleteWallet,
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
