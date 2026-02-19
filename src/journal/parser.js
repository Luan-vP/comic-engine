/**
 * Journal Integration — Parser
 *
 * Parses Obsidian markdown files (with YAML frontmatter) into JournalEntry objects.
 * No external dependencies — pure regex + string parsing.
 */

import { createJournalEntry, createStoryPrompts } from './schema.js';

// ---------------------------------------------------------------------------
// Frontmatter parsing
// ---------------------------------------------------------------------------

/**
 * Extract YAML frontmatter from a markdown string.
 * Returns { frontmatter: Object, body: string }.
 */
export function extractFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: markdown };
  }

  const yamlText = match[1];
  const body = match[2] || '';
  const frontmatter = parseSimpleYaml(yamlText);

  return { frontmatter, body };
}

/**
 * Minimal YAML parser for flat key: value and key: [list] structures.
 * Handles the subset used in the Obsidian template.
 */
function parseSimpleYaml(yaml) {
  const result = {};
  const lines = yaml.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
    if (!keyMatch) {
      i++;
      continue;
    }

    const key = keyMatch[1];
    const rawValue = keyMatch[2].trim();

    // Inline list: key: [a, b, c]
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      result[key] = rawValue
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
      i++;
      continue;
    }

    // Block list: next lines start with "  - "
    if (rawValue === '') {
      const listItems = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, ''));
        i++;
      }
      if (listItems.length > 0) {
        result[key] = listItems;
        continue;
      }
      // Not a list — empty value
      result[key] = '';
      continue;
    }

    // Quoted string
    if (
      (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))
    ) {
      result[key] = rawValue.slice(1, -1);
      i++;
      continue;
    }

    // Number
    if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
      result[key] = Number(rawValue);
      i++;
      continue;
    }

    // Boolean
    if (rawValue === 'true') {
      result[key] = true;
      i++;
      continue;
    }
    if (rawValue === 'false') {
      result[key] = false;
      i++;
      continue;
    }

    result[key] = rawValue;
    i++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Passage extraction
// ---------------------------------------------------------------------------

/**
 * Extract marked passages from body text.
 * Priority: explicit markers > comic code blocks > ==highlights==
 *
 * Returns an array of { text, extractionMethod } objects.
 */
export function extractPassages(body) {
  // 1. Explicit markers: [Marked passage begins]...[Marked passage ends]
  const explicitMatches = [];
  const explicitRe = /\[Marked passage begins\]([\s\S]*?)\[Marked passage ends\]/g;
  let m;
  while ((m = explicitRe.exec(body)) !== null) {
    const text = m[1].trim();
    if (text) explicitMatches.push({ text, extractionMethod: 'explicit' });
  }
  if (explicitMatches.length > 0) return explicitMatches;

  // 2. Comic code blocks: ```comic\n...\n```
  const comicMatches = [];
  const comicRe = /```comic\r?\n([\s\S]*?)```/g;
  while ((m = comicRe.exec(body)) !== null) {
    const text = m[1].trim();
    if (text) comicMatches.push({ text, extractionMethod: 'comic-block' });
  }
  if (comicMatches.length > 0) return comicMatches;

  // 3. Highlights: ==text==
  const highlightMatches = [];
  const highlightRe = /==([\s\S]*?)==/g;
  while ((m = highlightRe.exec(body)) !== null) {
    const text = m[1].trim();
    if (text) highlightMatches.push({ text, extractionMethod: 'highlight' });
  }
  if (highlightMatches.length > 0) return highlightMatches;

  // 4. Fallback: use entire body as a single passage
  const trimmed = body.trim();
  if (trimmed) return [{ text: trimmed, extractionMethod: 'full-body' }];

  return [];
}

// ---------------------------------------------------------------------------
// Frontmatter → StoryPrompts mapping
// ---------------------------------------------------------------------------

function frontmatterToPrompts(fm) {
  return createStoryPrompts({
    characters: Array.isArray(fm.characters)
      ? fm.characters
      : fm.characters
      ? [fm.characters]
      : [],
    emotion: fm.emotion || '',
    emotionalIntensity:
      typeof fm.emotional_intensity === 'number'
        ? fm.emotional_intensity
        : typeof fm.emotionalIntensity === 'number'
        ? fm.emotionalIntensity
        : 5,
    visualMetaphor: fm.visual_metaphor || fm.visualMetaphor || '',
    beforeContext: fm.before_context || fm.beforeContext || '',
    afterContext: fm.after_context || fm.afterContext || '',
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an Obsidian markdown string into a JournalEntry.
 * @param {string} markdown
 * @returns {import('./schema.js').JournalEntry}
 */
export function parseMarkdown(markdown) {
  const { frontmatter: fm, body } = extractFrontmatter(markdown);

  const passages = extractPassages(body);

  const entry = createJournalEntry({
    title: fm.title || 'Untitled Entry',
    date: fm.date ? String(fm.date) : new Date().toISOString(),
    themes: Array.isArray(fm.themes)
      ? fm.themes
      : fm.themes
      ? [fm.themes]
      : Array.isArray(fm.tags)
      ? fm.tags
      : [],
    passages,
    prompts: frontmatterToPrompts(fm),
    rawContent: markdown,
  });

  return entry;
}

/**
 * Parse a JSON export file (array of JournalEntry objects or wrapped object).
 * Accepts: JournalEntry[] | { entries: JournalEntry[] }
 * @param {string} jsonString
 * @returns {import('./schema.js').JournalEntry[]}
 */
export function parseJsonExport(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON: could not parse the export file.');
  }

  const entries = Array.isArray(parsed) ? parsed : parsed.entries;

  if (!Array.isArray(entries)) {
    throw new Error(
      'Invalid export format: expected an array of entries or { entries: [...] }.'
    );
  }

  return entries.map((raw) =>
    createJournalEntry({
      ...raw,
      prompts: createStoryPrompts(raw.prompts || {}),
      passages: Array.isArray(raw.passages) ? raw.passages : [],
      themes: Array.isArray(raw.themes) ? raw.themes : [],
    })
  );
}

/**
 * Parse a File object (from a file input element).
 * Detects .md vs .json by extension.
 * Returns a promise resolving to JournalEntry[].
 * @param {File} file
 * @returns {Promise<import('./schema.js').JournalEntry[]>}
 */
export async function parseFile(file) {
  const text = await file.text();
  const name = file.name.toLowerCase();

  if (name.endsWith('.json')) {
    return parseJsonExport(text);
  }

  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    return [parseMarkdown(text)];
  }

  throw new Error(`Unsupported file type: ${file.name}. Expected .md or .json.`);
}
