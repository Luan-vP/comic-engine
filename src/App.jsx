import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme, themes } from './theme/ThemeContext';
import { OverlayStack } from './components/overlays';
import { DynamicScenePage } from './pages/DynamicScenePage';
import { NewScenePage } from './pages/NewScenePage';
import { ComicBookReader } from './pages/ComicBookReader';
import { usePages } from './hooks/usePages';

// Auto-discover pages that export PAGE_NAV ({ path, label })
const pageModules = import.meta.glob('./pages/*.jsx', { eager: true });
const autoPages = Object.values(pageModules)
  .filter((mod) => mod.PAGE_NAV)
  .map((mod) => ({
    ...mod.PAGE_NAV,
    Component: mod.default,
  }));

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
function PageNavigator({ pages, error }) {
  const { theme } = useTheme();
  const location = useLocation();
  const [publishStatus, setPublishStatus] = useState({});

  async function handlePublish(slug, lastPublishedSlug) {
    const comicBookSlug = window.prompt(
      'Enter comic book slug to publish to:',
      lastPublishedSlug || '',
    );
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

  const tools = autoPages.filter((p) => p.section === 'tools');
  const srcPages = autoPages.filter((p) => p.section !== 'tools');

  const linkStyle = (isActive, isGcs) => ({
    background: isActive
      ? theme.colors.primary
      : isGcs
        ? 'rgba(100,180,255,0.1)'
        : 'rgba(255,255,255,0.1)',
    color: isActive ? '#000' : theme.colors.text,
    border: `1px solid ${isActive ? theme.colors.primary : isGcs ? 'rgba(100,180,255,0.3)' : theme.colors.border}`,
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: isActive ? 'bold' : 'normal',
    textDecoration: 'none',
  });

  const localPages = pages.filter((p) => p.source === 'local');
  const gcsPages = pages.filter((p) => p.source === 'gcs');
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
            <Link key={path} to={path} style={linkStyle(isActive, false)}>
              {label}
            </Link>
          );
        })}
      </div>

      {(srcPages.length > 0 || localPages.length > 0) && (
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
            {srcPages.map(({ path, label }) => {
              const isActive = location.pathname === path;
              return (
                <Link key={path} to={path} style={linkStyle(isActive, false)}>
                  {label}
                </Link>
              );
            })}
            {localPages.map(({ slug, name, lastPublishedSlug }) => {
              const path = `/scenes/${slug}`;
              const isActive = location.pathname === path;
              const status = publishStatus[slug];
              return (
                <span
                  key={slug}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                >
                  <Link to={path} style={linkStyle(isActive, false)}>
                    {name}
                  </Link>
                  <button
                    onClick={() => handlePublish(slug, lastPublishedSlug)}
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
            <Link to="/scenes/new" style={linkStyle(newPageActive, false)}>
              + New Page
            </Link>
          </div>
        </>
      )}

      {gcsPages.length > 0 && (
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
            PUBLISHED
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {gcsPages.map(({ slug, name }) => {
              const path = `/read/${slug}`;
              const isActive = location.pathname.startsWith(path);
              return (
                <Link key={slug} to={path} style={linkStyle(isActive, true)}>
                  {name}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {error && (
        <div
          style={{
            color: '#ef4444',
            fontSize: '10px',
            marginTop: '12px',
            letterSpacing: '0.5px',
          }}
          title={error.message}
        >
          ⚠ Failed to load published comics
        </div>
      )}
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
  const { pages: allPages, error: pagesError, refetch: refetchPages } = usePages();

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
      <PageNavigator pages={allPages} error={pagesError} />

      {/* Main content */}
      <Routes>
        {autoPages.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
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
