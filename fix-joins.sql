-- 1. Fix collaboration_members user_id reference
ALTER TABLE public.collaboration_members 
DROP CONSTRAINT IF EXISTS collaboration_members_user_id_fkey;

ALTER TABLE public.collaboration_members
ADD CONSTRAINT collaboration_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Fix chat_messages user_id reference
ALTER TABLE public.chat_messages 
DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

ALTER TABLE public.chat_messages
ADD CONSTRAINT chat_messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 3. Simplify Profiles RLS (Crucial to fix 401 Errors)
-- This allows any logged-in user to see other profiles, which is needed for collaborations
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Allow authenticated to view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- 4. Fix other user_id references for consistency
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_user_id_fkey;
ALTER TABLE public.files ADD CONSTRAINT files_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
ALTER TABLE public.notes ADD CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
