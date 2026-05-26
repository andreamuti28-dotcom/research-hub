ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS news_api_url text NOT NULL DEFAULT 'https://script.google.com/macros/s/AKfycbyS4MxYpizImm4c2KaO4JuvSCjKQyHRtwFw5lSqWuuy8pCQf01yLyfpv-zVcCJMnyRkiQ/exec',
  ADD COLUMN IF NOT EXISTS news_countdown_color text NOT NULL DEFAULT '#9ca3af';