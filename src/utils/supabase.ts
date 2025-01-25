import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  xrp_address?: string;
  created_at?: string;
  is_encrypted?: boolean;
}

export interface Thread {
  id: string;
  participant1: string;
  participant2: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_encrypted: boolean;
}

interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Database operations
export const createUserProfile = async (
  username: string,
  xrpAddress: string,
  email?: string
): Promise<SupabaseResponse<UserProfile>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ 
        username,
        email,
        xrp_address: xrpAddress,
        is_encrypted: false
      }])
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('This username is already taken');
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return { data: null, error: error as Error };
  }
};

export const loginUser = async (
  username: string,
  email: string
): Promise<SupabaseResponse<UserProfile>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select()
      .eq('username', username)
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        throw new Error('Invalid username or email');
      }
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in loginUser:', error);
    return { data: null, error: error as Error };
  }
};

export const createThread = async (participant1: string, participant2: string): Promise<SupabaseResponse<Thread>> => {
  try {
    // Sort participants to ensure consistent ordering
    const [p1, p2] = [participant1, participant2].sort();
    
    // Check if thread already exists
    const { data: existingThread } = await supabase
      .from('threads')
      .select()
      .eq('participant1', p1)
      .eq('participant2', p2)
      .single();

    if (existingThread) {
      return { data: existingThread, error: null };
    }

    const { data, error } = await supabase
      .from('threads')
      .insert({
        participant1: p1,
        participant2: p2,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in createThread:', error);
    return { data: null, error: error as Error };
  }
};

export const getThreads = async (userAddress: string): Promise<SupabaseResponse<Thread[]>> => {
  try {
    const { data, error } = await supabase
      .from('threads')
      .select()
      .or(`participant1.eq.${userAddress},participant2.eq.${userAddress}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in getThreads:', error);
    return { data: null, error: error as Error };
  }
};

export const sendMessage = async (messageData: {
  thread_id: string;
  sender_id: string;
  content: string;
  is_encrypted?: boolean;
}): Promise<SupabaseResponse<Message>> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        ...messageData,
        is_encrypted: messageData.is_encrypted || false
      })
      .select()
      .single();

    if (error) throw error;

    // Update thread's last_message_at
    await supabase
      .from('threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', messageData.thread_id);

    return { data, error: null };
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return { data: null, error: error as Error };
  }
};

export const getMessages = async (threadId: string): Promise<SupabaseResponse<Message[]>> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in getMessages:', error);
    return { data: null, error: error as Error };
  }
};

export const searchUsers = async (query: string, currentUserAddress: string): Promise<SupabaseResponse<Pick<UserProfile, 'id' | 'username' | 'xrp_address'>[]>> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, xrp_address')
      .neq('xrp_address', currentUserAddress)
      .ilike('username', `%${query}%`)
      .limit(10);

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return { data: null, error: error as Error };
  }
};
