import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { Panel } from '../scene/Panel';
import { SceneObject } from '../scene/SceneObject';
import { SceneTemplates, MoodPresets } from './biographySchema';

/**
 * SnapshotPanel - Renders a biography snapshot as a stylized comic panel
 *
 * Features:
 * - Applies scene template styling
 * - Shows memory content with visual metaphors
 * - Mood-based atmosphereeffects
 * - Character indicators
 */
export function SnapshotPanel({ snapshot, characters = [], position = [0, 0, 0], rotation = [0, 0, 0], onClick }) {
  const { theme } = useTheme();

  const template = SceneTemplates[snapshot.sceneTemplate] || SceneTemplates.MILESTONE;
  const mood = MoodPresets[snapshot.mood] || MoodPresets.NOSTALGIC;

  // Get characters in this snapshot
  const snapshotCharacters = characters.filter((c) => snapshot.characters && snapshot.characters.includes(c.id));

  return (
    <SceneObject position={position} rotation={rotation} onClick={onClick}>
      <Panel
        width={360}
        height={480}
        variant={template.panelVariant}
        title={snapshot.title}
        subtitle={snapshot.when || snapshot.where}
      >
        {/* Memory content container with mood filter */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            filter: mood.colorFilter,
          }}
        >
          {/* Top section - What happened */}
          <div>
            {snapshot.what && (
              <div
                style={{
                  fontSize: '13px',
                  color: theme.colors.text,
                  lineHeight: '1.6',
                  fontFamily: theme.typography.fontNarrative,
                  marginBottom: '16px',
                  fontStyle: 'italic',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {snapshot.what.length > 150 ? `${snapshot.what.substring(0, 150)}...` : snapshot.what}
              </div>
            )}

            {/* Character avatars */}
            {snapshotCharacters.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                {snapshotCharacters.map((char) => (
                  <div
                    key={char.id}
                    title={`${char.name} - ${char.relationship}`}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: char.avatarColor,
                      border: '2px solid rgba(255,255,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#fff',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    }}
                  >
                    {char.name.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom section - Feeling */}
          {snapshot.feeling && (
            <div
              style={{
                padding: '12px 16px',
                background: `linear-gradient(135deg, ${theme.colors.primary}40, ${theme.colors.secondary}30)`,
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.colors.primary}60`,
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: theme.colors.textMuted,
                  marginBottom: '4px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Feeling
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontDisplay,
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {snapshot.feeling}
              </div>
            </div>
          )}

          {/* Scene template badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              fontSize: '9px',
              padding: '4px 8px',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '4px',
              color: template.suggestedColors[0],
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {template.name}
          </div>
        </div>

        {/* Decorative corner elements based on template */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
          }}
          width="100%"
          height="100%"
        >
          <defs>
            <linearGradient id={`grad-${snapshot.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {template.suggestedColors.map((color, i) => (
                <stop key={i} offset={`${(i / (template.suggestedColors.length - 1)) * 100}%`} stopColor={color} stopOpacity="0.3" />
              ))}
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill={`url(#grad-${snapshot.id})`} opacity="0.1" />
        </svg>
      </Panel>
    </SceneObject>
  );
}

export default SnapshotPanel;
