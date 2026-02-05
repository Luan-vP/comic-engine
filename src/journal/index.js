/**
 * Journal Integration Module
 *
 * Main entry point for journal-to-comic functionality
 */

export {
  validateJournalEntry,
  exampleJournalEntry,
  exampleThemeSequence,
} from './schema.js';

export {
  parseObsidianMarkdown,
  parseBatch,
  groupByTheme,
  createThemeSequences,
} from './parser.js';

export {
  generateSceneFromEntry,
  generateThemeSequenceScene,
  exportAsComponent,
} from './sceneGenerator.js';

export { useJournalEntries } from './useJournalEntries.js';
