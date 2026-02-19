/**
 * Journal Integration - Data Format Definitions
 *
 * Defines the schema for journal entries imported from Obsidian
 * and the format for scene configurations generated from them.
 */

/**
 * A single marked passage within a journal entry.
 * @typedef {Object} JournalPassage
 * @property {string} text - The passage text
 * @property {StoryPrompts} storyPrompts - Visual storytelling metadata
 */

/**
 * Story prompts that flesh out the visual story for a passage.
 * @typedef {Object} StoryPrompts
 * @property {string[]} characters - Who is in this scene
 * @property {string} emotion - The dominant emotion
 * @property {number} emotionalIntensity - Intensity from 1 (calm) to 10 (overwhelming)
 * @property {string} visualMetaphor - What visual metaphor captures this moment
 * @property {string} contextBefore - What happened before
 * @property {string} contextAfter - What happened after
 */

/**
 * A complete journal entry with marked passages.
 * @typedef {Object} JournalEntry
 * @property {string} id - Unique identifier (e.g., 'entry-2024-01-15-title')
 * @property {string} date - ISO date string
 * @property {string} title - Entry title
 * @property {string} content - Full markdown body (without frontmatter)
 * @property {JournalPassage[]} passages - Marked passages for comic-ification
 * @property {string[]} themes - Thematic tags (e.g., ['healing', 'family'])
 * @property {string[]} tags - Obsidian tags (e.g., ['to-comic'])
 * @property {Object} frontmatter - Raw parsed frontmatter
 */

/**
 * A sequence of entries grouped by theme, ready for scene generation.
 * @typedef {Object} ThemeSequence
 * @property {string} theme - The theme name
 * @property {JournalEntry[]} entries - Entries belonging to this theme, sorted by date
 */

/**
 * Export format for Obsidian → comic-engine transfer.
 * @typedef {Object} JournalExport
 * @property {string} exportedAt - ISO timestamp of export
 * @property {string} version - Schema version
 * @property {JournalEntry[]} entries - All entries in the export
 */

export const SCHEMA_VERSION = '1.0.0';

/**
 * Validate that a journal entry has the minimum required fields.
 */
export function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  if (typeof entry.id !== 'string' || !entry.id) return false;
  if (typeof entry.date !== 'string') return false;
  if (!Array.isArray(entry.passages)) return false;
  if (!Array.isArray(entry.themes)) return false;
  return true;
}

/**
 * Create a blank journal entry with default values.
 */
export function createBlankEntry(overrides = {}) {
  return {
    id: `entry-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    title: 'Untitled Entry',
    content: '',
    passages: [],
    themes: [],
    tags: [],
    frontmatter: {},
    ...overrides,
  };
}

/**
 * Create a blank story prompts object.
 */
export function createBlankPrompts() {
  return {
    characters: [],
    emotion: '',
    emotionalIntensity: 5,
    visualMetaphor: '',
    contextBefore: '',
    contextAfter: '',
  };
}
