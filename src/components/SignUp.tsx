import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../utils/supabase';
import { generateWallet } from '../utils/wallet';

import { WalletDetails } from '../utils/wallet';

export function SignUp() {
  const clearLocalStorageAndState = () => {
    localStorage.clear();
    setUsername('');
    setEmail('');
    setPassword('');
    setSeed('');
    setError(null);
    setCurrentWallet(null);
    setUser(null);
  };

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [seed, setSeed] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(false);
  const navigate = useNavigate();
  const { setCurrentWallet, addWallet } = useWallet();
  const { setUser } = useUser();

  useEffect(() => {
    // Clear all form data and state when component mounts
    clearLocalStorageAndState();
    setUsername('');
    setEmail('');
    setPassword('');
    setSeed('');
    setError(null);
    setIsLogin(false);
    
    // Check if the browser is auto-filling the email field after clearing state
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    if (emailInput && emailInput.value) {
      setEmail(emailInput.value);
    }
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email.trim()) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      // Check if user already exists
      const { data: existingUsers, error: userCheckError } = await supabase
        .from('profiles')
        .select('id, username, email')
        .or(`username.eq."${username}",email.eq."${email}"`);

      if (userCheckError) {
        console.error('Error checking existing users:', userCheckError);
        throw new Error('An error occurred while checking user existence');
      }

      if (existingUsers && existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.username === username) {
          throw new Error('Username already exists');
        } else if (existingUser.email === email) {
          throw new Error('Email already exists');
        } else {
          throw new Error('Username or email already exists');
        }
      }

      console.log('User check passed, proceeding with signup');

      // Create user profile with password
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          username, 
          email, 
          password, 
          allow_password_login: true 
        }])
        .select()
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Failed to create profile');

      // Set user in context and localStorage
      const userData = {
        id: profile.id,
        username,
        email,
        isEncrypted: false,
        allowPasswordLogin: true
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      // Generate primary wallet
      const walletDetails = await generateWallet();
      if (!walletDetails.address || !walletDetails.seed) {
        throw new Error('Failed to generate valid wallet details');
      }

      // Save wallet to Supabase
      const walletToAdd: WalletDetails & { name: string; userId: string } = {
        ...walletDetails,
        name: 'Primary Wallet',
        userId: profile.id
      };
      
      const { error: walletError } = await addWallet(walletToAdd);
      if (walletError) {
        console.error('Error adding wallet:', walletError);
        // Delete the created profile since wallet creation failed
        await supabase
          .from('profiles')
          .delete()
          .eq('id', profile.id);
        throw new Error('Failed to create wallet. Please try again.');
      }

      // Set the current wallet
      setCurrentWallet(walletToAdd);
      console.log('Primary wallet created successfully:', walletToAdd.address);

      // Store additional wallet information in localStorage
      localStorage.setItem('currentWalletExtended', JSON.stringify({
        id: profile.id,
        userId: profile.id
      }));

      console.log('Sign up successful');

      // Add a small delay before navigation to ensure all state updates are complete
      setTimeout(() => {
        navigate('/chat');
      }, 100);
    } catch (err) {
      console.error('Error signing up:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let profile;
      if (email && password) {
        // Login with email and password
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .single();
        if (error) throw error;
        profile = data;
      } else if (username && password) {
        // Login with username and password
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();
        if (error) throw error;
        profile = data;
      } else if (seed) {
        // Login with wallet seed
        const walletDetails = {
          address: '', // You'd derive this from the seed
          seed: seed
        };
        const { data, error } = await supabase
          .from('wallets')
          .select('user_id, address, id')
          .eq('seed', seed)
          .single();
        if (error) throw error;
        if (!data) throw new Error('Wallet not found');
        
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .single();
        if (userError) throw userError;
        profile = userData;

        // Add wallet to context
        const walletWithName: WalletDetails & { name: string; userId: string } = {
          ...walletDetails,
          name: 'Primary Wallet',
          userId: data.user_id
        };
        await addWallet(walletWithName);
        setCurrentWallet(walletWithName);

        // Store additional wallet information in localStorage
        localStorage.setItem('currentWalletExtended', JSON.stringify({
          id: data.id,
          userId: data.user_id
        }));
      } else {
        throw new Error('Please provide email and password, username and password, or wallet seed');
      }

      if (!profile) throw new Error('User not found');

      // Set user in context and localStorage
      const userData = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        isEncrypted: false,
        allowPasswordLogin: profile.allow_password_login
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));

      navigate('/chat');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111b21] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-[#202c33] rounded-lg p-8 shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-[#e9edef]">
              SecureChat
              <span className="font-normal text-2xl italic">.Crypto</span>
            </h1>
            <p className="text-[#8696a0] mt-2 uppercase text-sm">
              THE WORLD'S MOST SECURE MESSAGING PLATFORM
            </p>
            <div className="flex justify-center space-x-4 mt-6">
              <button 
                onClick={() => setIsLogin(false)}
                className={`text-[#e9edef] font-semibold ${!isLogin ? 'border-b-2 border-[#00a884]' : ''} hover:border-b-2 hover:border-[#00a884]`}
              >
                Sign Up
              </button>
              <button 
                onClick={() => setIsLogin(true)}
                className={`text-[#e9edef] font-semibold ${isLogin ? 'border-b-2 border-[#00a884]' : ''} hover:border-b-2 hover:border-[#00a884]`}
              >
                Login
              </button>
            </div>
          </div>
          <form onSubmit={isLogin ? handleLogin : handleSignUp}>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 bg-[#2a3942] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-[#2a3942] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-[#2a3942] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              />
              {isLogin && (
                <input
                  type="text"
                  placeholder="Wallet Seed"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  className="w-full p-3 bg-[#2a3942] rounded-lg text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                />
              )}
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-[#00a884] text-[#111b21] py-3 rounded-lg font-semibold hover:bg-[#00c49f] transition-colors"
            >
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>
          <p className="mt-4 text-center text-[#8696a0]">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[#00a884] hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
          <button
            onClick={clearLocalStorageAndState}
            className="mt-4 text-[#00a884] hover:underline text-sm"
          >
            Clear Data and Reset
          </button>
        </div>
      </div>
    </div>
  );
}
