// ===== DOM =====
const toDOForm = document.getElementById("todo-form");
const toDoInput = document.querySelector("#todo-form input");
const toDoList = document.getElementById("todo-list");
const clearAllBtn = document.getElementById("clear-all");
const dateEl = document.getElementById("todo-date");

// ===== State =====
const TODOS_KEY = "todos";
let toDos = [];

function paintToday() {
  if (!dateEl) return;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  dateEl.textContent = `${y}. ${m}. ${d}`;
}

function saveToDos() {
  localStorage.setItem(TODOS_KEY, JSON.stringify(toDos));
}

function loadToDos() {
  const saved = localStorage.getItem(TODOS_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    // 기존 데이터에 done이 없을 수 있으니 기본값 보정
    return Array.isArray(parsed) ? parsed.map((t) => ({ done: false, ...t })) : [];
  } catch {
    return [];
  }
}

function deleteToDo(event) {
  const li = event.target.closest("li");
  if (!li) return;

  const id = parseInt(li.dataset.id, 10);
  li.remove();

  toDos = toDos.filter((toDo) => toDo.id !== id);
  saveToDos();
}

function toggleToDo(event) {
  const li = event.currentTarget.closest("li");
  if (!li) return;

  const id = parseInt(li.dataset.id, 10);

  toDos = toDos.map((toDo) =>
    toDo.id === id ? { ...toDo, done: !toDo.done } : toDo
  );

  li.classList.toggle("isDone");
  saveToDos();
}

function paintToDo(todo) {
  const li = document.createElement("li");
  li.dataset.id = todo.id;

  if (todo.done) li.classList.add("isDone");

  // 체크 버튼
  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "todoCheck";
  checkBtn.setAttribute("aria-label", "toggle todo");

  const checkIcon = document.createElement("i");
  checkIcon.className = "fa-solid fa-check";
  checkBtn.appendChild(checkIcon);
  checkBtn.addEventListener("click", toggleToDo);

  // 텍스트
  const span = document.createElement("span");
  span.className = "todoText";
  span.innerText = todo.text;

  // 삭제 버튼
  const delBtn = document.createElement("button");
  delBtn.type = "button";
  delBtn.className = "todoDel";
  delBtn.setAttribute("aria-label", "delete todo");
  delBtn.innerText = "×";

  delBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    deleteToDo(e);
  });

  li.appendChild(checkBtn);
  li.appendChild(span);
  li.appendChild(delBtn);
  toDoList.appendChild(li);
}

function handleToDoSubmit(event) {
  event.preventDefault();
  const text = (toDoInput?.value || "").trim();
  if (!text) return;

  toDoInput.value = "";

  const newTodoObj = {
    text,
    id: Date.now(),
    done: false,
  };

  toDos.push(newTodoObj);
  paintToDo(newTodoObj);
  saveToDos();
}

function clearAllTodos() {
  if (toDos.length === 0) return;

  const ok = confirm("투두리스트를 전부 삭제하시겠습니까?");
  if (!ok) return;

  toDos = [];
  saveToDos();
  toDoList.innerHTML = "";
}

paintToday();

if (toDOForm) toDOForm.addEventListener("submit", handleToDoSubmit);
if (clearAllBtn) clearAllBtn.addEventListener("click", clearAllTodos);

// 초기 로드 + 렌더
toDos = loadToDos();
toDos.forEach(paintToDo);