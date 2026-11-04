-- Dzień 2 · zadanie 1.2 jako prawdziwa rozmowa: AI zadaje pytania, uczestnik odpowiada, AI pisze zaproszenie.
-- Zmienia wyłącznie treść i konfigurację zadania 1.2 Dnia 2. Nie dotyka wyników, prób ani kont.

UPDATE public.levels l
SET task_description = E'Napisz prompt, po którym AI najpierw zada Ci 3 pytania, a dopiero potem napisze zaproszenie.\nAI zada Ci pytania. Tak ma być.\nOdpowiedz na nie krótko, kilkoma słowami. Wtedy AI napisze zaproszenie.',
    config = l.config || jsonb_build_object(
      'steps', jsonb_build_array(
        jsonb_build_object('text', 'Napisz prompt, po którym AI najpierw zada Ci 3 pytania, a dopiero potem napisze zaproszenie.'),
        jsonb_build_object('text', 'AI zada Ci pytania. Tak ma być.'),
        jsonb_build_object('text', 'Odpowiedz na nie krótko, kilkoma słowami. Wtedy AI napisze zaproszenie.')
      ),
      'conversation', jsonb_build_object(
        'system', 'Jesteś pomocnym asystentem. Odpowiadasz po polsku.',
        'max_tokens', 400,
        'reply_max_tokens', 500,
        'min_questions', 2,
        'max_questions', 4,
        'reply_min_words', 3,
        'reply_label', 'Odpowiedz AI na pytania (krótko, kilkoma słowami)',
        'no_questions_hint', 'AI od razu napisało zaproszenie. Dopisz na końcu: »Zanim zaczniesz, zadaj mi 3 pytania.«'
      )
    )
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.2';

-- Konto testowe (rola tester) omija blokady dni i kolejności jak admin, ale nie ma uprawnień admina i nie trafia do rankingu
CREATE OR REPLACE FUNCTION public.level_lock(p_player_id uuid, p_level_id integer)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  WITH lvl AS (
    SELECT l.id, l.module_id, l.sort_order, COALESCE(l.block, 1) AS block,
           m.day_number, m.unlocked, COALESCE(m.active_block, 1) AS active_block
    FROM public.levels l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = p_level_id AND l.active
  ),
  prev AS (
    SELECT p.id, p.code, p.title, p.config->>'label' AS label,
           CASE WHEN p.config ? 'zones' THEN 90 ELSE 40 END AS pass_mark
    FROM public.levels p, lvl
    WHERE p.module_id = lvl.module_id
      AND p.active
      AND COALESCE(p.block, 1) = lvl.block
      AND (p.sort_order, p.id) < (lvl.sort_order, lvl.id)
    ORDER BY p.sort_order DESC, p.id DESC
    LIMIT 1
  )
  SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM lvl) THEN jsonb_build_object('reason', 'missing')
    WHEN EXISTS (SELECT 1 FROM public.players WHERE id = p_player_id AND role IN ('admin', 'tester')) THEN jsonb_build_object('reason', null)
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
$function$;

REVOKE ALL ON FUNCTION public.level_lock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.level_lock(uuid, integer) TO service_role;
