-- 1. ADD UNREAD TRACKING COLUMN
-- Track when each member last read messages in a collaboration room.
ALTER TABLE collaboration_members 
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();

-- 2. INDEX FOR PERFORMANCE
-- Speed up unread count queries.
CREATE INDEX IF NOT EXISTS idx_collaboration_members_user_last_read 
  ON collaboration_members (user_id, last_read_at);

-- 3. INITIALIZE DATA
-- Set existing members to current time so they don't see all old messages as unread.
UPDATE collaboration_members 
  SET last_read_at = NOW() 
  WHERE last_read_at IS NULL;
