-- 1C „Rozbrój halucynację”: instrukcja liczy się tylko, gdy da się ją zacytować z prompta.
update public.levels
set config = jsonb_set(
  config,
  '{evaluator}',
  to_jsonb(replace(
    config->>'evaluator',
    'Pole spelnione:',
    'JAK LICZYĆ (najczęstsze błędy oceniającego): instrukcja liczy się TYLKO wtedy, gdy możesz zacytować jej słowa z <prompt_uczestnika>. To, że odpowiedź AI była ostrożna, NIE oznacza, że prompt zawiera instrukcję. Sprawdź każdą osobno: (a) słowa typu „jeśli nie znasz, napisz nie znam”, „możesz odpowiedzieć nie wiem”; (b) słowa typu „nie wymyślaj tytułów / autorów / DOI / linków”, „nie podawaj zmyślonych źródeł” — samo (a) NIE jest instrukcją (b); (c) słowa typu „oznacz pewność”, „PEWNE / NIEPEWNE”, „oddziel fakty od przypuszczeń” — samo (a) NIE jest instrukcją (c). Prompt, który ma tylko „jeśli nie znasz badania, napisz nie znam”, ma 1 instrukcję z 3, więc jest ŻÓŁTY, nawet jeśli ma pełne RCTF. Kryterium 4 (pełne RCTF) wymaga osobnego polecenia o FORMIE odpowiedzi (np. „Format:”, „w formie listy”, „lista N pozycji”, „tabela”, „maksymalnie N zdań / słów”); jeśli takiego polecenia nie ma, kryterium 4 NIE jest spełnione i strefa jest ŻÓŁTA, nawet przy wszystkich 3 instrukcjach. Bonus tylko w strefie zielonej.
Pole spelnione:'
  ))
)
where id = 29
  and position('JAK LICZYĆ' in config->>'evaluator') = 0;

-- Strefa wynika z jawnie policzonych liczb w polu analiza
update public.levels
set config = jsonb_set(
  config,
  '{evaluator}',
  to_jsonb(replace(
    config->>'evaluator',
    'Bonus tylko w strefie zielonej.
Pole spelnione:',
    'Bonus tylko w strefie zielonej. W polu analiza zakończ dokładnie tak: „Instrukcje: N z 3. RCTF: M z 4. Warunek czerwonej: TAK (który) albo NIE.” — i wybierz strefę wyłącznie na podstawie tych liczb: 0 instrukcji albo M ≤ 2 albo dane z czerwonej strefy → CZERWONA; 3 instrukcje i M = 4 → ZIELONA; w każdym innym przypadku → ŻÓŁTA.
Pole spelnione:'
  ))
)
where id = 29
  and position('Instrukcje: N z 3' in config->>'evaluator') = 0;
