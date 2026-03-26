-- 1. DROP EXISTING CONFLICTING TABLES (Ensures fresh schema)
DROP TABLE IF EXISTS public.pomodoro_settings;
DROP TABLE IF EXISTS public.user_settings;

-- 2. Create user_settings table
CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create pomodoro_settings table
CREATE TABLE public.pomodoro_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    focus_duration INTEGER DEFAULT 25 NOT NULL,
    short_break INTEGER DEFAULT 5 NOT NULL,
    long_break INTEGER DEFAULT 15 NOT NULL,
    rounds INTEGER DEFAULT 4 NOT NULL,
    auto_start BOOLEAN DEFAULT false NOT NULL,
    sound_enabled BOOLEAN DEFAULT true NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_settings ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own pomodoro settings" ON public.pomodoro_settings
    FOR ALL USING (auth.uid() = user_id);
