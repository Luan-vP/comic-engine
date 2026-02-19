/**
 * Journal Integration — Schema
 *
 * Data format definitions for journal entries imported from Obsidian.
 * These are plain JS objects — no external schema library needed.
 */

/**
 * A single marked passage within a journal entry.
 * @typedef {Object} JournalPassage
 * @property {string} text - The raw passage text
 * @property {string} [extractionMethod] - 'explicit' | 'comic-block' | 'highlight'
 */

/**
 * Story prompts filled in by the user in Obsidian.
 * @typedef {Object} StoryPrompts
 * @property {string[]} [characters] - Who's in the scene
 * @property {string} [emotion] - Dominant emotion
 * @property {number} [emotionalIntensity] - 1–10 scale
 * @property {string} [visualMetaphor] - Visual metaphor for the moment
 * @property {string} [beforeContext] - What happened just before
 * @property {string} [afterContext] - What happened just after
 */

/**
 * A single journal entry ready for comic-ification.
 * @typedef {Object} JournalEntry
 * @property {string} id - Unique identifier (slug from title + date)
 * @property {string} title - Entry title
 * @property {string} date - ISO date string
 * @property {string[]} themes - Thematic tags (e.g. ['healing', 'identity'])
 * @property {JournalPassage[]} passages - Marked passages
 * @property {StoryPrompts} prompts - Story prompt answers
 * @property {string} [rawContent] - Full original markdown text
 */

/**
 * A sequence of entries grouped by theme for narrative layout.
 * @typedef {Object} ThemeSequence
 * @property {string} theme - The shared theme name
 * @property {JournalEntry[]} entries - Entries in chronological order
 */

/**
 * Create a default StoryPrompts object.
 * @returns {StoryPrompts}
 */
export function createStoryPrompts(overrides = {}) {
  return {
    characters: [],
    emotion: '',
    emotionalIntensity: 5,
    visualMetaphor: '',
    beforeContext: '',
    afterContext: '',
    ...overrides,
  };
}

/**
 * Create a JournalEntry with required fields and sensible defaults.
 * @param {Partial<JournalEntry>} fields
 * @returns {JournalEntry}
 */
export function createJournalEntry(fields = {}) {
  const id =
    fields.id ||
    `${(fields.title || 'entry').toLowerCase().replace(/\s+/g, '-')}-${fields.date || Date.now()}`;

  return {
    id,
    title: 'Untitled',
    date: new Date().toISOString(),
    themes: [],
    passages: [],
    prompts: createStoryPrompts(),
    rawContent: '',
    ...fields,
  };
}

/**
 * Create a ThemeSequence.
 * @param {string} theme
 * @param {JournalEntry[]} entries
 * @returns {ThemeSequence}
 */
export function createThemeSequence(theme, entries = []) {
  return {
    theme,
    entries: [...entries].sort((a, b) => new Date(a.date) - new Date(b.date)),
  };
}

/**
 * Validate a JournalEntry — returns array of error strings (empty = valid).
 * @param {any} entry
 * @returns {string[]}
 */
export function validateJournalEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object') {
    return ['Entry must be an object'];
  }
  if (!entry.title) errors.push('Missing required field: title');
  if (!entry.date) errors.push('Missing required field: date');
  if (!Array.isArray(entry.themes)) errors.push('themes must be an array');
  if (!Array.isArray(entry.passages)) errors.push('passages must be an array');
  return errors;
}
