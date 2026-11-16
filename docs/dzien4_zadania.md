# Dzień 4: „Poniedziałek w GIKO”, 8 zadań

## Nowy typ zadania: „Narzędzie + polecenie” (dwa kroki na jednym ekranie)

**Krok 1 · Wybierz narzędzie.** 6 przycisków w tej samej kolejności w każdym zadaniu: Copilot w Outlooku · Copilot Chat · Perplexity · NotebookLM · Nano Banana · ElevenLabs.

- Zła odpowiedź miga na czerwono przez sekundę i pokazuje podpowiedź z treści zadania. Uczestnik wybiera dalej.
- Trafiona odpowiedź podświetla się na zielono, pojawia się zdanie „Dlaczego” i odblokowuje się krok 2.
- Jeśli wybrane narzędzie jest darmowym kontem prywatnym (Perplexity, NotebookLM, Nano Banana, ElevenLabs), nad krokiem 2 pojawia się stały pasek: „Darmowe konto: tylko rzeczy publiczne. Żadnych danych klientów i firmy.”

**Krok 2 · Napisz polecenie.**

- Pole tekstowe jak w Dniu 2. Bez wzorca na ekranie i bez blokady podobieństwa.
- Ocena przez model jak w Dniu 2. Pod oceną jest podgląd: krótka symulacja, co wybrane narzędzie mniej więcej by odpowiedziało, według „Instrukcji podglądu” z zadania.
- Wyjątek: w zadaniu 4.2 krok 2 to wybór wielokrotny, opisany w treści zadania.

**XP:** 100 za zadanie.

- Krok 1: 30 / 20 / 10 (pierwsza, druga, kolejna próba).
- Krok 2: zielona 70, żółta 50, czerwona 0. Uczestnik może poprawiać polecenie i liczy się najlepsza ocena.

**Ekran „Moje polecenia”** pojawia się po ukończeniu wszystkich zadań i jest dostępny z menu modułu:

- lista ostatnich ocenionych poleceń uczestnika z zadań 4.1 i 4.3–4.8, każde z nazwą sytuacji i narzędzia,
- przycisk „Kopiuj” przy każdym poleceniu i przycisk „Kopiuj wszystkie”,
- nagłówek: „Twoja ściąga. Te polecenia możesz używać od jutra.”

Czcionka co najmniej 16 px. Sytuacja, przyciski i pole polecenia mieszczą się bez przewijania na laptopie 1366×768. Uczestnicy są starsi.

## Ocena polecenia: ŁAGODNA (jak w Dniu 2)

- ZIELONA: są co najmniej 2 z 3 elementów z „Co ma zawierać” i polecenie pasuje do sytuacji.
- ŻÓŁTA: jest 1 element. Podpowiedź mówi, czego dopisać.
- CZERWONA tylko gdy: mniej niż 5 słów, inny temat albo dane, które nie powinny trafić do darmowego narzędzia (nazwisko klienta, numer zamówienia w zadaniu z darmowym narzędziem).
- Oceniaj SENS, nie słowa. Literówki i synonimy się liczą. Przy wątpliwości wybieraj wyższą strefę.

## Zasada podglądu dla modelu (wspólna)

Podgląd ma najwyżej 120 słów. Nie wymyślaj faktów, liczb, nazw ani źródeł. Jeśli zadanie nie podaje faktu, użyj miejsca w nawiasie, np. [ŹRÓDŁO], [STRONA]. Przy Nano Banana i ElevenLabs opisz słowami, co powstanie. Po podglądzie dodaj jedno zdanie: co w poleceniu zadziałało dobrze albo czego zabrakło.

## Odblokowanie

Trener odblokowuje zadania w panelu admina w 3 grupach: 4.1–4.3 | 4.4–4.6 | 4.7–4.8. Kolejność w grupie jest wymuszona.

---

## 4.1 · Zdjęcie produktu do sklepu

**Sytuacja:** Zrobiłeś telefonem zdjęcie produktu na biurku. Krzywo, ciemno, w tle kabel. Zdjęcie ma trafić do sklepu internetowego.
**Poprawne narzędzie:** Nano Banana. Akceptuj też Copilot Chat.
**Dlaczego:** Nano Banana świetnie edytuje zdjęcia. Produkt jest publiczny, bo i tak trafi do sklepu.
**Podpowiedzi przy złym wyborze:**

- Perplexity / NotebookLM: „To narzędzia do szukania i czytania, a tu trzeba zmienić obraz.”
- ElevenLabs: „ElevenLabs robi głos, a tu potrzebujesz obrazu.”
- Copilot w Outlooku: „Outlook to poczta. Zdjęcie edytujesz w czacie z grafiką.”

**Co ma zawierać polecenie:** 1) co zmienić: tło, światło; 2) format albo przeznaczenie: kwadrat, do sklepu; 3) czego nie zmieniać: logo, napisy, kolor produktu.
**Uwaga dla oceny:** Brak punktu 3 → ŻÓŁTA z podpowiedzią „Dopisz: nie zmieniaj logo ani napisów na produkcie. AI lubi je poprawiać.”
**Instrukcja podglądu:** Opisz w 2–3 zdaniach, jak będzie wyglądało zdjęcie. Jeśli polecenie nie zabrania zmian w produkcie, dodaj: „Uwaga: logo na produkcie mogło się zmienić.”
**Wzorzec:** Zmień tło na białe, dodaj miękkie światło, format kwadratowy do sklepu internetowego. Nie zmieniaj logo, napisów ani koloru produktu.

## 4.2 · Film dla klienta z Czech

**Sytuacja:** Masz 2-minutowy film instruktażowy po polsku, w którym mówi Wasz kierownik. Klient z Czech prosi o wersję po czesku.
**Poprawne narzędzie:** ElevenLabs.
**Dlaczego:** ElevenLabs tłumaczy nagranie i zachowuje głos mówiącego.
**Podpowiedzi przy złym wyborze:** każdy inny wybór: „Tu chodzi o głos w filmie. Które narzędzie robiło dubbing reklamy?”

**Krok 2 (zamiast polecenia):** „Co sprawdzisz, zanim wyślesz film klientowi? Zaznacz 3.”

- ✅ Zgodę kierownika na użycie jego głosu
- ✅ Oznaczenie, że wersja czeska powstała z pomocą AI
- ✅ Tłumaczenie: ktoś znający czeski albo tłumaczenie zwrotne na polski
- ❌ Czy film ma ładną muzykę
- ❌ Czy plik ma mniej niż 100 MB
- ❌ Czy klient lubi filmy

**XP kroku 2:** wszystkie 3 trafione i 0 złych za pierwszym „Sprawdź” = 70, później 40. Przy błędzie podpowiedź: „Pamiętasz trzy zasady obrazu i głosu ze slajdu?”

## 4.3 · Plakat z nowymi godzinami

**Sytuacja:** Od 1 stycznia 2027 biuro pracuje w nowych godzinach: pon.–pt. 7:30–15:30. Potrzebujesz plakatu A4 na drzwi.
**Poprawne narzędzie:** Copilot Chat albo Nano Banana (oba zaliczone).
**Dlaczego:** Oba robią grafikę. Plakat jest publiczny, więc darmowe narzędzie też jest w porządku.
**Podpowiedzi przy złym wyborze:**

- Perplexity / NotebookLM: „Tu nic nie szukasz, tylko tworzysz obraz.”
- ElevenLabs: „ElevenLabs robi głos, nie grafikę.”
- Copilot w Outlooku: „Outlook to poczta. Grafikę zrobisz w czacie.”

**Co ma zawierać polecenie:** 1) dokładny tekst na plakacie (godziny); 2) styl albo kolory; 3) format A4 albo czego nie chcesz (np. bez zdjęć ludzi).
**Uwaga dla oceny:** Brak dokładnych godzin → ŻÓŁTA z podpowiedzią „Wpisz dokładny tekst, inaczej AI wymyśli godziny.”
**Instrukcja podglądu:** Opisz plakat w 2–3 zdaniach. Na końcu przypomnij: „Sprawdź polskie litery na plakacie. AI robi w nich literówki.”
**Wzorzec:** Plakat A4: „Nowe godziny pracy biura od 1 stycznia 2027: pon.–pt. 7:30–15:30”. Styl prosty, firmowy, granat i biel. Bez zdjęć ludzi.

## 4.4 · Szef pyta o płacę minimalną

**Sytuacja:** Szef liczy budżet na przyszły rok: „Ile od stycznia wynosi płaca minimalna?”
**Poprawne narzędzie:** Perplexity. Akceptuj też Copilot Chat.
**Dlaczego:** Temat jest publiczny, a liczy się aktualność. Perplexity pokazuje źródła z datą.
**Podpowiedzi przy złym wyborze:**

- NotebookLM: „NotebookLM czyta Twoje pliki, a tu potrzebujesz aktualnej informacji z internetu.”
- Nano Banana / ElevenLabs: „Tu potrzebujesz faktu, nie obrazu ani głosu.”
- Copilot w Outlooku: „Outlook nie szuka w internecie. Wybierz narzędzie do faktów.”

**Co ma zawierać polecenie:** 1) konkretny okres (od 1 stycznia 2027); 2) prośba o źródło albo link; 3) brutto albo data publikacji źródła.
**Uwaga dla oceny:** Brak prośby o źródło → ŻÓŁTA z podpowiedzią „Dopisz: podaj źródło i datę. Bez tego nie sprawdzisz, czy liczba jest aktualna.”
**Instrukcja podglądu:** Ten fakt jest sprawdzony i możesz go użyć: od 1 stycznia 2027 r. płaca minimalna wynosi 4950 zł brutto miesięcznie (rozporządzenie Rady Ministrów z 14 września 2026 r., Dz.U. 2026 poz. 1213). Źródła pokaż jako [ŹRÓDŁO 1], [ŹRÓDŁO 2] z dopiskiem „z datą”.
**Wzorzec:** Ile wynosi płaca minimalna w Polsce od 1 stycznia 2027 r., brutto miesięcznie? Podaj źródło i datę jego publikacji.

## 4.5 · Instrukcja producenta

**Sytuacja:** Klient pyta, jak często wymieniać filtr w urządzeniu. Odpowiedź jest gdzieś w 40-stronicowej instrukcji producenta, którą każdy może pobrać ze strony producenta.
**Poprawne narzędzie:** NotebookLM. Akceptuj też Copilot Chat.
**Dlaczego:** NotebookLM odpowiada tylko na podstawie wgranego dokumentu i pokazuje, skąd wziął odpowiedź. Instrukcja jest publiczna.
**Podpowiedzi przy złym wyborze:**

- Perplexity: „Perplexity szuka w całym internecie, a Ty masz już konkretny dokument.”
- Nano Banana / ElevenLabs: „Tu potrzebujesz odpowiedzi z dokumentu.”
- Copilot w Outlooku: „Outlook to poczta. Dokument wgrywasz do narzędzia, które czyta pliki.”

**Co ma zawierać polecenie:** 1) konkretne pytanie (jak często wymieniać filtr); 2) prośba o stronę albo cytat; 3) „jeśli tego nie ma w dokumencie, napisz to”.
**Uwaga dla oceny:** Brak punktu 2 i 3 → ŻÓŁTA z podpowiedzią „Poproś o numer strony: wtedy w 10 sekund sprawdzisz, czy AI nie zmyśla.”
**Instrukcja podglądu:** Odpowiedź w 1–2 zdaniach z miejscem [CO ILE WYMIANA] i [STRONA]. Nie podawaj konkretnej liczby.
**Wzorzec:** Jak często według tej instrukcji trzeba wymieniać filtr? Podaj numer strony. Jeśli tego nie ma w dokumencie, napisz to.

## 4.6 · Umowa z klientem (pułapka)

**Sytuacja:** Szef: „Na jutro chcę wiedzieć, co w umowie z firmą Weber jest o karach umownych.” Umowa ma 20 stron.
**Poprawne narzędzie:** Copilot Chat.
**Dlaczego:** Umowa z klientem to firmowy dokument. Tylko Copilot na koncie firmowym ma ochronę danych firmy (zielona tarcza).
**Podpowiedzi przy złym wyborze:**

- NotebookLM: „Kusi, bo czyta dokumenty. Ale to darmowe konto prywatne, a umowa jest firmowa. Tylko Copilot na koncie firmowym.”
- Perplexity: „Nie szukasz w internecie i nie wklejasz umowy do darmowego narzędzia.”
- Nano Banana / ElevenLabs: „Tu potrzebujesz odpowiedzi z dokumentu.”
- Copilot w Outlooku: „Blisko, ale umowę wgrywasz do Copilot Chat i tam zadajesz pytania.”

**Co ma zawierać polecenie:** 1) czego szukać (kary umowne: za co, ile); 2) forma (punkty, krótko); 3) prośba o numer paragrafu.
**Uwaga dla oceny:** Tu nazwa klienta jest w porządku (Copilot na koncie firmowym), nie dawaj za nią czerwonej.
**Instrukcja podglądu:** 3 punkty z miejscami [ZA CO], [KWOTA], [§]. Nie wymyślaj treści umowy.
**Wzorzec:** Wypisz w punktach wszystkie kary umowne z tej umowy: za co, w jakiej wysokości i w którym paragrafie.

## 4.7 · Klient z Lipska

**Sytuacja:** Przychodzi mail po niemiecku:

„Sehr geehrte Damen und Herren, am 28. Oktober haben wir die Bestellung 2026/1187 aufgegeben. Laut Bestätigung sollte die Lieferung in KW 46 kommen. Die Woche ist fast vorbei und wir haben keine Information. Außerdem brauchen unsere Mitarbeiter eine Anleitung auf Deutsch. Bitte nennen Sie uns den neuen Liefertermin. Mit freundlichen Grüßen, Markus Weber, Weber GmbH, Leipzig“

**Fakty do odpowiedzi:** nowy termin dostawy to tydzień 48 (23–27 listopada 2026), instrukcję po niemiecku wyślemy w piątek.
**Poprawne narzędzie:** Copilot w Outlooku. Akceptuj też Copilot Chat.
**Dlaczego:** Mail jest w Outlooku, więc Copilot przy mailu od razu go widzi. Dane klienta zostają na koncie firmowym.
**Podpowiedzi przy złym wyborze:**

- Perplexity / NotebookLM / Nano Banana / ElevenLabs: „W mailu jest nazwisko klienta i numer zamówienia. Tylko Copilot na koncie firmowym.”

**Co ma zawierać polecenie:** 1) streszczenie po polsku albo prośba o odpowiedź po niemiecku; 2) fakty: tydzień 48 i instrukcja w piątek; 3) ton (uprzejmie, krótko) albo prośba o tłumaczenie zwrotne na polski do sprawdzenia.
**Uwaga dla oceny:** Brak faktów → ŻÓŁTA z podpowiedzią „Podaj nowy termin, inaczej AI go wymyśli.”
**Instrukcja podglądu:** Napisz krótką odpowiedź po niemiecku (3–4 zdania) z faktami podanymi w poleceniu, a pod nią jedno zdanie po polsku: co jest w odpowiedzi. Użyj tylko faktów z sytuacji.
**Wzorzec:** Streść ten mail po polsku w 3 punktach. Potem napisz uprzejmą odpowiedź po niemiecku: nowy termin dostawy to tydzień 48 (23–27 listopada), instrukcję po niemiecku wyślemy w piątek. Na końcu przetłumacz odpowiedź na polski, żebym mógł ją sprawdzić.

## 4.8 · Notatka z zebrania

**Sytuacja:** Masz zdjęcie odręcznej notatki z zebrania. Jedno imię jest nieczytelne. Treść notatki:

„Zebranie 16.11: Ania – oferta dla Webera do śr. · Marek – zamówić kartony do pt. · Tomek – tel. do p. K. jutro · M??? – raport sprzedaży do 25.11“

**Poprawne narzędzie:** Copilot Chat.
**Dlaczego:** Copilot Chat czyta zdjęcia. Notatka z zebrania to sprawy firmy, więc konto firmowe.
**Podpowiedzi przy złym wyborze:**

- NotebookLM / Perplexity / Nano Banana / ElevenLabs: „Notatka z zebrania to firmowe sprawy. Tylko Copilot na koncie firmowym.”
- Copilot w Outlooku: „Zdjęcie wgrywasz do Copilot Chat. W Outlooku wyślesz potem gotową tabelę.”

**Co ma zawierać polecenie:** 1) tabela z kolumnami: zadanie, kto, termin; 2) „jeśli czegoś nie odczytasz, wpisz [NIECZYTELNE]”; 3) dodatkowo: mail do zespołu albo sortowanie po terminie.
**Uwaga dla oceny:** Brak punktu 2 → ŻÓŁTA z podpowiedzią „Dopisz: jeśli czegoś nie odczytasz, wpisz [NIECZYTELNE]. Inaczej AI zgadnie imię.”
**Instrukcja podglądu:** Pokaż tabelę z 4 wierszami z treści notatki. Jeśli polecenie zawiera [NIECZYTELNE], w ostatnim wierszu wpisz [NIECZYTELNE]. Jeśli nie, wpisz „Mariusz” i dodaj: „Uwaga: AI zgadło imię, którego nie dało się odczytać.”
**Wzorzec:** Zrób z tego zdjęcia tabelę z kolumnami: zadanie, kto, termin. Jeśli czegoś nie możesz odczytać, wpisz [NIECZYTELNE] zamiast zgadywać.

## Ramka „🎯 Twoje zadanie” (pod sytuacją, przed Krokiem 1)

Dwie linie: „Cel:” i „Co zrobić:”. Czcionka jak sytuacja, wyraźna ramka. W bazie: `levels.goal_description` (Cel) i `levels.task_description` (Co zrobić).

- **4.1** Cel: zdjęcie ma wyglądać profesjonalnie w sklepie. Co zrobić: wybierz narzędzie, które poprawi zdjęcie, i napisz mu, co ma zmienić, a czego nie ruszać.
- **4.2** Cel: klient z Czech ma dostać film w swoim języku. Co zrobić: wybierz narzędzie, które zrobi czeską wersję, a potem zaznacz, co sprawdzisz przed wysłaniem.
- **4.3** Cel: na drzwiach ma zawisnąć czytelny plakat z nowymi godzinami. Co zrobić: wybierz narzędzie do grafiki i napisz, co ma być na plakacie i jak ma wyglądać.
- **4.4** Cel: szef potrzebuje pewnej, aktualnej kwoty do budżetu. Co zrobić: wybierz narzędzie, które znajdzie aktualną informację, i zapytaj tak, żeby podało źródło.
- **4.5** Cel: odpowiedzieć klientowi bez czytania 40 stron. Co zrobić: wybierz narzędzie, które odpowie na podstawie instrukcji, i zapytaj tak, żeby pokazało, gdzie to jest.
- **4.6** Cel: szef ma jutro dostać listę kar z umowy. Co zrobić: zastanów się, gdzie wolno wgrać firmową umowę, i napisz, co AI ma z niej wypisać.
- **4.7** Cel: zrozumieć mail i odpisać klientowi po niemiecku, nawet jeśli nie znasz niemieckiego. Co zrobić: wybierz narzędzie i poproś o streszczenie po polsku oraz odpowiedź z podanymi faktami.
- **4.8** Cel: zamienić odręczną notatkę w tabelę zadań dla zespołu. Co zrobić: wybierz narzędzie, które czyta zdjęcia, i napisz, jak ma wyglądać tabela i co zrobić z nieczytelnym imieniem.
