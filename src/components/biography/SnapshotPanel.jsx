import React from 'react';
import { Panel } from '../scene/Panel';
import { useTheme } from '../../theme/ThemeContext';
import { TEMPLATES, MOODS } from './biographySchema';

/**
 * SnapshotPanel - Renders a biography memory as a styled comic panel.
 *
 * Uses the existing Panel component with a variant determined by the snapshot's
 * template. Mood is applied as a CSS filter overlay.
 */
export function SnapshotPanel({ snapshot, characters = [], compact = false }) {
  const { theme } = useTheme();

  if (!snapshot) return null;

  const template = TEMPLATES[snapshot.templateId] || TEMPLATES.milestone;
  const mood = MOODS[snapshot.moodId] || MOODS.nostalgic;

  const width = compact ? 180 : 260;
  const height = compact ? 220 : 320;

  return (
    <Panel
      variant={template.panelVariant}
      width={width}
      height={height}
      style={{ position: 'relative' }}
    >
      {/* Mood filter overlay */}
      {mood.cssFilter !== 'none' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            filter: mood.cssFilter,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* Template colour bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: template.color,
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'absolute',
          inset: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 3,
          paddingTop: '8px',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: compact ? '13px' : '16px',
            color:
              template.panelVariant === 'torn' || template.panelVariant === 'polaroid'
                ? '#333'
                : theme.colors.text,
            fontWeight: 'bold',
            lineHeight: 1.2,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {snapshot.title || 'Untitled Memory'}
        </div>

        {/* When / Where */}
        <div
          style={{
            fontFamily: theme.typography.fontNarrative,
            fontSize: compact ? '9px' : '11px',
            color:
              template.panelVariant === 'torn' || template.panelVariant === 'polaroid'
                ? '#666'
                : theme.colors.textMuted,
            fontStyle: 'italic',
          }}
        >
          {[snapshot.when, snapshot.where].filter(Boolean).join(' · ')}
        </div>

        {/* What (description area) */}
        {!compact && snapshot.what && (
          <div
            style={{
              flex: 1,
              fontFamily: theme.typography.fontNarrative,
              fontSize: '11px',
              color:
                template.panelVariant === 'torn' || template.panelVariant === 'polaroid'
                  ? '#555'
                  : theme.colors.textMuted,
              lineHeight: 1.5,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {snapshot.what}
          </div>
        )}

        {/* Feeling tag */}
        {snapshot.feeling && (
          <div
            style={{
              alignSelf: 'flex-start',
              background: template.color + '30',
              border: `1px solid ${template.color}60`,
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: compact ? '9px' : '10px',
              color: template.color,
              fontFamily: theme.typography.fontBody,
            }}
          >
            {snapshot.feeling}
          </div>
        )}

        {/* Character dots */}
        {characters.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: 'auto' }}>
            {characters.slice(0, 5).map((char) => (
              <div
                key={char.id}
                title={char.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: char.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontBody,
                  flexShrink: 0,
                }}
              >
                {char.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mood label */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          right: '10px',
          fontSize: '8px',
          color:
            template.panelVariant === 'torn' || template.panelVariant === 'polaroid'
              ? '#999'
              : theme.colors.textSubtle,
          fontFamily: theme.typography.fontBody,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          zIndex: 3,
        }}
      >
        {mood.label}
      </div>
    </Panel>
  );
}

export default SnapshotPanel;
