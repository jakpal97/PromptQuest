-- 1.1 i 1.4: poprawki w rozmowie, bez RCTF. UPDATE, bez usuwania wyników.

UPDATE public.levels l
SET config = jsonb_set(
  l.config,
  '{evaluator}',
  to_jsonb($t$TO JEST POPRAWKA W ROZMOWIE, NIE PEŁNY PROMPT. ZAKAZ RCTF: nie wymagaj roli, kontekstu, zadania ani formatu. Ich brak NIE obniża oceny. W informacji zwrotnej NIGDY nie pisz o roli, kontekście, formacie ani RCTF. Oceniasz TYLKO 5 błędów: (A) data 1 maja → 1 marca; (B) godziny 8–18 → 7–17, pn–pt; (C) soboty czynne → zamknięte; (D) „dojazd gratis” do usunięcia; (E) „Hej” i wykrzykniki → forma „Państwo”. Błąd zaliczony, gdy jest konkretna poprawna informacja. „Od marca” bez dnia NIE zalicza A — żółta, „Podaj dokładną datę.”. „Ton miły” bez „Państwo” NIE zalicza E. ZIELONA = wszystkie 5. ŻÓŁTA = 2–4 z 5. CZERWONA = 0–1 z 5 albo „popraw to” / „sprawdź fakty”, albo dane z czerwonej strefy. Sprawdzasz tylko tekst uczestnika. BONUS: gdy uczestnik dopisuje, żeby AI nie dodawało niczego spoza faktów.$t$::text)
)
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.4';

UPDATE public.levels l
SET config = jsonb_set(
  l.config,
  '{evaluator}',
  to_jsonb(
    regexp_replace(
      l.config->>'evaluator',
      '^',
      'ZAKAZ W INFORMACJI ZWROTNEJ: nigdy nie pisz o roli, kontekście, formacie ani RCTF. '
    )
  )
)
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.1'
  AND l.config->>'evaluator' NOT LIKE 'ZAKAZ W INFORMACJI ZWROTNEJ:%';
