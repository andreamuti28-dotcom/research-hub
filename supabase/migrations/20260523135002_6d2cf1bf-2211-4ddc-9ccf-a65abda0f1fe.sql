ALTER TABLE public.site_settings 
ADD COLUMN IF NOT EXISTS home_market_disclaimer text NOT NULL DEFAULT 'Intelligenza Artificiale integrata',
ADD COLUMN IF NOT EXISTS archive_disclaimer text NOT NULL DEFAULT 'Intelligenza Artificiale integrata';