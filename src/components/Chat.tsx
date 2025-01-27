import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useWallet } from '../context/WalletContext';
import { useEncryption } from '../context/EncryptionContext';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, Message as DbMessage, Thread, getMessages, sendMessage } from '../utils/supabase';

interface DisplayMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isSent: boolean;
  status: 'sent' | 'delivered' | 'read';
  isEncrypted: boolean;
}

const MessageStatus: React.FC<{ status: DisplayMessage['status'] }> = ({ status }) => {
  if (!status) return null;

  const statusIcons = {
    sent: (
      <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#8696a0]">
        <path fill="currentColor" d="m15.01 3.316-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
      </svg>
    ),
    delivered: (
      <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#8696a0]">
        <path fill="currentColor" d="m15.01 3.316-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
      </svg>
    ),
    read: (
      <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#53bdeb]">
        <path fill="currentColor" d="m15.01 3.316-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
      </svg>
    )
  };

  return (
    <span className="absolute bottom-1 right-1">
      {statusIcons[status]}
    </span>
  );
};

const Chat = () => {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  const { chatId } = useParams();
  const { user } = useUser();
  const { currentWallet } = useWallet();
  const { isEncrypted, setIsEncrypted } = useEncryption();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!chatId || !user || !currentWallet) return;

    let subscription: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        // Clean up any existing subscription
        if (subscription) {
          await supabase.removeChannel(subscription);
        }

        // Create a new subscription
        subscription = supabase
          .channel(`chat:${chatId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `thread_id=eq.${chatId}`,
            },
            async (payload) => {
              console.log('Received message:', payload);
              const newMessage = payload.new as DbMessage;
              
              // Skip if this is a message we just sent (already handled by optimistic update)
              if (newMessage.sender_id === user.id) {
                console.log('Skipping own message');
                return;
              }

              try {
                // Mark new message as read immediately
                await supabase
                  .from('messages')
                  .update({ read: true })
                  .eq('id', newMessage.id);

                setMessages(prev => {
                  // Check if message already exists
                  if (prev.some(msg => msg.id === newMessage.id)) {
                    console.log('Message already exists');
                    return prev;
                  }
                  
                  console.log('Adding new message to state');
                  const displayMessage: DisplayMessage = {
                    id: newMessage.id,
                    text: newMessage.content,
                    sender: newMessage.sender_id,
                    timestamp: newMessage.created_at,
                    isSent: false,
                    status: 'read',
                    isEncrypted: newMessage.is_encrypted
                  };
                  
                  const newMessages = [...prev, displayMessage];
                  // Ensure scroll to bottom happens after state update
                  setTimeout(scrollToBottom, 0);
                  return newMessages;
                });
              } catch (error) {
                console.error('Error processing new message:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log(`Subscription status for chat ${chatId}:`, status);
          });

      } catch (error) {
        console.error('Error setting up subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (subscription) {
        console.log('Cleaning up subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, [chatId, user, currentWallet]);

  // Load thread and message history
  useEffect(() => {
    if (!chatId || !user || !currentWallet) return;

    const loadThread = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get thread details
        const { data: threadData, error: threadError } = await supabase
          .from('threads')
          .select('*')
          .eq('id', chatId)
          .single();

        if (threadError) throw threadError;
        setThread(threadData);

        // Get message history
        const { data: messagesData, error: messagesError } = await getMessages(chatId);

        if (messagesError) throw messagesError;
        if (!messagesData) return;

        // Mark unread messages as read
        const unreadMessages = messagesData.filter(msg => 
          msg.sender_id !== user.id && !msg.read
        );
        
        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', unreadMessages.map(msg => msg.id));
        }

        // Process messages
        const displayMessages: DisplayMessage[] = messagesData.map((msg): DisplayMessage => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender_id,
          timestamp: msg.created_at,
          isSent: msg.sender_id === user.id,
          status: msg.read ? 'read' : 'delivered',
          isEncrypted: msg.is_encrypted
        }));

        setMessages(displayMessages);
        // Set encryption status based on last message
        if (displayMessages.length > 0) {
          setIsEncrypted(displayMessages[displayMessages.length - 1].isEncrypted);
        }
        scrollToBottom();
      } catch (err) {
        console.error('Error loading chat:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    loadThread();
  }, [chatId, user, currentWallet]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!thread || !user || !currentWallet) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#8696a0]">
        No chat selected
      </div>
    );
  }

  // Get the other participant's ID
  const otherParticipantId = thread.participant1 === user.id
    ? thread.participant2
    : thread.participant1;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !thread) return;

    try {
      // Add optimistic message
      const optimisticMessage: DisplayMessage = {
        id: 'temp-' + Date.now(),
        text: newMessage,
        sender: user.id,
        timestamp: new Date().toISOString(),
        isSent: true,
        status: 'sent',
        isEncrypted
      };

      setMessages(prev => [...prev, optimisticMessage]);
      setNewMessage('');

      // Validate message data before sending
      if (!thread.id || !user.id || !newMessage.trim()) {
        throw new Error('Invalid message data');
      }

      // Send to Supabase
      const { data, error: sendError } = await sendMessage({
        thread_id: thread.id,
        sender_id: user.id,
        content: newMessage.trim(),
        is_encrypted: isEncrypted
      });

      if (sendError) {
        console.error('Error sending message:', {
          error: sendError,
          context: {
            thread_id: thread.id,
            sender_id: user.id,
            is_encrypted: isEncrypted
          }
        });
        throw sendError;
      }

      if (!data) {
        throw new Error('No data returned from sendMessage');
      }

      // Update optimistic message status
      setMessages(prev =>
        prev.map(msg =>
          msg.id === optimisticMessage.id
            ? { ...msg, status: 'delivered' }
            : msg
        )
      );
    } catch (err) {
      console.error('Failed to send message:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        details: err instanceof Error ? (err as any).details : null
      });
      setError(err instanceof Error ? err.message : 'Failed to send message');
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Header */}
      <div className="h-[60px] px-4 bg-[#202c33] flex items-center justify-between">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#2a3942] flex items-center justify-center">
              <span className="text-[#aebac1] font-medium text-lg">
                {otherParticipantId.slice(0, 1).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-[16px] text-[#e9edef] leading-[21px] font-medium">
              {otherParticipantId}
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-3 text-[#aebac1]">
          <button className="p-2 hover:bg-[#374045] rounded-full">
            <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
              <path d="M15.9 14.3H15l-0.3-0.3c1-1.1 1.6-2.7 1.6-4.3 0-3.7-3-6.7-6.7-6.7S3 6 3 9.7s3 6.7 6.7 6.7c1.6 0 3.2-0.6 4.3-1.6l0.3 0.3v0.8l5.1 5.1 1.5-1.5-5-5.2zm-6.2 0c-2.6 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2 4.6-4.6 4.6z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-[#374045] rounded-full">
            <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
              <path d="M12 7a2 2 0 1 0-.001-4.001A2 2 0 0 0 12 7zm0 2a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 9zm0 6a2 2 0 1 0-.001 3.999A2 2 0 0 0 12 15z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages area with WhatsApp background pattern */}
      <div 
        className="flex-1 overflow-y-auto p-2 md:p-4 min-h-0 scrollbar-hide"
        style={{
          backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVEhL7c2hEYAgAEXRj0U0YBmNWcYyGrKMBjRwR8CCiDC8d/Iu+QaWgiiKoiiKoiiK/hm91nrOeU3L5G5d+/sxxjuttTvGGPe+EO5TSt2HMd45V3dKKc+2bQPlFX4VKmJwFgAAAABJRU5ErkJggg==")`,
          backgroundColor: '#0b141a'
        }}
      >
        <div className="space-y-2">
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
              {(index === 0 || new Date(messages[index - 1].timestamp).toDateString() !== new Date(message.timestamp).toDateString()) && (
                <div className="flex justify-center my-4">
                  <div className="bg-[#182229] text-[#8696a0] text-[12.5px] px-3 py-1 rounded">
                    {new Date(message.timestamp).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}
              <div className={`flex ${message.isSent ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {!message.isSent && (
                  <div className="w-8 h-8 rounded-full bg-[#2a3942] flex items-center justify-center mr-2">
                    <span className="text-[#aebac1] text-sm font-medium">
                      {message.sender.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div
                  className={`group relative max-w-[65%] min-w-[120px] px-[9px] py-[6px] rounded-lg
                    ${message.isSent 
                      ? `bg-[#005c4b] text-[#e9edef] ml-auto rounded-tr-none border-2 ${
                          message.isEncrypted ? 'border-green-500' : 'border-red-500'
                        }`
                      : `bg-[#202c33] text-[#e9edef] mr-auto rounded-tl-none border-2 ${
                          message.isEncrypted ? 'border-green-500' : 'border-red-500'
                        }`
                    }`}
                >
                  <div className="relative">
                    <p className="text-[14.2px] leading-[19px] pr-4">{message.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center">
                        <p className="text-[11px] text-[#8696a0]">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <div className="flex items-center">
                          {message.isEncrypted ? (
                            <>
                              {/* Locked padlock */}
                              <svg className="w-3 h-3 ml-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 116 0v2h2V7a5 5 0 00-5-5z" />
                              </svg>
                              {/* Green checkmark */}
                              <svg className="w-3 h-3 ml-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </>
                          ) : (
                            <>
                              {/* Unlocked padlock */}
                              <svg className="w-3 h-3 ml-1 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a5 5 0 00-5 5v2h2V7a3 3 0 116 0v2h2V7a5 5 0 00-5-5zm-5 9a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H5z" />
                              </svg>
                              {/* Red X */}
                              <svg className="w-3 h-3 ml-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </>
                          )}
                        </div>
                      </div>
                      {message.isSent && <MessageStatus status={message.status} />}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="px-2 md:px-4 py-3 bg-[#202c33] flex items-center space-x-2">
        <button className="p-2 text-[#8696a0] hover:bg-[#374045] rounded-full">
          <svg viewBox="0 0 24 24" height="26" width="26" fill="currentColor">
            <path d="M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0zm11.363 1.108s-.669 1.959-5.051 1.959c-3.505 0-5.388-1.164-5.607-1.959 0 0 5.912 1.055 10.658 0zM11.804 1.011C5.609 1.011.978 6.033.978 12.228s4.826 10.761 11.021 10.761S23.02 18.423 23.02 12.228c.001-6.195-5.021-11.217-11.216-11.217zM12 21.354c-5.273 0-9.381-3.886-9.381-9.159s3.942-9.548 9.215-9.548 9.548 4.275 9.548 9.548c-.001 5.272-4.109 9.159-9.382 9.159zm3.108-9.751c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962z" />
          </svg>
        </button>
        <button className="p-2 text-[#8696a0] hover:bg-[#374045] rounded-full">
          <svg viewBox="0 0 24 24" height="26" width="26" fill="currentColor">
            <path d="M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 0 0 3.972-1.645l9.547-9.548c.769-.768 1.147-1.767 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 0 1-2.829 1.171 3.975 3.975 0 0 1-2.83-1.173 3.973 3.973 0 0 1-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 0 0-.834.018l-7.205 7.207a5.577 5.577 0 0 0-1.645 3.971z" />
          </svg>
        </button>
        <div className="flex-1 px-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="w-full py-2 px-3 bg-[#2a3942] text-[#d1d7db] placeholder-[#8696a0] rounded-lg focus:outline-none"
          />
        </div>
        <div className="flex items-center">
          {newMessage.trim() ? (
            <button 
              onClick={handleSendMessage}
              className="p-2 text-[#8696a0] hover:bg-[#374045] rounded-full"
            >
              <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                <path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
              </svg>
            </button>
          ) : (
            <button className="p-2 text-[#8696a0] hover:bg-[#374045] rounded-full">
              <svg viewBox="0 0 24 24" height="24" width="24" fill="currentColor">
                <path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
