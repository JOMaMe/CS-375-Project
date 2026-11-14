const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

const reconnectTimeout = 5 * 60 * 1000;

const { randomUUID, randomBytes } = require("crypto");
const cookieParser = require("cookie-parser");

app.use(cookieParser());

app.use((req, res, next) => {
  const token = req.cookies.reconnectToken;
  const validToken = typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

  if (!validToken) {
    res.cookie("reconnectToken", randomBytes(32).toString("hex"), {
      httpOnly: true,
      sameSite: "lax",
      secure: req.secure,
      path: "/",
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
  }

  next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());



const RoomState = require("./room-state");
const rooms = new Map();

const http = require("http");

const { WebSocket, WebSocketServer } = require("ws");
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const messageHandlers = new Map([
  ["join-room", handleJoinRoom],
  ["start-game", handleStartGame]
]);

wss.on("connection", (socket, request) => {
  socket.isAlive = true;

  socket.on("pong", () => {
    socket.isAlive = true;
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  const heartbeatInterval = setInterval(() => {
  for (const socket of wss.clients) {
    if (socket.readyState !== WebSocket.OPEN) {
      continue;
    }

    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }

    socket.isAlive = false;
    socket.ping();
  }
}, 30 * 1000);

wss.on("close", () => {
  clearInterval(heartbeatInterval);
});

  cookieParser()(request, null, () => {
    const token = request.cookies.reconnectToken;
    const validToken =
      typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

    if (!validToken) {
      socket.send(JSON.stringify({
        type: "error",
        message: "Missing or invalid reconnect cookie. Reload the page."
      }));
      socket.close(1008, "Missing or invalid reconnect cookie");
      return;
    }

    socket.reconnectToken = token;

    socket.on("message", (data) => {
      if (socket.roomCode && socket.playerId) {
        const room = rooms.get(socket.roomCode);
        const ownsPlayer = room && Array.from(room.players.values()).some(
          (player) => player.id === socket.playerId && player.socket === socket
        );

        if (!ownsPlayer) {
          socket.close(4001, "Replaced by a newer connection");
          return;
        }
      }
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

      reserveDisconnectedPlayer(socket);
    });
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
    // Find this browser's existing player before checking for a free slot.
  let player = Array.from(room.players.values()).find(
    (candidate) => candidate.token === socket.reconnectToken
  );

  // Timers can run late if the server is busy, so check the deadline too.
  if (
    player &&
    player.disconnectedAt !== null &&
    Date.now() - player.disconnectedAt >= reconnectTimeout
  ) {
    clearTimeout(player.expireTimer);
    removePlayerFromRoom(roomCode, player.id);
    player = undefined;

    // Removing the final expired player also deletes the room.
    if (!rooms.has(roomCode)) {
      socket.send(JSON.stringify({
        type: "error",
        message: "Your reservation expired and the room no longer exists."
      }));
      socket.close(1008, "Room no longer exists");
      return;
    }
  }

  const resumed = Boolean(player);

  if (player) {
    clearTimeout(player.expireTimer);

    const previousSocket = player.socket;
    player.socket = socket;
    player.expireTimer = null;
    player.disconnectedAt = null;

    // The new connection owns the player before the old one closes.
    if (previousSocket && previousSocket !== socket) {
      previousSocket.close(4001, "Replaced by a newer connection");
    }
  } else {
    const playerSlot = [1, 2, 3, 4].find(
      (slot) => !room.players.has(slot)
    );

    if (playerSlot === undefined) {
      socket.send(JSON.stringify({ type: "error", message: "Room is full" }));
      socket.close(1008, "Room is full");
      return;
    }

    player = {
      id: randomUUID(),
      token: socket.reconnectToken,
      socket,
      disconnectedAt: null,
      expireTimer: null
    };

    room.players.set(playerSlot, player);

    if (playerSlot === 1) {
      room.host = player.id;
    }
  }

  socket.playerId = player.id;
  socket.roomCode = roomCode;

  socket.send(JSON.stringify({
    type: "joined",
    code: roomCode,
    playerId: player.id,
    host: room.host,
    resumed,
    status: room.status,
    players: publicPlayers(room)
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

function publicPlayers(room) {
  return Array.from(room.players, ([slot, player]) => [slot, player.id]);
}

function broadcastPlayers(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  const message = JSON.stringify({
    type: "players",
    players: publicPlayers(room)
  });

  for (const client of wss.clients) {
    if (client.roomCode === roomCode && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function reserveDisconnectedPlayer(socket) {
  const room = rooms.get(socket.roomCode);
  if (!room) {
    return;
  }

  for (const [slot, player] of room.players) {
    if (player.id !== socket.playerId || player.socket !== socket) {
      continue;
    }

    player.socket = null;
    player.disconnectedAt = Date.now();

    player.expireTimer = setTimeout(() => {
      if (
        rooms.get(socket.roomCode) === room &&
        room.players.get(slot) === player &&
        player.socket === null
      ) {
        removePlayerFromRoom(socket.roomCode, player.id);
      }
    }, reconnectTimeout);

    return;
  }
}

function removePlayerFromRoom(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) {
    return;
  }

  for (const [slot, player] of room.players) {
    if (player.id === playerId) {
      room.players.delete(slot);
      break;
    }
  }

  if (room.players.size === 0) {
    rooms.delete(roomCode);
  } else {
    broadcastPlayers(roomCode);
  }
}
