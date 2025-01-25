import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignUp } from './components/SignUp';
import Chat from './components/Chat';
import ChatList from './components/ChatList';
import { Profile } from './components/Profile';
import UserProvider, { useUser } from './context/UserContext';
import { useWallet, WalletProvider } from './context/WalletContext';
import { EncryptionProvider, useEncryption } from './context/EncryptionContext';
import { supabase } from './utils/supabase';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser();
  const { wallet } = useWallet();
  return isAuthenticated && wallet ? <>{children}</> : <Navigate to="/" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser();
  const { wallet } = useWallet();
  return !isAuthenticated || !wallet ? <>{children}</> : <Navigate to="/chat" />;
}

function NewChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { wallet } = useWallet();

  const handleStartChat = async () => {
    if (!address.trim() || !wallet) return;
    
    try {
      setError(null);

      // Validate address format
      if (!address.match(/^r[1-9A-HJ-NP-Za-km-z]{25,34}$/)) {
        setError('Invalid XRP address format');
        return;
      }

      // Don't allow chat with self
      if (address === wallet.address) {
        setError('Cannot start chat with yourself');
        return;
      }

      // Create or get existing thread
      const { data: thread, error: threadError } = await supabase
        .from('threads')
        .upsert({
          participant1: wallet.address,
          participant2: address,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (threadError) throw threadError;

      if (thread) {
        navigate(`/chat/${thread.id}`);
        onClose();
      }
    } catch (err) {
      console.error('Failed to start chat:', err);
      setError('Failed to start chat. Please try again.');
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
            <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
              <path d="m19.1 17.2-5.3-5.3 5.3-5.3-1.8-1.8-5.3 5.4-5.3-5.3-1.8 1.7 5.3 5.3-5.3 5.3L6.7 19l5.3-5.3 5.3 5.3 1.8-1.8z"></path>
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
            onClick={handleStartChat}
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

function AppRoutes() {
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const { wallet } = useWallet();
  const { isAuthenticated } = useUser();
  const { isEncrypted, setIsEncrypted } = useEncryption();

  // If not authenticated, only show the sign-up page
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0c1317]">
      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 h-[60px] flex items-center px-4 z-20 transition-colors ${isAuthenticated ? (isEncrypted ? 'bg-[#005c4b]' : 'bg-[#8b0000]') : 'bg-[#202c33]'}`}>
        <button
          onClick={() => setShowSidebar(prev => !prev)}
          className="p-2 text-[#aebac1] hover:bg-[#374045] rounded-full"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
        </button>
        <div className="ml-4 flex items-center">
          <span className="text-[#e9edef] font-medium text-lg mr-2">SecureChat</span>
          {isAuthenticated && (
            <button 
              onClick={() => setIsEncrypted(!isEncrypted)}
              className="flex items-center text-[12px] text-[#8696a0] hover:text-[#e9edef] transition-colors"
            >
              {isEncrypted ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 116 0v2h2V7a5 5 0 00-5-5z" />
                  </svg>
                  Encrypted
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2h-1V7a4 4 0 00-8 0v2H7V7a3 3 0 116 0v2z" />
                  </svg>
                  Not Encrypted
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex w-full mt-[60px]">
        {/* Left sidebar - Chat list */}
        <div className={`${showSidebar ? 'w-full md:w-[400px]' : 'w-0'} border-r border-[#2a3942] flex flex-col bg-[#111b21] transition-all duration-300 absolute md:relative h-[calc(100vh-60px)] z-10 overflow-hidden`}>
          {/* Profile Section */}
          <Profile />

          {/* Header */}
          <div className="px-4 py-3 bg-[#202c33] flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#aebac1]">
              <button 
                onClick={() => setShowNewChat(true)}
                className="p-2 hover:bg-[#374045] rounded-full"
                title="New chat"
              >
                <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                  <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h9.975v1.944z" />
                </svg>
              </button>
              <div className="relative group">
                <button className="p-2 hover:bg-[#374045] rounded-full" title="Menu">
                  <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                    <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-1 w-56 bg-[#233138] rounded-lg shadow-lg py-1 hidden group-hover:block">
                  <button 
                    className="w-full px-4 py-2 text-left text-[#d1d7db] hover:bg-[#182229] flex items-center"
                    onClick={() => alert('Coming soon: Upgrade to encrypted messaging!')}
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                    </svg>
                    Go Full Encrypted
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-3 bg-[#111b21]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#aebac1]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.9 14.3H15l-0.3-0.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-0.6 4.3-1.6l0.3 0.3v0.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full py-[8px] pl-12 pr-4 bg-[#202c33] text-[#d1d7db] placeholder-[#8696a0] rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto bg-[#111b21] scrollbar-hide">
            <ChatList searchQuery={searchQuery} />
          </div>
        </div>

        {/* Right main area - Active chat */}
        <div className="flex-1 flex flex-col bg-[#222e35] relative h-[calc(100vh-60px)]">
          <Routes>
            <Route
              path="/chat/:chatId"
              element={
                <PrivateRoute>
                  <Chat />
                </PrivateRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <div className="flex-1 flex flex-col items-center justify-center bg-[#222e35]">
                  <div className="w-[320px] text-center">
                    <div className="mb-8">
                      <svg viewBox="0 0 303 172" width="300" preserveAspectRatio="xMidYMid meet" fill="none">
                        <path fillRule="evenodd" clipRule="evenodd" d="M229.565 160.229c32.647-10.984 57.366-41.988 53.825-86.81-5.381-68.1-71.025-84.993-111.918-64.932C115.998-12.326 80.86 28.599 60.175 56.16 36.144 88.432 30.512 155.171 71.339 165.485c34.31 8.671 58.843-15.891 87.434-15.891 28.59 0 38.145 21.622 70.792 10.635Z" fill="#364147"/>
                        <path d="M181.394 159.783c-11.408-7.95-26.63-12.83-43.846-12.83-19.688 0-36.878 6.053-48.51 15.525 8.062 1.948 16.744 1.573 25.903.198 28.591 0 38.146 21.622 70.792 10.635 32.647-10.984 57.366-41.988 53.825-86.81-1.081-13.679-5.292-25.582-11.757-35.559-6.595 52.808-30.27 97.643-46.407 108.841Z" fill="#0D1418"/>
                        <path d="M143.166 170.241c11.311.446 22.574-1.562 33.032-5.73 15.799-6.458 30.977-19.731 40.338-38.121 9.362-18.39 13.413-40.772 8.142-67.73-2.997-15.307-10.238-28.451-20.478-38.596-10.239-10.145-23.527-17.29-38.08-20.574-28.961-6.546-52.561 1.599-69.091 13.867-16.529 12.268-26.269 28.75-31.827 43.393-10.164 26.73-6.819 62.23 6.115 83.085 13.89 22.364 40.747 29.936 71.849 30.406Z" fill="#364147"/>
                        <path d="M168.686 122.87c10.615-3.904 17.922-12.949 17.922-23.411 0-14.126-12.569-25.579-28.072-25.579s-28.072 11.453-28.072 25.579c0 5.795 2.118 11.148 5.684 15.44 1.345 1.621 1.345 4.044-.639 4.854-1.984.81-4.605.405-5.95-1.216-4.605-5.525-7.362-12.364-7.362-19.078 0-17.22 15.271-31.185 34.079-31.185 18.807 0 34.079 13.965 34.079 31.185 0 12.769-8.362 23.736-20.244 28.59-1.984.81-4.605-.405-4.605-2.432 0-1.216.639-2.432 2.118-2.837l1.062-.81Z" fill="#0D1418"/>
                      </svg>
                    </div>
                    <h1 className="text-[32px] text-[#e9edef] font-light mb-3">WhatsApp Web</h1>
                    <p className="text-[#8696a0] text-[14px] leading-[20px]">
                      Select a chat or start a new conversation
                    </p>
                  </div>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
      </div>

      <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <UserProvider>
        <WalletProvider>
          <EncryptionProvider>
            <AppRoutes />
          </EncryptionProvider>
        </WalletProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
