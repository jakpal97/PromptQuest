-- 1C „Rozbrój halucynację”: nowa treść sekcji „Twoje zadanie” (każdy krok to osobna linia na ekranie)
update public.levels
set config = jsonb_set(config, '{steps}', jsonb_build_array(
  jsonb_build_object('text', 'Wybierz jedno pytanie z listy powyżej. Dopisz do niego instrukcje, dzięki którym AI nie będzie zmyślać:'),
  jsonb_build_object('text', '1. pozwól mu odpowiedzieć »nie wiem«,'),
  jsonb_build_object('text', '2. zakaż wymyślania tytułów, autorów, liczb i linków,'),
  jsonb_build_object('text', '3. każ zaznaczyć, czego jest pewne, a czego nie.'),
  jsonb_build_object('text', 'Całość ułóż w RCTF: rola, kontekst, zadanie, format.')
))
where id = 29 and code = '1C';
