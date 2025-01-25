import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useWallet } from '../context/WalletContext';
import { createUserProfile, loginUser } from '../utils/supabase';
import { generateWallet, validateWalletSeed } from '../utils/wallet';

export function SignUp() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletDetails, setWalletDetails] = useState<{ address: string; seed: string } | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser();
  const { setWallet } = useWallet();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // First generate XRP wallet
      const newWallet = await generateWallet();
      setWalletDetails(newWallet);
      
      // Create user profile in Supabase with wallet address
      const { data: profile, error: profileError } = await createUserProfile(
        username,
        newWallet.address,
        email
      );
      
      if (profileError) throw profileError;
      if (!profile) throw new Error('Failed to create profile');

      // Set wallet in context
      setWallet({
        address: newWallet.address,
        seed: newWallet.seed
      });

      // Set user in context
      setUser({
        id: profile.id,
        username,
        email,
        isEncrypted: false
      });
      
      // Navigate to chat
      navigate('/chat');
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
      setWalletDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!seed.trim()) {
      setError('Please enter your wallet seed');
      setLoading(false);
      return;
    }

    try {
      const { data: profile, error: loginError } = await loginUser(username, email);
      
      if (loginError) throw loginError;
      if (!profile) throw new Error('Failed to login');
      if (!profile.xrp_address) throw new Error('No wallet address found for this account');

      // Validate the provided seed matches the wallet address
      if (!validateWalletSeed(seed.trim(), profile.xrp_address)) {
        throw new Error('Invalid wallet seed');
      }

      // Set user in context
      setUser({
        id: profile.id,
        username: profile.username,
        email: profile.email || '',
        isEncrypted: profile.is_encrypted || false
      });

      // Set wallet in context with seed
      setWallet({
        address: profile.xrp_address,
        seed: seed.trim()
      });

      // Navigate to chat
      navigate('/chat');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-[#222e35]">
      <div className="w-[420px] p-8 bg-[#111b21] rounded-lg shadow-xl">
        <div className="text-center mb-8">
          <div className="mb-6">
            <svg viewBox="0 0 39 39" width="39" height="39" fill="none" className="mx-auto">
              <path d="M10.7 32.8l.6.3c2.5 1.5 5.3 2.2 8.1 2.2 8.8 0 16-7.2 16-16 0-4.2-1.7-8.3-4.7-11.3s-7-4.7-11.3-4.7c-8.8 0-16 7.2-15.9 16.1 0 3 .9 5.9 2.4 8.4l.4.6-1.6 5.9 6-1.5z" fill="#00a884"></path>
              <path d="M32.4 6.4C29 2.9 24.3 1 19.5 1 9.3 1 1.1 9.3 1.2 19.4c0 3.2.9 6.3 2.4 9.1L1 38l9.7-2.5c2.7 1.5 5.7 2.2 8.7 2.2 10.1 0 18.3-8.3 18.3-18.4 0-4.9-1.9-9.5-5.3-12.9zM19.5 34.6c-2.7 0-5.4-.7-7.7-2.1l-.6-.3-5.8 1.5L6.9 28l-.4-.6c-4.4-7.1-2.3-16.5 4.9-20.9s16.5-2.3 20.9 4.9 2.3 16.5-4.9 20.9c-2.3 1.5-5.1 2.3-7.9 2.3zm8.8-11.1l-1.1-.5s-1.6-.7-2.6-1.2c-.1 0-.2-.1-.3-.1-.3 0-.5.1-.7.2 0 0-.1.1-1.5 1.7-.1.2-.3.3-.5.3h-.1c-.1 0-.3-.1-.4-.2l-.5-.2c-1.1-.5-2.1-1.1-2.9-1.9-.2-.2-.5-.4-.7-.6-.7-.7-1.4-1.5-1.9-2.4l-.1-.2c-.1-.1-.1-.2-.2-.4 0-.2 0-.4.1-.5 0 0 .4-.5.7-.8.2-.2.3-.5.5-.7.2-.3.3-.7.2-1-.1-.5-1.3-3.2-1.6-3.8-.2-.3-.4-.4-.7-.5h-1.1c-.2 0-.4.1-.6.1l-.1.1c-.2.1-.4.3-.6.4-.2.2-.3.4-.5.6-.7.9-1.1 2-1.1 3.1 0 .8.2 1.6.5 2.3l.1.3c.9 1.9 2.1 3.6 3.7 5.1l.4.4c.3.3.6.5.8.8 2.1 1.8 4.5 3.1 7.2 3.8.3.1.7.1 1 .2h1c.5 0 1.1-.2 1.5-.4.3-.2.5-.2.7-.4l.2-.2c.2-.2.4-.3.6-.5s.4-.4.5-.6c.2-.4.3-.9.4-1.4v-.7s-.1-.1-.3-.2z" fill="#00a884"></path>
            </svg>
          </div>
          <h1 className="text-[28px] text-[#e9edef] font-light mb-3">
            {isLogin ? 'Log in to WhatsApp' : 'Sign up for WhatsApp'}
          </h1>
          <p className="text-[#8696a0] text-[14px] leading-[20px] mb-8">
            {isLogin ? 'Enter your details to continue chatting' : 'Enter your details to start chatting'}
          </p>
        </div>

        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              autoComplete="username"
              className="w-full py-2 px-4 bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] rounded-lg focus:outline-none"
            />
          </div>
          
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="email"
              className="w-full py-2 px-4 bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] rounded-lg focus:outline-none"
            />
          </div>

          {isLogin && (
            <div>
              <input
                type="password"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Wallet Seed"
                required
                autoComplete="current-password"
                className="w-full py-2 px-4 bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] rounded-lg focus:outline-none"
              />
              <p className="text-[#8696a0] text-xs mt-1 px-1">
                Enter the seed phrase you saved during signup
              </p>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm px-1">
              {error}
            </div>
          )}

          {!isLogin && walletDetails && (
            <div className="bg-[#2a3942] p-4 rounded-lg">
              <p className="text-[#00a884] text-sm font-medium mb-2">XRP Wallet Generated!</p>
              <p className="text-[#8696a0] text-sm break-all">
                Address: {walletDetails.address}
              </p>
              <p className="text-[#8696a0] text-sm break-all mt-1">
                Seed: {walletDetails.seed}
              </p>
              <p className="text-[#d1d7db] text-xs mt-2">
                ⚠️ Save these details securely. You'll need them to access your wallet.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !email || (isLogin && !seed)}
            className={`w-full py-2 rounded-lg font-medium ${
              loading || !username || !email || (isLogin && !seed)
                ? 'bg-[#374045] text-[#8696a0] cursor-not-allowed'
                : 'bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]'
            }`}
          >
            {loading 
              ? (isLogin ? 'Logging in...' : 'Creating Account...') 
              : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setWalletDetails(null);
              setSeed('');
            }}
            className="text-[#00a884] text-sm hover:text-[#06cf9c] focus:outline-none"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
          {!isLogin && (
            <p className="text-[#8696a0] text-sm mt-4">
              An XRP wallet will be generated for you automatically
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
