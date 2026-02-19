import { useState, useEffect } from 'react';

/**
 * Fetches the scene manifest from the Vite dev server.
 *
 * @returns {{ pages: Array<{ slug: string, name: string, layerCount: number }>, loading: boolean }}
 */
export function useLocalPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/_dev/scenes')
      .then((res) => {
        if (!res.ok) throw new Error(`/_dev/scenes responded with ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setPages(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.warn('[useLocalPages] Failed to fetch scene manifest:', err);
        if (!cancelled) setPages([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { pages, loading };
}
