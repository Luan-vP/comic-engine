/**
 * Journal Integration - Scene Generator
 *
 * Transforms JournalEntry objects into scene configuration objects
 * for use with the comic-engine's Scene/SceneObject/Panel components.
 */

/**
 * Map emotional intensity (1–10) to Z depth in the 3D scene.
 * Higher intensity → closer to camera (visceral, present).
 * Lower intensity → further back (calm, distant memories).
 */
function intensityToDepth(intensity) {
  const clamped = Math.max(1, Math.min(10, intensity || 5));
  // Map 1–10 → -300 to 200
  return Math.round(-300 + (clamped - 1) * (500 / 9));
}

/**
 * Map emotion string to a Panel variant.
 */
function emotionToVariant(emotion) {
  if (!emotion) return 'default';
  const e = emotion.toLowerCase();
  if (['nostalgic', 'memory', 'wistful', 'longing', 'bittersweet'].some((k) => e.includes(k)))
    return 'polaroid';
  if (['raw', 'intense', 'rage', 'grief', 'overwhelming', 'pain'].some((k) => e.includes(k)))
    return 'torn';
  if (['disconnected', 'numb', 'digital', 'dissociated', 'detached'].some((k) => e.includes(k)))
    return 'monitor';
  if (['clear', 'present', 'grounded', 'calm', 'peaceful', 'joy'].some((k) => e.includes(k)))
    return 'borderless';
  return 'default';
}

/**
 * Map intensity to a parallax factor.
 * Higher intensity = more movement = more immediate.
 */
function intensityToParallax(intensity) {
  const clamped = Math.max(1, Math.min(10, intensity || 5));
  return Math.round((0.3 + (clamped / 10) * 0.8) * 100) / 100;
}

/**
 * Layout algorithms for arranging entries in 3D space.
 * Each returns an array of { position, rotation } objects.
 */
const layouts = {
  /**
   * Timeline: entries spread horizontally with sinusoidal Z variation.
   */
  timeline(count) {
    return Array.from({ length: count }, (_, i) => {
      const progress = count === 1 ? 0.5 : i / (count - 1);
      const x = Math.round((progress - 0.5) * 800);
      const z = Math.round(-200 + Math.sin(progress * Math.PI) * 200);
      const ry = Math.round((progress - 0.5) * -15);
      return { position: [x, 0, z], rotation: [0, ry, 0] };
    });
  },

  /**
   * Spiral: entries spiral inward using the golden angle.
   */
  spiral(count) {
    const GOLDEN_ANGLE = 137.5;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * GOLDEN_ANGLE * Math.PI) / 180;
      const radius = 150 + i * 40;
      const x = Math.round(Math.cos(angle) * radius);
      const y = Math.round(Math.sin(angle) * radius * 0.6);
      const z = -i * 50;
      const rz = Math.round(i * 3);
      return { position: [x, y, z], rotation: [0, 0, rz] };
    });
  },

  /**
   * Stack: entries stacked in Z-depth, creating progression into the scene.
   */
  stack(count) {
    return Array.from({ length: count }, (_, i) => {
      const x = (i % 2 === 0 ? -1 : 1) * 30;
      const y = -i * 20;
      const z = 200 - i * 120;
      const rz = (i % 2 === 0 ? 1 : -1) * 2;
      return { position: [x, y, z], rotation: [0, 0, rz] };
    });
  },
};

/**
 * Generate a scene configuration from a single journal passage.
 *
 * @param {Object} passage - A JournalPassage object
 * @param {Object} [positionOverride] - Optional { position, rotation } override
 * @returns {Object} Scene object config
 */
export function generatePassageConfig(passage, positionOverride = {}) {
  const prompts = passage.storyPrompts || {};
  const intensity = prompts.emotionalIntensity || 5;
  const emotion = prompts.emotion || '';

  return {
    position: positionOverride.position || [0, 0, intensityToDepth(intensity)],
    rotation: positionOverride.rotation || [0, 0, 0],
    parallaxFactor: intensityToParallax(intensity),
    panelVariant: emotionToVariant(emotion),
    title: emotion ? emotion.toUpperCase() : 'MEMORY',
    subtitle: prompts.visualMetaphor || '',
    text: passage.text || '',
    characters: prompts.characters || [],
    contextBefore: prompts.contextBefore || '',
    contextAfter: prompts.contextAfter || '',
    emotionalIntensity: intensity,
    emotion,
  };
}

/**
 * Generate a full scene configuration from an array of journal entries.
 *
 * @param {JournalEntry[]} entries - Array of journal entries
 * @param {Object} [options]
 * @param {string} [options.layout='timeline'] - 'timeline' | 'spiral' | 'stack'
 * @param {string} [options.theme] - Filter entries by theme name
 * @returns {Object[]} Array of scene object configs ready for rendering
 */
export function generateSceneConfig(entries, options = {}) {
  const { layout = 'timeline', theme } = options;

  const filtered = theme
    ? entries.filter((e) => e.themes && e.themes.includes(theme))
    : entries;

  // Sort chronologically
  const sorted = [...filtered].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  // Flatten to (entry, passage) pairs; fall back to entry title if no passages
  const pairs = sorted.flatMap((entry) => {
    const passageList =
      entry.passages && entry.passages.length > 0
        ? entry.passages
        : [{ text: entry.title || entry.content?.slice(0, 200) || '', storyPrompts: {} }];
    return passageList.map((passage) => ({ entry, passage }));
  });

  if (pairs.length === 0) return [];

  const layoutFn = layouts[layout] || layouts.timeline;
  const positions = layoutFn(pairs.length);

  return pairs.map(({ entry, passage }, i) => ({
    id: `${entry.id}-passage-${i}`,
    entryId: entry.id,
    entryDate: entry.date,
    entryTitle: entry.title,
    themes: entry.themes || [],
    ...generatePassageConfig(passage, positions[i] || {}),
  }));
}

/**
 * Group entries by theme, returning a Map of theme → entries.
 * Entries without themes go into '(unthemed)'.
 *
 * @param {JournalEntry[]} entries
 * @returns {Map<string, JournalEntry[]>}
 */
export function groupByTheme(entries) {
  const map = new Map();
  for (const entry of entries) {
    const themes = entry.themes && entry.themes.length > 0 ? entry.themes : ['(unthemed)'];
    for (const theme of themes) {
      if (!map.has(theme)) map.set(theme, []);
      map.get(theme).push(entry);
    }
  }
  return map;
}
