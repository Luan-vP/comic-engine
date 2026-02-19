import { describe, it, expect } from 'vitest';
import {
  emotionToVariant,
  intensityToZDepth,
  intensityToParallaxFactor,
  generateSceneObjects,
  groupEntriesByTheme,
} from '../journal/sceneGenerator.js';
import { createJournalEntry } from '../journal/schema.js';

// ---------------------------------------------------------------------------
// emotionToVariant
// ---------------------------------------------------------------------------

describe('emotionToVariant', () => {
  it('maps nostalgic → polaroid', () => {
    expect(emotionToVariant('nostalgic')).toBe('polaroid');
  });

  it('maps raw → torn', () => {
    expect(emotionToVariant('raw')).toBe('torn');
  });

  it('maps disconnected → monitor', () => {
    expect(emotionToVariant('disconnected')).toBe('monitor');
  });

  it('maps calm → borderless', () => {
    expect(emotionToVariant('calm')).toBe('borderless');
  });

  it('returns default for unknown emotion', () => {
    expect(emotionToVariant('confused')).toBe('default');
  });

  it('returns default for empty string', () => {
    expect(emotionToVariant('')).toBe('default');
  });

  it('is case-insensitive', () => {
    expect(emotionToVariant('Nostalgic')).toBe('polaroid');
    expect(emotionToVariant('RAW')).toBe('torn');
  });
});

// ---------------------------------------------------------------------------
// intensityToZDepth
// ---------------------------------------------------------------------------

describe('intensityToZDepth', () => {
  it('maps intensity 1 to far background', () => {
    const z = intensityToZDepth(1);
    expect(z).toBeLessThan(-100);
  });

  it('maps intensity 10 to foreground', () => {
    const z = intensityToZDepth(10);
    expect(z).toBeGreaterThan(0);
  });

  it('maps intensity 5-6 to midground', () => {
    const z = intensityToZDepth(5);
    expect(z).toBeGreaterThan(-200);
    expect(z).toBeLessThan(100);
  });

  it('clamps values below 1', () => {
    expect(intensityToZDepth(0)).toBe(intensityToZDepth(1));
  });

  it('clamps values above 10', () => {
    expect(intensityToZDepth(11)).toBe(intensityToZDepth(10));
  });
});

// ---------------------------------------------------------------------------
// intensityToParallaxFactor
// ---------------------------------------------------------------------------

describe('intensityToParallaxFactor', () => {
  it('returns low factor for low intensity', () => {
    expect(intensityToParallaxFactor(1)).toBeLessThan(0.3);
  });

  it('returns high factor for high intensity', () => {
    expect(intensityToParallaxFactor(10)).toBeGreaterThan(0.8);
  });

  it('returns mid factor for intensity 5', () => {
    const f = intensityToParallaxFactor(5);
    expect(f).toBeGreaterThan(0.3);
    expect(f).toBeLessThan(0.8);
  });
});

// ---------------------------------------------------------------------------
// generateSceneObjects
// ---------------------------------------------------------------------------

function makeEntry(overrides = {}) {
  return createJournalEntry({
    title: 'Test Entry',
    date: '2024-01-01',
    themes: ['healing'],
    passages: [{ text: 'A passage', extractionMethod: 'explicit' }],
    prompts: {
      characters: ['Me'],
      emotion: 'nostalgic',
      emotionalIntensity: 6,
      visualMetaphor: '',
      beforeContext: '',
      afterContext: '',
    },
    ...overrides,
  });
}

describe('generateSceneObjects', () => {
  it('returns empty array for empty entries', () => {
    expect(generateSceneObjects([])).toEqual([]);
    expect(generateSceneObjects(null)).toEqual([]);
  });

  it('returns one scene object per entry', () => {
    const entries = [makeEntry(), makeEntry({ title: 'Second', id: 'second' })];
    const objects = generateSceneObjects(entries);
    expect(objects).toHaveLength(2);
  });

  it('maps emotion to correct variant', () => {
    const entry = makeEntry({ prompts: { emotion: 'raw', emotionalIntensity: 7 } });
    const [obj] = generateSceneObjects([entry]);
    expect(obj.variant).toBe('torn');
  });

  it('uses first passage text', () => {
    const entry = makeEntry();
    const [obj] = generateSceneObjects([entry]);
    expect(obj.passage).toBe('A passage');
  });

  it('falls back to title when no passages', () => {
    const entry = makeEntry({ passages: [] });
    const [obj] = generateSceneObjects([entry]);
    expect(obj.passage).toBe(entry.title);
  });

  it('outputs position as [x, y, z] array', () => {
    const [obj] = generateSceneObjects([makeEntry()]);
    expect(Array.isArray(obj.position)).toBe(true);
    expect(obj.position).toHaveLength(3);
  });

  it('outputs valid parallaxFactor', () => {
    const [obj] = generateSceneObjects([makeEntry()]);
    expect(typeof obj.parallaxFactor).toBe('number');
    expect(obj.parallaxFactor).toBeGreaterThan(0);
  });

  it('supports spiral layout', () => {
    const entries = [makeEntry(), makeEntry({ id: 'e2' }), makeEntry({ id: 'e3' })];
    const objects = generateSceneObjects(entries, 'spiral');
    expect(objects).toHaveLength(3);
    // Positions should differ
    expect(objects[0].position[0]).not.toBe(objects[1].position[0]);
  });

  it('supports stack layout', () => {
    const entries = [makeEntry(), makeEntry({ id: 's2' })];
    const objects = generateSceneObjects(entries, 'stack');
    expect(objects).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// groupEntriesByTheme
// ---------------------------------------------------------------------------

describe('groupEntriesByTheme', () => {
  it('groups entries by their themes', () => {
    const e1 = makeEntry({ id: 'e1', themes: ['healing'] });
    const e2 = makeEntry({ id: 'e2', themes: ['identity'] });
    const e3 = makeEntry({ id: 'e3', themes: ['healing', 'identity'] });

    const groups = groupEntriesByTheme([e1, e2, e3]);
    const healingGroup = groups.find((g) => g.theme === 'healing');
    const identityGroup = groups.find((g) => g.theme === 'identity');

    expect(healingGroup.entries).toHaveLength(2);
    expect(identityGroup.entries).toHaveLength(2);
  });

  it('groups entries with no themes under "untagged"', () => {
    const entry = makeEntry({ themes: [] });
    const groups = groupEntriesByTheme([entry]);
    expect(groups[0].theme).toBe('untagged');
    expect(groups[0].entries).toHaveLength(1);
  });

  it('returns entries sorted by date within each group', () => {
    const older = makeEntry({ id: 'older', date: '2023-01-01', themes: ['a'] });
    const newer = makeEntry({ id: 'newer', date: '2024-06-01', themes: ['a'] });
    const groups = groupEntriesByTheme([newer, older]);
    const group = groups.find((g) => g.theme === 'a');
    expect(group.entries[0].id).toBe('older');
    expect(group.entries[1].id).toBe('newer');
  });
});
