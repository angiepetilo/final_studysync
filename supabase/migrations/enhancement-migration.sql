-- ============================================
-- StudSync — Enhancement Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. FOLDERS table for organizing files
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  parent_id uuid references public.folders on delete cascade,
  created_at timestamptz default now()
);

-- 2. Add folder_id to files table
alter table public.files add column if not exists folder_id uuid references public.folders on delete set null;

-- 3. FEEDBACK table for user-to-admin feedback
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  message text not null,
  status text default 'new' check (status in ('new', 'reviewed', 'resolved')),
  admin_reply text,
  created_at timestamptz default now()
);

-- 4. USER_SETTINGS table for customization
create table if not exists public.user_settings (
  id uuid references auth.users on delete cascade primary key,
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  accent_color text default '#4F46E5',
  sidebar_compact boolean default false,
  email_task_reminders boolean default true,
  email_collab_notifications boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add type column to notifications if missing
alter table public.notifications add column if not exists type text default 'info';
alter table public.notifications add column if not exists link text;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.folders enable row level security;
alter table public.feedback enable row level security;
alter table public.user_settings enable row level security;

-- Folders: users CRUD their own
create policy "Users can view own folders" on public.folders for select using (auth.uid() = user_id);
create policy "Users can insert own folders" on public.folders for insert with check (auth.uid() = user_id);
create policy "Users can update own folders" on public.folders for update using (auth.uid() = user_id);
create policy "Users can delete own folders" on public.folders for delete using (auth.uid() = user_id);

-- Feedback: users can create, admins can view/update
create policy "Users can insert feedback" on public.feedback for insert with check (auth.uid() = user_id);
create policy "Users can view own feedback" on public.feedback for select using (auth.uid() = user_id);
-- Note: Admin access to ALL feedback requires a service role key (via API route)

-- User Settings: users CRUD their own
create policy "Users can view own settings" on public.user_settings for select using (auth.uid() = id);
create policy "Users can insert own settings" on public.user_settings for insert with check (auth.uid() = id);
create policy "Users can update own settings" on public.user_settings for update using (auth.uid() = id);
-- Notification insert policy for service role (API routes)
create policy "System can insert notifications" on public.notifications for insert with check (true);

-- ============================================
-- REALTIME (enable for new tables)
-- ============================================
alter publication supabase_realtime add table public.feedback;
