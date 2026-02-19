import { describe, it, expect } from 'vitest';
import { generateSceneConfig, generatePassageConfig, groupByTheme } from '../sceneGenerator';

describe('generatePassageConfig', () => {
  it('maps nostalgic emotion to polaroid variant', () => {
    const passage = { text: 'A memory', storyPrompts: { emotion: 'nostalgic', emotionalIntensity: 5 } };
    const config = generatePassageConfig(passage);
    expect(config.panelVariant).toBe('polaroid');
  });

  it('maps raw emotion to torn variant', () => {
    const passage = { text: 'A memory', storyPrompts: { emotion: 'raw', emotionalIntensity: 8 } };
    const config = generatePassageConfig(passage);
    expect(config.panelVariant).toBe('torn');
  });

  it('maps calm emotion to borderless variant', () => {
    const passage = { text: 'A memory', storyPrompts: { emotion: 'calm', emotionalIntensity: 3 } };
    const config = generatePassageConfig(passage);
    expect(config.panelVariant).toBe('borderless');
  });

  it('defaults to default variant for unknown emotion', () => {
    const passage = { text: 'A memory', storyPrompts: { emotion: 'puzzled', emotionalIntensity: 5 } };
    const config = generatePassageConfig(passage);
    expect(config.panelVariant).toBe('default');
  });

  it('uses position override when provided', () => {
    const passage = { text: 'A memory', storyPrompts: {} };
    const override = { position: [100, 200, -50], rotation: [5, 0, 0] };
    const config = generatePassageConfig(passage, override);
    expect(config.position).toEqual([100, 200, -50]);
    expect(config.rotation).toEqual([5, 0, 0]);
  });

  it('uppercases emotion as title', () => {
    const passage = { text: 'Text', storyPrompts: { emotion: 'joy' } };
    const config = generatePassageConfig(passage);
    expect(config.title).toBe('JOY');
  });

  it('uses MEMORY as title when no emotion', () => {
    const passage = { text: 'Text', storyPrompts: {} };
    const config = generatePassageConfig(passage);
    expect(config.title).toBe('MEMORY');
  });
});

describe('generateSceneConfig', () => {
  it('returns empty array for no entries', () => {
    expect(generateSceneConfig([])).toEqual([]);
  });

  it('generates one object per passage', () => {
    const entries = [
      {
        id: 'e1',
        date: '2024-01-01',
        title: 'Test',
        passages: [
          { text: 'First', storyPrompts: { emotion: 'nostalgic', emotionalIntensity: 6 } },
          { text: 'Second', storyPrompts: { emotion: 'calm', emotionalIntensity: 3 } },
        ],
        themes: ['healing'],
      },
    ];
    const result = generateSceneConfig(entries);
    expect(result).toHaveLength(2);
    expect(result[0].panelVariant).toBe('polaroid');
    expect(result[1].panelVariant).toBe('borderless');
  });

  it('falls back to entry title when no passages', () => {
    const entries = [{ id: 'e1', date: '2024-01-01', title: 'My Entry', passages: [], themes: [] }];
    const result = generateSceneConfig(entries);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('My Entry');
  });

  it('filters by theme', () => {
    const entries = [
      { id: 'e1', date: '2024-01-01', title: 'A', passages: [{ text: 'p1', storyPrompts: {} }], themes: ['healing'] },
      { id: 'e2', date: '2024-01-02', title: 'B', passages: [{ text: 'p2', storyPrompts: {} }], themes: ['work'] },
    ];
    const result = generateSceneConfig(entries, { theme: 'healing' });
    expect(result).toHaveLength(1);
    expect(result[0].themes).toContain('healing');
  });

  it('sorts entries chronologically', () => {
    const entries = [
      { id: 'e2', date: '2024-03-01', title: 'Later', passages: [{ text: 'later', storyPrompts: {} }], themes: [] },
      { id: 'e1', date: '2024-01-01', title: 'Earlier', passages: [{ text: 'earlier', storyPrompts: {} }], themes: [] },
    ];
    const result = generateSceneConfig(entries);
    expect(result[0].entryTitle).toBe('Earlier');
    expect(result[1].entryTitle).toBe('Later');
  });

  it('includes entry metadata on each scene object', () => {
    const entries = [
      { id: 'e1', date: '2024-01-01', title: 'Test', passages: [{ text: 'p', storyPrompts: {} }], themes: ['healing'] },
    ];
    const result = generateSceneConfig(entries);
    expect(result[0].entryId).toBe('e1');
    expect(result[0].entryDate).toBe('2024-01-01');
    expect(result[0].entryTitle).toBe('Test');
    expect(result[0].themes).toContain('healing');
  });

  it('uses spiral layout when specified', () => {
    const entries = [
      { id: 'e1', date: '2024-01-01', title: 'A', passages: [{ text: 'p', storyPrompts: {} }], themes: [] },
      { id: 'e2', date: '2024-02-01', title: 'B', passages: [{ text: 'p', storyPrompts: {} }], themes: [] },
    ];
    const result = generateSceneConfig(entries, { layout: 'spiral' });
    expect(result).toHaveLength(2);
    // Spiral first entry starts at center (radius=150)
    expect(Math.abs(result[0].position[0]) + Math.abs(result[0].position[1])).toBeGreaterThan(0);
  });
});

describe('groupByTheme', () => {
  it('groups entries by theme', () => {
    const entries = [
      { id: 'e1', themes: ['healing', 'family'] },
      { id: 'e2', themes: ['healing'] },
      { id: 'e3', themes: ['work'] },
    ];
    const map = groupByTheme(entries);
    expect(map.get('healing')).toHaveLength(2);
    expect(map.get('family')).toHaveLength(1);
    expect(map.get('work')).toHaveLength(1);
  });

  it('puts entries without themes into (unthemed)', () => {
    const entries = [{ id: 'e1', themes: [] }];
    const map = groupByTheme(entries);
    expect(map.has('(unthemed)')).toBe(true);
    expect(map.get('(unthemed)')).toHaveLength(1);
  });

  it('returns empty map for empty input', () => {
    const map = groupByTheme([]);
    expect(map.size).toBe(0);
  });
});
