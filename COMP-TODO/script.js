const API_URL = "http://localhost:3001";
let token = null;
let username = null;
let roomName = null;
let socket = null;
let points = 0;

// DOM Elements
const authSection = document.getElementById("auth-section");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const authMessage = document.getElementById("auth-message");

const roomSection = document.getElementById("room-section");
const roomForm = document.getElementById("room-form");
const roomInput = document.getElementById("room-name");
const roomMessage = document.getElementById("room-message");

const gameSection = document.getElementById("game-section");
const pointsSection = document.getElementById("points-section");
const pointsDisplay = document.getElementById("points");
const userList = document.getElementById("user-list");
const logoutBtn = document.getElementById("logout-btn");

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");

// --- Auth Handlers ---
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const regUser = document.getElementById("register-username").value.trim();
  const regPass = document.getElementById("register-password").value;
  try {
    const res = await fetch(API_URL + "/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: regUser, password: regPass }),
    });
    const data = await res.json();
    if (data.success) {
      authMessage.textContent = "Registration successful! Please log in.";
      registerForm.reset();
    } else {
      authMessage.textContent = data.error || "Registration failed.";
    }
  } catch {
    authMessage.textContent = "Registration error.";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const logUser = document.getElementById("login-username").value.trim();
  const logPass = document.getElementById("login-password").value;
  try {
    const res = await fetch(API_URL + "/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: logUser, password: logPass }),
    });
    const data = await res.json();
    if (data.token) {
      token = data.token;
      username = logUser;
      showRoomSection();
    } else {
      authMessage.textContent = data.error || "Login failed.";
    }
  } catch {
    authMessage.textContent = "Login error.";
  }
});

// --- Room Handlers ---
roomForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const room = roomInput.value.trim();
  if (!room) return;
  try {
    const res = await fetch(API_URL + "/api/room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ roomName: room }),
    });
    const data = await res.json();
    if (data.success) {
      roomName = room;
      showGameSection();
      connectSocket();
    } else {
      roomMessage.textContent = data.error || "Room join failed.";
    }
  } catch {
    roomMessage.textContent = "Room join error.";
  }
});

// --- UI State Management ---
function showRoomSection() {
  authSection.style.display = "none";
  roomSection.style.display = "";
  gameSection.style.display = "none";
  pointsSection.style.display = "none";
  roomMessage.textContent = "";
}

function showGameSection() {
  authSection.style.display = "none";
  roomSection.style.display = "none";
  gameSection.style.display = "";
  pointsSection.style.display = "";
  points = 0;
  updatePoints();
  taskList.innerHTML = "";
  userList.innerHTML = "";
}

logoutBtn.addEventListener("click", () => {
  token = null;
  username = null;
  roomName = null;
  if (socket) socket.disconnect();
  showAuthSection();
});

function showAuthSection() {
  authSection.style.display = "";
  roomSection.style.display = "none";
  gameSection.style.display = "none";
  pointsSection.style.display = "none";
  authMessage.textContent = "";
  registerForm.reset();
  loginForm.reset();
}

// --- Socket.io Real-time ---
function connectSocket() {
  if (socket) socket.disconnect();
  socket = io(API_URL);

  socket.on("connect", () => {
    socket.emit("joinRoom", { roomName, username });
  });

  socket.on("roomUpdate", (users) => {
    updateLeaderboard(users);
  });
}

// --- Leaderboard ---
function updateLeaderboard(users) {
  userList.innerHTML = "";
  // Sort users by points descending
  const sorted = Object.entries(users).sort((a, b) => b[1] - a[1]);
  for (const [user, pts] of sorted) {
    const li = document.createElement("li");
    li.textContent = user + ": " + pts + " pts";
    if (user === username) li.style.fontWeight = "bold";
    userList.appendChild(li);
  }
}

// --- Task Logic ---
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const taskText = taskInput.value.trim();
  if (taskText !== "") {
    addTask(taskText);
    taskInput.value = "";
  }
});

function addTask(text) {
  const li = document.createElement("li");
  li.className = "task-item";

  const desc = document.createElement("span");
  desc.className = "task-desc";
  desc.textContent = text;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const completeBtn = document.createElement("button");
  completeBtn.className = "complete-btn";
  completeBtn.textContent = "Complete";
  completeBtn.addEventListener("click", () => {
    completeTask(li);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => {
    deleteTask(li);
  });

  actions.appendChild(completeBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(desc);
  li.appendChild(actions);

  taskList.appendChild(li);
}

function completeTask(taskElement) {
  taskElement.classList.add("completed");
  setTimeout(() => {
    taskElement.remove();
    points += 10;
    updatePoints();
    if (socket && roomName && username) {
      socket.emit("addPoints", { roomName, username, points: 10 });
    }
  }, 200);
}

function deleteTask(taskElement) {
  taskElement.remove();
}

function updatePoints() {
  pointsDisplay.textContent = points;
}

// --- On Load ---
showAuthSection();
