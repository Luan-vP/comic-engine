/**
 * Theme definitions for the comic engine
 * Each theme defines colors, typography, and effect intensities
 */

export const themes = {
  noir: {
    name: 'Noir',
    colors: {
      background: '#0a0a0f',
      backgroundGradient: 'radial-gradient(ellipse at 30% 20%, #1a0a2e 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #16213e 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, #0f0f23 0%, #000 100%)',
      primary: '#e94560',
      secondary: '#667eea',
      accent: '#f093fb',
      text: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      textSubtle: 'rgba(255, 255, 255, 0.3)',
      border: 'rgba(255, 255, 255, 0.1)',
      shadow: 'rgba(233, 69, 96, 0.3)',
    },
    typography: {
      fontDisplay: '"Bebas Neue", "Impact", sans-serif',
      fontBody: '"JetBrains Mono", "Courier New", monospace',
      fontNarrative: '"Crimson Text", "Georgia", serif',
    },
    effects: {
      filmGrain: 0.08,
      vignette: 0.6,
      scanlines: 0.03,
      chromaticAberration: 0.002,
      bloom: 0.3,
    },
  },

  cyberpunk: {
    name: 'Cyberpunk',
    colors: {
      background: '#0d0221',
      backgroundGradient: 'radial-gradient(ellipse at 20% 80%, #541388 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #0d0221 0%, transparent 60%), linear-gradient(180deg, #0d0221 0%, #0a0a0a 100%)',
      primary: '#ff2a6d',
      secondary: '#05d9e8',
      accent: '#d1f7ff',
      text: '#d1f7ff',
      textMuted: 'rgba(209, 247, 255, 0.7)',
      textSubtle: 'rgba(209, 247, 255, 0.3)',
      border: 'rgba(5, 217, 232, 0.3)',
      shadow: 'rgba(255, 42, 109, 0.5)',
    },
    typography: {
      fontDisplay: '"Orbitron", "Arial Black", sans-serif',
      fontBody: '"Share Tech Mono", monospace',
      fontNarrative: '"Rajdhani", sans-serif',
    },
    effects: {
      filmGrain: 0.05,
      vignette: 0.7,
      scanlines: 0.06,
      chromaticAberration: 0.004,
      bloom: 0.5,
    },
  },

  dreamscape: {
    name: 'Dreamscape',
    colors: {
      background: '#1a1a2e',
      backgroundGradient: 'radial-gradient(ellipse at 50% 0%, #4a3f6b 0%, transparent 50%), radial-gradient(ellipse at 0% 100%, #2d4059 0%, transparent 40%), radial-gradient(ellipse at 100% 100%, #3d2c5e 0%, transparent 40%), linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      primary: '#a855f7',
      secondary: '#6ee7b7',
      accent: '#fbbf24',
      text: '#e2e8f0',
      textMuted: 'rgba(226, 232, 240, 0.7)',
      textSubtle: 'rgba(226, 232, 240, 0.4)',
      border: 'rgba(168, 85, 247, 0.2)',
      shadow: 'rgba(168, 85, 247, 0.4)',
    },
    typography: {
      fontDisplay: '"Playfair Display", serif',
      fontBody: '"Nunito", sans-serif',
      fontNarrative: '"Lora", serif',
    },
    effects: {
      filmGrain: 0.03,
      vignette: 0.4,
      scanlines: 0,
      chromaticAberration: 0.001,
      bloom: 0.6,
    },
  },

  pulp: {
    name: 'Pulp',
    colors: {
      background: '#1c1407',
      backgroundGradient: 'radial-gradient(ellipse at 50% 50%, #2d2010 0%, #1c1407 100%)',
      primary: '#d4a04a',
      secondary: '#8b4513',
      accent: '#cd5c5c',
      text: '#f4e4c1',
      textMuted: 'rgba(244, 228, 193, 0.7)',
      textSubtle: 'rgba(244, 228, 193, 0.4)',
      border: 'rgba(212, 160, 74, 0.3)',
      shadow: 'rgba(0, 0, 0, 0.6)',
    },
    typography: {
      fontDisplay: '"Alfa Slab One", cursive',
      fontBody: '"Courier Prime", monospace',
      fontNarrative: '"Merriweather", serif',
    },
    effects: {
      filmGrain: 0.12,
      vignette: 0.8,
      scanlines: 0,
      chromaticAberration: 0,
      bloom: 0.1,
    },
  },

  minimal: {
    name: 'Minimal',
    colors: {
      background: '#fafafa',
      backgroundGradient: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
      primary: '#171717',
      secondary: '#525252',
      accent: '#3b82f6',
      text: '#171717',
      textMuted: 'rgba(23, 23, 23, 0.6)',
      textSubtle: 'rgba(23, 23, 23, 0.3)',
      border: 'rgba(0, 0, 0, 0.1)',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
    typography: {
      fontDisplay: '"Space Grotesk", sans-serif',
      fontBody: '"Inter", sans-serif',
      fontNarrative: '"Source Serif Pro", serif',
    },
    effects: {
      filmGrain: 0,
      vignette: 0,
      scanlines: 0,
      chromaticAberration: 0,
      bloom: 0,
    },
  },
};

export const defaultTheme = 'noir';
