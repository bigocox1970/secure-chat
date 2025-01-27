-- Create a function to create a user profile with explicit type handling
CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_username VARCHAR,
  p_email VARCHAR DEFAULT NULL,
  p_xrp_address VARCHAR DEFAULT NULL,
  p_password VARCHAR DEFAULT NULL,
  p_is_encrypted BOOLEAN DEFAULT FALSE,
  p_allow_password_login BOOLEAN DEFAULT TRUE
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validate required parameters
  IF p_username IS NULL OR trim(p_username) = '' THEN
    RAISE EXCEPTION 'Username is required and cannot be empty';
  END IF;

  -- Insert the new profile with conflict handling
  INSERT INTO profiles (
    username, 
    email, 
    xrp_address, 
    password, 
    is_encrypted, 
    allow_password_login
  ) VALUES (
    p_username, 
    p_email, 
    p_xrp_address, 
    p_password, 
    p_is_encrypted, 
    p_allow_password_login
  )
  ON CONFLICT (username) DO UPDATE 
  SET 
    email = COALESCE(EXCLUDED.email, profiles.email),
    xrp_address = COALESCE(EXCLUDED.xrp_address, profiles.xrp_address),
    password = COALESCE(EXCLUDED.password, profiles.password),
    is_encrypted = EXCLUDED.is_encrypted,
    allow_password_login = EXCLUDED.allow_password_login
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
EXCEPTION 
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Username already exists: %', p_username;
  WHEN OTHERS THEN
    RAISE NOTICE 'Unexpected error: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create tables
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR,
  xrp_address VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_encrypted BOOLEAN DEFAULT FALSE,
  password VARCHAR,
  allow_password_login BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  address VARCHAR NOT NULL,
  seed VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, address)
);

CREATE TABLE IF NOT EXISTS threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1 VARCHAR NOT NULL,
  participant2 VARCHAR NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL REFERENCES threads(id),
  sender_address VARCHAR NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_encrypted BOOLEAN DEFAULT FALSE
);

-- Verification query to help diagnose function issues
-- Run this in the Supabase SQL Editor to check function details
/*
SELECT 
  routine_name, 
  routine_schema, 
  data_type AS return_type,
  (SELECT COUNT(*) FROM information_schema.parameters 
   WHERE specific_schema = 'public' 
   AND specific_name = 'create_user_profile') AS parameter_count
FROM information_schema.routines
WHERE routine_name = 'create_user_profile' 
AND routine_schema = 'public';
*/
