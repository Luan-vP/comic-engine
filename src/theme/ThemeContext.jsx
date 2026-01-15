import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { themes, defaultTheme } from './themes';

const ThemeContext = createContext(null);

/**
 * Theme Provider - wraps app and provides theme state + controls
 */
export function ThemeProvider({ children, initialTheme = defaultTheme }) {
  const [themeName, setThemeName] = useState(initialTheme);
  const [customOverrides, setCustomOverrides] = useState({});

  const theme = useMemo(() => {
    const baseTheme = themes[themeName] || themes[defaultTheme];
    
    // Deep merge custom overrides
    return {
      ...baseTheme,
      colors: { ...baseTheme.colors, ...customOverrides.colors },
      typography: { ...baseTheme.typography, ...customOverrides.typography },
      effects: { ...baseTheme.effects, ...customOverrides.effects },
    };
  }, [themeName, customOverrides]);

  const setTheme = useCallback((name) => {
    if (themes[name]) {
      setThemeName(name);
    } else {
      console.warn(`Theme "${name}" not found. Available themes:`, Object.keys(themes));
    }
  }, []);

  const overrideTheme = useCallback((overrides) => {
    setCustomOverrides(prev => ({
      ...prev,
      ...overrides,
      colors: { ...prev.colors, ...overrides.colors },
      typography: { ...prev.typography, ...overrides.typography },
      effects: { ...prev.effects, ...overrides.effects },
    }));
  }, []);

  const resetOverrides = useCallback(() => {
    setCustomOverrides({});
  }, []);

  // Generate CSS custom properties from theme
  const cssVariables = useMemo(() => ({
    '--color-background': theme.colors.background,
    '--color-background-gradient': theme.colors.backgroundGradient,
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-accent': theme.colors.accent,
    '--color-text': theme.colors.text,
    '--color-text-muted': theme.colors.textMuted,
    '--color-text-subtle': theme.colors.textSubtle,
    '--color-border': theme.colors.border,
    '--color-shadow': theme.colors.shadow,
    '--font-display': theme.typography.fontDisplay,
    '--font-body': theme.typography.fontBody,
    '--font-narrative': theme.typography.fontNarrative,
    '--effect-film-grain': theme.effects.filmGrain,
    '--effect-vignette': theme.effects.vignette,
    '--effect-scanlines': theme.effects.scanlines,
    '--effect-chromatic-aberration': theme.effects.chromaticAberration,
    '--effect-bloom': theme.effects.bloom,
  }), [theme]);

  const value = {
    theme,
    themeName,
    availableThemes: Object.keys(themes),
    setTheme,
    overrideTheme,
    resetOverrides,
    cssVariables,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div style={cssVariables}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export { themes };
