/**
 * React Hook for managing journal entries
 */

import { useState, useEffect, useCallback } from 'react';
import { parseObsidianMarkdown, groupByTheme, createThemeSequences } from './parser.js';
import { validateJournalEntry } from './schema.js';

/**
 * Hook for loading and managing journal entries
 * @param {Object} options - Configuration options
 * @returns {Object} - Journal entries state and methods
 */
export function useJournalEntries(options = {}) {
  const {
    autoLoad = false,
    initialEntries = [],
  } = options;

  const [entries, setEntries] = useState(initialEntries);
  const [themes, setThemes] = useState({});
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update themes and sequences when entries change
  useEffect(() => {
    if (entries.length === 0) {
      setThemes({});
      setSequences([]);
      return;
    }

    const themeMap = groupByTheme(entries);
    setThemes(themeMap);
    setSequences(createThemeSequences(themeMap));
  }, [entries]);

  /**
   * Load entries from JSON file or API
   * @param {string} source - URL or file path
   */
  const loadFromSource = useCallback(async (source) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`);
      }

      const data = await response.json();
      const loadedEntries = Array.isArray(data) ? data : [data];

      // Validate entries
      const validEntries = [];
      const errors = [];

      for (const entry of loadedEntries) {
        const validation = validateJournalEntry(entry);
        if (validation.valid) {
          validEntries.push(entry);
        } else {
          errors.push({ entry, errors: validation.errors });
        }
      }

      if (errors.length > 0) {
        console.warn('Some entries failed validation:', errors);
      }

      setEntries(validEntries);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  /**
   * Parse markdown files into entries
   * @param {Array<{filename: string, content: string}>} files
   */
  const parseMarkdownFiles = useCallback((files) => {
    const parsedEntries = files.map(({ filename, content }) =>
      parseObsidianMarkdown(content, filename)
    );

    setEntries(prevEntries => [...prevEntries, ...parsedEntries]);
  }, []);

  /**
   * Add a single entry
   * @param {Object} entry - JournalEntry object
   */
  const addEntry = useCallback((entry) => {
    const validation = validateJournalEntry(entry);
    if (!validation.valid) {
      setError(`Invalid entry: ${validation.errors.join(', ')}`);
      return false;
    }

    setEntries(prevEntries => [...prevEntries, entry]);
    return true;
  }, []);

  /**
   * Remove an entry by ID
   * @param {string} id - Entry ID
   */
  const removeEntry = useCallback((id) => {
    setEntries(prevEntries => prevEntries.filter(e => e.metadata.id !== id));
  }, []);

  /**
   * Update an entry
   * @param {string} id - Entry ID
   * @param {Object} updates - Partial entry updates
   */
  const updateEntry = useCallback((id, updates) => {
    setEntries(prevEntries =>
      prevEntries.map(entry =>
        entry.metadata.id === id
          ? { ...entry, ...updates, metadata: { ...entry.metadata, ...updates.metadata } }
          : entry
      )
    );
  }, []);

  /**
   * Filter entries by theme
   * @param {string} theme - Theme name
   * @returns {Object[]} - Filtered entries
   */
  const getByTheme = useCallback((theme) => {
    return themes[theme] || [];
  }, [themes]);

  /**
   * Get entries marked as comic candidates
   * @returns {Object[]} - Comic candidate entries
   */
  const getComicCandidates = useCallback(() => {
    return entries.filter(e => e.metadata.comicCandidate);
  }, [entries]);

  /**
   * Filter entries by date range
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Object[]} - Filtered entries
   */
  const getByDateRange = useCallback((startDate, endDate) => {
    return entries.filter(entry => {
      const date = new Date(entry.metadata.date);
      return date >= startDate && date <= endDate;
    });
  }, [entries]);

  /**
   * Clear all entries
   */
  const clear = useCallback(() => {
    setEntries([]);
    setError(null);
  }, []);

  return {
    entries,
    themes,
    sequences,
    loading,
    error,

    // Methods
    loadFromSource,
    parseMarkdownFiles,
    addEntry,
    removeEntry,
    updateEntry,
    getByTheme,
    getComicCandidates,
    getByDateRange,
    clear,
  };
}
