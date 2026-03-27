-- 1. ADD MISSING COLUMNS TO collaboration_messages
-- The PGRST204 error confirms that 'message_type' is missing from the table.
ALTER TABLE collaboration_messages 
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Ensure 'metadata' column also exists as it is used in the insert and for shared notes/tasks.
ALTER TABLE collaboration_messages 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Ensure file related columns exist for file/image sharing.
ALTER TABLE collaboration_messages 
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 2. REFRESH POSTGREST SCHEMA CACHE
-- Supabase usually does this automatically, but running a simple DDL can trigger it.
NOTIFY pgrst, 'reload schema';

-- 3. FINAL SCHEMA CHECK
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'collaboration_messages'
ORDER BY ordinal_position;
