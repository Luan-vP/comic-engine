import { useState, useEffect, useCallback } from 'react';
import { listComicBooks } from '../services/gcsStorage';

/**
 * Fetches pages from both local dev server and GCS bucket, merging them
 * into a single list with source tags.
 *
 * @returns {{
 *   pages: Array<{ slug: string, name: string, source: 'local'|'gcs' }>,
 *   loading: boolean,
 *   refetch: () => void,
 * }}
 */
export function usePages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const results = [];

      // Fetch local pages (dev server only — will 404 in prod, that's fine)
      try {
        const res = await fetch('/_dev/scenes');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            for (const p of data) {
              results.push({
              slug: p.slug,
              name: p.name,
              source: 'local',
              lastPublishedSlug: p.lastPublishedSlug || null,
            });
            }
          }
        }
      } catch {
        // Dev server not available (prod build) — skip
      }

      // Fetch GCS comic books
      try {
        const gcsBooks = await listComicBooks();
        for (const book of gcsBooks) {
          // Filter out non-comic-book folders (e.g. "assets")
          if (book.slug === 'assets') continue;
          // Skip if already present locally (local takes precedence)
          if (results.some((p) => p.slug === book.slug)) continue;
          results.push({ slug: book.slug, name: book.name, source: 'gcs' });
        }
      } catch (err) {
        console.warn('[usePages] Failed to list GCS comic books:', err);
      }

      if (!cancelled) {
        setPages(results);
        setLoading(false);
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const refetch = useCallback(() => setRefreshTick((t) => t + 1), []);

  return { pages, loading, refetch };
}
