-- Quiz Dnia 3: dopisz pytania 11–20 1:1 z docs/dzien3_zadania.md. Nie zmienia pytań 1–10.
UPDATE levels
SET
  xp_reward = 200,
  boss_dialogue = '20 pytań z trzech dni szkolenia. 10 XP za pierwszym razem, 5 za drugim, 0 za trzecim.',
  config = jsonb_set(
    jsonb_set(
      jsonb_set(
        config,
        '{duration}',
        to_jsonb('15–20 min'::text)
      ),
      '{situation}',
      to_jsonb('20 pytań z trzech dni szkolenia. 10 XP za pierwszym razem, 5 za drugim, 0 za trzecim.'::text)
    ),
    '{quiz,questions}',
    (config->'quiz'->'questions') || $q$[
      {"q":"Co to jest „halucynacja” AI? (Dzień 1)","options":{"A":"AI się zawiesza i nie odpowiada","B":"AI pewnym tonem podaje nieprawdziwe informacje","C":"AI pisze za długie odpowiedzi"},"correct":"B"},
      {"q":"Który prompt jest najlepszy? (Dzień 1)","options":{"A":"„Napisz maila”","B":"„Mail do klienta, szybko”","C":"„Jesteś handlowcem. Klient pyta o termin dostawy. Napisz odpowiedź, do 80 słów, na Pan/Pani.”"},"correct":"C"},
      {"q":"W notatkach jest nazwisko klienta. Co robisz, zanim wkleisz je do AI? (Dzień 1)","options":{"A":"Zamieniam je na [KLIENT]","B":"Zostawiam, bo AI i tak zapomni","C":"Piszę nazwisko wielkimi literami"},"correct":"A"},
      {"q":"Po co piszemy „Zanim zaczniesz, zadaj mi 3 pytania”? (Dzień 2)","options":{"A":"Żeby AI odpowiadało wolniej","B":"Żeby AI dopytało o brakujące informacje przed pisaniem","C":"Żeby AI napisało 3 wersje"},"correct":"B"},
      {"q":"Kiedy lepiej napisać nowy prompt, zamiast poprawiać w rozmowie? (Dzień 2)","options":{"A":"Gdy robisz to samo zadanie regularnie","B":"Nigdy","C":"Gdy AI odpowiedziało za szybko"},"correct":"A"},
      {"q":"Co wpisujesz w pole „Granice” asystenta? (Dzień 2)","options":{"A":"Ulubione kolory firmy","B":"Listę klientów","C":"Czego asystentowi nie wolno i do kogo ma odesłać klienta"},"correct":"C"},
      {"q":"Jak napisać polecenie dla Copilota w Outlooku? (Dzień 3)","options":{"A":"Krótko, ale z celem, tonem i długością","B":"Samo „Odpisz mu”","C":"Jak najdłużej, ze wszystkimi szczegółami firmy"},"correct":"A"},
      {"q":"O co możesz spokojnie zapytać w Perplexity? (Dzień 3)","options":{"A":"O mail klienta z jego danymi","B":"O obecne przepisy o pracy zdalnej","C":"O listę wynagrodzeń w firmie"},"correct":"B"},
      {"q":"Do czego najlepiej nadaje się Gemini Notebook? (Dzień 3)","options":{"A":"Do wysyłania maili","B":"Do edycji zdjęć","C":"Do pytań o wgrane dokumenty, z cytatami"},"correct":"C"},
      {"q":"Co jest pierwszym krokiem łańcucha? (Dzień 3)","options":{"A":"Wypisać fakty z notatek","B":"Napisać gotowy tekst","C":"Recenzja tekstu"},"correct":"A"}
    ]$q$::jsonb
  )
WHERE type = 'quiz'
  AND code = 'Q'
  AND active
  AND module_id = (SELECT id FROM modules WHERE day_number = 3)
  AND jsonb_array_length(config->'quiz'->'questions') = 10;
