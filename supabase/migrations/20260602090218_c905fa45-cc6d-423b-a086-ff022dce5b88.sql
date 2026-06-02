ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS i18n_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS theme_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;