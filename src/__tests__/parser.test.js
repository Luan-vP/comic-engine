import { describe, it, expect } from 'vitest';
import {
  extractFrontmatter,
  extractPassages,
  parseMarkdown,
  parseJsonExport,
} from '../journal/parser.js';

// ---------------------------------------------------------------------------
// extractFrontmatter
// ---------------------------------------------------------------------------

describe('extractFrontmatter', () => {
  it('returns empty frontmatter and full content when no frontmatter block', () => {
    const { frontmatter, body } = extractFrontmatter('# Hello\n\nWorld');
    expect(frontmatter).toEqual({});
    expect(body).toContain('Hello');
  });

  it('parses simple key: value pairs', () => {
    const md = `---\ntitle: My Entry\ndate: 2024-01-01\n---\nBody text`;
    const { frontmatter, body } = extractFrontmatter(md);
    expect(frontmatter.title).toBe('My Entry');
    expect(frontmatter.date).toBe('2024-01-01');
    expect(body).toBe('Body text');
  });

  it('parses inline lists', () => {
    const md = `---\nthemes: [healing, identity]\n---\nBody`;
    const { frontmatter } = extractFrontmatter(md);
    expect(frontmatter.themes).toEqual(['healing', 'identity']);
  });

  it('parses block lists', () => {
    const md = `---\nthemes:\n  - healing\n  - identity\n---\nBody`;
    const { frontmatter } = extractFrontmatter(md);
    expect(frontmatter.themes).toEqual(['healing', 'identity']);
  });

  it('parses numeric values', () => {
    const md = `---\nemotional_intensity: 7\n---\nBody`;
    const { frontmatter } = extractFrontmatter(md);
    expect(frontmatter.emotional_intensity).toBe(7);
  });

  it('handles quoted strings', () => {
    const md = `---\nemotion: "raw grief"\n---\nBody`;
    const { frontmatter } = extractFrontmatter(md);
    expect(frontmatter.emotion).toBe('raw grief');
  });
});

// ---------------------------------------------------------------------------
// extractPassages
// ---------------------------------------------------------------------------

describe('extractPassages', () => {
  it('extracts explicit marker passages', () => {
    const body = `Before.\n[Marked passage begins]\nHello passage\n[Marked passage ends]\nAfter.`;
    const passages = extractPassages(body);
    expect(passages).toHaveLength(1);
    expect(passages[0].text).toBe('Hello passage');
    expect(passages[0].extractionMethod).toBe('explicit');
  });

  it('extracts multiple explicit passages', () => {
    const body = `[Marked passage begins]\nFirst\n[Marked passage ends]\n[Marked passage begins]\nSecond\n[Marked passage ends]`;
    const passages = extractPassages(body);
    expect(passages).toHaveLength(2);
  });

  it('falls back to comic blocks when no explicit markers', () => {
    const body = `Some prose.\n\`\`\`comic\nComic text here\n\`\`\`\nMore prose.`;
    const passages = extractPassages(body);
    expect(passages).toHaveLength(1);
    expect(passages[0].text).toBe('Comic text here');
    expect(passages[0].extractionMethod).toBe('comic-block');
  });

  it('falls back to highlights when no markers or blocks', () => {
    const body = `Normal text. ==highlighted moment== more text.`;
    const passages = extractPassages(body);
    expect(passages).toHaveLength(1);
    expect(passages[0].text).toBe('highlighted moment');
    expect(passages[0].extractionMethod).toBe('highlight');
  });

  it('uses full body as fallback when nothing else matches', () => {
    const body = `Just a plain entry with no markers.`;
    const passages = extractPassages(body);
    expect(passages).toHaveLength(1);
    expect(passages[0].extractionMethod).toBe('full-body');
  });

  it('returns empty array for empty body', () => {
    const passages = extractPassages('');
    expect(passages).toHaveLength(0);
  });

  it('prefers explicit markers over comic blocks', () => {
    const body = `[Marked passage begins]\nExplicit\n[Marked passage ends]\n\`\`\`comic\nBlock\n\`\`\``;
    const passages = extractPassages(body);
    expect(passages[0].extractionMethod).toBe('explicit');
  });
});

// ---------------------------------------------------------------------------
// parseMarkdown
// ---------------------------------------------------------------------------

describe('parseMarkdown', () => {
  it('parses a complete markdown entry', () => {
    const md = `---
title: "Test Entry"
date: 2024-05-15
themes:
  - healing
emotion: "nostalgic"
emotional_intensity: 6
---
Some text.
[Marked passage begins]
A memorable moment
[Marked passage ends]`;

    const entry = parseMarkdown(md);
    expect(entry.title).toBe('Test Entry');
    expect(entry.date).toBe('2024-05-15');
    expect(entry.themes).toContain('healing');
    expect(entry.prompts.emotion).toBe('nostalgic');
    expect(entry.prompts.emotionalIntensity).toBe(6);
    expect(entry.passages[0].text).toBe('A memorable moment');
  });

  it('uses defaults for missing frontmatter', () => {
    const entry = parseMarkdown('Just some text here with no frontmatter.');
    expect(entry.title).toBe('Untitled Entry');
    expect(entry.themes).toEqual([]);
    expect(entry.prompts.emotionalIntensity).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// parseJsonExport
// ---------------------------------------------------------------------------

describe('parseJsonExport', () => {
  it('parses an array of entries', () => {
    const json = JSON.stringify([
      { title: 'Entry One', date: '2024-01-01', themes: ['healing'], passages: [], prompts: {} },
    ]);
    const entries = parseJsonExport(json);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Entry One');
  });

  it('parses a wrapped { entries: [...] } format', () => {
    const json = JSON.stringify({
      entries: [{ title: 'Entry Two', date: '2024-02-01', themes: [], passages: [], prompts: {} }],
    });
    const entries = parseJsonExport(json);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Entry Two');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseJsonExport('not json')).toThrow('Invalid JSON');
  });

  it('throws when entries are not an array', () => {
    expect(() => parseJsonExport(JSON.stringify({ name: 'something' }))).toThrow(
      'Invalid export format',
    );
  });

  it('applies defaults for missing fields', () => {
    const json = JSON.stringify([{ title: 'Minimal' }]);
    const entries = parseJsonExport(json);
    expect(entries[0].themes).toEqual([]);
    expect(entries[0].passages).toEqual([]);
    expect(entries[0].prompts.emotionalIntensity).toBe(5);
  });
});
