import { PaletteManager } from "./managers/paletteManager.js";
import { UndoManager } from "./managers/undoManager.js";

/** @param {p5} sketch The p5 sketch */
const sketchFunction = (sketch) => {
  //#region variables

  /** @type {p5.Graphics}*/
  let paintingGfx;
  /** @type {p5.Graphics}*/
  let activeStrokeGfx;

  /** @type {number[][]} */
  let currentStrokeVertices = [];

  const IS_HOVERING = 0;
  const IS_DRAWING = 1;
  const IS_PICKING_COLOR = 2;

  let currentState = IS_HOVERING;
  let cursorIsSet = false;

  /** @type {UndoManager} */
  let undoMgr;
  /** @type {PaletteManager} */
  let paletteMgr;

  let pressure = 0;
  let prevPressure = 0;

  //#endregion

  sketch.setup = () => {
    setupGraphics();
    initializeManagers();
    addListeners();
  };

  sketch.draw = () => {
    clearCanvas();
    drawPainting();
    drawActive();
    paletteMgr.draw();
    drawHelpText();
    updateCursor();
  };

  //#region p5 event handlers

  sketch.touchStarted = () => {
    if (sketch.touches.length !== 1) {
      return;
    }

    if (paletteMgr.shouldHandlePositionInput(sketch.mouseX, sketch.mouseY)) {
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
    activeStrokeGfx.fill(paletteMgr.getCurrentColor());

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
      if (!paletteMgr.shouldHandlePositionInput(sketch.mouseX, sketch.mouseY)) {
        return;
      }
      paletteMgr.handlePositionInput("select", sketch.mouseX, sketch.mouseY);
    } else if (currentState === IS_DRAWING) {
      undoMgr.pushState(currentStrokeVertices);
      currentStrokeVertices = [];
      persistActiveAndClear();
    }

    currentState = IS_HOVERING;
  };

  sketch.mousePressed = () => {
    if (sketch.mouseButton !== sketch.LEFT) {
      return;
    }

    if (paletteMgr.shouldHandlePositionInput(sketch.mouseX, sketch.mouseY)) {
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
    activeStrokeGfx.fill(paletteMgr.getCurrentColor());

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
      if (!paletteMgr.shouldHandlePositionInput(sketch.mouseX, sketch.mouseY)) {
        currentState = IS_HOVERING;
        return;
      }
      paletteMgr.handlePositionInput("select", sketch.mouseX, sketch.mouseY);
    } else if (currentState === IS_DRAWING) {
      undoMgr.pushState(currentStrokeVertices);
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
      undoMgr.pushState([
        [0, 0],
        [paintingGfx.width, paintingGfx.height],
      ]);
      paintingGfx.clear();
      activeStrokeGfx.clear();
      return;
    }

    // flip horizontal
    if (currentState === IS_HOVERING && sketch.key.toUpperCase() === "H") {
      undoMgr.pushState([
        [0, 0],
        [paintingGfx.width, paintingGfx.height],
      ]);
      paintingGfx.push();
      paintingGfx.scale(-1, 1);
      const currentGfx = paintingGfx.get();
      paintingGfx.clear();
      paintingGfx.image(currentGfx, -paintingGfx.width, 0, paintingGfx.width, paintingGfx.height);
      paintingGfx.pop();
      return;
    }

    // flip vertical
    if (currentState === IS_HOVERING && sketch.key.toUpperCase() === "V") {
      undoMgr.pushState([
        [0, 0],
        [paintingGfx.width, paintingGfx.height],
      ]);
      paintingGfx.push();
      paintingGfx.scale(1, -1);
      const currentGfx = paintingGfx.get();
      paintingGfx.clear();
      paintingGfx.image(currentGfx, 0, -paintingGfx.height, paintingGfx.width, paintingGfx.height);
      paintingGfx.pop();
    }

    // Ctrl + Z
    if (
      currentState === IS_HOVERING &&
      sketch.key.toUpperCase() === "Z" &&
      sketch.keyIsDown(sketch.CONTROL)
    ) {
      undoMgr.undo();
      return;
    }

    if (currentState !== IS_DRAWING && paletteMgr.shouldHandleKeyInput(sketch.key)) {
      paletteMgr.handleKeyInput(parseInt(sketch.key));
    }
  };

  //#endregion

  //#region initializer functions

  function setupGraphics() {
    sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);
    sketch.pixelDensity(2);

    paintingGfx = sketch.createGraphics(sketch.width, sketch.height);
    paintingGfx.pixelDensity(2);

    activeStrokeGfx = sketch.createGraphics(sketch.width, sketch.height);
    activeStrokeGfx.pixelDensity(2);
  }

  function initializeManagers() {
    undoMgr = new UndoManager(paintingGfx);
    paletteMgr = new PaletteManager(sketch);
  }

  function addListeners() {
    const setPressureFromEvent = (/** @type {PointerEvent} */ ev) => {
      prevPressure = pressure;
      pressure = ev.pressure;
    };
    sketch.drawingContext.canvas.addEventListener("pointermove", setPressureFromEvent, false);

    // - prevents iOS Safari touch and hold issues
    // - chrome tablet drag left to navigate back gesture
    // - enables pressure sensitivity detection
    const preventDefaultTouch = (/** @type {TouchEvent} */ ev) => ev.preventDefault();
    document.addEventListener("touchstart", preventDefaultTouch, { passive: false });
    document.addEventListener("touchmove", preventDefaultTouch, { passive: false });
    document.addEventListener("touchend", preventDefaultTouch, { passive: false });
    document.addEventListener("touchcancel", preventDefaultTouch, { passive: false });
  }

  //#endregion

  //#region other functions

  function updateCursor() {
    if (cursorIsSet) {
      if (!paletteMgr.shouldHandlePositionInput(sketch.mouseX, sketch.mouseY)) {
        sketch.cursor(sketch.ARROW);
        cursorIsSet = false;
      }
    } else {
      if (currentState !== IS_DRAWING && paletteMgr.shouldHandlePositionInput(sketch.mouseX, sketch.mouseY)) {
        paletteMgr.handlePositionInput("hover", sketch.mouseX, sketch.mouseY);
        cursorIsSet = true;
      }
    }
  }

  function drawHelpText() {
    sketch.stroke(0);
    sketch.fill(255);
    sketch.textSize(16);
    sketch.text(
      `Press number keys for colors.
Press 'Esc' to cancel stroke, Press 'R' to reset canvas.
'Ctrl + Z' to undo - (${undoMgr.getUndoCountLeft()}) remaining.
enable iOS Safari 120hz: Settings > Apps > Safari > Advanced > Feature flags > Turn off "prefer page rendering updates near 60fps"`,
      10,
      70
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

  function persistActiveAndClear() {
    paintingGfx.image(activeStrokeGfx, 0, 0);
    activeStrokeGfx.clear();
  }

  //#endregion
};

// @ts-ignore: to ignore ts(2686) import error
new p5(sketchFunction);
