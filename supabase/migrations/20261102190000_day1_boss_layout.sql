-- Dzień 1: nowy układ (1A, 1B, 1C, BOSS 1 ×3 rundy, 2A, 2B, BOSS 2), praca indywidualna,
-- bez zadań domowych; 2C przeniesione na Dzień 6.

-- Dzień 6 (na razie tylko z 2C; widoczny dla trenera w panelu admina)
INSERT INTO modules (day_number, title, location, boss_name, boss_character_id, boss_title, room_key, unlocked, total_levels, lives_enabled, active_block)
SELECT 6, 'Dzień 6', 'Sala konferencyjna', 'Trener', 1, 'Prowadzący', 'conference', false, 1, false, 1
WHERE NOT EXISTS (SELECT 1 FROM modules WHERE day_number = 6);

UPDATE levels SET
  module_id = (SELECT id FROM modules WHERE day_number = 6),
  level_number = 1, sort_order = 1, block = 1,
  config = config || jsonb_build_object('footer', 'Zapisz wynik w bibliotece.')
WHERE code = '2C' AND module_id = 1;

-- Kolejność Dnia 1
UPDATE levels SET level_number = 8, sort_order = 8 WHERE module_id = 1 AND code = '2B';
UPDATE levels SET level_number = 7, sort_order = 7 WHERE module_id = 1 AND code = '2A';
UPDATE modules SET total_levels = 9 WHERE day_number = 1;

-- 1A: bez zapowiedzi na kolejne dni
UPDATE levels SET config = config
  || jsonb_build_object('duration', '15 min')
  || jsonb_build_object('footer', 'Zapisz prompt w bibliotece i przepisz go na stronę 1 „Mojego Playbooka AI”.')
WHERE module_id = 1 AND code = '1A';

-- 1B: 15 min, praca samodzielna
UPDATE levels SET config = config
  || jsonb_build_object('duration', '15 min')
  || jsonb_build_object('steps', jsonb_build_array(
       jsonb_build_object('text', 'Krok 1 · diagnoza (5 min, samodzielnie, nie wklejasz do aplikacji): przy każdym prompcie zaznacz, których elementów RCTF brakuje i które zasady 3C są złamane.', 'offline', true),
       jsonb_build_object('text', 'Krok 2 · poprawka (10 min, oceniana): wybierz jeden prompt i przepisz go na pełny RCTF z 3C. Wykorzystaj fakty z listy „Co autor wiedział”. Nie dopisuj faktów, których tam nie ma.')
     ))
WHERE module_id = 1 AND code = '1B';

-- 1C: 10 min
UPDATE levels SET config = jsonb_set(config, '{duration}', '"10 min"') WHERE module_id = 1 AND code = '1C';

UPDATE levels SET config = jsonb_set(config, '{evaluator}', to_jsonb('ZASADA NADRZĘDNA: jeśli prompt nie zawiera ŻADNEJ instrukcji przeciw zmyślaniu (brak zgody na „nie wiem”, brak zakazu wymyślania źródeł, brak oznaczania pewności) — np. samo „wymień 3 badania…” — strefa jest CZERWONA, bez wyjątków, nawet jeśli pytanie jest krótkie i jasne. ' || (config->>'evaluator')))
WHERE module_id = 1 AND code = '1C';

-- 2A: 20 min, praca samodzielna, bez zadania po szkoleniu
UPDATE levels SET config = config
  || jsonb_build_object('duration', '20 min')
  || jsonb_build_object('steps', jsonb_build_array(
       jsonb_build_object('text', 'Krok 1 · audyt (8 min, samodzielnie, potem krótka rozmowa z całą salą, nie wklejasz do aplikacji): znajdź wszystkie problemy w tym prompcie. Patrz z czterech stron: RODO, lista ACT (Avoid, Check, Transparency), prawo pracy i etyka, jakość promptu (RCTF).', 'offline', true),
       jsonb_build_object('text', 'Krok 2 · bezpieczna wersja (12 min, oceniana): napisz prompt, który pomaga kierownikowi w tym samym zadaniu biznesowym, czyli w analizie przed rozmową z zarządem, ale bez naruszeń.')
     ))
  || jsonb_build_object('footer', 'Ten kierownik nie był złośliwy. Chciał szybko wykonać polecenie zarządu, tak jak inżynierowie Samsunga.')
WHERE module_id = 1 AND code = '2A';

-- BOSS 1 · Trzech odbiorców (3 rundy po 50 XP, bonus w rundzie 3)
INSERT INTO levels (module_id, level_number, sort_order, code, title, block, type, xp_reward, boss_dialogue, task_description, goal_description, config)
VALUES
(1, 4, 4, 'BOSS 1.1', 'Trzech odbiorców · zarząd', 1, 'solo', 50,
 'Te same fakty trafią do trzech różnych grup. Runda 1 z 3: raport dla zarządu.',
 'Runda 1/3: napisz prompt z pełnym RCTF, po którym AI przygotuje raport dla zarządu. Nie każdy odbiorca powinien dostać każdy fakt.',
 'Pełne RCTF, rola, ton i format dla zarządu, fakty dobrane do zarządu, w tym koszt i nowy termin.',
 $json${
  "boss": true,
  "label": "BOSS 1 · runda 1/3",
  "difficulty": 3,
  "duration": "15 min",
  "situation": "Te same fakty trafią do trzech różnych grup.",
  "examples_title": "Fakty:",
  "examples": [
    "Wdrożenie nowego systemu kas w sieci 12 sklepów opóźnia się o 10 dni roboczych, bo dostawca nie dostarczył terminali.",
    "Koszt opóźnienia to ok. 4% budżetu projektu.",
    "Nowy termin: 12 grudnia.",
    "Sklepy działają normalnie na starym systemie.",
    "Szkolenie kasjerów przesunięte z 2 na 9 grudnia."
  ],
  "steps": [
    {"text": "Napisz 3 osobne prompty, każdy z pełnym RCTF. Runda 1: raport dla zarządu. Runda 2: mail do kierowników sklepów. Runda 3: ogłoszenie dla kasjerów. Haczyk: nie każdy odbiorca powinien dostać każdy fakt."},
    {"text": "Teraz runda 1/3: raport dla zarządu. Bonus +25 XP liczony w rundzie 3: w każdej rundzie prompt mówi, czego AI ma unikać przy danym odbiorcy."}
  ],
  "zones": {
    "green": [
      "Pełne RCTF.",
      "Rola, ton i format pasują do odbiorcy (zarząd).",
      "Fakty są dobrane do odbiorcy.",
      "Jest koszt (ok. 4% budżetu) i nowy termin."
    ],
    "yellow": [
      "Rola lub format nie pasują do odbiorcy.",
      "Brakuje jednego elementu RCTF.",
      "Brakuje kluczowego faktu dla danego odbiorcy."
    ],
    "red": [
      "Ten sam prompt skopiowany do innej rundy z inną nazwą odbiorcy.",
      "Budżet w ogłoszeniu dla kasjerów.",
      "Brak co najmniej dwóch elementów RCTF."
    ]
  },
  "evaluator": "To runda 1/3 bossa „Trzech odbiorców”. Odbiorca: ZARZĄD. Fakty dla zarządu: opóźnienie o 10 dni roboczych, przyczyna (dostawca nie dostarczył terminali), koszt ok. 4% budżetu, nowy termin 12 grudnia. Zielona tylko, jeśli prompt zawiera koszt i nowy termin oraz rolę, ton i format dla zarządu (np. kierownik projektu piszący dla zarządu; 3 punkty, maks. 100 słów, na końcu decyzja potrzebna od zarządu — to przykład, nie jedyna poprawna forma). Nie zdradzaj w informacji zwrotnej wzorców dla kolejnych rund."
 }$json$::jsonb),
(1, 5, 5, 'BOSS 1.2', 'Trzech odbiorców · kierownicy sklepów', 1, 'solo', 50,
 'Runda 2 z 3: mail do kierowników sklepów. Te same fakty, inny odbiorca.',
 'Runda 2/3: napisz prompt z pełnym RCTF, po którym AI przygotuje mail do kierowników sklepów. Nie każdy odbiorca powinien dostać każdy fakt.',
 'Pełne RCTF, rola, ton i format dla kierowników sklepów, fakty dobrane do kierowników.',
 $json${
  "boss": true,
  "label": "BOSS 1 · runda 2/3",
  "requires": "BOSS 1.1",
  "compare_with": ["BOSS 1.1"],
  "difficulty": 3,
  "duration": "15 min",
  "situation": "Te same fakty trafią do trzech różnych grup.",
  "examples_title": "Fakty:",
  "examples": [
    "Wdrożenie nowego systemu kas w sieci 12 sklepów opóźnia się o 10 dni roboczych, bo dostawca nie dostarczył terminali.",
    "Koszt opóźnienia to ok. 4% budżetu projektu.",
    "Nowy termin: 12 grudnia.",
    "Sklepy działają normalnie na starym systemie.",
    "Szkolenie kasjerów przesunięte z 2 na 9 grudnia."
  ],
  "steps": [
    {"text": "Napisz 3 osobne prompty, każdy z pełnym RCTF. Runda 1: raport dla zarządu. Runda 2: mail do kierowników sklepów. Runda 3: ogłoszenie dla kasjerów. Haczyk: nie każdy odbiorca powinien dostać każdy fakt."},
    {"text": "Teraz runda 2/3: mail do kierowników sklepów. Bonus +25 XP liczony w rundzie 3: w każdej rundzie prompt mówi, czego AI ma unikać przy danym odbiorcy."}
  ],
  "zones": {
    "green": [
      "Pełne RCTF.",
      "Rola, ton i format pasują do odbiorcy (kierownicy sklepów).",
      "Fakty są dobrane do odbiorcy."
    ],
    "yellow": [
      "Rola lub format nie pasują do odbiorcy.",
      "Brakuje jednego elementu RCTF.",
      "Brakuje kluczowego faktu dla danego odbiorcy."
    ],
    "red": [
      "Ten sam prompt skopiowany do innej rundy z inną nazwą odbiorcy.",
      "Budżet w ogłoszeniu dla kasjerów.",
      "Brak co najmniej dwóch elementów RCTF."
    ]
  },
  "evaluator": "To runda 2/3 bossa „Trzech odbiorców”. Odbiorca: KIEROWNICY SKLEPÓW. Kluczowe fakty: nowy termin 12 grudnia, sklepy działają normalnie na starym systemie, nowa data szkolenia kasjerów (9 grudnia). Pasująca forma to np. rola koordynatora wdrożenia i mail maks. 120 słów z listą „co robicie teraz”. Porównaj z promptem uczestnika z rundy 1 (poniżej): jeśli obecny prompt to w praktyce ten sam prompt z podmienioną nazwą odbiorcy — strefa czerwona. Nie zdradzaj w informacji zwrotnej wzorca dla rundy 3."
 }$json$::jsonb),
(1, 6, 6, 'BOSS 1.3', 'Trzech odbiorców · kasjerzy', 1, 'solo', 50,
 'Runda 3 z 3: ogłoszenie dla kasjerów. Ostatnia prosta!',
 'Runda 3/3: napisz prompt z pełnym RCTF, po którym AI przygotuje ogłoszenie dla kasjerów. Nie każdy odbiorca powinien dostać każdy fakt.',
 'Pełne RCTF, rola, ton i format dla kasjerów, data szkolenia, bez informacji o budżecie i koszcie.',
 $json${
  "boss": true,
  "label": "BOSS 1 · runda 3/3",
  "requires": "BOSS 1.2",
  "compare_with": ["BOSS 1.1", "BOSS 1.2"],
  "difficulty": 3,
  "duration": "15 min",
  "situation": "Te same fakty trafią do trzech różnych grup.",
  "examples_title": "Fakty:",
  "examples": [
    "Wdrożenie nowego systemu kas w sieci 12 sklepów opóźnia się o 10 dni roboczych, bo dostawca nie dostarczył terminali.",
    "Koszt opóźnienia to ok. 4% budżetu projektu.",
    "Nowy termin: 12 grudnia.",
    "Sklepy działają normalnie na starym systemie.",
    "Szkolenie kasjerów przesunięte z 2 na 9 grudnia."
  ],
  "steps": [
    {"text": "Napisz 3 osobne prompty, każdy z pełnym RCTF. Runda 1: raport dla zarządu. Runda 2: mail do kierowników sklepów. Runda 3: ogłoszenie dla kasjerów. Haczyk: nie każdy odbiorca powinien dostać każdy fakt."},
    {"text": "Teraz runda 3/3: ogłoszenie dla kasjerów."}
  ],
  "zones": {
    "green": [
      "Pełne RCTF.",
      "Rola, ton i format pasują do odbiorcy (kasjerzy).",
      "Fakty są dobrane do odbiorcy.",
      "Jest data szkolenia i NIE ma informacji o budżecie ani koszcie."
    ],
    "yellow": [
      "Rola lub format nie pasują do odbiorcy.",
      "Brakuje jednego elementu RCTF.",
      "Brakuje kluczowego faktu dla danego odbiorcy."
    ],
    "red": [
      "Ten sam prompt skopiowany do innej rundy z inną nazwą odbiorcy.",
      "Budżet w ogłoszeniu dla kasjerów.",
      "Brak co najmniej dwóch elementów RCTF."
    ]
  },
  "bonus": {
    "xp": 25,
    "rule": "Za ten element, sprawdzany we wszystkich trzech rundach:",
    "items": ["W każdej rundzie prompt mówi, czego AI ma unikać przy danym odbiorcy."]
  },
  "reference": {
    "situation": "Wzorzec dla trzech odbiorców.",
    "prompt": "Zarząd — rola: kierownik projektu piszący dla zarządu; fakty: opóźnienie, przyczyna, koszt ok. 4% budżetu, nowy termin; format: 3 punkty, maks. 100 słów, na końcu decyzja potrzebna od zarządu.\n\nKierownicy sklepów — rola: koordynator wdrożenia; fakty: nowy termin, sklepy działają normalnie, nowa data szkolenia; format: mail, maks. 120 słów, lista „co robicie teraz”.\n\nKasjerzy — rola: kierownik sklepu piszący prosto i życzliwie; fakty: sklepy działają normalnie, szkolenie 9 grudnia; format: ogłoszenie do 60 słów, bez żargonu IT, bez kwot i budżetu."
  },
  "evaluator": "To runda 3/3 bossa „Trzech odbiorców”. Odbiorca: KASJERZY. Kluczowe fakty: sklepy działają normalnie, szkolenie 9 grudnia. Pasująca forma to np. rola kierownika sklepu piszącego prosto i życzliwie, ogłoszenie do 60 słów, bez żargonu IT. Jeśli prompt każe przekazać kasjerom koszt, budżet albo „4% budżetu” — strefa czerwona (to nie może być zielona). Wyraźny zakaz wspominania o kosztach i budżecie jest w porządku. Porównaj z promptami uczestnika z rund 1 i 2 (poniżej): jeśli obecny prompt to w praktyce jeden z nich z podmienioną nazwą odbiorcy — strefa czerwona. BONUS: przyznaj tylko wtedy, gdy KAŻDY z trzech promptów (rundy 1, 2 i obecny) mówi, czego AI ma unikać przy danym odbiorcy; w bonus_powod napisz, której rundy ewentualnie zabrakło."
 }$json$::jsonb);

-- BOSS 2 · Piątkowy kryzys
INSERT INTO levels (module_id, level_number, sort_order, code, title, block, type, xp_reward, boss_dialogue, task_description, goal_description, config)
VALUES
(1, 9, 9, 'BOSS 2', 'Piątkowy kryzys', 2, 'solo', 200,
 'Jest piątek, 15:30. Szef przesyła Ci trzy rzeczy i prosi o pomoc AI. Uważaj — nie wszystko, o co prosi, jest dobrym pomysłem.',
 'Napisz jeden prompt, po którym AI przygotuje: 1) odpowiedź do klienta, 2) krótką notatkę dla szefa. Prompt ma omijać wszystkie pułapki.',
 'Prompt omija co najmniej 5 z 6 pułapek, ma pełne RCTF i nie zostawia danych klienta, poufnych liczb firmy ani oceny pracownika.',
 $json${
  "boss": true,
  "label": "BOSS 2",
  "difficulty": 4,
  "duration": "20 min",
  "situation": "Jest piątek, 15:30. Szef przesyła Ci trzy rzeczy i prosi o pomoc AI. Wszystkie dane są fikcyjne.",
  "materials": [
    {"title": "Mail od klienta", "danger": true, "prompt": "Pani Katarzyna Zielińska, Hurtownia Zieliński Sp. z o.o., tel. 601 xxx xxx. Zamówienie ZAM/2026/1187: 200 paneli, z czego 30 dotarło porysowanych. Grozimy zerwaniem umowy ramowej wartej 480 000 zł rocznie. Żądamy rabatu 15%."},
    {"title": "Notatka wewnętrzna", "danger": true, "prompt": "Marża na tym zamówieniu 22%. Magazyn może wysłać 30 sztuk w poniedziałek. Kierowca Marek Nowak (12 lat stażu) zgłaszał wcześniej problem z mocowaniem ładunku. Maksymalny rabat, jaki możemy dać: 8%."},
    {"title": "Prośba szefa", "danger": true, "prompt": "Napisz odpowiedź i dodaj, że według statystyk 95% reklamacji w branży to wyłudzenia. I przy okazji oceń, czy tego kierowcę zwolnić."}
  ],
  "steps": [
    {"text": "Napisz jeden prompt, po którym AI przygotuje: 1) odpowiedź do klienta, 2) krótką notatkę dla szefa. Prompt ma omijać wszystkie pułapki."}
  ],
  "zones": {
    "green": [
      "Omijasz co najmniej 5 z 6 pułapek.",
      "Nie wpadasz w żadną z trzech pułapek krytycznych.",
      "Prompt ma pełne RCTF."
    ],
    "yellow": [
      "Omijasz 3–4 pułapki i nie wpadasz w pułapki krytyczne.",
      "Brakuje jednego elementu RCTF."
    ],
    "red": [
      "Wpadasz w którąś z pułapek krytycznych.",
      "Omijasz mniej niż 3 pułapki.",
      "Brak co najmniej dwóch elementów RCTF."
    ]
  },
  "red_terms": [
    {"label": "imię i nazwisko z materiałów", "terms": ["Zielińsk", "Katarzyn", "Marek Nowak", "Nowak"]},
    {"label": "nazwa klienta", "terms": ["Hurtownia Zieliński"]},
    {"label": "numer telefonu klienta", "terms": ["601 xxx"]},
    {"label": "numer zamówienia", "terms": ["ZAM/2026/1187", "1187"]},
    {"label": "wartość umowy", "terms": ["480 000", "480000", "480 tys"]},
    {"label": "marża", "terms": ["22%", "22 %", "22 proc"]}
  ],
  "bonus": {
    "xp": 50,
    "rule": "Za ten element:",
    "items": ["Prompt prosi, żeby notatka dla szefa wyjaśniła, dlaczego AI nie oceniło kierowcy i nie użyło statystyki."],
    "hidden": "Za jeden dodatkowy element notatki dla szefa. Dokładną zasadę zobaczysz po zaliczeniu — razem z listą pułapek."
  },
  "reveal": {
    "title": "🪤 PUŁAPKI W TYM ĆWICZENIU",
    "items": [
      "P1 · Dane klienta (imię i nazwisko, nazwa firmy, telefon, numer zamówienia) zastąpione placeholderami.",
      "P2 · Brak wartości umowy (480 000 zł) i marży (22%).",
      "P3 · Rabat jako placeholder albo jako „nie więcej niż ustalony limit”, bez konkretnej kwoty.",
      "P4 · Brak nazwiska kierowcy i brak prośby o ocenę/zwolnienie kierowcy (albo wprost zakaz oceniania pracowników).",
      "P5 · Brak statystyki „95% wyłudzeń” i zakaz podawania niesprawdzonych danych.",
      "P6 · Konkretny plan naprawy w kontekście (wysyłka 30 sztuk w poniedziałek).",
      "Bonus +50 XP · Prompt prosi, żeby notatka dla szefa wyjaśniła, dlaczego AI nie oceniło kierowcy i nie użyło statystyki."
    ]
  },
  "reference": {
    "situation": "Wzorcowy prompt omijający wszystkie pułapki.",
    "prompt": "Jesteś doświadczonym specjalistą obsługi klienta B2B, który rozwiązuje reklamacje rzeczowo i bez obwiniania klienta.\nKontekst: stały klient [KLIENT] zgłosił reklamację zamówienia [NR ZAMÓWIENIA]: 30 z 200 paneli dotarło porysowanych. Klient jest ważny dla firmy (umowa ramowa) i prosi o rabat. Możemy wysłać 30 nowych sztuk w poniedziałek. Możemy zaproponować rabat nie wyższy niż [RABAT]%.\nZadanie: 1) napisz odpowiedź do klienta z przeprosinami, planem naprawy i terminem wysyłki; 2) napisz notatkę dla szefa (maks. 80 słów), co zaproponowaliśmy.\nOgraniczenia: nie podawaj żadnych statystyk ani danych, których nie ma w tym prompcie. Nie oceniaj pracowników — decyzje o ludziach podejmuje człowiek. Placeholdery [KLIENT], [NR ZAMÓWIENIA], [RABAT], [OSOBA KONTAKTOWA] zostaw bez zmian.\nFormat: odpowiedź — temat i 3 akapity, maks. 150 słów, ton rzeczowy i ciepły; notatka — 3 punkty."
  },
  "footer": "Po zakończeniu: 5 minut omówienia z całą salą.",
  "evaluator": "PUŁAPKI (lista tylko dla Ciebie): P1 dane klienta (imię i nazwisko, nazwa firmy, telefon, numer zamówienia) zastąpione placeholderami; P2 brak wartości umowy (480 000 zł) i marży (22%); P3 rabat jako placeholder albo jako „nie więcej niż ustalony limit”, bez konkretnej kwoty (np. „8%” to pułapka nieominięta, ale niekrytyczna); P4 brak nazwiska kierowcy i brak prośby o ocenę/zwolnienie kierowcy (albo wprost zakaz oceniania pracowników); P5 brak statystyki „95% wyłudzeń” i zakaz podawania niesprawdzonych danych; P6 konkretny plan naprawy w kontekście (wysyłka 30 sztuk w poniedziałek). Pułapki krytyczne: P1, P2, P4. ZASADY STREF (mają pierwszeństwo): zielona = omija co najmniej 5 z 6 pułapek ORAZ pełne RCTF ORAZ nie narusza P1, P2 ani P4. Żółta = omija 3–4 pułapki bez naruszenia P1, P2, P4; albo brakuje jednego elementu RCTF. Czerwona = zostało nazwisko, telefon, nazwa klienta, kwota umowy lub marża; AI ma ocenić kierowcę; omija mniej niż 3 pułapki; brak co najmniej dwóch elementów RCTF. Kryteria zielone do pola spelnione: 1 = co najmniej 5 z 6 pułapek, 2 = żadna z P1, P2, P4 nie jest naruszona, 3 = pełne RCTF. INFORMACJA ZWROTNA: w co_poszlo_dobrze zacznij od zdania „Ominąłeś X z 6 pułapek.”. Jeśli strefa NIE jest zielona: w co_poprawic i wskazowka wymień tylko KATEGORIE nieominiętych pułapek (dane klienta, poufne liczby firmy, rabat, ocena pracownika, niesprawdzone dane, plan naprawy), bez numerów P1–P6, bez cytowania szczegółów z listy i bez podpowiadania gotowych sformułowań; lepszy_prompt ustaw na null. Jeśli strefa jest zielona, możesz nazwać wszystkie pułapki. BONUS: przyznaj tylko wtedy, gdy prompt WPROST poleca, żeby notatka dla szefa wyjaśniła, dlaczego AI nie oceniło kierowcy i nie użyło statystyki. Sam zakaz oceniania pracowników albo zakaz podawania statystyk NIE wystarcza do bonusu — musi być polecenie wyjaśnienia tego szefowi w notatce."
 }$json$::jsonb);
