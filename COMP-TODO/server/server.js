const express = require('express');
const http = require('http');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For development; restrict in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// In-memory stores (replace with DB in production)
const users = {}; // username: { passwordHash }
const rooms = {}; // roomName: { users: { username: points } }

app.use(cors());
app.use(express.json());

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (users[username]) {
    return res.status(400).json({ error: "Username already exists" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users[username] = { passwordHash };
  res.json({ success: true });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user) {
    return res.status(400).json({ error: "Invalid username or password" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: "Invalid username or password" });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ token });
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Create/join room endpoint
app.post('/api/room', authenticateToken, (req, res) => {
  const { roomName } = req.body;
  if (!rooms[roomName]) {
    rooms[roomName] = { users: {} };
  }
  rooms[roomName].users[req.user.username] = 0;
  res.json({ success: true });
});

// Socket.io for real-time competition
io.on('connection', (socket) => {
  let currentRoom = null;
  let currentUser = null;

  socket.on('joinRoom', ({ roomName, username }) => {
    currentRoom = roomName;
    currentUser = username;
    socket.join(roomName);
    if (!rooms[roomName]) rooms[roomName] = { users: {} };
    if (!rooms[roomName].users[username]) rooms[roomName].users[username] = 0;
    io.to(roomName).emit('roomUpdate', rooms[roomName].users);
  });

  socket.on('addPoints', ({ roomName, username, points }) => {
    if (rooms[roomName] && rooms[roomName].users[username] !== undefined) {
      rooms[roomName].users[username] += points;
      io.to(roomName).emit('roomUpdate', rooms[roomName].users);
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && currentUser && rooms[currentRoom]) {
      delete rooms[currentRoom].users[currentUser];
      io.to(currentRoom).emit('roomUpdate', rooms[currentRoom].users);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
