export class PaletteManager {
  #sketch;
  #currentFillColor;
  #startPaletteX = 10;
  #startPaletteY = 10;
  #numColors = 10;
  #swatchWidth = 40;

  /** @type {number[]} */
  #paletteColors = [];

  /**
   * @param {p5} sketch
   */
  constructor(sketch) {
    this.#sketch = sketch;
    // TODO: exceeds screen width on samsung phone
    this.#swatchWidth = this.#sketch.min(
      this.#swatchWidth,
      Math.floor((this.#sketch.width + 8) / this.#numColors)
    );
    for (let i = 0; i < this.#numColors; i++) {
      this.#paletteColors.push(Math.floor(i * (255 / (this.#numColors - 1))));
    }
    this.#currentFillColor = this.#paletteColors[this.#sketch.floor(this.#numColors / 2)];
  }

  draw() {
    let currIndex = 0;
    for (let i = 0; i < this.#numColors; i++) {
      if (this.#currentFillColor === this.#paletteColors[i]) {
        currIndex = i;
      }
      this.#sketch.noStroke();
      this.#sketch.fill(this.#paletteColors[i]);
      this.#sketch.square(
        this.#startPaletteX + i * this.#swatchWidth,
        this.#startPaletteY,
        this.#swatchWidth
      );

      // Keybinding label
      this.#sketch.noStroke;
      this.#sketch.fill(255 - this.#paletteColors[i]);
      if (i < 9) {
        this.#sketch.text(i + 1, this.#startPaletteX + i * this.#swatchWidth + 10, this.#startPaletteY + 20);
      } else if (i === this.#numColors - 1) {
        this.#sketch.text(0, this.#startPaletteX + i * this.#swatchWidth + 10, this.#startPaletteY + 20);
      }
    }
    // show outline for active swatch
    this.#sketch.strokeWeight(4);
    this.#sketch.stroke(255, 200);
    this.#sketch.noFill();
    this.#sketch.square(
      this.#startPaletteX + currIndex * this.#swatchWidth,
      this.#startPaletteY,
      this.#swatchWidth
    );
  }

  /**
   * @param {number} x
   * @returns {number}
   */
  #getColorFromPosition(x) {
    const colorIndex = Math.floor(
      (this.#numColors * (x - this.#startPaletteX)) / (this.#numColors * this.#swatchWidth)
    );
    return this.#paletteColors[colorIndex];
  }

  getCurrentColor() {
    return this.#currentFillColor;
  }

  getCursor() {
    return this.#sketch.HAND;
  }

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  shouldHandlePosition(x, y) {
    return (
      x > this.#startPaletteX &&
      y > this.#startPaletteY &&
      x < this.#startPaletteX + this.#swatchWidth * this.#numColors &&
      y < this.#startPaletteY + this.#swatchWidth
    );
  }

  /**
   * @param {number} x
   * @param {number} _y
   */
  handleClickAt(x, _y) {
    this.#currentFillColor = this.#getColorFromPosition(x);
  }

  /**
   * @param {number} n
   * @returns {boolean}
   */
  isValidIndexNumber(n) {
    if (isNaN(n)) return false;
    if (n < 0 || n > 9) return false;
    if (this.#numColors < 10 && n === 0) return false;
    if (this.#numColors < 10 && n <= this.#numColors) return true;
    if (n >= 0 && n <= 9) return true;
    return false;
  }

  /**
   * Index n goes from left-to-right: 1 - 9, then 0.
   * @param {number} n
   */
  setPaletteAtIndex(n) {
    if (n === 0) {
      this.#currentFillColor = this.#paletteColors[this.#paletteColors.length - 1];
    } else if (n <= this.#numColors) {
      this.#currentFillColor = this.#paletteColors[n - 1];
    }
  }
}
