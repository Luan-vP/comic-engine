import { useEffect, useReducer } from 'react';
import { getManifest, getScene, getLayerUrl } from '../services/gcsStorage';

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_MANIFEST':
      return { ...state, loading: true, error: null, manifest: null, currentScene: null };
    case 'MANIFEST_LOADED':
      return { ...state, manifest: action.payload };
    case 'MANIFEST_ERROR':
      return { ...state, loading: false, error: action.payload, manifest: null };
    case 'LOAD_SCENE':
      return { ...state, loading: true };
    case 'SCENE_LOADED':
      return { ...state, loading: false, error: null, currentScene: action.payload };
    case 'SCENE_ERROR':
      return { ...state, loading: false, error: action.payload, currentScene: null };
    case 'NO_SCENES':
      return { ...state, loading: false };
    default:
      return state;
  }
}

const initialState = { manifest: null, currentScene: null, loading: true, error: null };

/**
 * Loads a comic book manifest and the current scene from GCS.
 * Prefetches adjacent scenes to minimize navigation latency.
 *
 * @param {string} comicBookSlug
 * @param {number} slideIndex  0-based index of the current slide
 * @returns {{ manifest: object|null, currentScene: object|null, loading: boolean, error: string|null }}
 */
export function useComicBook(comicBookSlug, slideIndex) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load manifest whenever the slug changes
  useEffect(() => {
    if (!comicBookSlug) return;

    let cancelled = false;
    dispatch({ type: 'LOAD_MANIFEST' });

    getManifest(comicBookSlug)
      .then((data) => {
        if (!cancelled) dispatch({ type: 'MANIFEST_LOADED', payload: data });
      })
      .catch((err) => {
        if (!cancelled)
          dispatch({ type: 'MANIFEST_ERROR', payload: err.message || 'Failed to load comic book' });
      });

    return () => {
      cancelled = true;
    };
  }, [comicBookSlug]);

  // Load the current scene whenever manifest or slideIndex changes
  useEffect(() => {
    if (!state.manifest || !comicBookSlug) return;

    const scenes = state.manifest.scenes || [];
    if (scenes.length === 0) {
      dispatch({ type: 'NO_SCENES' });
      return;
    }

    const clampedIndex = Math.max(0, Math.min(slideIndex, scenes.length - 1));
    const sceneSlug = scenes[clampedIndex]?.slug;
    if (!sceneSlug) {
      dispatch({ type: 'NO_SCENES' });
      return;
    }

    let cancelled = false;
    dispatch({ type: 'LOAD_SCENE' });

    getScene(comicBookSlug, sceneSlug)
      .then((data) => {
        if (!cancelled) dispatch({ type: 'SCENE_LOADED', payload: data });
      })
      .catch((err) => {
        if (!cancelled)
          dispatch({ type: 'SCENE_ERROR', payload: err.message || 'Failed to load scene' });
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
  }, [state.manifest, comicBookSlug, slideIndex]);

  return {
    manifest: state.manifest,
    currentScene: state.currentScene,
    loading: state.loading,
    error: state.error,
  };
}
