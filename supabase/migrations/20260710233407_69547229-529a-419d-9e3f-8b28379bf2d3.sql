INSERT INTO public.dashboards (component_key, title, title_en, is_published, sort_order)
VALUES
  ('ribilanciamento', 'Ribilanciamento e Drift di Portafoglio', 'Portfolio Rebalancing & Drift', true, 40),
  ('rischio-sequenza', 'Rischio di Sequenza dei Rendimenti', 'Sequence of Returns Risk', true, 50)
ON CONFLICT DO NOTHING;