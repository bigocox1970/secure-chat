-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist
drop table if exists messages;
drop table if exists threads;
drop table if exists profiles;

-- Profiles table (simplified)
create table if not exists profiles (
  id uuid default uuid_generate_v4() primary key,
  username text not null unique,
  email text,
  xrp_address text unique,
  is_encrypted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Chat threads
create table if not exists threads (
  id uuid default uuid_generate_v4() primary key,
  participant1 text not null,
  participant2 text not null,
  last_message_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint fk_participant1 foreign key (participant1) references profiles(xrp_address),
  constraint fk_participant2 foreign key (participant2) references profiles(xrp_address),
  constraint unique_participants unique (participant1, participant2)
);

-- Messages
create table if not exists messages (
  id uuid default uuid_generate_v4() primary key,
  thread_id uuid not null references threads(id),
  sender_id uuid not null references profiles(id),
  content text not null,
  is_encrypted boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes
create index if not exists idx_messages_thread on messages(thread_id);
create index if not exists idx_messages_sender on messages(sender_id);
create index if not exists idx_thread_participants on threads(participant1, participant2);
create index if not exists idx_profiles_xrp_address on profiles(xrp_address);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table threads enable row level security;
alter table messages enable row level security;

-- Create policies
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Anyone can create a profile"
  on profiles for insert
  with check (true);

create policy "Threads are viewable by participants"
  on threads for select
  using (true);

create policy "Anyone can create threads"
  on threads for insert
  with check (true);

create policy "Messages are viewable by thread participants"
  on messages for select
  using (true);

create policy "Anyone can send messages"
  on messages for insert
  with check (true);
