insert into public.dashboards (component_key, title, title_en, description, description_en, is_published, sort_order)
values
  ('interesse-composto', 'Interesse Semplice vs Composto', 'Simple vs Compound Interest',
   'Confronta la crescita del capitale con interesse semplice e composto, versamenti periodici e frequenze di capitalizzazione.',
   'Compare capital growth with simple and compound interest, periodic contributions and compounding frequencies.',
   true, 10),
  ('efficienza-fiscale', 'Efficienza Fiscale dei Capitali', 'Capital Tax Efficiency',
   'ETF ad accumulazione vs distribuzione: drag fiscale, imposta di bollo e plusvalenze su orizzonti pluriennali.',
   'Accumulating vs distributing ETFs: tax drag, wealth tax and capital gains over multi-year horizons.',
   true, 20),
  ('stress-test', 'Stress Test di Portafoglio', 'Portfolio Stress Test',
   'Applica scenari di shock a un portafoglio multi-asset e osserva l''impatto sul patrimonio netto.',
   'Apply market shock scenarios to a multi-asset portfolio and see the impact on net worth.',
   true, 30)
on conflict do nothing;