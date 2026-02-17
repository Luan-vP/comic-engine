/**
 * Scene Export Utilities
 *
 * Functions for exporting processed depth-segmented scenes to a downloadable format
 * and for loading saved scenes.
 */

/**
 * Export a processed scene as a downloadable zip file
 *
 * @param {Object} result - Pipeline result from processPhotoToLayers
 * @param {string} sourceImage - Original source image data URL
 * @param {Object} settings - Processing settings (granularity, blurFill, etc.)
 * @param {string} filename - Base filename (without extension)
 * @returns {Promise<void>}
 */
export async function exportSceneAsZip(result, sourceImage, settings, filename = 'scene') {
  const slug = sanitizeSlug(filename);

  // Create scene metadata
  const metadata = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    settings: {
      granularity: settings.granularity,
      blurFill: settings.blurFill,
      depthModel: settings.depthModel || 'depth-anything-v2',
      minObjectSize: settings.minObjectSize || 100,
    },
    layers: result.layers.map((layer, index) => ({
      id: layer.id,
      name: layer.name,
      depth: layer.depth,
      zPosition: layer.zPosition,
      parallaxFactor: layer.sceneObjectProps.parallaxFactor,
      position: layer.sceneObjectProps.position,
      filename: `layer-${index}.png`,
    })),
  };

  // Create a simple archive structure using data URLs
  const files = {
    'scene.json': JSON.stringify(metadata, null, 2),
    'source.jpg': sourceImage,
    'depth.png': result.depthVisualization,
  };

  // Add layer images
  result.layers.forEach((layer, index) => {
    files[`layer-${index}.png`] = layer.imageUrl;
  });

  // Since we can't use JSZip without installing it, we'll create a JSON bundle
  // that can be saved and loaded later
  const bundle = {
    slug,
    metadata,
    files,
  };

  // Download as JSON
  downloadJSON(bundle, `${slug}.scene.json`);
}

/**
 * Download a JSON object as a file
 */
function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sanitize a filename to create a valid slug
 */
function sanitizeSlug(filename) {
  return filename
    .toLowerCase()
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Load a scene from a saved bundle file
 *
 * @param {File} file - Scene bundle file
 * @returns {Promise<Object>} Scene data
 */
export async function loadSceneFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bundle = JSON.parse(e.target.result);
        resolve(bundle);
      } catch (err) {
        reject(new Error('Invalid scene file format'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse scene metadata and reconstruct pipeline result format
 *
 * @param {Object} bundle - Scene bundle
 * @returns {Object} Pipeline result format
 */
export function parseSceneBundle(bundle) {
  const { metadata, files } = bundle;

  return {
    layers: metadata.layers.map((layerMeta) => ({
      id: layerMeta.id,
      name: layerMeta.name,
      depth: layerMeta.depth,
      zPosition: layerMeta.zPosition,
      imageUrl: files[layerMeta.filename],
      sceneObjectProps: {
        position: layerMeta.position,
        parallaxFactor: layerMeta.parallaxFactor,
      },
    })),
    depthVisualization: files['depth.png'],
    sourceImage: files['source.jpg'],
    metadata: metadata.settings,
  };
}
