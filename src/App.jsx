import React, { useState } from 'react';
import { ThemeProvider, useTheme, themes } from './theme/ThemeContext';
import { OverlayStack } from './components/overlays';
import { BeHereMeow } from './pages/BeHereMeow';
// import { ExamplePage } from './pages/ExamplePage'; // other scenes

/**
 * Theme Switcher UI - for development/demo purposes
 */
function ThemeSwitcher() {
  const { themeName, setTheme, availableThemes, theme } = useTheme();

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        zIndex: 10000,
        fontFamily: theme.typography.fontBody,
      }}
    >
      <div style={{ color: theme.colors.textMuted, fontSize: '10px', marginBottom: '8px', letterSpacing: '1px' }}>
        THEME
      </div>
      <select
        value={themeName}
        onChange={(e) => setTheme(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '4px',
          color: theme.colors.text,
          padding: '8px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {availableThemes.map((name) => (
          <option key={name} value={name} style={{ background: '#222' }}>
            {themes[name].name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Overlay Controls - for development/demo purposes
 */
function OverlayControls({ overlayConfig, setOverlayConfig }) {
  const { theme } = useTheme();

  const toggles = [
    { key: 'filmGrain', label: 'Film Grain' },
    { key: 'vignette', label: 'Vignette' },
    { key: 'scanlines', label: 'Scanlines' },
    { key: 'ascii', label: 'ASCII Shader' },
  ];

  const particlePresets = ['none', 'dust', 'snow', 'bokeh', 'embers', 'rain'];

  return (
    <div
      style={{
        position: 'fixed',
        top: '100px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        zIndex: 10000,
        fontFamily: theme.typography.fontBody,
      }}
    >
      <div style={{ color: theme.colors.textMuted, fontSize: '10px', marginBottom: '12px', letterSpacing: '1px' }}>
        OVERLAYS
      </div>
      
      {toggles.map(({ key, label }) => (
        <label
          key={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: theme.colors.text,
            fontSize: '11px',
            marginBottom: '8px',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={overlayConfig[key]}
            onChange={(e) => setOverlayConfig({ ...overlayConfig, [key]: e.target.checked })}
            style={{ accentColor: theme.colors.primary }}
          />
          {label}
        </label>
      ))}

      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.colors.border}` }}>
        <div style={{ color: theme.colors.textMuted, fontSize: '10px', marginBottom: '8px' }}>
          PARTICLES
        </div>
        <select
          value={overlayConfig.particles || 'none'}
          onChange={(e) => setOverlayConfig({ 
            ...overlayConfig, 
            particles: e.target.value === 'none' ? null : e.target.value 
          })}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            color: theme.colors.text,
            padding: '6px 10px',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            width: '100%',
          }}
        >
          {particlePresets.map((preset) => (
            <option key={preset} value={preset} style={{ background: '#222' }}>
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/**
 * Main App Content - separated so it can use theme context
 */
function AppContent() {
  const [overlayConfig, setOverlayConfig] = useState({
    filmGrain: true,
    vignette: true,
    scanlines: true,
    particles: 'dust',
    ascii: true,
  });

  return (
    <>
      {/* Global overlays */}
      <OverlayStack
        filmGrain={overlayConfig.filmGrain}
        vignette={overlayConfig.vignette}
        scanlines={overlayConfig.scanlines}
        particles={overlayConfig.particles}
        ascii={overlayConfig.ascii}
      />

      {/* Dev controls */}
      <ThemeSwitcher />
      <OverlayControls overlayConfig={overlayConfig} setOverlayConfig={setOverlayConfig} />

      {/* Main content */}
      <BeHereMeow />
    </>
  );
}

/**
 * App - Root component with providers
 */
export default function App() {
  return (
    <ThemeProvider initialTheme="noir">
      <AppContent />
    </ThemeProvider>
  );
}
