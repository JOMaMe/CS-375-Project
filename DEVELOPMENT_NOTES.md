# Development notes

## How I want to work on this

I want to learn how to write and implement this code myself. I am using the
assistant for guidance, explaining things, and reviewing what I write, but I
don't want it writing the actual game code for me. I also want to keep this
file updated as we go along so I can keep track of our progress and ideas.

I'll keep things we have actually finished separate from things we are still
planning or talking about.

## 2026-10-31: First-week planning

### How we are splitting the work

For the first week, my partner is looking into websockets, particularly the
Socket.IO implementation, and I am going to undertake client side rendering.
We both want to learn how to code and implement our parts as we go.

We don't plan on implementing a database for user accounts. We have talked
about perhaps using a unique token for reconnecting edge cases in a multiplayer
game, but we still need to figure out how that would work.

### Where the project started before my rendering work

- Express serves files from `app/public/`; `npm start` starts the application.
- `app/public/index.html` contains room controls and inline browser JavaScript.
- `app/public/style.css` contains the current styles.
- `GET /get-new-code` creates and stores a room code in server memory.
- `GET /get-code` validates a code and checks whether it exists. It does not
  currently register a player as joining a room.
- No multiplayer transport or rendered player roster is implemented yet.
- Entity class sketches exist under `app/scripts/entities/`.
- I now have a local branch, `feature/client-rendering`, created from `main`
  for working on my part.
- At that point, I had only set up the branch and notes. My implementation
  progress is recorded in the first check-in section below.

### What I can start with for rendering

The suggested first step is making a waiting-room lobby using sample data.
That way I can work on displaying the room while my partner works on the
websocket side, then we can connect our parts once we agree on the data format.

1. Figure out what I want the lobby to show, like the room code, player names,
   connection status, and a waiting message.
2. Make the HTML structure for that lobby and give the elements IDs I can use
   from JavaScript.
3. Move the existing room-control JavaScript out of the HTML and into its own
   file under `app/public/`, keeping it working the same way.
4. Make some sample room data and write a function that updates the lobby
   based on that data.
5. Check how it looks with no players, one player, four players, and someone
   disconnected. I should also check that displaying the same data twice
   doesn't duplicate the players.
6. Agree with my partner on what a room update contains so I can eventually
   pass the server updates into that same function.

This was my initial plan. I worked on the lobby first; the first check-in
section below records what I implemented. Moving JavaScript to its own file
and connecting live player updates are still future work.

### Things I still need to talk about with my partner

- We need to agree on the room and player field names, player IDs, event names,
  and error responses so our parts can work together.
- As far as I know, we need to readjust room creation to use POST instead of
  GET, but that might not be my role for the time being. Whoever handles it
  needs to update both the server route and the browser request. Right now
  checking a room code doesn't actually add a player to the room.
- If we use a reconnect token, we need to decide how long it lasts, where the
  browser stores it, how the server checks it, and what happens if the server
  restarts. The room code tells us which room to join, but it doesn't identify
  which player is reconnecting.
- The server should decide what actually happens in the game. My client code
  should display the information that the server sends for that player.
- For the imposter map, we can't just send it to everyone and hide it on the
  page. Only the imposter should receive that information.
- We need to clarify whether starting requires four players. REQUIREMENTS.md
  says four are required but also leaves starting with fewer as an open question.
- The checked boxes in PROJECT_PROPOSAL.md are planned features, so I shouldn't
  treat them as things we have already built.

## First check-in: my client side rendering contribution

I am stopping at a small home-to-lobby flow for this first check-in. I wrote
the implementation myself with explanations and sample code for guidance.
My work is in `app/public/index.html` on `feature/client-rendering`.

### What I implemented

- I grouped the existing host/join controls into `home-screen`.
- I added a waiting-room container, `lobby`, with a room-code display and an
  adventurer list. It starts hidden, so the home controls show first.
- I made sample player objects with `id`, `name`, and `connected` fields.
  These are practice data, not players actually connected to the server.
- I wrote `renderRoomCode(code)` to update the room-code span.
- I wrote `renderPlayerList(players)` to build a list of player names and
  Connected/Disconnected text from an array.
- I wrote `renderRoom(room)` to call those two rendering functions together.
- I wrote `showLobby()` to hide the home screen and show the lobby.
- I connected the successful host and room-code-check responses to
  `renderRoom` and `showLobby`. The room code comes from the server, while
  the player list still comes from my sample data.
- I removed the initial sample-room rendering call, so I don't show a fake
  room code on page load anymore.
- I kept the existing request error handling. Failed requests show a message
  on the home screen instead of opening the lobby.
- I added text explaining that the roster is a sample and live multiplayer
  isn't implemented yet.

### What client side rendering means in my code

The HTML gives me places to put information. JavaScript takes data and
updates those places in the browser without refreshing the whole page.
The browser's representation of the HTML is called the DOM.

My current flow is:

1. I click Host Room or Join Room.
2. The existing click handler sends a request using `fetch`.
3. The response body is read as text. A failed HTTP response throws an error
   and goes to the existing `.catch` handler.
4. On success, I pass an object containing the returned code and sample
   players into `renderRoom`.
5. The rendering functions update the DOM, and `showLobby` switches screens.

For reference, this is the data shape my renderer currently expects:

```js
{
  code: "ABCD",
  players: [
    { id: "player1", name: "Jose", connected: true },
    { id: "player2", name: "Haig", connected: false }
  ]
}
```

This is my current client format, not an agreed Socket.IO event contract yet.
The `id` fields are included in the sample data but aren't used by my renderer
to track players yet.

### JavaScript and HTML things I can reference later

| Thing I used | What it does in my implementation |
|---|---|
| `id` and `getElementById` | Let JavaScript find a specific HTML element. |
| `const` holding an element | Keeps a reference to the element; I can still change its text. |
| `textContent` | Updates an element's text without treating the supplied string as HTML. |
| Function parameters | Let me reuse the same rendering code with different data. |
| Objects and arrays | Describe one room and a list of players. |
| `for...of` | Goes through each player in the array. |
| `connected ? "Connected" : "Disconnected"` | Chooses status text based on a boolean. |
| `replaceChildren()` | Clears the previous player list before rebuilding it. |
| `createElement("li")` | Creates a list item in memory. |
| `appendChild` | Adds that item to the player list in the document. |
| `hidden` | Controls whether a screen is visible. |

I clear the player list each time so another render replaces the display
instead of adding duplicate players. `renderRoom` updates the content, while
`showLobby` handles which screen is visible.

### Why I used one HTML page

For now, home and lobby are two sections of the same document. This lets me
practice rendering and screen switching without adding page navigation and
restoring room context. Later, it also lets a multiplayer connection stay
open while I switch between lobby, exploration, and battle screens.
I can still move the JavaScript into separate files without making separate
HTML pages.

### What this first check-in does and doesn't include

I have implemented the client home-to-lobby flow and a reusable sample-roster
display. I am treating that as my contribution for this first check-in.
The latest source was reviewed, but browser test results haven't been
recorded here yet.

The server still only creates and checks room codes. Checking a code doesn't
register a player, even though the current success message says "Joining room".
The roster and its connection statuses are sample values, not live socket
status. I haven't implemented accounts, reconnect tokens, starting a run,
dungeon rendering, or combat rendering as part of this milestone.

One detail for a later cleanup: my message div is currently inside the home
screen, so the Hosting/Joining success text becomes hidden when I show the
lobby. The room code is still visible in the lobby. If I want shared messages
visible on both screens, I can move that div outside both containers.

### Browser checks for my demo

I can run `npm start` from the project folder and open `http://localhost:3000`.
These are checks to run, not recorded passing results:

- Refresh: home controls show and the lobby is hidden.
- Submit an empty or malformed code: an error shows and the home stays visible.
- Host a room: the lobby shows the returned code and the two sample players.
- Refresh and enter that code while the same server is running: the lobby
  opens with the same code.
- Submit a correctly formatted code that doesn't exist: an error shows.
- Temporarily render the same room twice: the list still has two players.
- Try an empty player array and a four-player array to check the list rendering.

### What comes after this check-in

I need to agree with my partner on the room data and socket events, then pass
real room updates into my rendering functions instead of sample players.
We also still need to discuss player names, class selection, ready buttons,
and who starts the game. Moving my browser JavaScript into its own file is
a possible next cleanup, and dungeon/combat screens can come later.


## 2026-11-07: Main branch review and next tasks

The earlier entries describe my first check-in, not the current implementation.
We fetched origin and fast-forwarded local main to `fc816ac`. My original
`feature/client-rendering` branch remains at `91e55a8`; that commit is an
ancestor of current main. No game implementation was changed during this review.

Haig has since moved browser requests to `index.js`, added native WebSockets
using `ws` (not Socket.IO), and moved the lobby to `room.html` / `room.js`.
The sample lobby in my old `index.html` was replaced by this flow. Main also
has a static rendering window with background, character, and VFX layers.
My reusable rendering approach still fits, but now belongs on the room page.

The server uses POST `/new-code` and GET `/code?code=ABCD`. Those HTTP requests
create/check a room; the room page's `join-room` socket message adds the player.
Live rosters are arrays of `[slot, playerId]` pairs, not my old array of named
player objects. Names, retained disconnected players, and reconnect identity
are not implemented. The server removes a player when their socket closes.

See [TASKS.md](TASKS.md) for a proposed split between my rendering work and
Haig's server/game-state work, integration boundaries, and completion checks.
The split is a proposal for us to agree on, not work already assigned or done.
I still want guidance and review while writing the game code myself.
