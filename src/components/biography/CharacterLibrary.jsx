import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { CHARACTER_COLORS, RELATIONSHIP_SUGGESTIONS, createCharacter } from './biographySchema';

/**
 * CharacterLibrary - Add / edit / delete recurring characters.
 *
 * Characters: { id, name, relationship, color }
 * Counts appearances across all provided snapshots.
 */
export function CharacterLibrary({ characters, snapshots = [], onAdd, onUpdate, onDelete }) {
  const { theme } = useTheme();
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(null);

  function appearanceCount(charId) {
    return snapshots.filter((s) => s.characterIds && s.characterIds.includes(charId)).length;
  }

  function startAdd() {
    const newChar = createCharacter();
    setForm({ ...newChar });
    setEditingId('__new__');
  }

  function startEdit(char) {
    setForm({ ...char });
    setEditingId(char.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(null);
  }

  function handleSave() {
    if (!form.name.trim()) return;
    if (editingId === '__new__') {
      onAdd({ ...form, id: Date.now().toString() });
    } else {
      onUpdate(form);
    }
    cancelEdit();
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.text,
    padding: '7px 10px',
    fontSize: '12px',
    fontFamily: theme.typography.fontBody,
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        fontFamily: theme.typography.fontBody,
        color: theme.colors.text,
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '13px', letterSpacing: '2px', color: theme.colors.textMuted }}>
          CHARACTERS
        </h3>
        <button
          onClick={startAdd}
          style={{
            background: theme.colors.primary,
            border: 'none',
            borderRadius: '4px',
            color: '#000',
            padding: '6px 14px',
            fontSize: '11px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: theme.typography.fontBody,
          }}
        >
          + Add
        </button>
      </div>

      {/* Add/Edit form */}
      {editingId && form && (
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            padding: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Name */}
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name *"
              autoFocus
            />
            {/* Relationship */}
            <input
              style={inputStyle}
              list="relationship-suggestions"
              value={form.relationship}
              onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
              placeholder="Relationship (e.g. Mother, Friend)"
            />
            <datalist id="relationship-suggestions">
              {RELATIONSHIP_SUGGESTIONS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
            {/* Colour picker */}
            <div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '6px', letterSpacing: '1px' }}>
                COLOUR
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CHARACTER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: c,
                      border: form.color === c ? '3px solid #fff' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  />
                ))}
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelEdit}
                style={{
                  background: 'none',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '4px',
                  color: theme.colors.textMuted,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: theme.typography.fontBody,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim()}
                style={{
                  background: theme.colors.primary,
                  border: 'none',
                  borderRadius: '4px',
                  color: '#000',
                  padding: '6px 14px',
                  cursor: form.name.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  fontFamily: theme.typography.fontBody,
                  opacity: form.name.trim() ? 1 : 0.5,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character list */}
      {characters.length === 0 && !editingId ? (
        <p style={{ color: theme.colors.textSubtle, fontSize: '11px', fontStyle: 'italic' }}>
          No characters yet. Add people who recur across your memories.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {characters.map((char) => {
            const count = appearanceCount(char.id);
            return (
              <div
                key={char.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '6px',
                  padding: '10px 14px',
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: char.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {char.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: theme.colors.text, fontWeight: 'bold' }}>
                    {char.name}
                  </div>
                  <div style={{ fontSize: '10px', color: theme.colors.textMuted }}>
                    {char.relationship || 'No relationship set'}
                    {count > 0 && (
                      <span style={{ marginLeft: '8px', color: theme.colors.primary }}>
                        {count} {count === 1 ? 'memory' : 'memories'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => startEdit(char)}
                    style={{
                      background: 'none',
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: '4px',
                      color: theme.colors.textMuted,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontFamily: theme.typography.fontBody,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(char.id)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(233,69,96,0.3)',
                      borderRadius: '4px',
                      color: '#e94560',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontFamily: theme.typography.fontBody,
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CharacterLibrary;
