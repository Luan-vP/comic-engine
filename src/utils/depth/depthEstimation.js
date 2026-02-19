/**
 * Depth Estimation Module
 *
 * Provides depth map estimation for photographs using monocular depth models.
 * Currently uses a placeholder/mock implementation for demonstration.
 *
 * In production, this could integrate with:
 * - Hugging Face Inference API (Depth Anything v2, ZoeDepth, MiDaS)
 * - Local ONNX runtime for client-side inference
 * - Custom backend service
 */

/**
 * Fetch depth map from the backend API
 * @private
 */
async function fetchDepthFromBackend(imgElement) {
  // Draw image to canvas to get a blob
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  ctx.drawImage(imgElement, 0, 0);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

  const formData = new FormData();
  formData.append('file', blob, 'image.png');

  const response = await fetch('/api/depth', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  const width = parseInt(response.headers.get('X-Depth-Width'), 10);
  const height = parseInt(response.headers.get('X-Depth-Height'), 10);

  // Response is a grayscale PNG — decode it to get depth values
  const arrayBuffer = await response.arrayBuffer();
  const depthBlob = new Blob([arrayBuffer], { type: 'image/png' });
  const depthUrl = URL.createObjectURL(depthBlob);

  const depthImg = await loadImage(depthUrl);
  URL.revokeObjectURL(depthUrl);

  const depthCanvas = document.createElement('canvas');
  depthCanvas.width = width;
  depthCanvas.height = height;
  const depthCtx = depthCanvas.getContext('2d');
  depthCtx.drawImage(depthImg, 0, 0, width, height);
  const depthImageData = depthCtx.getImageData(0, 0, width, height);

  // Extract red channel as depth values normalized to [0, 1]
  const depthData = new Float32Array(width * height);
  for (let i = 0; i < depthData.length; i++) {
    depthData[i] = depthImageData.data[i * 4] / 255;
  }

  return { width, height, data: depthData };
}

/**
 * Estimate depth map for an image
 *
 * @param {HTMLImageElement | string} image - Image element or data URL
 * @param {Object} options - Configuration options
 * @param {string} options.model - Model to use ('depth-anything-v2' | 'midas' | 'zoe-depth')
 * @returns {Promise<DepthMap>} Depth map with normalized values [0, 1]
 */
export async function estimateDepth(image, options = {}) {
  const { model = 'depth-anything-v2' } = options;

  let imgElement = image;
  if (typeof image === 'string') {
    imgElement = await loadImage(image);
  }

  // Try backend API first
  try {
    const result = await fetchDepthFromBackend(imgElement);
    return { ...result, model };
  } catch (err) {
    console.warn('Backend depth estimation unavailable, using mock:', err.message);
  }

  // Fallback to mock
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = imgElement.width;
  canvas.height = imgElement.height;
  ctx.drawImage(imgElement, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const depthData = generateMockDepthMap(imageData);

  return {
    width: canvas.width,
    height: canvas.height,
    data: depthData,
    model: 'mock',
  };
}

/**
 * Generate a mock depth map for demonstration
 * In production, this would call an actual depth estimation model
 *
 * @private
 */
function generateMockDepthMap(imageData) {
  const { width, height, data } = imageData;
  const depthData = new Float32Array(width * height);

  // Simple gradient-based mock: top pixels are far (0), bottom pixels are near (1)
  // Add some variance based on brightness to simulate depth variation
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pixelIdx = idx * 4;

      // Base depth from vertical position
      const baseDepth = y / height;

      // Add variance based on pixel brightness
      const brightness = (data[pixelIdx] + data[pixelIdx + 1] + data[pixelIdx + 2]) / (3 * 255);
      const variance = (brightness - 0.5) * 0.2; // ±10% variance

      depthData[idx] = Math.max(0, Math.min(1, baseDepth + variance));
    }
  }

  return depthData;
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
 * Visualize depth map as grayscale image
 * Useful for debugging and UI previews
 *
 * @param {DepthMap} depthMap - The depth map to visualize
 * @returns {string} Data URL of grayscale depth visualization
 */
export function visualizeDepthMap(depthMap) {
  const { width, height, data } = depthMap;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);

  for (let i = 0; i < data.length; i++) {
    const depth = data[i];
    const brightness = Math.floor(depth * 255);
    const pixelIdx = i * 4;

    imageData.data[pixelIdx] = brightness; // R
    imageData.data[pixelIdx + 1] = brightness; // G
    imageData.data[pixelIdx + 2] = brightness; // B
    imageData.data[pixelIdx + 3] = 255; // A
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL();
}

/**
 * @typedef {Object} DepthMap
 * @property {number} width - Width of the depth map
 * @property {number} height - Height of the depth map
 * @property {Float32Array} data - Normalized depth values [0, 1] where 0 = far, 1 = near
 * @property {string} model - Model used for estimation
 */
