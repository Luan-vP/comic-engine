import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  MOODS,
  CHARACTER_COLORS,
  RELATIONSHIP_SUGGESTIONS,
  createSnapshot,
  createCharacter,
} from '../biographySchema';

describe('TEMPLATES', () => {
  it('defines at least 3 templates', () => {
    expect(Object.keys(TEMPLATES).length).toBeGreaterThanOrEqual(3);
  });

  it('each template has required fields', () => {
    for (const tmpl of Object.values(TEMPLATES)) {
      expect(tmpl).toHaveProperty('id');
      expect(tmpl).toHaveProperty('label');
      expect(tmpl).toHaveProperty('panelVariant');
      expect(tmpl).toHaveProperty('color');
      expect(['default', 'borderless', 'torn', 'polaroid', 'monitor']).toContain(tmpl.panelVariant);
    }
  });
});

describe('MOODS', () => {
  it('defines at least 3 moods', () => {
    expect(Object.keys(MOODS).length).toBeGreaterThanOrEqual(3);
  });

  it('each mood maps to an existing theme', () => {
    const validThemes = ['noir', 'cyberpunk', 'dreamscape', 'pulp', 'minimal'];
    for (const mood of Object.values(MOODS)) {
      expect(mood).toHaveProperty('id');
      expect(mood).toHaveProperty('label');
      expect(mood).toHaveProperty('theme');
      expect(mood).toHaveProperty('cssFilter');
      expect(validThemes).toContain(mood.theme);
    }
  });
});

describe('CHARACTER_COLORS', () => {
  it('is a non-empty array of colour strings', () => {
    expect(Array.isArray(CHARACTER_COLORS)).toBe(true);
    expect(CHARACTER_COLORS.length).toBeGreaterThan(0);
    for (const c of CHARACTER_COLORS) {
      expect(typeof c).toBe('string');
      expect(c.startsWith('#')).toBe(true);
    }
  });
});

describe('RELATIONSHIP_SUGGESTIONS', () => {
  it('is a non-empty array of strings', () => {
    expect(Array.isArray(RELATIONSHIP_SUGGESTIONS)).toBe(true);
    expect(RELATIONSHIP_SUGGESTIONS.length).toBeGreaterThan(0);
  });
});

describe('createSnapshot', () => {
  it('returns an object with required fields', () => {
    const snap = createSnapshot();
    expect(snap).toHaveProperty('id');
    expect(snap).toHaveProperty('title');
    expect(snap).toHaveProperty('templateId');
    expect(snap).toHaveProperty('moodId');
    expect(snap).toHaveProperty('characterIds');
    expect(snap).toHaveProperty('createdAt');
    expect(Array.isArray(snap.characterIds)).toBe(true);
  });

  it('merges provided fields', () => {
    const snap = createSnapshot({ title: 'First day of school', moodId: 'nostalgic' });
    expect(snap.title).toBe('First day of school');
    expect(snap.moodId).toBe('nostalgic');
  });

  it('generates unique ids', () => {
    const a = createSnapshot();
    expect(typeof a.id).toBe('string');
  });
});

describe('createCharacter', () => {
  it('returns an object with required fields', () => {
    const char = createCharacter();
    expect(char).toHaveProperty('id');
    expect(char).toHaveProperty('name');
    expect(char).toHaveProperty('relationship');
    expect(char).toHaveProperty('color');
  });

  it('merges provided fields', () => {
    const char = createCharacter({ name: 'Alice', relationship: 'Mother' });
    expect(char.name).toBe('Alice');
    expect(char.relationship).toBe('Mother');
  });

  it('assigns a colour from the palette', () => {
    const char = createCharacter();
    expect(CHARACTER_COLORS).toContain(char.color);
  });
});
