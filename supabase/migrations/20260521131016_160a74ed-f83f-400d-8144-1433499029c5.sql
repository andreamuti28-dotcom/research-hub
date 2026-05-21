ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_education jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS about_education_label text DEFAULT 'Formazione',
  ADD COLUMN IF NOT EXISTS about_certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS about_certifications_label text DEFAULT 'Certificazioni',
  ADD COLUMN IF NOT EXISTS about_languages_bar_color text DEFAULT '#000000';

UPDATE public.site_settings
SET about_software_label = 'Software & AI'
WHERE about_software_label IS NULL OR about_software_label = 'Software';