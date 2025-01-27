-- Add sender_address column referencing wallets
ALTER TABLE messages ADD COLUMN sender_address TEXT;

-- Add foreign key constraint to wallets
ALTER TABLE messages 
ADD CONSTRAINT fk_sender_address 
FOREIGN KEY (sender_address) 
REFERENCES wallets(address);

-- Drop old sender_id column
ALTER TABLE messages DROP COLUMN IF EXISTS sender_id;
