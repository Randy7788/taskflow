// ================================
// Task Demo (M1-D11 refactor pro)
// ================================
// IDEA CLAVE DEL ARCHIVO:
// - "el" = conexiones al HTML (DOM)
// - "state" = la verdad del programa (tareas, filtro, undo)
// - Helpers = cálculos (no cambian state)
// - UI = render + toast (muestran cosas)
// - Actions = cambian state + save + render
// - Events = escuchan al usuario y llaman actions
//
// ORDEN (por qué así):
// 1) DOM (necesario para todo)
// 2) State (necesario para lógica)
// 3) Data layer save/load (lo usan actions)
// 4) Helpers (lo usa render)
// 5) UI (render/toast)
// 6) Actions (cambian state)
// 7) Events (conectan UI -> actions)
// 8) Init (load + render)

export function initTasksDemo() {
  // =========================================================
  // A) SELECTORES (DOM) — “enchufes” hacia el HTML
  // =========================================================
  const el = {
    form: document.getElementById("task-form"),
    input: document.getElementById("task-input"),
    list: document.getElementById("task-list"),
    status: document.getElementById("task-status"),

    stats: document.getElementById("task-stats"),
    filters: Array.from(document.querySelectorAll(".filter-btn")),
    clearDone: document.getElementById("btn-clear-done"),
    clearAll: document.getElementById("btn-clear-all"),

    toast: document.getElementById("toast"),
    toastMsg: document.getElementById("toast-message"),
    toastAction: document.getElementById("toast-action"),
    toastClose: document.getElementById("toast-close"),
  };

  // “Guard”: si no existe el form, esta sección no está en la página
  // y salimos para evitar errores.
  if (!el.form) return;

  // =========================================================
  // B) ESTADO — “la verdad” del programa
  // =========================================================
  const STORAGE_KEY = "taskflow_tasks";

  let state = {
    tasks: [],            // lista real de tareas (fuente de verdad)
    filter: "all",        // all | todo | done
    undoSnapshot: null,   // “foto” de tareas antes de borrar
    undoTimer: null,      // timer para auto-cerrar toast
  };

  // =========================================================
  // C) DATA LAYER — guardar / cargar (solo persistencia)
  // =========================================================
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }

  function load() {
    state.tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }

  // =========================================================
  // D) HELPERS — cálculos (NO cambian state)
  // =========================================================
  function counts() {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.done).length;
    const todo = total - done;
    return { total, done, todo };
  }

  function visibleTasks() {
    if (state.filter === "done") return state.tasks.filter((t) => t.done);
    if (state.filter === "todo") return state.tasks.filter((t) => !t.done);
    return state.tasks;
  }

  // Copia profunda: necesario para "Undo" (deshacer) real
  function snapshotTasks() {
    // Si copiáramos solo la referencia, el snapshot cambiaría junto con state.tasks
    state.undoSnapshot = JSON.parse(JSON.stringify(state.tasks));
  }

  // =========================================================
  // E) UI LAYER — mostrar cosas (render + toast + mensajes)
  // =========================================================
  function setStatus(msg) {
    if (!el.status) return;
    el.status.textContent = msg || "";
  }

  function updateStatsUI() {
    if (!el.stats) return;
    const { total, done, todo } = counts();
    el.stats.textContent = `Total: ${total} · Hechas: ${done} · Pendientes: ${todo}`;
  }

  function setActiveFilterUI() {
    if (!el.filters.length) return;
    for (const btn of el.filters) {
      btn.classList.toggle("is-active", btn.dataset.filter === state.filter);
    }
  }

  // Toast (mensaje flotante)
  function hideToast() {
    if (!el.toast) return;

    el.toast.hidden = true;

    if (el.toastAction) {
      el.toastAction.hidden = true;
      el.toastAction.onclick = null;
    }

    // Limpia el timer si existía
    if (state.undoTimer) {
      clearTimeout(state.undoTimer);
      state.undoTimer = null;
    }

    // Si el toast desaparece, el "deshacer" ya no aplica
    state.undoSnapshot = null;
  }

  function showToast(message, { actionText, onAction, timeout = 6000 } = {}) {
    if (!el.toast || !el.toastMsg) return;

    el.toastMsg.textContent = message;
    el.toast.hidden = false;

    // Si hay acción (ej: Deshacer), mostramos botón y lo conectamos
    if (el.toastAction && onAction) {
      el.toastAction.textContent = actionText || "Deshacer";
      el.toastAction.hidden = false;
      el.toastAction.onclick = () => {
        onAction();
        hideToast();
      };
    } else if (el.toastAction) {
      el.toastAction.hidden = true;
      el.toastAction.onclick = null;
    }

    // Auto-cerrar toast
    if (state.undoTimer) clearTimeout(state.undoTimer);
    state.undoTimer = setTimeout(() => hideToast(), timeout);
  }

  // Render: reconstruye la lista visible desde state (estado -> UI)
  function render() {
    el.list.innerHTML = "";
    updateStatsUI();
    setActiveFilterUI();

    const visible = visibleTasks();

    // Caso: no hay nada en todo el sistema
    if (state.tasks.length === 0) {
      setStatus("No tienes tareas todavía. Agrega una arriba.");
      return;
    }

    // Caso: hay tareas pero el filtro deja 0 visibles
    if (visible.length === 0) {
      setStatus("No hay tareas para este filtro.");
      return;
    }

    setStatus("");

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

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "8px";

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Editar";

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "Eliminar";

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      left.appendChild(checkbox);
      left.appendChild(text);

      li.appendChild(left);
      li.appendChild(actions);

      el.list.appendChild(li);

      // Conectamos UI -> Actions (F)
      checkbox.addEventListener("change", () => actionToggleTask(task.id, checkbox.checked));
      delBtn.addEventListener("click", () => actionDeleteTask(task.id));
      editBtn.addEventListener("click", () => actionEditTask(task.id));
      text.addEventListener("dblclick", () => actionEditTask(task.id));
    }
  }

  // =========================================================
  // F) ACTIONS — cambian el estado + guardan + renderizan
  // =========================================================
  function apply(newTasks) {
    // Centro de actualización: evita olvidar save/render en algún lado
    state.tasks = newTasks;
    save();
    render();
  }

  function actionAddTask(rawText) {
    const value = (rawText || "").trim();
    if (value.length < 2) return setStatus("La tarea es muy corta.");

    const exists = state.tasks.some(
      (t) => t.text.trim().toLowerCase() === value.toLowerCase()
    );
    if (exists) return setStatus("Esa tarea ya existe.");

    const newTask = {
      id: crypto.randomUUID(),
      text: value,
      done: false,
      createdAt: Date.now(),
    };

    apply([newTask, ...state.tasks]);
  }

  function actionToggleTask(id, done) {
    apply(state.tasks.map((t) => (t.id === id ? { ...t, done } : t)));
  }

  function actionDeleteTask(id) {
    apply(state.tasks.filter((t) => t.id !== id));
  }

  function actionSetFilter(filter) {
    state.filter = filter;
    render(); // solo cambia lo que se muestra, no los datos
  }

  function actionEditTask(id) {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    const nuevo = prompt("Editar tarea:", task.text);
    if (nuevo === null) return;

    const value = nuevo.trim();
    if (value.length < 2) return setStatus("La tarea editada es muy corta.");

    const exists = state.tasks.some(
      (t) => t.id !== id && t.text.trim().toLowerCase() === value.toLowerCase()
    );
    if (exists) return setStatus("Ya existe una tarea con ese nombre.");

    apply(state.tasks.map((t) => (t.id === id ? { ...t, text: value } : t)));
  }

  function actionUndo() {
    if (!state.undoSnapshot) return;
    apply(state.undoSnapshot);
    showToast("Acción deshecha.");
  }

  function actionClearDone() {
    const doneCount = state.tasks.filter((t) => t.done).length;

    if (doneCount === 0) return setStatus("No hay tareas completadas para borrar.");

    const ok = confirm(`¿Borrar ${doneCount} tarea(s) completada(s)?`);
    if (!ok) return;

    snapshotTasks();
    apply(state.tasks.filter((t) => !t.done));

    showToast(`Borraste ${doneCount} completada(s).`, {
      actionText: "Deshacer",
      onAction: actionUndo,
    });
  }

  function actionClearAll() {
    if (state.tasks.length === 0) return setStatus("No hay tareas para borrar.");

    const ok = confirm("¿Vaciar TODO? Esto no se puede deshacer.");
    if (!ok) return;

    snapshotTasks();
    const prevCount = state.tasks.length;

    apply([]);

    showToast(`Borraste ${prevCount} tarea(s).`, {
      actionText: "Deshacer",
      onAction: actionUndo,
    });
  }

  // =========================================================
  // G) EVENTS — conectan acciones del usuario -> Actions
  // =========================================================
  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    setStatus("");

    actionAddTask(el.input.value);

    el.form.reset();
    el.input.focus();
  });

  for (const btn of el.filters) {
    btn.addEventListener("click", () => actionSetFilter(btn.dataset.filter));
  }

  if (el.clearDone) el.clearDone.addEventListener("click", actionClearDone);
  if (el.clearAll) el.clearAll.addEventListener("click", actionClearAll);

  if (el.toastClose) el.toastClose.addEventListener("click", hideToast);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.toast && !el.toast.hidden) hideToast();
  });

  // =========================================================
  // INIT — cargar datos y pintar
  // =========================================================
  load();
  render();
}
