ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS total_correct integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_wrong integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS best_score integer NOT NULL DEFAULT 0;