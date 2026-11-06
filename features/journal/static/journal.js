import {requestJSON} from "/static/js/api.js";
import {cell, message, busy, actions, emptyRow} from "/static/js/ui.js";
const API = "/api/journal";
const body = document.querySelector("#table-body");
const subjectFilter = document.querySelector("#filter-subject");
const groupFilter = document.querySelector("#filter-group");
let items = [], students = [], pendingId = null, loaded = false;

function fillFilter(select, records, name) {
  for (const record of records) {
    const option = document.createElement("option");
    option.value = String(record.id);
    option.textContent = name(record);
    select.append(option);
  }
}

/** Строит таблицу по массиву из API. */
function render() {
  body.replaceChildren();
  if (!items.length) { 
    emptyRow(body, 4, subjectFilter.value || groupFilter.value || studentFilter.value ? "Оценок нет" : "Оценки не найдены");
    return; 
  }
  for (const item of items) {
    const row = document.createElement("tr"); row.append(cell(item.name));
    row.append(cell(item.student_count, "number"));
    const td = document.createElement("td"); td.append(actions(item.id)); row.append(td); body.append(row);
  }
}

function fillStudents() {
  const groupId = groupFilter.value;
  const filteredStudents = groupId
    ? students.filter(function(student) { return student.group_id === Number(groupId); })
    : students;
  studentFilter.replaceChildren();
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "Все студенты";
  studentFilter.append(allOption);
  fillFilter(studentFilter, filteredStudents, function(student) { return student.name; });
}

/** Обновляет данные, сохраняя старую таблицу при неудачном запросе. */
async function load(successText = "") {
  busy(true); message("Загрузка...");
  try { 
        const [subjectsResponse, groupsResponse, studentsResponse] = await Promise.all([
      requestJSON("/api/subjects"),
      requestJSON("/api/groups")
    ]);
    fillFilter(subjectFilter, subjectsResponse.items, function(subject) { return subject.name; });
    fillFilter(groupFilter, groupsResponse.items, function(group) { return group.name; });

    students = studentsResponse.items;
    fillStudents();

    items = (await requestJSON(API)).items; 
    loaded = true; render(); 
    message(successText); 
  }
  catch (error) {
    message((successText ? successText + " Обновление списка не удалось. " : "") + error.message, true);
    if (!loaded) emptyRow(body, 3, "Данные не загружены");
  } finally { busy(false); }
}

load();
