import { useState, useEffect, useCallback } from 'react';
import { listComicBooks } from '../services/gcsStorage';

/**
 * Fetches pages from both local dev server and GCS bucket, merging them
 * into a single list with source tags.
 *
 * @returns {{
 *   pages: Array<{ slug: string, name: string, source: 'local'|'gcs' }>,
 *   loading: boolean,
 *   error: Error | null,
 *   refetch: () => void,
 * }}
 */
export function usePages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const results = [];
      let gcsError = null;

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

      // Fetch GCS comic books (published — always shown alongside local scenes)
      try {
        const gcsBooks = await listComicBooks();
        for (const book of gcsBooks) {
          // Filter out non-comic-book folders (e.g. "assets")
          if (book.slug === 'assets') continue;
          results.push({ slug: book.slug, name: book.name, source: 'gcs' });
        }
      } catch (err) {
        gcsError = err instanceof Error ? err : new Error(String(err));
        console.warn('[usePages] Failed to list GCS comic books:', err);
      }

      if (!cancelled) {
        setPages(results);
        setError(gcsError);
        setLoading(false);
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const refetch = useCallback(() => setRefreshTick((t) => t + 1), []);

  return { pages, loading, error, refetch };
}
