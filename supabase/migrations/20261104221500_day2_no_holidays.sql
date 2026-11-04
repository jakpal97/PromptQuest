-- Dzień 2 · zadania 1.1, 1.2, 1.3, 3.2 bez motywu świąt.
-- Tylko UPDATE tekstów (sytuacja, dane, „Nie zapomnij o”, wzorzec, przykład z innej sytuacji, instrukcja oceniającego).
-- ID zadań, punkty, kolejność i wszystkie wyniki uczestników zostają bez zmian.

-- 1.1 · przykład z innej sytuacji
UPDATE public.levels l
SET config = jsonb_set(l.config, '{other_example}', jsonb_build_object(
  'situation', $t$AI napisało ogłoszenie o remoncie parkingu, ale za długie i bez dat.$t$,
  'text', $t$Skróć do 60 słów. Dodaj daty: parking zamknięty od 10 do 12 marca. Usuń przeprosiny z pierwszego akapitu, zostaw jedno krótkie zdanie z przeprosinami na końcu.$t$
))
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.1';

-- 1.2 · sytuacja, „Nie zapomnij o” punkt 2, wzorzec, instrukcja oceniającego
UPDATE public.levels l
SET boss_dialogue = $t$Jesteś kierownikiem. Chcesz zaprosić swój zespół (15 osób) na spotkanie podsumowujące kwartał. Wiesz tylko tyle: w przyszłym miesiącu, w biurze, około godziny. Chcesz podziękować za ostatnie miesiące i porozmawiać o planach.$t$,
    config = jsonb_set(jsonb_set(jsonb_set(
      l.config || jsonb_build_object(
        'situation', $t$Jesteś kierownikiem. Chcesz zaprosić swój zespół (15 osób) na spotkanie podsumowujące kwartał. Wiesz tylko tyle: w przyszłym miesiącu, w biurze, około godziny. Chcesz podziękować za ostatnie miesiące i porozmawiać o planach.$t$,
        'evaluator', $t$Uczestnik pisze prompt, po którym AI ma NAJPIERW zadać 3 pytania, a dopiero potem napisać zaproszenie na spotkanie zespołu podsumowujące kwartał. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy, także ogólne; 2 = fakty, które uczestnik już zna: 15 osób, przyszły miesiąc, biuro, około godziny, podziękowanie za ostatnie miesiące, plany — innymi słowami też się liczą (np. „15-osobowy zespół”, „w przyszłym miesiącu”, „godzinne spotkanie”, „omówić plany na kolejny kwartał”); 3 = długość ORAZ ton zaproszenia (np. „maksymalnie 80 słów, ton ciepły”); 4 = prośba, żeby AI przed napisaniem zadało 3 pytania (np. „Zanim zaczniesz, zadaj mi 3 pytania”). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1, 2, 3 i 4. ŻÓŁTA = jest prośba o pytania (4), ale brakuje dokładnie jednej z rzeczy 1–3. CZERWONA = brak prośby o pytania albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. UWAGA: poprawna odpowiedź AI (<odpowiedz_ai>) to 3 pytania, a nie gotowe zaproszenie — to dobry wynik i nie obniża oceny; możesz to pochwalić w co_poszlo_dobrze. BONUS: tylko gdy uczestnik podpowiada, o co AI ma pytać (np. dokładna data, sala, czy ktoś ma coś przygotować).$t$
      ),
      '{remember,1}', to_jsonb($t$to, co już wiesz: 15 osób, przyszły miesiąc, biuro, około godziny, podziękowanie i plany$t$::text)),
      '{zones,green,1}', to_jsonb($t$to, co już wiesz: 15 osób, przyszły miesiąc, biuro, około godziny, podziękowanie i plany$t$::text)),
      '{reference,prompt}', to_jsonb($t$Jesteś asystentem kierownika działu. Chcę zaprosić 15-osobowy zespół na spotkanie podsumowujące kwartał: w przyszłym miesiącu, w biurze, około godziny. Cel: podziękować za ostatnie miesiące i omówić plany na kolejny kwartał. Napisz zaproszenie, maksymalnie 80 słów, ton ciepły i bezpośredni. Zanim zaczniesz, zadaj mi 3 pytania, np. o dokładną datę, salę i to, czy ktoś ma coś przygotować.$t$::text))
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.2';

-- 1.3 · sytuacja, poprawka 3, wzorzec, instrukcja oceniającego
UPDATE public.levels l
SET boss_dialogue = $t$Pracujesz w recepcji. Pisałeś z AI ogłoszenie dla klientów o zmianie godzin pracy biura w czasie inwentaryzacji. Musiałeś je poprawiać 4 razy. Oto Twoje poprawki:$t$,
    config = jsonb_set(jsonb_set(
      l.config || jsonb_build_object(
        'situation', $t$Pracujesz w recepcji. Pisałeś z AI ogłoszenie dla klientów o zmianie godzin pracy biura w czasie inwentaryzacji. Musiałeś je poprawiać 4 razy. Oto Twoje poprawki:$t$,
        'evaluator', $t$Uczestnik pisze od nowa jeden prompt na ogłoszenie o zmianie godzin pracy biura w czasie inwentaryzacji, w którym od razu są wszystkie 4 wcześniejsze poprawki. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = odbiorca: klienci firmy; 3 = wszystkie daty i godziny: 10 i 11 marca czynne 8:00–12:00 oraz 12 marca zamknięte (wszystkie trzy dni); 4 = limit do 80 słów (także „maksymalnie 80 słów”); 5 = bez emotek (także „bez emotikon”, „bez emoji”); 6 = forma „Państwo” — „Pan/Pani”, „per Pan” albo „Ty” NIE spełnia tego kryterium. Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione wszystkie 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = brakuje dwóch lub więcej albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Placeholder [TELEFON] i godziny pracy firmy nie są danymi z czerwonej strefy. Gdy brakuje daty lub godziny, w braki i przyklad_zdania przepisz brakujący fragment dokładnie z poprawki 3, np. „Dopisz: 12 marca zamknięte”. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS: tylko gdy uczestnik mówi, co ma być na końcu ogłoszenia (np. kontakt w pilnych sprawach jako [TELEFON]).$t$
      ),
      '{blocks,0,lines,2}', to_jsonb($t$3) „dodaj: 10 i 11 marca czynne 8:00–12:00, 12 marca zamknięte”$t$::text)),
      '{reference,prompt}', to_jsonb($t$Jesteś pracownikiem recepcji. Napisz informację dla klientów firmy o zmianie godzin pracy biura w czasie inwentaryzacji: 10 i 11 marca czynne 8:00–12:00, 12 marca zamknięte. Pisz do klientów na „Państwo”, bez emotek, maksymalnie 80 słów. Na końcu podaj kontakt w pilnych sprawach: [TELEFON].$t$::text))
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.3';

-- 3.2 · notatki z zebrania, instrukcja oceniającego (4 decyzje: cennik, technicy, przegląd klimatyzacji, raport)
UPDATE public.levels l
SET config = jsonb_set(
      l.config || jsonb_build_object(
        'evaluator', $t$Uczestnik pisze PIERWSZY KROK łańcucha: AI ma tylko wypisać z notatek zebrania decyzje, terminy i działy. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = po co: z wyniku powstanie później podsumowanie dla zarządu (np. „Z notatek zrobimy później podsumowanie dla zarządu, ale teraz tylko krok 1”); 3 = zakaz dopisywania czegokolwiek spoza notatek (np. „Nie dopisuj niczego, czego nie ma w notatkach”, „niczego nie zgaduj”); 4 = tabela z kolumnami decyzja, termin, dział (zapis „decyzja / termin / dział” też się liczy); 5 = rzeczy niepewne, bez decyzji, wypisane osobno; 6 = notatki z zebrania wklejone pod promptem (treść notatek, np. zdania o cenniku, technikach, przeglądzie klimatyzacji, raporcie). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = uczestnik prosi AI od razu o gotowe podsumowanie dla zarządu albo maila (zamiast tylko wypisać fakty) albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). WAŻNE: samo wspomnienie, że podsumowanie powstanie PÓŹNIEJ (kryterium 2), to NIE jest prośba o gotowe podsumowanie — nie dawaj za to czerwonej. Nazwy działów i daty z notatek nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. Dobry wynik AI ma 4 decyzje w tabeli (cennik, technicy, przegląd klimatyzacji, raport) i 2 rzeczy niepewne (strona, krzesła) — możesz to skomentować w informacji zwrotnej, ale strefa zależy tylko od tekstu uczestnika. BONUS: tylko gdy uczestnik każe na końcu wypisać, czego w notatkach brakuje (np. kto odpowiada za stronę).$t$
      ),
      '{blocks,0,text}', to_jsonb($t$Nowy cennik od 1 stycznia, dział handlowy przygotuje go do 20 listopada. Serwis dostaje dwóch nowych techników od grudnia, kadry ogłaszają rekrutację w tym tygodniu. Przegląd klimatyzacji 4 grudnia organizuje recepcja. Może w przyszłym roku nowa strona internetowa? Nikt nie wie, kto by to robił. Zarząd chce raport kwartalny do 10 stycznia, przygotowuje kierownictwo. Ktoś wspomniał o nowych krzesłach do biura, bez decyzji.$t$::text))
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '3.2';
