const roomCode = new URLSearchParams(window.location.search).get("code");
const roomCodeElement = document.getElementById("room-code");
const connectionStatus = document.getElementById("connection-status");
const playersList = document.getElementById("players");
const startButton = document.getElementById("start");
const waitingRoom = document.getElementById("waiting-room");
const gameWindow = document.querySelector(".game-window");
let id = "";
let hasJoinedRoom = false;
let scenePromise;

roomCodeElement.textContent = roomCode ? roomCode.toUpperCase() : "";

const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
let socket;
let retryAttempt = 0;

function connect() {
  const connection = new WebSocket(`${protocol}//${window.location.host}`);
  socket = connection;
  let serverError = "";

  connection.addEventListener("open", () => {
    connectionStatus.textContent = "Connected. Checking room...";
    connection.send(JSON.stringify({
      type: "join-room",
      code: roomCode
    }));
  });

  connection.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch (error) {
      console.error("Received an invalid server message:", error);
      connectionStatus.textContent = "Received an invalid response from the server.";
      return;
    }

    if (message.type === "joined") {
      const previousId = id;
      const wasReconnecting = hasJoinedRoom;

      id = message.playerId;
      retryAttempt = 0;

      const isHost = message.host === id;
      startButton.hidden = !isHost;
      startButton.disabled = false;
      renderPlayers(message.players);

      if (message.resumed) {
        connectionStatus.textContent = `Reconnected to room ${message.code}.`;
      } else if (wasReconnecting && previousId !== id) {
        connectionStatus.textContent =
          "Your previous session was not restored. You joined as a new player.";
      } else {
        connectionStatus.textContent =
          `Joined room ${message.code} as ${isHost ? "host" : "player"}.`;
      }

      hasJoinedRoom = true;
      if (message.status === 1) {
        startGame();
      }
    } else if (message.type === "players") {
      renderPlayers(message.players);
    } else if (message.type === "game-started") {
      startGame(message.gameState);
    } else if (message.type === "error") {
      serverError = message.message;
      connectionStatus.textContent = serverError;
    }
  });

  connection.addEventListener("close", (event) => {
    startButton.disabled = true;

    if (event.code === 4001) {
      connectionStatus.textContent =
        "This room was opened in another tab. This tab has been disconnected.";
      return;
    }

    if (event.code === 1008) {
      connectionStatus.textContent =
        serverError || "The server rejected the connection.";
      return;
    }

    const baseDelay = Math.min(1000 * (2 ** retryAttempt), 30000);
    const delay = Math.min(30000, baseDelay * (0.8 + Math.random() * 0.4));
    retryAttempt = Math.min(retryAttempt + 1, 5);

    connectionStatus.textContent =
      `Disconnected. Retrying in about ${Math.ceil(delay / 1000)} seconds...`;
    setTimeout(connect, delay);
  });

  connection.addEventListener("error", (error) => {
    console.error("WebSocket connection error:", error);
  });
}

connect();

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
function startGame(gameState) {
  gameWindow.prepend(connectionStatus);
  waitingRoom.hidden = true;
  gameWindow.hidden = false;

  // Initialize after revealing the scene so its container has a size.
  // Cache the promise so reconnects cannot create another canvas.
  if (!scenePromise) {
    const sceneStatus = document.getElementById("scene-status");
    sceneStatus.textContent = "Loading scene...";
    scenePromise = createGameScene(
      document.getElementById("game-scene"),
      sceneStatus,
      document.getElementById("scene-selection")
    ).catch((error) => {
      console.error("Could not load the game scene:", error);
      sceneStatus.textContent = "Could not load the scene. Refresh to try again.";
    });
  }
  // gameState will drive characters and encounters in a later milestone.
}

startButton.addEventListener("click", () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    connectionStatus.textContent = "Not connected to the server.";
    return;
  }
  socket.send(JSON.stringify({ type: "start-game" }));
});