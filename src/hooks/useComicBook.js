import { useState, useEffect } from 'react';
import { getManifest, getScene, getLayerUrl } from '../services/gcsStorage';

/**
 * Loads a comic book manifest and the current scene from GCS.
 * Prefetches adjacent scenes to minimize navigation latency.
 *
 * @param {string} comicBookSlug
 * @param {number} slideIndex  0-based index of the current slide
 * @returns {{ manifest: object|null, currentScene: object|null, loading: boolean, error: string|null }}
 */
export function useComicBook(comicBookSlug, slideIndex) {
  const [manifest, setManifest] = useState(null);
  const [currentScene, setCurrentScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load manifest whenever the slug changes
  useEffect(() => {
    if (!comicBookSlug) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setManifest(null);
    setCurrentScene(null);

    getManifest(comicBookSlug)
      .then((data) => {
        if (!cancelled) setManifest(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load comic book');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [comicBookSlug]);

  // Load the current scene whenever manifest or slideIndex changes
  useEffect(() => {
    if (!manifest || !comicBookSlug) return;

    const scenes = manifest.scenes || [];
    if (scenes.length === 0) {
      setLoading(false);
      return;
    }

    const clampedIndex = Math.max(0, Math.min(slideIndex, scenes.length - 1));
    const sceneSlug = scenes[clampedIndex]?.slug;
    if (!sceneSlug) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getScene(comicBookSlug, sceneSlug)
      .then((data) => {
        if (!cancelled) {
          setCurrentScene(data);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCurrentScene(null);
          setError(err.message || 'Failed to load scene');
          setLoading(false);
        }
      });

    // Prefetch adjacent scenes (JSON only — let the browser handle images)
    const prefetchSlug = (idx) => {
      const s = scenes[idx];
      if (!s) return;
      getScene(comicBookSlug, s.slug).catch(() => {});
    };
    prefetchSlug(clampedIndex - 1);
    prefetchSlug(clampedIndex + 1);

    // Prefetch layer images for the next slide
    const nextScene = scenes[clampedIndex + 1];
    if (nextScene) {
      getScene(comicBookSlug, nextScene.slug)
        .then((data) => {
          const layers = data?.layers || [];
          layers.forEach((layer) => {
            const img = new Image();
            img.src = getLayerUrl(comicBookSlug, nextScene.slug, `layer-${layer.index}.png`);
          });
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [manifest, comicBookSlug, slideIndex]);

  return { manifest, currentScene, loading, error };
}
