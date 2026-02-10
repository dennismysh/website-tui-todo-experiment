/* ============================================================
   TUI Todo – Application Logic
   Pure vanilla JS, no dependencies. Uses localStorage for
   persistence. Renders ratatui-style panes with keyboard nav.
   ============================================================ */

(function () {
  "use strict";

  // ── State ────────────────────────────────────────────────
  const STORAGE_KEY = "tui-todo-data";

  const defaultData = {
    categories: [
      { id: generateId(), name: "Personal", icon: "\u2302" },
      { id: generateId(), name: "Work", icon: "\u2692" },
      { id: generateId(), name: "Shopping", icon: "\u2637" },
    ],
    tasks: [],
    activeCategoryIndex: 0,
  };

  let state = loadState();

  // UI state (not persisted)
  let focusedPane = 0; // 0=categories, 1=tasks, 2=detail
  let selectedCategoryIndex = state.activeCategoryIndex || 0;
  let selectedTaskIndex = 0;
  let modalCallback = null;
  let confirmCallback = null;

  // ── Helpers ──────────────────────────────────────────────
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure all tasks have required fields
        if (parsed.tasks) {
          parsed.tasks = parsed.tasks.map(function (t) {
            return Object.assign(
              { id: generateId(), priority: "medium", done: false, created: Date.now() },
              t
            );
          });
        }
        return parsed;
      }
    } catch (_) {
      // ignore
    }
    return JSON.parse(JSON.stringify(defaultData));
  }

  function saveState() {
    state.activeCategoryIndex = selectedCategoryIndex;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getActiveCategory() {
    return state.categories[selectedCategoryIndex] || null;
  }

  function getTasksForCategory(catId) {
    if (!catId) return [];
    return state.tasks.filter(function (t) { return t.categoryId === catId; });
  }

  function getSelectedTask() {
    var cat = getActiveCategory();
    if (!cat) return null;
    var tasks = getTasksForCategory(cat.id);
    return tasks[selectedTaskIndex] || null;
  }

  function setStatus(msg) {
    document.getElementById("status-msg").textContent = msg;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function formatDate(ts) {
    var d = new Date(ts);
    var year = d.getFullYear();
    var month = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    var hours = String(d.getHours()).padStart(2, "0");
    var mins = String(d.getMinutes()).padStart(2, "0");
    return year + "-" + month + "-" + day + " " + hours + ":" + mins;
  }

  // ── Rendering ────────────────────────────────────────────

  function render() {
    renderTabs();
    renderCategories();
    renderTasks();
    renderDetail();
    updatePaneFocus();
    saveState();
  }

  function renderTabs() {
    var bar = document.getElementById("tab-bar");
    bar.innerHTML = "";
    state.categories.forEach(function (cat, i) {
      var tab = document.createElement("div");
      tab.className = "tab" + (i === selectedCategoryIndex ? " active" : "");
      tab.textContent = cat.icon + " " + cat.name;
      tab.addEventListener("click", function () {
        selectedCategoryIndex = i;
        selectedTaskIndex = 0;
        focusedPane = 1;
        render();
      });
      bar.appendChild(tab);
    });
  }

  function renderCategories() {
    var container = document.getElementById("category-list");
    container.innerHTML = "";

    if (state.categories.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><span class="empty-icon">\u2620</span>No categories<br>Press <kbd>a</kbd> to add one</div>';
      return;
    }

    state.categories.forEach(function (cat, i) {
      var tasks = getTasksForCategory(cat.id);
      var doneCount = tasks.filter(function (t) { return t.done; }).length;

      var item = document.createElement("div");
      item.className = "list-item" + (i === selectedCategoryIndex ? " selected" : "");

      var icon = document.createElement("span");
      icon.className = "cat-icon";
      icon.textContent = cat.icon;

      var name = document.createElement("span");
      name.textContent = cat.name;

      var count = document.createElement("span");
      count.className = "cat-count";
      count.textContent = doneCount + "/" + tasks.length;

      item.appendChild(icon);
      item.appendChild(name);
      item.appendChild(count);

      item.addEventListener("click", function () {
        selectedCategoryIndex = i;
        selectedTaskIndex = 0;
        focusedPane = 0;
        render();
      });

      container.appendChild(item);
    });

    scrollIntoViewIfNeeded(container, selectedCategoryIndex);
  }

  function renderTasks() {
    var container = document.getElementById("task-list");
    var titleEl = document.getElementById("tasks-title");
    var cat = getActiveCategory();

    if (!cat) {
      titleEl.textContent = " Tasks ";
      container.innerHTML =
        '<div class="empty-state"><span class="empty-icon">\u2370</span>No category selected</div>';
      return;
    }

    titleEl.textContent = " Tasks \u2500 " + cat.name + " ";

    var tasks = getTasksForCategory(cat.id);

    if (tasks.length === 0) {
      container.innerHTML =
        '<div class="empty-state"><span class="empty-icon">\u2610</span>No tasks yet<br>Press <kbd>a</kbd> to add one</div>';
      return;
    }

    container.innerHTML = "";
    tasks.forEach(function (task, i) {
      var item = document.createElement("div");
      item.className = "list-item" + (i === selectedTaskIndex ? " selected" : "");

      var checkbox = document.createElement("span");
      checkbox.className = "task-checkbox" + (task.done ? " checked" : "");
      checkbox.textContent = task.done ? "[\u2713]" : "[ ]";

      var text = document.createElement("span");
      text.className = "task-text" + (task.done ? " done" : "");
      text.textContent = task.text;

      var priority = document.createElement("span");
      priority.className = "task-priority " + task.priority;
      var prioLabels = { low: "\u25CB", medium: "\u25D0", high: "\u25CF" };
      priority.textContent = prioLabels[task.priority] || "\u25D0";
      priority.title = task.priority;

      item.appendChild(checkbox);
      item.appendChild(text);
      item.appendChild(priority);

      item.addEventListener("click", function () {
        selectedTaskIndex = i;
        focusedPane = 1;
        render();
      });

      container.appendChild(item);
    });

    // Clamp index
    selectedTaskIndex = clamp(selectedTaskIndex, 0, Math.max(0, tasks.length - 1));
    scrollIntoViewIfNeeded(container, selectedTaskIndex);
  }

  function renderDetail() {
    var container = document.getElementById("detail-content");
    var task = getSelectedTask();

    if (!task) {
      container.innerHTML = '<div class="detail-empty">Select a task to view details</div>';
      return;
    }

    var statusClass = task.done ? "done-text" : "pending-text";
    var statusText = task.done ? "\u2713 Complete" : "\u25CB Pending";
    var prioClass = task.priority;

    container.innerHTML =
      '<div class="detail-view">' +
        '<div class="detail-field">' +
          '<div class="detail-label">Task</div>' +
          '<div class="detail-value">' + escapeHtml(task.text) + "</div>" +
        "</div>" +
        '<div class="detail-field">' +
          '<div class="detail-label">Status</div>' +
          '<div class="detail-value ' + statusClass + '">' + statusText + "</div>" +
        "</div>" +
        '<div class="detail-field">' +
          '<div class="detail-label">Priority</div>' +
          '<span class="detail-priority-badge ' + prioClass + '">' +
            task.priority.toUpperCase() +
          "</span>" +
        "</div>" +
        '<div class="detail-field">' +
          '<div class="detail-label">Created</div>' +
          '<div class="detail-created">' + formatDate(task.created) + "</div>" +
        "</div>" +
      "</div>";
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function updatePaneFocus() {
    var panes = [
      document.getElementById("pane-categories"),
      document.getElementById("pane-tasks"),
      document.getElementById("pane-detail"),
    ];
    panes.forEach(function (p, i) {
      p.classList.toggle("focused", i === focusedPane);
    });
  }

  function scrollIntoViewIfNeeded(container, index) {
    var items = container.querySelectorAll(".list-item");
    if (items[index]) {
      items[index].scrollIntoView({ block: "nearest" });
    }
  }

  // ── Modals ───────────────────────────────────────────────

  function showModal(title, label, defaultValue, showPriority, callback) {
    var overlay = document.getElementById("modal-overlay");
    var input = document.getElementById("modal-input");
    document.getElementById("modal-title").textContent = " " + title + " ";
    document.getElementById("modal-label").textContent = label;
    input.value = defaultValue || "";

    var prioSelector = document.getElementById("priority-selector");
    if (showPriority) {
      prioSelector.style.display = "block";
      // Reset priority buttons
      document.querySelectorAll(".priority-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-priority") === "medium");
      });
    } else {
      prioSelector.style.display = "none";
    }

    modalCallback = callback;
    overlay.classList.add("visible");
    requestAnimationFrame(function () {
      input.focus();
    });
  }

  function hideModal() {
    document.getElementById("modal-overlay").classList.remove("visible");
    modalCallback = null;
  }

  function getModalPriority() {
    var active = document.querySelector(".priority-btn.active");
    return active ? active.getAttribute("data-priority") : "medium";
  }

  function showConfirm(msg, callback) {
    document.getElementById("confirm-msg").textContent = msg;
    document.getElementById("confirm-overlay").classList.add("visible");
    confirmCallback = callback;
  }

  function hideConfirm() {
    document.getElementById("confirm-overlay").classList.remove("visible");
    confirmCallback = null;
  }

  function showHelp() {
    document.getElementById("help-overlay").classList.add("visible");
  }

  function hideHelp() {
    document.getElementById("help-overlay").classList.remove("visible");
  }

  function isAnyModalOpen() {
    return (
      document.getElementById("modal-overlay").classList.contains("visible") ||
      document.getElementById("help-overlay").classList.contains("visible") ||
      document.getElementById("confirm-overlay").classList.contains("visible")
    );
  }

  // ── Priority button clicks ───────────────────────────────
  document.querySelectorAll(".priority-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".priority-btn").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
    });
  });

  // ── Actions ──────────────────────────────────────────────

  // Categories
  function addCategory() {
    var icons = ["\u2302", "\u2605", "\u2665", "\u266A", "\u2618", "\u2692", "\u2637", "\u2622", "\u2764", "\u2698"];
    showModal("New Category", "Category name:", "", false, function (name) {
      if (!name.trim()) return;
      var icon = icons[state.categories.length % icons.length];
      state.categories.push({ id: generateId(), name: name.trim(), icon: icon });
      selectedCategoryIndex = state.categories.length - 1;
      selectedTaskIndex = 0;
      setStatus("Category '" + name.trim() + "' added");
      render();
    });
  }

  function renameCategory() {
    var cat = getActiveCategory();
    if (!cat) return;
    showModal("Rename Category", "New name:", cat.name, false, function (name) {
      if (!name.trim()) return;
      cat.name = name.trim();
      setStatus("Category renamed to '" + name.trim() + "'");
      render();
    });
  }

  function deleteCategory() {
    var cat = getActiveCategory();
    if (!cat) return;
    var taskCount = getTasksForCategory(cat.id).length;
    var msg = "Delete '" + cat.name + "'";
    if (taskCount > 0) msg += " and its " + taskCount + " task" + (taskCount !== 1 ? "s" : "");
    msg += "?";

    showConfirm(msg, function () {
      state.tasks = state.tasks.filter(function (t) { return t.categoryId !== cat.id; });
      state.categories.splice(selectedCategoryIndex, 1);
      selectedCategoryIndex = clamp(selectedCategoryIndex, 0, Math.max(0, state.categories.length - 1));
      selectedTaskIndex = 0;
      setStatus("Category deleted");
      render();
    });
  }

  // Tasks
  function addTask() {
    var cat = getActiveCategory();
    if (!cat) {
      setStatus("Select a category first");
      return;
    }
    showModal("New Task", "Task description:", "", true, function (text) {
      if (!text.trim()) return;
      var priority = getModalPriority();
      state.tasks.push({
        id: generateId(),
        categoryId: cat.id,
        text: text.trim(),
        done: false,
        priority: priority,
        created: Date.now(),
      });
      var tasks = getTasksForCategory(cat.id);
      selectedTaskIndex = tasks.length - 1;
      setStatus("Task added");
      render();
    });
  }

  function deleteTask() {
    var task = getSelectedTask();
    if (!task) return;
    showConfirm("Delete task '" + task.text + "'?", function () {
      var idx = state.tasks.indexOf(task);
      if (idx !== -1) state.tasks.splice(idx, 1);
      var cat = getActiveCategory();
      var tasks = cat ? getTasksForCategory(cat.id) : [];
      selectedTaskIndex = clamp(selectedTaskIndex, 0, Math.max(0, tasks.length - 1));
      setStatus("Task deleted");
      render();
    });
  }

  function toggleTask() {
    var task = getSelectedTask();
    if (!task) return;
    task.done = !task.done;
    setStatus(task.done ? "Task completed" : "Task reopened");
    render();
  }

  function editTask() {
    var task = getSelectedTask();
    if (!task) return;
    showModal("Edit Task", "Task description:", task.text, true, function (text) {
      if (!text.trim()) return;
      task.text = text.trim();
      task.priority = getModalPriority();
      setStatus("Task updated");
      render();
    });
    // Pre-select current priority
    requestAnimationFrame(function () {
      document.querySelectorAll(".priority-btn").forEach(function (btn) {
        btn.classList.toggle("active", btn.getAttribute("data-priority") === task.priority);
      });
    });
  }

  function cyclePriority() {
    var task = getSelectedTask();
    if (!task) return;
    var order = ["low", "medium", "high"];
    var idx = order.indexOf(task.priority);
    task.priority = order[(idx + 1) % order.length];
    setStatus("Priority: " + task.priority);
    render();
  }

  // ── Help Button ─────────────────────────────────────────
  document.getElementById("help-btn").addEventListener("click", function () {
    showHelp();
  });

  // ── Keyboard Navigation ──────────────────────────────────

  document.addEventListener("keydown", function (e) {
    var key = e.key;

    // --- Modal input handling ---
    if (document.getElementById("modal-overlay").classList.contains("visible")) {
      if (key === "Escape") {
        e.preventDefault();
        hideModal();
      } else if (key === "Enter") {
        e.preventDefault();
        var val = document.getElementById("modal-input").value;
        if (modalCallback) modalCallback(val);
        hideModal();
      }
      return; // Don't process other keys when modal is open
    }

    // --- Confirm dialog ---
    if (document.getElementById("confirm-overlay").classList.contains("visible")) {
      if (key === "y" || key === "Y") {
        e.preventDefault();
        if (confirmCallback) confirmCallback();
        hideConfirm();
      } else if (key === "n" || key === "N" || key === "Escape") {
        e.preventDefault();
        hideConfirm();
      }
      return;
    }

    // --- Help dialog ---
    if (document.getElementById("help-overlay").classList.contains("visible")) {
      if (key === "Escape" || key === "?") {
        e.preventDefault();
        hideHelp();
      }
      return;
    }

    // --- Global keys ---
    if (key === "?") {
      e.preventDefault();
      showHelp();
      return;
    }

    // Tab / Shift+Tab to switch panes
    if (key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        focusedPane = (focusedPane + 2) % 3;
      } else {
        focusedPane = (focusedPane + 1) % 3;
      }
      updatePaneFocus();
      return;
    }

    // Number keys to jump to pane
    if (key === "1") { focusedPane = 0; updatePaneFocus(); return; }
    if (key === "2") { focusedPane = 1; updatePaneFocus(); return; }
    if (key === "3") { focusedPane = 2; updatePaneFocus(); return; }

    // --- Pane-specific keys ---
    var cat = getActiveCategory();
    var tasks = cat ? getTasksForCategory(cat.id) : [];

    // Navigation: up/down/j/k
    if (key === "ArrowUp" || key === "k") {
      e.preventDefault();
      if (focusedPane === 0) {
        selectedCategoryIndex = Math.max(0, selectedCategoryIndex - 1);
        selectedTaskIndex = 0;
      } else if (focusedPane === 1 || focusedPane === 2) {
        selectedTaskIndex = Math.max(0, selectedTaskIndex - 1);
      }
      render();
      return;
    }

    if (key === "ArrowDown" || key === "j") {
      e.preventDefault();
      if (focusedPane === 0) {
        selectedCategoryIndex = Math.min(state.categories.length - 1, selectedCategoryIndex + 1);
        selectedTaskIndex = 0;
      } else if (focusedPane === 1 || focusedPane === 2) {
        selectedTaskIndex = Math.min(tasks.length - 1, selectedTaskIndex + 1);
      }
      render();
      return;
    }

    // Enter to focus into tasks from categories
    if (key === "Enter" && focusedPane === 0) {
      e.preventDefault();
      focusedPane = 1;
      selectedTaskIndex = 0;
      render();
      return;
    }

    // 'a' to add
    if (key === "a") {
      e.preventDefault();
      if (focusedPane === 0) {
        addCategory();
      } else {
        addTask();
      }
      return;
    }

    // 'd' to delete
    if (key === "d") {
      e.preventDefault();
      if (focusedPane === 0) {
        deleteCategory();
      } else {
        deleteTask();
      }
      return;
    }

    // 'r' to rename category
    if (key === "r" && focusedPane === 0) {
      e.preventDefault();
      renameCategory();
      return;
    }

    // Space to toggle task
    if (key === " " && (focusedPane === 1 || focusedPane === 2)) {
      e.preventDefault();
      toggleTask();
      return;
    }

    // 'e' to edit task
    if (key === "e" && (focusedPane === 1 || focusedPane === 2)) {
      e.preventDefault();
      editTask();
      return;
    }

    // 'p' to cycle priority
    if (key === "p" && (focusedPane === 1 || focusedPane === 2)) {
      e.preventDefault();
      cyclePriority();
      return;
    }

    // 'q' to deselect / go back
    if (key === "q") {
      e.preventDefault();
      if (focusedPane > 0) {
        focusedPane--;
        updatePaneFocus();
      }
      return;
    }
  });

  // ── Init ─────────────────────────────────────────────────
  render();
  setStatus("Ready \u2500 Press ? for help");
})();
