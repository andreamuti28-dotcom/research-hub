ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_kicker text DEFAULT 'Chi sono',
  ADD COLUMN IF NOT EXISTS about_languages_label text DEFAULT 'Lingue',
  ADD COLUMN IF NOT EXISTS about_software_label text DEFAULT 'Software',
  ADD COLUMN IF NOT EXISTS about_hobbies_label text DEFAULT 'Hobby',
  ADD COLUMN IF NOT EXISTS about_panel_bg text DEFAULT '#f5c518',
  ADD COLUMN IF NOT EXISTS about_panel_fg text DEFAULT '#000000';