import React from 'react';
import { Panel } from '../scene';
import { useTheme } from '../../theme/ThemeContext';
import { TEMPLATES, MOODS } from './biographySchema';

/**
 * SnapshotPanel - Renders a memory as a styled comic panel.
 *
 * Uses the Panel component from the scene system with a variant determined
 * by the memory's template. Mood-based CSS filters add atmosphere without
 * requiring new theme definitions.
 */
export function SnapshotPanel({ snapshot, characters = [], onClick, width = 260, height = 340 }) {
  const { theme } = useTheme();

  const template = TEMPLATES[snapshot.template] || TEMPLATES.milestone;
  const mood = MOODS[snapshot.mood] || MOODS.nostalgic;

  // Characters tagged in this snapshot
  const tagged = characters.filter((c) => snapshot.characterIds.includes(c.id));

  return (
    <div
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        filter: mood.cssFilter !== 'none' ? mood.cssFilter : undefined,
        transition: 'transform 0.2s ease, filter 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.transform = 'scale(1.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <Panel variant={template.panelVariant} width={width} height={height}>
        {/* Colour bar matching template identity */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: template.color,
            zIndex: 20,
          }}
        />

        {/* Memory content */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: theme.typography.fontBody,
          }}
        >
          {/* Header */}
          <div>
            <div
              style={{
                fontSize: '9px',
                letterSpacing: '2px',
                color: template.color,
                textTransform: 'uppercase',
                marginBottom: '6px',
                fontWeight: 'bold',
              }}
            >
              {template.label}
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontFamily: theme.typography.fontDisplay,
                color: template.panelVariant === 'polaroid' || template.panelVariant === 'torn'
                  ? '#222'
                  : theme.colors.text,
                lineHeight: 1.2,
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              {snapshot.title || 'Untitled Memory'}
            </h3>
          </div>

          {/* Core details */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '12px 0',
            }}
          >
            {snapshot.when && (
              <FieldRow
                label="When"
                value={snapshot.when}
                isLight={template.panelVariant === 'polaroid' || template.panelVariant === 'torn'}
              />
            )}
            {snapshot.where && (
              <FieldRow
                label="Where"
                value={snapshot.where}
                isLight={template.panelVariant === 'polaroid' || template.panelVariant === 'torn'}
              />
            )}
            {snapshot.who && (
              <FieldRow
                label="Who"
                value={snapshot.who}
                isLight={template.panelVariant === 'polaroid' || template.panelVariant === 'torn'}
              />
            )}
          </div>

          {/* Footer: feeling + characters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {snapshot.feeling && (
              <div
                style={{
                  fontSize: '11px',
                  fontStyle: 'italic',
                  fontFamily: theme.typography.fontNarrative,
                  color: template.panelVariant === 'polaroid' || template.panelVariant === 'torn'
                    ? '#555'
                    : theme.colors.textMuted,
                  lineHeight: 1.4,
                }}
              >
                &ldquo;{snapshot.feeling}&rdquo;
              </div>
            )}

            {tagged.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {tagged.map((c) => (
                  <CharacterDot key={c.id} character={c} />
                ))}
              </div>
            )}

            <div
              style={{
                fontSize: '9px',
                color: template.panelVariant === 'polaroid' || template.panelVariant === 'torn'
                  ? '#999'
                  : theme.colors.textSubtle,
                letterSpacing: '1px',
              }}
            >
              {mood.label.toUpperCase()}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function FieldRow({ label, value, isLight }) {
  return (
    <div style={{ display: 'flex', gap: '6px', fontSize: '11px', lineHeight: 1.3 }}>
      <span
        style={{
          color: isLight ? '#888' : 'rgba(255,255,255,0.4)',
          minWidth: '36px',
          fontSize: '9px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          paddingTop: '1px',
        }}
      >
        {label}
      </span>
      <span style={{ color: isLight ? '#333' : 'rgba(255,255,255,0.8)', flex: 1 }}>{value}</span>
    </div>
  );
}

function CharacterDot({ character }) {
  return (
    <div
      title={`${character.name}${character.relationship ? ` (${character.relationship})` : ''}`}
      style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: character.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        flexShrink: 0,
      }}
    >
      {character.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default SnapshotPanel;
