-- =====================================================
-- PROMPT QUEST — Schema SQL dla Supabase
-- Uruchom w Supabase SQL Editor
-- =====================================================

-- Gracze
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text,
  character_id integer,
  role text DEFAULT 'player',
  total_xp integer DEFAULT 0,
  current_module integer DEFAULT 1,
  current_lives integer DEFAULT 3,
  current_level_in_module integer DEFAULT 1,
  created_at timestamp DEFAULT now()
);

-- Moduły
CREATE TABLE IF NOT EXISTS modules (
  id serial PRIMARY KEY,
  day_number integer NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  boss_name text NOT NULL,
  boss_character_id integer NOT NULL,
  boss_title text NOT NULL,
  room_key text NOT NULL,
  unlocked boolean DEFAULT false,
  total_levels integer NOT NULL
);

-- Levele
CREATE TABLE IF NOT EXISTS levels (
  id serial PRIMARY KEY,
  module_id integer REFERENCES modules(id),
  level_number integer NOT NULL,
  type text NOT NULL,
  boss_dialogue text NOT NULL,
  task_description text NOT NULL,
  goal_description text,
  xp_reward integer DEFAULT 50,
  broken_prompt text,
  blind_option_a text,
  blind_option_b text,
  blind_correct text,
  sort_order integer DEFAULT 0
);

-- Wyniki walk
CREATE TABLE IF NOT EXISTS battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id),
  level_id integer REFERENCES levels(id),
  prompt_used text,
  score integer,
  xp_earned integer,
  co_poszlo_dobrze text,
  co_poprawic text,
  wskazowka text,
  attempt_number integer DEFAULT 1,
  completed_at timestamp DEFAULT now()
);

-- Archiwum sesji szkoleniowych
CREATE TABLE IF NOT EXISTS training_sessions (
  id serial PRIMARY KEY,
  session_name text,
  session_date timestamp DEFAULT now(),
  battles_data jsonb,
  players_summary jsonb
);

-- =====================================================
-- DANE STARTOWE
-- =====================================================

INSERT INTO modules (day_number, title, location, boss_name, boss_character_id, boss_title, room_key, unlocked, total_levels) VALUES
(1, 'Pierwsze kroki z AI',        'Recepcja',           'Pani Zofia',      3, 'Recepcjonistka',      'reception',  true,  6),
(2, 'Promptowanie jak pro',        'Open Space',         'Kierownik Marek', 7, 'Kierownik działu',    'openspace',  false, 6),
(3, 'Ekosystem narzędzi AI',       'Sala konferencyjna', 'Dyrektor Anna',   5, 'Dyrektor marketingu', 'conference', false, 6),
(4, 'AI jako partner do myślenia', 'Gabinet managera',   'Prezes Tomasz',   9, 'Prezes zarządu',      'director',   false, 6);

-- Kolumny: module_id, level_number, type, boss_dialogue, task_description, goal_description, xp_reward, sort_order, broken_prompt, blind_option_a, blind_option_b, blind_correct

-- Moduł 1 — Recepcja — Pani Zofia
INSERT INTO levels (module_id, level_number, type, boss_dialogue, task_description, goal_description, xp_reward, sort_order, broken_prompt, blind_option_a, blind_option_b, blind_correct) VALUES
(1, 1, 'solo',       'Hej! Dostałam emaila od zdenerwowanego klienta który czekał godzinę. Możesz mi napisać grzeczną odpowiedź?',     'Napisz prompt który każe AI napisać profesjonalną odpowiedź na emaila od zdenerwowanego klienta który długo czekał.',          'Odpowiedź AI powinna: przepraszać za czas oczekiwania, być ciepła i profesjonalna, proponować działanie naprawcze, nie być defensywna.', 50, 1, NULL, NULL, NULL, NULL),
(1, 2, 'solo',       'Muszę napisać raport tygodniowy do szefa ale mam tylko listę zadań. Pomożesz?',                                   'Napisz prompt który zamieni surową listę zadań w profesjonalny raport dla szefa: 47 ofert, 8 rozmów, 23 kontakty, 3 reklamacje.', 'Raport AI powinien: pisać o efektach a nie czynnościach, mieć profesjonalny ton, być zwięzły (max 5 punktów).',                      50, 2, NULL, NULL, NULL, NULL),
(1, 3, 'fix_prompt', 'Próbowałam napisać ogłoszenie o pracę ale AI dała coś beznadziejnego. Popraw mój prompt!',                        'Popraw poniższy prompt żeby AI napisała dobre ogłoszenie o pracę na stanowisko recepcjonistki.',                                   'Ogłoszenie AI powinno: określać stanowisko i wymagania, zachęcać do aplikowania, mieć odpowiedni ton.',                              40, 3, 'napisz ogłoszenie o prace', NULL, NULL, NULL),
(1, 4, 'solo',       'Klient pyta o godziny otwarcia w święta po angielsku. Jak mam mu odpowiedzieć?',                                 'Napisz prompt który każe AI napisać profesjonalną odpowiedź po angielsku o godzinach w Boże Narodzenie: zamknięte 24-26 grudnia, otwarte od 27.', 'Odpowiedź AI powinna: być po angielsku, podawać konkretne daty, być uprzejma, życzyć wesołych świąt.',                   50, 4, NULL, NULL, NULL, NULL),
(1, 5, 'blind_test', 'Mam dwie odpowiedzi na pytanie o nasze usługi. Jedna napisała AI a druga moja koleżanka. Zgadnij!',              'Która odpowiedź na pytanie "Jakie usługi oferuje wasza firma?" została napisana przez AI?',                                       'Wskaż która odpowiedź pochodzi od AI.',                                                                                          30, 5, NULL, 'Oferujemy kompleksowe usługi dla biznesu: 1) Consulting strategiczny, 2) Wdrożenia systemów IT, 3) Szkolenia pracowników, 4) Obsługa klienta 24/7. Zapraszamy do kontaktu.', 'Wie pan, trudno mi tak z głowy wymienić wszystko bo zależy od potrzeb. Najlepiej żeby pan zadzwonił — mamy kilka osób które się na tym znają lepiej ode mnie.', 'a'),
(1, 6, 'solo',       'Super! Na koniec — napisz prompt który ja mogę używać CODZIENNIE do zadań na recepcji.',                          'Napisz prompt działający jako "asystent recepcjonistki" — elastyczny na emaile, spotkania i obsługę klientów, gotowy do wielokrotnego użycia.', 'Prompt powinien: definiować rolę AI, być elastyczny na różne zadania, dawać profesjonalne wyniki, być prosty w użyciu.', 70, 6, NULL, NULL, NULL, NULL);

-- Moduł 2 — Open Space — Kierownik Marek
INSERT INTO levels (module_id, level_number, type, boss_dialogue, task_description, goal_description, xp_reward, sort_order, broken_prompt, blind_option_a, blind_option_b, blind_correct) VALUES
(2, 1, 'solo',       'Mam notatki ze spotkania — ściana tekstu. Jutro zarząd i potrzebuję 5 konkretnych punktów. Szybko!',              'Napisz prompt używając techniki "myśl krok po kroku" który przetworzy notatki ze spotkania na 5 punktów akcji z osobami i terminami.', 'Prompt powinien: używać chain of thought, dawać strukturę punktów akcji, określać odpowiedzialnych i terminy.',                    60, 1, NULL, NULL, NULL, NULL),
(2, 2, 'solo',       'Pracownik prosi o podwyżkę. Nie wiem jak mu odpowiedzieć. AI pomoże?',                                           'Napisz prompt który przygotuje do trudnej rozmowy o podwyżce: perspektywa pracownika, argumenty, rozwiązanie win-win.',            'Odpowiedź AI powinna: przygotowywać do rozmowy z obu stron, dawać konkretne argumenty, proponować alternatywy.',                     60, 2, NULL, NULL, NULL, NULL),
(2, 3, 'fix_prompt', 'Zespół próbował użyć AI do analizy skarg klientów ale dostali ogólniki. Popraw ten prompt!',                     'Popraw prompt żeby AI naprawdę przeanalizowała skargi i dała konkretne rekomendacje dla managera.',                               'Prompt powinien dawać: kategoryzację skarg, liczbowe podsumowanie, konkretne rekomendacje i priorytety.',                            50, 3, 'przeanalizuj te skargi klientów', NULL, NULL, NULL),
(2, 4, 'solo',       'Muszę napisać plan Q4 dla 8-osobowego działu. Nie wiem od czego zacząć.',                                        'Napisz łańcuch 3 promptów który każe AI: 1) przeanalizować cele Q4 dla sprzedaży, 2) zaproponować strukturę planu, 3) stworzyć szablon z KPIs.', 'Łańcuch powinien: mieć logiczną kolejność, każdy prompt budować na poprzednim, dawać mierzalne cele.',               70, 4, NULL, NULL, NULL, NULL),
(2, 5, 'solo',       'Trudny klient grozi odejściem do konkurencji. Płaci 15 000 zł miesięcznie. Pomóż!',                              'Napisz prompt z pełnym RCTF który każe AI napisać email retencyjny do klienta grożącego odejściem po 3 latach współpracy.',       'Email AI powinien: uznawać obawy, pokazywać wartość współpracy, proponować rozwiązanie, nie brzmieć desperacko.',                    70, 5, NULL, NULL, NULL, NULL),
(2, 6, 'blind_test', 'Mam dwie wersje emaila do klienta. Którą napisała AI a którą mój najlepszy handlowiec?',                         'Która wersja emaila z ofertą B2B została napisana przez AI?',                                                                     'Wskaż która wersja emaila pochodzi od AI.',                                                                                      40, 6, NULL, 'Szanowny Panie Kowalski, w nawiązaniu do rozmowy z 15 marca, przesyłam ofertę: wdrożenie CRM (3 miesiące), szkolenie (2 dni), wsparcie (12 miesięcy). Wartość: 45 000 zł netto. Zapraszam do kontaktu.', 'Panie Marku! Super było pogadać. Wysyłam ofertę jak obiecałem — wrzuciłem wszystko o czym gadaliśmy plus coś ekstra. Dajcie znać co myślicie!', 'a');

-- Moduł 3 — Sala konferencyjna — Dyrektor Anna
INSERT INTO levels (module_id, level_number, type, boss_dialogue, task_description, goal_description, xp_reward, sort_order, broken_prompt, blind_option_a, blind_option_b, blind_correct) VALUES
(3, 1, 'solo',       'ChatGPT, Claude, Gemini... którego używać? Marnuję czas próbując wszystkich!',                                   'Napisz prompt który każe AI wyjaśnić różnice między ChatGPT, Claude i Gemini dla laika — żeby zdecydować które wybrać do pracy biurowej.', 'Odpowiedź AI powinna: porównywać bez technikaliów, wskazywać do czego każde służy, dawać konkretną rekomendację.',             50, 1, NULL, NULL, NULL, NULL),
(3, 2, 'solo',       'Potrzebuję zdjęcia nowoczesnego biura do prezentacji. Grafik na urlopie. AI pomoże?',                            'Napisz prompt do generowania obrazu (DALL-E/Midjourney) który stworzy profesjonalne zdjęcie nowoczesnego biura jak stock photo.', 'Prompt do obrazu powinien: opisywać styl, oświetlenie, kompozycję, kolorystykę i nastrój — wystarczająco szczegółowo.',             60, 2, NULL, NULL, NULL, NULL),
(3, 3, 'fix_prompt', 'Asystent próbował zrobić prezentację Copilotem ale dostał bałagan. Popraw jego prompt!',                         'Popraw prompt do Copilota w PowerPoincie żeby AI stworzyła profesjonalną prezentację dla zarządu.',                               'Prompt powinien dawać: strukturę slajdów, profesjonalny ton, logiczny przepływ, wskazanie kluczowych danych.',                       50, 3, 'zrób prezentację o wynikach firmy', NULL, NULL, NULL),
(3, 4, 'solo',       'Nagrałam godzinę spotkania z klientem. Potrzebuję transkrypt i podsumowanie na jutro rano!',                     'Napisz prompt który opisuje jak użyć AI do transkrypcji nagrania i stworzenia podsumowania z decyzjami i zadaniami.',             'Odpowiedź AI powinna: wskazywać narzędzia do audio, dawać prompt do transkrypcji, dawać prompt do podsumowania.',                    60, 4, NULL, NULL, NULL, NULL),
(3, 5, 'blind_test', 'Mam dwa opisy produktu do katalogu — copywriter vs AI. Który jest który?',                                      'Który opis systemu do zarządzania projektami dla firm napisała AI?',                                                              'Wskaż który opis pochodzi od AI.',                                                                                               40, 5, NULL, 'ProjectFlow to kompleksowe rozwiązanie łączące intuicyjny interfejs z zaawansowanymi funkcjami analitycznymi. Śledzenie postępów w czasie rzeczywistym, automatyczne raporty, integracja z narzędziami biznesowymi. Zwiększ produktywność o 40%.', 'Pamiętam jak wprowadzaliśmy ProjectFlow. Pierwsze tygodnie chaotyczne — wszyscy narzekali na kolejny system. Ale po miesiącu nikt nie chciał wracać do Excelów. Nie chodzi o funkcje — chodzi o to żeby ludzie przestali gubić maila od szefa.', 'a'),
(3, 6, 'solo',       'Jutro demo dla klienta z firmy produkcyjnej. Jak się przygotować z pomocą AI?',                                  'Napisz prompt który każe AI przygotować do demo AI dla firmy produkcyjnej: 3 przykłady użycia, oszczędności czasu, odpowiedzi na obiekcje.', 'Odpowiedź AI powinna: dawać 3 realistyczne przykłady z liczbami, szacować oszczędności, przewidywać obiekcje z gotowymi odpowiedziami.', 70, 6, NULL, NULL, NULL, NULL);

-- Moduł 4 — Gabinet Prezesa — Prezes Tomasz
INSERT INTO levels (module_id, level_number, type, boss_dialogue, task_description, goal_description, xp_reward, sort_order, broken_prompt, blind_option_a, blind_option_b, blind_correct) VALUES
(4, 1, 'solo',       'Rozważam nowy oddział w Gdańsku. Mam przeczucie że to dobry pomysł ale jak to przeanalizować?',                  'Napisz prompt który każe AI przeprowadzić pełną analizę decyzji o nowym oddziale w Gdańsku — ryzyka, szanse, koszty, alternatywy. Użyj "adwokata diabła".', 'Analiza AI powinna: przedstawiać ZA i PRZECIW, identyfikować ryzyka, sugerować alternatywy, wskazywać jakich danych brakuje.', 70, 1, NULL, NULL, NULL, NULL),
(4, 2, 'solo',       'Mam dane sprzedażowe za rok. Chcę wiedzieć co się naprawdę dzieje. Nie chcę ogólników!',                         'Napisz prompt który każe AI głęboko przeanalizować dane sprzedażowe: trendy, anomalie, rosnące i spadające produkty, regiony problemowe.', 'Prompt powinien być precyzyjny. Odpowiedź AI powinna dawać: pytania diagnostyczne, framework analizy, wskaźniki, rekomendacje.', 70, 2, NULL, NULL, NULL, NULL),
(4, 3, 'fix_prompt', 'Dyrektor finansowy chciał prognozę Q4 z AI ale dostał wykład z ekonomii. Popraw ten prompt!',                    'Popraw prompt żeby AI pomogła stworzyć realistyczną prognozę finansową Q4 dla małej firmy usługowej.',                            'Prompt powinien dawać: strukturę prognozy (przychody, koszty, marża), scenariusze optymistyczny/realistyczny/pesymistyczny.',        60, 3, 'zrób mi prognozę finansową na Q4', NULL, NULL, NULL),
(4, 4, 'solo',       'Kluczowy menedżer chce odejść do konkurencji. Rozmowa jutro. Jak to rozegrać?',                                  'Napisz prompt który przygotuje do rozmowy retencyjnej: motywacje odejść, strategia rozmowy, konkretne propozycje, czego NIE mówić.', 'Odpowiedź AI powinna: wyjaśniać typowe motywacje, dawać strategię krok po kroku, sugerować propozycje retencyjne.',             70, 4, NULL, NULL, NULL, NULL),
(4, 5, 'solo',       'Za 3 miesiące wdrażamy AI dla 50 pracowników. Nie wiem od czego zacząć. Pomóżcie!',                             'Napisz prompt który każe AI stworzyć 90-dniowy plan wdrożenia AI dla 50 pracowników: etapy, szkolenia, narzędzia, KPIs, przeszkody.', 'Plan AI powinien: być podzielony na 3 fazy, zawierać konkretne działania, przewidywać opór pracowników i jak go przezwyciężyć.', 80, 5, NULL, NULL, NULL, NULL),
(4, 6, 'blind_test', 'Mam dwie analizy SWOT. Jedna od AI, druga od konsultanta za 5000 zł. Zgadnij która jest która!',                 'Która analiza SWOT firmy technologicznej została napisana przez AI?',                                                             'Wskaż którą analizę SWOT napisała AI.',                                                                                          60, 6, NULL, 'MOCNE STRONY: Doświadczony zespół (śr. 8 lat), stabilna baza (87% retencja), własne IP. SŁABE STRONY: Ograniczony budżet marketingowy, wolny cykl sprzedaży (4 miesiące). SZANSE: Rynek AI, dotacje UE, konsolidacja. ZAGROŻENIA: Duzi gracze, koszty pracownicze, odpływ specjalistów.', 'Mocna strona to ludzie — znamy się od lat. Słabość której nie przyznajemy to sprzedaż — świetni technicznie, słabi w przekonywaniu. Szansa to fala AI. Ryzyko? Sami siebie — jeśli ktoś kluczowy odejdzie, poczujemy to mocno.', 'a');

-- =====================================================
-- RLS (Row Level Security) — OPCJONALNE
-- Jeśli chcesz wyłączyć RLS dla prostszego działania:
-- =====================================================
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE battles DISABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions DISABLE ROW LEVEL SECURITY;

-- Lub włącz i ustaw policies:
-- ALTER TABLE players ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon can read players" ON players FOR SELECT USING (true);
-- CREATE POLICY "anon can insert battles" ON battles FOR INSERT WITH CHECK (true);
