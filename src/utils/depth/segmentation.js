/**
 * Segmentation Module
 *
 * Extracts connected regions within each depth layer as individual objects with alpha masks.
 */

/**
 * Segment quantized depth map into layer objects
 *
 * @param {HTMLImageElement | string} sourceImage - Original source image
 * @param {QuantizedDepthMap} quantizedMap - Quantized depth assignments
 * @param {Object} options - Segmentation options
 * @param {number} options.minObjectSize - Minimum pixels for valid object (filters noise)
 * @returns {Promise<Array<LayerObject>>} Array of segmented layer objects
 */
export async function segmentLayers(sourceImage, quantizedMap, options = {}) {
  const { minObjectSize = 100, blurFill = 0 } = options;
  const { width, height, layerAssignments, layers } = quantizedMap;

  // Load source image
  let imgElement = sourceImage;
  if (typeof sourceImage === 'string') {
    imgElement = await loadImage(sourceImage);
  }

  // Get source image data
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imgElement, 0, 0, width, height);
  const sourceImageData = ctx.getImageData(0, 0, width, height);

  // Extract each layer
  const layerObjects = [];

  for (const layer of layers) {
    // Create mask for this layer
    const layerMask = new Uint8Array(width * height);
    for (let i = 0; i < layerAssignments.length; i++) {
      layerMask[i] = layerAssignments[i] === layer.id ? 255 : 0;
    }

    // Find connected components in this layer
    const components = findConnectedComponents(layerMask, width, height, minObjectSize);

    // Create an object for each component (or one combined object for the layer)
    // For simplicity, we'll create one object per layer combining all components
    if (components.length > 0) {
      const layerImage = extractLayerImage(
        sourceImageData,
        layerMask,
        width,
        height,
        blurFill > 0 ? { imgElement, blurRadius: blurFill } : null,
      );

      const bounds = calculateBounds(layerMask, width, height);

      layerObjects.push({
        layerId: layer.id,
        depth: layer.depth,
        zPosition: layer.zPosition,
        imageData: layerImage,
        bounds,
        componentCount: components.length,
      });
    }
  }

  // Sort by depth (far to near) for proper rendering order
  layerObjects.sort((a, b) => a.depth - b.depth);

  return layerObjects;
}

/**
 * Extract image data for a layer with alpha mask.
 *
 * When `blurFillOpts` is provided the transparent (cut-out) regions are
 * filled with a blurred copy of the source image instead of being left
 * fully transparent. This avoids visible holes when layers shift during
 * parallax.
 *
 * @private
 * @param {ImageData} sourceImageData
 * @param {Uint8Array} mask - 0 or 255 per pixel
 * @param {number} width
 * @param {number} height
 * @param {{ imgElement: HTMLImageElement, blurRadius: number }|null} blurFillOpts
 */
function extractLayerImage(sourceImageData, mask, width, height, blurFillOpts) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // If blur-fill is requested, paint a blurred version of the source first
  // so that cut-out areas show blurred content instead of transparency.
  if (blurFillOpts) {
    ctx.filter = `blur(${blurFillOpts.blurRadius}px)`;
    ctx.drawImage(blurFillOpts.imgElement, 0, 0, width, height);
    ctx.filter = 'none';
  }

  // Build the sharp masked layer
  const sharpCanvas = document.createElement('canvas');
  sharpCanvas.width = width;
  sharpCanvas.height = height;
  const sharpCtx = sharpCanvas.getContext('2d');
  const layerImageData = sharpCtx.createImageData(width, height);

  for (let i = 0; i < mask.length; i++) {
    const pixelIdx = i * 4;
    const alpha = mask[i];

    layerImageData.data[pixelIdx] = sourceImageData.data[pixelIdx];         // R
    layerImageData.data[pixelIdx + 1] = sourceImageData.data[pixelIdx + 1]; // G
    layerImageData.data[pixelIdx + 2] = sourceImageData.data[pixelIdx + 2]; // B
    layerImageData.data[pixelIdx + 3] = alpha;                              // A
  }

  sharpCtx.putImageData(layerImageData, 0, 0);

  // Composite sharp content over the (optionally blurred) background
  ctx.drawImage(sharpCanvas, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Calculate bounding box for a layer
 * @private
 */
function calculateBounds(mask, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Find connected components using flood fill
 * @private
 */
function findConnectedComponents(mask, width, height, minSize) {
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;

      if (mask[idx] > 0 && !visited[idx]) {
        const component = floodFill(mask, visited, x, y, width, height);

        if (component.size >= minSize) {
          components.push(component);
        }
      }
    }
  }

  return components;
}

/**
 * Flood fill to find connected region
 * @private
 */
function floodFill(mask, visited, startX, startY, width, height) {
  const stack = [[startX, startY]];
  const pixels = [];

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const idx = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[idx] || mask[idx] === 0) continue;

    visited[idx] = 1;
    pixels.push([x, y]);

    // 4-connectivity
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  return {
    pixels,
    size: pixels.length,
  };
}

/**
 * Load image from URL
 * @private
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * @typedef {Object} LayerObject
 * @property {number} layerId - Layer identifier
 * @property {number} depth - Normalized depth value [0, 1]
 * @property {number} zPosition - Z position for SceneObject
 * @property {string} imageData - Data URL of layer image with alpha
 * @property {BoundingBox} bounds - Bounding box of layer content
 * @property {number} componentCount - Number of connected components in layer
 */

/**
 * @typedef {Object} BoundingBox
 * @property {number} x - Left edge
 * @property {number} y - Top edge
 * @property {number} width - Width
 * @property {number} height - Height
 */
