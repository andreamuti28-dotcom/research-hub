
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_role text,
  ADD COLUMN IF NOT EXISTS about_bio text,
  ADD COLUMN IF NOT EXISTS about_languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS about_software jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS about_hobbies jsonb NOT NULL DEFAULT '[]'::jsonb;
