-- Default new "daily_7am" schedule for the market sync
ALTER TABLE public.site_settings ALTER COLUMN market_sync_schedule SET DEFAULT 'daily_7am';
UPDATE public.site_settings SET market_sync_schedule = 'daily_7am' WHERE market_sync_schedule IN ('manual','weekdays_7am');

-- Enable required extensions for scheduled HTTP triggers
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any previously-scheduled market-sync jobs
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT jobid FROM cron.job WHERE jobname LIKE 'market-sync%' LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END $$;

-- Hourly trigger: webhook itself enforces "once per day after 07:00 Europe/Rome".
-- /api/public/* bypasses auth at the edge; `force=false` so no secret needed.
SELECT cron.schedule(
  'market-sync-hourly',
  '5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--34b2a20e-95a6-4f33-89b6-7087554072b8.lovable.app/api/public/hooks/market-sync',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);