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

### Where the project is at right now

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
- So far this session was just planning and setting up these notes. No game
  code was changed.

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

I haven't implemented these steps yet. The idea is to get the lobby working
first, then move on to rendering the dungeon and combat.

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

### What I am doing next

I'll start by sketching what the lobby should show, then work through how that
translates into HTML elements and a JavaScript object for the room data before
I write the rendering function. I still need to talk with my partner about
player names, class selection, ready buttons, and who starts the game.
