# Styling Notes

These notes describe the current shared theme, home page, and waiting-room styles. The CSS changes appearance and layout; it does not change the room or WebSocket behavior.

## Shared Theme

Both `index.html` and `room.html` load `theme.css` before their page-specific stylesheet. The `:root` rule defines reusable colors such as `--ink`, `--panel`, `--ember`, and `--teal`. A rule uses one with `var(--ink)`, so a palette adjustment can be made centrally.

The shared `*` rule sets `box-sizing: border-box`, which includes padding and borders in an element's declared size. The shared `body` rule sets the common font, text color, minimum page height, and dungeon background. A dark gradient is layered over the image to keep foreground text readable.

The `--ember-hover` and `--teal-hover` colors are lighter tones of the button colors. They are used when the pointer hovers over the corresponding buttons.

## Home Page: `style.css`

The `main` rule uses CSS Grid to arrange the title, form, and status message vertically. Its `gap` creates space between them. The `min()` width keeps the content narrow enough to read on desktop while leaving room at smaller widths; `margin-inline: auto` centers it.

The `.title-block` groups the game title and team name. The `h1` rule gives the game title a larger serif style; `.team-name` is the smaller supporting line.

The `.form` rule creates the dark control panel. `.join-room` lays out the room-code label, input, and Join button. The label spans the grid columns; on wide screens the input takes flexible space and the button sits beside it. The `#code` rule styles the input. The `#host` and `#join` rules set the larger ember Host button and smaller teal Join button, while their `:hover` rules change colors when pointed at.

The shared `button:focus-visible` and `#code:focus-visible` rules add a visible outline for keyboard navigation. `#message` reserves space and centers status/error text.

The `@media (max-width: 34rem)` rule changes the join row to one column and aligns Join to the start, making the controls fit narrower screens.

## Waiting Room: `room.css`

`room.html` uses the `room-page` body class. Its rule uses a vertical flex layout and page padding. `.waiting-room` centers the lobby panel, applies the shared panel colors, and adds a border and shadow. The room heading, room code, connection status, and roster have separate rules so each is easy to scan.

The `#players` list removes browser bullets and spacing. Each list item gets a bottom divider rather than a separate card. The `#start` button uses the shared ember color and has a visible keyboard focus outline. The narrow-screen media query reduces outer and panel padding.

The existing game-scene rules below these styles are separate and have not been redesigned as part of the home/waiting-room task.