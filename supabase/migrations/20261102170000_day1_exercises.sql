-- =====================================================
-- DZIEŃ 1 — ćwiczenia 1A, 1B, 2A, 2B w module Recepcja
-- Strefy oceny, bonusy, bloki odblokowywane przez trenera,
-- biblioteka promptów.
-- =====================================================

ALTER TABLE modules ADD COLUMN IF NOT EXISTS lives_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS active_block integer NOT NULL DEFAULT 1;

ALTER TABLE levels ADD COLUMN IF NOT EXISTS code text;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS block integer NOT NULL DEFAULT 1;
ALTER TABLE levels ADD COLUMN IF NOT EXISTS config jsonb;

ALTER TABLE battles ADD COLUMN IF NOT EXISTS zone text;
ALTER TABLE battles ADD COLUMN IF NOT EXISTS bonus boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS prompt_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id integer REFERENCES levels(id) ON DELETE SET NULL,
  title text,
  prompt text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS prompt_library_player_id_idx ON prompt_library(player_id);
ALTER TABLE prompt_library ENABLE ROW LEVEL SECURITY;

-- Moduł 1 dostaje nową treść
DELETE FROM battles WHERE level_id IN (SELECT id FROM levels WHERE module_id = 1);
DELETE FROM levels WHERE module_id = 1;

UPDATE modules
SET title = 'Dobry i bezpieczny prompt', total_levels = 4, lives_enabled = false, active_block = 1, unlocked = true
WHERE day_number = 1;

INSERT INTO levels (module_id, level_number, sort_order, block, code, title, type, xp_reward, boss_dialogue, task_description, goal_description, config) VALUES
(1, 1, 1, 1, '1A', 'Twój pierwszy prompt RCTF', 'solo', 100,
 'Dzień dobry! Zanim zaczniemy na serio: weź zadanie, które naprawdę czeka na Ciebie w tym tygodniu. Napisz prompt, po którym AI zrobi je porządnie za pierwszym razem.',
 'Napisz jeden prompt do swojego prawdziwego zadania, który zawiera wszystkie cztery elementy RCTF i przechodzi filtr 3C.',
 'Prompt ma rolę, kontekst, zadanie i format, jest jasny, konkretny i zwięzły.',
 $j${
  "difficulty": 2,
  "duration": "30 min",
  "situation": "Weź prawdziwe zadanie, które czeka na Ciebie w tym tygodniu. Nie wymyślaj scenariusza ćwiczeniowego. Możesz wziąć zadanie, które podałeś rano przy przedstawianiu się.",
  "examples": [
    "Mail do klienta z odpowiedzią na trudne pytanie",
    "Krótki raport tygodniowy dla szefa",
    "Podsumowanie spotkania z Twoich notatek",
    "Brief dla podwykonawcy albo zespołu",
    "Post na LinkedIn albo tekst na firmowy blog",
    "Ogłoszenie wewnętrzne (HR, IT, administracja)"
  ],
  "steps": [
    { "text": "Napisz jeden prompt, który zawiera wszystkie cztery elementy RCTF i przechodzi filtr 3C." }
  ],
  "hints": [
    { "label": "R · rola", "text": "kim ma być AI, najlepiej z doświadczeniem i stylem" },
    { "label": "C · kontekst", "text": "kto jest odbiorcą, jaki jest cel, co już wiadomo, jakie są ograniczenia" },
    { "label": "T · zadanie", "text": "czasownik i konkret, np. „Napisz raport statusowy”" },
    { "label": "F · format", "text": "jak ma wyglądać wynik: struktura, długość, ton" },
    { "label": "Filtr 3C", "text": "jasny (bez „coś o…”), konkretny (liczby, daty, nazwy), zwięzły (bez ozdobników i „proszę uprzejmie”)" }
  ],
  "zones": {
    "green": [
      "Rola jest konkretna (np. doświadczenie, branża, styl), a nie „jesteś asystentem”.",
      "Kontekst zawiera co najmniej odbiorcę, cel i tło sytuacji.",
      "Zadanie zaczyna się od czasownika i mówi, co dokładnie ma powstać.",
      "Format określa co najmniej strukturę albo długość wyniku.",
      "Prompt jest jasny: bez „coś o…”, „mniej więcej”, „pomóż mi z…”.",
      "Prompt zawiera co najmniej 2–3 konkretne dane: liczby, daty, nazwy rzeczy (nie ludzi).",
      "Prompt jest zwięzły: bez nadmiarowych grzeczności i ozdobników."
    ],
    "yellow": [
      "Brakuje jednego elementu RCTF (najczęściej formatu).",
      "Rola jest zbyt ogólna („jesteś ekspertem”, „jesteś AI”).",
      "Kontekst ma mniej niż dwa zdania.",
      "Format jest nieprecyzyjny („w formie tekstu”, „krótko”)."
    ],
    "red": [
      "Brakuje co najmniej dwóch elementów RCTF.",
      "Ogólne polecenie typu „pomóż mi napisać maila”.",
      "Brak jakiegokolwiek konkretu: zero liczb, dat i nazw.",
      "Prompt to kilka słów bez zdań (orientacyjnie poniżej 15 słów).",
      "Prompt zawiera dane z czerwonej strefy: nazwiska, dane kontaktowe, PESEL, nazwy klientów."
    ]
  },
  "bonus": {
    "xp": 25,
    "rule": "Za co najmniej dwa z czterech elementów:",
    "items": [
      "Limit długości („maksymalnie 150 słów”, „3 akapity”).",
      "Czego AI ma unikać („nie używaj słowa X”, „nie zaczynaj od Y”).",
      "Ton albo styl („rzeczowy, ale ciepły”).",
      "Struktura wyniku z nazwanymi sekcjami."
    ]
  },
  "reference": {
    "situation": "Kierownik projektu pisze cotygodniowy raport dla zarządu.",
    "prompt": "Jesteś doświadczonym kierownikiem projektu, który pisze krótko i konkretnie dla zarządu.\nKontekst: prowadzę wdrożenie nowego systemu magazynowego w firmie dystrybucyjnej. W tym tygodniu zakończyliśmy testy w 2 z 3 magazynów. W trzecim testy przesunęły się o 5 dni roboczych, bo dostawca nie dostarczył skanerów. Budżet: wydane 62% przy 70% postępu prac. Raport czyta zarząd, który ma 2 minuty i chce wiedzieć, czy termin 15 stycznia jest zagrożony.\nZadanie: napisz cotygodniowy raport statusowy.\nFormat: 3 sekcje (Postęp, Ryzyka, Decyzje potrzebne od zarządu), w każdej maksymalnie 3 punkty, całość do 150 słów. Ton rzeczowy, bez żargonu IT. Nie używaj słów „kluczowy” ani „strategiczny”."
  },
  "evaluator": "Uczestnik pisze prompt do własnego, prawdziwego zadania z pracy, więc nie znasz faktów. Oceniaj strukturę RCTF, filtr 3C i konkret. Do zielonej strefy wystarczą 2 konkretne dane. Nazwy rzeczy, produktów i systemów są w porządku, nazwiska i nazwy klientów nie.",
  "footer": "Zapisz prompt w bibliotece i przepisz go na stronę 1 „Mojego Playbooka AI”. Jutro wrócimy do niego i ulepszymy go rozmową z modelem."
 }$j$::jsonb),

(1, 2, 2, 1, '1B', 'Diagnoza trzech słabych promptów', 'fix_prompt', 100,
 'Trzy osoby z firmy przyszły do mnie rozczarowane, że AI daje beznadziejne wyniki. Zobacz ich prompty i to, co wiedzieli, ale nie napisali. Wybierz jeden i napraw go porządnie.',
 'Wybierz jeden z trzech słabych promptów i przepisz go na pełny RCTF z 3C, korzystając wyłącznie z faktów z listy „Co autor wiedział”.',
 'Pełny RCTF, co najmniej 3 fakty z listy, zero wymyślonych faktów, struktura i długość w formacie.',
 $j${
  "difficulty": 2,
  "duration": "30 min",
  "situation": "Trzy osoby z firmy napisały prompty i są rozczarowane wynikami. Przy każdym prompcie jest to, co ta osoba wiedziała, ale nie napisała.",
  "steps": [
    { "text": "Krok 1 · diagnoza (10 min, w parach): przy każdym prompcie zaznacz, których elementów RCTF brakuje i które zasady 3C są złamane.", "offline": true },
    { "text": "Krok 2 · poprawka (20 min, oceniana): wybierz jeden prompt i przepisz go na pełny RCTF z 3C. Wykorzystaj fakty z listy „Co autor wiedział”. Nie dopisuj faktów, których tam nie ma." }
  ],
  "materials": [
    {
      "title": "Prompt 1 · Marketing",
      "prompt": "Napisz coś o naszej nowej promocji na social media.",
      "facts": [
        "Firma: sieć 4 kawiarni w Krakowie.",
        "Promocja: drugi napój za pół ceny, 10–23 listopada, w dni robocze od 8:00 do 11:00.",
        "Cel: więcej klientów rano. Między 8:00 a 11:00 sala jest w połowie pusta.",
        "Odbiorcy: studenci i pracownicy pobliskich biur.",
        "Kanał: Instagram, post z krótkim opisem."
      ]
    },
    {
      "title": "Prompt 2 · Sprzedaż",
      "prompt": "Jesteś ekspertem. Przeanalizuj te dane i powiedz, co o nich myślisz. Proszę uprzejmie o szczegółową odpowiedź.",
      "facts": [
        "Dane: sprzedaż w III kwartale w trzech regionach. Północ 1,2 mln zł (−8% rok do roku), Południe 2,1 mln zł (+12%), Zachód 0,9 mln zł (+3%).",
        "Od lipca obowiązuje nowy cennik z wyższymi cenami w segmencie premium.",
        "Za tydzień autor prezentuje wyniki zarządowi i potrzebuje 3 wniosków i 2 rekomendacji.",
        "Zarząd pyta głównie o to, dlaczego Północ spada."
      ]
    },
    {
      "title": "Prompt 3 · HR",
      "prompt": "Pomóż mi z mailem do zespołu o zmianach.",
      "facts": [
        "Od 1 grudnia urlopy zgłasza się w portalu HR zamiast na papierowym formularzu. Formularz wycofujemy 30 listopada.",
        "Zespół: 15 osób w magazynie. Część pracuje w firmie od lat i niechętnie przyjmuje nowe systemy.",
        "Szkolenie online: 25 listopada o 10:00, 30 minut.",
        "Pytania obsługuje dział kadr."
      ]
    }
  ],
  "hints": [
    { "label": "R · rola", "text": "konkretna, nie „jesteś ekspertem”" },
    { "label": "C · kontekst", "text": "fakty z listy „Co autor wiedział” — co najmniej 3" },
    { "label": "T · zadanie", "text": "czasownik i konkret" },
    { "label": "F · format", "text": "struktura i długość" }
  ],
  "zones": {
    "green": [
      "Wszystkie cztery elementy RCTF są obecne.",
      "Prompt wykorzystuje co najmniej 3 fakty z listy „Co autor wiedział”.",
      "Prompt nie dodaje faktów spoza listy (np. wymyślonych liczb).",
      "Format określa strukturę i długość.",
      "Usunięte zostały słabości oryginału: „coś o…”, „co o nich myślisz”, „proszę uprzejmie”, ogólna rola."
    ],
    "yellow": [
      "Brakuje jednego elementu RCTF.",
      "Wykorzystane są tylko 1–2 fakty.",
      "Rola jest nadal ogólna („jesteś ekspertem”)."
    ],
    "red": [
      "Brakuje co najmniej dwóch elementów RCTF.",
      "Poprawka jest kosmetyczna: oryginał z dopisanym jednym słowem.",
      "Prompt zawiera wymyślone dane albo dane z czerwonej strefy."
    ]
  },
  "bonus": {
    "xp": 25,
    "rule": "Za jeden z dwóch wariantów:",
    "items": [
      "Wybrałeś prompt 2 (dane sprzedażowe) i poprosiłeś, żeby AI oddzieliło fakty z danych od własnych przypuszczeń.",
      "Albo: dodałeś, czego AI ma unikać, i limit długości."
    ]
  },
  "reference": {
    "situation": "Poprawiony prompt 3 (HR).",
    "prompt": "Jesteś specjalistą od komunikacji wewnętrznej w dziale HR. Piszesz prosto i życzliwie.\nKontekst: od 1 grudnia urlopy w naszym magazynie zgłaszamy w portalu HR zamiast na papierowym formularzu, który wycofujemy 30 listopada. Zespół to 15 osób; część pracuje w firmie od lat i niechętnie przyjmuje nowe systemy. 25 listopada o 10:00 jest 30-minutowe szkolenie online, a pytania obsługuje dział kadr.\nZadanie: napisz maila do zespołu, który wyjaśni zmianę, poda daty i zachęci do udziału w szkoleniu.\nFormat: temat i maksymalnie 120 słów, daty pogrubione, na końcu jedno zdanie, gdzie szukać pomocy. Unikaj żargonu i słowa „digitalizacja”."
  },
  "evaluator": "Uczestnik wybiera JEDEN z trzech słabych promptów (lista w materiałach). Najpierw rozpoznaj, który poprawia, i sprawdzaj fakty względem listy tego promptu. Każda liczba, data lub nazwa spoza listy to wymyślony fakt — strefa czerwona. Bonus za prompt 2 tylko wtedy, gdy prompt każe AI oddzielić fakty z danych od przypuszczeń.",
  "footer": "Diagnozę z kroku 1 omówimy na forum. Zapisz najlepszą poprawkę w bibliotece."
 }$j$::jsonb),

(1, 3, 3, 2, '2A', 'Audyt promptu HR', 'fix_prompt', 150,
 'Mamy problem. Kierownik operacji wpisał do darmowego czatu AI coś, co może nas sporo kosztować. Zrób audyt tego prompta i napisz wersję, która pomoże mu w tym samym zadaniu — bez naruszeń.',
 'Napisz prompt, który pomaga kierownikowi w analizie przed rozmową z zarządem, ale bez naruszeń RODO, prawa pracy i zasad ACT.',
 'Dane zanonimizowane, AI jako asystent a nie decydent, zakaz wskazywania kogo zwolnić, bez kryterium wieku, alternatywy dla zwolnień, RODO art. 22, format z limitem.',
 $j${
  "difficulty": 3,
  "duration": "30 min",
  "situation": "Kierownik działu operacji w firmie logistycznej (30 osób w dziale) dostał od zarządu polecenie: po słabym kwartale przygotować rekomendację trzech osób do zwolnienia. Nie miał czasu na analizę, więc wpisał poniższy prompt do darmowej, prywatnej wersji czatu AI.",
  "steps": [
    { "text": "Krok 1 · audyt (10 min, w parach): znajdź wszystkie problemy w tym prompcie. Patrz z czterech stron: RODO, lista ACT (Avoid, Check, Transparency), prawo pracy i etyka, jakość promptu (RCTF).", "offline": true },
    { "text": "Krok 2 · bezpieczna wersja (20 min, oceniana): napisz prompt, który pomaga kierownikowi w tym samym zadaniu biznesowym, czyli w analizie przed rozmową z zarządem, ale bez naruszeń." }
  ],
  "materials": [
    {
      "title": "Prompt do audytu · dane fikcyjne",
      "danger": true,
      "prompt": "Jesteś moim asystentem HR. Pomóż mi wytypować 3 osoby do zwolnienia z naszego działu operacji.\nOto lista 30 pracowników (imię, nazwisko, PESEL, data urodzenia, pensja brutto, staż w latach, ocena roczna 1–5):\n1. Jan Kowalski, 7810151xxxx, 15.10.1978, 9 500 zł, 12 lat, 4/5\n2. Anna Nowak, 8505235xxxx, 23.05.1985, 7 200 zł, 7 lat, 3/5\n3. Piotr Wiśniewski, 6403129xxxx, 12.03.1964, 11 000 zł, 25 lat, 4/5\n(…kolejne 27 osób w tym samym formacie)\nWytypuj 3 osoby do zwolnienia, biorąc pod uwagę: wiek (preferuj osoby starsze, bliżej emerytury, taniej w odprawach), staż (krótszy staż = mniejszy szacunek wobec firmy), pensję (wyższa pensja = większa oszczędność) i ocenę roczną.\nPodaj decyzję jasno: kogo zwolnić i dlaczego. Uzasadnienie 2–3 zdania na osobę."
    }
  ],
  "hints": [
    { "label": "Anonimizacja", "text": "identyfikatory P001–P030 zamiast imion, nazwisk, PESEL-i i dat urodzenia" },
    { "label": "Asystent, nie decydent", "text": "AI analizuje, decyzję podejmuje człowiek" },
    { "label": "Kryteria", "text": "ocena i KPI tak, wiek nie, staż nie jako „kara”" },
    { "label": "Alternatywy", "text": "plan poprawy, zmiana zakresu obowiązków, przesunięcie" }
  ],
  "chips": [
    { "label": "[ZANONIMIZOWANA TABELA]", "text": "[zanonimizowana tabela, 30 wierszy]" }
  ],
  "zones": {
    "green": [
      "Dane są zanonimizowane: brak imion, nazwisk, PESEL-i i dat urodzenia, są identyfikatory.",
      "AI ma rolę asystenta analitycznego, a nie decydenta.",
      "Prompt wprost zakazuje wskazywania, kogo zwolnić. Decyzja należy do człowieka.",
      "Wiek nie jest kryterium. Staż nie jest używany jako „kara”.",
      "Prompt prosi o alternatywy dla zwolnienia.",
      "Prompt powołuje się na RODO art. 22 albo mówi wprost, że decyzja o człowieku nie może być automatyczna.",
      "Format jest konkretny i ma limit długości."
    ],
    "yellow": [
      "Anonimizacja jest niepełna (np. zostały daty urodzenia „dla porządku”).",
      "Jest rola asystenta, ale AI nadal ma „zarekomendować” osoby do zwolnienia.",
      "Wiek zniknął, ale staż nadal obniża ocenę.",
      "Brak formatu albo limitu długości."
    ],
    "red": [
      "W prompcie zostały dane osobowe.",
      "AI nadal ma zdecydować, kogo zwolnić.",
      "Wiek nadal jest kryterium.",
      "Brak jakiejkolwiek wzmianki o RODO, ochronie danych albo decyzji człowieka."
    ]
  },
  "bonus": {
    "xp": 50,
    "rule": "Za co najmniej dwa z trzech elementów:",
    "items": [
      "Wskazanie, że prywatna, darmowa wersja czatu się tu nie nadaje i trzeba użyć wersji firmowej (Gemini w Workspace, Microsoft 365 Copilot, ChatGPT Business lub Enterprise).",
      "Zalecenie konsultacji z inspektorem ochrony danych (IOD) przed dalszym przetwarzaniem.",
      "Zalecenie udokumentowania procesu (dlaczego i jak użyto AI) na potrzeby rejestru czynności przetwarzania."
    ]
  },
  "reference": {
    "situation": "Bezpieczna wersja po audycie.",
    "prompt": "Jesteś doświadczonym analitykiem HR. Pełnisz rolę asystenta analitycznego, nie decydenta.\nKontekst: po słabym kwartale zarząd prosi mnie o analizę efektywności działu operacji (30 osób) przed rozmową o optymalizacji zespołu. Mam zanonimizowane dane: identyfikator (P001–P030), kategoria stanowiska (junior, mid, senior), ocena roczna 1–5, realizacja KPI w ostatnim kwartale (%), relacja pensji do mediany w kategorii (%).\n[zanonimizowana tabela, 30 wierszy]\nZadanie: 1) wskaż profile, w których ocena i realizacja KPI są najniższe, i pokaż dane, na których to opierasz; 2) dla każdego zaproponuj alternatywy dla zwolnienia (plan poprawy, zmiana zakresu obowiązków, przesunięcie do innego zespołu); 3) wypisz 5–7 pytań, które powinienem sprawdzić przed rozmową z zarządem.\nOgraniczenia: nie wskazuj, kogo zwolnić, bo decyzję podejmuje człowiek (RODO, art. 22). Nie bierz pod uwagę wieku ani stażu. Zaznacz, że przed decyzją potrzebna jest konsultacja z prawnikiem prawa pracy.\nFormat: tabela profili i lista pytań, maksymalnie 350 słów."
  },
  "evaluator": "Prompt może zawierać placeholder w rodzaju „[zanonimizowana tabela, 30 wierszy]” zamiast danych — to jest poprawne i nie obniża oceny. Najczęstsze przeoczenia uczestników: kryterium wieku i to, że AI nadal podejmuje decyzję. Jeśli prompt każe AI „zarekomendować” lub „wskazać” osoby do zwolnienia, to najwyżej strefa żółta. Wskazówki formułuj pytaniem, np. „Kto w tym prompcie podejmuje decyzję?”.",
  "footer": "Ten kierownik nie był złośliwy. Chciał szybko wykonać polecenie zarządu, tak jak inżynierowie Samsunga. Sprawdź po szkoleniu: czy w Twojej firmie jest polityka AI? Czy zespół wie, czego nie wklejać?"
 }$j$::jsonb),

(1, 4, 4, 2, '2B', 'Bezpieczna wersja Twojego zadania', 'solo', 150,
 'Wróć do swojego zadania z ćwiczenia 1A. Gdyby wynik miał być gotowy do wysłania, jakie prawdziwe dane musiałbyś dopisać? Pokaż mi, jak zrobić to samo bez danych z czerwonej strefy.',
 'Napisz prompt, który daje ten sam efekt biznesowy co Twoje zadanie z 1A, ale bez danych z czerwonej strefy.',
 'Brak danych z czerwonej strefy, placeholdery lub dane względne, AI wie, co zrobić z placeholderami, kontekst nadal wystarcza, pełny RCTF.',
 $j${
  "difficulty": 3,
  "duration": "30 min",
  "related_code": "1A",
  "situation": "Wróć do zadania z ćwiczenia 1A. Pomyśl, jakie prawdziwe dane musiałbyś dodać, żeby wynik był gotowy do wysłania: nazwisko klienta, numer zamówienia, kwotę, dane pracownika. Właśnie te dane są w czerwonej strefie.",
  "examples_title": "Jeśli Twoje zadanie z 1A nie dotyka takich danych, wybierz zadanie zastępcze:",
  "examples": [
    "Odpowiedź na reklamację konkretnego klienta: w prawdziwej wersji jest jego nazwa, numer zamówienia i osoba kontaktowa.",
    "Podsumowanie rozmowy oceniającej pracownika: w prawdziwej wersji jest imię, nazwisko i jego wyniki.",
    "Analiza wyników handlowców: w prawdziwej wersji są imiona, wyniki i prowizje."
  ],
  "steps": [
    { "text": "Napisz prompt, który daje ten sam efekt biznesowy bez danych z czerwonej strefy." }
  ],
  "hints": [
    { "label": "Placeholdery", "text": "[KLIENT], [NR ZAMÓWIENIA], [KWOTA] zamiast prawdziwych danych. Każ AI zostawić je bez zmian, uzupełnisz je ręcznie." },
    { "label": "Minimalizacja", "text": "tylko dane niezbędne do zadania; liczby zaokrąglone albo względne („o 15% poniżej planu”)" },
    { "label": "Człowiek decyduje", "text": "przy ocenie ludzi AI przygotowuje materiał, decyzję podejmujesz Ty" }
  ],
  "chips": [
    { "label": "[KLIENT]", "text": "[KLIENT]" },
    { "label": "[NR ZAMÓWIENIA]", "text": "[NR ZAMÓWIENIA]" },
    { "label": "[KWOTA]", "text": "[KWOTA]" },
    { "label": "[OSOBA KONTAKTOWA]", "text": "[OSOBA KONTAKTOWA]" },
    { "label": "↳ zostaw placeholdery", "text": "Zostaw w tekście placeholdery w nawiasach kwadratowych bez zmian. Uzupełnię je ręcznie przed wysłaniem." }
  ],
  "zones": {
    "green": [
      "Brak danych z czerwonej strefy: nazwisk, danych kontaktowych, PESEL-i, nazw klientów, dokładnych kwot z umów.",
      "Prawdziwe dane zastąpione placeholderami albo danymi względnymi.",
      "Prompt każe AI zostawić placeholdery bez zmian albo mówi, co uzupełnisz ręcznie.",
      "Zadanie biznesowe nadal da się wykonać: kontekst ma wszystkie potrzebne fakty.",
      "Wszystkie cztery elementy RCTF są obecne."
    ],
    "yellow": [
      "Anonimizacja jest, ale zabrała z kontekstu fakty potrzebne do zadania (wynik będzie ogólnikowy).",
      "Placeholdery są, ale prompt nie mówi AI, co z nimi zrobić.",
      "Brakuje jednego elementu RCTF."
    ],
    "red": [
      "W prompcie są dane z czerwonej strefy.",
      "Prompt przy ocenie ludzi prosi AI o decyzję.",
      "Brakuje co najmniej dwóch elementów RCTF."
    ]
  },
  "bonus": {
    "xp": 25,
    "rule": "Za jeden z dwóch elementów:",
    "items": [
      "Zaznaczenie, że pełne dane można wkleić tylko w firmowej wersji AI i tylko wtedy, gdy pozwala na to polityka firmy.",
      "Prośba, żeby AI na końcu wypisało, jakie dane trzeba uzupełnić przed wysłaniem."
    ]
  },
  "reference": {
    "situation": "Zadanie zastępcze: reklamacja.",
    "prompt": "Jesteś doświadczonym specjalistą obsługi klienta B2B.\nKontekst: klient [KLIENT] złożył reklamację zamówienia [NR ZAMÓWIENIA]. 40 z 500 sztuk dotarło uszkodzonych, a termin jego własnej dostawy dla odbiorcy mija za 5 dni. Możemy wysłać zamienniki w 3 dni robocze i pokryć koszt transportu.\nZadanie: napisz odpowiedź na reklamację z przeprosinami, konkretnym planem naprawy i terminem.\nFormat: temat i 3 akapity, maksymalnie 150 słów, ton rzeczowy i ciepły. Zostaw w tekście placeholdery [KLIENT], [NR ZAMÓWIENIA] i [OSOBA KONTAKTOWA] bez zmian. Uzupełnię je ręcznie przed wysłaniem."
  },
  "evaluator": "Placeholdery w nawiasach kwadratowych są pożądane. Liczby względne, zaokrąglone i operacyjne (np. 40 z 500 sztuk, 3 dni robocze) są w porządku; dokładne kwoty z umów, nazwiska i nazwy klientów nie.",
  "footer": "Zapisz prompty z 1A i 2B w bibliotece. Na stronie 1 Playbooka wpisz swoją czerwoną strefę: czego w Twojej firmie nie wklejasz."
 }$j$::jsonb);
