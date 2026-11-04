-- Dzień 2: czwarte obowiązkowe zadanie w każdym module (1.4, 2.4, 3.4).
-- Tylko UPDATE kolejności istniejących zadań i INSERT nowych — wyniki, próby i konta bez zmian.

UPDATE public.modules SET total_levels = 12 WHERE day_number = 2;

UPDATE public.levels l
SET sort_order = v.pos, level_number = v.pos
FROM (VALUES ('1.1', 1), ('1.2', 2), ('1.3', 3), ('2.1', 5), ('2.2', 6), ('2.3', 7), ('3.1', 9), ('3.2', 10), ('3.3', 11)) AS v(code, pos),
     public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.active AND l.code = v.code;

WITH day2 AS (SELECT id FROM public.modules WHERE day_number = 2),
src(code, sort_order, block, type, title, task_description, config) AS (VALUES
('1.4', 4, 1, 'solo', 'Sprawdź, zanim wyślesz',
 $t$Znajdź wszystkie błędy i napisz AI jedną wiadomość: co dokładnie ma poprawić.$t$,
 $j${
  "label": "Zadanie 1.4",
  "block_name": "Moduł 1 · Rozmowa z AI",
  "department": "Dział serwisu",
  "duration": "10 min",
  "situation": "AI napisało dla klientów informację o nowych godzinach pracy serwisu. Wygląda ładnie, ale zanim ją wyślesz, porównujesz ją z faktami. W wyniku AI jest kilka błędów. Musisz je sam znaleźć.",
  "blocks": [
    {"title": "Wynik AI", "text": "„Hej! Mamy super wiadomość: od 1 maja serwis działa dłużej, od 8:00 do 18:00, także w soboty! A dla wszystkich klientów dojazd gratis!”"},
    {"title": "Fakty", "text": "od 1 marca · serwis czynny od poniedziałku do piątku, 7:00–17:00 · w soboty zamknięte · o dojeździe nic się nie zmienia"}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [{"text": "Znajdź wszystkie błędy i napisz AI jedną wiadomość: co dokładnie ma poprawić."}],
  "remember": [
    "każdy błąd nazwany konkretnie, razem z poprawną informacją",
    "sprawdź datę, godziny, soboty i to, co AI dopisało od siebie",
    "forma i ton dla klientów firmy"
  ],
  "zones": {
    "green": [
      "każdy błąd nazwany konkretnie, razem z poprawną informacją",
      "sprawdź datę, godziny, soboty i to, co AI dopisało od siebie",
      "forma i ton dla klientów firmy"
    ],
    "yellow": ["Brakuje jednego błędu (np. nie usunąłeś „dojazdu gratis” albo nie poprawiłeś sobót)."],
    "red": ["Ogólna poprawka („popraw to”, „sprawdź fakty”) albo pominięte dwa lub więcej błędów. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Dopisujesz: „Nie dodawaj niczego, czego nie ma w faktach”."]},
  "reference": {"prompt": "Popraw tekst: zmiana obowiązuje od 1 marca, nie od 1 maja. Serwis jest czynny od poniedziałku do piątku, 7:00–17:00, a w soboty zamknięty. Usuń zdanie o dojeździe gratis, tego nie oferujemy. Pisz do klientów na „Państwo”, bez „Hej” i bez wykrzykników. Nie dodawaj niczego, czego nie ma w tych informacjach."},
  "other_example": {
    "situation": "AI napisało ogłoszenie o szkoleniu z błędną salą i dopisało darmowy obiad.",
    "text": "Popraw: szkolenie jest w sali 2, nie w sali 5. Usuń zdanie o darmowym obiedzie, tego nie ma w planie. Pisz rzeczowo, bez wykrzykników."
  },
  "evaluator": "TO JEST POPRAWKA W ROZMOWIE, NIE PEŁNY PROMPT. Nie wymagaj roli, kontekstu, zadania ani formatu — ich brak NIE obniża oceny. Uczestnik porównuje wynik AI z faktami i pisze AI jedną wiadomość, co ma poprawić. W wyniku AI jest 5 błędów, które uczestnik musi SAM znaleźć: (A) data „od 1 maja” → od 1 marca; (B) godziny „od 8:00 do 18:00” → 7:00–17:00, od poniedziałku do piątku; (C) „także w soboty” → w soboty zamknięte; (D) „dojazd gratis” → do usunięcia, bo o dojeździe nic się nie zmienia; (E) „Hej” i wykrzykniki → forma „Państwo”, ton rzeczowy. Błąd jest poprawiony tylko wtedy, gdy uczestnik nazywa go konkretnie i podaje poprawną informację z faktów (np. „od 1 marca”, „7:00–17:00”, „w soboty zamknięte”, „usuń dojazd gratis”, „pisz na »Państwo«, bez »Hej« i wykrzykników”). Samo „popraw datę” bez poprawnej wartości albo zła wartość (np. „8:00–17:00”) NIE poprawia błędu. Przy E: „Pan/Pani”, „per Pan” ani „Ty” NIE wystarczą — wymagana forma „Państwo” i usunięcie „Hej” albo wykrzykników (sens wystarczy, np. „pisz rzeczowo, na »Państwo«”). KRYTERIA (pole spelnione): 1 = każdy błąd, który uczestnik wymienia, ma poprawną informację z faktów (żadnej złej wartości); 2 = poprawione wszystkie błędy treści: A, B, C i D; 3 = poprawiony E. ZIELONA = poprawione wszystkie 5 błędów (A–E), każdy z poprawną wartością. ŻÓŁTA = brakuje dokładnie jednego błędu z A–E (pominięty albo bez poprawnej wartości). CZERWONA = ogólna poprawka bez konkretów (np. „popraw to”, „sprawdź fakty”, „sprawdź fakty i popraw”) albo pominięte dwa lub więcej błędów z A–E, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Daty i godziny z faktów nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. INFORMACJA ZWROTNA — TA ZASADA MA PIERWSZEŃSTWO przed ogólnymi zasadami cytowania brakujących danych, formą „Brakuje X: napisz, …” i przed zasadą wypełniania przyklad_zdania gotowym fragmentem: uczestnik ma sam znaleźć błędy. W polach braki, przyklad_zdania, wskazowka i co_poszlo_dobrze NIE podawaj poprawnych wartości z faktów i NIE nazywaj wprost pominiętego błędu. Powiedz tylko, gdzie szukać. Każdy element braki ma formę: „Sprawdź jeszcze raz soboty.”, „Sprawdź jeszcze raz datę.”, „Sprawdź jeszcze raz godziny.”, „Sprawdź jeszcze raz, co AI dopisało od siebie.” albo „Sprawdź jeszcze raz formę i ton.”; przy ogólnej poprawce: „Napisz konkretnie, co jest źle i jak ma być.”. przyklad_zdania to też tylko wskazówka, gdzie szukać, np. „Porównaj zdanie o sobotach z faktami.”. BONUS: tylko gdy uczestnik dopisuje, żeby AI nie dodawało niczego, czego nie ma w faktach (np. „Nie dodawaj niczego, czego nie ma w faktach”, „nie dopisuj nic od siebie”)."
 }$j$),
('2.4', 8, 2, 'solo', 'Przykłady pokazują układ',
 $t$Napisz prompt, po którym AI napisze opis biurka w tym samym układzie i niczego nie wymyśli.$t$,
 $j${
  "label": "Zadanie 2.4",
  "block_name": "Moduł 2 · Przykłady w prompcie",
  "department": "Dział handlowy",
  "duration": "10 min",
  "situation": "Robisz katalog produktów. Każdy opis ma ten sam układ: nazwa, jedno zdanie zachęty i 3 krótkie punkty. Masz dwa gotowe opisy i dane nowego produktu. Uwaga: o nowym produkcie wiesz tylko 2 rzeczy, a w układzie są 3 punkty.",
  "blocks": [
    {"title": "Opis 1", "text": "Krzesło Ergo · „Wygodne krzesło na cały dzień pracy.” · regulowana wysokość · podłokietniki · kółka do twardych podłóg"},
    {"title": "Opis 2", "text": "Szafka Box · „Pojemna szafka na dokumenty.” · 3 szuflady · zamek na klucz · wysokość 60 cm"},
    {"title": "Nowy produkt", "text": "Biurko Lift 120 · elektryczna regulacja wysokości 70–120 cm · blat 120 × 70 cm"}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [{"text": "Napisz prompt, po którym AI napisze opis biurka w tym samym układzie i niczego nie wymyśli."}],
  "remember": [
    "kim ma być AI",
    "oba opisy jako przykłady, podpisane",
    "dane nowego produktu",
    "prośba o ten sam układ",
    "co AI ma zrobić, gdy brakuje trzeciej cechy (np. wpisać [BRAK DANYCH])"
  ],
  "zones": {
    "green": [
      "kim ma być AI",
      "oba opisy jako przykłady, podpisane",
      "dane nowego produktu",
      "prośba o ten sam układ",
      "co AI ma zrobić, gdy brakuje trzeciej cechy (np. wpisać [BRAK DANYCH])"
    ],
    "yellow": ["Brakuje jednej rzeczy (np. nie ma, co zrobić z brakującą cechą)."],
    "red": ["Brak przykładów albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Prosisz o 2 wersje zdania zachęty do wyboru."]},
  "reference": {"prompt": "Jesteś autorem opisów do katalogu mebli biurowych. Przykład 1: Krzesło Ergo. „Wygodne krzesło na cały dzień pracy.” • regulowana wysokość • podłokietniki • kółka do twardych podłóg. Przykład 2: Szafka Box. „Pojemna szafka na dokumenty.” • 3 szuflady • zamek na klucz • wysokość 60 cm. W tym samym układzie (nazwa, jedno zdanie, 3 punkty) opisz: Biurko Lift 120, elektryczna regulacja wysokości 70–120 cm, blat 120 × 70 cm. Znam tylko te dwie cechy. Nie dopisuj cech od siebie, w trzecim punkcie wpisz [BRAK DANYCH]. Daj 2 wersje zdania zachęty do wyboru."},
  "other_example": {
    "situation": "Recepcja robi kartki z informacją przy drzwiach sal.",
    "text": "Jesteś pracownikiem recepcji. Przykład 1: Sala 1. „Sala na małe spotkania.” • 6 miejsc • telewizor • tablica. Przykład 2: Sala 2. „Sala na szkolenia.” • 20 miejsc • rzutnik • nagłośnienie. W tym samym układzie opisz: Sala 3, 10 miejsc, ekran, kamera do wideorozmów. Nie dopisuj nic od siebie."
  },
  "evaluator": "Uczestnik pisze prompt z dwoma przykładami, po którym AI ma opisać nowy produkt (Biurko Lift 120) w tym samym układzie co gotowe opisy katalogu: nazwa, jedno zdanie zachęty, 3 krótkie punkty. O biurku są znane tylko 2 cechy, a układ ma 3 punkty. KRYTERIA (pole spelnione): 1 = rola AI — każde „Jesteś …” się liczy; 2 = OBA gotowe opisy (Krzesło Ergo i Szafka Box) wklejone jako przykłady i podpisane (np. „Przykład 1” i „Przykład 2”, „Opis 1” i „Opis 2”) — bez podpisów albo z jednym opisem kryterium 2 NIE jest spełnione; 3 = dane nowego produktu: Biurko Lift 120, elektryczna regulacja wysokości 70–120 cm, blat 120 × 70 cm; 4 = prośba o ten sam układ (np. „w tym samym układzie”, „tak samo jak w przykładach”, „nazwa, jedno zdanie, 3 punkty”); 5 = co AI ma zrobić z brakującą trzecią cechą. KLUCZOWE przy 5: uczestnik musi przewidzieć, że trzeciej cechy brakuje, i kazać AI jej nie wymyślać. KAŻDE takie sformułowanie zalicza punkt 5, np. [BRAK DANYCH] (albo inny znacznik w nawiasie kwadratowym), „zostaw puste”, „nie dopisuj”, „nie dopisuj cech od siebie”, „nie wymyślaj cech”, „znam tylko te dwie cechy, nic nie dodawaj”. Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–5. ŻÓŁTA = brakuje dokładnie jednej (najczęściej punktu 5). CZERWONA = brak przykładów albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Nazwy produktów, wymiary i cechy z materiałów ćwiczenia nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. BONUS: tylko gdy uczestnik prosi o 2 wersje zdania zachęty do wyboru."
 }$j$),
('3.4', 12, 3, 'solo', 'Drugi krok łańcucha',
 $t$Napisz prompt: AI ma z tabeli napisać krótkiego maila do zarządu i nie dodać nic nieprawdziwego. Pod promptem wklej tabelę (przycisk „Kopiuj”).$t$,
 $j${
  "label": "Zadanie 3.4",
  "block_name": "Moduł 3 · Styl i własny asystent",
  "department": "Kierownictwo",
  "duration": "12 min",
  "situation": "To dalszy ciąg zadania 3.2. Fakty z zebrania są już wypisane w tabeli. Teraz krok 2: z tej tabeli AI ma napisać krótkiego maila do zarządu.",
  "blocks": [
    {"title": "Tabela z kroku 1 (do skopiowania)", "copy": true, "text": "Decyzja | Termin | Dział\nNowy cennik | do 20 listopada | dział handlowy\nDwóch nowych techników | od grudnia | serwis (rekrutacja: kadry)\nPrzegląd klimatyzacji | 4 grudnia | recepcja\nRaport kwartalny dla zarządu | do 10 stycznia | kierownictwo\nBez decyzji: nowa strona internetowa (nie wiadomo, kto), nowe krzesła do biura"}
  ],
  "steps_title": "Co masz zrobić",
  "steps": [{"text": "Napisz prompt: AI ma z tabeli napisać krótkiego maila do zarządu i nie dodać nic nieprawdziwego. Pod promptem wklej tabelę (przycisk „Kopiuj”)."}],
  "remember": [
    "kim ma być AI i dla kogo jest mail",
    "długość i układ",
    "tylko informacje z tabeli",
    "co zrobić ze sprawami bez decyzji",
    "oznaczenie [DO SPRAWDZENIA], jeśli AI coś doda od siebie",
    "tabela wklejona pod promptem"
  ],
  "zones": {
    "green": [
      "kim ma być AI i dla kogo jest mail",
      "długość i układ",
      "tylko informacje z tabeli",
      "co zrobić ze sprawami bez decyzji",
      "oznaczenie [DO SPRAWDZENIA], jeśli AI coś doda od siebie",
      "tabela wklejona pod promptem"
    ],
    "yellow": ["Brakuje jednej rzeczy."],
    "red": ["Brak tabeli albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy."]
  },
  "bonus": {"xp": 25, "items": ["Na końcu prosisz AI, żeby samo sprawdziło: „Zanim oddasz maila, sprawdź, czy każda informacja jest w tabeli”."]},
  "reference": {"prompt": "Jesteś asystentem kierownika. To krok 2: z tabeli poniżej napisz krótkiego maila do zarządu. Ton rzeczowy, forma „Państwo”, do 120 słów. Decyzje wypisz w punktach z terminem i działem. Na końcu, pod nagłówkiem „Do decyzji”, wypisz sprawy bez decyzji. Używaj tylko informacji z tabeli. Jeśli coś dodajesz od siebie, oznacz to [DO SPRAWDZENIA]. Zanim oddasz maila, sprawdź, czy każda informacja jest w tabeli. Tabela: [wklejona tabela]"},
  "other_example": {
    "situation": "Z notatek z rozmowy z klientem jest już lista potrzeb. Krok 2: oferta.",
    "text": "Jesteś handlowcem. To krok 2: z listy potrzeb klienta poniżej napisz krótką propozycję oferty, do 100 słów, forma „Pan/Pani”. Używaj tylko informacji z listy. Na końcu wypisz pytania do klienta. Lista: [lista]"
  },
  "evaluator": "Uczestnik pisze DRUGI KROK łańcucha (ciąg dalszy zadania 3.2): z gotowej tabeli faktów z zebrania AI ma napisać krótkiego maila do zarządu i nie dodać nic nieprawdziwego. KRYTERIA (pole spelnione): 1 = rola AI (każde „Jesteś …” się liczy) ORAZ odbiorca maila: zarząd; 2 = długość (np. „do 120 słów”, „krótko, maksymalnie 100 słów”) ORAZ układ (np. decyzje w punktach z terminem i działem); 3 = tylko informacje z tabeli (np. „Używaj tylko informacji z tabeli”, „nie dopisuj nic spoza tabeli”); 4 = co zrobić ze sprawami bez decyzji (np. osobno, pod nagłówkiem „Do decyzji”); 5 = oznaczenie [DO SPRAWDZENIA] dla tego, co AI doda od siebie — WYMAGANE właśnie to oznaczenie; samo „nie dodawaj nic od siebie” bez [DO SPRAWDZENIA] NIE spełnia kryterium 5; 6 = tabela z kroku 1 wklejona pod promptem (treść tabeli, np. wiersze o cenniku, technikach, przeglądzie klimatyzacji, raporcie). Przykłady w nawiasach to tylko przykłady — liczy się sens. ZIELONA = spełnione 1–6. ŻÓŁTA = brakuje dokładnie jednej. CZERWONA = brak tabeli albo brakuje dwóch lub więcej rzeczy, albo uczestnik sam wpisał dane z czerwonej strefy (nazwiska, prywatne telefony, e-maile, PESEL, nazwy klientów). Nazwy działów i daty z tabeli nie są danymi z czerwonej strefy. Sprawdzasz tylko tekst uczestnika, nie odpowiedź AI. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej. Dobry wynik AI: 4 decyzje w punktach (cennik, technicy, przegląd klimatyzacji, raport) i osobno „Do decyzji” (strona, krzesła), bez nowych faktów — możesz to skomentować w informacji zwrotnej, ale strefa zależy tylko od tekstu uczestnika. BONUS: tylko gdy uczestnik każe AI samo sprawdzić maila przed oddaniem, czy każda informacja jest w tabeli (np. „Zanim oddasz maila, sprawdź, czy każda informacja jest w tabeli”)."
 }$j$)
)
INSERT INTO public.levels (module_id, level_number, sort_order, block, code, title, type, xp_reward, boss_dialogue, task_description, goal_description, config, active)
SELECT d.id, s.sort_order, s.sort_order, s.block, s.code, s.title, s.type, 100,
       s.config::jsonb->>'situation', s.task_description, NULL, s.config::jsonb, true
FROM src s CROSS JOIN day2 d
WHERE NOT EXISTS (
  SELECT 1 FROM public.levels l WHERE l.module_id = d.id AND l.code = s.code AND l.active
);
