import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { TEMPLATES, MOODS } from './biographySchema';
import { SnapshotPanel } from './SnapshotPanel';

/**
 * TimelineView - Horizontal scrollable chronological display of snapshots.
 *
 * Uses a simple flex container with overflow-x: auto. No timeline library.
 *
 * Props:
 *  - snapshots: snapshot[]
 *  - characters: Character[]
 *  - onEdit(snapshot): open wizard in edit mode
 *  - onDelete(id): remove a snapshot
 *  - onSelect(snapshot): highlight / view a snapshot
 */
export function TimelineView({ snapshots, characters = [], onEdit, onDelete, onSelect }) {
  const { theme } = useTheme();

  // Sort chronologically — fall back to createdAt for snapshots without a 'when'
  const sorted = [...snapshots].sort((a, b) => {
    const dateA = a.when || a.createdAt;
    const dateB = b.when || b.createdAt;
    return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
  });

  if (snapshots.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: '16px',
          fontFamily: theme.typography.fontBody,
        }}
      >
        <div style={{ color: theme.colors.textSubtle, fontSize: '40px' }}>&#9678;</div>
        <div style={{ color: theme.colors.text, fontSize: '16px', fontFamily: theme.typography.fontDisplay, letterSpacing: '2px', textTransform: 'uppercase' }}>
          No Memories Yet
        </div>
        <div style={{ color: theme.colors.textMuted, fontSize: '12px', textAlign: 'center', maxWidth: '300px' }}>
          Start capturing your life story by adding your first memory snapshot.
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: theme.typography.fontBody }}>
      {/* Timeline track */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          overflowX: 'auto',
          paddingBottom: '24px',
          paddingTop: '16px',
          alignItems: 'flex-start',
          // Subtle scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.colors.border} transparent`,
        }}
      >
        {/* Timeline line (decorative) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '140px',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.colors.border}, transparent)`,
            pointerEvents: 'none',
          }}
        />

        {sorted.map((snapshot, idx) => (
          <TimelineCard
            key={snapshot.id}
            snapshot={snapshot}
            characters={characters}
            index={idx}
            theme={theme}
            onEdit={() => onEdit(snapshot)}
            onDelete={() => onDelete(snapshot.id)}
            onSelect={() => onSelect && onSelect(snapshot)}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineCard({ snapshot, characters, index, theme, onEdit, onDelete, onSelect }) {
  const template = TEMPLATES[snapshot.template] || TEMPLATES.milestone;
  const mood = MOODS[snapshot.mood] || MOODS.nostalgic;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        flexShrink: 0,
        width: '220px',
      }}
    >
      {/* Sequence number */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: template.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>
        <div
          style={{
            fontSize: '10px',
            color: theme.colors.textSubtle,
            letterSpacing: '1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {snapshot.when || 'No date'}
        </div>
      </div>

      {/* Panel preview */}
      <SnapshotPanel
        snapshot={snapshot}
        characters={characters}
        onClick={onSelect}
        width={220}
        height={290}
      />

      {/* Mood badge + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            letterSpacing: '1px',
            color: theme.colors.textSubtle,
            textTransform: 'uppercase',
          }}
        >
          {mood.label}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <CardAction onClick={onEdit} theme={theme}>
            Edit
          </CardAction>
          <CardAction onClick={onDelete} theme={theme} danger>
            Del
          </CardAction>
        </div>
      </div>
    </div>
  );
}

function CardAction({ onClick, children, theme, danger = false }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        background: 'none',
        border: `1px solid ${danger ? theme.colors.accent : theme.colors.border}`,
        borderRadius: '3px',
        color: danger ? theme.colors.accent : theme.colors.textMuted,
        padding: '2px 8px',
        fontSize: '9px',
        cursor: 'pointer',
        fontFamily: theme.typography.fontBody,
        letterSpacing: '1px',
      }}
    >
      {children}
    </button>
  );
}

export default TimelineView;
