UPDATE public.papers p SET tags = sub.new_tags
FROM (
  SELECT id, ARRAY(
    SELECT DISTINCT y FROM unnest(tags) AS t,
    LATERAL unnest(
      CASE t
        WHEN 'Derivatives' THEN ARRAY['Derivati']
        WHEN 'Derivati quant' THEN ARRAY['Derivati','Quant']
        WHEN 'Inflation' THEN ARRAY['Inflazione']
        ELSE ARRAY[t]
      END
    ) AS y
  ) AS new_tags
  FROM public.papers
) sub
WHERE p.id = sub.id AND p.tags IS DISTINCT FROM sub.new_tags;