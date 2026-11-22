// This first scene reuses the two placeholder characters from room.html.
// Selection is local UI state; it does not send a combat action.
async function createGameScene(host, statusElement, selectionElement) {
  const { Application, Assets, Container, Sprite, Graphics, Rectangle } = PIXI;
  const gameWindow = host.closest(".game-window");
  if (!gameWindow) {
    throw new Error("The game scene must be inside .game-window.");
  }
  const app = new Application();
  let resizeObserver;

  try {
    await app.init({
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight),
      backgroundColor: 0x17201c,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    const textures = await Assets.load([
      "assets/background.jpg",
      "assets/Peter_Griffin.webp"
    ]);

    // All positions use this logical scene size, regardless of window size.
    const sceneWidth = 800;
    const sceneHeight = 450;
    const world = new Container();
    const backgroundLayer = new Container();
    const characterLayer = new Container();
    const effectsLayer = new Container();
    backgroundLayer.eventMode = "none";
    effectsLayer.eventMode = "none";
    world.addChild(backgroundLayer, characterLayer, effectsLayer);
    app.stage.addChild(world);

    const background = new Sprite(textures["assets/background.jpg"]);
    const coverScale = Math.max(
      sceneWidth / background.texture.width,
      sceneHeight / background.texture.height
    );
    background.scale.set(coverScale);
    background.anchor.set(0.5);
    background.position.set(sceneWidth / 2, sceneHeight / 2);
    backgroundLayer.addChild(background);

    // Clip the cover-sized background to the logical scene rectangle.
    const sceneMask = new Graphics().rect(0, 0, sceneWidth, sceneHeight).fill(0xffffff);
    sceneMask.eventMode = "none";
    world.addChild(sceneMask);
    world.mask = sceneMask;

    const selectionRing = new Graphics()
      .ellipse(0, 0, 36, 10)
      .stroke({ width: 3, color: 0xffcf70 });
    selectionRing.visible = false;
    effectsLayer.addChild(selectionRing);

    let selectedIndex = null;
    const characters = [];

    function addCharacterSprite(texture, x, y = 300) {
      const index = characters.length;
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5, 1);
      sprite.scale.set(100 / sprite.texture.height);
      sprite.position.set(x, y);
      sprite.eventMode = "static";
      sprite.cursor = "pointer";
      // The explicit hit area uses the image rectangle, including transparent pixels.
      sprite.hitArea = new Rectangle(
        -sprite.texture.width / 2,
        -sprite.texture.height,
        sprite.texture.width,
        sprite.texture.height
      );
      sprite.on("pointerover", () => { sprite.tint = 0xffe1a3; });
      sprite.on("pointerout", () => {
        sprite.tint = selectedIndex === index ? 0xffcf70 : 0xffffff;
      });
      sprite.on("pointertap", () => selectCharacter(index));
      characters.push(sprite);
      characterLayer.addChild(sprite);
      return sprite;
    }

    function selectCharacter(index) {
      selectedIndex = index;
      characters.forEach((sprite, characterIndex) => {
        sprite.tint = characterIndex === index ? 0xffcf70 : 0xffffff;
      });
      const selected = characters[index];
      selectionRing.position.set(selected.x, selected.y);
      selectionRing.visible = true;
      selectionElement.textContent = `Character ${index + 1} selected (preview).`;
    }

    [100, 400].forEach(x => addCharacterSprite(textures["assets/Peter_Griffin.webp"], x));
    app.addCharacterSprite = async (imageUrl, x, y = 300) => {
      const texture = await Assets.load(imageUrl);
      return addCharacterSprite(texture, x, y);
    };

    // HTML buttons provide the same selection with keyboard navigation.
    for (const button of document.querySelectorAll(".scene-target")) {
      button.addEventListener("click", () => selectCharacter(Number(button.dataset.character)));
    }

    app.stage.eventMode = "static";
    gameWindow.addEventListener("pointermove", (event) => {
      const bounds = gameWindow.getBoundingClientRect();
      const x = Math.round(event.clientX - bounds.left);
      const y = Math.round(event.clientY - bounds.top);
      statusElement.textContent = `Game pointer: x ${x}, y ${y}`;
    });
    gameWindow.addEventListener("pointerleave", () => {
      statusElement.textContent = "Move the pointer over the game window.";
    });

    function resize() {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      app.renderer.resize(width, height);
      const scale = Math.min(width / sceneWidth, height / sceneHeight);
      world.scale.set(scale);
      world.position.set((width - sceneWidth * scale) / 2, (height - sceneHeight * scale) / 2);
      app.stage.hitArea = app.screen;
    }

    app.canvas.setAttribute("role", "img");
    app.canvas.setAttribute("aria-label", "Dungeon preview with two characters. Use the selection buttons for keyboard access.");
    host.append(app.canvas);
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    statusElement.textContent = "Move the pointer over the game window.";
    window.gameScene = app;
    return app;
  } catch (error) {
    resizeObserver?.disconnect();
    // Initialization can fail before a renderer exists (for example, no WebGL).
    if (app.renderer) app.destroy(true, { children: true });
    throw error;
  }
}

async function createMapGrid(host, mapState) {
  const { Application, Container, Sprite, Graphics, Texture } = PIXI;
  const columns = mapState?.dimensions?.width;
  const rows = mapState?.dimensions?.height;
  if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1) {
    throw new Error("Map dimensions must be positive integers.");
  }

  const app = new Application();
  let resizeObserver;

  try {
    await app.init({
      width: Math.max(1, host.clientWidth),
      height: Math.max(1, host.clientHeight),
      backgroundColor: 0x17201c,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    const grid = new Container();
    const tiles = [];
    const tileByPosition = new Map();
    const tileColors = new Map();
    let hoveredTile = null;
    let selectedTile = null;
    const selectionOutline = new Graphics();
    selectionOutline.visible = false;
    selectionOutline.eventMode = "none";

    function updateTileTint(tile) {
      tile.tint = hoveredTile === tile ? 0xffe1a3 : tileColors.get(tile);
    }

    function selectTile(tile) {
      selectedTile = tile;
      selectionOutline.clear();
      selectionOutline
        .rect(tile.x, tile.y, tile.width, tile.height)
        .stroke({ width: 3, color: 0xffcf70 });
      selectionOutline.visible = true;
    }

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const tile = new Sprite(Texture.WHITE);
        tile.tint = 0x000000;
        tileColors.set(tile, 0x000000);
        tileByPosition.set(`${row},${column}`, tile);
        tile.eventMode = "static";
        tile.cursor = "pointer";
        tile.on("pointerover", () => {
          hoveredTile = tile;
          updateTileTint(tile);
        });
        tile.on("pointerout", () => {
          if (hoveredTile === tile) hoveredTile = null;
          updateTileTint(tile);
        });
        tile.on("pointertap", () => selectTile(tile));
        grid.addChild(tile);
        tiles.push({ tile, row, column });
      }
    }
    app.stage.addChild(grid);
    app.stage.addChild(selectionOutline);
    app.stage.eventMode = "static";

    function updateMap(gameState) {
      const map = gameState?.public?.map ?? gameState?.map;
      if (!map || !Array.isArray(map.discovered) || !Array.isArray(map.frontier)) {
        throw new Error("Game state must include public map discovery and frontier data.");
      }
      if (map.dimensions?.width !== columns || map.dimensions?.height !== rows) {
        throw new Error("Game state map dimensions do not match the rendered map.");
      }

      function getTile(position) {
        if (!Number.isInteger(position?.row) || !Number.isInteger(position?.column)) {
          throw new Error("Map positions must have integer row and column values.");
        }
        const tile = tileByPosition.get(`${position.row},${position.column}`);
        if (!tile) {
          throw new Error("Map position is outside the rendered map dimensions.");
        }
        return tile;
      }

      for (const { tile } of tiles) {
        tileColors.set(tile, 0x000000);
      }
      for (const position of map.frontier) {
        tileColors.set(getTile(position), 0xadd8e6);
      }
      for (const position of map.discovered) {
        tileColors.set(getTile(position), 0x0000ff);
      }
      for (const { tile } of tiles) {
        updateTileTint(tile);
      }
    }

    app.updateMap = updateMap;

    app.canvas.setAttribute("role", "img");
    app.canvas.setAttribute("aria-label", `Dungeon map with ${rows} rows and ${columns} columns.`);
    host.replaceChildren(app.canvas);

    function resize() {
      const style = window.getComputedStyle(host);
      const horizontalPadding =
        parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const verticalPadding =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const width = Math.max(1, host.clientWidth - horizontalPadding);
      const height = Math.max(1, host.clientHeight - verticalPadding);
      app.renderer.resize(width, height);
      app.stage.hitArea = app.screen;

      const gap = 2;
      const padding = 8;
      const tileSize = Math.max(1, Math.floor(Math.min(
        (width - padding * 2 - gap * (columns - 1)) / columns,
        (height - padding * 2 - gap * (rows - 1)) / rows
      )));
      const gridWidth = columns * tileSize + gap * (columns - 1);
      const gridHeight = rows * tileSize + gap * (rows - 1);
      const left = Math.floor((width - gridWidth) / 2);
      const top = Math.floor((height - gridHeight) / 2);

      for (const { tile, row, column } of tiles) {
        tile.position.set(
          left + column * (tileSize + gap),
          top + row * (tileSize + gap)
        );
        tile.width = tileSize;
        tile.height = tileSize;
      }
      if (selectedTile) selectTile(selectedTile);
    }

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();
    return app;
  } catch (error) {
    resizeObserver?.disconnect();
    if (app.renderer) app.destroy(true, { children: true });
    throw error;
  }
}
