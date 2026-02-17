/**
 * Depth Segmentation Pipeline
 *
 * Main pipeline that orchestrates depth estimation, quantization, and segmentation
 * to convert a photograph into layered scene objects.
 */

import { estimateDepth, visualizeDepthMap } from './depthEstimation.js';
import { quantizeDepth, depthToZPosition } from './quantization.js';
import { segmentLayers } from './segmentation.js';

/**
 * Process a photograph into depth-segmented layers
 *
 * @param {HTMLImageElement | string} image - Source image
 * @param {Object} options - Pipeline configuration
 * @param {number} options.granularity - Layer granularity (0.0-1.0)
 * @param {string} options.depthModel - Depth model to use
 * @param {number} options.minObjectSize - Minimum object size in pixels
 * @param {Function} options.onProgress - Progress callback (step, progress)
 * @param {Function} options.layerArrangement - Z-arrangement function (count) → number[].
 *                                              Defaults to fixedStepArrangement.
 *                                              Use fillRangeArrangement to fill the whole z-range.
 * @returns {Promise<PipelineResult>} Processed layers and metadata
 */
export async function processPhotoToLayers(image, options = {}) {
  const {
    granularity = 0.3,
    depthModel = 'depth-anything-v2',
    minObjectSize = 100,
    onProgress = null,
    layerArrangement = null,
  } = options;

  const result = {
    layers: [],
    depthMap: null,
    depthVisualization: null,
    metadata: {
      granularity,
      depthModel,
      minObjectSize,
    },
  };

  try {
    // Step 1: Depth estimation
    if (onProgress) onProgress('depth-estimation', 0);
    const depthMap = await estimateDepth(image, { model: depthModel });
    result.depthMap = depthMap;
    result.depthVisualization = visualizeDepthMap(depthMap);
    if (onProgress) onProgress('depth-estimation', 1);

    // Step 2: Quantization
    if (onProgress) onProgress('quantization', 0);
    const quantizedMap = quantizeDepth(depthMap, granularity);
    result.metadata.layerCount = quantizedMap.layers.length;
    if (onProgress) onProgress('quantization', 1);

    // Step 3: Segmentation
    if (onProgress) onProgress('segmentation', 0);
    const layerObjects = await segmentLayers(image, quantizedMap, {
      minObjectSize,
    });
    if (onProgress) onProgress('segmentation', 1);

    // Step 4: Export format conversion
    if (onProgress) onProgress('export', 0);
    const arrange = layerArrangement || fixedStepArrangement;
    const zPositions = arrange(layerObjects.length);

    result.layers = layerObjects.map((obj, index) => {
      const zPosition = zPositions[index];

      return {
        id: `layer-${obj.layerId}`,
        name: `Layer ${obj.layerId} (z: ${Math.round(zPosition)})`,
        depth: obj.depth,
        zPosition,
        imageUrl: obj.imageData,
        bounds: obj.bounds,
        componentCount: obj.componentCount,

        // SceneObject props ready to use
        sceneObjectProps: {
          position: [0, 0, zPosition],
          parallaxFactor: calculateParallaxFactor(obj.depth),
        },
      };
    });
    if (onProgress) onProgress('export', 1);

    if (onProgress) onProgress('complete', 1);

    return result;
  } catch (error) {
    console.error('Pipeline error:', error);
    throw new Error(`Depth segmentation pipeline failed: ${error.message}`);
  }
}

/**
 * Arrange layers with a fixed step between each, starting from the far plane.
 * 3 layers → [-400, -350, -300], 10 layers → [-400, -350, …, 50]
 *
 * @param {number} count - Number of layers
 * @param {Object} opts
 * @param {number} opts.start - Z of the farthest layer (default -400)
 * @param {number} opts.step  - Distance between adjacent layers (default 50)
 * @returns {number[]} Z positions, one per layer (far → near)
 */
export function fixedStepArrangement(count, { start = -400, step = 50 } = {}) {
  return Array.from({ length: count }, (_, i) => start + i * step);
}

/**
 * Arrange layers so they fill the entire z-range evenly.
 * 3 layers → [-400, -100, 200], 10 layers → [-400, -333, …, 200]
 *
 * @param {number} count - Number of layers
 * @param {Object} opts
 * @param {number} opts.far  - Z of the farthest layer (default -400)
 * @param {number} opts.near - Z of the nearest layer (default 200)
 * @returns {number[]} Z positions, one per layer (far → near)
 */
export function fillRangeArrangement(count, { far = -400, near = 200 } = {}) {
  if (count <= 1) return [far];
  const step = (near - far) / (count - 1);
  return Array.from({ length: count }, (_, i) => far + i * step);
}

/**
 * Calculate appropriate parallax factor based on depth
 * Objects further away move less (lower parallax factor)
 *
 * @param {number} depth - Normalized depth [0, 1]
 * @returns {number} Parallax factor
 */
function calculateParallaxFactor(depth) {
  // Map depth [0, 1] to parallax [0.1, 1.0]
  // Far objects (depth=0) get minimal parallax (0.1)
  // Near objects (depth=1) get full parallax (1.0)
  return 0.1 + depth * 0.9;
}

/**
 * Convenience function to get layers in Scene-ready format
 *
 * @param {PipelineResult} result - Pipeline result
 * @returns {Array<SceneLayer>} Layers with SceneObject props
 */
export function getSceneLayers(result) {
  return result.layers.map(layer => ({
    id: layer.id,
    name: layer.name,
    imageUrl: layer.imageUrl,
    ...layer.sceneObjectProps,
  }));
}

/**
 * @typedef {Object} PipelineResult
 * @property {Array<ProcessedLayer>} layers - Processed layer objects
 * @property {DepthMap} depthMap - Raw depth map
 * @property {string} depthVisualization - Depth map visualization (data URL)
 * @property {Object} metadata - Pipeline metadata
 */

/**
 * @typedef {Object} ProcessedLayer
 * @property {string} id - Unique layer ID
 * @property {string} name - Human-readable layer name
 * @property {number} depth - Normalized depth [0, 1]
 * @property {number} zPosition - Z position for Scene
 * @property {string} imageUrl - Layer image data URL
 * @property {BoundingBox} bounds - Layer bounding box
 * @property {number} componentCount - Number of objects in layer
 * @property {Object} sceneObjectProps - Props for SceneObject component
 */

/**
 * @typedef {Object} SceneLayer
 * @property {string} id - Layer ID
 * @property {string} name - Layer name
 * @property {string} imageUrl - Image data URL
 * @property {Array<number>} position - [x, y, z] position
 * @property {number} parallaxFactor - Parallax factor
 */
