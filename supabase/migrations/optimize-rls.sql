-- ============================================
-- StudSync — RLS Policy Optimization
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Optimized helper for collaboration membership
-- Uses 'security definer' to bypass RLS within the function itself, preventing recursion.
CREATE OR REPLACE FUNCTION public.check_collab_membership(cid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collaboration_members
    WHERE collaboration_id = cid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update Collaboration Members Policy
DROP POLICY IF EXISTS "Members can view collaboration members" ON public.collaboration_members;
CREATE POLICY "Members can view collaboration members"
ON public.collaboration_members FOR SELECT
USING (
  user_id = auth.uid() OR
  public.check_collab_membership(collaboration_id)
);

-- 3. Update Collaborations Policy
DROP POLICY IF EXISTS "Users can view own collaborations" ON public.collaborations;
CREATE POLICY "Users can view own collaborations"
ON public.collaborations FOR SELECT
USING (
  auth.uid() = owner_id OR
  public.check_collab_membership(id)
);

-- 4. Update Chat Messages Policy
DROP POLICY IF EXISTS "Members can view chat" ON public.chat_messages;
CREATE POLICY "Members can view chat"
ON public.chat_messages FOR SELECT
USING (
  public.check_collab_membership(collaboration_id)
);

DROP POLICY IF EXISTS "Members can send chat" ON public.chat_messages;
CREATE POLICY "Members can send chat"
ON public.chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  public.check_collab_membership(collaboration_id)
);
