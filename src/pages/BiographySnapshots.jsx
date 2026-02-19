import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { MemoryInputWizard } from '../components/biography/MemoryInputWizard';
import { CharacterLibrary } from '../components/biography/CharacterLibrary';
import { TimelineView } from '../components/biography/TimelineView';
import { MOODS } from '../components/biography/biographySchema';

const TABS = ['Timeline', 'New Memory', 'Characters'];

const STORAGE_KEYS = {
  snapshots: 'biography-snapshots',
  characters: 'biography-characters',
};

/**
 * BiographySnapshots - Main page for the biographical storytelling feature.
 *
 * Manages all state (snapshots + characters) and persists to localStorage.
 * Switches the global theme to match the most recently viewed snapshot's mood.
 *
 * Navigation: Tab bar with Timeline | New Memory | Characters
 */
export function BiographySnapshots() {
  const { theme, setTheme } = useTheme();

  // ---------------------------------------------------------------------------
  // Persisted state
  // ---------------------------------------------------------------------------

  const [snapshots, setSnapshots] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.snapshots);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [characters, setCharacters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.characters);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.snapshots, JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.characters, JSON.stringify(characters));
  }, [characters]);

  // ---------------------------------------------------------------------------
  // UI state
  // ---------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState(0); // 0=Timeline, 1=New Memory, 2=Characters
  const [editingSnapshot, setEditingSnapshot] = useState(null); // null | snapshot

  // ---------------------------------------------------------------------------
  // Snapshot CRUD
  // ---------------------------------------------------------------------------

  function handleSaveSnapshot(snapshot) {
    setSnapshots((prev) => {
      const exists = prev.some((s) => s.id === snapshot.id);
      return exists
        ? prev.map((s) => (s.id === snapshot.id ? snapshot : s))
        : [...prev, snapshot];
    });
    // Switch theme to match mood
    const mood = MOODS[snapshot.mood];
    if (mood) setTheme(mood.theme);
    setEditingSnapshot(null);
    setActiveTab(0); // return to timeline after save
  }

  function handleDeleteSnapshot(id) {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }

  function handleSelectSnapshot(snapshot) {
    // Switch theme to the mood of the selected snapshot
    const mood = MOODS[snapshot.mood];
    if (mood) setTheme(mood.theme);
  }

  // ---------------------------------------------------------------------------
  // Character CRUD
  // ---------------------------------------------------------------------------

  function handleAddCharacter(character) {
    setCharacters((prev) => [...prev, character]);
  }

  function handleUpdateCharacter(updated) {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleDeleteCharacter(id) {
    // Also remove from snapshot tags
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    setSnapshots((prev) =>
      prev.map((s) => ({
        ...s,
        characterIds: s.characterIds.filter((cid) => cid !== id),
      }))
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.backgroundGradient,
        fontFamily: theme.typography.fontBody,
        color: theme.colors.text,
      }}
    >
      {/* Page header */}
      <div
        style={{
          padding: '40px 40px 0',
        }}
      >
        <div
          style={{
            color: theme.colors.primary,
            fontSize: '10px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Issue #2
        </div>
        <h1
          style={{
            margin: '0 0 4px',
            fontFamily: theme.typography.fontDisplay,
            fontSize: '36px',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            color: theme.colors.text,
          }}
        >
          Biography Snapshots
        </h1>
        <p style={{ margin: '0 0 24px', color: theme.colors.textMuted, fontSize: '12px' }}>
          Visual memory scenes for your life story
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <Stat label="Memories" value={snapshots.length} theme={theme} />
          <Stat label="Characters" value={characters.length} theme={theme} />
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            gap: '0',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'New Memory') {
                  setEditingSnapshot('new');
                } else {
                  setActiveTab(i === 1 ? 0 : i); // 'New Memory' opens wizard
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === i && i !== 1
                  ? `2px solid ${theme.colors.primary}`
                  : '2px solid transparent',
                color: activeTab === i && i !== 1 ? theme.colors.text : theme.colors.textMuted,
                padding: '10px 20px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: theme.typography.fontBody,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                marginBottom: '-1px',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: '24px 40px 80px' }}>
        {activeTab === 0 && (
          <TimelineView
            snapshots={snapshots}
            characters={characters}
            onEdit={(snapshot) => setEditingSnapshot(snapshot)}
            onDelete={handleDeleteSnapshot}
            onSelect={handleSelectSnapshot}
          />
        )}
        {activeTab === 2 && (
          <CharacterLibrary
            characters={characters}
            snapshots={snapshots}
            onAdd={handleAddCharacter}
            onUpdate={handleUpdateCharacter}
            onDelete={handleDeleteCharacter}
          />
        )}
      </div>

      {/* Memory wizard (modal overlay) */}
      {editingSnapshot !== null && (
        <MemoryInputWizard
          characters={characters}
          initial={editingSnapshot === 'new' ? null : editingSnapshot}
          onSave={handleSaveSnapshot}
          onCancel={() => setEditingSnapshot(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, theme }) {
  return (
    <div>
      <div
        style={{
          fontSize: '24px',
          fontFamily: theme.typography.fontDisplay,
          color: theme.colors.primary,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '10px', color: theme.colors.textMuted, letterSpacing: '1px', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

export default BiographySnapshots;
