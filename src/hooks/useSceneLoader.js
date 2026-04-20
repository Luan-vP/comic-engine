import { useState, useEffect, useCallback } from 'react';
import { getScene, getLayerUrl } from '../services/gcsStorage';

/**
 * Resolves layer image URLs for all layers in the scene data.
 *
 * @param {object} sceneData - raw scene data from fetch
 * @param {string} source - 'local' or 'gcs'
 * @param {string} slug - scene slug
 * @param {string} [comicBookSlug] - required when source='gcs'
 * @returns {object} scene data with `url` property added to each layer
 */
function resolveLayerUrls(sceneData, source, slug, comicBookSlug) {
  const layers = (sceneData.layers || []).map((layer) => {
    const suffix = layer.hasBlurFill ? '-blur' : '';
    const url =
      source === 'local'
        ? `/local-scenes/${slug}/layer-${layer.index}${suffix}.png`
        : getLayerUrl(comicBookSlug, slug, `layer-${layer.index}${suffix}.png`);
    return { ...layer, url };
  });
  return { ...sceneData, layers };
}

/**
 * Unified hook for loading a scene from either local dev server or GCS.
 *
 * @param {string} slug - scene slug
 * @param {'local'|'gcs'} [source] - which backend to use. Defaults to auto-detect via import.meta.env.DEV
 * @param {{ comicBookSlug?: string }} [options] - required when source='gcs'
 * @returns {{ scene: object|null, loading: boolean, error: string|null, save: Function }}
 */
export function useSceneLoader(slug, source, options = {}) {
  const resolvedSource = source ?? (import.meta.env.DEV ? 'local' : 'gcs');
  const { comicBookSlug } = options;

  const [scene, setScene] = useState(null);
  const [error, setError] = useState(null);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const loading = loadedSlug !== slug;

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    const loadScene = async () => {
      try {
        let data;
        if (resolvedSource === 'local') {
          const res = await fetch(`/local-scenes/${slug}/scene.json`);
          if (!res.ok) throw new Error(`Scene "${slug}" not found (${res.status})`);
          data = await res.json();
        } else {
          if (!comicBookSlug) throw new Error('comicBookSlug is required when source is "gcs"');
          data = await getScene(comicBookSlug, slug);
        }

        if (!cancelled) {
          setScene(resolveLayerUrls(data, resolvedSource, slug, comicBookSlug));
          setError(null);
          setLoadedSlug(slug);
        }
      } catch (err) {
        if (!cancelled) {
          setScene(null);
          setError(err.message);
          setLoadedSlug(slug);
        }
      }
    };

    loadScene();

    return () => {
      cancelled = true;
    };
  }, [slug, resolvedSource, comicBookSlug]);

  const save = useCallback(
    async ({ groupOffset, groupOffsets, objects: newObjects = [], replaceObjects = false }) => {
      if (resolvedSource !== 'local') {
        // GCS backend is read-only — treat as a no-op success so callers don't block.
        return true;
      }
      try {
        const existingObjects = scene?.objects || [];
        const allObjects = replaceObjects ? newObjects : [...existingObjects, ...newObjects];

        const res = await fetch(`/_dev/scenes/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupOffset, groupOffsets, objects: allObjects }),
        });
        if (!res.ok) {
          console.error('Failed to save scene positions:', await res.text());
          return false;
        }
        // Update local state so UI reflects saved data immediately
        setScene((prev) => (prev ? { ...prev, objects: allObjects } : prev));
        return true;
      } catch (err) {
        console.error('Failed to save scene positions:', err);
        return false;
      }
    },
    [slug, scene, resolvedSource],
  );

  return { scene, loading, error, save };
}
