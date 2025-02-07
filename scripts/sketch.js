import { UndoManager } from "./managers/undoManager.js";
import { getBoundingBox, getImageSnippetFromBoundingBox } from "./utils/boundingBox.js";

/** @param {p5} sketch The p5 sketch */
const sketchFunction = (sketch) => {
  /** @type {p5.Graphics}*/
  let paintingGfx;
  /** @type {p5.Graphics}*/
  let activeStrokeGfx;

  let currentFillColor = 255;

  /** @type {number[][]} */
  let currentStrokeVertices = [];

  const IS_HOVERING = 0;
  const IS_DRAWING = 1;
  const IS_PICKING_COLOR = 2;

  let currentState = IS_HOVERING;

  // Palette
  const StartPaletteX = 10;
  const StartPaletteY = 10;
  const NumColors = 10;
  let swatchWidth = 40;
  /** @type {number[]} */
  const PaletteColors = [];

  /** @type {{img: p5.Image, boundingBox: number[]}[]} */
  const undoStates = [];
  const MaxUndos = 10;

  sketch.setup = () => {
    sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);
    sketch.pixelDensity(2);

    paintingGfx = sketch.createGraphics(sketch.width, sketch.height);
    paintingGfx.pixelDensity(2);
    paintingGfx.background(0);

    activeStrokeGfx = sketch.createGraphics(sketch.width, sketch.height);
    activeStrokeGfx.pixelDensity(2);

    setupPalette();
  };

  sketch.draw = () => {
    clearCanvas();
    drawPainting();
    drawActive();
    drawPalette();
    drawHelpText();

    // prevent iOS Safari touch and hold issues
    const touchHandler = (/** @type {Event} */ ev) => {
      ev.preventDefault(); // Prevent text selection
    };
    document.addEventListener("touchstart", touchHandler, { passive: false });
    document.addEventListener("touchmove", touchHandler, { passive: false });
    document.addEventListener("touchend", touchHandler, { passive: false });
    document.addEventListener("touchcancel", touchHandler, { passive: false });
  };

  sketch.touchStarted = () => {
    if (sketch.touches.length !== 1) {
      return;
    }

    if (isInputOverPalette(sketch.mouseX, sketch.mouseY)) {
      currentState = IS_PICKING_COLOR;
    } else {
      currentStrokeVertices.push([sketch.mouseX, sketch.mouseY]);
      currentState = IS_DRAWING;
    }
  };

  sketch.touchMoved = () => {
    if (sketch.touches.length !== 1) {
      return;
    }

    if (currentState !== IS_DRAWING) {
      return;
    }
    activeStrokeGfx.noStroke();
    activeStrokeGfx.fill(currentFillColor);

    currentStrokeVertices.push([sketch.mouseX, sketch.mouseY]);

    activeStrokeGfx.clear();
    activeStrokeGfx.beginShape();
    for (let vtx of currentStrokeVertices) {
      activeStrokeGfx.vertex(vtx[0], vtx[1]);
    }
    activeStrokeGfx.endShape();
  };

  sketch.touchEnded = () => {
    if (currentState === IS_PICKING_COLOR) {
      if (!isInputOverPalette(sketch.mouseX, sketch.mouseY)) {
        return;
      }
      const colorIndex = Math.floor(
        (NumColors * (sketch.mouseX - StartPaletteX)) / (NumColors * swatchWidth)
      );
      currentFillColor = PaletteColors[colorIndex];
    } else if (currentState === IS_DRAWING) {
      pushUndoState();
      currentStrokeVertices = [];
      persistActiveAndClear();
    }

    currentState = IS_HOVERING;
  };

  sketch.mousePressed = () => {
    if (sketch.mouseButton !== sketch.LEFT) {
      return;
    }

    if (isInputOverPalette(sketch.mouseX, sketch.mouseY)) {
      currentState = IS_PICKING_COLOR;
    } else {
      currentStrokeVertices = [];
      persistActiveAndClear();
      currentStrokeVertices.push([sketch.mouseX, sketch.mouseY]);
      currentState = IS_DRAWING;
    }
  };

  sketch.mouseDragged = () => {
    if (currentState !== IS_DRAWING) {
      return;
    }
    activeStrokeGfx.noStroke();
    activeStrokeGfx.fill(currentFillColor);

    currentStrokeVertices.push([sketch.mouseX, sketch.mouseY]);

    activeStrokeGfx.clear();
    activeStrokeGfx.beginShape();
    for (let vtx of currentStrokeVertices) {
      activeStrokeGfx.vertex(vtx[0], vtx[1]);
    }
    activeStrokeGfx.endShape();
  };

  sketch.mouseReleased = () => {
    if (sketch.mouseButton !== sketch.LEFT) {
      return;
    }

    if (currentState === IS_PICKING_COLOR) {
      if (!isInputOverPalette(sketch.mouseX, sketch.mouseY)) {
        return;
      }
      const colorIndex = Math.floor(
        (NumColors * (sketch.mouseX - StartPaletteX)) / (NumColors * swatchWidth)
      );
      currentFillColor = PaletteColors[colorIndex];
    } else if (currentState === IS_DRAWING) {
      pushUndoState();
      currentStrokeVertices = [];
      persistActiveAndClear();
    }

    currentState = IS_HOVERING;
  };

  sketch.keyPressed = () => {
    if (currentState === IS_DRAWING && sketch.keyCode === sketch.ESCAPE) {
      currentState = IS_HOVERING;
      currentStrokeVertices = [];
      activeStrokeGfx.clear();
      return;
    }

    if (currentState === IS_HOVERING && sketch.key.toUpperCase() === "R") {
      paintingGfx.background(0);
      activeStrokeGfx.clear();
      return;
    }

    // Ctrl + Z
    if (
      currentState === IS_HOVERING &&
      sketch.key.toUpperCase() === "Z" &&
      sketch.keyIsDown(sketch.CONTROL)
    ) {
      const lastUndoState = undoStates.pop();
      if (!lastUndoState) return; // will return if array empty

      const bb = lastUndoState.boundingBox;
      paintingGfx.image(lastUndoState.img, bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
      return;
    }

    const keyNumMaybe = parseInt(sketch.key);
    if (currentState !== IS_DRAWING && keyNumMaybe <= NumColors && keyNumMaybe >= 1) {
      currentFillColor = PaletteColors[keyNumMaybe - 1];
      1;
    }
  };

  function setupPalette() {
    swatchWidth = sketch.min(swatchWidth, Math.floor((sketch.width + 8) / NumColors));
    for (let i = 0; i < NumColors; i++) {
      PaletteColors.push(Math.floor(i * (255 / (NumColors - 1))));
    }
    currentFillColor = PaletteColors[sketch.floor(NumColors / 2)];
  }

  function drawPalette() {
    let currIndex = 0;
    for (let i = 0; i < NumColors; i++) {
      if (currentFillColor === PaletteColors[i]) {
        currIndex = i;
      }
      sketch.noStroke();
      sketch.fill(PaletteColors[i]);
      sketch.square(StartPaletteX + i * swatchWidth, StartPaletteY, swatchWidth);
    }
    // show outline for active swatch
    sketch.strokeWeight(4);
    sketch.stroke(255, 200);
    sketch.noFill();
    sketch.square(StartPaletteX + currIndex * swatchWidth, StartPaletteY, swatchWidth);

    // cursor
    if (currentState !== IS_DRAWING && isInputOverPalette(sketch.mouseX, sketch.mouseY)) {
      sketch.cursor(sketch.HAND);
    } else {
      sketch.cursor(sketch.ARROW);
    }
  }

  function drawHelpText() {
    sketch.stroke(0);
    sketch.fill(255);
    sketch.textSize(16);
    sketch.text(
      `Press 1 - ${NumColors} for colors.
Press 'Esc' to cancel stroke, Press 'R' to reset canvas.
'Ctrl + Z' to undo - (${undoStates.length}) remaining.
enable iOS Safari 120hz: Settings > Apps > Safari > Advanced > Feature flags > Turn off "prefer page rendering updates near 60fps"`,
      StartPaletteX,
      StartPaletteY + swatchWidth + 20
    );
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  function isInputOverPalette(x, y) {
    return (
      x > StartPaletteX &&
      y > StartPaletteY &&
      x < StartPaletteX + swatchWidth * NumColors &&
      y < StartPaletteY + swatchWidth
    );
  }

  function drawPainting() {
    sketch.image(paintingGfx, 0, 0);
  }

  function drawActive() {
    sketch.image(activeStrokeGfx, 0, 0);
  }

  function clearCanvas() {
    sketch.background(0);
  }

  function pushUndoState() {
    if (currentStrokeVertices.length > 1) {
      const bb = getBoundingBox(currentStrokeVertices, sketch.width, sketch.height);
      const undoSnippet = getImageSnippetFromBoundingBox(bb, paintingGfx);

      const numUndoStates = undoStates.push({ img: undoSnippet, boundingBox: bb });
      if (numUndoStates > MaxUndos) {
        undoStates.splice(0, 1);
      }
    }
  }

  function persistActiveAndClear() {
    paintingGfx.image(activeStrokeGfx, 0, 0);
    activeStrokeGfx.clear();
  }
};

// @ts-ignore: to ignore ts(2686) import error
new p5(sketchFunction);
