
CREATE TABLE public.dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_key text NOT NULL,
  title text NOT NULL,
  title_en text,
  description text,
  description_en text,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.dashboards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dashboards TO authenticated;
GRANT ALL ON public.dashboards TO service_role;

ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published dashboards"
  ON public.dashboards FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can read all dashboards"
  ON public.dashboards FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert dashboards"
  ON public.dashboards FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update dashboards"
  ON public.dashboards FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete dashboards"
  ON public.dashboards FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_dashboards_updated_at
  BEFORE UPDATE ON public.dashboards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.dashboards (component_key, title, title_en, description, description_en, sort_order)
VALUES ('mutuo', 'Simulazione Mutuo', 'Mortgage Simulation',
  'Confronta mutuo fisso e variabile con scenari BCE, ammortamento e break-even.',
  'Compare fixed and variable mortgages with ECB scenarios, amortization and break-even.',
  0);
