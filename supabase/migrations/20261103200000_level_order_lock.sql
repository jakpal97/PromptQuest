-- Wymuszona kolejność ćwiczeń. Wywołuje ją API (service role) przed oceną i zapisem próby.
-- reason: null = otwarte, 'module' = dzień zamknięty, 'block' = trener nie odblokował bloku,
-- 'previous' = poprzednie ćwiczenie w tym samym bloku nie jest zaliczone.
-- Zaliczone: ćwiczenia strefowe (config.zones) od 90 pkt (strefa zielona), pozostałe od 40.
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
     AND COALESCE((SELECT b.score FROM public.battles b, prev
                   WHERE b.player_id = p_player_id AND b.level_id = prev.id), 0) < (SELECT pass_mark FROM prev)
      THEN (SELECT jsonb_build_object('reason', 'previous', 'required',
                   jsonb_build_object('id', id, 'code', code, 'title', title, 'label', label)) FROM prev)
    ELSE jsonb_build_object('reason', null)
  END;
$$;

REVOKE ALL ON FUNCTION public.level_lock(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.level_lock(uuid, integer) TO service_role;
