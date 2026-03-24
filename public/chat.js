/* global-chat client-side logic */
(function () {
  'use strict';

  const socket = io();

  let currentUser = '';

  const joinForm       = document.getElementById('join-form');
  const usernameInput  = document.getElementById('username-input');
  const joinBtn        = document.getElementById('join-btn');
  const chatContainer  = document.getElementById('chat-container');
  const messagesEl     = document.getElementById('messages');
  const messageForm    = document.getElementById('message-form');
  const messageInput   = document.getElementById('message-input');

  /* ── Helpers ─────────────────────────────────────────────────────────────── */
  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  /* ── Render helpers ──────────────────────────────────────────────────────── */
  function appendSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function appendChatMessage(entry) {
    const isOwn = entry.username === currentUser;
    const wrapper = document.createElement('div');
    wrapper.className = 'message' + (isOwn ? ' own' : '');

    const meta = document.createElement('span');
    meta.className = 'message-meta';
    meta.textContent = isOwn
      ? formatTime(entry.time)
      : `${entry.username} · ${formatTime(entry.time)}`;

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    bubble.textContent = entry.text;   // textContent handles XSS safely

    wrapper.appendChild(meta);
    wrapper.appendChild(bubble);
    messagesEl.appendChild(wrapper);
    scrollToBottom();
  }

  /* ── Join ────────────────────────────────────────────────────────────────── */
  function join() {
    const name = usernameInput.value.trim().slice(0, 30);
    if (!name) {
      usernameInput.focus();
      return;
    }
    currentUser = name;
    socket.emit('join', name);
    joinForm.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    messageInput.focus();
  }

  joinBtn.addEventListener('click', join);
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') join();
  });

  /* ── Send message ────────────────────────────────────────────────────────── */
  messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text) return;
    socket.emit('chat message', text);
    messageInput.value = '';
    messageInput.focus();
  });

  /* ── Socket events ───────────────────────────────────────────────────────── */
  socket.on('chat history', (history) => {
    history.forEach(appendChatMessage);
  });

  socket.on('chat message', (entry) => {
    appendChatMessage(entry);
  });

  socket.on('system message', (text) => {
    appendSystemMessage(text);
  });
}());
