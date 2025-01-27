import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useWallet } from '../context/WalletContext';
import { useUser } from '../context/UserContext';
import { generateWallet } from '../utils/wallet';
import { saveWallet, supabase } from '../utils/supabase';

export function Profile() {
  const { currentWallet, wallets, setCurrentWallet, addWallet, deleteWallet } = useWallet();
  const { user, logout, togglePasswordLogin } = useUser();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
  const [showSeed, setShowSeed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!user || !currentWallet) return null;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(currentWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWallet = () => {
    const walletData = {
      address: currentWallet.address,
      seed: currentWallet.seed
    };
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(
      JSON.stringify(walletData, null, 2)
    )}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `wallet_backup_${currentWallet.address}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateWallet = async () => {
    try {
      setIsGeneratingWallet(true);
      setError(null);

      if (!user.id) {
        throw new Error('User ID not found. Please log out and log back in.');
      }

      // Create profile if it doesn't exist
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let profileId: string;

      if (!existingProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, username: user.username, email: user.email }])
          .select()
          .single();

        if (createError) throw createError;
        if (!newProfile) throw new Error('Failed to create profile');
        profileId = newProfile.id;
      } else {
        profileId = existingProfile.id;
      }

      // Generate new wallet
      const newWallet = await generateWallet();

      // Save to Supabase
      const { error: walletError } = await saveWallet({
        userId: profileId,
        address: newWallet.address,
        seed: newWallet.seed,
        name: `Wallet ${wallets.length + 1}`
      });

      if (walletError) throw walletError;

      // Add to context
      addWallet({ ...newWallet, userId: profileId });
    } catch (err) {
      console.error('Failed to generate wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate wallet');
    } finally {
      setIsGeneratingWallet(false);
    }
  };

  return (
    <div className="p-4 border-b border-[#2a3942]">
      <button 
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="w-full flex items-center justify-between text-[#e9edef] hover:bg-[#202c33] p-2 rounded-lg transition-colors"
      >
        <div className="flex items-center">
          <h2 className="text-lg font-medium">Settings</h2>
        </div>
        <svg 
          className={`w-5 h-5 transform transition-transform ${isSettingsOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isSettingsOpen ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
        {/* Wallet Selection and Management */}
        <div className="bg-[#2a3942] p-4 mb-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 mr-4">
              <h2 className="text-[#e9edef] text-xl font-medium">{user.username}</h2>
              <p className="text-[#8696a0] text-sm">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-[#374045] text-[#e9edef] rounded-lg hover:bg-[#455a64]"
            >
              Logout
            </button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <select
              className="bg-[#202c33] text-[#e9edef] px-3 py-2 rounded-lg flex-1 mr-2"
              value={currentWallet.address}
              onChange={(e) => {
                const selected = wallets.find(w => w.address === e.target.value);
                if (selected) setCurrentWallet(selected);
              }}
            >
              {wallets.map(w => (
                <option key={w.address} value={w.address}>
                  {w.address.substring(0, 8) + '...'}
                </option>
              ))}
            </select>
            <button
              onClick={handleGenerateWallet}
              disabled={isGeneratingWallet}
              className={`px-4 py-2 rounded-lg font-medium ${
                isGeneratingWallet
                  ? 'bg-[#374045] text-[#8696a0] cursor-not-allowed'
                  : 'bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]'
              }`}
            >
              {isGeneratingWallet ? 'Generating...' : 'New Wallet'}
            </button>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4 px-1">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <span className="text-[#e9edef]">
                {currentWallet.address.substring(0, 8) + '...'}
              </span>
              <button
                onClick={() => {
                  if (wallets.length > 1 && confirm('Are you sure you want to delete this wallet?')) {
                    deleteWallet(currentWallet.address);
                  } else if (wallets.length <= 1) {
                    alert('Cannot delete the last wallet. Please generate a new wallet first.');
                  }
                }}
                className="text-red-500 hover:text-red-400 ml-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#2a3942] rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[#8696a0] text-sm">Your XRP Address</span>
            <button
              onClick={handleCopyAddress}
              className="text-[#00a884] text-sm hover:text-[#06cf9c] focus:outline-none"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-[#e9edef] text-sm font-mono break-all">{currentWallet.address}</p>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#8696a0] text-sm">Wallet Seed</span>
              <button
                onClick={() => setShowSeed(!showSeed)}
                className="text-[#00a884] text-sm hover:text-[#06cf9c] focus:outline-none"
              >
                {showSeed ? 'Hide' : 'Show'}
              </button>
            </div>
            {showSeed && (
              <p className="text-[#e9edef] text-sm font-mono break-all bg-[#202c33] p-2 rounded">
                {currentWallet.seed}
              </p>
            )}
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full text-center text-[#00a884] hover:text-[#06cf9c] focus:outline-none"
            >
              {showQR ? 'Hide QR Code' : 'Show QR Code'}
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showQR ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg flex justify-center">
                <QRCodeSVG value={currentWallet.address} size={200} level="H" />
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDownloadWallet}
                  className="flex items-center bg-[#00a884] text-[#111b21] px-4 py-2 rounded-lg font-medium hover:bg-[#06cf9c] focus:outline-none"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="mr-2">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  Download Backup
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Login Settings */}
        <div className="bg-[#2a3942] p-4 rounded-lg">
          <h3 className="text-[#e9edef] text-lg font-medium mb-4">Login Settings</h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#8696a0]">Allow Password Login</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={user.allowPasswordLogin !== false}
                onChange={async (e) => {
                  try {
                    await supabase
                      .from('profiles')
                      .update({ allow_password_login: e.target.checked })
                      .eq('id', user.id);
                    togglePasswordLogin(e.target.checked);
                  } catch (error) {
                    console.error('Failed to update password login setting:', error);
                  }
                }}
              />
              <div className="w-11 h-6 bg-[#374045] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-[#8696a0] after:border-[#8696a0] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884] peer-checked:after:bg-white peer-checked:after:border-white"></div>
            </label>
          </div>
          <p className="text-[#8696a0] text-sm">When disabled, you can only log in using your wallet seed.</p>
        </div>
      </div>
    </div>
  );
}
