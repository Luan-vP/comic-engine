import React, { useRef } from 'react';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import { useJournalEntries } from '../journal';

const LAYOUTS = ['timeline', 'spiral', 'stack'];

/**
 * JournalPage - Visualize Obsidian journal entries as 3D comic panels.
 *
 * Load .md (Obsidian markdown) or .json (export format) files via the
 * control panel on the left. Entries are rendered as parallax panels
 * grouped by theme and arranged using the selected layout algorithm.
 */
export function JournalPage() {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const {
    entries,
    selectedTheme,
    availableThemes,
    layout,
    sceneObjects,
    loading,
    error,
    loadFile,
    clearEntries,
    setSelectedTheme,
    setLayout,
  } = useJournalEntries();

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await loadFile(file);
    }
    // Reset so the same file can be re-loaded
    e.target.value = '';
  }

  const controlPanel = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    padding: '16px',
    zIndex: 100,
    minWidth: '200px',
    maxWidth: '240px',
    fontFamily: theme.typography.fontBody,
  };

  const sectionLabel = {
    color: theme.colors.textMuted,
    fontSize: '10px',
    letterSpacing: '1px',
    marginBottom: '6px',
    display: 'block',
  };

  const primaryButton = {
    background: theme.colors.primary,
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 14px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    width: '100%',
    marginBottom: '12px',
  };

  const dangerButton = {
    background: 'rgba(255,60,60,0.15)',
    color: theme.colors.text,
    border: `1px solid rgba(255,60,60,0.4)`,
    borderRadius: '4px',
    padding: '6px 14px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
    marginTop: '4px',
  };

  const selectInput = {
    background: 'rgba(255,255,255,0.08)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.text,
    padding: '6px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
    marginBottom: '12px',
  };

  return (
    <Scene perspective={1000} parallaxIntensity={1} mouseInfluence={{ x: 50, y: 30 }}>
      {/* ===== CONTROL PANEL ===== */}
      <div style={controlPanel}>
        <div
          style={{
            color: theme.colors.primary,
            fontSize: '12px',
            letterSpacing: '2px',
            marginBottom: '16px',
            fontWeight: 'bold',
          }}
        >
          JOURNAL
        </div>

        {/* File upload */}
        <span style={sectionLabel}>IMPORT</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.json"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button style={primaryButton} onClick={() => fileInputRef.current?.click()}>
          Load .md / .json
        </button>

        {entries.length > 0 && (
          <>
            {/* Theme filter */}
            {availableThemes.length > 0 && (
              <>
                <span style={sectionLabel}>THEME</span>
                <select
                  value={selectedTheme || ''}
                  onChange={(e) => setSelectedTheme(e.target.value || null)}
                  style={selectInput}
                >
                  <option value="">All themes</option>
                  {availableThemes.map((t) => (
                    <option key={t} value={t} style={{ background: '#222' }}>
                      {t}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Layout selector */}
            <span style={sectionLabel}>LAYOUT</span>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              style={selectInput}
            >
              {LAYOUTS.map((l) => (
                <option key={l} value={l} style={{ background: '#222' }}>
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </option>
              ))}
            </select>

            {/* Stats */}
            <div
              style={{
                color: theme.colors.textMuted,
                fontSize: '10px',
                marginBottom: '8px',
              }}
            >
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {sceneObjects.length} panels
            </div>

            <button style={dangerButton} onClick={clearEntries}>
              Clear All
            </button>
          </>
        )}

        {loading && (
          <div style={{ color: theme.colors.textMuted, fontSize: '10px', marginTop: '8px' }}>
            Loading…
          </div>
        )}

        {error && (
          <div style={{ color: '#ff4444', fontSize: '10px', marginTop: '8px' }}>
            {error}
          </div>
        )}
      </div>

      {/* ===== EMPTY STATE ===== */}
      {entries.length === 0 && (
        <SceneObject position={[0, 0, 0]} parallaxFactor={0.5} interactive={false}>
          <div
            style={{
              textAlign: 'center',
              fontFamily: theme.typography.fontBody,
              color: theme.colors.textMuted,
              maxWidth: '380px',
              transform: 'translateX(-50%)',
            }}
          >
            <div
              style={{
                fontFamily: theme.typography.fontDisplay,
                fontSize: '48px',
                color: theme.colors.primary,
                opacity: 0.25,
                letterSpacing: '6px',
                marginBottom: '24px',
              }}
            >
              JOURNAL
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.7, opacity: 0.55 }}>
              Load Obsidian markdown files or JSON exports to visualize your journal entries as
              comic panels in 3D space.
            </p>
            <p style={{ fontSize: '11px', lineHeight: 1.6, opacity: 0.35, marginTop: '10px' }}>
              Supports .md files with YAML frontmatter and .json export files.
            </p>
          </div>
        </SceneObject>
      )}

      {/* ===== JOURNAL PANELS ===== */}
      {sceneObjects.map((obj) => (
        <SceneObject
          key={obj.id}
          position={obj.position}
          rotation={obj.rotation}
          parallaxFactor={obj.parallaxFactor}
        >
          <Panel
            width={280}
            height={360}
            variant={obj.panelVariant}
            title={obj.title}
            subtitle={obj.subtitle}
          >
            {/* Passage text */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '16px',
                right: '16px',
                fontFamily: theme.typography.fontNarrative,
                fontSize: '11px',
                lineHeight: 1.6,
                color:
                  obj.panelVariant === 'torn' || obj.panelVariant === 'polaroid'
                    ? '#444'
                    : theme.colors.text,
                opacity: 0.9,
                maxHeight: '180px',
                overflow: 'hidden',
              }}
            >
              {obj.text && (
                <p style={{ margin: 0 }}>
                  {obj.text.length > 220 ? obj.text.slice(0, 220) + '…' : obj.text}
                </p>
              )}
              {obj.characters && obj.characters.length > 0 && (
                <p style={{ margin: '8px 0 0', opacity: 0.55, fontSize: '10px' }}>
                  — {obj.characters.join(', ')}
                </p>
              )}
            </div>

            {/* Date badge */}
            {obj.entryDate && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '12px',
                  color:
                    obj.panelVariant === 'torn' || obj.panelVariant === 'polaroid'
                      ? '#aaa'
                      : theme.colors.textMuted,
                  fontSize: '9px',
                  letterSpacing: '1px',
                  fontFamily: theme.typography.fontBody,
                }}
              >
                {obj.entryDate}
              </div>
            )}
          </Panel>
        </SceneObject>
      ))}
    </Scene>
  );
}

export default JournalPage;
