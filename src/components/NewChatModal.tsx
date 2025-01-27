import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { supabase, createThread } from '../utils/supabase';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
}

export function NewChatModal({ isOpen, onClose, isAuthenticated }: NewChatModalProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useUser();

  const handleStartChat = async () => {
    console.log('Starting chat...');
    console.log('Authentication state:', isAuthenticated);
    console.log('Current user:', user);
    
    if (!isAuthenticated || !user) {
      setError('Please log in first');
      return;
    }
    
    if (!address.trim()) {
      setError('Please enter an XRP address');
      return;
    }
    
    try {
      setError(null);
      console.log('Attempting to start chat with:', address);

      // Validate address format
      if (!address.match(/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/)) {
        setError('Invalid XRP address format');
        return;
      }

      // Check if recipient exists and get their user ID
      const { data: recipientWallet, error: walletError } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('address', address)
        .single();

      if (walletError || !recipientWallet) {
        setError('This XRP address is not registered on SecureChat');
        return;
      }

      // Don't allow chat with self
      if (recipientWallet.user_id === user.id) {
        setError('Cannot start chat with yourself');
        return;
      }

      // Create or get existing thread using the helper function
      const { data: thread, error: threadError } = await createThread(
        user.id,
        recipientWallet.user_id
      );

      if (threadError) {
        console.error('Thread error:', threadError);
        throw new Error('Failed to create chat thread');
      }

      if (!thread) {
        throw new Error('Failed to create thread');
      }

      navigate(`/chat/${thread.id}`);
      onClose();
    } catch (err) {
      console.error('Failed to start chat:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error'
      });
      setError(err instanceof Error ? err.message : 'Failed to start chat. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center z-50 pt-20">
      <div className="bg-[#202c33] rounded-lg w-[400px] shadow-xl">
        {/* Header */}
        <div className="bg-[#202c33] px-6 py-4 flex items-center border-b border-[#2a3942]">
          <button 
            onClick={onClose}
            className="text-[#aebac1] hover:text-[#e9edef] mr-6"
          >
            <svg viewBox="0 0 24 24" height="24" width="24" fill="#ffffff">
              <path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
            </svg>
          </button>
          <h2 className="text-[19px] text-[#e9edef] font-medium">New chat</h2>
        </div>

        {/* Input area */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-[#8696a0] text-sm mb-2">
              Enter the XRP address of the person you want to chat with. You can find your own XRP address in your profile to share with others.
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && address.trim()) {
                  console.log('Enter key pressed');
                  handleStartChat();
                }
              }}
              placeholder="Enter XRP address (starts with 'r')"
              className={`w-full py-2 px-4 bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] rounded-lg focus:outline-none ${
                error ? 'border border-red-500' : ''
              }`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-500 px-1">{error}</p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Start Chat button clicked');
              handleStartChat();
            }}
            disabled={!address.trim()}
            className={`w-full py-2 rounded-lg font-medium ${
              address.trim()
                ? 'bg-[#00a884] text-[#111b21] hover:bg-[#06cf9c]'
                : 'bg-[#202c33] text-[#8696a0] cursor-not-allowed'
            }`}
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
}
