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
  notice: document.querySelector("#notice"),
  roomDialog: document.querySelector("#room-dialog"),
  roomForm: document.querySelector("#room-form"),
  housekeeperDialog: document.querySelector("#housekeeper-dialog"),
  housekeeperForm: document.querySelector("#housekeeper-form")
};

let editingRoomId = null;
let editingHousekeeperId = null;

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
    const assignButton = canAssign
      ? `<button class="action-button" type="button" data-action="assign-room" data-id="${escapeAttribute(room.id)}" ${isBusy ? "disabled" : ""}>${isBusy ? "Assigning…" : "Assign Cleaning"}</button>`
      : "";

    return `<tr>
      <td>${escapeHtml(room.id ?? "—")}</td>
      <td>${escapeHtml(room.roomNumber ?? "—")}</td>
      <td><span class="status-pill status-${escapeAttribute(status.toLowerCase())}">${escapeHtml(status)}</span></td>
      <td><div class="row-actions">
        ${assignButton}
        <button class="action-button action-button--quiet" type="button" data-action="edit-room" data-id="${escapeAttribute(room.id)}">Edit</button>
        <button class="action-button action-button--danger" type="button" data-action="delete-room" data-id="${escapeAttribute(room.id)}">Delete</button>
      </div></td>
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
      <td><div class="row-actions">
        <button class="action-button action-button--quiet" type="button" data-action="edit-housekeeper" data-id="${escapeAttribute(person.id)}">Edit</button>
        <button class="action-button action-button--danger" type="button" data-action="delete-housekeeper" data-id="${escapeAttribute(person.id)}">Delete</button>
      </div></td>
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

function openRoomDialog(room = null) {
  editingRoomId = room?.id ?? null;
  elements.roomForm.reset();
  elements.roomForm.elements.roomNumber.value = room?.roomNumber ?? "";
  elements.roomForm.elements.status.value = room?.status ?? "DIRTY";
  document.querySelector("#room-dialog-title").textContent = room ? "Edit Room" : "Add Room";
  elements.roomDialog.showModal();
}

function openHousekeeperDialog(person = null) {
  editingHousekeeperId = person?.id ?? null;
  elements.housekeeperForm.reset();
  elements.housekeeperForm.elements.name.value = person?.name ?? "";
  elements.housekeeperForm.elements.available.checked = person ? Boolean(person.available) : true;
  document.querySelector("#housekeeper-dialog-title").textContent = person ? "Edit Housekeeper" : "Add Housekeeper";
  elements.housekeeperDialog.showModal();
}

async function saveRoom(event) {
  event.preventDefault();
  const roomNumber = elements.roomForm.elements.roomNumber.value.trim();
  if (!roomNumber) {
    showNotice("Room number cannot be empty.", true);
    return;
  }

  const isEditing = editingRoomId !== null;
  try {
    await request(isEditing ? `/rooms/${encodeURIComponent(editingRoomId)}` : "/rooms", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber, status: elements.roomForm.elements.status.value })
    });
    elements.roomDialog.close();
    await refreshData();
    showNotice(isEditing ? "Room updated successfully." : "Room added successfully.");
  } catch (error) {
    showNotice(error.message || "Could not save the room.", true);
  }
}

async function saveHousekeeper(event) {
  event.preventDefault();
  const name = elements.housekeeperForm.elements.name.value.trim();
  if (!name) {
    showNotice("Housekeeper name cannot be empty.", true);
    return;
  }

  const isEditing = editingHousekeeperId !== null;
  try {
    await request(isEditing ? `/housekeepers/${encodeURIComponent(editingHousekeeperId)}` : "/housekeepers", {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, available: elements.housekeeperForm.elements.available.checked })
    });
    elements.housekeeperDialog.close();
    await refreshData();
    showNotice(isEditing ? "Housekeeper updated successfully." : "Housekeeper added successfully.");
  } catch (error) {
    showNotice(error.message || "Could not save the housekeeper.", true);
  }
}

async function deleteRecord(type, id) {
  const isRoom = type === "room";
  const record = (isRoom ? rooms : housekeepers).find((item) => String(item.id) === String(id));
  const label = isRoom ? `room ${record?.roomNumber ?? id}` : `housekeeper ${record?.name ?? id}`;
  if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

  try {
    await request(`/${isRoom ? "rooms" : "housekeepers"}/${encodeURIComponent(id)}`, { method: "DELETE" });
    await refreshData();
    showNotice(`${isRoom ? "Room" : "Housekeeper"} deleted successfully.`);
  } catch (error) {
    showNotice(error.message || `Could not delete the ${type}.`, true);
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
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const room = rooms.find((item) => String(item.id) === String(button.dataset.id));
  if (button.dataset.action === "assign-room") assignCleaning(button.dataset.id);
  if (button.dataset.action === "edit-room" && room) openRoomDialog(room);
  if (button.dataset.action === "delete-room") deleteRecord("room", button.dataset.id);
});

elements.housekeepersBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const person = housekeepers.find((item) => String(item.id) === String(button.dataset.id));
  if (button.dataset.action === "edit-housekeeper" && person) openHousekeeperDialog(person);
  if (button.dataset.action === "delete-housekeeper") deleteRecord("housekeeper", button.dataset.id);
});

elements.tasksList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-task-id]");
  if (button) inspectTask(button.dataset.taskId, button.dataset.passed === "true");
});

document.querySelector("#add-room-button").addEventListener("click", () => openRoomDialog());
document.querySelector("#add-housekeeper-button").addEventListener("click", () => openHousekeeperDialog());
elements.roomForm.addEventListener("submit", saveRoom);
elements.housekeeperForm.addEventListener("submit", saveHousekeeper);
document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

refreshData().catch((error) => {
  elements.roomCount.textContent = "Unavailable";
  elements.housekeeperCount.textContent = "Unavailable";
  elements.roomsBody.innerHTML = '<tr><td class="empty-cell" colspan="4">Could not load rooms.</td></tr>';
  elements.housekeepersBody.innerHTML = '<tr><td class="empty-cell" colspan="4">Could not load housekeepers.</td></tr>';
  showNotice(error.message || "Could not connect to the backend at localhost:8080.", true);
});
