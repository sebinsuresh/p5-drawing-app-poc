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
      if (i < 10) {
        this.#sketch.noStroke;
        this.#sketch.fill(255 - this.#paletteColors[i]);
        this.#sketch.text(
          `${(i + 1) % 10}`,
          this.#startPaletteX + i * this.#swatchWidth + 10,
          this.#startPaletteY + 20
        );
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
  getColorFromPosition(x) {
    const colorIndex = Math.floor(
      (this.#numColors * (x - this.#startPaletteX)) / (this.#numColors * this.#swatchWidth)
    );
    return this.#paletteColors[colorIndex];
  }

  getCurrentColor() {
    return this.#currentFillColor;
  }

  // TODO: add something like an interface enforcing these methods?

  /**
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  shouldHandlePositionInput(x, y) {
    return (
      x > this.#startPaletteX &&
      y > this.#startPaletteY &&
      x < this.#startPaletteX + this.#swatchWidth * this.#numColors &&
      y < this.#startPaletteY + this.#swatchWidth
    );
  }

  /**
   * @param {'hover' | 'select'} type
   * @param {number} x
   * @param {number} _y
   */
  handlePositionInput(type, x, _y) {
    if (type === "hover") {
      this.#sketch.cursor(this.#sketch.HAND);
    } else if (type === "select") {
      this.#currentFillColor = this.getColorFromPosition(x);
    }
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  shouldHandleKeyInput(key) {
    const keyNumMaybe = parseInt(key);
    return !isNaN(keyNumMaybe);
  }

  /**
   * @param {number} keyNum
   */
  handleKeyInput(keyNum) {
    if (this.#numColors > 9 && keyNum === 0) {
      this.#currentFillColor = this.#paletteColors[9];
    } else if (keyNum <= this.#numColors && keyNum >= 1) {
      this.#currentFillColor = this.#paletteColors[keyNum - 1];
    }
  }
}
