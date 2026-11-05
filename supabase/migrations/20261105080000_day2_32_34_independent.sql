-- 3.2 i 3.4: samodzielne zadania (UPDATE, bez usuwania). Wyniki, próby i konta bez zmian.

UPDATE public.levels l
SET
  title = 'Wypisz ustalenia z notatek',
  boss_dialogue = $t$Masz notatki z zebrania kierowników. Później zrobisz z nich podsumowanie dla zarządu. Teraz tylko wypisz fakty.$t$,
  config = l.config
    || jsonb_build_object(
      'situation', $t$Masz notatki z zebrania kierowników. Później zrobisz z nich podsumowanie dla zarządu. Teraz tylko wypisz fakty.$t$,
      'reference', jsonb_build_object('prompt', $t$Jesteś asystentem zarządu. Z notatek poniżej zrobimy później podsumowanie dla zarządu. Wypisz decyzje, terminy i który dział za co odpowiada. Nie dopisuj niczego, czego nie ma w notatkach. Format: tabela z kolumnami decyzja / termin / dział. Pod tabelą osobno wypisz rzeczy niepewne, bez decyzji. Notatki: [wklejone notatki]$t$),
      'other_example', jsonb_build_object(
        'situation', $t$Notatki z rozmowy z klientem przed ofertą.$t$,
        'text', $t$Jesteś handlowcem. Z notatek z rozmowy z klientem wypisz tylko potrzeby klienta, budżet i terminy. Niczego nie zgaduj. Lista punktów, a na końcu osobno to, czego klient nie był pewien. Notatki: [notatki]$t$
      ),
      'evaluator', $t$Uczestnik pisze samodzielny prompt: AI ma tylko wypisać z notatek zebrania decyzje, terminy i działy. To zadanie nie odwołuje się do innego ćwiczenia. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = po co: z wyniku powstanie później podsumowanie dla zarządu (np. „Z notatek zrobimy później podsumowanie dla zarządu”); 3 = zakaz dopisywania czegokolwiek spoza notatek (np. „Nie dopisuj niczego, czego nie ma w notatkach”, „niczego nie zgaduj”); 4 = tabela z kolumnami decyzja, termin, dział (zapis „decyzja / termin / dział” też się liczy); 5 = rzeczy niepewne, bez decyzji, wypisane osobno; 6 = notatki z zebrania wklejone pod promptem (treść notatek, np. zdania o cenniku, technikach, przeglądzie klimatyzacji, raporcie). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = uczestnik prosi AI od razu o gotowe podsumowanie dla zarządu albo maila (zamiast tylko wypisać fakty) albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). WAŻNE: samo wspomnienie, że podsumowanie powstanie PÓŹNIEJ (kryterium 2), to NIE jest prośba o gotowe podsumowanie — nie dawaj za to czerwonej. Nazwy działów i daty z notatek nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. Dobry wynik AI ma 4 decyzje w tabeli (cennik, technicy, przegląd klimatyzacji, raport) i 2 rzeczy niepewne (strona, krzesła) — możesz to skomentować w informacji zwrotnej, ale strefa zależy tylko od tekstu uczestnika. BONUS: tylko gdy uczestnik każe na końcu wypisać, czego w notatkach brakuje (np. kto odpowiada za stronę).$t$
    )
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '3.2';

UPDATE public.levels l
SET
  title = 'Mail do zarządu z listy ustaleń',
  boss_dialogue = $t$Masz tabelę ustaleń z zebrania. Napisz prompt: AI ma z tej tabeli napisać krótkiego maila do zarządu.$t$,
  config = jsonb_set(
    l.config
      || jsonb_build_object(
        'situation', $t$Masz tabelę ustaleń z zebrania. Napisz prompt: AI ma z tej tabeli napisać krótkiego maila do zarządu.$t$,
        'reference', jsonb_build_object('prompt', $t$Jesteś asystentem kierownika. Z tabeli poniżej napisz krótkiego maila do zarządu. Ton rzeczowy, forma „Państwo”, do 120 słów. Decyzje wypisz w punktach z terminem i działem. Na końcu, pod nagłówkiem „Do decyzji”, wypisz sprawy bez decyzji. Używaj tylko informacji z tabeli. Jeśli coś dodajesz od siebie, oznacz to [DO SPRAWDZENIA]. Zanim oddasz maila, sprawdź, czy każda informacja jest w tabeli. Tabela: [wklejona tabela]$t$),
        'other_example', jsonb_build_object(
          'situation', $t$Z notatek z rozmowy z klientem jest już lista potrzeb. Napisz ofertę.$t$,
          'text', $t$Jesteś handlowcem. Z listy potrzeb klienta poniżej napisz krótką propozycję oferty, do 100 słów, forma „Pan/Pani”. Używaj tylko informacji z listy. Na końcu wypisz pytania do klienta. Lista: [lista]$t$
        ),
        'evaluator', $t$Uczestnik pisze samodzielny prompt: z gotowej tabeli ustaleń z zebrania AI ma napisać krótkiego maila do zarządu i nie dodać nic nieprawdziwego. To zadanie nie odwołuje się do innego ćwiczenia. KRYTERIA (pole spelnione): 1 = rola AI (każde „Jesteś …” się liczy) ORAZ odbiorca maila: zarząd; 2 = długość (np. „do 120 słów”, „krótko, maksymalnie 100 słów”) ORAZ układ (np. decyzje w punktach z terminem i działem); 3 = tylko informacje z tabeli (np. „Używaj tylko informacji z tabeli”, „nie dopisuj nic spoza tabeli”); 4 = co zrobić ze sprawami bez decyzji (np. osobno, pod nagłówkiem „Do decyzji”); 5 = oznaczenie [DO SPRAWDZENIA] dla tego, co AI doda od siebie — WYMAGANE właśnie to oznaczenie; samo „nie dodawaj nic od siebie” bez [DO SPRAWDZENIA] NIE spełnia kryterium 5; 6 = tabela ustaleń wklejona pod promptem (treść tabeli, np. wiersze o cenniku, technikach, przeglądzie klimatyzacji, raporcie). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = brak tabeli albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Nazwy działów i daty z tabeli nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. Dobry wynik AI: 4 decyzje w punktach (cennik, technicy, przegląd klimatyzacji, raport) i osobno „Do decyzji” (strona, krzesła), bez nowych faktów — możesz to skomentować w informacji zwrotnej, ale strefa zależy tylko od tekstu uczestnika. BONUS: tylko gdy uczestnik każe AI samo sprawdzić maila przed oddaniem, czy każda informacja jest w tabeli (np. „Zanim oddasz maila, sprawdź, czy każda informacja jest w tabeli”).$t$
      ),
    '{blocks,0,title}',
    to_jsonb('Tabela ustaleń (do skopiowania)'::text)
  )
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '3.4';
