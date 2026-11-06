-- Quiz Dnia 3: instrukcja zgodna z ponawianiem (bez pokazywania dobrej odpowiedzi).
UPDATE levels
SET
  task_description = 'Wybierz jedną odpowiedź. Zła: spróbuj jeszcze raz. Dobra: Dalej. 10 XP za pierwszym razem, 5 za drugim, 0 za trzecim.',
  config = jsonb_set(
    jsonb_set(
      config,
      '{situation}',
      to_jsonb('10 pytań z trzech dni szkolenia. 10 XP za pierwszym razem, 5 za drugim, 0 za trzecim.'::text)
    ),
    '{steps,1,text}',
    to_jsonb('Zła odpowiedź: spróbuj jeszcze raz. Dobra: Dalej. Nie pokazujemy od razu poprawnej odpowiedzi.'::text)
  )
WHERE id = 49 AND code = 'Q' AND type = 'quiz';
