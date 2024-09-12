const SERVER_API = `https://37jzhc-8080.csb.app`;

// const SERVER_API = "https://qvqpq5-8080.csb.app";

const btnAddTodos = document.querySelector(".btn-add");
const modalBoxEl = document.querySelector(".modal-box");
const formEl = document.querySelector(".form-add");
const btnShowComplete = document.querySelector(".btn-showComplete");
const inputSearch = document.querySelector(".inputSearch");
const pendingWrapEl = document.querySelector(".pendingWrap");
const completedWrapEl = document.querySelector(".completedWrap");
const completeNumberEl = document.querySelector(".complete-number");

let todoList = [];
let selectedUserId = null;
let currentSearchTerm = "";

// Event Listeners
btnAddTodos.addEventListener("click", () => {
  modalBoxEl.style.display = "block";
});

document.querySelector(".btn-cancel").addEventListener("click", (e) => {
  e.preventDefault();
  modalBoxEl.style.display = "none";
});

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const inputValue = e.target[0].value.trim();
  if (inputValue) {
    saveData(inputValue);
    e.target[0].value = "";
    modalBoxEl.style.display = "none";
  } else {
    alert("Please enter a task!");
  }
});

inputSearch.addEventListener("input", (e) => {
  currentSearchTerm = e.target.value.toLowerCase();
  renderData(currentSearchTerm);
});

btnShowComplete.addEventListener("click", () => {
  btnShowComplete.classList.toggle("active");
  const icon = btnShowComplete.querySelector("i");
  icon.classList.toggle("fa-circle-right", !btnShowComplete.classList.contains("active"));
  icon.classList.toggle("fa-circle-down", btnShowComplete.classList.contains("active"));
  completedWrapEl.style.display = btnShowComplete.classList.contains("active") ? "block" : "none";
});

// Helper Functions
const fetchData = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

const getDatas = async () => {
  todoList = await fetchData(`${SERVER_API}/todoList`);
  if (todoList) renderData(currentSearchTerm);
};

const saveData = async (todoName) => {
  const isUpdate = selectedUserId !== null;
  const method = isUpdate ? "PATCH" : "POST";
  const endpoint = isUpdate ? `${SERVER_API}/todoList/${selectedUserId}` : `${SERVER_API}/todoList`;
  const body = JSON.stringify({ name: todoName, completed: !isUpdate });

  const newTodo = await fetchData(endpoint, { method, headers: { "Content-Type": "application/json" }, body });
  if (newTodo) {
    todoList = isUpdate
      ? todoList.map(todo => (todo.id === selectedUserId ? newTodo : todo))
      : [...todoList, newTodo];
    selectedUserId = null;
    renderData(currentSearchTerm);
  }
};

const deleteData = async (todoId) => {
  await fetchData(`${SERVER_API}/todoList/${todoId}`, { method: "DELETE" });
  todoList = todoList.filter(todo => todo.id !== todoId);
  renderData(currentSearchTerm);
};

const toggleComplete = async (todoId) => {
  const todo = todoList.find(todo => todo.id === todoId);
  if (todo) {
    const updatedTodo = { ...todo, completed: !todo.completed };
    await fetchData(`${SERVER_API}/todoList/${todoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTodo)
    });

    todoList = todoList.map(t => (t.id === todoId ? updatedTodo : t));
    renderData(currentSearchTerm);
  }
};

const highlightText = (text, searchTerm) => {
  if (!searchTerm) return document.createTextNode(text);
  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = text.split(regex);

  const fragment = document.createDocumentFragment();
  parts.forEach(part => {
    const node = part.toLowerCase() === searchTerm.toLowerCase()
      ? Object.assign(document.createElement("mark"), { textContent: part })
      : document.createTextNode(part);
    fragment.appendChild(node);
  });

  return fragment;
};

const renderData = (searchTerm) => {
  pendingWrapEl.innerHTML = "";
  completedWrapEl.innerHTML = "";

  const filteredTodos = todoList.filter(todo => todo.name.toLowerCase().includes(searchTerm));
  const completedCount = filteredTodos.reduce((count, todo) => {
    const todoEl = document.createElement("div");
    todoEl.classList.add("pendingTodo");

    const textSpan = document.createElement("span");
    textSpan.classList.add("pendingText");
    textSpan.appendChild(highlightText(todo.name, searchTerm));

    const iconWrap = document.createElement("div");
    iconWrap.classList.add("pendingIcon");

    const btnDelete = createIconButton("btn-delete", "fa-trash", () => handleDelete(todo.id));
    const btnUpdate = createIconButton("btn-change", "fa-pen-to-square", () => handleUpdate(todo.id));
    const btnDone = createIconButton("btn-done", "fa-square-check", () => toggleComplete(todo.id));

    iconWrap.append(btnDelete, btnUpdate, btnDone);
    todoEl.append(textSpan, iconWrap);

    if (todo.completed) {
      completedWrapEl.appendChild(todoEl);
      count++;
    } else {
      pendingWrapEl.appendChild(todoEl);
    }
    return count;
  }, 0);

  completeNumberEl.textContent = completedCount;
  completedWrapEl.style.display = btnShowComplete.classList.contains("active") ? "block" : "none";
};

const createIconButton = (className, iconClass, onClick) => {
  const button = document.createElement("div");
  button.classList.add(className);
  button.innerHTML = `<i class="fa-solid ${iconClass}"></i>`;
  button.addEventListener("click", onClick);
  return button;
};

const handleDelete = async (todoId) => {
  await deleteData(todoId);
};

const handleUpdate = (todoId) => {
  const todo = todoList.find(todo => todo.id === todoId);
  if (todo) {
    modalBoxEl.style.display = "block";
    const inputAdd = modalBoxEl.querySelector(".input-add");
    if (inputAdd) {
      inputAdd.value = todo.name;
    }
    selectedUserId = todoId;
  }
};

// Initial Data Load
window.onload = getDatas;
