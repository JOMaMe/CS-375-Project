const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

const RoomState = require("./room-state");
const rooms = new Map();

const http = require("http");
const { randomUUID } = require("crypto");
const { WebSocket, WebSocketServer } = require("ws");
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const messageHandlers = new Map([
  ["join-room", handleJoinRoom],
  ["start-game", handleStartGame]
]);

wss.on("connection", (socket) => {
  socket.on("message", (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch (error) {
      socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      socket.close(1008, "Invalid message format");
      return;
    }

    if (!message || typeof message !== "object" || typeof message.type !== "string") {
      socket.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
      return;
    }

    const handler = messageHandlers.get(message.type);
    if (!handler) {
      socket.send(JSON.stringify({ type: "error", message: `Unsupported message type: ${message.type}` }));
      return;
    }

    handler(socket, message);
  });

  socket.on("close", () => {
    if (!socket.roomCode || !socket.playerId) {
      return;
    }

    const room = rooms.get(socket.roomCode);
    if (room) {
      for (const [slot, playerId] of room.players) {
        if (playerId === socket.playerId) {
          room.players.delete(slot);
          break;
        }
      }
      broadcastPlayers(socket.roomCode);
    }
  });
});


// ---------------------------
// WEBSOCKET MESSAGE HANDLERS
// ---------------------------

function handleJoinRoom(socket, message) {
  const codeValidation = validateCode(message.code);
  if (!codeValidation.valid && codeValidation.reason === "format") {
    socket.send(JSON.stringify({ type: "error", message: "Invalid room join request" }));
    socket.close(1008, "Invalid room join request");
    return;
  }
  if (!codeValidation.valid) {
    socket.send(JSON.stringify({ type: "error", message: "Room does not exist" }));
    socket.close(1008, "Room does not exist");
    return;
  }
  const roomCode = codeValidation.code;

  if (socket.roomCode) {
    socket.send(JSON.stringify({ type: "error", message: "This connection has already joined a room" }));
    return;
  }

  const room = rooms.get(roomCode);
  const playerSlot = [1, 2, 3, 4].find((slot) => !room.players.has(slot));
  if (playerSlot === undefined) {
    socket.send(JSON.stringify({ type: "error", message: "Room is full" }));
    socket.close(1008, "Room is full");
    return;
  }

  const playerId = randomUUID();
  socket.playerId = playerId;
  socket.roomCode = roomCode;
  room.players.set(playerSlot, playerId);
  if (playerSlot === 1) {
    room.host = playerId;
  }
  socket.send(JSON.stringify({
    type: "joined",
    code: roomCode,
    playerId,
    host: room.host,
    players: Array.from(room.players.entries())
  }));
  broadcastPlayers(roomCode);
}

function handleStartGame(socket) {
  const room = rooms.get(socket.roomCode);
  if (!room || !socket.playerId) {
    socket.send(JSON.stringify({ type: "error", message: "Join a room before starting the game" }));
    return;
  }
  if (socket.playerId !== room.host) {
    socket.send(JSON.stringify({ type: "error", message: "Only the host can start the game" }));
    return;
  }

  room.status = 1;
  const message = JSON.stringify({ type: "game-started" });
  for (const client of wss.clients) {
    if (client.roomCode === socket.roomCode && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}


// ---------------------------
// REQUESTS
// ---------------------------

app.get("/code", (req, res) => {
  if (!req.query.code) {
    return res.status(400).send("Code is empty");
  }
  const codeValidation = validateCode(req.query.code);
  if (!codeValidation.valid && codeValidation.reason === "format") {
    return res.status(400).send("Not a valid code format");
  }
  if (codeValidation.valid) {
    return res.status(200).send(codeValidation.code);
  }
  res.status(404).send(`Code ${codeValidation.code} is invalid`);
});

app.post("/new-code", (req, res) => {
  let code;
  do {
    code = Array.from({ length: 4 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join("");
  } while (rooms.has(code));

  rooms.set(code, new RoomState());
  res.status(200).send(code);
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


// ---------------------------
// HELPER FUNCTIONS
// ---------------------------

function validateCode(code) {
  if (typeof code !== "string" || !/^[A-Za-z]{4}$/.test(code)) {
    return { valid: false, reason: "format" };
  }

  const normalizedCode = code.toUpperCase();
  if (!rooms.has(normalizedCode)) {
    return { valid: false, reason: "not-found", code: normalizedCode };
  }

  return { valid: true, code: normalizedCode };
}

function broadcastPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  const message = JSON.stringify({
    type: "players",
    players: Array.from(room.players.entries())
  });

  for (const client of wss.clients) {
    if (client.roomCode === roomCode && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
