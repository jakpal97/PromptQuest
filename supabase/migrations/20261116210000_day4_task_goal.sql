-- Dzień 4: ramka „🎯 Twoje zadanie” — goal_description = „Cel:”, task_description = „Co zrobić:”.
-- Tylko zadania 4.1–4.8; bez zmian schematu, wyników i innych dni.
update levels l
set goal_description = v.goal, task_description = v.task
from (values
  (56, '4.1', 'zdjęcie ma wyglądać profesjonalnie w sklepie.', 'wybierz narzędzie, które poprawi zdjęcie, i napisz mu, co ma zmienić, a czego nie ruszać.'),
  (57, '4.2', 'klient z Czech ma dostać film w swoim języku.', 'wybierz narzędzie, które zrobi czeską wersję, a potem zaznacz, co sprawdzisz przed wysłaniem.'),
  (58, '4.3', 'na drzwiach ma zawisnąć czytelny plakat z nowymi godzinami.', 'wybierz narzędzie do grafiki i napisz, co ma być na plakacie i jak ma wyglądać.'),
  (59, '4.4', 'szef potrzebuje pewnej, aktualnej kwoty do budżetu.', 'wybierz narzędzie, które znajdzie aktualną informację, i zapytaj tak, żeby podało źródło.'),
  (60, '4.5', 'odpowiedzieć klientowi bez czytania 40 stron.', 'wybierz narzędzie, które odpowie na podstawie instrukcji, i zapytaj tak, żeby pokazało, gdzie to jest.'),
  (61, '4.6', 'szef ma jutro dostać listę kar z umowy.', 'zastanów się, gdzie wolno wgrać firmową umowę, i napisz, co AI ma z niej wypisać.'),
  (62, '4.7', 'zrozumieć mail i odpisać klientowi po niemiecku, nawet jeśli nie znasz niemieckiego.', 'wybierz narzędzie i poproś o streszczenie po polsku oraz odpowiedź z podanymi faktami.'),
  (63, '4.8', 'zamienić odręczną notatkę w tabelę zadań dla zespołu.', 'wybierz narzędzie, które czyta zdjęcia, i napisz, jak ma wyglądać tabela i co zrobić z nieczytelnym imieniem.')
) as v(id, code, goal, task)
where l.id = v.id and l.code = v.code and l.module_id = 4;
