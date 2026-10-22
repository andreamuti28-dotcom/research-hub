-- Background jobs, previously configured by hand in Lovable Cloud.
-- 1) Publish scheduled papers when their publish_at time has passed.
select cron.schedule(
  'papers-auto-publish',
  '*/5 * * * *',
  $$
  update public.papers
     set is_published = true
   where is_published = false
     and publish_at is not null
     and publish_at <= now();
  $$
);

-- 2) Ask the site to refresh the market report from the Google Doc.
--    The endpoint itself decides whether a sync is due (site_settings schedule).
select cron.schedule(
  'market-sync-hourly',
  '5 * * * *',
  $$
  select net.http_post(
    url := 'https://www.andreamuti.com/api/public/hooks/market-sync',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
