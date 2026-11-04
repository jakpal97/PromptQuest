-- 1.4, 2.4 i 3.4 już są w bazie — UPDATE na zwykłe obowiązkowe (100 XP, bonus 25).
-- Bez DELETE, TRUNCATE i bez ruszania wyników, prób, kont ani odblokowań.

UPDATE public.modules SET total_levels = 12, lives_enabled = false WHERE day_number = 2;

UPDATE public.levels l
SET xp_reward = 100,
    active = true,
    config = (l.config
              - 'extra' - 'optional' - 'badge' - 'difficulty' - 'color'
              - 'dodatkowe' - 'extra_label' - 'optional_label')
           || jsonb_build_object(
                'label', 'Zadanie ' || l.code,
                'bonus', jsonb_set(coalesce(l.config->'bonus', '{}'::jsonb), '{xp}', '25'::jsonb)
              )
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code IN ('1.4', '2.4', '3.4');

-- 1.4: te same słowa, podział na linie w „Wynik AI”
UPDATE public.levels l
SET config = jsonb_set(
  l.config,
  '{blocks,0,text}',
  to_jsonb($t$„Hej! Mamy super wiadomość: od 1 maja serwis działa dłużej, od 8:00 do 18:00, także w soboty!
A dla wszystkich klientów dojazd gratis!”$t$::text)
)
FROM public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.code = '1.4';

UPDATE public.levels l
SET sort_order = v.pos, level_number = v.pos
FROM (VALUES
  ('1.1', 1), ('1.2', 2), ('1.3', 3), ('1.4', 4),
  ('2.1', 5), ('2.2', 6), ('2.3', 7), ('2.4', 8),
  ('3.1', 9), ('3.2', 10), ('3.3', 11), ('3.4', 12)
) AS v(code, pos),
     public.modules m
WHERE m.id = l.module_id AND m.day_number = 2 AND l.active AND l.code = v.code;
