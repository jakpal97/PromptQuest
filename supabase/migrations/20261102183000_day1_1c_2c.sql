-- Dzień 1: nowe ćwiczenia 1C i 2C, nowe czasy i kolejność 1A, 1B, 1C, 2A, 2B, 2C

UPDATE modules SET total_levels = 6 WHERE id = 1;

-- Przesunięcie 2A i 2B (od końca, żeby nie zderzyć numerów)
UPDATE levels SET level_number = 5, sort_order = 5 WHERE module_id = 1 AND code = '2B';
UPDATE levels SET level_number = 4, sort_order = 4 WHERE module_id = 1 AND code = '2A';

UPDATE levels SET config = jsonb_set(config, '{duration}', '"15 min"') WHERE module_id = 1 AND code = '1A';

UPDATE levels SET config = config
  || jsonb_build_object('duration', '20 min')
  || jsonb_build_object('steps', jsonb_build_array(
       jsonb_build_object('text', 'Krok 1 · diagnoza (5 min, w parach): przy każdym prompcie zaznacz, których elementów RCTF brakuje i które zasady 3C są złamane.', 'offline', true),
       jsonb_build_object('text', 'Krok 2 · poprawka (15 min, oceniana): wybierz jeden prompt i przepisz go na pełny RCTF z 3C. Wykorzystaj fakty z listy „Co autor wiedział”. Nie dopisuj faktów, których tam nie ma.')
     ))
WHERE module_id = 1 AND code = '1B';

UPDATE levels SET config = config
  || jsonb_build_object('duration', '25 min')
  || jsonb_build_object('steps', jsonb_build_array(
       jsonb_build_object('text', 'Krok 1 · audyt (10 min, w parach): znajdź wszystkie problemy w tym prompcie. Patrz z czterech stron: RODO, lista ACT (Avoid, Check, Transparency), prawo pracy i etyka, jakość promptu (RCTF).', 'offline', true),
       jsonb_build_object('text', 'Krok 2 · bezpieczna wersja (15 min, oceniana): napisz prompt, który pomaga kierownikowi w tym samym zadaniu biznesowym, czyli w analizie przed rozmową z zarządem, ale bez naruszeń.')
     ))
WHERE module_id = 1 AND code = '2A';

UPDATE levels SET config = jsonb_set(config, '{duration}', '"15 min"') WHERE module_id = 1 AND code = '2B';

-- 1C · Rozbrój halucynację
INSERT INTO levels (module_id, level_number, sort_order, code, title, block, type, xp_reward, boss_dialogue, task_description, goal_description, config)
VALUES (1, 3, 3, '1C', 'Rozbrój halucynację', 1, 'solo', 75,
  'Rano widzieliście, jak AI streściło książkę, która nie istnieje. Teraz Twoja kolej: zbuduj prompt, który utrudni AI zmyślanie.',
  'Napisz prompt z pytaniem, na które AI łatwo odpowie zmyśleniem, np. poproś o 3 polskie badania naukowe o pracy zdalnej w małych firmach, z autorami i rokiem. Do pytania dodaj instrukcje, które zmniejszają ryzyko halucynacji.',
  'Prompt pozwala AI odpowiedzieć „nie wiem”, zakazuje wymyślania źródeł, każe oznaczać poziom pewności, ma pełny RCTF.',
  $json${
    "difficulty": 2,
    "duration": "20 min",
    "situation": "Rano widzieliście, jak AI streściło książkę, która nie istnieje. Teraz Twoja kolej: zbuduj prompt, który utrudni AI zmyślanie.",
    "steps": [
      {"text": "Napisz prompt z pytaniem, na które AI łatwo odpowie zmyśleniem, np. poproś o 3 polskie badania naukowe o pracy zdalnej w małych firmach, z autorami i rokiem. Do pytania dodaj instrukcje, które zmniejszają ryzyko halucynacji."}
    ],
    "zones": {
      "green": [
        "Prompt wprost pozwala AI odpowiedzieć „nie wiem” / „nie znam”.",
        "Prompt zakazuje wymyślania źródeł (tytułów, autorów, DOI, linków).",
        "Prompt każe oznaczać poziom pewności albo oddzielać fakty od przypuszczeń.",
        "Obecne są wszystkie cztery elementy RCTF."
      ],
      "yellow": [
        "Jest tylko jedna instrukcja przeciw halucynacjom.",
        "Brakuje formatu."
      ],
      "red": [
        "Samo pytanie bez żadnej instrukcji przeciw zmyślaniu.",
        "Brakuje co najmniej dwóch elementów RCTF.",
        "Prompt zawiera dane z czerwonej strefy (nazwiska, dane kontaktowe, PESEL, nazwy klientów)."
      ]
    },
    "bonus": {
      "xp": 25,
      "rule": "Za jeden element:",
      "items": ["Prompt prosi o wskazanie, gdzie zweryfikować informacje (np. Google Scholar, biblioteka)."]
    },
    "reference": {
      "situation": "Notatka dla zarządu o badaniach nad pracą zdalną.",
      "prompt": "Jesteś ostrożnym analitykiem, który woli przyznać się do niewiedzy niż podać niesprawdzoną informację.\nKontekst: przygotowuję notatkę dla zarządu i każdy fakt będę weryfikować. Zmyślone źródło ośmieszy mnie przed zarządem.\nZadanie: wymień 3 polskie badania naukowe o wpływie pracy zdalnej na wydajność w małych firmach, z autorami i rokiem.\nFormat: przy każdej pozycji oznacz poziom pewności: PEWNE / NIEPEWNE / NIE WIEM. Jeśli nie znasz takiego badania, napisz „nie znam” zamiast tworzyć pozycję. Nie wymyślaj tytułów, autorów ani numerów DOI. Na końcu napisz, gdzie mam to sprawdzić."
    },
    "evaluator": "Nazwiska autorów badań, które AI ma dopiero podać, to nie są dane z czerwonej strefy — oceniaj tylko to, co uczestnik sam wpisał do prompta. Oceń też WYNIK (<odpowiedz_ai>), nie tylko prompt. Jeśli odpowiedź modelu zawiera „nie znam”/„nie wiem” albo oznacza pozycje jako NIEPEWNE zamiast podawać pewne siebie, zmyślone źródła — dopisz w co_poszlo_dobrze, że prompt zadziałał. Jeśli model mimo to podał pewne siebie źródła — dopisz w co_poprawic wskazówkę, co wzmocnić w prompcie. Ten element nie zmienia strefy, tylko informację zwrotną."
  }$json$::jsonb
);

-- 2C · Polityka AI na jedną stronę
INSERT INTO levels (module_id, level_number, sort_order, code, title, block, type, xp_reward, boss_dialogue, task_description, goal_description, config)
VALUES (1, 6, 6, '2C', 'Polityka AI na jedną stronę', 2, 'solo', 100,
  'Po ćwiczeniu 2A wiesz, że kierownik nie był złośliwy — po prostu nikt mu nie powiedział, czego nie wklejać. Napisz prompt, który przygotuje pierwszą wersję polityki AI dla Twojego działu.',
  'Opisz w prompcie firmę bez danych z czerwonej strefy: branżę, wielkość, jakich narzędzi AI używacie i do czego. Poproś o politykę, którą zrozumie każdy pracownik.',
  'Kontekst z branżą, wielkością, narzędziami i zastosowaniami AI, bez nazwy firmy i nazwisk, sekcja o czerwonej strefie, limit długości, pełny RCTF.',
  $json${
    "difficulty": 3,
    "duration": "20 min",
    "situation": "Po ćwiczeniu 2A wiesz, że kierownik nie był złośliwy — po prostu nikt mu nie powiedział, czego nie wklejać. Napisz prompt, który przygotuje pierwszą wersję polityki AI dla Twojego działu.",
    "steps": [
      {"text": "Opisz w prompcie firmę bez danych z czerwonej strefy: branżę, wielkość, jakich narzędzi AI używacie i do czego. Poproś o politykę, którą zrozumie każdy pracownik."}
    ],
    "zones": {
      "green": [
        "Kontekst opisuje branżę, wielkość firmy, używane narzędzia AI i zastosowania.",
        "Brak nazwy firmy i nazwisk.",
        "Format zawiera sekcję o tym, czego nie wklejać (czerwona strefa).",
        "Jest limit długości.",
        "Obecne są wszystkie cztery elementy RCTF."
      ],
      "yellow": [
        "Polityka będzie ogólna, bo kontekst jest za słaby (brak narzędzi albo zastosowań).",
        "Brak struktury sekcji.",
        "Brakuje jednego elementu RCTF."
      ],
      "red": [
        "Prompt zawiera dane z czerwonej strefy (nazwa firmy, nazwiska, dane kontaktowe).",
        "Polecenie typu „napisz politykę AI” bez kontekstu.",
        "Brakuje co najmniej dwóch elementów RCTF."
      ]
    },
    "bonus": {
      "xp": 25,
      "rule": "Za jeden element:",
      "items": ["Prompt prosi o zaznaczenie, które punkty wymagają konsultacji z inspektorem ochrony danych (IOD) albo prawnikiem."]
    },
    "reference": {
      "situation": "Polityka AI dla działu sprzedaży.",
      "prompt": "Jesteś specjalistą ds. zgodności, który pisze prostym językiem dla pracowników bez wiedzy technicznej.\nKontekst: firma produkcyjna, 80 osób, dział sprzedaży (12 osób) używa ChatGPT w wersji darmowej do maili i ofert. Nie mamy żadnych zasad korzystania z AI. Od lutego 2025 AI Act wymaga dbania o kompetencje AI pracowników.\nZadanie: napisz politykę korzystania z AI dla działu sprzedaży.\nFormat: maksymalnie jedna strona, 4 sekcje: Do czego używamy AI, Czego nigdy nie wklejamy (czerwona strefa), Co zawsze sprawdzamy, Kogo pytać. Krótkie punkty, bez języka prawniczego. Na końcu 3 pytania do decyzji zarządu."
    },
    "evaluator": "Nazwy narzędzi AI (ChatGPT, Copilot, Gemini), branża, liczba pracowników i nazwy działów są w porządku. Nazwa firmy, nazwiska i dane kontaktowe nie. Limit długości może być w stronach, słowach albo punktach. Bonus tylko wtedy, gdy prompt wprost prosi o zaznaczenie punktów do konsultacji z IOD (inspektorem ochrony danych) albo prawnikiem. Sama sekcja „Kogo pytać” albo ogólna wzmianka o compliance nie wystarcza.",
    "footer": "Zapisz wynik w bibliotece — to gotowy materiał na Dzień 6."
  }$json$::jsonb
);
