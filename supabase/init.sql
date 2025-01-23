-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid default uuid_generate_v4() primary key,
  wallet_address text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Messages table
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  sender_address text not null,
  recipient_address text not null,
  encrypted_content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_messages_sender on messages(sender_address);
create index if not exists idx_messages_recipient on messages(recipient_address);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table messages enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Anyone can create a profile"
  on profiles for insert
  with check (true);

create policy "Messages are viewable by sender and recipient"
  on messages for select
  using (true);

create policy "Anyone can send messages"
  on messages for insert
  with check (true);
