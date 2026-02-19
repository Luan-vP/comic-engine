/**
 * Journal Integration - React Hook
 *
 * Manages journal entry state: loading files, filtering by theme,
 * selecting layout, and generating scene objects.
 */

import { useState, useCallback, useMemo } from 'react';
import { parseFile, parseMarkdown, parseJsonExport } from './parser';
import { generateSceneConfig, groupByTheme } from './sceneGenerator';

/**
 * React hook for managing journal entries.
 *
 * @param {Object} [options]
 * @param {JournalEntry[]} [options.initialEntries=[]] - Entries to start with
 * @returns {Object} State and action handlers
 */
export function useJournalEntries({ initialEntries = [] } = {}) {
  const [entries, setEntries] = useState(initialEntries);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [layout, setLayout] = useState('timeline');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const themeMap = useMemo(() => groupByTheme(entries), [entries]);
  const availableThemes = useMemo(() => Array.from(themeMap.keys()), [themeMap]);

  const sceneObjects = useMemo(
    () => generateSceneConfig(entries, { layout, theme: selectedTheme }),
    [entries, layout, selectedTheme]
  );

  /**
   * Load entries from a File object (from a file input element).
   */
  const loadFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const loaded = await parseFile(file);
      setEntries((prev) => mergeEntries(prev, loaded));
    } catch (err) {
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load a single entry from a raw markdown string.
   */
  const loadMarkdown = useCallback((markdown, overrides = {}) => {
    const entry = parseMarkdown(markdown, overrides);
    setEntries((prev) => mergeEntries(prev, [entry]));
  }, []);

  /**
   * Load entries from parsed JSON data.
   */
  const loadJson = useCallback((jsonData) => {
    const loaded = parseJsonExport(jsonData);
    setEntries((prev) => mergeEntries(prev, loaded));
  }, []);

  /**
   * Remove all loaded entries.
   */
  const clearEntries = useCallback(() => {
    setEntries([]);
    setSelectedTheme(null);
  }, []);

  /**
   * Remove a single entry by ID.
   */
  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    entries,
    selectedTheme,
    availableThemes,
    layout,
    sceneObjects,
    loading,
    error,
    loadFile,
    loadMarkdown,
    loadJson,
    clearEntries,
    removeEntry,
    setSelectedTheme,
    setLayout,
  };
}

/**
 * Merge incoming entries into an existing list, deduplicating by ID.
 */
function mergeEntries(existing, incoming) {
  const map = new Map(existing.map((e) => [e.id, e]));
  for (const entry of incoming) {
    map.set(entry.id, entry);
  }
  return Array.from(map.values());
}
