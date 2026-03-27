-- ============================================
-- StudSync — RLS Recursion Fix
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Helper Function to avoid recursion in profiles
create or replace function public.is_admin() 
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Helper Function to avoid recursion in collaboration_members
create or replace function public.is_collab_member(collab_id uuid) 
returns boolean as $$
begin
  return exists (
    select 1 from public.collaboration_members 
    where collaboration_id = collab_id and user_id = auth.uid()
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 3. Fix Profiles Policies
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin() or auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

-- 4. Fix Collaboration Members Policies
drop policy if exists "Members can view collaboration members" on public.collaboration_members;

create policy "Members can view collaboration members" 
on public.collaboration_members for select 
using (
  user_id = auth.uid() or 
  public.is_collab_member(collaboration_id)
);

-- 5. Fix Collaborations Policies
drop policy if exists "Users can view own collaborations" on public.collaborations;

create policy "Users can view own collaborations" on public.collaborations for select using (
  auth.uid() = owner_id or
  public.is_collab_member(id)
);
