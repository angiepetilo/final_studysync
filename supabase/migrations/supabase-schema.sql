-- ============================================
-- StudSync — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. PROFILES (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  avatar_url text,
  presence text default 'active' check (presence in ('active', 'idle', 'dnd')),
  notify_summaries boolean default true,
  notify_tasks boolean default true,
  notify_collabs boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. COURSES
create table if not exists public.courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  instructor text,
  color text default '#4F46E5',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TASKS
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id uuid references public.courses on delete set null,
  title text not null,
  description text,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  due_date timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. NOTES
create table if not exists public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id uuid references public.courses on delete set null,
  title text not null,
  content text,
  status text default 'review' check (status in ('review', 'done')),
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. FILES
create table if not exists public.files (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id uuid references public.courses on delete set null,
  name text not null,
  storage_path text not null,
  size bigint,
  mime_type text,
  description text,
  created_at timestamptz default now()
);

-- 6. SCHEDULES
create table if not exists public.schedules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  course_id uuid references public.courses on delete set null,
  title text not null,
  type text not null check (type in ('class', 'exam', 'study', 'event')),
  day_of_week int check (day_of_week between 0 and 6),
  event_date date,
  start_time time not null,
  end_time time not null,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. COLLABORATIONS
create table if not exists public.collaborations (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  type text check (type in ('study_group', 'project', 'notes_sharing')),
  visibility text default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 8. COLLABORATION MEMBERS
create table if not exists public.collaboration_members (
  id uuid default gen_random_uuid() primary key,
  collaboration_id uuid references public.collaborations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text default 'member' check (role in ('owner', 'editor', 'member')),
  joined_at timestamptz default now(),
  unique(collaboration_id, user_id)
);

create table if not exists public.collaboration_messages (
  id uuid default gen_random_uuid() primary key,
  collaboration_id uuid references public.collaborations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  file_url text,
  file_name text,
  file_type text,
  message_type text default 'text',
  metadata jsonb,
  created_at timestamptz default now()
);

-- 10. COLLABORATION RESOURCES
create table if not exists public.collaboration_resources (
  id uuid default gen_random_uuid() primary key,
  collaboration_id uuid references public.collaborations on delete cascade not null,
  resource_type text not null check (resource_type in ('file', 'note', 'task', 'url')),
  resource_id uuid,
  title text not null,
  description text,
  url text,
  file_size text,
  shared_by uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);

-- 11. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  message text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.files enable row level security;
alter table public.schedules enable row level security;
alter table public.collaborations enable row level security;
alter table public.collaboration_members enable row level security;
alter table public.collaboration_messages enable row level security;
alter table public.collaboration_resources enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read/update their own profile
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Courses: users CRUD their own
create policy "Users can view own courses" on public.courses for select using (auth.uid() = user_id);
create policy "Users can insert own courses" on public.courses for insert with check (auth.uid() = user_id);
create policy "Users can update own courses" on public.courses for update using (auth.uid() = user_id);
create policy "Users can delete own courses" on public.courses for delete using (auth.uid() = user_id);

-- Tasks: users CRUD their own
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- Notes: users CRUD their own
create policy "Users can view own notes" on public.notes for select using (auth.uid() = user_id);
create policy "Users can insert own notes" on public.notes for insert with check (auth.uid() = user_id);
create policy "Users can update own notes" on public.notes for update using (auth.uid() = user_id);
create policy "Users can delete own notes" on public.notes for delete using (auth.uid() = user_id);

-- Files: users CRUD their own
create policy "Users can view own files" on public.files for select using (auth.uid() = user_id);
create policy "Users can insert own files" on public.files for insert with check (auth.uid() = user_id);
create policy "Users can delete own files" on public.files for delete using (auth.uid() = user_id);

-- Schedules: users CRUD their own
create policy "Users can view own schedules" on public.schedules for select using (auth.uid() = user_id);
create policy "Users can insert own schedules" on public.schedules for insert with check (auth.uid() = user_id);
create policy "Users can update own schedules" on public.schedules for update using (auth.uid() = user_id);
create policy "Users can delete own schedules" on public.schedules for delete using (auth.uid() = user_id);

-- Collaborations: owners + members can see
create policy "Users can view own collaborations" on public.collaborations for select using (
  auth.uid() = owner_id or
  exists (select 1 from public.collaboration_members where collaboration_id = id and user_id = auth.uid())
);
create policy "Users can insert collaborations" on public.collaborations for insert with check (auth.uid() = owner_id);
create policy "Owners can update collaborations" on public.collaborations for update using (auth.uid() = owner_id);
create policy "Owners can delete collaborations" on public.collaborations for delete using (auth.uid() = owner_id);

-- Collaboration Members
create policy "Members can view collaboration members" on public.collaboration_members for select using (
  exists (select 1 from public.collaboration_members cm where cm.collaboration_id = collaboration_id and cm.user_id = auth.uid())
);
create policy "Owners can insert members" on public.collaboration_members for insert with check (
  exists (select 1 from public.collaborations c where c.id = collaboration_id and c.owner_id = auth.uid())
  or auth.uid() = user_id
);
create policy "Owners can delete members" on public.collaboration_members for delete using (
  exists (select 1 from public.collaborations c where c.id = collaboration_id and c.owner_id = auth.uid())
);

-- Collaboration Messages: members of the collaboration can read/write
create policy "Members can view messages" on public.collaboration_messages for select using (
  exists (select 1 from public.collaboration_members cm where cm.collaboration_id = collaboration_id and cm.user_id = auth.uid())
);
create policy "Members can send messages" on public.collaboration_messages for insert with check (
  auth.uid() = user_id and
  exists (select 1 from public.collaboration_members cm where cm.collaboration_id = collaboration_id and cm.user_id = auth.uid())
);

-- Collaboration Resources
create policy "Members can view resources" on public.collaboration_resources for select using (
  exists (select 1 from public.collaboration_members cm where cm.collaboration_id = collaboration_id and cm.user_id = auth.uid())
);
create policy "Members can share resources" on public.collaboration_resources for insert with check (
  exists (select 1 from public.collaboration_members cm where cm.collaboration_id = collaboration_id and cm.user_id = auth.uid())
);

-- Notifications: users see their own
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this separately if needed:
-- insert into storage.buckets (id, name, public) values ('files', 'files', false);
-- create policy "Users can upload files" on storage.objects for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can view own files" on storage.objects for select using (auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Users can delete own files" on storage.objects for delete using (auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- REALTIME (enable for chat_messages)
-- ============================================
alter publication supabase_realtime add table public.collaboration_messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.tasks;
