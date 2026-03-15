-- ============================================
-- StudSync — Admin Role Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- Add role column to profiles
alter table public.profiles
  add column if not exists role text default 'student'
  check (role in ('student', 'admin'));

-- Allow admins to read all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Allow admins to update all profiles (for role management)
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================
-- To make a user an admin, run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@email.com';
-- ============================================
