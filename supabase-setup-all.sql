-- ============================================
-- StudSync — Unified Fix & Setup Script
-- Run this in your Supabase SQL Editor
-- ============================================

-- I. STORAGE SETUP
-- Create the 'files' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'files', 'files', false
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'files'
);

-- RLS Policies for the 'files' bucket
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete access" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual update access" ON storage.objects;

CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Allow individual read access" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Allow individual delete access" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "Allow individual update access" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'files' AND (storage.foldername(name))[1] = auth.uid()::text
);


-- II. DATABASE RLS FIXES (Avoiding Recursion)

-- 1. Helper for Admin Roles
CREATE OR REPLACE FUNCTION public.is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Helper for Collaboration Membership
CREATE OR REPLACE FUNCTION public.is_collab_member(collab_id uuid) 
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collaboration_members 
    WHERE collaboration_id = collab_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_admin());
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 4. Update Collaboration Members Policies
DROP POLICY IF EXISTS "Members can view collaboration members" ON public.collaboration_members;
DROP POLICY IF EXISTS "Owners can insert members" ON public.collaboration_members;
DROP POLICY IF EXISTS "Owners can delete members" ON public.collaboration_members;

CREATE POLICY "Members view policy" ON public.collaboration_members FOR SELECT USING (
  user_id = auth.uid() OR public.is_collab_member(collaboration_id)
);
CREATE POLICY "Members insert policy" ON public.collaboration_members FOR INSERT WITH CHECK (
    user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.collaborations WHERE id = collaboration_id AND owner_id = auth.uid()
    )
);

-- 5. Update Collaborations Policies
DROP POLICY IF EXISTS "Users can view own collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Owners can update collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Owners can delete collaborations" ON public.collaborations;

CREATE POLICY "Collabs view policy" ON public.collaborations FOR SELECT USING (
    auth.uid() = owner_id OR public.is_collab_member(id)
);

-- 6. Update Chat Messages Policies
DROP POLICY IF EXISTS "Members can view chat" ON public.chat_messages;
DROP POLICY IF EXISTS "Members can send chat" ON public.chat_messages;

CREATE POLICY "Chat view policy" ON public.chat_messages FOR SELECT USING (
    public.is_collab_member(collaboration_id)
);
CREATE POLICY "Chat insert policy" ON public.chat_messages FOR INSERT WITH CHECK (
    auth.uid() = user_id AND public.is_collab_member(collaboration_id)
);
