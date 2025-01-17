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
const SwatchWidth = 40;
const NumColors = 8;
/** @type {number[]} */
const PaletteColors = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  paintingGfx = createGraphics(width, height);
  activeStrokeGfx = createGraphics(width, height);

  setupPalette();
}

function draw() {
  clearCanvas();
  drawPainting();
  drawActive();
  drawPalette();
}

function setupPalette() {
  for (let i = 0; i < NumColors; i++) {
    PaletteColors.push(Math.floor(i * (255 / (NumColors - 1))));
  }
}

function drawPalette() {
  let currIndex = 0;
  for (let i = 0; i < NumColors; i++) {
    if (currentFillColor === PaletteColors[i]) {
      currIndex = i;
    }
    noStroke();
    fill(PaletteColors[i]);
    square(StartPaletteX + i * SwatchWidth, StartPaletteY, SwatchWidth);
  }
  // show outline for active swatch
  strokeWeight(4);
  stroke(255, 200);
  noFill();
  square(StartPaletteX + currIndex * SwatchWidth, StartPaletteY, SwatchWidth);

  // cursor
  if (currentState !== IS_DRAWING && isMouseOverPalette()) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

function isMouseOverPalette() {
  return (
    mouseX > StartPaletteX &&
    mouseY > StartPaletteY &&
    mouseX < StartPaletteX + SwatchWidth * NumColors &&
    mouseY < StartPaletteY + SwatchWidth
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

function windowResized() {
  // resizeCanvas(windowWidth, windowHeight);
  // paintingGfx.resizeCanvas(windowWidth, windowHeight);
  // activeStrokeGfx.resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  if (mouseButton !== LEFT) {
    return;
  }

  if (isMouseOverPalette()) {
    currentState = IS_PICKING_COLOR;
  } else {
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
    if (!isMouseOverPalette()) {
      return;
    }
    const colorIndex = Math.floor((NumColors * (mouseX - StartPaletteX)) / (NumColors * SwatchWidth));
    currentFillColor = PaletteColors[colorIndex];
  } else if (currentState === IS_DRAWING) {
    currentStrokeVertices = [];
    persistActiveAndClear();
  }

  currentState = IS_HOVERING;
}

function persistActiveAndClear() {
  paintingGfx.image(activeStrokeGfx, 0, 0);
  activeStrokeGfx.clear();
}

function keyPressed() {}
