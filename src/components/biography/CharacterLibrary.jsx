import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { createCharacter, RELATIONSHIP_SUGGESTIONS, CHARACTER_COLORS } from './biographySchema';

/**
 * CharacterLibrary - Add, edit, and delete recurring characters.
 *
 * Characters are plain objects: { id, name, relationship, color }.
 * No avatar upload in v1 — a coloured initial dot is used instead.
 *
 * Props:
 *  - characters: Character[]
 *  - snapshots: snapshot[] — used to count appearances
 *  - onAdd(character): called with a new character
 *  - onUpdate(character): called with an updated character
 *  - onDelete(id): called with the id to remove
 */
export function CharacterLibrary({ characters, snapshots = [], onAdd, onUpdate, onDelete }) {
  const { theme } = useTheme();
  const [editing, setEditing] = useState(null); // null | 'new' | character object

  function appearanceCount(id) {
    return snapshots.filter((s) => s.characterIds.includes(id)).length;
  }

  function handleSave(fields) {
    if (editing === 'new') {
      onAdd(createCharacter(fields));
    } else {
      onUpdate({ ...editing, ...fields });
    }
    setEditing(null);
  }

  return (
    <div style={{ fontFamily: theme.typography.fontBody }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <div style={{ color: theme.colors.textMuted, fontSize: '10px', letterSpacing: '2px' }}>
          {characters.length} CHARACTER{characters.length !== 1 ? 'S' : ''}
        </div>
        <button
          onClick={() => setEditing('new')}
          style={{
            background: theme.colors.primary,
            border: 'none',
            borderRadius: '4px',
            color: '#000',
            padding: '6px 14px',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: theme.typography.fontBody,
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
        >
          + Add Character
        </button>
      </div>

      {/* Character list */}
      {characters.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: theme.colors.textSubtle,
            fontSize: '12px',
            border: `1px dashed ${theme.colors.border}`,
            borderRadius: '6px',
          }}
        >
          No characters yet. Add people who appear in your memories.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {characters.map((c) => (
          <CharacterRow
            key={c.id}
            character={c}
            appearances={appearanceCount(c.id)}
            theme={theme}
            onEdit={() => setEditing(c)}
            onDelete={() => onDelete(c.id)}
          />
        ))}
      </div>

      {/* Inline form overlay */}
      {editing !== null && (
        <CharacterForm
          initial={editing === 'new' ? null : editing}
          theme={theme}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function CharacterRow({ character, appearances, theme, onEdit, onDelete }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '6px',
        padding: '10px 14px',
      }}
    >
      {/* Avatar dot */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: character.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {character.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ color: theme.colors.text, fontSize: '13px' }}>{character.name}</div>
        <div style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          {character.relationship || 'No relationship set'}
          {appearances > 0 && (
            <span style={{ marginLeft: '8px', color: theme.colors.textSubtle }}>
              {appearances} {appearances === 1 ? 'memory' : 'memories'}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <ActionButton onClick={onEdit} theme={theme}>
          Edit
        </ActionButton>
        <ActionButton onClick={onDelete} theme={theme} danger>
          Delete
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({ onClick, children, theme, danger = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: `1px solid ${danger ? theme.colors.accent : theme.colors.border}`,
        borderRadius: '4px',
        color: danger ? theme.colors.accent : theme.colors.textMuted,
        padding: '4px 10px',
        fontSize: '10px',
        cursor: 'pointer',
        fontFamily: theme.typography.fontBody,
        letterSpacing: '1px',
      }}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CharacterForm — inline form rendered as a fixed overlay
// ---------------------------------------------------------------------------

function CharacterForm({ initial, theme, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [relationship, setRelationship] = useState(initial?.relationship || '');
  const [color, setColor] = useState(initial?.color || CHARACTER_COLORS[0]);

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.text,
    padding: '8px 10px',
    fontSize: '12px',
    fontFamily: theme.typography.fontBody,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const labelStyle = {
    color: theme.colors.textMuted,
    fontSize: '10px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    marginBottom: '4px',
    display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 21000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: theme.typography.fontBody,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        style={{
          background: theme.colors.background,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          width: '380px',
          maxWidth: '95vw',
          boxShadow: `0 20px 60px ${theme.colors.shadow}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              margin: 0,
              color: theme.colors.text,
              fontSize: '14px',
              fontFamily: theme.typography.fontDisplay,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {initial ? 'Edit Character' : 'New Character'}
          </h3>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.textMuted,
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            &times;
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Preview + name */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '18px',
                fontWeight: 'bold',
                flexShrink: 0,
              }}
            >
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Name *</label>
              <input
                style={inputStyle}
                placeholder="Character name…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label style={labelStyle}>Relationship</label>
            <input
              style={inputStyle}
              placeholder="Friend, Teacher, Parent…"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              list="relationship-suggestions"
            />
            <datalist id="relationship-suggestions">
              {RELATIONSHIP_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </div>

          {/* Colour picker */}
          <div>
            <label style={labelStyle}>Colour</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CHARACTER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                    outline: color === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              color: theme.colors.text,
              padding: '7px 16px',
              fontSize: '11px',
              cursor: 'pointer',
              fontFamily: theme.typography.fontBody,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => name.trim() && onSave({ name: name.trim(), relationship, color })}
            disabled={!name.trim()}
            style={{
              background: name.trim() ? theme.colors.primary : theme.colors.border,
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              padding: '7px 20px',
              fontSize: '11px',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              fontFamily: theme.typography.fontBody,
              fontWeight: 'bold',
            }}
          >
            {initial ? 'Update' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CharacterLibrary;
