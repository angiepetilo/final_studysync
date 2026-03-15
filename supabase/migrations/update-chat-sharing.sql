-- Add supporting columns for shared assets in collaborations
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS shared_item_type text CHECK (shared_item_type IN ('task', 'note', 'file')),
ADD COLUMN IF NOT EXISTS shared_item_id uuid,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Optional: Add a comment for documentation
COMMENT ON COLUMN public.chat_messages.shared_item_type IS 'Type of asset shared (task, note, file)';
COMMENT ON COLUMN public.chat_messages.shared_item_id IS 'ID of the shared asset from its respective table';
COMMENT ON COLUMN public.chat_messages.metadata IS 'Cached info for UI rendering (e.g. title, color, size) to avoid heavy joins';
