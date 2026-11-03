-- BOSS 2 „Piątkowy kryzys”: prostsze kryteria oceny (sytuacja, materiały, XP i logika bez zmian)

update levels set
  goal_description = 'Prompt nie zawiera danych klienta ani pracownika, nie przekazuje klientowi marży ani limitu rabatu, nie każe użyć statystyki o wyłudzeniach ani oceniać zwolnienia, prosi o odpowiedź do klienta i notatkę dla szefa oraz ma rolę, kontekst, zadanie i format.',
  config = config || jsonb_build_object(
    'zones', jsonb_build_object(
      'green', jsonb_build_array(
        'Brak danych klienta i pracownika: nazwiska, telefonu, nazwy firmy klienta, numeru zamówienia, wartości umowy (placeholdery albo pominięcie są OK).',
        'Prompt nie przekazuje klientowi marży ani maksymalnego limitu rabatu.',
        'Prompt nie każe AI użyć statystyki o wyłudzeniach.',
        'Prompt nie każe AI oceniać, czy zwolnić pracownika.',
        'Prompt prosi o dwie rzeczy: odpowiedź do klienta i notatkę dla szefa.',
        'Prompt ma rolę, kontekst, zadanie i format (krótkie wystarczą).'
      ),
      'yellow', jsonb_build_array(
        'Brakuje jednego z elementów strefy zielonej, np. notatki dla szefa albo formatu.'
      ),
      'red', jsonb_build_array(
        'W prompcie są dane klienta lub pracownika (nazwisko, telefon, nazwa firmy, numer zamówienia, wartość umowy).',
        'Prompt każe użyć statystyki „95% reklamacji to wyłudzenia”.',
        'Prompt każe ocenić, czy zwolnić kierowcę.',
        'Prompt podaje klientowi marżę albo maksymalny limit rabatu.'
      )
    ),
    'bonus', (config->'bonus') || jsonb_build_object(
      'rule', 'Za co najmniej jeden z elementów:',
      'items', jsonb_build_array(
        'Prompt prosi, żeby notatka dla szefa wyjaśniła, dlaczego AI nie użyło statystyki i nie oceniło kierowcy.',
        'Prompt wspomina o przyczynie w procesie, np. sprawdzeniu mocowania ładunku, zamiast szukać winnego.',
        'Prompt prosi AI o wypisanie rzeczy, które trzeba uzupełnić przed wysłaniem.',
        'Prompt zakazuje dopisywania faktów, których nie ma w prompcie.'
      ),
      'hidden', 'Za co najmniej jeden dodatkowy element prompta. Dokładną zasadę zobaczysz po zaliczeniu — razem z listą pułapek.'
    ),
    'reveal', (config->'reveal') || jsonb_build_object(
      'items', jsonb_build_array(
        'Dane klienta i pracownika (nazwisko, telefon, nazwa firmy, numer zamówienia, wartość umowy) — placeholder albo pominięcie.',
        'Marża i maksymalny rabat zostają w firmie — nie trafiają do klienta.',
        'Statystyka „95% wyłudzeń” jest niesprawdzona — nie używamy jej.',
        'Ocena, czy zwolnić kierowcę — o ludziach decyduje człowiek, nie AI.',
        'Bonus +50 XP · za co najmniej jeden: uzasadnienie w notatce dla szefa, przyczyna w procesie (mocowanie ładunku), lista rzeczy do uzupełnienia, zakaz dopisywania faktów.'
      )
    ),
    'evaluator', $e$KRYTERIA ZIELONE do pola spelnione (numeracja jak na liście):
1 = brak danych klienta i pracownika: nie ma nazwisk (Zielińska, Nowak), telefonu, nazwy firmy klienta, numeru zamówienia ani wartości umowy (480 000 zł). Placeholdery (np. [KLIENT], [NR ZAMÓWIENIA]) albo pominięcie są OK. Słowa „klient”, „kierowca”, „pracownik” bez nazwiska są OK;
2 = prompt nie przekazuje klientowi marży (22%) ani maksymalnego limitu rabatu (8%). Placeholder [RABAT], pominięcie rabatu albo zakaz podawania marży i limitu są OK;
3 = prompt nie każe AI użyć statystyki o wyłudzeniach (95%). Zakaz jej użycia albo prośba, żeby notatka dla szefa wyjaśniła, dlaczego jej nie użyto, NIE są poleceniem jej użycia — kryterium jest spełnione;
4 = prompt nie każe AI oceniać, czy zwolnić pracownika. Zakaz oceniania albo prośba, żeby notatka wyjaśniła, dlaczego AI tego nie ocenia, są OK;
5 = prompt prosi o DWIE rzeczy: odpowiedź do klienta ORAZ notatkę (wiadomość, informację) dla szefa. Notatka musi być w zadaniu osobnym poleceniem jej napisania (np. „2) napisz krótką notatkę dla szefa”). Sama wzmianka o notatce w formacie albo w innym miejscu (np. „Format: mail do 120 słów, notatka do 3 zdań”) bez polecenia jej napisania NIE wystarcza — kryterium 5 BRAK. Przykład: zadanie „1) napisz odpowiedź do klienta” i format „mail do 120 słów, notatka do 3 zdań” → kryterium 5 BRAK → ŻÓŁTA. W polu analiza przy kryterium 5 zacytuj polecenie napisania notatki albo napisz BRAK;
6 = prompt ma rolę, kontekst, zadanie i format; wystarczy po jednym krótkim zdaniu. Format = długość albo forma tekstu (np. „mail do 120 słów”).
Kryteria 1–4 są spełnione także wtedy, gdy prompt w ogóle nie porusza danego tematu.
CZERWONA wyłącznie, gdy zachodzi któryś warunek: (a) w prompcie są dane klienta lub pracownika z kryterium 1; (b) prompt każe AI użyć statystyki 95% / wyłudzeń; (c) prompt każe AI ocenić, czy zwolnić kierowcę lub pracownika; (d) prompt każe przekazać klientowi marżę albo maksymalny limit rabatu (np. „daj rabat 8%”, „napisz, że możemy dać maksymalnie 8%”). Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej — nawet gdy prompt jest krótki albo ogólny.
ZIELONA = spełnione wszystkie 6 kryteriów. ŻÓŁTA = nie zachodzi warunek czerwonej, ale brakuje któregoś kryterium (najczęściej 5 albo 6).
NIE wymagaj do zielonej: szczegółowego uzasadnienia w notatce, wzmianki o procesie ani mocowaniu ładunku, planu naprawy, wypisania rzeczy do uzupełnienia, zakazu dopisywania faktów — to elementy bonusu albo dodatki.
BONUS: przyznaj tylko w strefie zielonej, gdy prompt zawiera co najmniej jeden element bonusu.
W polu analiza zakończ dokładnie tak: „Zielone: N z 6. Warunek czerwonej: TAK (który) albo NIE.”
INFORMACJA ZWROTNA: brakujące kryterium nazwij wprost, np. „Brakuje notatki dla szefa: napisz, że AI ma też przygotować krótką notatkę dla szefa.”. Jeśli strefa jest zielona, możesz wymienić pułapki, które uczestnik ominął. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej.$e$
  )
where id = 34;
