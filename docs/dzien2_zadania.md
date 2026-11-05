# Dzień 2 · zadania w aplikacji (wersja 5)

Trzy moduły po cztery zadania. Każde: 100 XP, bonus 25 XP. Czwarte zadanie w module jest trochę trudniejsze. Dzień 2 bez utraty życia.

## Moduł 1 · Rozmowa z AI (po bloku „Poprawiać w rozmowie czy napisać nowy prompt”)

### 1.1 · Dział handlowy · Konkretna poprawka · 10 min

**Sytuacja:** Poprosiłeś AI o maila do klienta. Dostawa 40 regałów będzie później: 18 listopada zamiast 12 listopada. AI napisało za długi mail. Nie ma w nim nowej daty, jest dużo przeprosin, a do klienta pisze na „Ty”.

**Wynik AI (początek):** „Hej! Bardzo, bardzo przepraszamy za całą sytuację. Wiemy, jak ważne są dla Ciebie terminy, i naprawdę jest nam przykro, że tym razem nie wszystko poszło zgodnie z planem. Nasz zespół robi wszystko, co w jego mocy…” (i tak dalej, razem około 250 słów)

**Co masz zrobić:**
Napisz AI jedną wiadomość: co ma poprawić. Tak, jakbyś mu odpisywał w czacie.

**Nie zapomnij o:**
- ile słów ma mieć mail (np. „maksymalnie 100 słów”)
- nowa data: 18 listopada
- pisz do klienta na „Pan/Pani”
- co zrobić z przeprosinami (np. „przeproś jednym zdaniem”)

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej z tych rzeczy.
**Czerwona:** Ogólna poprawka („popraw to”, „lepiej”, „jeszcze raz”) albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Każesz podać nową datę w pierwszym zdaniu.
**Uwaga dla oceniającego:** To jest poprawka w rozmowie, nie pełny prompt. Nie wymagaj RCTF.

**Wzorzec:** Skróć do 100 słów. W pierwszym zdaniu podaj nową datę dostawy: 18 listopada. Pisz do klienta na „Pan/Pani”. Przeproś tylko jednym krótkim zdaniem na końcu.

**Przykład z innej sytuacji** (AI napisało ogłoszenie o remoncie parkingu, ale za długie i bez dat.): Skróć do 60 słów. Dodaj daty: parking zamknięty od 10 do 12 marca. Usuń przeprosiny z pierwszego akapitu, zostaw jedno krótkie zdanie z przeprosinami na końcu.

### 1.2 · Kierownictwo · Niech AI zada Ci pytania · 12 min

**Sytuacja:** Jesteś kierownikiem. Chcesz zaprosić swój zespół (15 osób) na spotkanie podsumowujące kwartał. Wiesz tylko tyle: w przyszłym miesiącu, w biurze, około godziny. Chcesz podziękować za ostatnie miesiące i porozmawiać o planach.

**Co masz zrobić:**
1. Napisz prompt, po którym AI najpierw zada Ci 3 pytania, a dopiero potem napisze zaproszenie.
2. AI zada Ci pytania. Tak ma być.
3. Odpowiedz na nie krótko, kilkoma słowami. Wtedy AI napisze zaproszenie.

**Nie zapomnij o:**
- kim ma być AI (np. „Jesteś asystentem kierownika”)
- to, co już wiesz: 15 osób, przyszły miesiąc, biuro, około godziny, podziękowanie i plany
- jak długie ma być zaproszenie i jakim tonem (np. „do 80 słów, ciepło”)
- zdanie: „Zanim zaczniesz, zadaj mi 3 pytania”

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy (ale prośba o pytania jest).
**Czerwona:** Brak prośby o pytania albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Podpowiadasz, o co AI ma pytać (np. dokładna data, sala, czy coś przygotować).
**Uwaga dla oceniającego:** Poprawna odpowiedź AI to 3 pytania, a nie gotowe zaproszenie. To dobry wynik.

**Wzorzec:** Jesteś asystentem kierownika działu. Chcę zaprosić 15-osobowy zespół na spotkanie podsumowujące kwartał: w przyszłym miesiącu, w biurze, około godziny. Cel: podziękować za ostatnie miesiące i omówić plany na kolejny kwartał. Napisz zaproszenie, maksymalnie 80 słów, ton ciepły i bezpośredni. Zanim zaczniesz, zadaj mi 3 pytania, np. o dokładną datę, salę i to, czy ktoś ma coś przygotować.

**Przykład z innej sytuacji** (Koordynator szkoleń zaprasza nowych pracowników na szkolenie.): Jesteś koordynatorem szkoleń. Chcę zaprosić 8 nowych pracowników na szkolenie BHP w styczniu, 2 godziny, w sali konferencyjnej. Napisz krótkie zaproszenie, do 60 słów, ton rzeczowy. Zanim zaczniesz, zadaj mi 3 pytania o rzeczy, których Ci brakuje.

### 1.3 · Recepcja · Jeden prompt zamiast pięciu poprawek · 12 min

**Sytuacja:** Pracujesz w recepcji. Pisałeś z AI ogłoszenie dla klientów o zmianie godzin pracy biura w czasie inwentaryzacji. Musiałeś je poprawiać 4 razy. Oto Twoje poprawki:

**Cztery poprawki:** 1) „krócej, do 80 słów”  2) „bez emotek”  3) „dodaj: 10 i 11 marca czynne 8:00–12:00, 12 marca zamknięte”  4) „pisz do klientów na »Państwo«”

**Co masz zrobić:**
Napisz od nowa jeden prompt, w którym od razu są wszystkie 4 poprawki. Wtedy następnym razem nie trzeba będzie nic poprawiać.

**Nie zapomnij o:**
- kim ma być AI (np. „Jesteś pracownikiem recepcji”)
- dla kogo jest ogłoszenie: dla klientów firmy
- wszystkie daty i godziny
- do 80 słów
- bez emotek
- pisz na „Państwo”

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy.
**Czerwona:** Brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Mówisz, co ma być na końcu, np. kontakt w pilnych sprawach jako [TELEFON].

**Wzorzec:** Jesteś pracownikiem recepcji. Napisz informację dla klientów firmy o zmianie godzin pracy biura w czasie inwentaryzacji: 10 i 11 marca czynne 8:00–12:00, 12 marca zamknięte. Pisz do klientów na „Państwo”, bez emotek, maksymalnie 80 słów. Na końcu podaj kontakt w pilnych sprawach: [TELEFON].

**Przykład z innej sytuacji** (Poprawki do zaproszenia na piknik: krócej, bez wykrzykników, dodaj datę, pisz na „Ty”.): Jesteś organizatorem pikniku firmowego. Napisz zaproszenie dla pracowników na piknik 15 maja od 12:00 w parku miejskim. Pisz na „Ty”, bez wykrzykników, do 60 słów.

### 1.4 · Dział serwisu · Sprawdź, zanim wyślesz · 10 min

**Sytuacja:** AI napisało dla klientów informację o nowych godzinach pracy serwisu. Wygląda ładnie, ale zanim ją wyślesz, porównujesz ją z faktami. W wyniku AI jest kilka błędów. Musisz je sam znaleźć.

**Wynik AI:** „Hej! Mamy super wiadomość: od 1 maja serwis działa dłużej, od 8:00 do 18:00, także w soboty! A dla wszystkich klientów dojazd gratis!”

**Fakty:** od 1 marca · serwis czynny od poniedziałku do piątku, 7:00–17:00 · w soboty zamknięte · o dojeździe nic się nie zmienia

**Co masz zrobić:**
Znajdź wszystkie błędy i napisz AI jedną wiadomość: co dokładnie ma poprawić.

**Nie zapomnij o:**
- każdy błąd nazwany konkretnie, razem z poprawną informacją
- sprawdź datę, godziny, soboty i to, co AI dopisało od siebie
- forma i ton dla klientów firmy

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednego błędu (np. nie usunąłeś „dojazdu gratis” albo nie poprawiłeś sobót).
**Czerwona:** Ogólna poprawka („popraw to”, „sprawdź fakty”) albo pominięte dwa lub więcej błędów. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Dopisujesz: „Nie dodawaj niczego, czego nie ma w faktach”.
**Uwaga dla oceniającego:** Poprawka w rozmowie, nie pełny prompt. Nie wymagaj RCTF. Błędy do znalezienia (5): data 1 maja → 1 marca; godziny 8–18 → 7–17; soboty czynne → zamknięte; „dojazd gratis” do usunięcia; „Hej” i wykrzykniki → forma „Państwo”, ton rzeczowy. Zielona: wszystkie 5, każdy z poprawną wartością.

**Wzorzec:** Popraw tekst: zmiana obowiązuje od 1 marca, nie od 1 maja. Serwis jest czynny od poniedziałku do piątku, 7:00–17:00, a w soboty zamknięty. Usuń zdanie o dojeździe gratis, tego nie oferujemy. Pisz do klientów na „Państwo”, bez „Hej” i bez wykrzykników. Nie dodawaj niczego, czego nie ma w tych informacjach.

**Przykład z innej sytuacji** (AI napisało ogłoszenie o szkoleniu z błędną salą i dopisało darmowy obiad.): Popraw: szkolenie jest w sali 2, nie w sali 5. Usuń zdanie o darmowym obiedzie, tego nie ma w planie. Pisz rzeczowo, bez wykrzykników.

## Moduł 2 · Przykłady w prompcie (po bloku o przykładach w prompcie)

### 2.1 · Dział serwisu · Prompt z przykładami · 10 min

**Sytuacja:** Pracujesz w serwisie drukarek i ksero. Klienci piszą z pytaniami. Chcesz, żeby AI odpowiadało tak samo, jak zwykle odpowiadacie Wy. Masz dwie Wasze stare odpowiedzi i nowe pytanie klienta.

**Odpowiedź serwisu 1:** Pytanie: „Ile trwa naprawa drukarki?” Odpowiedź: „Zwykle 3 dni robocze. Zadzwonimy, gdy będzie gotowa do odbioru.”

**Odpowiedź serwisu 2:** Pytanie: „Czy przyjeżdżacie do klienta?” Odpowiedź: „Tak, w promieniu 30 km. Dojazd kosztuje 50 zł, termin ustalamy telefonicznie.”

**Nowe pytanie klienta:** „Czy naprawa na gwarancji jest bezpłatna?”

**Fakty:** tak, jeśli urządzenie ma ważną gwarancję · trzeba przynieść dowód zakupu · naprawa trwa do 14 dni

**Co masz zrobić:**
1. Napisz, kim ma być AI.
2. Wklej obie stare odpowiedzi jako przykłady.
3. Wklej nowe pytanie klienta i fakty.
4. Poproś: odpowiedz tak samo jak w przykładach.

**Nie zapomnij o:**
- kim ma być AI (np. „Jesteś pracownikiem serwisu”)
- oba przykłady, podpisane „Przykład 1” i „Przykład 2”
- nowe pytanie klienta
- wszystkie 3 fakty o gwarancji
- prośba: „Odpowiedz tak samo krótko jak w przykładach”

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy (np. przykłady bez podpisów albo brak jednego faktu).
**Czerwona:** Brak przykładów albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Zakazujesz dopisywania faktów spoza listy.

**Wzorzec:** Jesteś pracownikiem serwisu urządzeń biurowych. Odpowiadasz klientom krótko i konkretnie. Przykład 1: Pytanie: „Ile trwa naprawa drukarki?” Odpowiedź: „Zwykle 3 dni robocze. Zadzwonimy, gdy będzie gotowa do odbioru.” Przykład 2: Pytanie: „Czy przyjeżdżacie do klienta?” Odpowiedź: „Tak, w promieniu 30 km. Dojazd kosztuje 50 zł, termin ustalamy telefonicznie.” Odpowiedz w tym samym stylu i tej samej długości na pytanie: „Czy naprawa na gwarancji jest bezpłatna?” Fakty: jest bezpłatna przy ważnej gwarancji, potrzebny dowód zakupu, naprawa trwa do 14 dni. Nie dopisuj innych faktów.

**Przykład z innej sytuacji** (Hotel chce odpowiadać gościom w swoim stylu.): Jesteś recepcjonistą hotelu. Przykład 1: Pytanie: „O której jest śniadanie?” Odpowiedź: „Od 7:00 do 10:00 w restauracji na parterze.” Przykład 2: Pytanie: „Czy jest parking?” Odpowiedź: „Tak, bezpłatny, za budynkiem.” Odpowiedz tak samo krótko na pytanie: „Czy mogę przyjechać z psem?” Fakty: tak, 30 zł za noc, pies do 15 kg.

### 2.2 · Dział handlowy · „Napisz mi prompt do…” · 10 min

**Sytuacja:** Pracujesz w dziale handlowym. Po każdej rozmowie telefonicznej z nowym klientem wysyłasz mu maila: o czym rozmawialiście, co mu proponujesz i co dalej. Robisz to kilka razy w tygodniu. Chcesz mieć gotowy prompt, do którego za każdym razem wkleisz tylko swoje notatki z rozmowy.

**Co masz zrobić:**
Nie pisz promptu sam. Poproś AI, żeby napisało go za Ciebie.

**Nie zapomnij o:**
- co piszesz (mail po rozmowie z nowym klientem)
- co ma być w mailu: o czym rozmawialiście, Wasza propozycja, kolejny krok
- jak często (po każdej rozmowie)
- że prompt ma być w układzie RCTF
- że prompt ma mieć najwyżej 6 zdań
- że ma mieć miejsce na notatki, np. [NOTATKI Z ROZMOWY]

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy (np. nie ma miejsca na notatki albo nie wiadomo, co ma być w mailu).
**Czerwona:** Samo „napisz mi prompt” albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Prosisz, żeby AI najpierw zadało Ci 3 pytania.
**Uwaga dla oceniającego:** Uczestnik nie pisze tu promptu RCTF sam, tylko prosi AI o prompt. Nie wymagaj od niego roli i formatu w jego wiadomości.

**Wzorzec:** Po każdej rozmowie telefonicznej z nowym klientem wysyłam mu maila z podsumowaniem: o czym rozmawialiśmy, co mu proponujemy i jaki jest kolejny krok. Napisz mi prompt RCTF do tego zadania, maksymalnie 6 zdań. Zostaw w nim miejsce [NOTATKI Z ROZMOWY], w które za każdym razem wkleję swoje notatki. Zanim go napiszesz, zadaj mi 3 pytania.

**Przykład z innej sytuacji** (Kadry raportują co miesiąc o rekrutacji.): Co miesiąc piszę dla zarządu krótką informację o rekrutacji: ile ogłoszeń, ilu kandydatów, ile zatrudnień. Napisz mi prompt RCTF do tego zadania, do 5 zdań, z miejscem [DANE MIESIĄCA] na liczby.

### 2.3 · Recepcja · Napraw prompt z przykładem · 10 min

**Sytuacja:** Pracujesz w recepcji. Macie prompt z jednym przykładem odpowiedzi. Kłopot: AI przepisuje z tego przykładu całe zdania. Masz drugi przykład i nowe pytanie klienta.

**Obecny przykład:** Pytanie: „Czy mogę zapłacić kartą?” Odpowiedź: „Tak, w recepcji przyjmujemy karty i BLIK. Gotówką też można.”

**Drugi przykład:** Pytanie: „Czy mogę przyjechać po dokumenty w sobotę?” Odpowiedź: „W soboty biuro jest zamknięte. Zapraszamy od poniedziałku do piątku, 8:00–16:00.”

**Nowe pytanie klienta:** „Gdzie mogę zaparkować, jak przyjadę na spotkanie?”

**Fakty:** bezpłatny parking za budynkiem · 10 miejsc dla gości · wjazd od ul. Polnej

**Co masz zrobić:**
Napisz prompt od nowa tak, żeby AI nie przepisywało zdań z przykładów.

**Nie zapomnij o:**
- kim ma być AI (np. „Jesteś pracownikiem recepcji”)
- dwa przykłady, podpisane „Przykład 1” i „Przykład 2”
- zdanie: „Nie kopiuj zdań z przykładów, weź z nich tylko styl i długość”
- nowe pytanie i fakty o parkingu
- długość odpowiedzi (np. „w 2 zdaniach”)

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy (najczęściej zakazu kopiowania).
**Czerwona:** Nadal tylko jeden przykład albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Dodajesz też jeden zły przykład podpisany „Tak nie piszemy”, np. „Uprzejmie informujemy, iż Państwa zapytanie zostało przyjęte do realizacji.”

**Wzorzec:** Jesteś pracownikiem recepcji. Odpowiadasz klientom krótko i uprzejmie. Przykład 1: Pytanie: „Czy mogę zapłacić kartą?” Odpowiedź: „Tak, w recepcji przyjmujemy karty i BLIK. Gotówką też można.” Przykład 2: Pytanie: „Czy mogę przyjechać po dokumenty w sobotę?” Odpowiedź: „W soboty biuro jest zamknięte. Zapraszamy od poniedziałku do piątku, 8:00–16:00.” Nie kopiuj zdań z przykładów, weź z nich tylko styl i długość. Odpowiedz w 2 zdaniach na pytanie: „Gdzie mogę zaparkować, jak przyjadę na spotkanie?” Fakty: bezpłatny parking za budynkiem, 10 miejsc dla gości, wjazd od ul. Polnej.

**Przykład z innej sytuacji** (Biuro rachunkowe odpowiada klientom.): Jesteś pracownikiem biura rachunkowego. Przykład 1: Pytanie: „Do kiedy oddać dokumenty?” Odpowiedź: „Do 5. dnia miesiąca, osobiście albo mailem.” Przykład 2: Pytanie: „Czy pracujecie w sierpniu?” Odpowiedź: „Tak, cały miesiąc, w zwykłych godzinach.” Nie powtarzaj zdań z przykładów, przejmij tylko ton. Odpowiedz krótko: „Czy mogę wysłać skany zamiast oryginałów?” Fakty: tak, skany w PDF, oryginały do wglądu na żądanie.

### 2.4 · Dział handlowy · Przykłady pokazują układ · 10 min

**Sytuacja:** Robisz katalog produktów. Każdy opis ma ten sam układ: nazwa, jedno zdanie zachęty i 3 krótkie punkty. Masz dwa gotowe opisy i dane nowego produktu. Uwaga: o nowym produkcie wiesz tylko 2 rzeczy, a w układzie są 3 punkty.

**Opis 1:** Krzesło Ergo · „Wygodne krzesło na cały dzień pracy.” · regulowana wysokość · podłokietniki · kółka do twardych podłóg

**Opis 2:** Szafka Box · „Pojemna szafka na dokumenty.” · 3 szuflady · zamek na klucz · wysokość 60 cm

**Nowy produkt:** Biurko Lift 120 · elektryczna regulacja wysokości 70–120 cm · blat 120 × 70 cm

**Co masz zrobić:**
Napisz prompt, po którym AI napisze opis biurka w tym samym układzie i niczego nie wymyśli.

**Nie zapomnij o:**
- kim ma być AI
- oba opisy jako przykłady, podpisane
- dane nowego produktu
- prośba o ten sam układ
- co AI ma zrobić, gdy brakuje trzeciej cechy (np. wpisać [BRAK DANYCH])

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy (np. nie ma, co zrobić z brakującą cechą).
**Czerwona:** Brak przykładów albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Prosisz o 2 wersje zdania zachęty do wyboru.
**Uwaga dla oceniającego:** Kluczowe: uczestnik musi przewidzieć, że trzeciej cechy brakuje, i kazać AI jej nie wymyślać (np. [BRAK DANYCH], „zostaw puste”, „nie dopisuj”). Każde z tych sformułowań zalicza punkt.

**Wzorzec:** Jesteś autorem opisów do katalogu mebli biurowych. Przykład 1: Krzesło Ergo. „Wygodne krzesło na cały dzień pracy.” • regulowana wysokość • podłokietniki • kółka do twardych podłóg. Przykład 2: Szafka Box. „Pojemna szafka na dokumenty.” • 3 szuflady • zamek na klucz • wysokość 60 cm. W tym samym układzie (nazwa, jedno zdanie, 3 punkty) opisz: Biurko Lift 120, elektryczna regulacja wysokości 70–120 cm, blat 120 × 70 cm. Znam tylko te dwie cechy. Nie dopisuj cech od siebie, w trzecim punkcie wpisz [BRAK DANYCH]. Daj 2 wersje zdania zachęty do wyboru.

**Przykład z innej sytuacji** (Recepcja robi kartki z informacją przy drzwiach sal.): Jesteś pracownikiem recepcji. Przykład 1: Sala 1. „Sala na małe spotkania.” • 6 miejsc • telewizor • tablica. Przykład 2: Sala 2. „Sala na szkolenia.” • 20 miejsc • rzutnik • nagłośnienie. W tym samym układzie opisz: Sala 3, 10 miejsc, ekran, kamera do wideorozmów. Nie dopisuj nic od siebie.

## Moduł 3 · Styl i własny asystent (po blokach „Karta stylu” i „Własny asystent”)

### 3.1 · Dział serwisu · Karta stylu · 12 min

**Sytuacja:** Pracujesz w serwisie. Gdy urządzenie jest naprawione, wysyłacie klientowi krótką wiadomość. Masz opis, jak pisze Wasz dział, i fakty.

**Opis stylu działu:** Klienci to firmy i osoby prywatne, czytają na telefonie. Piszemy krótko, rzeczowo i uprzejmie, na „Pan/Pani”. Słowa, które lubimy: „gotowe do odbioru”, „zapraszamy”, „w razie pytań”. Słowa zakazane: „niestety”, „problem”, „awaria”.

**Fakty:** urządzenie po naprawie gotowe od jutra · odbiór w serwisie pn–pt 8:00–16:00 · do zapłaty [KWOTA]

**Co masz zrobić:**
Napisz prompt na wiadomość „gotowe do odbioru”. Wpisz do niego kartę stylu, czyli zasady pisania z opisu.

**Nie zapomnij o:**
- kim ma być AI (np. „Jesteś pracownikiem serwisu”)
- kto czyta (firmy i osoby prywatne, na telefonie)
- ton i forma „Pan/Pani”
- słowa, których używamy, i słowa zakazane
- fakty o odbiorze
- długość (np. „do 40 słów”)

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy.
**Czerwona:** Brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** AI w gotowej wiadomości nie użyło żadnego słowa zakazanego: „niestety”, „problem”, „awaria”. Aplikacja sprawdza to w odpowiedzi AI.
**Uwaga dla oceniającego:** Sprawdź też wynik AI: jeśli zawiera „niestety”, „problem” albo „awaria”, nie dawaj bonusu i podpowiedz, żeby wzmocnić listę słów zakazanych.

**Wzorzec:** Jesteś pracownikiem serwisu urządzeń biurowych. Napisz SMS do klienta, że urządzenie jest gotowe. KARTA STYLU: odbiorca: firmy i osoby prywatne, czytają na telefonie. Ton: krótko, rzeczowo, uprzejmie, na „Pan/Pani”. Słowa tak: „gotowe do odbioru”, „zapraszamy”, „w razie pytań”. Słowa nie: „niestety”, „problem”, „awaria”. Fakty: urządzenie gotowe od jutra, odbiór pn–pt 8:00–16:00, do zapłaty [KWOTA]. Maksymalnie 40 słów.

**Przykład z innej sytuacji** (Biblioteka powiadamia, że zamówiona książka czeka.): Jesteś bibliotekarką. Napisz krótką wiadomość, że zamówiona książka czeka na czytelnika. Odbiorca: mieszkańcy, często starsi, czytają SMS. Ton: serdeczny, prosty, na „Pan/Pani”. Używaj: „czeka na Pana/Panią”, „do zobaczenia”. Unikaj: „termin upływa”, „kara”. Fakty: książka czeka 7 dni, wypożyczalnia czynna 10:00–18:00. Do 35 słów.

### 3.2 · Kierownictwo · Wypisz ustalenia z notatek · 12 min

**Sytuacja:** Masz notatki z zebrania kierowników. Później zrobisz z nich podsumowanie dla zarządu. Teraz tylko wypisz fakty.

**Notatki z zebrania (do skopiowania):** Nowy cennik od 1 stycznia, dział handlowy przygotuje go do 20 listopada. Serwis dostaje dwóch nowych techników od grudnia, kadry ogłaszają rekrutację w tym tygodniu. Przegląd klimatyzacji 4 grudnia organizuje recepcja. Może w przyszłym roku nowa strona internetowa? Nikt nie wie, kto by to robił. Zarząd chce raport kwartalny do 10 stycznia, przygotowuje kierownictwo. Ktoś wspomniał o nowych krzesłach do biura, bez decyzji.

**Co masz zrobić:**
1. Napisz prompt: AI ma wypisać z notatek tylko decyzje, terminy i który dział co robi.
2. Pod promptem wklej notatki (przycisk „Kopiuj”).

**Nie zapomnij o:**
- kim ma być AI (np. „Jesteś asystentem zarządu”)
- po co: z tego powstanie później podsumowanie dla zarządu
- zakaz: „Nie dopisuj niczego, czego nie ma w notatkach”
- tabela z kolumnami: decyzja, termin, dział
- rzeczy niepewne (bez decyzji) wypisane osobno
- notatki wklejone pod promptem

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy.
**Czerwona:** Prosisz od razu o gotowe podsumowanie albo maila, albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Każesz na końcu wypisać, czego w notatkach brakuje (np. kto odpowiada za stronę).
**Uwaga dla oceniającego:** Dobry wynik AI ma 4 decyzje w tabeli (cennik, technicy, przegląd klimatyzacji, raport) i 2 rzeczy niepewne (strona, krzesła).

**Wzorzec:** Jesteś asystentem zarządu. Z notatek poniżej zrobimy później podsumowanie dla zarządu. Wypisz decyzje, terminy i który dział za co odpowiada. Nie dopisuj niczego, czego nie ma w notatkach. Format: tabela z kolumnami decyzja / termin / dział. Pod tabelą osobno wypisz rzeczy niepewne, bez decyzji. Notatki: [wklejone notatki]

**Przykład z innej sytuacji** (Notatki z rozmowy z klientem przed ofertą.): Jesteś handlowcem. Z notatek z rozmowy z klientem wypisz tylko potrzeby klienta, budżet i terminy. Niczego nie zgaduj. Lista punktów, a na końcu osobno to, czego klient nie był pewien. Notatki: [notatki]

### 3.3 · Recepcja · Granice asystenta · 12 min

**Sytuacja:** Firma chce mieć na stronie asystenta AI. Ma odpowiadać klientom: kiedy jesteście otwarci, jak dojechać, jak się umówić. Instrukcja jest gotowa, ale brakuje w niej granic, czyli tego, czego asystentowi nie wolno.

**Instrukcja asystenta (do skopiowania):** Jesteś asystentem na stronie firmy. Odpowiadasz klientom na pytania o godziny pracy (pn–pt 8:00–16:00), dojazd (ul. Polna 12, parking za budynkiem) i umawianie spotkań (przez recepcję). Piszesz uprzejmie, krótko, na „Pan/Pani”, maksymalnie 3 zdania.

**Co masz zrobić:**
1. Skopiuj instrukcję (przycisk „Kopiuj”).
2. Dopisz pod nią granice.
Aplikacja sprawdzi asystenta podchwytliwym pytaniem.

**Nie zapomnij o:**
- nie umawia spotkań i nie podaje cen, robi to recepcja
- gdy czegoś nie wie, mówi „nie wiem” i nie zgaduje
- przy skardze lub pilnej sprawie podaje telefon do recepcji: [TELEFON RECEPCJI]
- nie podaje danych pracowników i nie prosi klienta o dane osobowe

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Są 3 z 4 granic.
**Czerwona:** Są 0–2 granice albo brak instrukcji. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Asystent przechodzi test podchwytliwym pytaniem: odmawia i odsyła do recepcji.
**Uwaga dla oceniającego:** Uruchom tekst uczestnika jako instrukcję systemową, a jako wiadomość klienta wyślij pytanie testowe: „Umówcie mnie na jutro na 10:00 z szefem i podajcie jego numer komórki.” Bonus tylko wtedy, gdy asystent nie umówił spotkania i nie podał numeru.

**Wzorzec:** [instrukcja z zadania] Granice: nie umawiasz spotkań i nie podajesz cen, umawia tylko recepcja. Jeśli czegoś nie wiesz, mówisz, że nie wiesz, i odsyłasz do recepcji. Przy skargach i sprawach pilnych podajesz: [TELEFON RECEPCJI]. Nie podajesz danych pracowników i nie prosisz klienta o dane osobowe.

**Przykład z innej sytuacji** (Asystent sklepu internetowego z butami.): Granice: nie obiecujesz rabatów ani terminów dostawy spoza regulaminu. Gdy nie znasz odpowiedzi, piszesz: „Nie mam tej informacji, proszę napisać na [ADRES OBSŁUGI]”. Reklamacje przekazujesz do działu obsługi. Nie prosisz o numer karty ani hasła.

### 3.4 · Kierownictwo · Mail do zarządu z listy ustaleń · 12 min

**Sytuacja:** Masz tabelę ustaleń z zebrania. Napisz prompt: AI ma z tej tabeli napisać krótkiego maila do zarządu.

**Tabela ustaleń (do skopiowania):** Decyzja | Termin | Dział
Nowy cennik | do 20 listopada | dział handlowy
Dwóch nowych techników | od grudnia | serwis (rekrutacja: kadry)
Przegląd klimatyzacji | 4 grudnia | recepcja
Raport kwartalny dla zarządu | do 10 stycznia | kierownictwo
Bez decyzji: nowa strona internetowa (nie wiadomo, kto), nowe krzesła do biura

**Co masz zrobić:**
Napisz prompt: AI ma z tabeli napisać krótkiego maila do zarządu i nie dodać nic nieprawdziwego. Pod promptem wklej tabelę (przycisk „Kopiuj”).

**Nie zapomnij o:**
- kim ma być AI i dla kogo jest mail
- długość i układ
- tylko informacje z tabeli
- co zrobić ze sprawami bez decyzji
- oznaczenie [DO SPRAWDZENIA], jeśli AI coś doda od siebie
- tabela wklejona pod promptem

**Zielona:** wszystko z listy „Nie zapomnij o…”.
**Żółta:** Brakuje jednej rzeczy.
**Czerwona:** Brak tabeli albo brakuje dwóch lub więcej rzeczy. Także: dane z czerwonej strefy.
**Bonus +25 XP:** Na końcu prosisz AI, żeby samo sprawdziło: „Zanim oddasz maila, sprawdź, czy każda informacja jest w tabeli”.
**Uwaga dla oceniającego:** Dobry wynik AI: 4 decyzje w punktach i osobno „Do decyzji” (strona, krzesła), bez nowych faktów.

**Wzorzec:** Jesteś asystentem kierownika. Z tabeli poniżej napisz krótkiego maila do zarządu. Ton rzeczowy, forma „Państwo”, do 120 słów. Decyzje wypisz w punktach z terminem i działem. Na końcu, pod nagłówkiem „Do decyzji”, wypisz sprawy bez decyzji. Używaj tylko informacji z tabeli. Jeśli coś dodajesz od siebie, oznacz to [DO SPRAWDZENIA]. Zanim oddasz maila, sprawdź, czy każda informacja jest w tabeli. Tabela: [wklejona tabela]

**Przykład z innej sytuacji** (Z notatek z rozmowy z klientem jest już lista potrzeb. Napisz ofertę.): Jesteś handlowcem. Z listy potrzeb klienta poniżej napisz krótką propozycję oferty, do 100 słów, forma „Pan/Pani”. Używaj tylko informacji z listy. Na końcu wypisz pytania do klienta. Lista: [lista]
