
-- Site settings: add fields for the new home "Market Analysis" collapsible
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS home_market_label TEXT NOT NULL DEFAULT 'Analisi Mercati Finanziari',
  ADD COLUMN IF NOT EXISTS home_market_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS home_featured_label TEXT NOT NULL DEFAULT 'Paper in Evidenza';

-- Market reports table
CREATE TABLE IF NOT EXISTS public.market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL DEFAULT 'Report mercati',
  content TEXT NOT NULL DEFAULT '',
  source TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS market_reports_date_idx
  ON public.market_reports (report_date DESC, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS market_reports_only_one_current
  ON public.market_reports (is_current)
  WHERE is_current = true;

ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view market reports"
  ON public.market_reports FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert market reports"
  ON public.market_reports FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update market reports"
  ON public.market_reports FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete market reports"
  ON public.market_reports FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.market_reports;
ALTER TABLE public.market_reports REPLICA IDENTITY FULL;
