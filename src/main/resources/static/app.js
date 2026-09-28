const API_BASE = "http://localhost:8080";

let rooms = [];
let housekeepers = [];
let cleaningTasks = [];
const busyRooms = new Set();
const busyTasks = new Set();

const elements = {
  totalRooms: document.querySelector("#total-rooms"),
  dirtyRooms: document.querySelector("#dirty-rooms"),
  availableHousekeepers: document.querySelector("#available-housekeepers"),
  roomCount: document.querySelector("#room-count"),
  housekeeperCount: document.querySelector("#housekeeper-count"),
  roomsBody: document.querySelector("#rooms-body"),
  housekeepersBody: document.querySelector("#housekeepers-body"),
  tasksList: document.querySelector("#tasks-list"),
  notice: document.querySelector("#notice")
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const text = await response.text();
  let result = text;

  if (text) {
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }
  }

  if (!response.ok) {
    const detail = typeof result === "object"
      ? result.message || result.error || result.detail
      : result;
    throw new Error(detail || `Request failed (${response.status})`);
  }

  return result;
}

function showNotice(message, isError = false) {
  elements.notice.textContent = message;
  elements.notice.classList.toggle("notice--error", isError);
  elements.notice.hidden = false;
}

function renderSummary() {
  elements.totalRooms.textContent = rooms.length;
  elements.dirtyRooms.textContent = rooms.filter((room) => room.status === "DIRTY").length;
  elements.availableHousekeepers.textContent = housekeepers.filter((person) => person.available).length;
}

function renderRooms() {
  elements.roomCount.textContent = `${rooms.length} ${rooms.length === 1 ? "room" : "rooms"}`;

  if (rooms.length === 0) {
    elements.roomsBody.innerHTML = '<tr><td class="empty-cell" colspan="4">No rooms found.</td></tr>';
    return;
  }

  elements.roomsBody.innerHTML = rooms.map((room) => {
    const status = String(room.status || "UNKNOWN").toUpperCase();
    const canAssign = status === "DIRTY";
    const isBusy = busyRooms.has(String(room.id));
    const button = canAssign
      ? `<button class="action-button" type="button" data-room-id="${escapeAttribute(room.id)}" ${isBusy ? "disabled" : ""}>${isBusy ? "Assigning…" : "Assign Cleaning"}</button>`
      : "";

    return `<tr>
      <td>${escapeHtml(room.id ?? "—")}</td>
      <td>${escapeHtml(room.roomNumber ?? "—")}</td>
      <td><span class="status-pill status-${escapeAttribute(status.toLowerCase())}">${escapeHtml(status)}</span></td>
      <td>${button}</td>
    </tr>`;
  }).join("");
}

function renderHousekeepers() {
  elements.housekeeperCount.textContent = `${housekeepers.length} ${housekeepers.length === 1 ? "person" : "people"}`;

  if (housekeepers.length === 0) {
    elements.housekeepersBody.innerHTML = '<tr><td class="empty-cell" colspan="3">No housekeepers found.</td></tr>';
    return;
  }

  elements.housekeepersBody.innerHTML = housekeepers.map((person) => {
    const available = Boolean(person.available);
    const label = available ? "Available" : "Busy";
    return `<tr>
      <td>${escapeHtml(person.id ?? "—")}</td>
      <td>${escapeHtml(person.name ?? "—")}</td>
      <td><span class="availability-pill availability-${available ? "yes" : "no"}">${label}</span></td>
    </tr>`;
  }).join("");
}

function renderTasks() {
  if (cleaningTasks.length === 0) {
    elements.tasksList.innerHTML = '<p class="empty-state">No cleaning tasks have been assigned in this session.</p>';
    return;
  }

  elements.tasksList.innerHTML = [...cleaningTasks].reverse().map((task) => {
    const roomNumber = task.room?.roomNumber ?? "—";
    const housekeeperName = task.housekeeper?.name ?? "—";
    const result = task.inspection;
    let actions = "";

    if (result) {
      const passed = result.passed === true;
      actions = `<span class="inspection-result inspection-result--${passed ? "pass" : "fail"}">${passed ? "Passed" : "Failed"}</span>`;
    } else {
      const isBusy = busyTasks.has(String(task.id));
      actions = `<button class="inspect-button" type="button" data-task-id="${escapeAttribute(task.id)}" data-passed="true" ${isBusy ? "disabled" : ""}>Pass</button>
        <button class="inspect-button inspect-button--fail" type="button" data-task-id="${escapeAttribute(task.id)}" data-passed="false" ${isBusy ? "disabled" : ""}>Fail</button>`;
    }

    return `<article class="task-row">
      <div>
        <p class="task-title">Task #${escapeHtml(task.id ?? "—")} · Room ${escapeHtml(roomNumber)}</p>
        <p class="task-meta">Assigned to ${escapeHtml(housekeeperName)}</p>
      </div>
      <div class="task-actions">${actions}</div>
    </article>`;
  }).join("");
}

function renderAll() {
  renderSummary();
  renderRooms();
  renderHousekeepers();
  renderTasks();
}

async function refreshData() {
  const [roomData, housekeeperData] = await Promise.all([
    request("/rooms"),
    request("/housekeepers")
  ]);

  if (!Array.isArray(roomData) || !Array.isArray(housekeeperData)) {
    throw new Error("The API returned data in an unexpected format.");
  }

  rooms = roomData;
  housekeepers = housekeeperData;
  renderAll();
}

async function assignCleaning(roomId) {
  busyRooms.add(String(roomId));
  renderRooms();

  try {
    const task = await request(`/housekeeping/rooms/${encodeURIComponent(roomId)}/clean`, { method: "POST" });
    cleaningTasks.push({ ...task, inspection: null });
    renderTasks();
    await refreshData();
    showNotice(`Cleaning task #${task.id} assigned for room ${task.room?.roomNumber ?? roomId}.`);
  } catch (error) {
    showNotice(error.message || "Could not assign cleaning.", true);
  } finally {
    busyRooms.delete(String(roomId));
    renderRooms();
  }
}

async function inspectTask(taskId, passed) {
  busyTasks.add(String(taskId));
  renderTasks();

  try {
    const result = await request(`/housekeeping/tasks/${encodeURIComponent(taskId)}/inspect?passed=${passed}`, { method: "POST" });
    const task = cleaningTasks.find((item) => String(item.id) === String(taskId));
    if (task) task.inspection = { ...result, passed };
    renderTasks();
    await refreshData();
    showNotice(`Task #${taskId} inspection recorded: ${passed ? "Passed" : "Failed"}.`);
  } catch (error) {
    showNotice(error.message || "Could not record the inspection.", true);
  } finally {
    busyTasks.delete(String(taskId));
    renderTasks();
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

elements.roomsBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-room-id]");
  if (button) assignCleaning(button.dataset.roomId);
});

elements.tasksList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-task-id]");
  if (button) inspectTask(button.dataset.taskId, button.dataset.passed === "true");
});

refreshData().catch((error) => {
  elements.roomCount.textContent = "Unavailable";
  elements.housekeeperCount.textContent = "Unavailable";
  elements.roomsBody.innerHTML = '<tr><td class="empty-cell" colspan="4">Could not load rooms.</td></tr>';
  elements.housekeepersBody.innerHTML = '<tr><td class="empty-cell" colspan="3">Could not load housekeepers.</td></tr>';
  showNotice(error.message || "Could not connect to the backend at localhost:8080.", true);
});
