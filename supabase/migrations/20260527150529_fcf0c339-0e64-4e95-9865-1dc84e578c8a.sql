ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS favicon_url text,
ADD COLUMN IF NOT EXISTS favicon_original_url text,
ADD COLUMN IF NOT EXISTS favicon_pos_x integer NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS favicon_pos_y integer NOT NULL DEFAULT 50;