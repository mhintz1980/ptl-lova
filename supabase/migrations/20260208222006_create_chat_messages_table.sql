-- Migration: Create chat_messages table with RLS
-- Purpose: Store chat history per user for AI conversations

-- Create the chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient chat history queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_created 
ON chat_messages (user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can SELECT their own messages
DROP POLICY IF EXISTS "Users can select own messages" ON chat_messages;
CREATE POLICY "Users can select own messages" 
ON chat_messages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can INSERT their own messages
DROP POLICY IF EXISTS "Users can insert own messages" ON chat_messages;
CREATE POLICY "Users can insert own messages" 
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can DELETE their own messages
DROP POLICY IF EXISTS "Users can delete own messages" ON chat_messages;
CREATE POLICY "Users can delete own messages" 
ON chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
