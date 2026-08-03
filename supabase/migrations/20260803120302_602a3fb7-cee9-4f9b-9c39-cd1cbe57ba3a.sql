alter table public.site_settings
  add column if not exists hero_logo_light_url text,
  add column if not exists hero_logo_dark_url text,
  add column if not exists forbes_url text;