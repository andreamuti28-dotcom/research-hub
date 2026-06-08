-- Restrict site_settings SELECT to admins (server code uses service_role and bypasses RLS)
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;

CREATE POLICY "Admins can view site settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Explicitly deny client INSERT into site_visits (all inserts go through server with service_role)
CREATE POLICY "No client inserts into site_visits"
  ON public.site_visits FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);