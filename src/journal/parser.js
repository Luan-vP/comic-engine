/**
 * Journal Integration - Obsidian Markdown Parser
 *
 * Parses Obsidian markdown files with YAML frontmatter into JournalEntry objects.
 *
 * Supports three passage extraction methods (tried in priority order):
 *   1. Explicit markers: [Marked passage begins]...[Marked passage ends]
 *   2. Comic code blocks: ```comic ... ```
 *   3. Obsidian highlights: ==highlighted text==
 *
 * No external dependencies — uses regex and line-by-line parsing.
 */

import { createBlankEntry, createBlankPrompts } from './schema';

/**
 * Parse a YAML value string into a JS primitive or simple array.
 */
function parseYamlValue(valueStr) {
  const trimmed = valueStr.trim();

  // Inline array: [a, b, c]
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter(Boolean);
  }

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;

  // Strip surrounding quotes
  return trimmed.replace(/^['"]|['"]$/g, '');
}

/**
 * Parse YAML frontmatter from a markdown string.
 * Returns { frontmatter, body }.
 */
export function parseFrontmatter(markdown) {
  const frontmatter = {};
  let body = markdown;

  const fmMatch = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!fmMatch) {
    return { frontmatter, body };
  }

  const rawFm = fmMatch[1];
  body = fmMatch[2] || '';

  const lines = rawFm.split('\n');
  let currentKey = null;
  let currentList = null;

  for (const line of lines) {
    // List item under a key (indented "- value")
    if (currentKey && /^\s+-\s+/.test(line)) {
      const value = line.replace(/^\s+-\s+/, '').trim().replace(/^['"]|['"]$/g, '');
      if (!currentList) {
        currentList = [];
        frontmatter[currentKey] = currentList;
      }
      currentList.push(value);
      continue;
    }

    // Key-value pair
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_-]*):\s*(.*)?$/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const rawValue = (kvMatch[2] || '').trim();
      currentList = null;
      if (rawValue === '') {
        frontmatter[currentKey] = null;
      } else {
        frontmatter[currentKey] = parseYamlValue(rawValue);
      }
      continue;
    }

    currentKey = null;
    currentList = null;
  }

  return { frontmatter, body };
}

/**
 * Extract story prompts from frontmatter fields.
 */
function extractStoryPrompts(frontmatter) {
  const prompts = createBlankPrompts();

  if (frontmatter.characters) {
    prompts.characters = Array.isArray(frontmatter.characters)
      ? frontmatter.characters
      : [String(frontmatter.characters)];
  }

  if (frontmatter.emotion) prompts.emotion = String(frontmatter.emotion);

  const intensity = frontmatter['emotional-intensity'] ?? frontmatter['emotional_intensity'];
  if (intensity != null) {
    prompts.emotionalIntensity = Number(intensity) || 5;
  }

  const metaphor = frontmatter['visual-metaphor'] ?? frontmatter['visual_metaphor'];
  if (metaphor) prompts.visualMetaphor = String(metaphor);

  const ctxBefore = frontmatter['context-before'] ?? frontmatter['context_before'];
  if (ctxBefore) prompts.contextBefore = String(ctxBefore);

  const ctxAfter = frontmatter['context-after'] ?? frontmatter['context_after'];
  if (ctxAfter) prompts.contextAfter = String(ctxAfter);

  return prompts;
}

/**
 * Extract passages using [Marked passage begins]...[Marked passage ends].
 */
function extractMarkedPassages(body, storyPrompts) {
  const passages = [];
  const markerRegex = /\[Marked passage begins\]([\s\S]*?)\[Marked passage ends\]/gi;
  let match;
  while ((match = markerRegex.exec(body)) !== null) {
    const text = match[1].trim();
    if (text) passages.push({ text, storyPrompts: { ...storyPrompts } });
  }
  return passages;
}

/**
 * Extract passages from ```comic ... ``` code blocks.
 */
function extractComicBlocks(body, storyPrompts) {
  const passages = [];
  const blockRegex = /```comic\r?\n([\s\S]*?)```/gi;
  let match;
  while ((match = blockRegex.exec(body)) !== null) {
    const text = match[1].trim();
    if (text) passages.push({ text, storyPrompts: { ...storyPrompts } });
  }
  return passages;
}

/**
 * Extract passages from Obsidian ==highlights==.
 */
function extractHighlightedPassages(body, storyPrompts) {
  const passages = [];
  const highlightRegex = /==([^=]+)==/g;
  let match;
  while ((match = highlightRegex.exec(body)) !== null) {
    const text = match[1].trim();
    if (text) passages.push({ text, storyPrompts: { ...storyPrompts } });
  }
  return passages;
}

/**
 * Extract themes from frontmatter (themes, comic-themes).
 */
function extractThemes(frontmatter) {
  const themes = new Set();
  for (const field of ['themes', 'comic-themes', 'comic_themes']) {
    if (frontmatter[field]) {
      const val = frontmatter[field];
      if (Array.isArray(val)) val.forEach((t) => themes.add(String(t)));
      else themes.add(String(val));
    }
  }
  return Array.from(themes);
}

/**
 * Extract Obsidian tags from frontmatter and inline body tags.
 */
function extractTags(frontmatter, body) {
  const tags = new Set();

  if (frontmatter.tags) {
    const val = frontmatter.tags;
    if (Array.isArray(val)) val.forEach((t) => tags.add(String(t)));
    else tags.add(String(val));
  }

  const tagRegex = /#([a-zA-Z][a-zA-Z0-9_-]*)/g;
  let match;
  while ((match = tagRegex.exec(body)) !== null) {
    tags.add(match[1]);
  }

  return Array.from(tags);
}

/**
 * Generate a stable ID from a date and title.
 */
function generateId(date, title) {
  const datePart = date || 'no-date';
  const titlePart = (title || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `entry-${datePart}-${titlePart}`;
}

/**
 * Parse a single Obsidian markdown string into a JournalEntry.
 *
 * @param {string} markdown - Full markdown content of an Obsidian note
 * @param {Object} [overrides] - Optional field overrides (e.g. filename-derived date)
 * @returns {JournalEntry}
 */
export function parseMarkdown(markdown, overrides = {}) {
  const { frontmatter, body } = parseFrontmatter(markdown);

  const title =
    frontmatter.title ||
    overrides.title ||
    (body.match(/^#\s+(.+)/m) || [])[1] ||
    'Untitled Entry';

  const date =
    frontmatter.date ||
    frontmatter.created ||
    overrides.date ||
    new Date().toISOString().split('T')[0];

  const storyPrompts = extractStoryPrompts(frontmatter);
  const themes = extractThemes(frontmatter);
  const tags = extractTags(frontmatter, body);

  // Try extraction methods in priority order
  let passages = extractMarkedPassages(body, storyPrompts);
  if (passages.length === 0) passages = extractComicBlocks(body, storyPrompts);
  if (passages.length === 0) passages = extractHighlightedPassages(body, storyPrompts);

  const id = frontmatter.id || overrides.id || generateId(date, title);

  return {
    ...createBlankEntry(),
    id,
    date,
    title,
    content: body,
    passages,
    themes,
    tags,
    frontmatter,
    ...overrides,
  };
}

/**
 * Parse a JSON export into an array of JournalEntry objects.
 * Accepts either a JournalExport object or a raw array of entries.
 *
 * @param {Object|Array} jsonData - Parsed JSON data
 * @returns {JournalEntry[]}
 */
export function parseJsonExport(jsonData) {
  if (Array.isArray(jsonData)) {
    return jsonData.filter(isEntryLike);
  }
  if (jsonData && Array.isArray(jsonData.entries)) {
    return jsonData.entries.filter(isEntryLike);
  }
  return [];
}

function isEntryLike(entry) {
  return entry && typeof entry === 'object' && (entry.id || entry.title || entry.date);
}

/**
 * Parse a File object (from a file input) into JournalEntry objects.
 *
 * @param {File} file - File object from a file input element
 * @returns {Promise<JournalEntry[]>}
 */
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const filename = file.name;
      try {
        if (filename.endsWith('.json')) {
          const data = JSON.parse(text);
          resolve(parseJsonExport(data));
        } else if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
          const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
          const overrides = dateMatch ? { date: dateMatch[1] } : {};
          resolve([parseMarkdown(text, overrides)]);
        } else {
          reject(new Error(`Unsupported file type: ${filename}`));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
