ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_level_idx integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_question_idx integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_money integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level_correct integer NOT NULL DEFAULT 0;