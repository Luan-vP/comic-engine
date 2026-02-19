import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme, themes } from './theme/ThemeContext';
import { OverlayStack } from './components/overlays';
import { BeHereMeow } from './pages/BeHereMeow';
import { ExamplePage } from './pages/ExamplePage';
import { DepthSegmentationPage } from './pages/DepthSegmentationPage';
// @scene-imports

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
      <div
        style={{
          color: theme.colors.textMuted,
          fontSize: '10px',
          marginBottom: '8px',
          letterSpacing: '1px',
        }}
      >
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
      <div
        style={{
          color: theme.colors.textMuted,
          fontSize: '10px',
          marginBottom: '12px',
          letterSpacing: '1px',
        }}
      >
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

      <div
        style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: `1px solid ${theme.colors.border}`,
        }}
      >
        <div style={{ color: theme.colors.textMuted, fontSize: '10px', marginBottom: '8px' }}>
          PARTICLES
        </div>
        <select
          value={overlayConfig.particles || 'none'}
          onChange={(e) =>
            setOverlayConfig({
              ...overlayConfig,
              particles: e.target.value === 'none' ? null : e.target.value,
            })
          }
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
 * Page Navigator - for switching between demo pages
 */
function PageNavigator() {
  const { theme } = useTheme();
  const location = useLocation();

  const pages = [
    { path: '/', label: 'BeHereMeow' },
    { path: '/example', label: 'Example' },
    { path: '/depth-segmentation', label: 'Depth Segmentation' },
    // @scene-pages
  ];

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '12px',
        zIndex: 10000,
        fontFamily: theme.typography.fontBody,
      }}
    >
      <div
        style={{
          color: theme.colors.textMuted,
          fontSize: '10px',
          marginBottom: '8px',
          letterSpacing: '1px',
        }}
      >
        PAGES
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {pages.map(({ path, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                background: isActive ? theme.colors.primary : 'rgba(255,255,255,0.1)',
                color: isActive ? '#000' : theme.colors.text,
                border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: isActive ? 'bold' : 'normal',
                textDecoration: 'none',
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main App Content - separated so it can use theme context
 */
function AppContent() {
  const location = useLocation();
  const [overlayConfig, setOverlayConfig] = useState({
    filmGrain: true,
    vignette: true,
    scanlines: true,
    particles: 'dust',
    ascii: true,
  });

  // Don't show overlays on depth segmentation page (has its own controls)
  const showOverlays = location.pathname !== '/depth-segmentation';

  return (
    <>
      {/* Global overlays */}
      {showOverlays && (
        <OverlayStack
          filmGrain={overlayConfig.filmGrain}
          vignette={overlayConfig.vignette}
          scanlines={overlayConfig.scanlines}
          particles={overlayConfig.particles}
          ascii={overlayConfig.ascii}
        />
      )}

      {/* Dev controls */}
      {showOverlays && (
        <>
          <ThemeSwitcher />
          <OverlayControls overlayConfig={overlayConfig} setOverlayConfig={setOverlayConfig} />
        </>
      )}

      {/* Page navigation */}
      <PageNavigator />

      {/* Main content */}
      <Routes>
        <Route path="/" element={<BeHereMeow />} />
        <Route path="/example" element={<ExamplePage />} />
        <Route path="/depth-segmentation" element={<DepthSegmentationPage />} />
        {/* @scene-routes */}
      </Routes>
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
