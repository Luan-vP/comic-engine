import { describe, it, expect } from 'vitest';
import { parseFrontmatter, parseMarkdown, parseJsonExport } from '../parser';

describe('parseFrontmatter', () => {
  it('returns empty frontmatter for markdown without --- block', () => {
    const { frontmatter, body } = parseFrontmatter('Hello world');
    expect(frontmatter).toEqual({});
    expect(body).toBe('Hello world');
  });

  it('parses basic key-value frontmatter', () => {
    const md = `---\ntitle: My Entry\ndate: 2024-01-15\n---\nBody text`;
    const { frontmatter, body } = parseFrontmatter(md);
    expect(frontmatter.title).toBe('My Entry');
    expect(frontmatter.date).toBe('2024-01-15');
    expect(body).toBe('Body text');
  });

  it('parses YAML list frontmatter', () => {
    const md = `---\nthemes:\n  - healing\n  - family\n---\nBody`;
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter.themes).toEqual(['healing', 'family']);
  });

  it('parses inline array frontmatter', () => {
    const md = `---\ncharacters: [Me, Sister]\n---\nBody`;
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter.characters).toEqual(['Me', 'Sister']);
  });

  it('parses boolean values', () => {
    const md = `---\ncomic-candidate: true\n---\nBody`;
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter['comic-candidate']).toBe(true);
  });

  it('parses numeric values', () => {
    const md = `---\nemotional-intensity: 8\n---\nBody`;
    const { frontmatter } = parseFrontmatter(md);
    expect(frontmatter['emotional-intensity']).toBe(8);
  });
});

describe('parseMarkdown', () => {
  it('parses a full markdown entry into a JournalEntry', () => {
    const md = `---
title: Test Entry
date: 2024-01-15
emotion: nostalgic
emotional-intensity: 6
themes:
  - healing
---
==A highlighted memory==`;
    const entry = parseMarkdown(md);
    expect(entry.title).toBe('Test Entry');
    expect(entry.date).toBe('2024-01-15');
    expect(entry.themes).toContain('healing');
    expect(entry.passages).toHaveLength(1);
    expect(entry.passages[0].text).toBe('A highlighted memory');
    expect(entry.passages[0].storyPrompts.emotion).toBe('nostalgic');
    expect(entry.passages[0].storyPrompts.emotionalIntensity).toBe(6);
  });

  it('extracts passages using explicit [Marked passage] markers', () => {
    const md = `---\n---\nText [Marked passage begins]The memory[Marked passage ends] more text`;
    const entry = parseMarkdown(md);
    expect(entry.passages).toHaveLength(1);
    expect(entry.passages[0].text).toBe('The memory');
  });

  it('extracts passages using ```comic code blocks', () => {
    const md = '---\n---\n```comic\nThe comic passage\n```';
    const entry = parseMarkdown(md);
    expect(entry.passages).toHaveLength(1);
    expect(entry.passages[0].text).toBe('The comic passage');
  });

  it('prefers explicit markers over highlights', () => {
    const md = `---\n---\n[Marked passage begins]Explicit[Marked passage ends]\n==Highlight==`;
    const entry = parseMarkdown(md);
    expect(entry.passages).toHaveLength(1);
    expect(entry.passages[0].text).toBe('Explicit');
  });

  it('returns empty passages for plain markdown with no markers', () => {
    const entry = parseMarkdown('Just some text with no markers');
    expect(entry.passages).toHaveLength(0);
  });

  it('generates a stable id from date and title', () => {
    const entry = parseMarkdown('---\ntitle: My Entry\ndate: 2024-03-10\n---\n');
    expect(entry.id).toBe('entry-2024-03-10-my-entry');
  });

  it('derives title from first H1 if not in frontmatter', () => {
    const entry = parseMarkdown('---\n---\n# Great Title\nSome text');
    expect(entry.title).toBe('Great Title');
  });

  it('respects overrides argument', () => {
    const entry = parseMarkdown('Some text', { date: '2024-05-01', id: 'custom-id' });
    expect(entry.date).toBe('2024-05-01');
    expect(entry.id).toBe('custom-id');
  });
});

describe('parseJsonExport', () => {
  it('returns entries from a JournalExport object', () => {
    const data = {
      version: '1.0.0',
      entries: [
        { id: 'e1', title: 'One', date: '2024-01-01' },
        { id: 'e2', title: 'Two', date: '2024-01-02' },
      ],
    };
    const result = parseJsonExport(data);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('e1');
  });

  it('handles a raw array of entries', () => {
    const data = [{ id: 'e1', title: 'One' }];
    const result = parseJsonExport(data);
    expect(result).toHaveLength(1);
  });

  it('returns empty array for invalid input', () => {
    expect(parseJsonExport(null)).toEqual([]);
    expect(parseJsonExport({})).toEqual([]);
    expect(parseJsonExport('string')).toEqual([]);
  });
});
