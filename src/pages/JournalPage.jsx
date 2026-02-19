import React, { useRef } from 'react';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import { useJournalEntries } from '../journal';

/**
 * JournalPage — Visualize Obsidian journal entries as 3D comic panels.
 *
 * Load .md or .json files exported from Obsidian.
 * Entries are mapped to comic panels using emotion → variant and
 * intensity → Z depth + parallax factor.
 */
export function JournalPage() {
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  const {
    entries,
    themes,
    selectedTheme,
    setSelectedTheme,
    layout,
    setLayout,
    sceneObjects,
    loading,
    error,
    loadFiles,
    clearEntries,
  } = useJournalEntries();

  function handleFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      loadFiles(e.target.files);
      // Reset the input so the same file can be re-loaded if needed
      e.target.value = '';
    }
  }

  const controlsStyle = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '8px',
    padding: '16px',
    zIndex: 100,
    fontFamily: theme.typography.fontBody,
    maxWidth: '280px',
  };

  const labelStyle = {
    color: theme.colors.textMuted,
    fontSize: '10px',
    letterSpacing: '1px',
    display: 'block',
    marginBottom: '6px',
  };

  const selectStyle = {
    background: 'rgba(255,255,255,0.1)',
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

  const buttonStyle = {
    background: theme.colors.primary,
    border: 'none',
    borderRadius: '4px',
    color: '#000',
    padding: '8px 14px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
    width: '100%',
    marginBottom: '6px',
  };

  const ghostButtonStyle = {
    ...buttonStyle,
    background: 'transparent',
    color: theme.colors.textMuted,
    border: `1px solid ${theme.colors.border}`,
  };

  return (
    <Scene perspective={1000} parallaxIntensity={1} mouseInfluence={{ x: 50, y: 30 }}>
      {/* ===== CONTROLS ===== */}
      <div style={controlsStyle}>
        <div
          style={{
            color: theme.colors.primary,
            fontSize: '13px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            marginBottom: '14px',
            fontFamily: theme.typography.fontDisplay,
          }}
        >
          JOURNAL
        </div>

        {/* File upload */}
        <span style={labelStyle}>LOAD ENTRIES</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.json"
          multiple
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button style={buttonStyle} onClick={() => fileInputRef.current?.click()}>
          {loading ? 'Loading...' : 'Open .md / .json'}
        </button>

        {entries.length > 0 && (
          <button style={ghostButtonStyle} onClick={clearEntries}>
            Clear ({entries.length} entries)
          </button>
        )}

        {/* Theme filter */}
        {themes.length > 0 && (
          <>
            <span style={{ ...labelStyle, marginTop: '10px' }}>THEME</span>
            <select
              value={selectedTheme || ''}
              onChange={(e) => setSelectedTheme(e.target.value || null)}
              style={selectStyle}
            >
              <option value="">All themes ({entries.length})</option>
              {themes.map((seq) => (
                <option key={seq.theme} value={seq.theme}>
                  {seq.theme} ({seq.entries.length})
                </option>
              ))}
            </select>
          </>
        )}

        {/* Layout selector */}
        {entries.length > 0 && (
          <>
            <span style={labelStyle}>LAYOUT</span>
            <select value={layout} onChange={(e) => setLayout(e.target.value)} style={selectStyle}>
              <option value="timeline">Timeline</option>
              <option value="spiral">Spiral</option>
              <option value="stack">Stack</option>
            </select>
          </>
        )}

        {/* Error display */}
        {error && (
          <div
            style={{
              color: '#ff6b6b',
              fontSize: '11px',
              marginTop: '8px',
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* ===== EMPTY STATE ===== */}
      {entries.length === 0 && !loading && (
        <SceneObject position={[0, 0, 0]} parallaxFactor={0.5} interactive={false}>
          <div
            style={{
              fontFamily: theme.typography.fontBody,
              textAlign: 'center',
              maxWidth: '380px',
            }}
          >
            <div
              style={{
                color: theme.colors.primary,
                fontSize: '40px',
                marginBottom: '20px',
                opacity: 0.4,
              }}
            >
              ◈
            </div>
            <h2
              style={{
                color: theme.colors.text,
                fontFamily: theme.typography.fontDisplay,
                fontSize: '18px',
                letterSpacing: '3px',
                margin: '0 0 12px 0',
              }}
            >
              JOURNAL INTEGRATION
            </h2>
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: '12px',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              Load Obsidian journal entries to visualize them as 3D comic panels.
              <br />
              <br />
              Accepts <strong style={{ color: theme.colors.text }}>.md</strong> files (Obsidian
              exports) or <strong style={{ color: theme.colors.text }}>.json</strong> batch exports.
              <br />
              <br />
              Mark passages with{' '}
              <code
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  padding: '1px 4px',
                  borderRadius: '2px',
                }}
              >
                [Marked passage begins]...[Marked passage ends]
              </code>{' '}
              in Obsidian to select which content appears in the comic panel.
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
            variant={obj.variant}
            title={obj.title}
            subtitle={obj.emotion ? obj.emotion.toUpperCase() : undefined}
          >
            {/* Passage text */}
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '16px',
                right: '16px',
                top: obj.title ? '80px' : '20px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <p
                style={{
                  color:
                    obj.variant === 'torn' || obj.variant === 'polaroid'
                      ? '#333'
                      : theme.colors.textMuted,
                  fontSize: '11px',
                  lineHeight: 1.6,
                  fontFamily: theme.typography.fontNarrative,
                  fontStyle: 'italic',
                  margin: 0,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 8,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {obj.passage}
              </p>
              <div
                style={{
                  color:
                    obj.variant === 'torn' || obj.variant === 'polaroid'
                      ? '#666'
                      : theme.colors.textSubtle,
                  fontSize: '9px',
                  marginTop: '10px',
                  letterSpacing: '0.5px',
                }}
              >
                {new Date(obj.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
          </Panel>
        </SceneObject>
      ))}
    </Scene>
  );
}

export default JournalPage;
