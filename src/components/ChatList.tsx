import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { supabase, Thread, Message } from '../utils/supabase';

interface ChatListProps {
  searchQuery: string;
}

interface ChatPreview {
  id: string;
  participant: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const ChatList: React.FC<ChatListProps> = ({ searchQuery }) => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const navigate = useNavigate();
  const { wallet } = useWallet();

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  useEffect(() => {
    if (!wallet) return;

    const loadChats = async () => {
      try {
        // Get all threads for current user
        const { data: threads } = await supabase
          .from('threads')
          .select('*')
          .or(`participant1.eq.${wallet.address},participant2.eq.${wallet.address}`)
          .order('last_message_at', { ascending: false });

        if (!threads) return;

        // Get last message for each thread
        const chatPreviews = await Promise.all(
          threads.map(async (thread) => {
            const { data: messages } = await supabase
              .from('messages')
              .select('*')
              .eq('thread_id', thread.id)
              .order('created_at', { ascending: false })
              .limit(1);

            const otherParticipant = thread.participant1 === wallet.address
              ? thread.participant2
              : thread.participant1;

            return {
              id: thread.id,
              participant: otherParticipant,
              lastMessage: messages?.[0]?.encrypted_content || 'No messages yet',
              timestamp: messages?.[0]?.created_at || thread.created_at,
              unread: 0 // TODO: Implement unread count
            };
          })
        );

        setChats(chatPreviews);
      } catch (err) {
        console.error('Error loading chats:', err);
      }
    };

    loadChats();

    // Subscribe to new messages
    const subscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        loadChats
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [wallet]);

  // Filter chats based on search query
  const filteredChats = chats.filter(chat =>
    chat.participant.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Notification Banner */}
      <div className="bg-[#182229] p-4 flex items-center space-x-4">
        <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center">
          <svg viewBox="0 0 48 48" height="24" width="24" fill="#fff">
            <path d="M24.154 2C11.919 2 2 11.924 2 24.165S11.919 46.33 24.154 46.33s22.154-9.924 22.154-22.165S36.389 2 24.154 2zm-.744 15.428v-.618c0-.706.618-1.324 1.324-1.324s1.323.618 1.323 1.324v.618c2.559.618 4.412 2.823 4.412 5.559v3.176l-8.294-8.294a5.056 5.056 0 0 1 1.235-.441zm1.323 15.706a1.77 1.77 0 0 1-1.765-1.765h3.529a1.768 1.768 0 0 1-1.764 1.765zm7.236-3.529h-14.47v-1.765h14.47v1.765z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[#e9edef] text-[16px] leading-[21px] font-medium">Get notified of new messages</h3>
          <p className="text-[#8696a0] text-[14px] leading-[20px]">Turn on desktop notifications ›</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#2a3942] px-3">
        <button className="px-4 py-3 text-[#00a884] border-b-2 border-[#00a884] font-medium">
          All
        </button>
        <button className="px-4 py-3 text-[#8696a0] hover:text-[#e9edef]">
          Unread
        </button>
        <button className="px-4 py-3 text-[#8696a0] hover:text-[#e9edef]">
          Favourites
        </button>
        <button className="px-4 py-3 text-[#8696a0] hover:text-[#e9edef]">
          Groups
        </button>
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto flex-1">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatClick(chat.id)}
            className="flex items-center px-3 py-[10px] hover:bg-[#202c33] cursor-pointer transition-colors"
          >
            <div className="relative">
              <div className="w-[49px] h-[49px] rounded-full bg-[#2a3942] flex items-center justify-center">
                <span className="text-[#aebac1] text-lg font-medium">
                  {chat.participant.slice(0, 1).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0 border-t border-[#2a3942] py-[10px]">
              <div className="flex justify-between items-center">
                <h3 className="text-[17px] text-[#e9edef] leading-[23px] font-normal">
                  {`${chat.participant.slice(0, 6)}...${chat.participant.slice(-4)}`}
                </h3>
                <span className="text-[12px] text-[#8696a0] whitespace-nowrap">
                  {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between items-center mt-0.5">
                <p className="text-[14px] text-[#8696a0] truncate pr-8">
                  {chat.lastMessage}
                </p>
                {chat.unread > 0 && (
                  <span className="bg-[#00a884] text-[#111b21] rounded-full min-w-[20px] h-[20px] flex items-center justify-center text-xs px-1.5">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
