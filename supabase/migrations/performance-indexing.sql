-- ============================================
-- StudSync — Performance Indexing
-- Run this in your Supabase SQL Editor
-- ============================================

-- Adding indexes to frequently filtered columns to speed up SELECT queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON public.tasks (course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks (due_date);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes (user_id);
CREATE INDEX IF NOT EXISTS idx_notes_course_id ON public.notes (course_id);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files (user_id);
CREATE INDEX IF NOT EXISTS idx_files_course_id ON public.files (course_id);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON public.schedules (user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_course_id ON public.schedules (course_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id, read);

-- Composite index for collaboration membership checks (critical for RLS)
CREATE INDEX IF NOT EXISTS idx_collaboration_members_user_id_collab_id ON public.collaboration_members (user_id, collaboration_id);

-- Index for chat messages sorting and filtering
CREATE INDEX IF NOT EXISTS idx_chat_messages_collaboration_id_created_at ON public.chat_messages (collaboration_id, created_at);
