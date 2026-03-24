const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});

app.get('/', limiter, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

const MAX_HISTORY = 100;
const chatHistory = [];

io.on('connection', (socket) => {
  // Send existing chat history to the newly connected user
  socket.emit('chat history', chatHistory);

  socket.on('join', (username) => {
    socket.username = username;
    io.emit('system message', `${username} joined the chat`);
  });

  socket.on('chat message', (msg) => {
    const username = socket.username || 'Anonymous';
    const sanitized = String(msg).slice(0, 500);
    const entry = { username, text: sanitized, time: new Date().toISOString() };
    chatHistory.push(entry);
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift();
    }
    io.emit('chat message', entry);
  });

  socket.on('disconnect', () => {
    if (socket.username) {
      io.emit('system message', `${socket.username} left the chat`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
