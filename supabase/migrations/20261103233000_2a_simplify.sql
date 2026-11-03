-- 2A „Audyt promptu HR”: prostsze zadanie, kryteria i wzorzec. Prompt do audytu (materials), punktacja i logika bez zmian.
update public.levels
set
  task_description = $t$Napisz bezpieczną wersję promptu HR: bez danych osobowych, AI nie decyduje, kogo zwolnić (decyzję podejmuje człowiek), wiek nie jest kryterium. Całość w RCTF.$t$,
  goal_description = $t$Brak danych osobowych, AI wprost nie decyduje o zwolnieniu (decyzja człowieka), wiek nie jest kryterium, pełne RCTF.$t$,
  config = config
    || jsonb_build_object(
      'steps', jsonb_build_array(
        jsonb_build_object('text', 'Ten prompt łamie trzy ważne zasady. Napisz bezpieczną wersję, w której:'),
        jsonb_build_object('text', '1. nie ma danych osobowych: zamiast nazwisk numery pracowników (P001, P002…), bez PESEL-i i dat urodzenia,'),
        jsonb_build_object('text', '2. AI nie decyduje, kogo zwolnić: tylko analizuje, decyzję podejmuje człowiek,'),
        jsonb_build_object('text', '3. wiek nie jest kryterium.'),
        jsonb_build_object('text', 'Całość ułóż w RCTF: rola, kontekst, zadanie, format.')
      ),
      'zones', jsonb_build_object(
        'green', jsonb_build_array(
          'Brak danych osobowych: zamiast nazwisk są numery pracowników (np. P001), nie ma PESEL-i ani dat urodzenia.',
          'Prompt wprost mówi, że AI nie wskazuje, kogo zwolnić — tylko analizuje, a decyzję podejmuje człowiek.',
          'Wiek nie jest kryterium.',
          'Pełne RCTF: rola, kontekst, zadanie i format.'
        ),
        'yellow', jsonb_build_array(
          'Brakuje jednego z elementów strefy zielonej, np. prompt nie mówi wprost, że AI nie wskazuje, kogo zwolnić.',
          'Brakuje formatu.'
        ),
        'red', jsonb_build_array(
          'W prompcie są nazwiska, PESEL-e lub daty urodzenia.',
          'AI nadal ma wskazać, kogo zwolnić.',
          'Wiek nadal jest kryterium.'
        )
      ),
      'bonus', jsonb_build_object(
        'xp', coalesce((config->'bonus'->>'xp')::int, 50),
        'rule', 'Za co najmniej jeden z trzech elementów:',
        'items', jsonb_build_array(
          'Wskazanie, że prywatna, darmowa wersja czatu się tu nie nadaje i trzeba użyć wersji firmowej (Gemini w Workspace, Microsoft 365 Copilot, ChatGPT Business lub Enterprise).',
          'Odwołanie do RODO albo zalecenie konsultacji z inspektorem ochrony danych (IOD).',
          'Prośba o alternatywy dla zwolnienia (np. plan poprawy, szkolenie, zmiana zakresu obowiązków).'
        )
      ),
      'reference', jsonb_build_object(
        'situation', coalesce(config->'reference'->>'situation', 'Bezpieczna wersja po audycie.'),
        'prompt', $t$Jesteś analitykiem HR. Pomagasz mi przygotować analizę, ale nie decydujesz o ludziach.
Kontekst: zarząd prosi o analizę działu operacji (30 osób) po słabym kwartale. Mam dane bez nazwisk: numer pracownika (P001–P030), ocena roczna 1–5 i realizacja celów w %.
Zadanie: wskaż osoby z najniższymi wynikami i zaproponuj, jak im pomóc poprawić wyniki.
Nie wskazuj, kogo zwolnić, decyzję podejmuje człowiek. Nie bierz pod uwagę wieku.
Format: tabela i maksymalnie 200 słów.$t$
      ),
      'evaluator', $t$Prompt może zawierać placeholder w rodzaju „[zanonimizowana tabela, 30 wierszy]” zamiast danych — to jest poprawne i nie obniża oceny. Numery pracowników (P001, P002…) NIE są danymi osobowymi.
Oceniaj w tej kolejności:
1) CZERWONA tylko, gdy zachodzi co najmniej jeden warunek: (a) w prompcie są imiona i nazwiska, PESEL-e lub daty urodzenia; (b) prompt każe AI wskazać, wytypować, wybrać albo zarekomendować osoby do zwolnienia; (c) prompt każe brać pod uwagę wiek (np. preferować osoby starsze albo bliżej emerytury). Wskazanie osób z najniższymi wynikami po to, żeby im pomóc, NIE jest wskazaniem do zwolnienia. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej.
2) Sprawdź 4 kryteria zielone, każde tylko na podstawie słów z <prompt_uczestnika>:
 1 = brak danych osobowych (są numery pracowników albo placeholder);
 2 = prompt zawiera OSOBNE zdanie o zwolnieniu, które zakazuje AI wskazywania osób do zwolnienia (musi paść słowo „zwolnić”, „zwolnienie” albo „zwolnień”, np. „Nie wskazuj, kogo zwolnić”, „nie rekomenduj zwolnień”), ORAZ mówi, że decyzję podejmuje człowiek. Jeśli w prompcie nie ma żadnego słowa o zwolnieniu, kryterium 2 NIE jest spełnione. Ogólne zdanie w roli, np. „nie decydujesz o ludziach” albo „jesteś tylko asystentem”, NIE wystarcza. Przykład: prompt z rolą „Pomagasz mi przygotować analizę, ale nie decydujesz o ludziach”, który nigdzie nie wspomina o zwolnieniu ani o decyzji człowieka → kryterium 2 BRAK → ŻÓŁTA. W polu analiza przy kryterium 2 zacytuj zdanie ze słowem o zwolnieniu albo napisz BRAK;
 3 = wiek nie jest kryterium (prompt wprost wyklucza wiek albo wiek w ogóle nie występuje wśród kryteriów);
 4 = pełne RCTF: rola (ogólna rola też się liczy), kontekst, zadanie i format (osobne polecenie o formie odpowiedzi, np. tabela, lista, limit słów).
3) ZIELONA, gdy spełnione są wszystkie 4 kryteria. 4) W każdym innym przypadku ŻÓŁTA.
Do zielonej NIE wymagaj: RODO, art. 22, IOD, firmowej wersji AI, alternatyw dla zwolnienia ani konsultacji z prawnikiem — to są elementy bonusu.
W polu analiza zakończ dokładnie tak: „Zielone: N z 4. Warunek czerwonej: TAK (który) albo NIE.”
Pole spelnione: numery spełnionych kryteriów 1–4.$t$
    )
where id = 27 and code = '2A';
