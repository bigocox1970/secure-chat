import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { supabase } from '../utils/supabase';

interface ChatListProps {
  onNewChat: () => void;
}

interface ChatPreview {
  id: string;
  participantId: string;
  participantUsername: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const ChatList: React.FC<ChatListProps> = ({ onNewChat }) => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useUser();

  const handleChatClick = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError("Not logged in");
      return;
    }

    const loadChats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all threads for current user
        const { data: threads, error: threadsError } = await supabase
          .from('threads')
          .select(`
            *,
            participant1_profile:profiles(username),
            participant2_profile:profiles(username)
          `)
          .or(`participant1.eq.${user.id},participant2.eq.${user.id}`)
          .order('last_message_at', { ascending: false });

        if (threadsError) throw threadsError;
        if (!threads) {
          setChats([]);
          return;
        }

        // Get last messages for all threads
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('*')
          .in('thread_id', threads.map(t => t.id))
          .order('created_at', { ascending: false });

        // Create a map of thread_id to last message
        const lastMessageMap = new Map();
        lastMessages?.forEach(msg => {
          if (!lastMessageMap.has(msg.thread_id)) {
            lastMessageMap.set(msg.thread_id, msg);
          }
        });

        const chatPreviews = threads.map(thread => {
          const isParticipant1 = thread.participant1 === user.id;
          const otherParticipantId = isParticipant1 ? thread.participant2 : thread.participant1;
          const otherParticipantUsername = isParticipant1 
            ? thread.participant2_profile?.username 
            : thread.participant1_profile?.username;
          const lastMessage = lastMessageMap.get(thread.id);

          return {
            id: thread.id,
            participantId: otherParticipantId,
            participantUsername: otherParticipantUsername || 'Unknown User',
            lastMessage: lastMessage?.content || 'No messages yet',
            timestamp: lastMessage?.created_at || thread.created_at,
            unread: 0
          };
        });

        setChats(chatPreviews);
      } catch (err) {
        console.error('Error loading chats:', err);
        setError('Failed to load chats. Please try again.');
      } finally {
        setLoading(false);
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
  }, [user]);

  if (loading) {
    return <div className="text-[#8696a0] text-center py-4">Loading chats...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (chats.length === 0) {
    return <div className="text-[#8696a0] text-center py-4">No chats found. Start a new chat!</div>;
  }

  return (
    <div className="flex flex-col">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => handleChatClick(chat.id)}
          className="flex items-center px-3 py-[10px] hover:bg-[#202c33] cursor-pointer transition-colors"
        >
          <div className="relative">
            <div className="w-[49px] h-[49px] rounded-full bg-[#2a3942] flex items-center justify-center">
              <span className="text-[#aebac1] text-lg font-medium">
                {chat.participantUsername.slice(0, 1).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0 border-t border-[#2a3942] py-[10px]">
            <div className="flex justify-between items-center">
              <h3 className="text-[17px] text-[#e9edef] leading-[23px] font-normal">
                {chat.participantUsername}
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
  );
};

export default ChatList;
