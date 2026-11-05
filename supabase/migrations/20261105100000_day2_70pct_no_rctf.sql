-- Dzień 2: progi 70% + zakaz RCTF w 1.1/1.4/2.2/3.3. UPDATE, bez usuwania wyników.

UPDATE public.levels l
SET config = jsonb_set(
  l.config,
  '{evaluator}',
  to_jsonb(
    (l.config->>'evaluator') || E'\nPROGI (MAJĄ PIERWSZEŃSTWO): ZIELONA = spełnione co najmniej 70% kryteriów z listy (3 z 4, 4 z 5, 4 z 6) i jest sedno zadania. ŻÓŁTA = mniej, ale uczestnik wyraźnie próbował. CZERWONA = tylko ogólnik („popraw to”, „sprawdź fakty”), tekst niezwiązany z zadaniem albo dane z czerwonej strefy. Oceniaj SENS, nie słowa: synonimy, własne sformułowania, literówki i brak polskich znaków się liczą. Przy wątpliwości wybieraj wyższą strefę. Bonus bez zmian.'
  )
)
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.active
  AND coalesce(l.config->>'evaluator','') NOT LIKE '%PROGI (MAJĄ PIERWSZEŃSTWO)%';

UPDATE public.levels l
SET config = jsonb_set(
  l.config,
  '{evaluator}',
  to_jsonb('ZAKAZ RCTF: nie wymagaj roli, kontekstu ani formatu od uczestnika. ' || (l.config->>'evaluator'))
)
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code IN ('1.1','1.4','2.2','3.3')
  AND coalesce(l.config->>'evaluator','') NOT LIKE 'ZAKAZ RCTF:%';
