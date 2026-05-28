ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS market_doc_id text NOT NULL DEFAULT '1vqcD0XRhjqMPyX2JsB99Sk_zlCU_xaJU9Obve_lV3q8',
  ADD COLUMN IF NOT EXISTS market_sync_schedule text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS market_last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS market_last_sync_file text;