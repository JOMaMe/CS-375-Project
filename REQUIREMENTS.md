# Dungeon-Crawling RPG Requirements

## 1. Project overview

Build a browser-based dungeon-crawling RPG for up to four players. Players
explore and battle together, but one player is secretly the imposter and may
try to mislead the party.

This document describes the current requirements. Details we have not decided
yet are listed in [Open questions](#9-open-questions).

## 2. Goals

- Let up to four players join and play a dungeon run together.
- Give the party turn-based navigation and battles.
- Add a hidden imposter who knows the dungeon paths and can mislead the party.
- Keep the shared game state consistent for everyone in the room.
- Use the project's existing Node.js and Express server.

## 3. Scope

### In scope

- Browser-based client and Node.js server.
- Party rooms that support up to four players.
- WebSocket communication between players and the server.
- Shared dungeon, battle, and party state.
- Turn-based exploration and battles, player progression, and a final battle
  against the imposter.

### Out of scope unless added later

- Persistent player accounts, rankings, or long-term character progression
  between runs.
- Matchmaking across multiple server instances.
- Voice or video chat.
- Active-time battles. They can be considered later if there is time.

## 4. Functional requirements

### Party and session

- **FR-1:** A player can create a party room and receive a room code or link.
- **FR-2:** A player can join an existing room using its room code or link.
- **FR-3:** A room supports no more than four players.
- **FR-4:** The interface shows the party members and whether each is connected.
- **FR-5:** Players can leave a room; the remaining party receives an updated
  roster.
- **FR-6:** The party can start a dungeon run when the agreed start conditions
  are met.

### Dungeon gameplay

- **FR-7:** Players can see the dungeon information available to them, their
  party, the objective, and any current enemies.
- **FR-8:** Players can navigate, interact with the dungeon, and take the
  actions available to their character.
- **FR-9:** The game shows the results of actions and important events, such as
  taking damage, finding loot, or defeating an enemy.
- **FR-10:** The game clearly shows whether the party won, lost, or reached the
  final imposter battle.

### Real-time communication

- **FR-12:** The browser client and game server communicate over a persistent,
  bidirectional WebSocket connection during a multiplayer session.
- **FR-13:** The server distributes relevant state changes to the other players
  in the same room without requiring them to refresh or repeatedly poll.
- **FR-14:** The server is authoritative for shared game state; clients send
  requested actions, and the server validates and applies them before
  broadcasting results.
- **FR-15:** The client indicates when the connection is lost and attempts to
  reconnect. The game tells the player whether they returned to the same room.
- **FR-16:** A disconnected player must not prevent the rest of the party from
  receiving updates. What happens to that player's character is still open.

### Exploration and battle model

All exploration and battles are turn-based.

- **FR-17 — Party navigation:** The party moves together. Players take turns
  choosing the next direction, and the navigator role rotates through the
  party.
- **FR-18 — Navigation results:** A path can affect encounter chances, loot,
  and chances to find or upgrade items and weapons. The server resolves the
  result and shares it with the party.
- **FR-19 — Hidden imposter:** At the start of a run, one party member is
  secretly chosen at random as the imposter. Any class can be the imposter.
  The imposter sees the full dungeon map; the rest of the party navigates
  without that information.
- **FR-20 — Imposter play:** The imposter can use their map knowledge to bluff
  or mislead the party, but cannot secretly change the route or the outcome of
  a choice. The imposter can choose whether or not to mislead the party.
- **FR-21 — Turn-based battles:** Each battle uses a single initiative roll to
  set turn order. Characters take turns one at a time.
- **FR-22 — Battle actions:** Characters can attack, defend, use an item, and
  use class skills. Battles should reward cooperation and playing a character's
  role well with bonus XP.
- **FR-23 — Classes and leveling:** Characters can gain XP and level up during
  a run. Higher levels provide meaningful advantages. Each class has a distinct
  role:
  - **Cleric:** Uses light magic, with a focus on healing and reviving. Clerics
    get earlier and stronger healing and revival skills.
  - **Fighter:** Is strong and resilient, and can take a hit for a teammate
    while greatly reducing the damage.
  - **Rogue:** Is agile and dexterous, and can deal critical damage under the
    right conditions.
  - **Wizard:** Uses dark magic, battle-stat support, and damaging spells.
  Everyone can eventually learn support skills (including healing). Every player starts with a
  revive scroll they can use to choose a teammate to revive.
- **FR-24 — Downed players:** A player whose character is downed becomes a
  spectator. They can offer one support action per battle and may be revived
  by the party. The exact support action and revival limits are still open.
- **FR-25 — Final imposter battle:** Finding the dungeon objective turns the
  imposter into the final boss, even if the imposter is downed or spectating.
  The imposter player controls their character in the battle against the party.
  The imposter's stats and abilities scale with the level they reached during
  the run; higher levels make the boss substantially stronger.
- **FR-26 — Run results:** The party wins by finding the objective and
  defeating the imposter in the final battle. If the party is defeated in the
  final battle, the imposter wins. If the entire party dies before finding the
  objective, the run ends and everyone loses.
- **FR-27 — Revivals and the finale:** Revived party members help the party in
  the final battle. If the imposter is revived, they remain secretly against
  the party and still become the final boss when the objective is found.

## 5. Non-functional requirements

- **NFR-1 — Responsiveness:** Player actions and resulting updates should feel
  responsive during normal play on a typical broadband connection.
- **NFR-2 — Consistency:** All players in a room should receive a consistent
  sequence of accepted shared-state updates.
- **NFR-3 — Input validation:** The server validates player actions and rejects
  malformed, unauthorized, or invalid actions without corrupting the game
  state.
- **NFR-4 — Room isolation:** Players in one room must not receive another
  room's private game updates.
- **NFR-5 — Usability:** The game must provide understandable status and error
  messages for joining, waiting, connecting, reconnecting, and completing a run.
- **NFR-6 — Browser support:** The game should work in current desktop versions
  of commonly used browsers. The specific browser and mobile support targets
  should be confirmed by the team.
- **NFR-7 — Maintainability:** Client and server responsibilities, game events,
  and shared state should be organized clearly enough for the project team to
  extend and test them.
- **NFR-8 — Imposter privacy:** Only the imposter can see the full map or
  imposter-only information. The game must not reveal their identity before the
  finale.

## 6. Technical direction

- Keep Express for serving the browser client and hosting the Node.js
  application.
- Add a WebSocket layer to the Node.js HTTP server for multiplayer gameplay.
- Use room-scoped messages so game events are sent only to the relevant party.
- Keep authoritative shared game state on the server; clients render the state
  and submit player actions.
- A library such as Socket.IO may be used for rooms and reconnection support.

## 7. Acceptance criteria

The initial multiplayer milestone is complete when:

1. One player can create a room and another player can join it.
2. A room accepts up to four players and rejects an additional player with a
   clear message.
3. Players in the same room see roster changes without refreshing the page.
4. A player action accepted by the server results in the same relevant state
   update being shown to the other players in that room.
5. A player in a different room does not receive that update.
6. Invalid actions are rejected by the server and do not alter shared game
   state.
7. A temporary connection loss is visible to the affected player, and the
   client attempts to reconnect.
8. The team can run the application locally using the documented project start
   command.
9. The party navigates together in turns, with the navigator role rotating.
10. Only the imposter can see the full map, and navigation choices can affect
    encounters, loot, and upgrades.
11. Battles are turn-based, with initiative setting the order at the start of
    each battle.
12. The party can find the objective and enter a final battle against the
    player-controlled imposter, even if the imposter is downed.
13. The game shows the correct outcome when the party wins, the imposter wins,
    or the entire party dies before reaching the objective.

## 8. Constraints and assumptions

- The existing project is a Node.js application using Express and serves static
  files from `app/public/`.
- The first version is intended as a course project, so a single application
  server is sufficient unless the team later establishes a need to scale it.
- Accounts and persistent saves are not assumed for the first version.
- Four is the maximum and required party size.
## 9. Open questions

- Can a run start with fewer than four players?
- How are dungeons generated, and what details does the full map show?
- How often do encounters happen, and what loot or upgrades can each path
  provide?
- What are the exact attacks, class skills, enemy actions, health, and battle
  rules?
- How is initiative rolled, and how are ties resolved?
- How much XP is awarded, and what are the level-up benefits and role-play
  bonuses?
- How do the imposter's stats and abilities scale with their level?
- What revival methods and limits are there, and what can spectators do to
  help once per battle?
- What does each class's full set of skills look like, and how are the classes
  balanced?
- How does the game reveal the imposter's identity at the finale?
- What happens to a character when its player disconnects, and how long is the
  room retained?
- Is text chat needed, or is in-game status/event messaging enough?
- Which browsers and screen sizes must be supported?
