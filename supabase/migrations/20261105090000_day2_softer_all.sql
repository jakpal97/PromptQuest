-- Dzień 2: łagodniejsze strefy we wszystkich 12 + 1.4 remember/evaluator.
-- UPDATE, bez usuwania. Wyniki, próby i konta bez zmian.

WITH strefy(code, yellow, red) AS (
  VALUES
    ('1.1', '["Brakuje jednej albo dwóch rzeczy."]'::jsonb,
            '["Ogólna poprawka („popraw to”, „lepiej”, „jeszcze raz”) albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('1.2', '["Brakuje jednej albo dwóch rzeczy (ale prośba o pytania jest)."]'::jsonb,
            '["Brak prośby o pytania albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('1.3', '["Brakuje jednej albo dwóch rzeczy."]'::jsonb,
            '["Brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('1.4', '["Poprawione 2–4 z 5 błędów."]'::jsonb,
            '["Ogólna poprawka („popraw to”, „sprawdź fakty”) albo poprawione 0–1 z 5 błędów. Także: dane z czerwonej strefy."]'::jsonb),
    ('2.1', '["Brakuje jednej albo dwóch rzeczy (np. przykłady bez podpisów albo brak jednego faktu)."]'::jsonb,
            '["Brak przykładów albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('2.2', '["Brakuje jednej albo dwóch rzeczy (np. nie ma miejsca na notatki albo nie wiadomo, co ma być w mailu)."]'::jsonb,
            '["Samo „napisz mi prompt” albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('2.3', '["Brakuje jednej albo dwóch rzeczy (najczęściej zakazu kopiowania)."]'::jsonb,
            '["Nadal tylko jeden przykład albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('2.4', '["Brakuje jednej albo dwóch rzeczy (np. nie ma, co zrobić z brakującą cechą)."]'::jsonb,
            '["Brak przykładów albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('3.1', '["Brakuje jednej albo dwóch rzeczy."]'::jsonb,
            '["Brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('3.2', '["Brakuje jednej albo dwóch rzeczy."]'::jsonb,
            '["Prosisz od razu o gotowe podsumowanie albo maila, albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb),
    ('3.3', '["Są 1–3 granice z 4."]'::jsonb,
            '["Brak granic albo brak instrukcji. Także: dane z czerwonej strefy."]'::jsonb),
    ('3.4', '["Brakuje jednej albo dwóch rzeczy."]'::jsonb,
            '["Brak tabeli albo brakuje trzech lub więcej rzeczy. Także: dane z czerwonej strefy."]'::jsonb)
)
UPDATE public.levels l
SET config = jsonb_set(
      jsonb_set(l.config, '{zones,yellow}', s.yellow),
      '{zones,red}', s.red
    )
FROM strefy s, public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = s.code;

-- Progi w uwadze dla oceniającego: 1–2 = żółta, 3+ = czerwona
UPDATE public.levels l
SET config = jsonb_set(
  l.config,
  '{evaluator}',
  to_jsonb(
    replace(replace(replace(replace(replace(replace(l.config->>'evaluator',
      'ŻÓŁTA = jest prośba o pytania (4), ale brakuje dokładnie jednej z rzeczy 1–3.',
      'ŻÓŁTA = jest prośba o pytania (4), ale brakuje jednej albo dwóch z rzeczy 1–3.'),
      'ŻÓŁTA = brakuje dokładnie jednej z nich.',
      'ŻÓŁTA = brakuje jednej albo dwóch z nich.'),
      'ŻÓŁTA = brakuje dokładnie jednej',
      'ŻÓŁTA = brakuje jednej albo dwóch'),
      'ŻÓŁTA = są 3 z 4 granic. CZERWONA = są 0–2 granice',
      'ŻÓŁTA = są 1–3 granice z 4. CZERWONA = brak granic'),
      'brakuje dwóch lub więcej',
      'brakuje trzech lub więcej'),
      'brakuje dwóch lub więcej rzeczy',
      'brakuje trzech lub więcej rzeczy')
  )
)
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code <> '1.4';

-- 1.4: lista „Nie zapomnij o” i uwaga 1:1 z pliku + nowe progi
UPDATE public.levels l
SET config = jsonb_set(
      jsonb_set(
        jsonb_set(l.config, '{remember}', $j$["każdy błąd nazwany konkretnie, razem z poprawną informacją","sprawdź datę, godziny, soboty i to, co AI dopisało od siebie","forma i ton dla klientów firmy"]$j$::jsonb),
        '{zones,green}',
        $j$["każdy błąd nazwany konkretnie, razem z poprawną informacją","sprawdź datę, godziny, soboty i to, co AI dopisało od siebie","forma i ton dla klientów firmy"]$j$::jsonb
      ),
      '{evaluator}',
      to_jsonb($t$TO JEST POPRAWKA W ROZMOWIE, NIE PEŁNY PROMPT. Nie wymagaj RCTF. Błędy do znalezienia (5): data 1 maja → 1 marca; godziny 8–18 → 7–17; soboty czynne → zamknięte; „dojazd gratis” do usunięcia; „Hej” i wykrzykniki → forma „Państwo”, ton rzeczowy. Błąd jest poprawiony tylko wtedy, gdy uczestnik nazywa go konkretnie i podaje poprawną informację z faktów. „Od marca” bez dnia (bez „1”) NIE zalicza daty w pełni — wtedy żółta i wskazówka „Podaj dokładną datę.”. „Ton miły”, „uprzejmy” albo „rzeczowy” BEZ „Państwo” NIE zalicza formy. ZIELONA = wszystkie 5 błędów, każdy z poprawną wartością. ŻÓŁTA = poprawione 2, 3 albo 4 z 5 (także „od marca” bez dnia). CZERWONA = poprawione 0 albo 1 z 5 albo ogólna poprawka bez konkretów („popraw to”, „sprawdź fakty”), albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Daty i godziny z faktów nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. INFORMACJA ZWROTNA: uczestnik ma sam znaleźć błędy. W polach braki, przyklad_zdania, wskazowka i co_poszlo_dobrze NIE podawaj poprawnych wartości z faktów (wyjątek: przy „od marca” bez dnia napisz „Podaj dokładną datę.”). NIE nazywaj wprost pominiętego błędu — powiedz tylko, gdzie szukać. Najwyżej 2 rzeczy naraz. BONUS: tylko gdy uczestnik dopisuje, żeby AI nie dodawało niczego, czego nie ma w faktach.$t$::text)
    )
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.4';
