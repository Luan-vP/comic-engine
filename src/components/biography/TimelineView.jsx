import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { SnapshotPanel } from './SnapshotPanel';

/**
 * TimelineView - Horizontal scrollable timeline of biography snapshots.
 *
 * No timeline library. Just a flex container with overflow-x: auto.
 * Snapshots are sorted chronologically by createdAt.
 */
export function TimelineView({ snapshots, characters = [], onEdit, onDelete, onSelect, selectedId }) {
  const { theme } = useTheme();

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  if (sorted.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '300px',
          color: theme.colors.textMuted,
          fontFamily: theme.typography.fontBody,
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '36px', opacity: 0.3 }}>◎</div>
        <div style={{ fontSize: '13px', letterSpacing: '1px' }}>No memories yet</div>
        <div style={{ fontSize: '11px', color: theme.colors.textSubtle }}>
          Open the New Memory tab to capture your first snapshot.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        overflowX: 'auto',
        overflowY: 'visible',
        paddingBottom: '16px',
      }}
    >
      {/* Horizontal track */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          alignItems: 'flex-start',
          minWidth: 'max-content',
          paddingTop: '8px',
        }}
      >
        {sorted.map((snapshot, index) => {
          const snapshotChars = characters.filter(
            (c) => snapshot.characterIds && snapshot.characterIds.includes(c.id),
          );
          const isSelected = snapshot.id === selectedId;

          return (
            <div
              key={snapshot.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
              }}
            >
              {/* Card + controls */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  width: '200px',
                }}
              >
                {/* Sequence number */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isSelected ? theme.colors.primary : theme.colors.border,
                    color: isSelected ? '#000' : theme.colors.textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    fontFamily: theme.typography.fontBody,
                    flexShrink: 0,
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onClick={() => onSelect && onSelect(snapshot)}
                >
                  {index + 1}
                </div>

                {/* Panel preview */}
                <div
                  onClick={() => onSelect && onSelect(snapshot)}
                  style={{
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    transition: 'transform 0.2s',
                    outline: isSelected ? `2px solid ${theme.colors.primary}` : 'none',
                    outlineOffset: '4px',
                    borderRadius: '4px',
                  }}
                >
                  <SnapshotPanel
                    snapshot={snapshot}
                    characters={snapshotChars}
                    compact
                  />
                </div>

                {/* Edit / Delete */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => onEdit && onEdit(snapshot)}
                    style={{
                      background: 'none',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '4px',
                      color: theme.colors.textMuted,
                      padding: '3px 10px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontFamily: theme.typography.fontBody,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(snapshot.id)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(233,69,96,0.3)',
                      borderRadius: '4px',
                      color: '#e94560',
                      padding: '3px 10px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontFamily: theme.typography.fontBody,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Connector line between cards */}
              {index < sorted.length - 1 && (
                <div
                  style={{
                    alignSelf: 'center',
                    width: '32px',
                    height: '2px',
                    background: theme.colors.border,
                    flexShrink: 0,
                    marginTop: '-40px',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TimelineView;
