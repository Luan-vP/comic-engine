/**
 * Journal Integration — React Hook
 *
 * Manages journal entry state: loading from files, grouping by theme,
 * selecting layout, and generating scene object configs.
 */

import { useState, useCallback, useMemo } from 'react';
import { parseFile } from './parser.js';
import { generateSceneObjects, groupEntriesByTheme } from './sceneGenerator.js';

/**
 * Hook for managing journal entries and converting them to scene configs.
 *
 * @returns {{
 *   entries: import('./schema.js').JournalEntry[],
 *   themes: import('./schema.js').ThemeSequence[],
 *   selectedTheme: string|null,
 *   setSelectedTheme: (theme: string|null) => void,
 *   layout: 'timeline'|'spiral'|'stack',
 *   setLayout: (layout: string) => void,
 *   sceneObjects: import('./sceneGenerator.js').SceneObjectConfig[],
 *   loading: boolean,
 *   error: string|null,
 *   loadFiles: (files: FileList|File[]) => Promise<void>,
 *   clearEntries: () => void,
 * }}
 */
export function useJournalEntries() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [layout, setLayout] = useState('timeline');

  // Group all entries by theme
  const themes = useMemo(() => groupEntriesByTheme(entries), [entries]);

  // Filter entries by selected theme (null = show all)
  const filteredEntries = useMemo(() => {
    if (!selectedTheme) return entries;
    const seq = themes.find((s) => s.theme === selectedTheme);
    return seq ? seq.entries : [];
  }, [entries, themes, selectedTheme]);

  // Generate scene object configs from the filtered entries
  const sceneObjects = useMemo(
    () => generateSceneObjects(filteredEntries, layout),
    [filteredEntries, layout],
  );

  const loadFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(fileArray.map((f) => parseFile(f)));
      const newEntries = results.flat();
      setEntries((prev) => {
        // Deduplicate by id
        const existingIds = new Set(prev.map((e) => e.id));
        const unique = newEntries.filter((e) => !existingIds.has(e.id));
        return [...prev, ...unique];
      });
    } catch (err) {
      setError(err.message || 'Failed to load files.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
    setSelectedTheme(null);
    setError(null);
  }, []);

  return {
    entries,
    themes,
    selectedTheme,
    setSelectedTheme,
    layout,
    setLayout,
    sceneObjects,
    loading,
    error,
    loadFiles,
    clearEntries,
  };
}
