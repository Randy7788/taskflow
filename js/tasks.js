export function initTasksDemo() {
  const taskForm = document.getElementById("task-form");
  if (!taskForm) return;

  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const taskStatus = document.getElementById("task-status");

  const statsEl = document.getElementById("task-stats");
  const filterButtons = Array.from(document.querySelectorAll(".filter-btn"));

  const btnClearDone = document.getElementById("btn-clear-done");
  const btnClearAll = document.getElementById("btn-clear-all");

  const STORAGE_KEY = "taskflow_tasks";
  let tasks = [];
  let currentFilter = "all"; // all | todo | done

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  }

  function updateStats() {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    const todo = total - done;
    statsEl.textContent = `Total: ${total} · Hechas: ${done} · Pendientes: ${todo}`;
  }

  function getVisibleTasks() {
    if (currentFilter === "done") return tasks.filter((t) => t.done);
    if (currentFilter === "todo") return tasks.filter((t) => !t.done);
    return tasks;
  }

  function setActiveFilterBtn() {
    for (const btn of filterButtons) {
      btn.classList.toggle("is-active", btn.dataset.filter === currentFilter);
    }
  }

  function handleEdit(task) {
    const nuevo = prompt("Editar tarea:", task.text);
    if (nuevo === null) return; // canceló
    const value = nuevo.trim();
    if (value.length < 2) {
      taskStatus.textContent = "La tarea editada es muy corta.";
      return;
    }

    const exists = tasks.some(
      (t) =>
        t.id !== task.id && t.text.trim().toLowerCase() === value.toLowerCase()
    );

    if (exists) {
      taskStatus.textContent = "Ya existe una tarea con ese nombre.";
      return;
    }

    task.text = value;
    saveTasks();
    renderTasks();
  }

  function renderTasks() {
    taskList.innerHTML = "";
    updateStats();
    setActiveFilterBtn();

    const visible = getVisibleTasks();

    if (tasks.length === 0) {
      taskStatus.textContent = "No tienes tareas todavía. Agrega una arriba.";
      return;
    }

    if (visible.length === 0) {
      taskStatus.textContent = "No hay tareas para este filtro.";
      return;
    }

    taskStatus.textContent = "";

    for (const task of visible) {
      const li = document.createElement("li");
      li.className = "task-item";

      const left = document.createElement("div");
      left.style.display = "flex";
      left.style.alignItems = "center";
      left.style.gap = "10px";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;

      const text = document.createElement("span");
      text.textContent = task.text;
      if (task.done) text.classList.add("task-done");

      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        saveTasks();
        renderTasks();
      });

      // Editar por doble click en el texto
      text.addEventListener("dblclick", () => handleEdit(task));

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "8px";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Editar";
      editBtn.addEventListener("click", () => handleEdit(task));

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Eliminar";

      del.addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      actions.appendChild(editBtn);
      actions.appendChild(del);

      left.appendChild(checkbox);
      left.appendChild(text);

      li.appendChild(left);
      li.appendChild(actions);

      taskList.appendChild(li);
    }
  }

  // Filtros
  for (const btn of filterButtons) {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  }

  //Update
  btnClearDone.addEventListener("click", () => {
  const doneCount = tasks.filter((t) => t.done).length;

  if (doneCount === 0) {
    taskStatus.textContent = "No hay tareas completadas para borrar.";
    return;
  }

  const ok = confirm(`¿Borrar ${doneCount} tarea(s) completada(s)?`);
  if (!ok) return;

  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  renderTasks();
});

btnClearAll.addEventListener("click", () => {
  if (tasks.length === 0) {
    taskStatus.textContent = "No hay tareas para borrar.";
    return;
  }

  const ok = confirm("¿Vaciar TODO? Esto no se puede deshacer.");
  if (!ok) return;

  tasks = [];
  saveTasks();
  renderTasks();
}); 

  // Agregar tarea
  taskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    taskStatus.textContent = "";

    const value = taskInput.value.trim();

    if (value.length < 2) {
      taskStatus.textContent = "La tarea es muy corta.";
      return;
    }

    const exists = tasks.some(
      (t) => t.text.trim().toLowerCase() === value.toLowerCase()
    );

    if (exists) {
      taskStatus.textContent = "Esa tarea ya existe.";
      return;
    }

    const newTask = {
      id: crypto.randomUUID(),
      text: value,
      done: false,
      createdAt: Date.now(),
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();

    taskForm.reset();
    taskInput.focus();
  });

  // Init
  loadTasks();
  renderTasks();
}
