import { describe, it, expect } from 'vitest';
import {
  TEMPLATES,
  MOODS,
  createSnapshot,
  createCharacter,
  RELATIONSHIP_SUGGESTIONS,
  CHARACTER_COLORS,
} from '../biographySchema';

describe('biographySchema — TEMPLATES', () => {
  it('defines exactly 5 templates', () => {
    expect(Object.keys(TEMPLATES)).toHaveLength(5);
  });

  it('every template has required fields', () => {
    for (const t of Object.values(TEMPLATES)) {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('label');
      expect(t).toHaveProperty('description');
      expect(t).toHaveProperty('panelVariant');
      expect(t).toHaveProperty('color');
      expect(typeof t.panelVariant).toBe('string');
    }
  });

  it('template ids match their keys', () => {
    for (const [key, t] of Object.entries(TEMPLATES)) {
      expect(t.id).toBe(key);
    }
  });
});

describe('biographySchema — MOODS', () => {
  it('defines exactly 5 moods', () => {
    expect(Object.keys(MOODS)).toHaveLength(5);
  });

  it('every mood has required fields', () => {
    for (const m of Object.values(MOODS)) {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('label');
      expect(m).toHaveProperty('description');
      expect(m).toHaveProperty('theme');
      expect(m).toHaveProperty('cssFilter');
    }
  });

  it('mood ids match their keys', () => {
    for (const [key, m] of Object.entries(MOODS)) {
      expect(m.id).toBe(key);
    }
  });

  it('mood themes are valid app theme names', () => {
    const validThemes = ['noir', 'cyberpunk', 'dreamscape', 'pulp', 'minimal'];
    for (const m of Object.values(MOODS)) {
      expect(validThemes).toContain(m.theme);
    }
  });
});

describe('biographySchema — createSnapshot', () => {
  it('returns an object with all required fields', () => {
    const s = createSnapshot();
    expect(s).toHaveProperty('id');
    expect(s).toHaveProperty('title');
    expect(s).toHaveProperty('who');
    expect(s).toHaveProperty('what');
    expect(s).toHaveProperty('when');
    expect(s).toHaveProperty('where');
    expect(s).toHaveProperty('feeling');
    expect(s).toHaveProperty('template');
    expect(s).toHaveProperty('mood');
    expect(s).toHaveProperty('characterIds');
    expect(s).toHaveProperty('createdAt');
    expect(Array.isArray(s.characterIds)).toBe(true);
  });

  it('merges provided fields', () => {
    const s = createSnapshot({ title: 'First Day', template: 'childhood', mood: 'nostalgic' });
    expect(s.title).toBe('First Day');
    expect(s.template).toBe('childhood');
    expect(s.mood).toBe('nostalgic');
  });

  it('generates unique ids for different snapshots', () => {
    const a = createSnapshot();
    const b = createSnapshot();
    expect(a.id).not.toBe(b.id);
  });
});

describe('biographySchema — createCharacter', () => {
  it('returns an object with required fields', () => {
    const c = createCharacter();
    expect(c).toHaveProperty('id');
    expect(c).toHaveProperty('name');
    expect(c).toHaveProperty('relationship');
    expect(c).toHaveProperty('color');
  });

  it('merges provided fields', () => {
    const c = createCharacter({ name: 'Alice', relationship: 'Friend', color: '#ff0000' });
    expect(c.name).toBe('Alice');
    expect(c.relationship).toBe('Friend');
    expect(c.color).toBe('#ff0000');
  });
});

describe('biographySchema — helpers', () => {
  it('RELATIONSHIP_SUGGESTIONS is a non-empty array of strings', () => {
    expect(Array.isArray(RELATIONSHIP_SUGGESTIONS)).toBe(true);
    expect(RELATIONSHIP_SUGGESTIONS.length).toBeGreaterThan(0);
    for (const r of RELATIONSHIP_SUGGESTIONS) {
      expect(typeof r).toBe('string');
    }
  });

  it('CHARACTER_COLORS is a non-empty array of hex strings', () => {
    expect(Array.isArray(CHARACTER_COLORS)).toBe(true);
    expect(CHARACTER_COLORS.length).toBeGreaterThan(0);
    for (const c of CHARACTER_COLORS) {
      expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
