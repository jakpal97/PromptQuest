-- Dzień 4 · 4.7 „Klient z Lipska”: krok 2 jako rozmowa w dwóch turach (jak w czacie).
-- Zmienia tylko konfigurację i ramkę „Twoje zadanie” zadania 4.7; wyniki uczestników bez zmian.

update levels l
set
  goal_description = 'zrozumieć mail od klienta i odpisać mu po niemiecku, nawet jeśli nie znasz niemieckiego.',
  task_description = 'wybierz narzędzie, najpierw poproś o polskie streszczenie, a potem o odpowiedź.',
  config = jsonb_set(
    jsonb_set(
      l.config,
      '{tool}',
      ((l.config -> 'tool') - 'criteria' - 'preview' - 'reference' - 'must' - 'note') || jsonb_build_object('turns', jsonb_build_array(
        jsonb_build_object(
          'title', 'Najpierw dowiedz się, czego chce klient.',
          'criteria', jsonb_build_array('prośba o tłumaczenie albo streszczenie po polsku'),
          'criteria_note', 'Zielona: prośba o tłumaczenie albo streszczenie po polsku (dowolne słowa). Żółta: samo ogólne pytanie, np. „co to jest?”.',
          'green_needed', 1,
          'must', jsonb_build_array(jsonb_build_object(
            'any', jsonb_build_array(1),
            'strict', true,
            'pattern', 't[łl]umacz|stre(ść|sc|sz)|polsk|po naszemu|w skr[óo]cie|skr[óo][tcć]|podsumuj|podsumowa|o co (mu |im |klientowi |w nim |w tym )?chodzi|czego (on |oni |klient )?(chce|chcą|oczekuj|potrzebuj)|wyja[śs]nij|co (on |klient )?(pisze|napisał)'
          )),
          'yellow_hint', 'Poproś wprost o tłumaczenie albo streszczenie po polsku.',
          'note', 'Element 1 jest spełniony, gdy uczestnik prosi o przetłumaczenie albo streszczenie maila po polsku — dowolnymi słowami. Samo ogólne pytanie (np. „co to jest?”) to ŻÓŁTA.',
          'xp', jsonb_build_object('green', 30, 'yellow', 20, 'red', 0),
          'preview', 'Odpowiedz po polsku jako Copilot przy tym mailu. Podaj streszczenie maila w 3 punktach, wyłącznie z treści maila: 1) zamówienie 2026/1187 z 28 października — dostawa miała być w KW 46 i nie ma żadnej informacji; 2) potrzebna instrukcja po niemiecku dla pracowników; 3) prośba o podanie nowego terminu dostawy. Jeśli uczestnik pyta tylko ogólnie, zacznij od jednego zdania, co to za mail. Nie dodawaj niczego spoza maila i nie podawaj nowego terminu.',
          'reference', 'Przetłumacz ten mail na polski i streść go w 3 punktach.'
        ),
        jsonb_build_object(
          'title', 'Teraz poproś o odpowiedź do klienta.',
          'criteria', jsonb_build_array(
            'odpowiedź po niemiecku',
            'fakty: tydzień 48 i instrukcja w piątek',
            'ton (uprzejmie, krótko) albo prośba o tłumaczenie na polski do sprawdzenia'
          ),
          'criteria_note', 'Zielona: co najmniej 2 z 3. Bez faktów: żółta. Maila nie musisz wklejać drugi raz.',
          'min_words', 2,
          'must', jsonb_build_array(jsonb_build_object(
            'any', jsonb_build_array(2),
            'hint', 'Podaj nowy termin, inaczej AI go wymyśli.',
            'pattern', '48|23\s*[–-]\s*27'
          )),
          'note', 'To druga wiadomość w tym samym czacie: narzędzie pamięta mail i streszczenie z Tury 1. NIE wymagaj powtarzania maila ani kontekstu — krótkie „odpisz mu” jest na temat (na_temat = true). Brak faktów → ŻÓŁTA z podpowiedzią „Podaj nowy termin, inaczej AI go wymyśli.”',
          'xp', jsonb_build_object('green', 40, 'yellow', 30, 'red', 0),
          'preview', 'Napisz odpowiedź do klienta po niemiecku (3–4 zdania), wyłącznie z faktów podanych przez uczestnika w ostatniej wiadomości. Jeśli nie podał nowego terminu albo dnia wysyłki instrukcji, wstaw w to miejsce [NOWY TERMIN] albo [DZIEŃ] — nie wymyślaj dat. Pod odpowiedzią dodaj jedno zdanie po polsku: co jest w tej odpowiedzi. Nic więcej.',
          'preview_note', 'Zauważ: nie wklejałeś maila drugi raz. Czat pamięta, o czym rozmawiacie.',
          'reference', 'Odpisz mu uprzejmie i krótko po niemiecku: nowy termin dostawy to tydzień 48 (23–27 listopada), instrukcję po niemiecku wyślemy w piątek. Przetłumacz odpowiedź na polski, żebym mógł ją sprawdzić.'
        )
      ))
    ),
    '{blocks}',
    (
      select jsonb_agg(case when b ->> 'title' = 'Fakty do odpowiedzi' then b || '{"turn": 2}'::jsonb else b end order by ord)
      from jsonb_array_elements(l.config -> 'blocks') with ordinality as x(b, ord)
    )
  )
where l.id = 62 and l.code = '4.7' and l.module_id = 4;
