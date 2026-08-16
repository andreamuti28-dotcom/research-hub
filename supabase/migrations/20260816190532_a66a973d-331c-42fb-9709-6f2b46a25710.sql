UPDATE public.papers
SET tags = COALESCE((
  SELECT array_agg(DISTINCT CASE lower(t)
    WHEN 'derivati' THEN 'Derivatives'
    WHEN 'inflazione' THEN 'Inflation'
    WHEN 'quant' THEN 'Quant'
    WHEN 'risk management' THEN 'Risk Management'
    WHEN 'crypto' THEN 'Crypto'
    WHEN 'energy' THEN 'Energy'
    WHEN 'geopolitics' THEN 'Geopolitics'
    ELSE initcap(t)
  END)
  FROM unnest(tags) AS t
), ARRAY[]::text[]);