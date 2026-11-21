# Using PixiJS in The Evil Amongst Us

## Why we are using it

PixiJS will draw our 2D game scene and help us interact with the objects in it.
A main reason for choosing it is hit testing: PixiJS can work out which enabled
object is under the pointer and deliver hover, press, and tap events to it.
This will help with selecting enemies, healing teammates, inspecting loot,
and choosing dungeon exits.

PixiJS runs in the browser. Our Node.js game engine remains responsible for
turn order, damage, XP, dungeon generation, and which information a player
is allowed to receive. Our native WebSockets carry requests and results.

## First integration: what is implemented

This milestone converts the existing static room scene to PixiJS. It includes:

- The existing background and two placeholder character images.
- Background, character, and effects containers, replacing the three HTML layers.
- Hover highlighting and click/tap selection, with a selection ring.
- Pointer coordinates in the scene's own coordinate system.
- HTML selection buttons for the same interaction using a keyboard.
- Resizing that preserves the scene's proportions and keeps hit testing aligned.
- One scene initialization per page, including when the socket reconnects.
- A visible scene-loading error separate from connection status.

The two characters are a rendering preview. They are not roster members or
characters created by the server. Selecting one does not attack, heal, change
game state, or send a WebSocket message. Combat, map drawing, and animations
are future milestones.

The start-game path also needed a small correction: the generated start
position is stored in `roomState.gameState.public.map.coords`, using the
DungeonRoom's `position` field. The old assignment referenced fields that do
not exist and would prevent the game view from being reached.

## Files and responsibilities

| File | Responsibility |
|---|---|
| `app/public/room.html` | Scene container, HTML panels, and script loading order. |
| `app/public/room.css` | Page layout and canvas sizing. |
| `app/public/room.js` | Room connection, lobby/game switching, and starting the scene once. |
| `app/public/game-scene.js` | PixiJS setup, loading images, rendering, and pointer interactions. |
| `app/public/vendor/pixi-8.6.6.min.js` | Pinned PixiJS browser distribution, served by Express. |
| `app/public/vendor/PIXI-LICENSE.txt` | The distribution's MIT license. |
| `app/scripts/game-engine/` | Authoritative game rules and dungeon generation. |

We use a local browser build to keep the existing plain JavaScript setup.
There is no bundler or new npm dependency for this first step. The browser
does not need to contact a CDN to load PixiJS at runtime.

Distribution source:
https://cdn.jsdelivr.net/npm/pixi.js@8.6.6/dist/pixi.min.js

## Following the scene code

1. `startGame()` reveals `.game-window`. The scene container now has a size.
2. `createGameScene()` constructs an `Application` and awaits `app.init()`.
3. `Assets.load()` loads the existing JPG and WebP files as textures.
4. `Sprite` displays each texture. Both character sprites reuse one texture.
5. `Container` groups the background, characters, and effects in draw order.
6. The canvas is inserted into `#game-scene`.
7. A `ResizeObserver` updates the renderer and scene scale when its container changes.

`scenePromise` in `room.js` remembers the in-progress or finished setup. A
repeated start message or reconnect therefore does not append another canvas
or attach another set of scene handlers. A failed load currently requires a
refresh to retry. Returning to a started room restores this preview; restoring
a real gameplay snapshot will require additional server messages.

## Mouse position and click activity

Each character sets `eventMode = "static"` to enable hit testing and
`cursor = "pointer"` to indicate interaction. Static mode suits these
stationary preview sprites. Animated targets moving under a stationary cursor
may need `eventMode = "dynamic"` later.

| Event or method | Our use |
|---|---|
| `pointerover` | Tint the character when the pointer enters. |
| `pointerout` | Restore its normal or selected tint when the pointer leaves. |
| `pointertap` | Select a character after a completed press/release gesture. |
| `globalpointermove` | Track pointer movement across the canvas, including empty areas. |
| `event.getLocalPosition(world)` | Convert pointer coordinates to the scene's coordinate system. |
| `hitArea` | Define the rectangle that counts as the character's interactive region. |

`pointerdown` is also available when we need to respond as soon as the pointer
is pressed. Pointer events work with mouse, pen, and touch, although hover is
primarily useful for a mouse or pen.

The hit area is a rectangle around the image. Transparent pixels inside that
rectangle still count. PixiJS does not automatically trace the visible outline
of the artwork. We can later choose smaller rectangles, circles, or polygons.
Decorative background and effect containers use `eventMode = "none"` so they
do not participate in hit testing.

## Positions and resizing

The logical scene is 800 by 450 units. Character positions are expressed in
those units; they do not change when the browser window changes size.

The renderer matches the available container size. The `world` container is
scaled uniformly and centered, leaving unused space when the aspect ratios
differ. This avoids stretching characters. The background is scaled to cover
the logical scene and clipped to its boundaries.

`event.global` is measured in renderer coordinates. Because `world` may be
scaled and offset, we use `event.getLocalPosition(world)` to obtain the scene
position. This is the position we would compare with dungeon or object
locations later. CSS pixels, renderer coordinates, and scene coordinates are
related but are not always equal.

## How planned features will use it

| Feature | PixiJS/browser work | Server work |
|---|---|---|
| Navigation | Show exits and highlight the selected direction. | Check navigator, move the party, resolve encounters. |
| Combat targeting | Select a sprite and show the selected target. | Validate target, action, turn, and resource costs. |
| Class abilities | Show healing, protection, spell, and attack effects. | Resolve the actual ability and its results. |
| Health, XP, and levels | Update visuals and HTML stats from received values. | Calculate values and award progression. |
| Downed characters | Change appearance and available controls. | Decide support/revival eligibility and outcomes. |
| Imposter map | Draw only the map data sent to this player. | Keep full-map and role information private. |
| Final battle | Show the reveal and switch the scene presentation. | Trigger the finale, scale the boss, decide winners. |

A future action follows this sequence:

1. Player selects an object locally.
2. Player chooses an action using the HTML action panel.
3. Browser sends a request containing an agreed action and target ID.
4. Server validates it and sends authorized state changes and result events.
5. Browser updates the scene and plays the relevant effects.

These action messages are a proposed next interface, not an implemented
protocol. Existing roster entries are `[slot, playerId]` pairs. When real
characters are connected, track sprites by stable player/entity ID and use
slots for placement; do not identify players by array index.

Only the imposter should receive full-map data. A hidden PixiJS container or
fog overlay cannot keep data private if it was already sent to the browser.

## What stays in HTML

The waiting room, room code, connection messages, actions, inventory, stats,
and event log can remain HTML/CSS. PixiJS initially owns the central scene.
A graphical map can be added separately when the authorized map format is
agreed. The ticker can animate movement and effects later while gameplay
continues to use server-controlled turns.

## Manual checks

Run `npm start`, open `http://localhost:3000`, host a room, and press Start Game.

- The existing background and two characters appear after loading.
- Moving over empty scene space updates scene coordinates.
- Hovering a character highlights it; leaving removes the hover highlight.
- Clicking either character changes the selection message and ring.
- Tab to either selection button and press Enter: the same selection changes.
- Resize the browser: scene proportions and clickable targets remain aligned.
- Start again or reconnect: there is still exactly one scene canvas.
- Refresh a started room with the same browser cookie: the preview reopens.
- Temporarily block an image request and refresh: scene loading reports an error.

These are repeatable acceptance checks; recorded validation results belong in
`DEVELOPMENT_NOTES.md` and should distinguish automated checks from manual ones.

## Next learning steps

1. Walk through `createGameScene()` and change one character's position.
2. Experiment with a smaller hit area and explain the difference.
3. Agree on authoritative character IDs and state with the server developer.
4. Replace the two placeholders with sprites maintained by those IDs.
5. Add enemy targeting, then one animation driven by a server-confirmed result.

## Official references

- [Application and initialization](https://pixijs.com/8.x/guides/components/application)
- [Pointer events, event modes, and hit testing](https://pixijs.com/8.x/guides/components/events)
- [Containers](https://pixijs.com/8.x/guides/components/scene-objects/container)
- [Loading assets](https://pixijs.com/8.x/guides/components/assets)
- [Ticker plugin](https://pixijs.com/8.x/guides/components/application/ticker-plugin)

Use v8 examples consistently with the pinned v8 distribution.
