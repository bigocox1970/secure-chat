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
  wallet_address: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_address: string;
  recipient_address: string;
  encrypted_content: string;
  created_at: string;
}

// Database operations
export const createUserProfile = async (walletAddress: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ wallet_address: walletAddress }])
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('This wallet address is already registered');
      }
      if (error.code === '42P01') { // Table doesn't exist
        throw new Error('Database setup required. Please run the initialization SQL script.');
      }
      throw new Error(`Database error: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
};

export const sendMessage = async (
  senderAddress: string,
  recipientAddress: string,
  encryptedContent: string
) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        sender_address: senderAddress,
        recipient_address: recipientAddress,
        encrypted_content: encryptedContent
      }])
      .select()
      .single();
    
    if (error) {
      if (error.code === '42P01') {
        throw new Error('Database setup required. Please run the initialization SQL script.');
      }
      throw new Error(`Failed to send message: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error in sendMessage:', error);
    throw error;
  }
};

export const getMessages = async (walletAddress: string) => {
  try {
    const { data: receivedMessages, error: receivedError } = await supabase
      .from('messages')
      .select('*')
      .eq('recipient_address', walletAddress)
      .order('created_at', { ascending: true });

    if (receivedError) {
      throw receivedError;
    }

    const { data: sentMessages, error: sentError } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_address', walletAddress)
      .order('created_at', { ascending: true });

    if (sentError) {
      throw sentError;
    }

    const allMessages = [...(receivedMessages || []), ...(sentMessages || [])];
    return allMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } catch (error) {
    console.error('Error in getMessages:', error);
    throw error;
  }
};

export const getUserByWallet = async (walletAddress: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByWallet:', error);
    throw error;
  }
};
