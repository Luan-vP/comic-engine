/**
 * Biography Snapshots - Data schema, templates, and mood presets
 */

// ─── Scene Templates ────────────────────────────────────────────────────────
// Maps to existing Panel variants. Keep lean: 5 templates for v1.

export const TEMPLATES = {
  childhood: {
    id: 'childhood',
    label: 'Childhood',
    description: 'Early memories, wonder, firsts',
    panelVariant: 'polaroid',
    color: '#d4a04a',
  },
  milestone: {
    id: 'milestone',
    label: 'Milestone',
    description: 'Achievements, transitions, graduations',
    panelVariant: 'default',
    color: '#667eea',
  },
  relationship: {
    id: 'relationship',
    label: 'Relationship',
    description: 'People who shaped you',
    panelVariant: 'torn',
    color: '#e94560',
  },
  challenge: {
    id: 'challenge',
    label: 'Challenge',
    description: 'Struggles, setbacks, perseverance',
    panelVariant: 'monitor',
    color: '#05d9e8',
  },
  realization: {
    id: 'realization',
    label: 'Realization',
    description: 'Insights, turning points, clarity',
    panelVariant: 'borderless',
    color: '#a855f7',
  },
};

// ─── Mood Presets ────────────────────────────────────────────────────────────
// Mapped to the 5 existing themes. No new themes created.

export const MOODS = {
  nostalgic: {
    id: 'nostalgic',
    label: 'Nostalgic',
    description: 'Warm, faded, bittersweet',
    theme: 'pulp',
    cssFilter: 'sepia(40%) contrast(1.1)',
  },
  dramatic: {
    id: 'dramatic',
    label: 'Dramatic',
    description: 'Dark, intense, high-contrast',
    theme: 'noir',
    cssFilter: 'contrast(1.3) brightness(0.85)',
  },
  peaceful: {
    id: 'peaceful',
    label: 'Peaceful',
    description: 'Soft, dreamy, gentle',
    theme: 'dreamscape',
    cssFilter: 'brightness(1.1) saturate(0.9)',
  },
  vibrant: {
    id: 'vibrant',
    label: 'Vibrant',
    description: 'Bold, energetic, vivid',
    theme: 'cyberpunk',
    cssFilter: 'saturate(1.4) brightness(1.05)',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean, clear, understated',
    theme: 'minimal',
    cssFilter: 'none',
  },
};

// ─── Character colour palette ────────────────────────────────────────────────

export const CHARACTER_COLORS = [
  '#e94560',
  '#667eea',
  '#a855f7',
  '#05d9e8',
  '#d4a04a',
  '#6ee7b7',
  '#fbbf24',
  '#f472b6',
];

export const RELATIONSHIP_SUGGESTIONS = [
  'Mother',
  'Father',
  'Sibling',
  'Partner',
  'Friend',
  'Teacher',
  'Mentor',
  'Colleague',
  'Child',
  'Grandparent',
];

// ─── Factory functions ───────────────────────────────────────────────────────

export function createSnapshot(fields = {}) {
  return {
    id: Date.now().toString(),
    title: '',
    who: '',
    what: '',
    when: '',
    where: '',
    feeling: '',
    templateId: 'milestone',
    moodId: 'nostalgic',
    characterIds: [],
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

export function createCharacter(fields = {}) {
  return {
    id: Date.now().toString(),
    name: '',
    relationship: '',
    color: CHARACTER_COLORS[Math.floor(Math.random() * CHARACTER_COLORS.length)],
    ...fields,
  };
}
