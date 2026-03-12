import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme, themes } from './theme/ThemeContext';
import { OverlayStack } from './components/overlays';
import { BeHereMeow } from './pages/BeHereMeow';
import { ExamplePage } from './pages/ExamplePage';
import { DepthSegmentationPage } from './pages/DepthSegmentationPage';
import { BiographySnapshots } from './pages/BiographySnapshots';
import { JournalPage } from './pages/JournalPage';
import { DynamicScenePage } from './pages/DynamicScenePage';
import { NewScenePage } from './pages/NewScenePage';
import { ComicBookReader } from './pages/ComicBookReader';
import { useLocalPages } from './hooks/useLocalPages';

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
    { key: 'inkSplatter', label: 'Ink Splatter' },
    { key: 'graffitiSpray', label: 'Graffiti Spray' },
    { key: 'halftone', label: 'Halftone Dots' },
    { key: 'speedLines', label: 'Speed Lines' },
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
function PageNavigator({ localPages }) {
  const { theme } = useTheme();
  const location = useLocation();
  const [publishStatus, setPublishStatus] = useState({});

  async function handlePublish(slug) {
    const comicBookSlug = window.prompt('Enter comic book slug to publish to:', '');
    if (!comicBookSlug) return;

    setPublishStatus((prev) => ({ ...prev, [slug]: 'publishing' }));
    try {
      const res = await fetch(`/_dev/scenes/${slug}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comicBookSlug }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Publish failed');
      }
      setPublishStatus((prev) => ({ ...prev, [slug]: 'ok' }));
      setTimeout(() => setPublishStatus((prev) => ({ ...prev, [slug]: null })), 3000);
    } catch (err) {
      setPublishStatus((prev) => ({ ...prev, [slug]: 'error' }));
      setTimeout(() => setPublishStatus((prev) => ({ ...prev, [slug]: null })), 4000);
      console.error('Publish failed:', err.message);
    }
  }

  const tools = [
    { path: '/', label: 'BeHereMeow' },
    { path: '/example', label: 'Example' },
    { path: '/depth-segmentation', label: 'Depth Segmentation' },
    { path: '/biography', label: 'Biography' },
    { path: '/journal', label: 'Journal' },
  ];

  const linkStyle = (isActive) => ({
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
  });

  const newPageActive = location.pathname === '/scenes/new';

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
        TOOLS
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {tools.map(({ path, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link key={path} to={path} style={linkStyle(isActive)}>
              {label}
            </Link>
          );
        })}
      </div>
      <>
        <div
          style={{
            color: theme.colors.textMuted,
            fontSize: '10px',
            marginTop: '12px',
            marginBottom: '8px',
            letterSpacing: '1px',
          }}
        >
          PAGES
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {localPages.map(({ slug, name }) => {
            const path = `/scenes/${slug}`;
            const isActive = location.pathname === path;
            const status = publishStatus[slug];
            return (
              <span key={slug} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                <Link to={path} style={linkStyle(isActive)}>
                  {name}
                </Link>
                <button
                  onClick={() => handlePublish(slug)}
                  title="Publish to GCS"
                  disabled={status === 'publishing'}
                  style={{
                    background:
                      status === 'ok'
                        ? '#22c55e'
                        : status === 'error'
                          ? '#ef4444'
                          : 'rgba(255,255,255,0.1)',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: '4px',
                    color: theme.colors.text,
                    padding: '6px 7px',
                    fontSize: '11px',
                    cursor: status === 'publishing' ? 'wait' : 'pointer',
                    fontFamily: 'inherit',
                    lineHeight: 1,
                  }}
                >
                  {status === 'publishing'
                    ? '…'
                    : status === 'ok'
                      ? '✓'
                      : status === 'error'
                        ? '✗'
                        : '↑'}
                </button>
              </span>
            );
          })}
          <Link to="/scenes/new" style={linkStyle(newPageActive)}>
            + New Page
          </Link>
        </div>
      </>
    </div>
  );
}

/**
 * ReaderLayout - Clean, minimal layout for the published comic reader.
 * No sidebar, no dev controls, no overlays (reader will own its own later).
 */
function ReaderLayout() {
  return (
    <Routes>
      <Route path="/read/:comicBookSlug" element={<ComicBookReader />} />
      <Route path="/read/:comicBookSlug/:slide" element={<ComicBookReader />} />
    </Routes>
  );
}

/**
 * EditorLayout - Full editor with overlays, dev controls, and page navigation.
 */
function EditorLayout() {
  const location = useLocation();
  const [overlayConfig, setOverlayConfig] = useState({
    filmGrain: true,
    vignette: true,
    scanlines: true,
    particles: 'dust',
    ascii: true,
    inkSplatter: false,
    graffitiSpray: false,
    halftone: false,
    speedLines: false,
  });

  // Lift scene list here so PageNavigator and NewScenePage share the same state
  const { pages: localPages, refetch: refetchPages } = useLocalPages();

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
          inkSplatter={overlayConfig.inkSplatter}
          graffitiSpray={overlayConfig.graffitiSpray}
          halftone={overlayConfig.halftone}
          speedLines={overlayConfig.speedLines}
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
      <PageNavigator localPages={localPages} />

      {/* Main content */}
      <Routes>
        <Route path="/" element={<BeHereMeow />} />
        <Route path="/example" element={<ExamplePage />} />
        <Route path="/depth-segmentation" element={<DepthSegmentationPage />} />
        <Route path="/biography" element={<BiographySnapshots />} />
        <Route path="/journal" element={<JournalPage />} />
        {/* /scenes/new must come before /scenes/:slug to avoid slug matching "new" */}
        <Route path="/scenes/new" element={<NewScenePage onCreated={refetchPages} />} />
        <Route path="/scenes/:slug" element={<DynamicScenePage />} />
      </Routes>
    </>
  );
}

/**
 * AppContent - Routes to either the clean reader or the full editor layout.
 */
function AppContent() {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');

  return isReader ? <ReaderLayout /> : <EditorLayout />;
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
