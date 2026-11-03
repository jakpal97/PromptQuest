-- Dzień 1 · 1A: czas 15 min i nowe ostatnie zdanie w „Sytuacji”

UPDATE levels SET config = config
  || jsonb_build_object('duration', '15 min')
  || jsonb_build_object('situation', 'Weź prawdziwe zadanie, które czeka na Ciebie w tym tygodniu. Nie wymyślaj scenariusza ćwiczeniowego. Najlepiej weź zadanie, które rano robiłeś z AI w pierwszej rozmowie. Przed obiadem ćwiczyłeś RCTF na gotowych zadaniach, teraz zrób to na swoim.')
WHERE module_id = (SELECT id FROM modules WHERE day_number = 1) AND code = '1A';
