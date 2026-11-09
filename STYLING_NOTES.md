# Styling Notes

I used CSS to decide how the home page and waiting room look. The HTML still contains the controls and messages; the CSS changes their size, spacing, colors, and layout. It does not change how joining or WebSockets work.

## Shared Theme

Both `index.html` and `room.html` load `theme.css` before their page-specific CSS. That lets both pages share one palette and background.

In `:root`, I gave colors names like `--ink` and `--ember`. Later, `var(--ink)` uses that saved color. If I change its value in one place, every rule using it updates.

The shared `*` rule sets `box-sizing: border-box`. This makes padding and borders count inside an element's stated width, so the input and panels are easier to size. The shared `body` rule sets the font, text color, minimum height, and dungeon background. A dark gradient sits over the background image to help text stand out.

`--ember-hover` and `--teal-hover` are lighter colors used when the pointer hovers over the buttons.

## Home Page: `style.css`

The `main` rule uses Grid to stack the title, form, and message. `gap` adds space between them. `width: min(42rem, calc(100% - 2rem))` caps the width on a large screen and leaves side margins on a small one. `margin-inline: auto` makes the leftover space equal on both sides, centering `main`.

I used `rem` for most spacing and text sizes. A `rem` is based on the root font size, usually 16 pixels, so `1rem` is usually 16 pixels. Using `rem` keeps spacing consistent and lets it grow if the user's default text size is increased. I used `px` for thin borders and outlines where I want a precise line.

I used `margin` for space outside an element and `padding` for space inside it. `margin: 0` removes a heading's browser-default outside space; padding in `.form` leaves room between its border and controls. `margin-inline: auto` is a special case that centers an element horizontally.

`.title-block` groups the game title and team name. The `h1` uses a serif font and larger size to stand out; `.team-name` is smaller and muted so it supports the title.

`.form` creates the dark control panel. `.join-room` uses two Grid columns: `minmax(0, 1fr)` lets the input column use the remaining width and shrink when needed; `auto` gives the Join button the width it needs. The label spans both columns. At narrow widths, the media query changes the grid to one column so the input and Join button stack.

`#code` selects the room-code input by its HTML ID. `width: 100%` fills its column, padding makes it more comfortable to use, and `font: inherit` matches the page font. `#host` and `#join` give the buttons different sizes and colors. Their `:hover` rules change color when I point at them.

`transition: background-color 0.3s ease, transform 0.3s ease` controls how those properties change over time. `0.3s` is the duration, and `ease` makes the transition start and finish gently. The `:hover` rule supplies the new color; the transition only animates between the old and new values.

`:focus-visible` adds an outline when I navigate with a keyboard. `#message` reserves a little height and centers status or error text.

The `@media (max-width: 34rem)` rule applies when the layout is narrow, including when browser zoom makes the effective viewport smaller. It stacks the join controls and aligns the Join button to the left.

## Waiting Room: `room.css`

`room.html` gives the body the `room-page` class. Its Flexbox layout runs vertically, and its padding gives the room panel space around it. `.waiting-room` uses `margin-inline: auto` to center the panel horizontally and reuses the shared panel, text, and border colors.

The room code, connection status, and headings have separate rules so they are easy to scan. `#players` removes the list's default bullets and spacing. Each player gets a bottom divider, except the last one, where `:last-child` removes the extra line. `#start` reuses the ember button color and has a keyboard focus outline. On narrow screens, the media query reduces the page and panel padding.

The existing game-scene rules below these styles are separate and have not been redesigned as part of the home/waiting-room task.