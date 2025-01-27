export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email?: string;
          xrp_address?: string;
          created_at?: string;
          is_encrypted?: boolean;
        };
        Insert: {
          id?: string;
          username: string;
          email?: string;
          xrp_address?: string;
          created_at?: string;
          is_encrypted?: boolean;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          xrp_address?: string;
          created_at?: string;
          is_encrypted?: boolean;
        };
      };
      threads: {
        Row: {
          id: string;
          participant1: string;
          participant2: string;
          last_message_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          participant1: string;
          participant2: string;
          last_message_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          participant1?: string;
          participant2?: string;
          last_message_at?: string;
          created_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          content: string;
          created_at: string;
          is_encrypted: boolean;
          read: boolean;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          content: string;
          created_at?: string;
          is_encrypted?: boolean;
          read?: boolean;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          content?: string;
          created_at?: string;
          is_encrypted?: boolean;
          read?: boolean;
        };
      };
    };
    Functions: {
      [key: string]: unknown;
    };
    Enums: {
      [key: string]: unknown;
    };
  };
}
