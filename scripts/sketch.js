/**
 * @typedef {import("p5").Graphics} P5Graphics
 **/

/** @type {import("p5").Graphics}*/
let paintingGfx;
/** @type {import("p5").Graphics}*/
let activeStrokeGfx;

const LINE_SEP = 32;
const HALF_LINE_SEP = LINE_SEP / 2;

function setup() {
  createCanvas(windowWidth, windowHeight);
  paintingGfx = createGraphics(width, height);
  activeStrokeGfx = createGraphics(width, height);
}

function draw() {
  clearCanvas();
  drawPainting();
  drawActive();
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

let currentFillColor = 255;

/** @type {number[][]} */
let currentStrokeVertices = [];

function mousePressed() {
  currentFillColor = random(100, 250);
  currentStrokeVertices.push([mouseX, mouseY]);
}

function mouseDragged() {
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
  currentStrokeVertices = [];
  persistActiveAndClear();
}

function persistActiveAndClear() {
  paintingGfx.image(activeStrokeGfx, 0, 0);
  activeStrokeGfx.clear();
}

function keyPressed() {}
