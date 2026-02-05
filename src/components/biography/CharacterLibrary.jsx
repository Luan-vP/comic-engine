import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { Character } from './biographySchema';

/**
 * CharacterLibrary - Manage recurring characters in life story
 *
 * Features:
 * - Add new characters
 * - Edit existing characters
 * - View character appearances across snapshots
 * - Visual consistency tracking
 */
export function CharacterLibrary({ characters, onAddCharacter, onEditCharacter, onDeleteCharacter, snapshots = [] }) {
  const { theme } = useTheme();
  const [isAdding, setIsAdding] = useState(false);
  const [editingChar, setEditingChar] = useState(null);

  const handleSave = (charData) => {
    if (editingChar) {
      onEditCharacter({ ...editingChar, ...charData });
      setEditingChar(null);
    } else {
      const newChar = new Character(charData);
      onAddCharacter(newChar);
      setIsAdding(false);
    }
  };

  const getCharacterAppearanceCount = (charId) => {
    return snapshots.filter((s) => s.characters && s.characters.includes(charId)).length;
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '800px',
        background: `linear-gradient(135deg, ${theme.colors.background}ee 0%, rgba(0,0,0,0.95) 100%)`,
        border: `2px solid ${theme.colors.primary}`,
        borderRadius: '12px',
        padding: '32px',
        boxShadow: `0 0 60px ${theme.colors.shadow}`,
        fontFamily: theme.typography.fontBody,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: theme.colors.text,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontFamily: theme.typography.fontDisplay,
            margin: 0,
          }}
        >
          Character Library
        </h2>
        {!isAdding && !editingChar && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              background: theme.colors.primary,
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              color: '#fff',
              fontFamily: theme.typography.fontBody,
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 'bold',
              letterSpacing: '1px',
            }}
          >
            + Add Character
          </button>
        )}
      </div>

      {(isAdding || editingChar) && (
        <CharacterForm
          character={editingChar}
          onSave={handleSave}
          onCancel={() => {
            setIsAdding(false);
            setEditingChar(null);
          }}
          theme={theme}
        />
      )}

      {!isAdding && !editingChar && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {characters.length === 0 ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '48px',
                textAlign: 'center',
                color: theme.colors.textMuted,
                fontSize: '14px',
              }}
            >
              No characters yet. Add the important people in your life story to track them across memories.
            </div>
          ) : (
            characters.map((char) => (
              <div
                key={char.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
                onClick={() => setEditingChar(char)}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: char.avatarColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginBottom: '16px',
                  }}
                >
                  {char.name.charAt(0).toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: theme.colors.text,
                    marginBottom: '4px',
                  }}
                >
                  {char.name}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: theme.colors.textMuted,
                    marginBottom: '12px',
                  }}
                >
                  {char.relationship}
                </div>
                {char.description && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: theme.colors.textSubtle,
                      lineHeight: '1.4',
                      marginBottom: '12px',
                    }}
                  >
                    {char.description.substring(0, 60)}
                    {char.description.length > 60 ? '...' : ''}
                  </div>
                )}
                <div
                  style={{
                    fontSize: '11px',
                    color: theme.colors.primary,
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${theme.colors.border}`,
                  }}
                >
                  {getCharacterAppearanceCount(char.id)} memories
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * CharacterForm - Add/Edit character details
 */
function CharacterForm({ character, onSave, onCancel, theme }) {
  const [formData, setFormData] = useState(
    character || {
      name: '',
      relationship: '',
      description: '',
      avatarColor: '#a855f7',
    }
  );

  const colors = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6'];

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '6px',
    padding: '12px',
    color: theme.colors.text,
    fontFamily: theme.typography.fontBody,
    fontSize: '14px',
    marginBottom: '16px',
  };

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
      }}
    >
      <h3
        style={{
          fontSize: '16px',
          color: theme.colors.primary,
          marginBottom: '20px',
          fontWeight: 'bold',
          letterSpacing: '1px',
        }}
      >
        {character ? 'Edit Character' : 'New Character'}
      </h3>

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
        Name *
      </label>
      <input
        type="text"
        placeholder="Character name..."
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        style={inputStyle}
      />

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
        Relationship
      </label>
      <input
        type="text"
        placeholder="Mother, Best Friend, Teacher, etc..."
        value={formData.relationship}
        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
        style={inputStyle}
      />

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '6px' }}>
        Description
      </label>
      <textarea
        placeholder="Physical appearance, personality traits, significance..."
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
      />

      <label style={{ display: 'block', color: theme.colors.textMuted, fontSize: '12px', marginBottom: '12px' }}>
        Avatar Color
      </label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {colors.map((color) => (
          <div
            key={color}
            onClick={() => setFormData({ ...formData, avatarColor: color })}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: color,
              cursor: 'pointer',
              border: formData.avatarColor === color ? `3px solid ${theme.colors.text}` : '3px solid transparent',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            color: theme.colors.text,
            fontFamily: theme.typography.fontBody,
            fontSize: '13px',
            cursor: 'pointer',
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(formData)}
          disabled={!formData.name}
          style={{
            background: formData.name ? theme.colors.primary : theme.colors.border,
            border: 'none',
            borderRadius: '6px',
            padding: '10px 20px',
            color: '#fff',
            fontFamily: theme.typography.fontBody,
            fontSize: '13px',
            cursor: formData.name ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
        >
          {character ? 'Update' : 'Add Character'}
        </button>
      </div>
    </div>
  );
}

export default CharacterLibrary;
