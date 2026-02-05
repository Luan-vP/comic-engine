/**
 * Journal Entry Schema for Comic Integration
 *
 * This defines the data format for journal entries exported from Obsidian
 * to be transformed into comic-engine scenes.
 */

/**
 * @typedef {Object} JournalStoryPrompts
 * @property {string[]} characters - Who's in this scene?
 * @property {string} dominantEmotion - What's the dominant emotion?
 * @property {string} visualMetaphor - What visual metaphor captures this moment?
 * @property {string} beforeContext - What happened before?
 * @property {string} afterContext - What happens after?
 */

/**
 * @typedef {Object} JournalEntryMetadata
 * @property {string} id - Unique identifier for the entry
 * @property {string} date - ISO date string
 * @property {string[]} themes - Themes explored in this entry (e.g., "healing", "growth", "loss")
 * @property {boolean} comicCandidate - Whether this entry is marked for comic-ification
 * @property {string[]} tags - Obsidian tags
 * @property {JournalStoryPrompts} storyPrompts - Answers to story prompts
 * @property {string} [visualStyle] - Optional visual style preference (e.g., "polaroid", "torn", "monitor")
 * @property {number} [emotionalIntensity] - 1-10 scale for determining visual treatment
 */

/**
 * @typedef {Object} JournalEntry
 * @property {JournalEntryMetadata} metadata - Entry metadata and prompts
 * @property {string} content - The journal entry markdown content
 * @property {string} excerpt - Selected passage marked for comic-ification
 */

/**
 * @typedef {Object} ThemeSequence
 * @property {string} theme - The theme name
 * @property {string[]} entryIds - Array of entry IDs exploring this theme (chronological)
 * @property {string} narrativeArc - Description of how this theme evolves
 */

/**
 * Validates a journal entry against the schema
 * @param {any} entry - Entry to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateJournalEntry(entry) {
  const errors = [];

  if (!entry.metadata) {
    errors.push('Missing metadata');
    return { valid: false, errors };
  }

  const { metadata } = entry;

  if (!metadata.id || typeof metadata.id !== 'string') {
    errors.push('metadata.id must be a string');
  }

  if (!metadata.date || typeof metadata.date !== 'string') {
    errors.push('metadata.date must be an ISO date string');
  }

  if (!Array.isArray(metadata.themes) || metadata.themes.length === 0) {
    errors.push('metadata.themes must be a non-empty array');
  }

  if (typeof metadata.comicCandidate !== 'boolean') {
    errors.push('metadata.comicCandidate must be a boolean');
  }

  if (!metadata.storyPrompts) {
    errors.push('metadata.storyPrompts is required');
  } else {
    const prompts = metadata.storyPrompts;
    if (!Array.isArray(prompts.characters)) {
      errors.push('storyPrompts.characters must be an array');
    }
    if (!prompts.dominantEmotion || typeof prompts.dominantEmotion !== 'string') {
      errors.push('storyPrompts.dominantEmotion must be a string');
    }
    if (!prompts.visualMetaphor || typeof prompts.visualMetaphor !== 'string') {
      errors.push('storyPrompts.visualMetaphor must be a string');
    }
  }

  if (!entry.content || typeof entry.content !== 'string') {
    errors.push('content must be a string');
  }

  if (!entry.excerpt || typeof entry.excerpt !== 'string') {
    errors.push('excerpt must be a string (the marked passage)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Example journal entry format
 */
export const exampleJournalEntry = {
  metadata: {
    id: '2025-01-15-morning',
    date: '2025-01-15T09:30:00Z',
    themes: ['healing', 'acceptance'],
    comicCandidate: true,
    tags: ['#journal', '#to-comic', '#breakthrough'],
    storyPrompts: {
      characters: ['myself', 'my younger self'],
      dominantEmotion: 'bittersweet relief',
      visualMetaphor: 'a door opening to light, but with shadows behind',
      beforeContext: 'Years of carrying this weight alone',
      afterContext: 'First steps toward letting it go',
    },
    visualStyle: 'torn',
    emotionalIntensity: 7,
  },
  content: `# Morning Reflection

Today something shifted. I've been holding onto this for so long...

[Marked passage begins]
I realized I don't have to carry all of this anymore. The weight I've been
dragging through every day - it's not mine to carry. I can set it down.
I can choose differently.
[Marked passage ends]

It feels both terrifying and freeing. Like standing at the edge of something new.`,
  excerpt: `I realized I don't have to carry all of this anymore. The weight I've been
dragging through every day - it's not mine to carry. I can set it down.
I can choose differently.`,
};

/**
 * Example theme sequence
 */
export const exampleThemeSequence = {
  theme: 'healing',
  entryIds: [
    '2025-01-10-evening',
    '2025-01-15-morning',
    '2025-01-22-afternoon',
    '2025-02-01-morning',
  ],
  narrativeArc: 'From recognizing the wound, through the first tentative steps of healing, to beginning to integrate the lessons',
};
