CREATE TABLE public.translation_cache (
  hash TEXT NOT NULL,
  target TEXT NOT NULL,
  translated TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (hash, target)
);
GRANT ALL ON public.translation_cache TO service_role;
ALTER TABLE public.translation_cache ENABLE ROW LEVEL SECURITY;