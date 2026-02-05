import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { MoodPresets } from './biographySchema';

/**
 * TimelineView - Chronological display of biography snapshots
 *
 * Features:
 * - Horizontal or vertical timeline layout
 * - Snapshot preview cards
 * - Filtering and sorting
 * - Visual flow of life narrative
 */
export function TimelineView({ snapshots, onSelectSnapshot, onEditSnapshot, onDeleteSnapshot, layout = 'horizontal' }) {
  const { theme } = useTheme();

  const sortedSnapshots = [...snapshots].sort((a, b) => a.order - b.order);

  if (sortedSnapshots.length === 0) {
    return (
      <div
        style={{
          padding: '64px 32px',
          textAlign: 'center',
          color: theme.colors.textMuted,
          fontSize: '16px',
          fontFamily: theme.typography.fontBody,
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📖</div>
        <div>Your timeline is empty. Start capturing memories to build your story.</div>
      </div>
    );
  }

  if (layout === 'horizontal') {
    return (
      <div
        style={{
          display: 'flex',
          gap: '32px',
          padding: '32px',
          overflowX: 'auto',
          position: 'relative',
        }}
      >
        {/* Timeline line */}
        <div
          style={{
            position: 'absolute',
            top: '120px',
            left: '32px',
            right: '32px',
            height: '2px',
            background: `linear-gradient(90deg, ${theme.colors.primary}00, ${theme.colors.primary}, ${theme.colors.primary}00)`,
            zIndex: 0,
          }}
        />

        {sortedSnapshots.map((snapshot, index) => (
          <TimelineCard
            key={snapshot.id}
            snapshot={snapshot}
            index={index}
            onSelect={onSelectSnapshot}
            onEdit={onEditSnapshot}
            onDelete={onDeleteSnapshot}
            theme={theme}
          />
        ))}
      </div>
    );
  }

  // Vertical layout
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        padding: '32px',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      {sortedSnapshots.map((snapshot, index) => (
        <TimelineCard
          key={snapshot.id}
          snapshot={snapshot}
          index={index}
          onSelect={onSelectSnapshot}
          onEdit={onEditSnapshot}
          onDelete={onDeleteSnapshot}
          theme={theme}
          vertical
        />
      ))}
    </div>
  );
}

/**
 * TimelineCard - Individual snapshot preview card
 */
function TimelineCard({ snapshot, index, onSelect, onEdit, onDelete, theme, vertical = false }) {
  const mood = MoodPresets[snapshot.mood] || MoodPresets.NOSTALGIC;

  const cardStyle = vertical
    ? {
        display: 'flex',
        gap: '20px',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }
    : {
        minWidth: '280px',
        maxWidth: '280px',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        position: 'relative',
        zIndex: 1,
      };

  return (
    <div
      onClick={() => onSelect(snapshot)}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${theme.colors.shadow}`;
        e.currentTarget.style.borderColor = theme.colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = theme.colors.border;
      }}
    >
      {/* Order badge */}
      <div
        style={{
          position: 'absolute',
          top: '-12px',
          left: '20px',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          background: theme.colors.primary,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
        }}
      >
        {index + 1}
      </div>

      {/* Mood indicator */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          fontSize: '10px',
          padding: '4px 8px',
          background: `${theme.colors.primary}30`,
          borderRadius: '4px',
          color: theme.colors.text,
          letterSpacing: '0.5px',
        }}
      >
        {mood.name}
      </div>

      <div style={{ marginTop: '16px' }}>
        {/* Title */}
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: '8px',
            fontFamily: theme.typography.fontDisplay,
            letterSpacing: '1px',
          }}
        >
          {snapshot.title || 'Untitled Memory'}
        </h3>

        {/* When/Where */}
        {(snapshot.when || snapshot.where) && (
          <div
            style={{
              fontSize: '11px',
              color: theme.colors.textMuted,
              marginBottom: '12px',
            }}
          >
            {snapshot.when && <span>{snapshot.when}</span>}
            {snapshot.when && snapshot.where && <span> • </span>}
            {snapshot.where && <span>{snapshot.where}</span>}
          </div>
        )}

        {/* What */}
        {snapshot.what && (
          <div
            style={{
              fontSize: '12px',
              color: theme.colors.textSubtle,
              lineHeight: '1.5',
              marginBottom: '12px',
            }}
          >
            {snapshot.what.substring(0, 100)}
            {snapshot.what.length > 100 ? '...' : ''}
          </div>
        )}

        {/* Feeling badge */}
        {snapshot.feeling && (
          <div
            style={{
              display: 'inline-block',
              fontSize: '11px',
              padding: '4px 10px',
              background: `${theme.colors.secondary}20`,
              borderRadius: '12px',
              color: theme.colors.secondary,
              fontStyle: 'italic',
              marginBottom: '12px',
            }}
          >
            {snapshot.feeling}
          </div>
        )}

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: `1px solid ${theme.colors.border}`,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(snapshot);
            }}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              padding: '6px',
              color: theme.colors.text,
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: theme.typography.fontBody,
            }}
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this memory?')) {
                onDelete(snapshot.id);
              }
            }}
            style={{
              flex: 1,
              background: 'rgba(255,0,0,0.1)',
              border: `1px solid rgba(255,0,0,0.3)`,
              borderRadius: '4px',
              padding: '6px',
              color: '#ff6b6b',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: theme.typography.fontBody,
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimelineView;
