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
  resizeCanvas(windowWidth, windowHeight);
  paintingGfx.resizeCanvas(windowWidth, windowHeight);
  activeStrokeGfx.resizeCanvas(windowWidth, windowHeight);
}

let currentFillColor = 255;

function mousePressed() {
  currentFillColor = random(100, 250);
}

function mouseDragged() {
  activeStrokeGfx.noStroke();
  activeStrokeGfx.fill(currentFillColor);
  activeStrokeGfx.rect(
    min(pmouseX, mouseX),
    min(pmouseY, mouseY),
    abs(pmouseX - mouseX),
    abs(pmouseY - mouseY)
  );
}

function mouseReleased() {
  persistActiveAndClear();
}

function persistActiveAndClear() {
  paintingGfx.image(activeStrokeGfx, 0, 0);
  activeStrokeGfx.clear();
}

function keyPressed() {}
