CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  email_hash text,
  succeeded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX login_attempts_ip_time_idx ON public.login_attempts (ip_hash, created_at DESC);
GRANT ALL ON public.login_attempts TO service_role;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login_attempts_admin_read" ON public.login_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));