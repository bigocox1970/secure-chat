import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateWallet } from '../utils/wallet';
import { createUserProfile } from '../utils/supabase';
import { saveToSecureStorage, STORAGE_KEYS } from '../utils/encryption';
import { useUser } from '../context/UserContext';

export function SignUp() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletDetails, setWalletDetails] = useState<{ address: string; seed: string } | null>(null);
  const [seedCopied, setSeedCopied] = useState(false);
  const [status, setStatus] = useState<string>('');
  const navigate = useNavigate();
  const { setWalletAddress } = useUser();

  const handleGenerateWallet = async () => {
    setLoading(true);
    setError(null);
    setStatus('Generating your secure wallet...');
    
    try {
      // First generate the wallet
      const wallet = await generateWallet();
      setWalletDetails(wallet);
      
      // Store the wallet details immediately after generation
      saveToSecureStorage(STORAGE_KEYS.WALLET_ADDRESS, wallet.address);
      saveToSecureStorage(STORAGE_KEYS.PRIVATE_KEY, wallet.seed);
      setWalletAddress(wallet.address);
      
      setStatus('Creating user profile...');
      
      try {
        // Then try to create the profile
        await createUserProfile(wallet.address);
        setStatus('Wallet created successfully!');
      } catch (profileError) {
        console.error('Profile creation error:', profileError);
        // Profile creation failed, but wallet is already stored
        setError('Note: Failed to create user profile, but your wallet was generated successfully. You can still use it to send messages.');
      }
    } catch (err) {
      console.error('Wallet generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate wallet');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySeed = () => {
    if (walletDetails?.seed) {
      navigator.clipboard.writeText(walletDetails.seed);
      setSeedCopied(true);
    }
  };

  const handleContinue = () => {
    if (!seedCopied) {
      setError('Please copy and save your private key before continuing');
      return;
    }
    
    if (!walletDetails) {
      setError('No wallet details found. Please generate a wallet first.');
      return;
    }

    // Use hash-based navigation
    navigate('/chat');
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="font-bold mb-2">Create Your Secure Wallet</h1>
        
        {!walletDetails ? (
          <div>
            <div className="mb-2">
              <p>Your XRP wallet will be used to:</p>
              <ul className="list">
                <li>Identify you in the chat system</li>
                <li>Encrypt and decrypt your messages</li>
                <li>Send and receive XRP (optional)</li>
              </ul>
            </div>
            <button
              onClick={handleGenerateWallet}
              disabled={loading}
              className="button button-primary w-full"
            >
              {loading ? 'Generating...' : 'Generate XRP Wallet'}
            </button>
            {status && (
              <p className="text-sm text-gray mt-2">{status}</p>
            )}
          </div>
        ) : (
          <div>
            <div className="card">
              <h2 className="font-bold mb-2">Wallet Address:</h2>
              <p className="break-word">{walletDetails.address}</p>
              <p className="text-sm text-gray mt-2">
                This is your public address that others will use to send you messages and XRP.
              </p>
            </div>
            
            <div className="card">
              <h2 className="font-bold mb-2">Private Key (Secret):</h2>
              <p className="break-word text-mono">{walletDetails.seed}</p>
              <button
                onClick={handleCopySeed}
                className="text-blue mt-2"
              >
                {seedCopied ? '✓ Copied!' : 'Copy to clipboard'}
              </button>
              <p className="text-sm text-gray mt-2">
                This is your private key used to decrypt messages. Never share it with anyone!
              </p>
            </div>
            
            <div className="alert alert-warning">
              <p className="font-bold">⚠️ Important:</p>
              <ul className="list">
                <li>Save your private key in a secure location</li>
                <li>You'll need it to decrypt messages</li>
                <li>It cannot be recovered if lost</li>
                <li>Never share it with anyone</li>
              </ul>
            </div>
            
            <button
              onClick={handleContinue}
              className="button button-success w-full"
            >
              Continue to Chat
            </button>
          </div>
        )}
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
