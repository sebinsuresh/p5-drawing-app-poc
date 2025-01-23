/**
 * @typedef {import("p5").Graphics} P5Graphics
 **/

/** @type {import("p5").Graphics}*/
let paintingGfx;
/** @type {import("p5").Graphics}*/
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

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(2);

  paintingGfx = createGraphics(width, height);
  paintingGfx.pixelDensity(2);
  paintingGfx.background(0);

  activeStrokeGfx = createGraphics(width, height);
  activeStrokeGfx.pixelDensity(2);

  setupPalette();
}

// /** @type {p5.Image} */
// let testImg;
function draw() {
  clearCanvas();
  drawPainting();
  drawActive();
  drawPalette();
  drawHelpText();

  // if (frameCount > 400) {
  //   if (!testImg) {
  //     testImg = paintingGfx.get(100, 100, 200, 200);
  //   }
  //   image(testImg, 400, 400);
  // }

  // prevent iOS Safari touch and hold issues
  const touchHandler = (/** @type {Event} */ ev) => {
    ev.preventDefault(); // Prevent text selection
  };
  document.addEventListener("touchstart", touchHandler, { passive: false });
  document.addEventListener("touchmove", touchHandler, { passive: false });
  document.addEventListener("touchend", touchHandler, { passive: false });
  document.addEventListener("touchcancel", touchHandler, { passive: false });
}

function setupPalette() {
  swatchWidth = min(swatchWidth, Math.floor((width + 8) / NumColors));
  for (let i = 0; i < NumColors; i++) {
    PaletteColors.push(Math.floor(i * (255 / (NumColors - 1))));
  }
  currentFillColor = PaletteColors[floor(NumColors / 2)];
}

function drawPalette() {
  let currIndex = 0;
  for (let i = 0; i < NumColors; i++) {
    if (currentFillColor === PaletteColors[i]) {
      currIndex = i;
    }
    noStroke();
    fill(PaletteColors[i]);
    square(StartPaletteX + i * swatchWidth, StartPaletteY, swatchWidth);
  }
  // show outline for active swatch
  strokeWeight(4);
  stroke(255, 200);
  noFill();
  square(StartPaletteX + currIndex * swatchWidth, StartPaletteY, swatchWidth);

  // cursor
  if (currentState !== IS_DRAWING && isInputOverPalette(mouseX, mouseY)) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

function drawHelpText() {
  stroke(0);
  fill(255);
  textSize(16);
  text(
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
  image(paintingGfx, 0, 0);
}

function drawActive() {
  image(activeStrokeGfx, 0, 0);
}

function clearCanvas() {
  background(0);
}

/**
 * @param {number[][]} points
 * @returns {number[]} The [minX, minY, maxX, maxY] values
 */
function getBoundingBox(points) {
  const boundingBox = [width, height, 0, 0];
  for (let i = 0; i < points.length; i++) {
    let currentPoint = points[i];
    if (currentPoint[0] < boundingBox[0]) {
      boundingBox[0] = currentPoint[0];
    }
    if (currentPoint[0] > boundingBox[2]) {
      boundingBox[2] = currentPoint[0];
    }

    if (currentPoint[1] < boundingBox[1]) {
      boundingBox[1] = currentPoint[1];
    }
    if (currentPoint[1] > boundingBox[3]) {
      boundingBox[3] = currentPoint[1];
    }
  }
  return boundingBox;
}

function windowResized() {
  // resizeCanvas(windowWidth, windowHeight);
  // paintingGfx.resizeCanvas(windowWidth, windowHeight);
  // activeStrokeGfx.resizeCanvas(windowWidth, windowHeight);
}

function touchStarted() {
  if (touches.length !== 1) {
    return;
  }

  if (isInputOverPalette(mouseX, mouseY)) {
    currentState = IS_PICKING_COLOR;
  } else {
    currentStrokeVertices.push([mouseX, mouseY]);
    currentState = IS_DRAWING;
  }
}

function touchMoved() {
  if (touches.length !== 1) {
    return;
  }

  if (currentState !== IS_DRAWING) {
    return;
  }
  activeStrokeGfx.noStroke();
  activeStrokeGfx.fill(currentFillColor);

  currentStrokeVertices.push([mouseX, mouseY]);

  activeStrokeGfx.clear();
  activeStrokeGfx.beginShape();
  for (let vtx of currentStrokeVertices) {
    activeStrokeGfx.vertex(vtx[0], vtx[1]);
  }
  activeStrokeGfx.endShape();
}

function touchEnded() {
  if (currentState === IS_PICKING_COLOR) {
    if (!isInputOverPalette(mouseX, mouseY)) {
      return;
    }
    const colorIndex = Math.floor((NumColors * (mouseX - StartPaletteX)) / (NumColors * swatchWidth));
    currentFillColor = PaletteColors[colorIndex];
  } else if (currentState === IS_DRAWING) {
    pushUndoState();
    currentStrokeVertices = [];
    persistActiveAndClear();
  }

  currentState = IS_HOVERING;
}

function mousePressed() {
  if (mouseButton !== LEFT) {
    return;
  }

  if (isInputOverPalette(mouseX, mouseY)) {
    currentState = IS_PICKING_COLOR;
  } else {
    currentStrokeVertices = [];
    persistActiveAndClear();
    currentStrokeVertices.push([mouseX, mouseY]);
    currentState = IS_DRAWING;
  }
}

function mouseDragged() {
  if (currentState !== IS_DRAWING) {
    return;
  }
  activeStrokeGfx.noStroke();
  activeStrokeGfx.fill(currentFillColor);

  currentStrokeVertices.push([mouseX, mouseY]);

  activeStrokeGfx.clear();
  activeStrokeGfx.beginShape();
  for (let vtx of currentStrokeVertices) {
    activeStrokeGfx.vertex(vtx[0], vtx[1]);
  }
  activeStrokeGfx.endShape();
}

function mouseReleased() {
  if (mouseButton !== LEFT) {
    return;
  }

  if (currentState === IS_PICKING_COLOR) {
    if (!isInputOverPalette(mouseX, mouseY)) {
      return;
    }
    const colorIndex = Math.floor((NumColors * (mouseX - StartPaletteX)) / (NumColors * swatchWidth));
    currentFillColor = PaletteColors[colorIndex];
  } else if (currentState === IS_DRAWING) {
    pushUndoState();
    currentStrokeVertices = [];
    persistActiveAndClear();
  }

  currentState = IS_HOVERING;
}

function pushUndoState() {
  if (currentStrokeVertices.length > 1) {
    const bb = getBoundingBox(currentStrokeVertices);

    // Fix issue when minX=maxX or minY=maxY, causing drawImage error for width/height=0
    let w = bb[2] - bb[0];
    if (w === 0) {
      bb[0] -= 1;
      bb[2] += 1;
      w = bb[2] - bb[0];
    }
    let h = bb[3] - bb[1];
    if (h === 0) {
      bb[1] -= 1;
      bb[3] += 1;
      h = bb[3] - bb[1];
    }

    const undoSnippet = paintingGfx.get(bb[0], bb[1], w, h);
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

function keyPressed() {
  if (currentState === IS_DRAWING && keyCode === ESCAPE) {
    currentState = IS_HOVERING;
    currentStrokeVertices = [];
    activeStrokeGfx.clear();
    return;
  }

  if (currentState === IS_HOVERING && key.toUpperCase() === "R") {
    paintingGfx.background(0);
    activeStrokeGfx.clear();
    return;
  }

  // Ctrl + Z
  if (currentState === IS_HOVERING && key.toUpperCase() === "Z" && keyIsDown(CONTROL)) {
    const lastUndoState = undoStates.pop();
    if (!lastUndoState) return; // will return if array empty

    const bb = lastUndoState.boundingBox;
    paintingGfx.image(lastUndoState.img, bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);
    return;
  }

  const keyNumMaybe = parseInt(key);
  if (currentState !== IS_DRAWING && keyNumMaybe <= NumColors && keyNumMaybe >= 1) {
    currentFillColor = PaletteColors[keyNumMaybe - 1];
    1;
  }
}
