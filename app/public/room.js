const roomCode = new URLSearchParams(window.location.search).get("code");
const roomCodeElement = document.getElementById("room-code");
const connectionStatus = document.getElementById("connection-status");
const playersList = document.getElementById("players");
const startButton = document.getElementById("start");
const waitingRoom = document.querySelector(".waiting-room");
const gameWindow = document.querySelector(".game-window");
let id = "";
let hasJoinedRoom = false;

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
    id = message.playerId;
    const isHost = (message.host === id);
    startButton.hidden = !isHost;
    connectionStatus.textContent = `Joined room ${message.code} as ${(isHost) ? "host" : "player"}.`;
    renderPlayers(message.players);
    hasJoinedRoom = true;
  } else if (message.type === "players") {
    renderPlayers(message.players);
  } else if (message.type === "game-started") {
    startGame();
  }
  else if (message.type === "error") {
    connectionStatus.textContent = message.message;
  }
});

socket.addEventListener("close", () => {
  if (hasJoinedRoom || connectionStatus.textContent === "Connected. Checking room...") {
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
    player.textContent = `Player ${slot}`;

    if (playerId === id) {
      player.textContent += " (You)";
    }
    
    playersList.append(player);
  }
}
function startGame() {
  waitingRoom.hidden = true;
  gameWindow.hidden = false;
}

startButton.addEventListener("click", () => {
  if (socket.readyState !== WebSocket.OPEN) {
    connectionStatus.textContent = "Not connected to the server.";
    return;
  }
  socket.send(JSON.stringify({ type: "start-game" }));
});