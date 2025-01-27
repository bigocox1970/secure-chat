-- Drop existing threads table if it exists
DROP TABLE IF EXISTS threads CASCADE;

-- Create threads table with correct schema
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1 UUID NOT NULL REFERENCES profiles(id),
    participant2 UUID NOT NULL REFERENCES profiles(id),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_threads_participants ON threads(participant1, participant2);
CREATE INDEX idx_threads_last_message ON threads(last_message_at DESC);

-- Add constraint to ensure participant1 and participant2 are different
ALTER TABLE threads ADD CONSTRAINT different_participants CHECK (participant1 <> participant2);

-- Add unique constraint to prevent duplicate threads between same participants
CREATE UNIQUE INDEX idx_unique_participants ON threads (
    LEAST(participant1, participant2),
    GREATEST(participant1, participant2)
);
