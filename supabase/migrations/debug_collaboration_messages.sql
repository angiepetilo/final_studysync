-- 1. RESET RLS POLICY (TEMPORARILY PERMISSIVE)
-- This will help determine if RLS is the cause of the 400 error.
DROP POLICY IF EXISTS "Allow insert messages" ON collaboration_messages;

CREATE POLICY "Allow insert messages"
  ON collaboration_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMENT ON POLICY "Allow insert messages" ON collaboration_messages IS 
  'Temporary permissive policy for debugging 400 error. Tighten this once fixed.';

-- 2. CHECK SCHEMA CONSTRAINTS
-- Identify any NOT NULL columns that might be missing in the insert statement.
SELECT 
    column_name, 
    is_nullable, 
    column_default, 
    data_type
FROM information_schema.columns
WHERE table_name = 'collaboration_messages'
ORDER BY ordinal_position;

-- 3. VERIFY FOREIGN KEYS
-- Ensure that collaboration_id and user_id exist in their respective tables.
-- You can run this by replacing the IDs with those from your logs:
-- SELECT id FROM collaborations WHERE id = 'YOUR_COLLAB_ID';
-- SELECT id FROM profiles WHERE id = 'YOUR_USER_ID';
