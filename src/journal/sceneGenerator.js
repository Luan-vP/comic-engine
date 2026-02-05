/**
 * Scene Generator - Transforms journal entries into comic-engine scenes
 *
 * Takes JournalEntry objects and generates React component configurations
 * for Scene, SceneObject, and Panel components.
 */

/**
 * Maps emotional intensity to visual parameters
 * @param {number} intensity - 1-10 scale
 * @returns {Object} - Visual parameters
 */
function getEmotionalVisuals(intensity = 5) {
  // Low intensity: calm, distant, muted
  if (intensity <= 3) {
    return {
      zPosition: -200,
      parallaxFactor: 0.3,
      rotation: [10, 0, 0],
      opacity: 0.8,
    };
  }

  // Medium intensity: present, engaged
  if (intensity <= 6) {
    return {
      zPosition: 0,
      parallaxFactor: 0.6,
      rotation: [0, 0, 0],
      opacity: 1,
    };
  }

  // High intensity: immediate, overwhelming, close
  return {
    zPosition: 150,
    parallaxFactor: 0.9,
    rotation: [-5, 5, -3],
    opacity: 1,
  };
}

/**
 * Maps emotions to panel variants and visual styles
 * @param {string} emotion - The dominant emotion
 * @returns {Object} - Panel configuration
 */
function getEmotionalPanelStyle(emotion) {
  const emotionLower = emotion.toLowerCase();

  // Nostalgic/memory
  if (emotionLower.includes('nostalg') || emotionLower.includes('memory') || emotionLower.includes('past')) {
    return {
      variant: 'polaroid',
      filter: 'sepia(30%) brightness(0.9)',
    };
  }

  // Raw/intense/overwhelming
  if (emotionLower.includes('raw') || emotionLower.includes('intense') || emotionLower.includes('overwhelm')) {
    return {
      variant: 'torn',
      filter: 'contrast(1.2) saturate(1.3)',
    };
  }

  // Digital/disconnected/modern
  if (emotionLower.includes('disconnect') || emotionLower.includes('numb') || emotionLower.includes('digital')) {
    return {
      variant: 'monitor',
      filter: 'brightness(0.95)',
    };
  }

  // Clean/clear/present
  if (emotionLower.includes('clear') || emotionLower.includes('present') || emotionLower.includes('peace')) {
    return {
      variant: 'borderless',
      filter: 'none',
    };
  }

  // Default
  return {
    variant: 'default',
    filter: 'none',
  };
}

/**
 * Generates a scene configuration for a single journal entry
 * @param {Object} entry - JournalEntry object
 * @param {Object} options - Generation options
 * @returns {Object} - Scene configuration
 */
export function generateSceneFromEntry(entry, options = {}) {
  const {
    metadata,
    excerpt,
  } = entry;

  const {
    centerPosition = [0, 0, 0],
    includeBackground = true,
  } = options;

  const emotionalVisuals = getEmotionalVisuals(metadata.emotionalIntensity);
  const panelStyle = metadata.visualStyle
    ? { variant: metadata.visualStyle }
    : getEmotionalPanelStyle(metadata.storyPrompts.dominantEmotion);

  const sceneConfig = {
    sceneProps: {
      perspective: 1000,
      parallaxIntensity: 1,
      mouseInfluence: { x: 50, y: 30 },
    },
    objects: [],
  };

  // Background elements based on visual metaphor
  if (includeBackground && metadata.storyPrompts.visualMetaphor) {
    sceneConfig.objects.push({
      type: 'background',
      position: [-200, -100, -400],
      rotation: [0, 0, 15],
      parallaxFactor: 0.1,
      content: {
        type: 'metaphor',
        text: metadata.storyPrompts.visualMetaphor,
      },
    });
  }

  // Main panel with excerpt
  sceneConfig.objects.push({
    type: 'panel',
    position: [
      centerPosition[0] + emotionalVisuals.zPosition * 0.1,
      centerPosition[1],
      centerPosition[2] + emotionalVisuals.zPosition,
    ],
    rotation: emotionalVisuals.rotation,
    parallaxFactor: emotionalVisuals.parallaxFactor,
    panel: {
      width: 320,
      height: 420,
      variant: panelStyle.variant,
      title: metadata.storyPrompts.dominantEmotion.toUpperCase(),
      subtitle: new Date(metadata.date).toLocaleDateString(),
      content: excerpt,
      style: {
        opacity: emotionalVisuals.opacity,
        filter: panelStyle.filter,
      },
    },
  });

  // Character indicators (if specified)
  if (metadata.storyPrompts.characters.length > 0) {
    metadata.storyPrompts.characters.forEach((character, index) => {
      const angle = (index / metadata.storyPrompts.characters.length) * 360;
      const radius = 250;
      const x = Math.cos(angle * Math.PI / 180) * radius;
      const z = Math.sin(angle * Math.PI / 180) * radius - 200;

      sceneConfig.objects.push({
        type: 'character-marker',
        position: [x, -50, z],
        rotation: [0, -angle, 0],
        parallaxFactor: 0.4,
        content: {
          character,
        },
      });
    });
  }

  // Context indicators (before/after)
  if (metadata.storyPrompts.beforeContext) {
    sceneConfig.objects.push({
      type: 'context',
      position: [-300, 0, -100],
      rotation: [0, 45, 0],
      parallaxFactor: 0.5,
      content: {
        label: 'BEFORE',
        text: metadata.storyPrompts.beforeContext,
      },
    });
  }

  if (metadata.storyPrompts.afterContext) {
    sceneConfig.objects.push({
      type: 'context',
      position: [300, 0, -100],
      rotation: [0, -45, 0],
      parallaxFactor: 0.5,
      content: {
        label: 'AFTER',
        text: metadata.storyPrompts.afterContext,
      },
    });
  }

  return sceneConfig;
}

/**
 * Generates a theme-based narrative sequence scene
 * @param {Object} themeSequence - ThemeSequence object with entries
 * @param {Object} options - Generation options
 * @returns {Object} - Scene configuration with multiple panels
 */
export function generateThemeSequenceScene(themeSequence, options = {}) {
  const {
    layout = 'timeline', // 'timeline' | 'spiral' | 'stack'
  } = options;

  const sceneConfig = {
    sceneProps: {
      perspective: 1200,
      parallaxIntensity: 0.8,
      mouseInfluence: { x: 60, y: 40 },
      scrollEnabled: true,
      scrollDepth: 500,
    },
    objects: [],
    theme: themeSequence.theme,
  };

  const entries = themeSequence.entries || [];

  if (layout === 'timeline') {
    // Linear timeline layout - entries spread horizontally and in depth
    entries.forEach((entry, index) => {
      const spacing = 400;
      const x = (index - entries.length / 2) * spacing;
      const z = index * -50; // Slight depth progression
      const y = Math.sin(index * 0.5) * 50; // Gentle wave

      const emotionalVisuals = getEmotionalVisuals(entry.metadata.emotionalIntensity);
      const panelStyle = getEmotionalPanelStyle(entry.metadata.storyPrompts.dominantEmotion);

      sceneConfig.objects.push({
        type: 'panel',
        position: [x, y, z],
        rotation: [0, 0, 0],
        parallaxFactor: 0.6 - index * 0.05,
        panel: {
          width: 280,
          height: 360,
          variant: panelStyle.variant,
          title: `${index + 1}. ${entry.metadata.storyPrompts.dominantEmotion}`,
          subtitle: new Date(entry.metadata.date).toLocaleDateString(),
          content: entry.excerpt,
        },
      });
    });
  } else if (layout === 'spiral') {
    // Spiral layout - entries spiral inward/outward
    entries.forEach((entry, index) => {
      const angle = index * 137.5; // Golden angle for natural distribution
      const radius = 200 + index * 80;
      const x = Math.cos(angle * Math.PI / 180) * radius;
      const z = Math.sin(angle * Math.PI / 180) * radius - 300;
      const y = index * 30;

      const panelStyle = getEmotionalPanelStyle(entry.metadata.storyPrompts.dominantEmotion);

      sceneConfig.objects.push({
        type: 'panel',
        position: [x, y, z],
        rotation: [0, -angle + 90, 0],
        parallaxFactor: 0.5 + index * 0.05,
        panel: {
          width: 260,
          height: 340,
          variant: panelStyle.variant,
          title: entry.metadata.storyPrompts.dominantEmotion,
          subtitle: new Date(entry.metadata.date).toLocaleDateString(),
          content: entry.excerpt,
        },
      });
    });
  } else if (layout === 'stack') {
    // Stacked layout - entries stacked in Z depth
    entries.forEach((entry, index) => {
      const z = index * -150 - 200;
      const emotionalVisuals = getEmotionalVisuals(entry.metadata.emotionalIntensity);
      const panelStyle = getEmotionalPanelStyle(entry.metadata.storyPrompts.dominantEmotion);

      sceneConfig.objects.push({
        type: 'panel',
        position: [0, 0, z],
        rotation: [10, 0, 0],
        parallaxFactor: 0.3 + index * 0.1,
        panel: {
          width: 320,
          height: 420,
          variant: panelStyle.variant,
          title: entry.metadata.storyPrompts.dominantEmotion,
          subtitle: new Date(entry.metadata.date).toLocaleDateString(),
          content: entry.excerpt,
        },
      });
    });
  }

  // Add theme title
  sceneConfig.objects.push({
    type: 'title',
    position: [0, -200, 100],
    rotation: [0, 0, 0],
    parallaxFactor: 1.1,
    content: {
      text: themeSequence.theme.toUpperCase(),
      subtitle: `${entries.length} entries`,
    },
  });

  return sceneConfig;
}

/**
 * Exports a scene configuration as a React component string
 * @param {Object} sceneConfig - Scene configuration
 * @returns {string} - React component code
 */
export function exportAsComponent(sceneConfig) {
  const imports = `import React from 'react';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';`;

  const componentName = `JournalScene${Date.now()}`;

  let objectsCode = sceneConfig.objects.map((obj, index) => {
    if (obj.type === 'panel') {
      return `  <SceneObject
    position={[${obj.position.join(', ')}]}
    rotation={[${obj.rotation.join(', ')}]}
    parallaxFactor={${obj.parallaxFactor}}
  >
    <Panel
      width={${obj.panel.width}}
      height={${obj.panel.height}}
      variant="${obj.panel.variant}"
      ${obj.panel.title ? `title="${obj.panel.title}"` : ''}
      ${obj.panel.subtitle ? `subtitle="${obj.panel.subtitle}"` : ''}
    >
      <div style={{ padding: '20px', color: theme.colors.text }}>
        {${JSON.stringify(obj.panel.content)}}
      </div>
    </Panel>
  </SceneObject>`;
    }

    if (obj.type === 'title') {
      return `  <SceneObject
    position={[${obj.position.join(', ')}]}
    rotation={[${obj.rotation.join(', ')}]}
    parallaxFactor={${obj.parallaxFactor}}
  >
    <div style={{
      fontFamily: theme.typography.fontDisplay,
      fontSize: '48px',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: '8px',
    }}>
      ${obj.content.text}
    </div>
  </SceneObject>`;
    }

    return '';
  }).join('\n\n');

  const component = `${imports}

export function ${componentName}() {
  const { theme } = useTheme();

  return (
    <Scene
      perspective={${sceneConfig.sceneProps.perspective}}
      parallaxIntensity={${sceneConfig.sceneProps.parallaxIntensity}}
      mouseInfluence={{ x: ${sceneConfig.sceneProps.mouseInfluence.x}, y: ${sceneConfig.sceneProps.mouseInfluence.y} }}
      ${sceneConfig.sceneProps.scrollEnabled ? 'scrollEnabled={true}' : ''}
      ${sceneConfig.sceneProps.scrollDepth ? `scrollDepth={${sceneConfig.sceneProps.scrollDepth}}` : ''}
    >
${objectsCode}
    </Scene>
  );
}

export default ${componentName};`;

  return component;
}
