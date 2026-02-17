/**
 * Depth Quantization Module
 *
 * Converts continuous depth values into discrete layers based on granularity threshold.
 */

/**
 * Quantize continuous depth map into discrete layers
 *
 * @param {DepthMap} depthMap - The depth map to quantize
 * @param {number} granularity - Granularity setting (0.0-1.0)
 *                                Lower values = more layers (fine-grained)
 *                                Higher values = fewer layers (coarse)
 * @returns {QuantizedDepthMap} Depth map with discrete layer assignments
 */
export function quantizeDepth(depthMap, granularity = 0.3) {
  const { width, height, data } = depthMap;

  // Granularity determines the minimum depth difference for layer separation
  // granularity 0.1 -> ~10 layers, 0.3 -> ~3-4 layers, 0.8 -> ~1-2 layers
  const minDepthDelta = Math.max(0.05, granularity);

  // Find unique depth layers by bucketing similar depths
  const layerAssignments = new Uint8Array(width * height);
  const layerDepths = [];
  let currentLayerId = 0;

  // Build a histogram of depth values to find natural breakpoints
  const histogram = buildDepthHistogram(data, 100);

  // Find peaks in histogram (depth ranges with many pixels)
  const peaks = findHistogramPeaks(histogram, minDepthDelta * 100);

  // Assign each pixel to the nearest peak (layer)
  for (let i = 0; i < data.length; i++) {
    const depth = data[i];
    const nearestPeakIdx = findNearestPeak(depth, peaks, histogram.binSize);
    layerAssignments[i] = nearestPeakIdx;
  }

  // Build layer metadata
  const layers = peaks.map((peakBin, idx) => {
    const avgDepth = (peakBin + 0.5) * histogram.binSize;
    return {
      id: idx,
      depth: avgDepth,
      zPosition: depthToZPosition(avgDepth),
    };
  });

  return {
    width,
    height,
    layerAssignments,
    layers,
    granularity,
  };
}

/**
 * Build histogram of depth values
 * @private
 */
function buildDepthHistogram(depthData, numBins) {
  const bins = new Array(numBins).fill(0);
  const binSize = 1.0 / numBins;

  for (let i = 0; i < depthData.length; i++) {
    const depth = depthData[i];
    const binIdx = Math.min(numBins - 1, Math.floor(depth / binSize));
    bins[binIdx]++;
  }

  return {
    bins,
    binSize,
  };
}

/**
 * Find peaks in histogram representing natural depth layers
 * @private
 */
function findHistogramPeaks(histogram, minDistance) {
  const { bins } = histogram;
  const peaks = [];

  // Simple peak detection: find local maxima with sufficient separation
  for (let i = 1; i < bins.length - 1; i++) {
    const isLocalMax = bins[i] > bins[i - 1] && bins[i] > bins[i + 1];
    if (!isLocalMax) continue;

    // Check if this peak is far enough from existing peaks
    const isFarEnough = peaks.every(
      existingPeak => Math.abs(i - existingPeak) >= minDistance
    );

    if (isFarEnough && bins[i] > bins.length / 10) {
      // Only include peaks with significant pixel count
      peaks.push(i);
    }
  }

  // Always include first and last bins if not already included
  if (peaks.length === 0 || peaks[0] > 0) {
    peaks.unshift(0);
  }
  if (peaks[peaks.length - 1] < bins.length - 1) {
    peaks.push(bins.length - 1);
  }

  return peaks;
}

/**
 * Find nearest peak for a given depth value
 * @private
 */
function findNearestPeak(depth, peaks, binSize) {
  const bin = Math.floor(depth / binSize);
  let nearestPeak = 0;
  let minDistance = Infinity;

  for (let i = 0; i < peaks.length; i++) {
    const distance = Math.abs(bin - peaks[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPeak = i;
    }
  }

  return nearestPeak;
}

/**
 * Convert normalized depth [0,1] to z-position for SceneObject
 * Maps depth to the range used by the Scene component
 *
 * @param {number} depth - Normalized depth value (0 = far, 1 = near)
 * @returns {number} Z position for SceneObject (negative = far, positive = near)
 */
export function depthToZPosition(depth) {
  // Map [0, 1] to [-400, 200]
  // 0 (far) -> -400 (far background)
  // 1 (near) -> 200 (close foreground)
  return -400 + depth * 600;
}

/**
 * @typedef {Object} QuantizedDepthMap
 * @property {number} width - Width of the map
 * @property {number} height - Height of the map
 * @property {Uint8Array} layerAssignments - Layer ID for each pixel
 * @property {Array<Layer>} layers - Layer metadata
 * @property {number} granularity - Granularity setting used
 */

/**
 * @typedef {Object} Layer
 * @property {number} id - Layer identifier
 * @property {number} depth - Average normalized depth [0, 1]
 * @property {number} zPosition - Z position for SceneObject
 */
