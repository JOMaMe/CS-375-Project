# Styling Notes



## Current Style Sections

### Color variables

The `:root` section defines reusable colors named `--ink`, `--muted`, `--panel`, `--line`, `--ember`, and `--teal`.

Think of these as labeled paint jars: another rule can use `var(--ink)` instead of repeating the color value. This makes the palette easier to adjust.

### Consistent sizing

The universal `*` rule sets `box-sizing: border-box`. This makes an element's declared width include its padding and border, which makes layout sizing easier to predict.

### Page background and default text

The `body` rule removes the browser's default margin, makes the page at least as tall as the viewport, and sets the default text color and font. Its background stacks a dark transparent gradient over `assets/background.jpg`. The gradient reduces the image's brightness so foreground text is easier to read; the image path is relative to `style.css`.

### Main content layout

The `main` rule uses CSS Grid to arrange the page content and adds space between items. `width: min(42rem, calc(100% - 2rem))` keeps the content from becoming too wide on desktop while leaving a margin on small screens. `margin-inline: auto` centers it horizontally. The minimum viewport height and vertical padding help center the content while keeping breathing room.

### Main heading

The `h1` rule removes the default margin, centers the heading, and uses a serif font and warm light color to give the game title a storybook feel.

### Room form panel

The `.form` rule turns the existing form container into a dark panel. Grid layout and `gap` space its sections; padding gives content room inside; the border, small corner radius, and shadow separate the panel from the background.

The `.form > div` rule removes the old margins from the form's direct child sections. `.form > div:first-child` lays out the room-code input and Join button in two columns, while `minmax(0, 1fr)` lets the input column shrink without forcing the panel wider. `.form label` spans both columns and uses the muted text color. `.form > div:last-child` places the Host button at the right side of its row.

### Status message

The `#message` rule reserves a little vertical space so the page does not jump when a status or error message appears. It centers the text and uses the muted color.

### Narrow-screen layout

The media query applies when the viewport is at most `34rem` wide. It reduces the heading and panel padding, then changes the room-code row to one column so the input and Join button can fit on narrow screens.

## Current Limits and Next Styling Step

The input and buttons do not yet have custom colors, sizes, hover states, or keyboard-focus styles, so they still mostly use browser defaults. The accent variables are also waiting to be applied. Next, style the input and buttons, add a clear `:focus-visible` outline for keyboard users, and check the page at desktop and narrow mobile widths.

The CSS keeps the existing HTML IDs and does not add behavior. Hosting, joining, room-code validation, and status messages continue to be handled by the existing JavaScript.
