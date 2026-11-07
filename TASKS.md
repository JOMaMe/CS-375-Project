# Next work: rendering and multiplayer integration

Proposed on 2026-11-07 against main `fc816ac`. Jose owns client rendering;
Haig owns server, transport, and authoritative game state.

## Current baseline

- Host/join requests redirect to `room.html?code=...`.
- Native WebSockets register a player and broadcast room-scoped rosters.
- Four slots are enforced; closing a socket removes its roster entry.
- Room rendering has background, character, and VFX layers, but the scene is static.
- Game-state and engine files are sketches; gameplay is not connected to sockets.
- The old rendering branch is already an ancestor of main. Start new work from
  current main rather than copying its old homepage over the new lobby flow.

## First handoff: agree on the interface

- [ ] **Both — T0: Record the next message/state contract before extending it.**
  Current browser request: `{ type: "join-room", code: "ABCD" }`.
  Current success: `{ type: "joined", code, playerId, players }`.
  Current roster update: `{ type: "players", players }`.
  Current error: `{ type: "error", message }`.
  `players` is an array such as `[[1, "uuid-a"], [3, "uuid-b"]]`;
  slots can have gaps. Use the UUID for identity and the slot for placement.
  Decide together how names, connection flags, host identity, room phase,
  character data, and start/action requests will be represented. These fields
  and messages do not exist yet. Keep shared state separate from private data.
  **Done when:** both can describe one example lobby and one example scene
  payload, including which fields each client is allowed to receive.

## Jose: client rendering tasks

- [ ] **J1 — Adapt the reusable lobby renderer to the live room page.**
  Work in `app/public/room.js` and `room.html`. Keep the existing WebSocket
  messages and route changes. Separate rendering functions from event handling;
  use `textContent` and replace the roster on each update. Show Player 1–4
  until real names are supported; identify the local player from `joined.playerId`.
  Do not invent names or disconnected statuses from missing server fields.
  **Done when:** repeated updates produce no duplicates, nonconsecutive slots
  display correctly, and joining/leaving updates the visible roster.

- [ ] **J2 — Make connection and error status reliable.**
  Coordinate with H1 over the socket listeners in `room.js`. A successful join
  currently leaves the status saying Joined after a later close: the close
  handler changes text only while it says Checking room. Show a disconnection
  after a successful join while preserving useful rejection errors such as
  Room is full. Restore an accessible status region on the homepage as well.
  **Done when:** stop the server after joining and see a clear lost-connection
  message; missing/full rooms still show their specific errors.

- [ ] **J3 — Prepare the layered scene for data-driven rendering.**
  Work in `room.html`, `room.css`, and a separate renderer file if useful.
  Replace duplicate `id="peter"` attributes with reusable classes and stable
  per-character identity. Remove the empty VFX image source. Keep background,
  characters, and effects as separate layers; make the viewport fit smaller
  screens. Any script accessing scene elements must run after they exist.
  Use explicit development fixtures until H3 provides real snapshots.
  **Done when:** zero, one, and four fixture characters render; re-rendering
  updates/removes characters without duplicates; the scene fits the viewport.

- [ ] **J4 — Render the first server-driven exploration state.**
  Depends on T0, J3, and H3. Display the current location, party, navigator,
  and allowed directions using the agreed public snapshot. Controls send
  requested actions; the server update determines the displayed result.
  **Done when:** two clients show the same accepted move and turn owner;
  an unauthorized move shows an error without moving the local scene.

## Haig: server and game-state tasks

- [ ] **H1 — Define session and reconnect behavior.**
  Work primarily in `server.js` and `room-state.js`; coordinate any browser
  socket edits with J2. Decide whether a lost session can resume, how long its
  slot is reserved, and how explicit leave differs from connection loss.
  Implement the matching identity validation and client retry flow together.
  Avoid counting a reconnect as a new player or repeatedly retrying full rooms.
  **Done when:** temporary loss visibly reconnects or clearly reports a new
  session, capacity remains correct, and other players keep receiving updates.

- [ ] **H2 — Add authoritative lobby/start rules.**
  The `host` field is currently empty and `status` has no implemented lifecycle.
  Agree whether four players are required: REQUIREMENTS.md currently requires
  four but also lists fewer-player starts as an open question. Assign host
  identity, validate the start request, and broadcast the agreed phase.
  Names/classes/ready controls should follow an agreed requirement, not be
  assumed prerequisites. Jose adds their presentation once the contract exists.
  **Done when:** valid starts work once and unauthorized/invalid starts fail
  without changing state.

- [ ] **H3 — Wire one playable exploration step.**
  Work in `game-state.js`, `scripts/game-engine/`, and entity classes.
  Fix the sketches before wiring them: `GameState` is not exported,
  `addEnemy` calls push on an object containing front/back arrays,
  `Fighter` still extends the removed `Player` class, and dungeon generation
  currently returns no grid. Initialize the run, resolve one legal direction,
  rotate the navigator, and send the agreed public snapshot.
  **Done when:** state is generated and updated by the server, invalid/out-of-turn
  actions cannot mutate it, and both clients receive the accepted result.

- [ ] **H4 — Enforce per-player private information.**
  The public/private state sketch alone does not provide access control.
  Keep the full map and secret role server-side and send private views only
  to the authorized player. Do not send the whole GameState to every socket.
  **Done when:** inspect ordinary-player network messages and confirm that
  the full map and secret role are absent; a different room gets no updates.

## Suggested sequence and file ownership

1. Agree on T0. Jose can begin J1/J3 while Haig works on H1/H2.
2. Coordinate J2/H1 because both touch socket lifecycle handling in `room.js`.
   Keep transport handling and renderer functions separate as the files grow.
3. Haig completes H3; Jose connects J4. Apply H4 before sending hidden game data.
4. After one shared exploration step works, plan combat rendering and rules.
   Leave class balancing, XP, and finale implementation for that next task set.

Use separate feature branches based on the updated main, for example
`feature/room-rendering` and `feature/game-state`. These are suggested branch
names; this review only checked out and updated main. Merge small changes and
review message-contract changes together to avoid overwriting each other's work.

## Shared milestone checks

- [ ] Host and join with multiple browser tabs; rosters match in the same room.
- [ ] Four players join; a fifth receives a clear rejection.
- [ ] Close a tab; the other tabs update without duplicate entries.
- [ ] A separate room receives no roster or gameplay updates from the first.
- [ ] Repeated rendering and slots 1/3/4 work correctly.
- [ ] Server loss after joining produces a visible connection change.
- [ ] One accepted navigation action updates all relevant clients consistently.
- [ ] Invalid actions leave authoritative state unchanged.
- [ ] Ordinary clients never receive the imposter's private map or identity.

These are acceptance checks to run as the tasks land, not recorded passing tests.
