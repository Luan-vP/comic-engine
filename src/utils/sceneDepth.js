/**
 * Scene depth helpers.
 *
 * The "scroll depth" is the total Z range a full scroll sweeps over. With the
 * positive-Z-deeper convention, scrollZ=Z brings an object at z=Z to the camera
 * plane. We therefore set scrollDepth = max(Z of all layers/objects) + perspective
 * so the deepest objects can scroll past the camera.
 */

/**
 * Find the maximum Z value across layers and objects.
 *
 * @param {Array<{ position?: [number, number, number] }>} layers
 * @param {Array<{ position?: [number, number, number] }>} objects
 * @returns {number}
 */
export function computeMaxZ(layers = [], objects = []) {
  const layerZs = layers.map((l) => (l.position || [0, 0, 0])[2]);
  const objectZs = objects.map((o) => (o.position || [0, 0, 0])[2]);
  const allZs = [...layerZs, ...objectZs];
  return allZs.length ? Math.max(...allZs) : 0;
}

/**
 * Derive the scroll depth for a scene.
 * Adds perspective so the deepest objects can scroll past the camera.
 *
 * @param {number} maxZ
 * @param {number} perspective
 * @returns {number}
 */
export function computeScrollDepth(maxZ, perspective) {
  return (maxZ || 500) + perspective;
}
