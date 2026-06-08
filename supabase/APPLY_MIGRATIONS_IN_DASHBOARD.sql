-- Run this file in Supabase Dashboard -> SQL Editor for project ysumwujijzmqribptero.
-- It combines the existing migrations in timestamp order.

-- 20260602051400_f834aaa5-dbed-4966-8551-6ac63c215a16.sql
-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- user_progress (one row per user per level)
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  level_id INTEGER NOT NULL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  money INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, level_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own progress" ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert own progress" ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update own progress" ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete own progress" ON public.user_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 20260602051421_bfac9ec2-f9bd-4624-9359-ec99c51197d9.sql
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 20260602052819_a4716e74-5b8e-43a8-a471-9fc164ec3108.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_level_idx integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_question_idx integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_money integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level_correct integer NOT NULL DEFAULT 0;

-- 20260602085128_636c7b53-41f5-4207-b23e-623441d8d266.sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_wrong integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS best_score integer NOT NULL DEFAULT 0;
