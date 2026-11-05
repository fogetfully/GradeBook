# Электронный журнал

Проект использует Flask, Jinja2, обычный JavaScript и модуль Python sqlite3.
Python 3.11 или новее. В браузере должен быть включён JavaScript.

## Запуск в Debian Linux

Один раз подготовьте системные пакеты:

~~~bash
sudo apt update
sudo apt install python3 python3-venv python3-pip sqlite3 unzip
~~~

После распаковки архива:

~~~bash
cd journal-starter
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python prepare_db.py
python check_db.py --baseline
python app.py
~~~

Откройте http://127.0.0.1:5000/. Остановка сервера: Ctrl+C.

Повторный запуск после закрытия терминала:

~~~bash
cd journal-starter
source .venv/bin/activate
python app.py
~~~

## Исходная база и восстановление

База instance/journal.db создаётся явно. Исходные данные: 3 группы по 20 студентов, 3 предмета и 162 оценки. Без оценок остаются
студенты с ID 10, 20, 30, 40, 50, 60. Группы и предметы можно добавлять.
Оценка одна на пару студент и предмет. Пустая ячейка означает отсутствие строки,
а не оценку 0. Email необязателен, одинаковые имена и email допустимы.

Для восстановления остановите сервер и выполните:

~~~bash
python prepare_db.py
python check_db.py --baseline
python app.py
~~~

Восстановление заменяет текущие учебные данные исходными. Схема и заполнение
выполняются одной транзакцией. При SQL-ошибке скрипт откатывает изменения.
Обработчик with con фиксирует или откатывает транзакцию, а соединение
дополнительно закрывается в finally. Репозитории commit не вызывают.

## Консоль SQLite

Во втором терминале из корня проекта:

~~~bash
sqlite3 instance/journal.db
~~~

Внутри консоли:

~~~sql
PRAGMA foreign_keys = ON;
PRAGMA foreign_keys;
.headers on
.mode column
SELECT g.name, COUNT(s.id) AS students
FROM groups AS g LEFT JOIN students AS s ON s.group_id = g.id
GROUP BY g.id, g.name;
PRAGMA foreign_key_check;
.quit
~~~

foreign_keys должен вернуть 1; foreign_key_check не должен вернуть строк.
Настройка включается для каждого соединения отдельно до BEGIN.

## Вертикальные срезы

Каждый каталог features/groups, subjects, students, journal, reports
объединяет один функциональный раздел. Blueprint создаётся в __init__.py
и регистрируется в app.py. pages.py возвращает только HTML. api.py читает
HTTP и JSON. service.py проверяет бизнес-правила, открывает соединение и
управляет транзакцией. repo.py выполняет SQL через переданное соединение.
HTML и JS находятся внутри соответствующего среза.

Общие части: db.py, templates/base.html, templates/partials/header.html,
templates/partials/footer.html, static/css/styles.css, static/js/api.js,
static/js/ui.js. Переходы между разделами обычными ссылками. Действия
пользователя обрабатывает JS, который вызывает JSON API.

## Контракты API

GET /api/groups и GET /api/subjects возвращают {"items": [...]}.
POST /api/groups или /api/subjects создаёт запись с JSON {"name": "..."}.
POST по адресу /api/groups/ID или /api/subjects/ID переименовывает запись.
Ответ: {"item": {"id": ..., "name": "..."}}, статус 201 при создании и 200 при изменении.
DELETE /api/groups/ID и /api/subjects/ID возвращает пустой ответ 204.

GET /api/students возвращает items; можно передать group_id и q.
POST /api/students и POST /api/students/ID принимают name, group_id, email.
DELETE /api/students/ID удаляет студента и оценки одной транзакцией.

GET /api/journal?group_id=1 возвращает group, students, subjects, grades.
POST /api/journal/grades принимает student_id, subject_id, mark и возвращает item, статус 200.
DELETE /api/journal/grades/STUDENT_ID/SUBJECT_ID возвращает 204.
Повторное удаление пустой оценки также возвращает 204, если родители существуют.

GET /api/reports?kind=groups, no_grades или failing возвращает kind и items.
В отчёте групп поля id, name, student_count, grade_count, average_mark.
В остальных отчётах id, name, group_name. Средний балл пустой группы равен null.
Ошибки полей и зависимостей: 400 и {"error": "..."}; отсутствующая запись: 404.
Техническая ошибка БД: 500. Тело ответа 204 разбирать как JSON не нужно.
