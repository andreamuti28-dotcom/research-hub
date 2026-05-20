ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS featured_paper_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];