import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { SignUp } from './components/SignUp';
import Chat from './components/Chat';
import ChatList from './components/ChatList';
import { Profile } from './components/Profile';
import UserProvider, { useUser } from './context/UserContext';
import { useWallet, WalletProvider } from './context/WalletContext';
import { EncryptionProvider, useEncryption } from './context/EncryptionContext';
import { supabase, createThread } from './utils/supabase';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser();
  const { currentWallet } = useWallet();
  return isAuthenticated && currentWallet ? <>{children}</> : <Navigate to="/" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUser();
  const { currentWallet } = useWallet();
  return !isAuthenticated || !currentWallet ? <>{children}</> : <Navigate to="/chat" />;
}

import { NewChatModal } from './components/NewChatModal';

function AppRoutes() {
  const [showNewChat, setShowNewChat] = useState(false);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);
  const [activeSection, setActiveSection] = useState<'none' | 'chat' | 'contacts' | 'settings'>('none');
  const { currentWallet } = useWallet();
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
      <div className={`${showSidebar ? 'w-full' : 'hidden'} md:w-[400px] border-r border-[#2a3942] flex flex-col bg-[#111b21] h-[calc(100vh-60px)] overflow-y-auto scrollbar-hide`}>
        <Profile />
        <div className="sticky top-0 bg-[#111b21] z-10 p-4">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-full bg-[#00a884] text-[#111b21] py-2 rounded-lg hover:bg-[#00c49f] transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <button 
              onClick={() => setActiveSection(activeSection === 'chat' ? 'none' : 'chat')}
              className="w-full flex items-center justify-between text-[#e9edef] hover:bg-[#202c33] p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <h2 className="text-lg font-medium">Chat History</h2>
              </div>
              <svg 
                className={`w-5 h-5 transform transition-transform ${activeSection === 'chat' ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${activeSection === 'chat' ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <ChatList onNewChat={() => setShowNewChat(true)} />
            </div>
          </div>
          <div className="p-4 border-t border-[#2a3942]">
            <button 
              onClick={() => setActiveSection(activeSection === 'contacts' ? 'none' : 'contacts')}
              className="w-full flex items-center justify-between text-[#e9edef] hover:bg-[#202c33] p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <h2 className="text-lg font-medium">Contacts</h2>
              </div>
              <svg 
                className={`w-5 h-5 transform transition-transform ${activeSection === 'contacts' ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${activeSection === 'contacts' ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              {/* Add your contacts list component here */}
              <div className="text-[#8696a0]">Contacts list coming soon...</div>
            </div>
          </div>
          <div className="p-4 border-t border-[#2a3942]">
            <button 
              onClick={() => setActiveSection(activeSection === 'settings' ? 'none' : 'settings')}
              className="w-full flex items-center justify-between text-[#e9edef] hover:bg-[#202c33] p-2 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <h2 className="text-lg font-medium">Settings</h2>
              </div>
              <svg 
                className={`w-5 h-5 transform transition-transform ${activeSection === 'settings' ? 'rotate-180' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${activeSection === 'settings' ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <div className="bg-[#202c33] rounded-lg p-4">
                <h2 className="text-[#e9edef] text-lg font-semibold">Settings content coming soon...</h2>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Right main area - Active chat */}
        <div className={`${showSidebar ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#222e35] relative h-[calc(100vh-60px)]`}>
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
                    <h1 className="text-[32px] text-[#e9edef] font-light mb-3">
                      SecureChat.<i className="text-[24px] font-normal">Crypto</i>
                    </h1>
                    <p className="text-[#8696a0] text-[14px] mb-4">
                      THE WORLDS MOST SECURE MESSAGING PLATFORM
                    </p>
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

      <NewChatModal 
        isOpen={showNewChat} 
        onClose={() => setShowNewChat(false)} 
        isAuthenticated={isAuthenticated} 
      />
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
