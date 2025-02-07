import { getBoundingBox, getImageSnippetFromBoundingBox } from "../utils/boundingBox.js";

export class UndoManager {
  /** @type {number} */
  _maxUndos;
  /** @type {{img: p5.Image, boundingBox: number[]}[]} */
  _undoStates;
  /** @type {p5.Graphics} */
  _graphics;

  /**
   * @param {p5.Graphics} graphics The graphics layer to perform undos on
   * @param {number} [maxUndos] The maximum number of undos to store
   */
  constructor(graphics, maxUndos = 20) {
    this._graphics = graphics;
    this._maxUndos = maxUndos;

    this._undoStates = [];
  }

  /**
   * Undo the last change or do nothing if max number of undos reached
   * @returns {number} Number of remaining undos
   */
  undo() {
    const lastUndoState = this._undoStates.pop();
    if (!lastUndoState) return 0; // will return if array empty

    const bb = lastUndoState.boundingBox;
    this._graphics.image(lastUndoState.img, bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1]);

    return this._undoStates.length;
  }

  /**
   * Add a change to undo states
   * @param {number[][]} changedVertices List of `[x, y]` pairs in state change
   * @returns {number} Number of undo states
   */
  pushState(changedVertices) {
    if (changedVertices.length < 2) {
      return this._undoStates.length;
    }

    const bb = getBoundingBox(changedVertices, this._graphics.width, this._graphics.height);
    const undoSnippet = getImageSnippetFromBoundingBox(bb, this._graphics);

    const numUndoStates = this._undoStates.push({ img: undoSnippet, boundingBox: bb });
    if (numUndoStates > this._maxUndos) {
      this._undoStates.splice(0, 1);
    }

    return this._undoStates.length;
  }

  getUndoCountLeft() {
    return this._undoStates.length;
  }
}
