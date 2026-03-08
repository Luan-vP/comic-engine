// Node.js only — do not import this file from browser code.
// Used by the Vite plugin (issue #67) and other authoring/dev tools.
// Requires @google-cloud/storage (dev dependency).

import { Storage } from '@google-cloud/storage';

const BUCKET_NAME = 'comic-engine';

function getStorage() {
  return new Storage();
}

/**
 * Upload scene metadata and layer image files to GCS.
 *
 * @param {string} comicBookSlug
 * @param {string} sceneSlug
 * @param {object} sceneData  scene.json object ({ name, slug, layers, objects, sceneConfig })
 * @param {Record<string, Buffer>} layerFiles  map of filename → Buffer (e.g. { 'layer-0.png': <Buffer> })
 */
export async function saveScene(comicBookSlug, sceneSlug, sceneData, layerFiles = {}) {
  const bucket = getStorage().bucket(BUCKET_NAME);

  const sceneFile = bucket.file(`${comicBookSlug}/${sceneSlug}/scene.json`);
  await sceneFile.save(JSON.stringify(sceneData, null, 2), {
    contentType: 'application/json',
  });

  for (const [filename, buffer] of Object.entries(layerFiles)) {
    const layerFile = bucket.file(`${comicBookSlug}/${sceneSlug}/${filename}`);
    await layerFile.save(buffer, { contentType: 'image/png' });
  }
}

/**
 * Write a manifest.json for a comic book.
 *
 * @param {string} comicBookSlug
 * @param {{ scenes: Array<{ slug: string, name: string, order: number }> }} manifest
 */
export async function saveManifest(comicBookSlug, manifest) {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const file = bucket.file(`${comicBookSlug}/manifest.json`);
  await file.save(JSON.stringify(manifest, null, 2), {
    contentType: 'application/json',
  });
}

/**
 * Delete all GCS objects under a scene prefix (scene.json + all layer files).
 *
 * @param {string} comicBookSlug
 * @param {string} sceneSlug
 */
export async function deleteScene(comicBookSlug, sceneSlug) {
  const bucket = getStorage().bucket(BUCKET_NAME);
  const prefix = `${comicBookSlug}/${sceneSlug}/`;
  const [files] = await bucket.getFiles({ prefix });
  await Promise.all(files.map((f) => f.delete()));
}
