-- Ścieżka pomocy Dnia 1 + łagodniejsza (ale jednoznaczna) ocena 1C.

-- 1. Ukończenie bez strefy zielonej: 'reference' = po 5 nieudanych próbach uczestnik obejrzał wzorzec,
--    'trainer' = trener oznaczył ćwiczenie jako zaliczone w panelu admina.
ALTER TABLE public.battles ADD COLUMN IF NOT EXISTS completed_via text
  CHECK (completed_via IN ('reference', 'trainer'));

-- 2. Blokada kolejności uznaje takie ukończenie za zaliczenie.
CREATE OR REPLACE FUNCTION public.level_lock(p_player_id uuid, p_level_id integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  WITH lvl AS (
    SELECT l.id, l.module_id, l.sort_order, COALESCE(l.block, 1) AS block,
           m.day_number, m.unlocked, COALESCE(m.active_block, 1) AS active_block
    FROM public.levels l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = p_level_id
  ),
  prev AS (
    SELECT p.id, p.code, p.title, p.config->>'label' AS label,
           CASE WHEN p.config ? 'zones' THEN 90 ELSE 40 END AS pass_mark
    FROM public.levels p, lvl
    WHERE p.module_id = lvl.module_id
      AND COALESCE(p.block, 1) = lvl.block
      AND (p.sort_order, p.id) < (lvl.sort_order, lvl.id)
    ORDER BY p.sort_order DESC, p.id DESC
    LIMIT 1
  )
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM lvl) THEN jsonb_build_object('reason', 'missing')
    WHEN EXISTS (SELECT 1 FROM public.players WHERE id = p_player_id AND role = 'admin') THEN jsonb_build_object('reason', null)
    WHEN (SELECT day_number > 1 AND NOT COALESCE(unlocked, false) FROM lvl) THEN jsonb_build_object('reason', 'module')
    WHEN (SELECT block > active_block FROM lvl) THEN jsonb_build_object('reason', 'block')
    WHEN EXISTS (SELECT 1 FROM prev)
     AND NOT EXISTS (SELECT 1 FROM public.battles b, prev
                     WHERE b.player_id = p_player_id AND b.level_id = prev.id
                       AND (b.score >= prev.pass_mark OR b.completed_via IS NOT NULL))
      THEN (SELECT jsonb_build_object('reason', 'previous', 'required',
                   jsonb_build_object('id', id, 'code', code, 'title', title, 'label', label)) FROM prev)
    ELSE jsonb_build_object('reason', null)
  END;
$$;

REVOKE ALL ON FUNCTION public.level_lock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.level_lock(uuid, integer) TO service_role;

-- 3. Ćwiczenie 1C „Rozbrój halucynację” — kryteria stref i instrukcja dla oceniającego.
UPDATE public.levels
SET config = config || jsonb_build_object(
  'zones', jsonb_build_object(
    'green', jsonb_build_array(
      $t$Prompt wprost pozwala AI odpowiedzieć „nie wiem” / „nie znam”.$t$,
      $t$Prompt zakazuje wymyślania źródeł (tytułów, autorów, DOI, linków).$t$,
      $t$Prompt każe oznaczać poziom pewności albo oddzielać fakty od przypuszczeń.$t$,
      $t$Obecne są wszystkie cztery elementy RCTF (ogólna rola, np. „Jesteś analitykiem”, też się liczy).$t$
    ),
    'yellow', jsonb_build_array(
      $t$Jest tylko jedna albo dwie z trzech instrukcji przeciw zmyślaniu (zgoda na „nie wiem”, zakaz wymyślania źródeł, oznaczanie pewności).$t$,
      $t$Brakuje jednego elementu RCTF (najczęściej formatu).$t$
    ),
    'red', jsonb_build_array(
      $t$Brak jakiejkolwiek instrukcji przeciw zmyślaniu — samo pytanie.$t$,
      $t$Brakuje co najmniej dwóch elementów RCTF.$t$,
      $t$Prompt zawiera dane z czerwonej strefy: nazwiska, telefony, maile, PESEL.$t$
    )
  ),
  'evaluator', $t$OCENIAJ W TEJ KOLEJNOŚCI (te zasady mają pierwszeństwo przed wszystkim innym).
KROK 1 — policz instrukcje przeciw zmyślaniu, które uczestnik napisał w PROMPCIE: (a) zgoda na odpowiedź „nie wiem” / „nie znam”; (b) zakaz wymyślania źródeł — tytułów, autorów, DOI albo linków; (c) polecenie oznaczania pewności (np. PEWNE / NIEPEWNE) albo oddzielania faktów od przypuszczeń. Wynik to 0, 1, 2 albo 3.
KROK 2 — policz elementy RCTF. ROLA: każde „Jesteś …” się liczy, także ogólne „Jesteś analitykiem” — ogólna rola NIE jest powodem do czerwonej ani do żółtej. KONTEKST: dowolna informacja o sytuacji, celu albo odbiorcy (np. „przygotowuję notatkę dla zarządu”). ZADANIE: co AI ma zrobić. FORMAT: osobna instrukcja o formie odpowiedzi — lista, liczba pozycji listy, długość, struktura (np. „Format: lista 3 pozycji, po jednym zdaniu opisu”). Samo „podaj 3 badania z autorami i rokiem” to treść ZADANIA, a nie format; oznaczanie pewności to instrukcja (c), a nie format.
KROK 3 — CZERWONA tylko wtedy, gdy zachodzi któreś z: 0 instrukcji przeciw zmyślaniu (samo pytanie); brakuje co najmniej dwóch elementów RCTF; uczestnik sam wpisał dane z czerwonej strefy (nazwiska, telefony, maile, PESEL). Nazwiska autorów badań, które AI ma dopiero podać, nie są danymi z czerwonej strefy. Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej.
KROK 4 — ZIELONA, gdy są wszystkie 3 instrukcje przeciw zmyślaniu ORAZ wszystkie 4 elementy RCTF.
KROK 5 — w każdym innym przypadku ŻÓŁTA: 1 albo 2 instrukcje przeciw zmyślaniu, albo brak jednego elementu RCTF (najczęściej formatu).
Pole spelnione: 1 = instrukcja (a), 2 = instrukcja (b), 3 = instrukcja (c), 4 = wszystkie cztery elementy RCTF.
Odpowiedź AI (<odpowiedz_ai>) NIE wpływa na strefę — oceniasz wyłącznie prompt. Użyj jej tylko w informacji zwrotnej: jeśli model napisał „nie znam” / „nie wiem” albo oznaczył pozycje jako NIEPEWNE, dopisz w co_poszlo_dobrze, że prompt zadziałał; jeśli model podał pewne siebie źródła, w co_poprawic podpowiedz, którą instrukcję przeciw zmyślaniu dopisać.$t$
)
WHERE code = '1C' AND module_id = (SELECT id FROM public.modules WHERE day_number = 1);

-- 4. Pozostałe ćwiczenia Dnia 1 — to samo zdanie ochronne, reszta kryteriów bez zmian.
UPDATE public.levels
SET config = jsonb_set(
  config, '{evaluator}',
  to_jsonb(rtrim(COALESCE(config->>'evaluator', '')) || ' Jeśli nie zachodzi żaden warunek czerwonej strefy, nie dawaj czerwonej.')
)
WHERE module_id = (SELECT id FROM public.modules WHERE day_number = 1)
  AND config ? 'zones'
  AND position('Jeśli nie zachodzi żaden warunek czerwonej strefy' IN COALESCE(config->>'evaluator', '')) = 0;
