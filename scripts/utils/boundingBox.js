/**
 * @param {number[][]} points Array of `[x, y]` pairs to find bounding boxes from
 * @param {number} maxWidth max possible width of canvas
 * @param {number} maxHeight max possible width of canvas
 * @returns {number[]} `[minX, minY, maxX, maxY]` values of the axis-aligned bounding box
 */
export function getBoundingBox(points, maxWidth, maxHeight) {
  const boundingBox = [maxWidth, maxHeight, 0, 0];
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

/**
 * @param {number[]} boundingBox [minX, minY, maxX, maxY]
 * @param {p5.Graphics} gfx The p5 Graphics object (buffer/real canvas wrapper) to get a snippet out of
 */
export function getImageSnippetFromBoundingBox(boundingBox, gfx) {
  // Fix issue when minX=maxX or minY=maxY, causing drawImage error for width/height=0
  let w = boundingBox[2] - boundingBox[0];
  if (w === 0) {
    boundingBox[0] -= 1;
    boundingBox[2] += 1;
    w = boundingBox[2] - boundingBox[0];
  }
  let h = boundingBox[3] - boundingBox[1];
  if (h === 0) {
    boundingBox[1] -= 1;
    boundingBox[3] += 1;
    h = boundingBox[3] - boundingBox[1];
  }

  const snippet = gfx.get(boundingBox[0], boundingBox[1], w, h);
  return snippet;
}
