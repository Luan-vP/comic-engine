/**
 * Journal Integration — Scene Generator
 *
 * Transforms JournalEntry objects into 3D scene configurations
 * suitable for rendering with Scene + SceneObject + Panel.
 */

import { createThemeSequence } from './schema.js';

// ---------------------------------------------------------------------------
// Emotion → Panel variant mapping
// ---------------------------------------------------------------------------

const EMOTION_TO_VARIANT = {
  nostalgic: 'polaroid',
  memory: 'polaroid',
  wistful: 'polaroid',
  longing: 'polaroid',
  raw: 'torn',
  grief: 'torn',
  anger: 'torn',
  intense: 'torn',
  rage: 'torn',
  disconnected: 'monitor',
  digital: 'monitor',
  dissociated: 'monitor',
  numb: 'monitor',
  calm: 'borderless',
  peace: 'borderless',
  clarity: 'borderless',
  present: 'borderless',
  joy: 'borderless',
};

/**
 * Map an emotion string to a Panel variant.
 * @param {string} emotion
 * @returns {'default'|'polaroid'|'torn'|'monitor'|'borderless'}
 */
export function emotionToVariant(emotion) {
  if (!emotion) return 'default';
  const key = emotion.toLowerCase().trim();
  return EMOTION_TO_VARIANT[key] || 'default';
}

// ---------------------------------------------------------------------------
// Emotional intensity → depth + parallax
// ---------------------------------------------------------------------------

/**
 * Map emotional intensity (1–10) to a Z-depth value.
 * Higher intensity = closer to viewer (more foreground).
 *
 * Range: z=-350 (calm, far back) to z=200 (intense, very close)
 * @param {number} intensity - 1 to 10
 * @returns {number}
 */
export function intensityToZDepth(intensity) {
  const clamped = Math.max(1, Math.min(10, intensity ?? 5));
  // Linear interpolation: intensity 1 → -350, intensity 10 → 200
  return Math.round(-350 + ((clamped - 1) / 9) * 550);
}

/**
 * Map emotional intensity to a parallax factor.
 * Higher intensity = more parallax movement.
 * @param {number} intensity - 1 to 10
 * @returns {number}
 */
export function intensityToParallaxFactor(intensity) {
  const clamped = Math.max(1, Math.min(10, intensity ?? 5));
  // 0.1 (far) to 1.1 (very close)
  return Math.round((0.1 + ((clamped - 1) / 9) * 1.0) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Layout algorithms
// ---------------------------------------------------------------------------

/**
 * Timeline layout: entries spread horizontally with depth from intensity.
 * @param {import('./schema.js').JournalEntry[]} entries
 * @returns {Array<{x: number, y: number, z: number, rotation: number[]}>}
 */
export function timelineLayout(entries) {
  const count = entries.length;
  const spread = Math.max(400, count * 160);

  return entries.map((entry, i) => {
    const intensity = entry.prompts?.emotionalIntensity || 5;
    const x = count === 1 ? 0 : -spread / 2 + (i / Math.max(count - 1, 1)) * spread;
    const y = Math.sin((i / count) * Math.PI) * -60; // slight arc
    const z = intensityToZDepth(intensity);
    const rotation = [0, 0, (i % 2 === 0 ? 1 : -1) * (i * 2)];
    return { x: Math.round(x), y: Math.round(y), z, rotation };
  });
}

/**
 * Spiral layout: entries spiral inward using golden angle.
 * @param {import('./schema.js').JournalEntry[]} entries
 * @returns {Array<{x: number, y: number, z: number, rotation: number[]}>}
 */
export function spiralLayout(entries) {
  const goldenAngle = 137.5 * (Math.PI / 180);

  return entries.map((entry, i) => {
    const intensity = entry.prompts?.emotionalIntensity || 5;
    const radius = 80 + i * 55;
    const angle = i * goldenAngle;
    const x = Math.round(Math.cos(angle) * radius);
    const y = Math.round(Math.sin(angle) * radius * 0.6);
    const z = intensityToZDepth(intensity);
    const rotation = [0, 0, ((angle * 180) / Math.PI) * 0.08];
    return { x, y, z, rotation: [rotation[0], rotation[1], Math.round(rotation[2] * 10) / 10] };
  });
}

/**
 * Stack layout: entries stacked in Z depth by chronological order.
 * @param {import('./schema.js').JournalEntry[]} entries
 * @returns {Array<{x: number, y: number, z: number, rotation: number[]}>}
 */
export function stackLayout(entries) {
  const count = entries.length;

  return entries.map((entry, i) => {
    const x = ((i % 3) - 1) * 30; // slight horizontal offset
    const y = (i % 2 === 0 ? 1 : -1) * 20;
    const z = count === 1 ? 0 : -200 + (i / Math.max(count - 1, 1)) * 400;
    const rotation = [0, 0, i * 5 - ((count - 1) * 5) / 2];
    return { x: Math.round(x), y, z: Math.round(z), rotation };
  });
}

const LAYOUTS = { timeline: timelineLayout, spiral: spiralLayout, stack: stackLayout };

// ---------------------------------------------------------------------------
// Main scene object generator
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SceneObjectConfig
 * @property {string} id
 * @property {string} title
 * @property {string} date
 * @property {string} passage - Primary passage text to display
 * @property {string} emotion
 * @property {string} variant - Panel variant
 * @property {number[]} position - [x, y, z]
 * @property {number[]} rotation - [x, y, z] in degrees
 * @property {number} parallaxFactor
 * @property {number} emotionalIntensity
 */

/**
 * Generate scene object configs from a list of journal entries.
 *
 * @param {import('./schema.js').JournalEntry[]} entries
 * @param {'timeline'|'spiral'|'stack'} layout
 * @returns {SceneObjectConfig[]}
 */
export function generateSceneObjects(entries, layout = 'timeline') {
  if (!entries || entries.length === 0) return [];

  const layoutFn = LAYOUTS[layout] || timelineLayout;
  const positions = layoutFn(entries);

  return entries.map((entry, i) => {
    const { x, y, z, rotation } = positions[i];
    const intensity = entry.prompts?.emotionalIntensity || 5;
    const emotion = entry.prompts?.emotion || '';
    const variant = emotionToVariant(emotion);
    const parallaxFactor = intensityToParallaxFactor(intensity);

    // Use first passage text, or title as fallback
    const passage = entry.passages?.[0]?.text || entry.title;

    return {
      id: entry.id,
      title: entry.title,
      date: entry.date,
      passage,
      emotion,
      variant,
      position: [x, y, z],
      rotation,
      parallaxFactor,
      emotionalIntensity: intensity,
    };
  });
}

// ---------------------------------------------------------------------------
// Theme grouping
// ---------------------------------------------------------------------------

/**
 * Group a list of entries by their themes.
 * Each entry may appear in multiple theme groups if it has multiple themes.
 *
 * @param {import('./schema.js').JournalEntry[]} entries
 * @returns {import('./schema.js').ThemeSequence[]}
 */
export function groupEntriesByTheme(entries) {
  const themeMap = new Map();

  for (const entry of entries) {
    const themes = entry.themes && entry.themes.length > 0 ? entry.themes : ['untagged'];
    for (const theme of themes) {
      if (!themeMap.has(theme)) themeMap.set(theme, []);
      themeMap.get(theme).push(entry);
    }
  }

  return Array.from(themeMap.entries()).map(([theme, themeEntries]) =>
    createThemeSequence(theme, themeEntries),
  );
}
