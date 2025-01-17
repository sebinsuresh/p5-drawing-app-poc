/**
 * @typedef {import("p5").Graphics} P5Graphics
 **/

/** @type {import("p5").Graphics}*/
let paintingGfx;
/** @type {import("p5").Graphics}*/
let activeDrawGfx;

const LINE_SEP = 32;
const HALF_LINE_SEP = LINE_SEP / 2;

function setup() {
  createCanvas(windowWidth, windowHeight);
  paintingGfx = createGraphics(width, height);
  activeDrawGfx = createGraphics(width, height);
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
  image(activeDrawGfx, 0, 0);
}

function clearCanvas() {
  background(0);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  paintingGfx.resizeCanvas(windowWidth, windowHeight);
  activeDrawGfx.resizeCanvas(windowWidth, windowHeight);
}

function mouseDragged() {
  activeDrawGfx.noStroke();
  activeDrawGfx.rect(
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
  paintingGfx.image(activeDrawGfx, 0, 0);
  activeDrawGfx.clear();
}

function keyPressed() {}
