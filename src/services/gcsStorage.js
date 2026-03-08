const GCS_BASE = 'https://storage.googleapis.com/comic-engine';

function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * List all comic books in the GCS bucket.
 *
 * @returns {Promise<Array<{ slug: string, name: string }>>}
 */
export async function listComicBooks() {
  const url = `${GCS_BASE}/?prefix=&delimiter=/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GCS list failed with ${res.status}`);
  const xml = await res.text();
  const matches = [...xml.matchAll(/<Prefix>([^/]+)\/<\/Prefix>/g)];
  return matches.map(([, slug]) => ({ slug, name: slugToTitle(slug) }));
}

/**
 * Fetch the manifest for a comic book.
 *
 * @param {string} comicBookSlug
 * @returns {Promise<{ scenes: Array<{ slug: string, name: string, order: number }> }>}
 */
export async function getManifest(comicBookSlug) {
  const url = `${GCS_BASE}/${comicBookSlug}/manifest.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('MANIFEST_NOT_FOUND');
  return res.json();
}

/**
 * Fetch scene metadata for a single scene.
 * Returns data in the same shape as .local/scenes/{slug}/scene.json.
 *
 * @param {string} comicBookSlug
 * @param {string} sceneSlug
 * @returns {Promise<{ name: string, slug: string, layers: Array, objects: Array, sceneConfig: object }>}
 */
export async function getScene(comicBookSlug, sceneSlug) {
  const url = `${GCS_BASE}/${comicBookSlug}/${sceneSlug}/scene.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('SCENE_NOT_FOUND');
  return res.json();
}

/**
 * Construct the public absolute URL for a layer image file.
 *
 * @param {string} comicBookSlug
 * @param {string} sceneSlug
 * @param {string} layerFile  e.g. "layer-0.png"
 * @returns {string}
 */
export function getLayerUrl(comicBookSlug, sceneSlug, layerFile) {
  return `${GCS_BASE}/${comicBookSlug}/${sceneSlug}/${layerFile}`;
}
