/**
 * Biography Snapshots — data structures, scene templates, and mood presets
 *
 * Templates define how a memory is rendered as a comic panel.
 * Moods map to existing app themes — no new themes are created here.
 */

// ---------------------------------------------------------------------------
// Scene Templates
// ---------------------------------------------------------------------------

export const TEMPLATES = {
  childhood: {
    id: 'childhood',
    label: 'Childhood',
    description: 'Early memories, formative moments',
    panelVariant: 'polaroid',
    color: '#d4a04a',
  },
  milestone: {
    id: 'milestone',
    label: 'Milestone',
    description: 'Achievements and turning points',
    panelVariant: 'default',
    color: '#667eea',
  },
  relationship: {
    id: 'relationship',
    label: 'Relationship',
    description: 'Connections and bonds with others',
    panelVariant: 'polaroid',
    color: '#e94560',
  },
  challenge: {
    id: 'challenge',
    label: 'Challenge',
    description: 'Obstacles faced and overcome',
    panelVariant: 'torn',
    color: '#a855f7',
  },
  realization: {
    id: 'realization',
    label: 'Realization',
    description: 'Moments of insight and understanding',
    panelVariant: 'borderless',
    color: '#6ee7b7',
  },
};

// ---------------------------------------------------------------------------
// Mood Presets (map to existing app themes)
// ---------------------------------------------------------------------------

export const MOODS = {
  nostalgic: {
    id: 'nostalgic',
    label: 'Nostalgic',
    description: 'Warm, sepia-tinted, bittersweet',
    theme: 'pulp',
    cssFilter: 'sepia(40%) contrast(1.1)',
  },
  dramatic: {
    id: 'dramatic',
    label: 'Dramatic',
    description: 'High contrast, intense, vivid',
    theme: 'noir',
    cssFilter: 'contrast(1.3) brightness(0.9)',
  },
  peaceful: {
    id: 'peaceful',
    label: 'Peaceful',
    description: 'Soft, dreamy, gentle hues',
    theme: 'dreamscape',
    cssFilter: 'brightness(1.1) saturate(0.8)',
  },
  vibrant: {
    id: 'vibrant',
    label: 'Vibrant',
    description: 'Bold neon colours, energetic',
    theme: 'cyberpunk',
    cssFilter: 'saturate(1.5) contrast(1.1)',
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean, simple, understated',
    theme: 'minimal',
    cssFilter: 'none',
  },
};

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

let _id = Date.now();
function uid() {
  return String(++_id);
}

/**
 * Create a new BiographySnapshot with sensible defaults.
 */
export function createSnapshot(fields = {}) {
  return {
    id: uid(),
    title: '',
    who: '',
    what: '',
    when: '',
    where: '',
    feeling: '',
    template: 'milestone',
    mood: 'nostalgic',
    characterIds: [],
    createdAt: new Date().toISOString(),
    ...fields,
  };
}

/**
 * Create a new Character with sensible defaults.
 */
export function createCharacter(fields = {}) {
  return {
    id: uid(),
    name: '',
    relationship: '',
    color: '#667eea',
    ...fields,
  };
}

// Relationship type suggestions (not enforced — free text is also fine)
export const RELATIONSHIP_SUGGESTIONS = [
  'Mother',
  'Father',
  'Sibling',
  'Friend',
  'Partner',
  'Teacher',
  'Mentor',
  'Colleague',
  'Neighbour',
  'Other',
];

// Colour palette for character avatars
export const CHARACTER_COLORS = [
  '#e94560',
  '#667eea',
  '#a855f7',
  '#6ee7b7',
  '#fbbf24',
  '#f093fb',
  '#05d9e8',
  '#d4a04a',
  '#cd5c5c',
  '#8b4513',
];
