/**
 * Biography Snapshots - Data Schema
 *
 * Defines the structure for biographical memory snapshots
 */

/**
 * Scene Template Types
 */
export const SceneTemplateTypes = {
  CHILDHOOD: 'childhood',
  MILESTONE: 'milestone',
  RELATIONSHIP: 'relationship',
  ACHIEVEMENT: 'achievement',
  CHALLENGE: 'challenge',
  TRADITION: 'tradition',
  REALIZATION: 'realization',
  JOURNEY: 'journey',
  LOSS: 'loss',
  JOY: 'joy',
};

/**
 * Mood/Atmosphere Presets
 */
export const MoodPresets = {
  NOSTALGIC: {
    name: 'Nostalgic',
    theme: 'dreamscape',
    overlays: {
      filmGrain: true,
      vignette: true,
      scanlines: false,
      particles: 'dust',
      ascii: false,
    },
    colorFilter: 'sepia(30%) saturate(80%)',
  },
  DRAMATIC: {
    name: 'Dramatic',
    theme: 'noir',
    overlays: {
      filmGrain: true,
      vignette: true,
      scanlines: true,
      particles: 'embers',
      ascii: true,
    },
    colorFilter: 'contrast(120%) brightness(90%)',
  },
  PEACEFUL: {
    name: 'Peaceful',
    theme: 'minimal',
    overlays: {
      filmGrain: false,
      vignette: false,
      scanlines: false,
      particles: 'bokeh',
      ascii: false,
    },
    colorFilter: 'saturate(110%) brightness(105%)',
  },
  MELANCHOLIC: {
    name: 'Melancholic',
    theme: 'noir',
    overlays: {
      filmGrain: true,
      vignette: true,
      scanlines: false,
      particles: 'rain',
      ascii: false,
    },
    colorFilter: 'saturate(60%) brightness(80%) hue-rotate(200deg)',
  },
  VIBRANT: {
    name: 'Vibrant',
    theme: 'cyberpunk',
    overlays: {
      filmGrain: false,
      vignette: false,
      scanlines: true,
      particles: 'none',
      ascii: true,
    },
    colorFilter: 'saturate(150%) contrast(110%)',
  },
  ETHEREAL: {
    name: 'Ethereal',
    theme: 'dreamscape',
    overlays: {
      filmGrain: false,
      vignette: true,
      scanlines: false,
      particles: 'snow',
      ascii: false,
    },
    colorFilter: 'blur(0.5px) brightness(110%) saturate(80%)',
  },
};

/**
 * BiographySnapshot Data Structure
 */
export class BiographySnapshot {
  constructor(data = {}) {
    this.id = data.id || `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.timestamp = data.timestamp || new Date().toISOString();

    // Memory Content
    this.who = data.who || ''; // People involved
    this.what = data.what || ''; // What happened
    this.when = data.when || ''; // When it happened
    this.where = data.where || ''; // Where it happened
    this.feeling = data.feeling || ''; // Emotional essence
    this.title = data.title || '';
    this.description = data.description || '';

    // Visual Styling
    this.sceneTemplate = data.sceneTemplate || SceneTemplateTypes.MILESTONE;
    this.mood = data.mood || 'NOSTALGIC';
    this.customOverlays = data.customOverlays || null;

    // Character References
    this.characters = data.characters || []; // Array of character IDs

    // Metadata
    this.tags = data.tags || [];
    this.order = data.order || 0; // For timeline ordering
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      who: this.who,
      what: this.what,
      when: this.when,
      where: this.where,
      feeling: this.feeling,
      title: this.title,
      description: this.description,
      sceneTemplate: this.sceneTemplate,
      mood: this.mood,
      customOverlays: this.customOverlays,
      characters: this.characters,
      tags: this.tags,
      order: this.order,
    };
  }
}

/**
 * Character Data Structure for persistence
 */
export class Character {
  constructor(data = {}) {
    this.id = data.id || `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.name = data.name || '';
    this.relationship = data.relationship || ''; // e.g., "Mother", "Friend", "Teacher"
    this.description = data.description || '';
    this.avatarColor = data.avatarColor || '#a855f7';
    this.appearance = data.appearance || {}; // Visual traits for consistency
    this.firstAppearance = data.firstAppearance || null; // Snapshot ID
    this.appearances = data.appearances || []; // Array of snapshot IDs
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      relationship: this.relationship,
      description: this.description,
      avatarColor: this.avatarColor,
      appearance: this.appearance,
      firstAppearance: this.firstAppearance,
      appearances: this.appearances,
    };
  }
}

/**
 * Scene Template Configurations
 */
export const SceneTemplates = {
  [SceneTemplateTypes.CHILDHOOD]: {
    name: 'Childhood Memory',
    description: 'Innocent and playful, warm colors, soft focus',
    panelVariant: 'polaroid',
    defaultMood: 'NOSTALGIC',
    suggestedColors: ['#fbbf24', '#f59e0b', '#fb923c'],
  },
  [SceneTemplateTypes.MILESTONE]: {
    name: 'Life Milestone',
    description: 'Achievement and growth, bold and confident',
    panelVariant: 'default',
    defaultMood: 'VIBRANT',
    suggestedColors: ['#3b82f6', '#8b5cf6', '#ec4899'],
  },
  [SceneTemplateTypes.RELATIONSHIP]: {
    name: 'Relationship Moment',
    description: 'Connection and intimacy, warm and tender',
    panelVariant: 'torn',
    defaultMood: 'PEACEFUL',
    suggestedColors: ['#f472b6', '#fb7185', '#fda4af'],
  },
  [SceneTemplateTypes.ACHIEVEMENT]: {
    name: 'Achievement',
    description: 'Success and pride, bright and celebratory',
    panelVariant: 'default',
    defaultMood: 'VIBRANT',
    suggestedColors: ['#10b981', '#14b8a6', '#06b6d4'],
  },
  [SceneTemplateTypes.CHALLENGE]: {
    name: 'Overcoming Challenge',
    description: 'Struggle and perseverance, dramatic contrast',
    panelVariant: 'torn',
    defaultMood: 'DRAMATIC',
    suggestedColors: ['#ef4444', '#dc2626', '#b91c1c'],
  },
  [SceneTemplateTypes.TRADITION]: {
    name: 'Family Tradition',
    description: 'Heritage and belonging, rich and cultural',
    panelVariant: 'default',
    defaultMood: 'NOSTALGIC',
    suggestedColors: ['#d97706', '#b45309', '#92400e'],
  },
  [SceneTemplateTypes.REALIZATION]: {
    name: 'Moment of Realization',
    description: 'Insight and clarity, ethereal and transformative',
    panelVariant: 'borderless',
    defaultMood: 'ETHEREAL',
    suggestedColors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
  },
  [SceneTemplateTypes.JOURNEY]: {
    name: 'Journey/Travel',
    description: 'Adventure and discovery, dynamic and expansive',
    panelVariant: 'default',
    defaultMood: 'VIBRANT',
    suggestedColors: ['#0ea5e9', '#06b6d4', '#14b8a6'],
  },
  [SceneTemplateTypes.LOSS]: {
    name: 'Loss/Goodbye',
    description: 'Grief and letting go, somber and introspective',
    panelVariant: 'torn',
    defaultMood: 'MELANCHOLIC',
    suggestedColors: ['#6366f1', '#4f46e5', '#4338ca'],
  },
  [SceneTemplateTypes.JOY]: {
    name: 'Pure Joy',
    description: 'Happiness and lightness, bright and uplifting',
    panelVariant: 'polaroid',
    defaultMood: 'PEACEFUL',
    suggestedColors: ['#fde047', '#facc15', '#fbbf24'],
  },
};
