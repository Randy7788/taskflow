export function initTasksDemo() {
  const taskForm = document.getElementById("task-form");
  if (!taskForm) return;

  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  const taskStatus = document.getElementById("task-status");

  const STORAGE_KEY = "taskflow_tasks";
  let tasks = [];

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    tasks = raw ? JSON.parse(raw) : [];
  }

  function renderTasks() {
    taskList.innerHTML = "";

    if (tasks.length === 0) {
      taskStatus.textContent = "No tienes tareas todavía. Agrega una arriba.";
      return;
    }

    taskStatus.textContent = `Tareas: ${tasks.length}`;

    for (const task of tasks) {
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

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Eliminar";

      del.addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
      });

      left.appendChild(checkbox);
      left.appendChild(text);

      li.appendChild(left);
      li.appendChild(del);

      taskList.appendChild(li);
    }
  }

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

  loadTasks();
  renderTasks();
}
