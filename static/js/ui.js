/** Создаёт ячейку, выводя значения через textContent. */
export function cell(value, className = "") {
  const td = document.createElement("td");
  td.textContent = value === null || value === undefined ? "—" : String(value);
  td.className = className;
  return td;
}

/** Показывает сообщение о результате запроса. */
export function message(text = "", error = false) {
  const box = document.querySelector("#status");
  box.textContent = text; box.hidden = !text;
  box.classList.toggle("error", error);
  box.setAttribute("role", error ? "alert" : "status");
}

/** Блокирует повторные действия на время запроса. */
export function busy(value) {
  document.querySelector("main").setAttribute("aria-busy", String(value));
  document.querySelectorAll("main button, main input, main select").forEach(function(control) { control.disabled = value; });
}

/** Создаёт кнопки строки для делегирования событий. */
export function actions(id) {
  const box = document.createElement("div"); box.className = "row-actions";
  for (const action of ["edit", "delete"]) {
    const button = document.createElement("button"); button.type = "button";
    button.dataset.action = action; button.dataset.id = String(id);
    button.textContent = action === "edit" ? "Изменить" : "Удалить";
    if (action === "delete") button.className = "button-danger";
    box.append(button);
  }
  return box;
}

/** Выводит строку пустого состояния таблицы. */
export function emptyRow(body, columns, text = "Записей нет") {
  body.replaceChildren(); const row = document.createElement("tr");
  const td = cell(text, "empty-row"); td.colSpan = columns;
  row.append(td); body.append(row);
}

/** Заполняет выбор группы, сохраняя доступный прежний вариант. */
export function fillGroups(select, groups, includeAll = false) {
  const previous = select.value; select.replaceChildren();
  if (includeAll) { const option = document.createElement("option"); option.value = ""; option.textContent = "Все группы"; select.append(option); }
  for (const group of groups) {
    const option = document.createElement("option"); option.value = String(group.id); option.textContent = group.name; select.append(option);
  }
  if (Array.from(select.options).some(function(option) { return option.value === previous; })) select.value = previous;
  else if (includeAll) select.value = "";
}
