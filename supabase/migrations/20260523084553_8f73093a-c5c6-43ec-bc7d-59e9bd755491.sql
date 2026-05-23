
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_languages_bar_track_color text NOT NULL DEFAULT '#ffffff33',
  ADD COLUMN IF NOT EXISTS about_portrait_pos_x integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS about_portrait_pos_y integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS about_tooltip_bg text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN IF NOT EXISTS about_tooltip_fg text NOT NULL DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS about_tooltip_border text NOT NULL DEFAULT '#e5e7eb';
