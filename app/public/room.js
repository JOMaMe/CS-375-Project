const roomCode = new URLSearchParams(window.location.search).get("code");
const roomCodeElement = document.getElementById("room-code");
const connectionStatus = document.getElementById("connection-status");
const playersList = document.getElementById("players");

roomCodeElement.textContent = roomCode ? roomCode.toUpperCase() : "";

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${protocol}//${window.location.host}`);

socket.addEventListener("open", () => {
  connectionStatus.textContent = "Connected. Checking room...";
  socket.send(JSON.stringify({
    type: "join-room",
    code: roomCode
  }));
});

socket.addEventListener("message", (event) => {
  let message;
  try {
    message = JSON.parse(event.data);
  } catch (error) {
    console.error("Received an invalid server message:", error);
    connectionStatus.textContent = "Received an invalid response from the server.";
    return;
  }

  if (message.type === "joined") {
    connectionStatus.textContent = `Joined room ${message.code} as ${message.playerId}.`;
    renderPlayers(message.players);
  } else if (message.type === "players") {
    renderPlayers(message.players);
  } else if (message.type === "error") {
    connectionStatus.textContent = message.message;
  }
});

socket.addEventListener("close", () => {
  if (connectionStatus.textContent === "Connected. Checking room...") {
    connectionStatus.textContent = "Disconnected from the room.";
  }
});

socket.addEventListener("error", (error) => {
  console.error("WebSocket connection error:", error);
  connectionStatus.textContent = "Could not connect to the room.";
});

function renderPlayers(players) {
  playersList.replaceChildren();

  for (const [slot, playerId] of players) {
    const player = document.createElement("li");
    player.textContent = `Player ${slot}: ${playerId}`;
    playersList.append(player);
  }
}