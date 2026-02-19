/**
 * Depth Segmentation Pipeline
 *
 * Exports all depth-related utilities for photo-to-layers conversion.
 */

export { estimateDepth, visualizeDepthMap } from './depthEstimation.js';
export { quantizeDepth, depthToZPosition } from './quantization.js';
export { segmentLayers } from './segmentation.js';
export {
  processPhotoToLayers,
  getSceneLayers,
  fixedStepArrangement,
  fillRangeArrangement,
  depthProportionalArrangement,
} from './pipeline.js';
