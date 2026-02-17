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

  // Build masks and detect components for every layer first
  const layerEntries = [];
  for (const layer of layers) {
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < layerAssignments.length; i++) {
      mask[i] = layerAssignments[i] === layer.id ? 255 : 0;
    }
    const components = findConnectedComponents(mask, width, height, minObjectSize);
    if (components.length > 0) {
      layerEntries.push({ layer, mask, components });
    }
  }

  // Sort far → near (by depth ascending) so we can build the cumulative mask
  layerEntries.sort((a, b) => a.layer.depth - b.layer.depth);

  // Build a cumulative "above" mask: for each layer, which pixels are
  // covered by any nearer (higher-index) layer's sharp content.
  // Process from nearest → farthest so we can accumulate as we go.
  const aboveMasks = new Array(layerEntries.length);
  const cumulativeMask = new Uint8Array(width * height); // starts empty
  for (let i = layerEntries.length - 1; i >= 0; i--) {
    // This layer's "above" mask is the current cumulative (all nearer layers)
    aboveMasks[i] = new Uint8Array(cumulativeMask);
    // Then add this layer's own mask into the cumulative for layers below
    const { mask } = layerEntries[i];
    for (let p = 0; p < mask.length; p++) {
      if (mask[p]) cumulativeMask[p] = 255;
    }
  }

  // Extract layer images — always produce sharp + fill mask;
  // optionally produce blur-filled version when blurFill > 0.
  const layerObjects = layerEntries.map(({ layer, mask, components }, i) => {
    const sharpImage = extractLayerImage(sourceImageData, mask, width, height, null);
    const fillMask = generateFillMask(aboveMasks[i], width, height);

    let blurImage = null;
    if (blurFill > 0) {
      blurImage = extractLayerImage(sourceImageData, mask, width, height, {
        imgElement,
        blurRadius: blurFill,
        aboveMask: aboveMasks[i],
      });
    }

    return {
      layerId: layer.id,
      depth: layer.depth,
      zPosition: layer.zPosition,
      imageData: sharpImage,
      fillMaskUrl: fillMask,
      blurFillImageData: blurImage,
      bounds: calculateBounds(mask, width, height),
      componentCount: components.length,
    };
  });

  return layerObjects;
}

/**
 * Extract image data for a layer with alpha mask.
 *
 * When `blurFillOpts` is provided the transparent (cut-out) regions are
 * filled with a blurred copy of the source image, but only where no nearer
 * layer has sharp content (using the cumulative "above" mask). This prevents
 * a layer's blur from covering sharp content on layers behind it in the
 * render stack.
 *
 * @private
 * @param {ImageData} sourceImageData
 * @param {Uint8Array} mask - 0 or 255 per pixel
 * @param {number} width
 * @param {number} height
 * @param {{ imgElement: HTMLImageElement, blurRadius: number, aboveMask: Uint8Array }|null} blurFillOpts
 */
function extractLayerImage(sourceImageData, mask, width, height, blurFillOpts) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (blurFillOpts) {
    const { imgElement, blurRadius, aboveMask } = blurFillOpts;

    // Draw a blurred copy of the source into a temporary canvas
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = width;
    blurCanvas.height = height;
    const blurCtx = blurCanvas.getContext('2d');
    blurCtx.filter = `blur(${blurRadius}px)`;
    blurCtx.drawImage(imgElement, 0, 0, width, height);
    blurCtx.filter = 'none';
    const blurredData = blurCtx.getImageData(0, 0, width, height);

    // Composite: for each pixel pick sharp source (own mask), blurred fill
    // (not in own mask AND not covered by a nearer layer), or transparent.
    const outData = ctx.createImageData(width, height);
    for (let i = 0; i < mask.length; i++) {
      const px = i * 4;
      if (mask[i]) {
        // This layer's sharp content
        outData.data[px] = sourceImageData.data[px];
        outData.data[px + 1] = sourceImageData.data[px + 1];
        outData.data[px + 2] = sourceImageData.data[px + 2];
        outData.data[px + 3] = 255;
      } else if (aboveMask[i]) {
        // Covered by a nearer layer — fill with blur so parallax
        // shifts don't expose empty holes when that layer moves away
        outData.data[px] = blurredData.data[px];
        outData.data[px + 1] = blurredData.data[px + 1];
        outData.data[px + 2] = blurredData.data[px + 2];
        outData.data[px + 3] = 255;
      }
      // else: not covered by anything above — leave transparent
    }
    ctx.putImageData(outData, 0, 0);
  } else {
    // No blur fill — sharp content with transparent cut-outs
    const layerImageData = ctx.createImageData(width, height);
    for (let i = 0; i < mask.length; i++) {
      const px = i * 4;
      layerImageData.data[px] = sourceImageData.data[px];
      layerImageData.data[px + 1] = sourceImageData.data[px + 1];
      layerImageData.data[px + 2] = sourceImageData.data[px + 2];
      layerImageData.data[px + 3] = mask[i];
    }
    ctx.putImageData(layerImageData, 0, 0);
  }

  return canvas.toDataURL('image/png');
}

/**
 * Generate a fill-mask PNG from the cumulative "above" mask.
 * White (opaque) where fill should appear, transparent elsewhere.
 * @private
 */
function generateFillMask(aboveMask, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < aboveMask.length; i++) {
    const px = i * 4;
    imageData.data[px] = 255;
    imageData.data[px + 1] = 255;
    imageData.data[px + 2] = 255;
    imageData.data[px + 3] = aboveMask[i]; // 0 or 255
  }
  ctx.putImageData(imageData, 0, 0);
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
