-- Check current column type
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'collaboration_messages'
AND column_name = 'content';

-- Alter to support full Unicode/emojis
-- Supabase uses PostgreSQL which supports UTF-8 (including emojis) natively in TEXT columns.
-- This ensures the column is indeed TEXT and not a limited VARCHAR.
ALTER TABLE collaboration_messages
  ALTER COLUMN content TYPE TEXT;

-- Verify database encoding
SHOW server_encoding;
-- Should return UTF8
