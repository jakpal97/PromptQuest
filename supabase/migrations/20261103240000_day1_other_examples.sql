-- Dzień 1: „Przykład z innej sytuacji” po 3 nieudanych próbach (config.other_example)
-- oraz wzorce dla BOSS 1.1 i 1.2 (fragmenty wzorca BOSS 1.3), żeby po 5 próbach był przycisk wzorca.

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś właścicielką małej kwiaciarni, piszesz ciepło i krótko."},
  {"tag": "KONTEKST", "text": "Klienci to głównie stali mieszkańcy osiedla. Od 20 do 31 grudnia kwiaciarnia jest otwarta dłużej: 8:00–20:00. 24 grudnia zamykamy o 14:00."},
  {"tag": "ZADANIE", "text": "Napisz post na Facebooka z informacją o świątecznych godzinach otwarcia."},
  {"tag": "FORMAT", "text": "Maksymalnie 60 słów, godziny pogrubione, na końcu zaproszenie do zamawiania bukietów telefonicznie."}
]}}$j$::jsonb where id = 25;

update levels set config = config || $j${"other_example": {"lines": [
  {"text": "Słaby prompt: „Napisz coś o naszym nowym chlebie.”"},
  {"text": "Poprawiony:"},
  {"tag": "ROLA", "text": "Jesteś właścicielem lokalnej piekarni, piszesz prosto i apetycznie."},
  {"tag": "KONTEKST", "text": "Od poniedziałku sprzedajemy nowy chleb żytni na zakwasie, 6,50 zł. Pieczemy go codziennie rano, do 10:00 jest zwykle wyprzedany."},
  {"tag": "ZADANIE", "text": "Napisz krótki tekst na tablicę przy kasie."},
  {"tag": "FORMAT", "text": "3 zdania, cena i godzina pogrubione, bez słów „wyjątkowy” i „najlepszy”."}
]}}$j$::jsonb where id = 26;

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś ostrożnym doradcą, który woli przyznać się do niewiedzy niż podać złą informację."},
  {"tag": "KONTEKST", "text": "Szukam dotacji dla małej firmy na zakup komputerów. Wszystko, co podasz, będę sprawdzać."},
  {"tag": "ZADANIE", "text": "Wymień 3 polskie programy dotacji dla małych firm na cyfryzację, z nazwą instytucji."},
  {"tag": "ZABEZPIECZENIE", "text": "Jeśli nie znasz programu, napisz „nie wiem”. Nie wymyślaj nazw, kwot ani linków. Przy każdym programie zaznacz: PEWNE albo DO SPRAWDZENIA."},
  {"tag": "FORMAT", "text": "Lista 3 punktów, po jednym zdaniu. Na końcu napisz, gdzie mogę to sprawdzić."}
]}}$j$::jsonb where id = 29;

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś kierownikiem zakupów, który raportuje zarządowi krótko i w liczbach."},
  {"tag": "KONTEKST", "text": "Sieć 8 kawiarni zmienia dostawcę kawy od 1 marca. Nowa kawa jest tańsza o 7%. Smak testowało 40 klientów, 32 oceniło go dobrze."},
  {"tag": "ZADANIE", "text": "Napisz informację dla zarządu o zmianie dostawcy."},
  {"tag": "FORMAT", "text": "3 punkty, maksymalnie 60 słów. Unikaj szczegółów o szkoleniu baristów."}
]}, "reference": {"situation": "Wzorzec dla rundy 1 (zarząd).", "prompt": "Zarząd — rola: kierownik projektu piszący dla zarządu; fakty: opóźnienie, przyczyna, koszt ok. 4% budżetu, nowy termin; format: 3 punkty, maks. 100 słów, na końcu decyzja potrzebna od zarządu."}}$j$::jsonb where id = 31;

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś kierownikiem zakupów, który pisze do kierowników kawiarni konkretnie."},
  {"tag": "KONTEKST", "text": "Od 1 marca nowy dostawca kawy. Pierwsza dostawa 27 lutego. Szkolenie baristów z nowych ustawień ekspresu: 25 lutego, 30 minut."},
  {"tag": "ZADANIE", "text": "Napisz maila do kierowników kawiarni, co mają zrobić."},
  {"tag": "FORMAT", "text": "Lista 3 kroków z datami, maksymalnie 100 słów. Unikaj informacji o cenach i oszczędnościach."}
]}, "reference": {"situation": "Wzorzec dla rundy 2 (kierownicy sklepów).", "prompt": "Kierownicy sklepów — rola: koordynator wdrożenia; fakty: nowy termin, sklepy działają normalnie, nowa data szkolenia; format: mail, maks. 120 słów, lista „co robicie teraz”."}}$j$::jsonb where id = 32;

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś przełożonym, który pisze do baristów prosto i życzliwie."},
  {"tag": "KONTEKST", "text": "Od 1 marca parzymy nową kawę. 25 lutego jest krótkie szkolenie z ustawień ekspresu."},
  {"tag": "ZADANIE", "text": "Napisz krótkie ogłoszenie dla baristów."},
  {"tag": "FORMAT", "text": "Maksymalnie 40 słów, data pogrubiona. Unikaj informacji o cenach, dostawcach i decyzjach zarządu."}
]}}$j$::jsonb where id = 33;

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś analitykiem sprzedaży. Pomagasz przygotować analizę, ale nie decydujesz o ludziach."},
  {"tag": "KONTEKST", "text": "Kierownik chce wiedzieć, którym handlowcom pomóc w nowym roku. Dane są bez nazwisk: numer handlowca (H01–H12), sprzedaż w % planu, liczba nowych klientów."},
  {"tag": "ZADANIE", "text": "Wskaż handlowców z najniższymi wynikami i zaproponuj, jak ich wesprzeć."},
  {"tag": "ZABEZPIECZENIE", "text": "Nie oceniaj, kogo zwolnić ani komu obniżyć premię, decyzję podejmuje człowiek. Nie bierz pod uwagę wieku ani płci."},
  {"tag": "FORMAT", "text": "Tabela i maksymalnie 150 słów."}
]}}$j$::jsonb where id = 27;

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś księgową w małej firmie, piszesz uprzejmie i stanowczo."},
  {"tag": "KONTEKST", "text": "Klient [KLIENT] nie zapłacił faktury [NR FAKTURY] na [KWOTA]. Termin minął 14 dni temu. To pierwsze przypomnienie."},
  {"tag": "ZADANIE", "text": "Napisz uprzejme przypomnienie o płatności."},
  {"tag": "ZABEZPIECZENIE", "text": "Zostaw [KLIENT], [NR FAKTURY] i [KWOTA] bez zmian, uzupełnię je ręcznie przed wysłaniem."},
  {"tag": "FORMAT", "text": "Maksymalnie 80 słów, na końcu prośba o kontakt, jeśli płatność już wysłano."}
]}}$j$::jsonb where id = 28;

update levels set config = config || $j${"other_example": {"lines": [
  {"tag": "ROLA", "text": "Jesteś kierownikiem obsługi klienta, który w kryzysie pisze spokojnie i konkretnie."},
  {"tag": "KONTEKST", "text": "Klient [KLIENT] pisze zdenerwowany: w sobotę sklep internetowy nie działał przez 3 godziny i nie złożył zamówienia. Wiemy, że awaria jest naprawiona. Nie wiemy jeszcze, czy przysługuje mu rabat — o tym decyduje szef w poniedziałek."},
  {"tag": "ZADANIE", "text": "Napisz odpowiedź do klienta z przeprosinami i informacją, co dalej."},
  {"tag": "ZABEZPIECZENIE", "text": "Nie obiecuj rabatu ani zwrotu. Zostaw [KLIENT] bez zmian. Nie dopisuj faktów, których tu nie ma."},
  {"tag": "FORMAT", "text": "Maksymalnie 100 słów. Na końcu lista rzeczy, które muszę sprawdzić przed wysłaniem."}
]}}$j$::jsonb where id = 34;
