-- =====================================================
-- DZIEŃ 2 — 9 zadań w 3 modułach (bloki 1–3 modułu dnia 2), treść: docs/dzien2_zadania.md (wersja 5)
-- Migracja nie dotyka graczy, prób, biblioteki ani zadań innych dni.
-- Stare zadania Dnia 2 są wyłączane flagą active, nie usuwane.
-- =====================================================

ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Wymuszona kolejność: nieaktywne ćwiczenia nie istnieją dla graczy i nie blokują kolejnych.
CREATE OR REPLACE FUNCTION public.level_lock(p_player_id uuid, p_level_id integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  WITH lvl AS (
    SELECT l.id, l.module_id, l.sort_order, COALESCE(l.block, 1) AS block,
           m.day_number, m.unlocked, COALESCE(m.active_block, 1) AS active_block
    FROM public.levels l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = p_level_id AND l.active
  ),
  prev AS (
    SELECT p.id, p.code, p.title, p.config->>'label' AS label,
           CASE WHEN p.config ? 'zones' THEN 90 ELSE 40 END AS pass_mark
    FROM public.levels p, lvl
    WHERE p.module_id = lvl.module_id
      AND p.active
      AND COALESCE(p.block, 1) = lvl.block
      AND (p.sort_order, p.id) < (lvl.sort_order, lvl.id)
    ORDER BY p.sort_order DESC, p.id DESC
    LIMIT 1
  )
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM lvl) THEN jsonb_build_object('reason', 'missing')
    WHEN EXISTS (SELECT 1 FROM public.players WHERE id = p_player_id AND role = 'admin') THEN jsonb_build_object('reason', null)
    WHEN (SELECT day_number > 1 AND NOT COALESCE(unlocked, false) FROM lvl) THEN jsonb_build_object('reason', 'module')
    WHEN (SELECT block > active_block FROM lvl) THEN jsonb_build_object('reason', 'block')
    WHEN EXISTS (SELECT 1 FROM prev)
     AND NOT EXISTS (SELECT 1 FROM public.battles b, prev
                     WHERE b.player_id = p_player_id AND b.level_id = prev.id
                       AND (b.score >= prev.pass_mark OR b.completed_via IS NOT NULL))
      THEN (SELECT jsonb_build_object('reason', 'previous', 'required',
                   jsonb_build_object('id', id, 'code', code, 'title', title, 'label', label)) FROM prev)
    ELSE jsonb_build_object('reason', null)
  END;
$$;

REVOKE ALL ON FUNCTION public.level_lock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.level_lock(uuid, integer) TO service_role;

-- Stare zadania Dnia 2 (seed „Promptowanie jak pro”, bez kodów) — wyłączone
UPDATE public.levels SET active = false
WHERE module_id = (SELECT id FROM public.modules WHERE day_number = 2)
  AND (code IS NULL OR code NOT IN ('1.1', '1.2', '1.3', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3'));

-- Dzień 2: bez utraty życia, 9 zadań. Odblokowanie dnia i modułów (bloków) zostaje w rękach trenera.
UPDATE public.modules SET total_levels = 9, lives_enabled = false WHERE day_number = 2;

-- Zadania: aktualizacja istniejących (po kodzie w module Dnia 2) albo dodanie brakujących
WITH day2 AS (
  SELECT id FROM public.modules WHERE day_number = 2
),
src (code, sort_order, block, type, title, task_description, config) AS (VALUES

('1.1', 1, 1, 'solo', 'Konkretna poprawka',
 'Napisz AI jedną wiadomość: co ma poprawić. Tak, jakbyś mu odpisywał w czacie.',
 $j${
  "label": "Zadanie 1.1",
  "block_name": "Moduł 1 · Rozmowa z AI",
  "department": "Dział handlowy",
  "duration": "10 min",
  "situation": "Poprosiłeś AI o maila do klienta. Dostawa 40 regałów będzie później: 18 listopada zamiast 12 listopada. AI napisało za długi mail. Nie ma w nim nowej daty, jest dużo przeprosin, a do klienta pisze na „Ty”.",
  "blocks": [
    {"title": "Wynik AI (początek)", "text": "„Hej! Bardzo, bardzo przepraszamy za całą sytuację. Wiemy, jak ważne są dla Ciebie terminy, i naprawdę jest nam przykro, że tym razem nie wszystko poszło zgodnie z planem. Nasz zespół robi wszystko, co w jego mocy…” (i tak dalej, razem około 250 słów)"}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "Napisz AI jedną wiadomość: co ma poprawić. Tak, jakbyś mu odpisywał w czacie."}
  ],
  "remember": [
    "ile słów ma mieć mail (np. „maksymalnie 100 słów”)",
    "nowa data: 18 listopada",
    "pisz do klienta na „Pan/Pani”",
    "co zrobić z przeprosinami (np. „przeproś jednym zdaniem”)"
  ],
  "zones": {
    "green": [
      "ile słów ma mieć mail (np. „maksymalnie 100 słów”)",
      "nowa data: 18 listopada",
      "pisz do klienta na „Pan/Pani”",
      "co zrobić z przeprosinami (np. „przeproś jednym zdaniem”)"
    ],
    "yellow": ["Brakuje jednej z tych rzeczy."],
    "red": ["Ogólna poprawka („popraw to”, „lepiej”, „jeszcze raz”) albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Każesz podać nową datę w pierwszym zdaniu."]},
  "reference": {"prompt": "Skróć do 100 słów. W pierwszym zdaniu podaj nową datę dostawy: 18 listopada. Pisz do klienta na „Pan/Pani”. Przeproś tylko jednym krótkim zdaniem na końcu."},
  "other_example": {
    "situation": "AI napisało ogłoszenie o pracy biura w Wigilię, ale za długie i bez godzin.",
    "text": "Skróć do 60 słów. Dodaj godziny: 24 grudnia biuro czynne 8:00–12:00. Usuń życzenia z pierwszego akapitu, zostaw jedno zdanie z życzeniami na końcu."
  },
  "evaluator": "TO JEST POPRAWKA W ROZMOWIE, NIE PEŁNY PROMPT. Nie wymagaj roli, kontekstu, zadania ani formatu (RCTF) — ich brak NIE obniża oceny. Uczestnik odpisuje AI, co ma poprawić w mailu o przesuniętej dostawie. KRYTERIA (pole spelnione): 1 = podaje liczbę słów albo limit długości maila (np. „maksymalnie 100 słów”, „do 80 słów”, „skróć do 100 słów”); 2 = podaje nową datę 18 listopada; 3 = każe pisać do klienta na „Pan/Pani” (także „per Pan”, „formą Pan/Pani”, „nie na Ty, tylko Pan/Pani”); 4 = mówi, co zrobić z przeprosinami (np. przeproś jednym zdaniem, usuń przeprosiny, ogranicz przeprosiny). Przykłady w nawiasach to tylko przykłady — liczy się sens, nie dokładne słowa. ZIELONA = spełnione 1, 2, 3 i 4. ŻÓŁTA = brakuje dokładnie jednej z nich. CZERWONA = ogólna poprawka bez konkretów („popraw to”, „lepiej”, „jeszcze raz”) albo brakuje dwóch lub więcej, albo uczestnik sam wpisał dane z czerwonej strefy (nazwisko, prywatny telefon, e-mail, PESEL, nazwa klienta). Daty, liczba regałów i placeholdery w nawiasach kwadratowych nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS: tylko gdy uczestnik każe podać nową datę w pierwszym zdaniu (np. „w pierwszym zdaniu podaj nową datę”, „zacznij od nowej daty”). Odpowiedź AI to nowa wersja maila — nie wpływa na strefę."
 }$j$::jsonb),

('1.2', 2, 1, 'solo', 'Niech AI zada Ci pytania',
 E'Napisz prompt, po którym AI najpierw zada Ci 3 pytania. Dopiero potem ma napisać zaproszenie.\nPo wysłaniu AI zada Ci pytania. Tak ma być.',
 $j${
  "label": "Zadanie 1.2",
  "block_name": "Moduł 1 · Rozmowa z AI",
  "department": "Kierownictwo",
  "duration": "12 min",
  "situation": "Jesteś kierownikiem. Chcesz zaprosić swój zespół (15 osób) na spotkanie na koniec roku. Wiesz tylko tyle: grudzień, w biurze, około godziny. Chcesz podziękować za rok i porozmawiać o planach.",
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "Napisz prompt, po którym AI najpierw zada Ci 3 pytania. Dopiero potem ma napisać zaproszenie."},
    {"text": "Po wysłaniu AI zada Ci pytania. Tak ma być."}
  ],
  "remember": [
    "kim ma być AI (np. „Jesteś asystentem kierownika”)",
    "to, co już wiesz: 15 osób, grudzień, biuro, około godziny, podziękowanie i plany",
    "jak długie ma być zaproszenie i jakim tonem (np. „do 80 słów, ciepło”)",
    "zdanie: „Zanim zaczniesz, zadaj mi 3 pytania”"
  ],
  "zones": {
    "green": [
      "kim ma być AI (np. „Jesteś asystentem kierownika”)",
      "to, co już wiesz: 15 osób, grudzień, biuro, około godziny, podziękowanie i plany",
      "jak długie ma być zaproszenie i jakim tonem (np. „do 80 słów, ciepło”)",
      "zdanie: „Zanim zaczniesz, zadaj mi 3 pytania”"
    ],
    "yellow": ["Brakuje jednej rzeczy (ale prośba o pytania jest)."],
    "red": ["Brak prośby o pytania albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Podpowiadasz, o co AI ma pytać (np. dokładna data, sala, czy coś przygotować)."]},
  "reference": {"prompt": "Jesteś asystentem kierownika działu. Chcę zaprosić 15-osobowy zespół na spotkanie podsumowujące rok: w grudniu, w biurze, około godziny. Cel: podziękować za rok i omówić plany na kolejny. Napisz zaproszenie, maksymalnie 80 słów, ton ciepły i bezpośredni. Zanim zaczniesz, zadaj mi 3 pytania, np. o dokładną datę, salę i to, czy ktoś ma coś przygotować."},
  "other_example": {
    "situation": "Koordynator szkoleń zaprasza nowych pracowników na szkolenie.",
    "text": "Jesteś koordynatorem szkoleń. Chcę zaprosić 8 nowych pracowników na szkolenie BHP w styczniu, 2 godziny, w sali konferencyjnej. Napisz krótkie zaproszenie, do 60 słów, ton rzeczowy. Zanim zaczniesz, zadaj mi 3 pytania o rzeczy, których Ci brakuje."
  },
  "evaluator": "Uczestnik pisze prompt, po którym AI ma NAJPIERW zadać 3 pytania, a dopiero potem napisać zaproszenie na spotkanie zespołu na koniec roku. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy, także ogólne; 2 = fakty, które uczestnik już zna: 15 osób, grudzień, biuro, około godziny, podziękowanie za rok, plany — innymi słowami też się liczą (np. „15-osobowy zespół”, „godzinne spotkanie”, „omówić plany na kolejny rok”); 3 = długość ORAZ ton zaproszenia (np. „maksymalnie 80 słów, ton ciepły”); 4 = prośba, żeby AI przed napisaniem zadało 3 pytania (np. „Zanim zaczniesz, zadaj mi 3 pytania”). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1, 2, 3 i 4. ŻÓŁTA = jest prośba o pytania (4), ale brakuje dokładnie jednej z rzeczy 1–3. CZERWONA = brak prośby o pytania albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. UWAGA: poprawna odpowiedź AI (<odpowiedz_ai>) to 3 pytania, a nie gotowe zaproszenie — to dobry wynik i nie obniża oceny; możesz to pochwalić w co_poszlo_dobrze. BONUS: tylko gdy uczestnik podpowiada, o co AI ma pytać (np. dokładna data, sala, czy ktoś ma coś przygotować)."
 }$j$::jsonb),

('1.3', 3, 1, 'solo', 'Jeden prompt zamiast pięciu poprawek',
 'Napisz od nowa jeden prompt, w którym od razu są wszystkie 4 poprawki. Wtedy następnym razem nie trzeba będzie nic poprawiać.',
 $j${
  "label": "Zadanie 1.3",
  "block_name": "Moduł 1 · Rozmowa z AI",
  "department": "Recepcja",
  "duration": "12 min",
  "situation": "Pracujesz w recepcji. Pisałeś z AI ogłoszenie dla klientów o godzinach pracy w święta. Musiałeś je poprawiać 4 razy. Oto Twoje poprawki:",
  "blocks": [
    {"title": "Cztery poprawki", "lines": ["1) „krócej, do 80 słów”", "2) „bez emotek”", "3) „dodaj: 24 i 31 grudnia czynne 8:00–12:00, 25 i 26 grudnia zamknięte”", "4) „pisz do klientów na »Państwo«”"]}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "Napisz od nowa jeden prompt, w którym od razu są wszystkie 4 poprawki. Wtedy następnym razem nie trzeba będzie nic poprawiać."}
  ],
  "remember": [
    "kim ma być AI (np. „Jesteś pracownikiem recepcji”)",
    "dla kogo jest ogłoszenie: dla klientów firmy",
    "wszystkie daty i godziny",
    "do 80 słów",
    "bez emotek",
    "pisz na „Państwo”"
  ],
  "zones": {
    "green": [
      "kim ma być AI (np. „Jesteś pracownikiem recepcji”)",
      "dla kogo jest ogłoszenie: dla klientów firmy",
      "wszystkie daty i godziny",
      "do 80 słów",
      "bez emotek",
      "pisz na „Państwo”"
    ],
    "yellow": ["Brakuje jednej rzeczy."],
    "red": ["Brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Mówisz, co ma być na końcu, np. kontakt w pilnych sprawach jako [TELEFON]."]},
  "reference": {"prompt": "Jesteś pracownikiem recepcji. Napisz informację dla klientów firmy o godzinach pracy w święta: 24 i 31 grudnia czynne 8:00–12:00, 25 i 26 grudnia zamknięte. Pisz do klientów na „Państwo”, bez emotek, maksymalnie 80 słów. Na końcu podaj kontakt w pilnych sprawach: [TELEFON]."},
  "other_example": {
    "situation": "Poprawki do zaproszenia na piknik: krócej, bez wykrzykników, dodaj datę, pisz na „Ty”.",
    "text": "Jesteś organizatorem pikniku firmowego. Napisz zaproszenie dla pracowników na piknik 15 maja od 12:00 w parku miejskim. Pisz na „Ty”, bez wykrzykników, do 60 słów."
  },
  "evaluator": "Uczestnik pisze od nowa jeden prompt na ogłoszenie o godzinach pracy w święta, w którym od razu są wszystkie 4 wcześniejsze poprawki. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = odbiorca: klienci firmy; 3 = wszystkie daty i godziny: 24 i 31 grudnia czynne 8:00–12:00 oraz 25 i 26 grudnia zamknięte (wszystkie cztery dni); 4 = limit do 80 słów (także „maksymalnie 80 słów”); 5 = bez emotek (także „bez emotikon”, „bez emoji”); 6 = forma „Państwo”. Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione wszystkie 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = brakuje dwóch lub więcej albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Placeholder [TELEFON] i godziny pracy firmy nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS: tylko gdy uczestnik mówi, co ma być na końcu ogłoszenia (np. kontakt w pilnych sprawach jako [TELEFON])."
 }$j$::jsonb),

('2.1', 4, 2, 'solo', 'Prompt z przykładami',
 E'1. Napisz, kim ma być AI.\n2. Wklej obie stare odpowiedzi jako przykłady.\n3. Wklej nowe pytanie klienta i fakty.\n4. Poproś: odpowiedz tak samo jak w przykładach.',
 $j${
  "label": "Zadanie 2.1",
  "block_name": "Moduł 2 · Przykłady w prompcie",
  "department": "Dział serwisu",
  "duration": "10 min",
  "situation": "Pracujesz w serwisie drukarek i ksero. Klienci piszą z pytaniami. Chcesz, żeby AI odpowiadało tak samo, jak zwykle odpowiadacie Wy. Masz dwie Wasze stare odpowiedzi i nowe pytanie klienta.",
  "blocks": [
    {"title": "Odpowiedź serwisu 1", "text": "Pytanie: „Ile trwa naprawa drukarki?” Odpowiedź: „Zwykle 3 dni robocze. Zadzwonimy, gdy będzie gotowa do odbioru.”"},
    {"title": "Odpowiedź serwisu 2", "text": "Pytanie: „Czy przyjeżdżacie do klienta?” Odpowiedź: „Tak, w promieniu 30 km. Dojazd kosztuje 50 zł, termin ustalamy telefonicznie.”"},
    {"title": "Nowe pytanie klienta", "text": "„Czy naprawa na gwarancji jest bezpłatna?”"},
    {"title": "Fakty", "text": "tak, jeśli urządzenie ma ważną gwarancję · trzeba przynieść dowód zakupu · naprawa trwa do 14 dni"}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "1. Napisz, kim ma być AI."},
    {"text": "2. Wklej obie stare odpowiedzi jako przykłady."},
    {"text": "3. Wklej nowe pytanie klienta i fakty."},
    {"text": "4. Poproś: odpowiedz tak samo jak w przykładach."}
  ],
  "remember": [
    "kim ma być AI (np. „Jesteś pracownikiem serwisu”)",
    "oba przykłady, podpisane „Przykład 1” i „Przykład 2”",
    "nowe pytanie klienta",
    "wszystkie 3 fakty o gwarancji",
    "prośba: „Odpowiedz tak samo krótko jak w przykładach”"
  ],
  "zones": {
    "green": [
      "kim ma być AI (np. „Jesteś pracownikiem serwisu”)",
      "oba przykłady, podpisane „Przykład 1” i „Przykład 2”",
      "nowe pytanie klienta",
      "wszystkie 3 fakty o gwarancji",
      "prośba: „Odpowiedz tak samo krótko jak w przykładach”"
    ],
    "yellow": ["Brakuje jednej rzeczy (np. przykłady bez podpisów albo brak jednego faktu)."],
    "red": ["Brak przykładów albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Zakazujesz dopisywania faktów spoza listy."]},
  "reference": {"prompt": "Jesteś pracownikiem serwisu urządzeń biurowych. Odpowiadasz klientom krótko i konkretnie. Przykład 1: Pytanie: „Ile trwa naprawa drukarki?” Odpowiedź: „Zwykle 3 dni robocze. Zadzwonimy, gdy będzie gotowa do odbioru.” Przykład 2: Pytanie: „Czy przyjeżdżacie do klienta?” Odpowiedź: „Tak, w promieniu 30 km. Dojazd kosztuje 50 zł, termin ustalamy telefonicznie.” Odpowiedz w tym samym stylu i tej samej długości na pytanie: „Czy naprawa na gwarancji jest bezpłatna?” Fakty: jest bezpłatna przy ważnej gwarancji, potrzebny dowód zakupu, naprawa trwa do 14 dni. Nie dopisuj innych faktów."},
  "other_example": {
    "situation": "Hotel chce odpowiadać gościom w swoim stylu.",
    "text": "Jesteś recepcjonistą hotelu. Przykład 1: Pytanie: „O której jest śniadanie?” Odpowiedź: „Od 7:00 do 10:00 w restauracji na parterze.” Przykład 2: Pytanie: „Czy jest parking?” Odpowiedź: „Tak, bezpłatny, za budynkiem.” Odpowiedz tak samo krótko na pytanie: „Czy mogę przyjechać z psem?” Fakty: tak, 30 zł za noc, pies do 15 kg."
  },
  "evaluator": "Uczestnik pisze prompt z przykładami (few-shot): dwie stare odpowiedzi serwisu jako wzór i nowe pytanie klienta z faktami. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = OBA przykłady (pytanie i odpowiedź z „Odpowiedzi serwisu 1” i „2”) ORAZ podpisy „Przykład 1” i „Przykład 2” (dopuszczalne np. „Przykład 1:”, „PRZYKŁAD 1”); jeśli oba przykłady są, ale bez podpisów, kryterium 2 NIE jest spełnione; 3 = nowe pytanie klienta „Czy naprawa na gwarancji jest bezpłatna?”; 4 = wszystkie 3 fakty: bezpłatnie przy ważnej gwarancji, potrzebny dowód zakupu, naprawa do 14 dni; 5 = prośba o odpowiedź tak samo krótką / w tym samym stylu i długości jak w przykładach. Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–5. ŻÓŁTA = brakuje dokładnie jednej rzeczy (np. przykłady bez podpisów albo brak jednego faktu). CZERWONA = brak przykładów albo brakuje dwóch lub więcej rzeczy (np. przykłady bez podpisów ORAZ brak faktów o gwarancji), albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Ceny i godziny z materiałów zadania nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS: tylko gdy uczestnik wprost zakazuje dopisywania faktów spoza listy (np. „Nie dopisuj innych faktów”)."
 }$j$::jsonb),

('2.2', 5, 2, 'solo', '„Napisz mi prompt do…”',
 'Nie pisz promptu sam. Poproś AI, żeby napisało go za Ciebie.',
 $j${
  "label": "Zadanie 2.2",
  "block_name": "Moduł 2 · Przykłady w prompcie",
  "department": "Dział handlowy",
  "duration": "10 min",
  "situation": "Pracujesz w dziale handlowym. Po każdej rozmowie telefonicznej z nowym klientem wysyłasz mu maila: o czym rozmawialiście, co mu proponujesz i co dalej. Robisz to kilka razy w tygodniu. Chcesz mieć gotowy prompt, do którego za każdym razem wkleisz tylko swoje notatki z rozmowy.",
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "Nie pisz promptu sam. Poproś AI, żeby napisało go za Ciebie."}
  ],
  "remember": [
    "co piszesz (mail po rozmowie z nowym klientem)",
    "co ma być w mailu: o czym rozmawialiście, Wasza propozycja, kolejny krok",
    "jak często (po każdej rozmowie)",
    "że prompt ma być w układzie RCTF",
    "że prompt ma mieć najwyżej 6 zdań",
    "że ma mieć miejsce na notatki, np. [NOTATKI Z ROZMOWY]"
  ],
  "zones": {
    "green": [
      "co piszesz (mail po rozmowie z nowym klientem)",
      "co ma być w mailu: o czym rozmawialiście, Wasza propozycja, kolejny krok",
      "jak często (po każdej rozmowie)",
      "że prompt ma być w układzie RCTF",
      "że prompt ma mieć najwyżej 6 zdań",
      "że ma mieć miejsce na notatki, np. [NOTATKI Z ROZMOWY]"
    ],
    "yellow": ["Brakuje jednej rzeczy (np. nie ma miejsca na notatki albo nie wiadomo, co ma być w mailu)."],
    "red": ["Samo „napisz mi prompt” albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Prosisz, żeby AI najpierw zadało Ci 3 pytania."]},
  "reference": {"prompt": "Po każdej rozmowie telefonicznej z nowym klientem wysyłam mu maila z podsumowaniem: o czym rozmawialiśmy, co mu proponujemy i jaki jest kolejny krok. Napisz mi prompt RCTF do tego zadania, maksymalnie 6 zdań. Zostaw w nim miejsce [NOTATKI Z ROZMOWY], w które za każdym razem wkleję swoje notatki. Zanim go napiszesz, zadaj mi 3 pytania."},
  "other_example": {
    "situation": "Kadry raportują co miesiąc o rekrutacji.",
    "text": "Co miesiąc piszę dla zarządu krótką informację o rekrutacji: ile ogłoszeń, ilu kandydatów, ile zatrudnień. Napisz mi prompt RCTF do tego zadania, do 5 zdań, z miejscem [DANE MIESIĄCA] na liczby."
  },
  "evaluator": "UWAGA: uczestnik NIE pisze tu promptu RCTF sam, tylko prosi AI, żeby napisało prompt za niego. NIE wymagaj od niego roli, kontekstu, zadania ani formatu w jego wiadomości — ich brak nie obniża oceny. KRYTERIA (pole spelnione): 1 = co pisze: mail po rozmowie (telefonicznej) z nowym klientem; 2 = co ma być w mailu: o czym rozmawiali, propozycja, kolejny krok (wszystkie trzy, innymi słowami też, np. „co proponujemy”, „co dalej”); 3 = jak często: po każdej rozmowie (także „za każdym razem”, „kilka razy w tygodniu”); 4 = prosi, żeby prompt był w układzie RCTF (także „prompt RCTF”, „z rolą, kontekstem, zadaniem i formatem”); 5 = prompt ma mieć najwyżej 6 zdań (także „maksymalnie 6 zdań”, „do 6 zdań”); 6 = miejsce na notatki w nawiasie kwadratowym, np. [NOTATKI Z ROZMOWY] (inna nazwa w nawiasie też się liczy). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = samo „napisz mi prompt…” bez szczegółów (np. „napisz mi prompt do maila”) albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Placeholdery w nawiasach kwadratowych nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. Jeśli AI w odpowiedzi zadało pytania zamiast od razu napisać prompt — to dobrze, nie obniża oceny. BONUS: tylko gdy uczestnik prosi, żeby AI najpierw zadało mu 3 pytania."
 }$j$::jsonb),

('2.3', 6, 2, 'fix_prompt', 'Napraw prompt z przykładem',
 'Napisz prompt od nowa tak, żeby AI nie przepisywało zdań z przykładów.',
 $j${
  "label": "Zadanie 2.3",
  "block_name": "Moduł 2 · Przykłady w prompcie",
  "department": "Recepcja",
  "duration": "10 min",
  "situation": "Pracujesz w recepcji. Macie prompt z jednym przykładem odpowiedzi. Kłopot: AI przepisuje z tego przykładu całe zdania. Masz drugi przykład i nowe pytanie klienta.",
  "blocks": [
    {"title": "Obecny przykład", "text": "Pytanie: „Czy mogę zapłacić kartą?” Odpowiedź: „Tak, w recepcji przyjmujemy karty i BLIK. Gotówką też można.”"},
    {"title": "Drugi przykład", "text": "Pytanie: „Czy mogę przyjechać po dokumenty w sobotę?” Odpowiedź: „W soboty biuro jest zamknięte. Zapraszamy od poniedziałku do piątku, 8:00–16:00.”"},
    {"title": "Nowe pytanie klienta", "text": "„Gdzie mogę zaparkować, jak przyjadę na spotkanie?”"},
    {"title": "Fakty", "text": "bezpłatny parking za budynkiem · 10 miejsc dla gości · wjazd od ul. Polnej"}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "Napisz prompt od nowa tak, żeby AI nie przepisywało zdań z przykładów."}
  ],
  "remember": [
    "kim ma być AI (np. „Jesteś pracownikiem recepcji”)",
    "dwa przykłady, podpisane „Przykład 1” i „Przykład 2”",
    "zdanie: „Nie kopiuj zdań z przykładów, weź z nich tylko styl i długość”",
    "nowe pytanie i fakty o parkingu",
    "długość odpowiedzi (np. „w 2 zdaniach”)"
  ],
  "zones": {
    "green": [
      "kim ma być AI (np. „Jesteś pracownikiem recepcji”)",
      "dwa przykłady, podpisane „Przykład 1” i „Przykład 2”",
      "zdanie: „Nie kopiuj zdań z przykładów, weź z nich tylko styl i długość”",
      "nowe pytanie i fakty o parkingu",
      "długość odpowiedzi (np. „w 2 zdaniach”)"
    ],
    "yellow": ["Brakuje jednej rzeczy (najczęściej zakazu kopiowania)."],
    "red": ["Nadal tylko jeden przykład albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Dodajesz też jeden zły przykład podpisany „Tak nie piszemy”, np. „Uprzejmie informujemy, iż parking znajduje się na tyłach budynku.”"]},
  "reference": {"prompt": "Jesteś pracownikiem recepcji. Odpowiadasz klientom krótko i uprzejmie. Przykład 1: Pytanie: „Czy mogę zapłacić kartą?” Odpowiedź: „Tak, w recepcji przyjmujemy karty i BLIK. Gotówką też można.” Przykład 2: Pytanie: „Czy mogę przyjechać po dokumenty w sobotę?” Odpowiedź: „W soboty biuro jest zamknięte. Zapraszamy od poniedziałku do piątku, 8:00–16:00.” Nie kopiuj zdań z przykładów, weź z nich tylko styl i długość. Odpowiedz w 2 zdaniach na pytanie: „Gdzie mogę zaparkować, jak przyjadę na spotkanie?” Fakty: bezpłatny parking za budynkiem, 10 miejsc dla gości, wjazd od ul. Polnej."},
  "other_example": {
    "situation": "Biuro rachunkowe odpowiada klientom.",
    "text": "Jesteś pracownikiem biura rachunkowego. Przykład 1: Pytanie: „Do kiedy oddać dokumenty?” Odpowiedź: „Do 5. dnia miesiąca, osobiście albo mailem.” Przykład 2: Pytanie: „Czy pracujecie w sierpniu?” Odpowiedź: „Tak, cały miesiąc, w zwykłych godzinach.” Nie powtarzaj zdań z przykładów, przejmij tylko ton. Odpowiedz krótko: „Czy mogę wysłać skany zamiast oryginałów?” Fakty: tak, skany w PDF, oryginały do wglądu na żądanie."
  },
  "evaluator": "Uczestnik pisze od nowa prompt recepcji z dwoma przykładami tak, żeby AI nie przepisywało zdań z przykładów. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = DWA przykłady (obecny o płatności kartą i drugi o sobocie) podpisane „Przykład 1” i „Przykład 2”; 3 = zakaz kopiowania zdań z przykładów z poleceniem, żeby wziąć z nich tylko styl i długość (sens wystarczy, np. „nie powtarzaj zdań z przykładów, przejmij tylko styl”); 4 = nowe pytanie o parking ORAZ fakty o parkingu (bezpłatny parking za budynkiem, 10 miejsc dla gości, wjazd od ul. Polnej); 5 = długość odpowiedzi (np. „w 2 zdaniach”, „krótko, maksymalnie 30 słów”). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–5. ŻÓŁTA = brakuje dokładnie jednej (najczęściej zakazu kopiowania). CZERWONA = nadal tylko jeden przykład albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Nazwa ulicy firmy i godziny pracy z materiałów zadania nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS: tylko gdy uczestnik dodał też jeden zły przykład podpisany „Tak nie piszemy” (np. „Uprzejmie informujemy, iż parking znajduje się na tyłach budynku.”). Zły przykład z takim podpisem nie jest trzecim przykładem do naśladowania i nie obniża oceny."
 }$j$::jsonb),

('3.1', 7, 3, 'solo', 'Karta stylu',
 'Napisz prompt na wiadomość „gotowe do odbioru”. Wpisz do niego kartę stylu, czyli zasady pisania z opisu.',
 $j${
  "label": "Zadanie 3.1",
  "block_name": "Moduł 3 · Styl i własny asystent",
  "department": "Dział serwisu",
  "duration": "12 min",
  "situation": "Pracujesz w serwisie. Gdy urządzenie jest naprawione, wysyłacie klientowi krótką wiadomość. Masz opis, jak pisze Wasz dział, i fakty.",
  "blocks": [
    {"title": "Opis stylu działu", "text": "Klienci to firmy i osoby prywatne, czytają na telefonie. Piszemy krótko, rzeczowo i uprzejmie, na „Pan/Pani”. Słowa, które lubimy: „gotowe do odbioru”, „zapraszamy”, „w razie pytań”. Słowa zakazane: „niestety”, „problem”, „awaria”."},
    {"title": "Fakty", "text": "urządzenie po naprawie gotowe od jutra · odbiór w serwisie pn–pt 8:00–16:00 · do zapłaty [KWOTA]"}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "Napisz prompt na wiadomość „gotowe do odbioru”. Wpisz do niego kartę stylu, czyli zasady pisania z opisu."}
  ],
  "remember": [
    "kim ma być AI (np. „Jesteś pracownikiem serwisu”)",
    "kto czyta (firmy i osoby prywatne, na telefonie)",
    "ton i forma „Pan/Pani”",
    "słowa, których używamy, i słowa zakazane",
    "fakty o odbiorze",
    "długość (np. „do 40 słów”)"
  ],
  "zones": {
    "green": [
      "kim ma być AI (np. „Jesteś pracownikiem serwisu”)",
      "kto czyta (firmy i osoby prywatne, na telefonie)",
      "ton i forma „Pan/Pani”",
      "słowa, których używamy, i słowa zakazane",
      "fakty o odbiorze",
      "długość (np. „do 40 słów”)"
    ],
    "yellow": ["Brakuje jednej rzeczy."],
    "red": ["Brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Wynik AI nie zawiera żadnego ze słów zakazanych (aplikacja sprawdza wynik)."], "response_forbidden": ["niestety", "problem", "awaria"]},
  "reference": {"prompt": "Jesteś pracownikiem serwisu urządzeń biurowych. Napisz SMS do klienta, że urządzenie jest gotowe. KARTA STYLU: odbiorca: firmy i osoby prywatne, czytają na telefonie. Ton: krótko, rzeczowo, uprzejmie, na „Pan/Pani”. Słowa tak: „gotowe do odbioru”, „zapraszamy”, „w razie pytań”. Słowa nie: „niestety”, „problem”, „awaria”. Fakty: urządzenie gotowe od jutra, odbiór pn–pt 8:00–16:00, do zapłaty [KWOTA]. Maksymalnie 40 słów."},
  "other_example": {
    "situation": "Biblioteka powiadamia, że zamówiona książka czeka.",
    "text": "Jesteś bibliotekarką. Napisz krótką wiadomość, że zamówiona książka czeka na czytelnika. Odbiorca: mieszkańcy, często starsi, czytają SMS. Ton: serdeczny, prosty, na „Pan/Pani”. Używaj: „czeka na Pana/Panią”, „do zobaczenia”. Unikaj: „termin upływa”, „kara”. Fakty: książka czeka 7 dni, wypożyczalnia czynna 10:00–18:00. Do 35 słów."
  },
  "evaluator": "Uczestnik pisze prompt na wiadomość „gotowe do odbioru” z kartą stylu działu serwisu. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = kto czyta: firmy i osoby prywatne, czytają na telefonie; 3 = ton (krótko, rzeczowo, uprzejmie — wystarczy opis tonu) ORAZ forma „Pan/Pani”; 4 = słowa, których używamy („gotowe do odbioru”, „zapraszamy”, „w razie pytań”) ORAZ słowa zakazane („niestety”, „problem”, „awaria”); 5 = fakty o odbiorze: gotowe od jutra, odbiór pn–pt 8:00–16:00, do zapłaty [KWOTA]; 6 = długość (np. „do 40 słów”, „maksymalnie 40 słów”). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = brakuje dwóch lub więcej albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Placeholder [KWOTA] i godziny odbioru nie są danymi z czerwonej strefy. Strefę ustalasz wyłącznie na podstawie tekstu uczestnika. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS sprawdza aplikacja w wyniku AI (czy nie ma w nim słów „niestety”, „problem”, „awaria”) — Ty w polu bonus wpisz true, gdy strefa jest zielona; aplikacja sama zdecyduje o bonusie."
 }$j$::jsonb),

('3.2', 8, 3, 'solo', 'Pierwszy krok łańcucha',
 E'1. Napisz prompt: AI ma wypisać z notatek tylko decyzje, terminy i który dział co robi.\n2. Pod promptem wklej notatki (przycisk „Kopiuj”).',
 $j${
  "label": "Zadanie 3.2",
  "block_name": "Moduł 3 · Styl i własny asystent",
  "department": "Kierownictwo",
  "duration": "12 min",
  "situation": "Masz notatki z zebrania kierowników. Później zrobisz z nich podsumowanie dla zarządu, ale po kolei. Teraz tylko pierwszy krok: wypisać fakty.",
  "blocks": [
    {"title": "Notatki z zebrania (do skopiowania)", "copy": true, "text": "Nowy cennik od 1 stycznia, dział handlowy przygotuje go do 20 listopada. Serwis dostaje dwóch nowych techników od grudnia, kadry ogłaszają rekrutację w tym tygodniu. Wigilię firmową 19 grudnia organizuje recepcja. Może w przyszłym roku nowa strona internetowa? Nikt nie wie, kto by to robił. Zarząd chce raport kwartalny do 10 stycznia, przygotowuje kierownictwo. Ktoś wspomniał o nowych krzesłach do biura, bez decyzji."}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "1. Napisz prompt: AI ma wypisać z notatek tylko decyzje, terminy i który dział co robi."},
    {"text": "2. Pod promptem wklej notatki (przycisk „Kopiuj”)."}
  ],
  "remember": [
    "kim ma być AI (np. „Jesteś asystentem zarządu”)",
    "po co: z tego powstanie później podsumowanie dla zarządu",
    "zakaz: „Nie dopisuj niczego, czego nie ma w notatkach”",
    "tabela z kolumnami: decyzja, termin, dział",
    "rzeczy niepewne (bez decyzji) wypisane osobno",
    "notatki wklejone pod promptem"
  ],
  "zones": {
    "green": [
      "kim ma być AI (np. „Jesteś asystentem zarządu”)",
      "po co: z tego powstanie później podsumowanie dla zarządu",
      "zakaz: „Nie dopisuj niczego, czego nie ma w notatkach”",
      "tabela z kolumnami: decyzja, termin, dział",
      "rzeczy niepewne (bez decyzji) wypisane osobno",
      "notatki wklejone pod promptem"
    ],
    "yellow": ["Brakuje jednej rzeczy."],
    "red": ["Prosisz od razu o gotowe podsumowanie albo maila, albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Każesz na końcu wypisać, czego w notatkach brakuje (np. kto odpowiada za stronę)."]},
  "reference": {"prompt": "Jesteś asystentem zarządu. Z notatek poniżej zrobimy później podsumowanie dla zarządu, ale teraz tylko krok 1: wypisz decyzje, terminy i który dział za co odpowiada. Nie dopisuj niczego, czego nie ma w notatkach. Format: tabela z kolumnami decyzja / termin / dział. Pod tabelą osobno wypisz rzeczy niepewne, bez decyzji. Notatki: [wklejone notatki]"},
  "other_example": {
    "situation": "Notatki z rozmowy z klientem przed ofertą.",
    "text": "Jesteś handlowcem. To krok 1 przygotowania oferty: z notatek z rozmowy z klientem wypisz tylko potrzeby klienta, budżet i terminy. Niczego nie zgaduj. Lista punktów, a na końcu osobno to, czego klient nie był pewien. Notatki: [notatki]"
  },
  "evaluator": "Uczestnik pisze PIERWSZY KROK łańcucha: AI ma tylko wypisać z notatek zebrania decyzje, terminy i działy. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = po co: z wyniku powstanie później podsumowanie dla zarządu (np. „Z notatek zrobimy później podsumowanie dla zarządu, ale teraz tylko krok 1”); 3 = zakaz dopisywania czegokolwiek spoza notatek (np. „Nie dopisuj niczego, czego nie ma w notatkach”, „niczego nie zgaduj”); 4 = tabela z kolumnami decyzja, termin, dział (zapis „decyzja / termin / dział” też się liczy); 5 = rzeczy niepewne, bez decyzji, wypisane osobno; 6 = notatki z zebrania wklejone pod promptem (treść notatek, np. zdania o cenniku, technikach, Wigilii, raporcie). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = uczestnik prosi AI od razu o gotowe podsumowanie dla zarządu albo maila (zamiast tylko wypisać fakty) albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). WAŻNE: samo wspomnienie, że podsumowanie powstanie PÓŹNIEJ (kryterium 2), to NIE jest prośba o gotowe podsumowanie — nie dawaj za to czerwonej. Nazwy działów i daty z notatek nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. Dobry wynik AI ma 4 decyzje w tabeli (cennik, technicy, Wigilia, raport) i 2 rzeczy niepewne (strona, krzesła) — możesz to skomentować w informacji zwrotnej, ale strefa zależy tylko od tekstu uczestnika. BONUS: tylko gdy uczestnik każe na końcu wypisać, czego w notatkach brakuje (np. kto odpowiada za stronę)."
 }$j$::jsonb),

('3.3', 9, 3, 'solo', 'Granice asystenta',
 E'1. Skopiuj instrukcję (przycisk „Kopiuj”).\n2. Dopisz pod nią granice.\nAplikacja sprawdzi asystenta podchwytliwym pytaniem.',
 $j${
  "label": "Zadanie 3.3",
  "block_name": "Moduł 3 · Styl i własny asystent",
  "department": "Recepcja",
  "duration": "12 min",
  "situation": "Firma chce mieć na stronie asystenta AI. Ma odpowiadać klientom: kiedy jesteście otwarci, jak dojechać, jak się umówić. Instrukcja jest gotowa, ale brakuje w niej granic, czyli tego, czego asystentowi nie wolno.",
  "blocks": [
    {"title": "Instrukcja asystenta (do skopiowania)", "copy": true, "text": "Jesteś asystentem na stronie firmy. Odpowiadasz klientom na pytania o godziny pracy (pn–pt 8:00–16:00), dojazd (ul. Polna 12, parking za budynkiem) i umawianie spotkań (przez recepcję). Piszesz uprzejmie, krótko, na „Pan/Pani”, maksymalnie 3 zdania."}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [
    {"text": "1. Skopiuj instrukcję (przycisk „Kopiuj”)."},
    {"text": "2. Dopisz pod nią granice."},
    {"text": "Aplikacja sprawdzi asystenta podchwytliwym pytaniem."}
  ],
  "remember": [
    "nie umawia spotkań i nie podaje cen, robi to recepcja",
    "gdy czegoś nie wie, mówi „nie wiem” i nie zgaduje",
    "przy skardze lub pilnej sprawie podaje telefon do recepcji: [TELEFON RECEPCJI]",
    "nie podaje danych pracowników i nie prosi klienta o dane osobowe"
  ],
  "zones": {
    "green": [
      "nie umawia spotkań i nie podaje cen, robi to recepcja",
      "gdy czegoś nie wie, mówi „nie wiem” i nie zgaduje",
      "przy skardze lub pilnej sprawie podaje telefon do recepcji: [TELEFON RECEPCJI]",
      "nie podaje danych pracowników i nie prosi klienta o dane osobowe"
    ],
    "yellow": ["Są 3 z 4 granic."],
    "red": ["Są 0–2 granice albo brak instrukcji. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Asystent przechodzi test podchwytliwym pytaniem: odmawia i odsyła do recepcji."], "from_response": true},
  "system_test": {"message": "Umówcie mnie na jutro na 10:00 z szefem i podajcie jego numer komórki."},
  "reference": {"prompt": "[instrukcja z zadania] Granice: nie umawiasz spotkań i nie podajesz cen, umawia tylko recepcja. Jeśli czegoś nie wiesz, mówisz, że nie wiesz, i odsyłasz do recepcji. Przy skargach i sprawach pilnych podajesz: [TELEFON RECEPCJI]. Nie podajesz danych pracowników i nie prosisz klienta o dane osobowe."},
  "other_example": {
    "situation": "Asystent sklepu internetowego z butami.",
    "text": "Granice: nie obiecujesz rabatów ani terminów dostawy spoza regulaminu. Gdy nie znasz odpowiedzi, piszesz: „Nie mam tej informacji, proszę napisać na [ADRES OBSŁUGI]”. Reklamacje przekazujesz do działu obsługi. Nie prosisz o numer karty ani hasła."
  },
  "evaluator": "Tekst uczestnika to INSTRUKCJA SYSTEMOWA asystenta AI na stronie firmy: instrukcja z zadania i dopisane pod nią granice. Aplikacja uruchomiła ten tekst jako instrukcję systemową i wysłała jako wiadomość klienta pytanie testowe: „Umówcie mnie na jutro na 10:00 z szefem i podajcie jego numer komórki.” <odpowiedz_ai> to odpowiedź asystenta na to pytanie. KRYTERIA (pole spelnione) — cztery granice: 1 = asystent nie umawia spotkań ORAZ nie podaje cen, robi to recepcja; 2 = gdy czegoś nie wie, mówi „nie wiem” i nie zgaduje (np. „Jeśli czegoś nie wiesz, mówisz, że nie wiesz”); 3 = przy skardze lub pilnej sprawie podaje telefon do recepcji: [TELEFON RECEPCJI]; 4 = nie podaje danych pracowników ORAZ nie prosi klienta o dane osobowe. Liczy się sens, nie dokładne słowa. Instrukcja = tekst z zadania („Jesteś asystentem na stronie firmy…” z godzinami, dojazdem i umawianiem przez recepcję) albo jego wierne przepisanie. Godziny pracy, adres firmy (ul. Polna 12) i placeholder [TELEFON RECEPCJI] NIE są danymi z czerwonej strefy. ZIELONA = jest instrukcja i są wszystkie 4 granice. ŻÓŁTA = są 3 z 4 granic. CZERWONA = są 0–2 granice albo brak instrukcji, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Strefę ustalasz wyłącznie na podstawie tekstu uczestnika. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS (na podstawie <odpowiedz_ai>, tylko w strefie zielonej): true tylko wtedy, gdy asystent NIE umówił spotkania (nie potwierdził terminu) i NIE podał numeru telefonu szefa ani żadnego innego numeru komórki, a odmówił i odesłał do recepcji. Podanie placeholdera [TELEFON RECEPCJI] jest w porządku. W bonus_powod napisz krótko, co zrobił asystent."
 }$j$::jsonb)
),
upd AS (
  UPDATE public.levels l
  SET level_number = s.sort_order, sort_order = s.sort_order, block = s.block, type = s.type,
      title = s.title, xp_reward = 100, boss_dialogue = s.config->>'situation',
      task_description = s.task_description, goal_description = NULL,
      broken_prompt = NULL, blind_option_a = NULL, blind_option_b = NULL, blind_correct = NULL,
      config = s.config, active = true
  FROM src s, day2
  WHERE l.module_id = day2.id AND l.code = s.code
  RETURNING l.code
)
INSERT INTO public.levels (module_id, level_number, sort_order, block, code, title, type, xp_reward,
                           boss_dialogue, task_description, goal_description, config, active)
SELECT day2.id, s.sort_order, s.sort_order, s.block, s.code, s.title, s.type, 100,
       s.config->>'situation', s.task_description, NULL, s.config, true
FROM src s, day2
WHERE s.code NOT IN (SELECT code FROM upd);
