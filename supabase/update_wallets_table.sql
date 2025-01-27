-- Drop existing wallets table if it exists
DROP TABLE IF EXISTS wallets CASCADE;

-- Create wallets table with correct schema
CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    address TEXT NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_address ON wallets(address);

-- Add comments
COMMENT ON COLUMN wallets.address IS 'Public blockchain address';
COMMENT ON COLUMN wallets.encrypted_private_key IS 'Encrypted with user password using AES-256-GCM';
COMMENT ON COLUMN wallets.name IS 'User-defined name for the wallet';
