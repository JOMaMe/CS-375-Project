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

function broadcastPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  const message = JSON.stringify({
    type: "players",
    players: Array.from(room.players)
  });

  for (const client of wss.clients) {
    if (client.roomCode === roomCode && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

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

    if (
      !message ||
      message.type !== "join-room" ||
      typeof message.code !== "string" ||
      !/^[A-Za-z]{4}$/.test(message.code)
    ) {
      socket.send(JSON.stringify({ type: "error", message: "Invalid room join request" }));
      socket.close(1008, "Invalid room join request");
      return;
    }

    const roomCode = message.code.toUpperCase();
    if (!rooms.has(roomCode)) {
      socket.send(JSON.stringify({ type: "error", message: "Room does not exist" }));
      socket.close(1008, "Room does not exist");
      return;
    }

    if (socket.roomCode) {
      socket.send(JSON.stringify({ type: "error", message: "This connection has already joined a room" }));
      return;
    }

    const playerId = randomUUID();
    socket.playerId = playerId;
    socket.roomCode = roomCode;
    rooms.get(roomCode).players.add(playerId);
    socket.send(JSON.stringify({
      type: "joined",
      code: roomCode,
      playerId,
      players: Array.from(rooms.get(roomCode).players)
    }));
    broadcastPlayers(roomCode);
  });

  socket.on("close", () => {
    if (!socket.roomCode || !socket.playerId) {
      return;
    }

    const room = rooms.get(socket.roomCode);
    if (room) {
      room.players.delete(socket.playerId);
      broadcastPlayers(socket.roomCode);
    }
  });
});

app.get("/code", (req, res) => {
  if (!req.query.code) {
    return res.status(400).send("Code is empty");
  }
  const code = req.query.code;
  if (typeof code !== "string" || !/^[A-Za-z]{4}$/.test(code)) {
    return res.status(400).send("Not a valid code format");
  }

  const normalizedCode = code.toUpperCase();
  if (rooms.has(normalizedCode)) {
    return res.status(200).send(normalizedCode);
  }
  res.status(404).send(`Code ${normalizedCode} is invalid`);
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
