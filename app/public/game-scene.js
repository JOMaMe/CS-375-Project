// This first scene reuses the two placeholder characters from room.html.
// Selection is local UI state; it does not send a combat action.
async function createGameScene(host, statusElement, selectionElement) {
  const { Application, Assets, Container, Sprite, Graphics, Rectangle } = PIXI;
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
    const characters = [100, 400].map((x, index) => {
      const sprite = new Sprite(textures["assets/Peter_Griffin.webp"]);
      sprite.anchor.set(0.5, 1);
      sprite.scale.set(100 / sprite.texture.height);
      sprite.position.set(x, 300);
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
      characterLayer.addChild(sprite);
      return sprite;
    });

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

    // HTML buttons provide the same selection with keyboard navigation.
    for (const button of document.querySelectorAll(".scene-target")) {
      button.addEventListener("click", () => selectCharacter(Number(button.dataset.character)));
    }

    app.stage.eventMode = "static";
    app.stage.on("globalpointermove", (event) => {
      // event.global is in canvas coordinates; this accounts for scene scaling.
      const position = event.getLocalPosition(world);
      const inside = position.x >= 0 && position.x <= sceneWidth &&
        position.y >= 0 && position.y <= sceneHeight;
      statusElement.textContent = inside
        ? `Scene pointer: x ${Math.round(position.x)}, y ${Math.round(position.y)}`
        : "Pointer outside the scene.";
    });
    app.canvas.addEventListener("pointerleave", () => {
      statusElement.textContent = "Move the pointer over the scene.";
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
    statusElement.textContent = "Move the pointer over the scene.";
    return app;
  } catch (error) {
    resizeObserver?.disconnect();
    // Initialization can fail before a renderer exists (for example, no WebGL).
    if (app.renderer) app.destroy(true, { children: true });
    throw error;
  }
}
