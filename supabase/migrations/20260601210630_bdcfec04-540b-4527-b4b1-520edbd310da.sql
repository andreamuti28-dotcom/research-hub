-- Add scheduled publish for papers
ALTER TABLE public.papers
  ADD COLUMN IF NOT EXISTS publish_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_papers_publish_at ON public.papers(publish_at);

-- Allow admins to delete market reports policy already exists; ensure delete is enabled
-- (RLS already permits admin delete via existing policy)

-- Set default market schedule label for daily 7am tue-sat
UPDATE public.site_settings
SET market_sync_schedule = 'weekdays_7am'
WHERE singleton = true AND market_sync_schedule = 'manual';
