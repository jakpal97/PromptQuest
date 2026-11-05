-- 1.4: łagodniejsze progi (UPDATE, bez usuwania). Wyniki, próby i konta bez zmian.

UPDATE public.levels l
SET config = jsonb_set(
      jsonb_set(
        jsonb_set(l.config, '{zones,yellow}', $j$["Poprawione 3 lub 4 z 5 błędów."]$j$::jsonb),
        '{zones,red}',
        $j$["Ogólna poprawka („popraw to”, „sprawdź fakty”) albo poprawione najwyżej 2 z 5 błędów. Także: dane z czerwonej strefy."]$j$::jsonb
      ),
      '{evaluator}',
      to_jsonb($t$TO JEST POPRAWKA W ROZMOWIE, NIE PEŁNY PROMPT. Nie wymagaj roli, kontekstu, zadania ani formatu — ich brak NIE obniża oceny. Uczestnik porównuje wynik AI z faktami i pisze AI jedną wiadomość, co ma poprawić. W wyniku AI jest 5 błędów, które uczestnik musi SAM znaleźć: (A) data „od 1 maja” → od 1 marca; (B) godziny „od 8:00 do 18:00” → 7:00–17:00, od poniedziałku do piątku; (C) „także w soboty” → w soboty zamknięte; (D) „dojazd gratis” → do usunięcia albo „o dojeździe nic się nie zmienia”; (E) „Hej” i wykrzykniki → forma „Państwo”, ton rzeczowy. Błąd jest poprawiony tylko wtedy, gdy uczestnik nazywa go konkretnie i podaje poprawną informację z faktów. „Od marca” bez dnia (bez „1”) to PÓŁ PUNKTU — nie zalicza A w pełni. „Ton miły”, „uprzejmy” albo „rzeczowy” BEZ „Państwo” NIE zalicza E. ZIELONA = wszystkie 5 błędów (A–E) poprawione konkretnie, każdy z poprawną wartością. ŻÓŁTA = poprawione 3 albo 4 z 5 (także 4 pełne + pół punktu za „od marca”). CZERWONA = poprawione najwyżej 2 z 5 albo ogólna poprawka bez konkretów („popraw to”, „sprawdź fakty”, „sprawdź fakty i popraw”), albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Daty i godziny z faktów nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. INFORMACJA ZWROTNA — TA ZASADA MA PIERWSZEŃSTWO: uczestnik ma sam znaleźć błędy. W polach braki, przyklad_zdania, wskazowka i co_poszlo_dobrze NIE podawaj poprawnych wartości z faktów (wyjątek: przy pół punktu za datę napisz „Podaj dokładną datę.”). NIE nazywaj wprost pominiętego błędu — powiedz tylko, gdzie szukać. Najwyżej 2 rzeczy naraz. Każdy element braki: „Sprawdź jeszcze raz soboty.”, „Sprawdź jeszcze raz datę.”, „Sprawdź jeszcze raz godziny.”, „Sprawdź jeszcze raz, co AI dopisało od siebie.”, „Sprawdź jeszcze raz formę i ton.” albo „Podaj dokładną datę.”; przy ogólnej poprawce: „Napisz konkretnie, co jest źle i jak ma być.”. BONUS: tylko gdy uczestnik dopisuje, żeby AI nie dodawało niczego, czego nie ma w faktach.$t$::text)
    )
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.4';
