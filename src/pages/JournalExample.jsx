import React, { useState, useEffect } from 'react';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import { useJournalEntries, generateThemeSequenceScene } from '../journal';

/**
 * JournalExample - Demonstrates journal-to-comic integration
 *
 * This page shows how to:
 * 1. Load journal entries from JSON
 * 2. Generate scenes from theme sequences
 * 3. Navigate between different themes
 */
export function JournalExample() {
  const { theme } = useTheme();
  const {
    sequences,
    loading,
    error,
    loadFromSource,
  } = useJournalEntries();

  const [selectedTheme, setSelectedTheme] = useState(null);
  const [sceneConfig, setSceneConfig] = useState(null);

  // Load example data on mount
  useEffect(() => {
    loadFromSource('/src/journal/templates/example-export.json').catch(err => {
      console.error('Failed to load example data:', err);
    });
  }, [loadFromSource]);

  // Generate scene when theme is selected
  useEffect(() => {
    if (selectedTheme) {
      const sequence = sequences.find(s => s.theme === selectedTheme);
      if (sequence) {
        const config = generateThemeSequenceScene(sequence, { layout: 'timeline' });
        setSceneConfig(config);
      }
    }
  }, [selectedTheme, sequences]);

  // Auto-select first theme when sequences load
  useEffect(() => {
    if (sequences.length > 0 && !selectedTheme) {
      setSelectedTheme(sequences[0].theme);
    }
  }, [sequences, selectedTheme]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: theme.colors.text,
        fontFamily: theme.typography.fontBody,
      }}>
        Loading journal entries...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: theme.colors.error || '#ff4444',
        fontFamily: theme.typography.fontBody,
      }}>
        Error: {error}
      </div>
    );
  }

  if (!sceneConfig) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: theme.colors.textMuted,
        fontFamily: theme.typography.fontBody,
      }}>
        No journal entries found. Place example-export.json in /public
      </div>
    );
  }

  return (
    <>
      {/* Theme selector */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        fontFamily: theme.typography.fontBody,
      }}>
        <h3 style={{
          color: theme.colors.primary,
          margin: '0 0 12px 0',
          fontSize: '12px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          Themes
        </h3>
        {sequences.map(seq => (
          <button
            key={seq.theme}
            onClick={() => setSelectedTheme(seq.theme)}
            style={{
              display: 'block',
              width: '100%',
              padding: '8px 12px',
              margin: '4px 0',
              background: selectedTheme === seq.theme
                ? theme.colors.primary
                : 'rgba(255,255,255,0.1)',
              color: selectedTheme === seq.theme
                ? '#000'
                : theme.colors.text,
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              textAlign: 'left',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}
          >
            {seq.theme} ({seq.entryIds.length})
          </button>
        ))}
      </div>

      {/* Generated scene */}
      <Scene {...sceneConfig.sceneProps}>
        {sceneConfig.objects.map((obj, index) => {
          if (obj.type === 'panel') {
            return (
              <SceneObject
                key={`panel-${index}`}
                position={obj.position}
                rotation={obj.rotation}
                parallaxFactor={obj.parallaxFactor}
              >
                <Panel
                  width={obj.panel.width}
                  height={obj.panel.height}
                  variant={obj.panel.variant}
                  title={obj.panel.title}
                  subtitle={obj.panel.subtitle}
                  style={obj.panel.style}
                >
                  <div style={{
                    padding: '20px',
                    color: theme.colors.text,
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontFamily: theme.typography.fontNarrative,
                  }}>
                    {obj.panel.content}
                  </div>
                </Panel>
              </SceneObject>
            );
          }

          if (obj.type === 'title') {
            return (
              <SceneObject
                key={`title-${index}`}
                position={obj.position}
                rotation={obj.rotation}
                parallaxFactor={obj.parallaxFactor}
                interactive={false}
              >
                <div style={{
                  fontFamily: theme.typography.fontDisplay,
                  fontSize: '64px',
                  color: theme.colors.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '12px',
                  textShadow: `0 0 40px ${theme.colors.shadow}`,
                  textAlign: 'center',
                }}>
                  {obj.content.text}
                  {obj.content.subtitle && (
                    <div style={{
                      fontSize: '16px',
                      color: theme.colors.textMuted,
                      letterSpacing: '4px',
                      marginTop: '20px',
                    }}>
                      {obj.content.subtitle}
                    </div>
                  )}
                </div>
              </SceneObject>
            );
          }

          if (obj.type === 'context') {
            return (
              <SceneObject
                key={`context-${index}`}
                position={obj.position}
                rotation={obj.rotation}
                parallaxFactor={obj.parallaxFactor}
              >
                <div style={{
                  width: '200px',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.6)',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '4px',
                  fontFamily: theme.typography.fontBody,
                }}>
                  <div style={{
                    fontSize: '10px',
                    color: theme.colors.secondary,
                    letterSpacing: '2px',
                    marginBottom: '8px',
                  }}>
                    {obj.content.label}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: theme.colors.textMuted,
                    lineHeight: '1.4',
                  }}>
                    {obj.content.text}
                  </div>
                </div>
              </SceneObject>
            );
          }

          return null;
        })}
      </Scene>

      {/* Info panel */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        maxWidth: '300px',
        fontFamily: theme.typography.fontBody,
        zIndex: 1000,
      }}>
        <h3 style={{
          color: theme.colors.primary,
          margin: '0 0 8px 0',
          fontSize: '12px',
          letterSpacing: '2px',
        }}>
          JOURNAL INTEGRATION
        </h3>
        <p style={{
          color: theme.colors.textMuted,
          margin: 0,
          fontSize: '10px',
          lineHeight: 1.5,
        }}>
          Theme: <strong style={{ color: theme.colors.text }}>{selectedTheme}</strong>
          <br />
          Entries: <strong style={{ color: theme.colors.text }}>
            {sequences.find(s => s.theme === selectedTheme)?.entryIds.length || 0}
          </strong>
          <br />
          <br />
          {sceneConfig.sceneProps.scrollEnabled && '↓ Scroll to explore timeline'}
        </p>
      </div>
    </>
  );
}

export default JournalExample;
