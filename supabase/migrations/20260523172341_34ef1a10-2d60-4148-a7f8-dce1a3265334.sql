-- Header color setting
ALTER TABLE public.site_settings
ADD COLUMN IF NOT EXISTS header_bg text NOT NULL DEFAULT '#ffffff';

-- Visitor tracking
CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_token text,
  path text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_token ON public.site_visits(visitor_token);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view site visits"
ON public.site_visits
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- No public SELECT/INSERT policies: only the server (service role) writes via createServerFn.
