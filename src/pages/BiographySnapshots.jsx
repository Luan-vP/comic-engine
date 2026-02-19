import React, { useState, useEffect } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { MemoryInputWizard } from '../components/biography/MemoryInputWizard';
import { CharacterLibrary } from '../components/biography/CharacterLibrary';
import { TimelineView } from '../components/biography/TimelineView';
import { SnapshotPanel } from '../components/biography/SnapshotPanel';
import { createSnapshot, MOODS } from '../components/biography/biographySchema';

const TABS = ['Timeline', 'New Memory', 'Characters'];

/**
 * BiographySnapshots - Main page for capturing life memories as comic panels.
 *
 * Persists snapshots and characters to localStorage.
 * Auto-switches the global theme to match the selected snapshot's mood.
 */
export function BiographySnapshots() {
  const { theme, setTheme } = useTheme();

  const [snapshots, setSnapshots] = useState(() => {
    const saved = localStorage.getItem('biography-memories');
    return saved ? JSON.parse(saved) : [];
  });

  const [characters, setCharacters] = useState(() => {
    const saved = localStorage.getItem('biography-characters');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState('Timeline');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Persist snapshots
  useEffect(() => {
    localStorage.setItem('biography-memories', JSON.stringify(snapshots));
  }, [snapshots]);

  // Persist characters
  useEffect(() => {
    localStorage.setItem('biography-characters', JSON.stringify(characters));
  }, [characters]);

  // Switch theme to match selected snapshot's mood
  useEffect(() => {
    if (selectedSnapshot) {
      const mood = MOODS[selectedSnapshot.moodId];
      if (mood) setTheme(mood.theme);
    }
  }, [selectedSnapshot, setTheme]);

  // ─── Snapshot handlers ────────────────────────────────────────────────────

  function handleSaveSnapshot(draft) {
    if (draft.id && snapshots.some((s) => s.id === draft.id)) {
      setSnapshots((prev) => prev.map((s) => (s.id === draft.id ? { ...s, ...draft } : s)));
    } else {
      const newSnap = createSnapshot(draft);
      setSnapshots((prev) => [...prev, newSnap]);
      setSelectedSnapshot(newSnap);
    }
    setWizardOpen(false);
    setEditingSnapshot(null);
    setActiveTab('Timeline');
  }

  function handleDeleteSnapshot(id) {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    if (selectedSnapshot?.id === id) setSelectedSnapshot(null);
  }

  function handleEditSnapshot(snapshot) {
    setEditingSnapshot(snapshot);
    setWizardOpen(true);
  }

  // ─── Character handlers ───────────────────────────────────────────────────

  function handleAddCharacter(char) {
    setCharacters((prev) => [...prev, char]);
  }

  function handleUpdateCharacter(updated) {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }

  function handleDeleteCharacter(id) {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    // Also remove from snapshot tags
    setSnapshots((prev) =>
      prev.map((s) => ({
        ...s,
        characterIds: s.characterIds ? s.characterIds.filter((cid) => cid !== id) : [],
      })),
    );
  }

  // ─── Selected snapshot characters ────────────────────────────────────────

  const selectedChars = selectedSnapshot
    ? characters.filter(
        (c) =>
          selectedSnapshot.characterIds && selectedSnapshot.characterIds.includes(c.id),
      )
    : [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: theme.colors.backgroundGradient || theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.typography.fontBody,
      }}
    >
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '40px 40px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              fontFamily: theme.typography.fontDisplay,
              fontSize: '32px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: theme.colors.primary,
            }}
          >
            Biography
          </h1>
          <p style={{ margin: 0, color: theme.colors.textMuted, fontSize: '11px', letterSpacing: '1px' }}>
            Visual snapshots of life memories
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: theme.colors.primary, fontWeight: 'bold' }}>
              {snapshots.length}
            </div>
            <div style={{ fontSize: '9px', color: theme.colors.textMuted, letterSpacing: '1px' }}>
              MEMORIES
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', color: theme.colors.secondary, fontWeight: 'bold' }}>
              {characters.length}
            </div>
            <div style={{ fontSize: '9px', color: theme.colors.textMuted, letterSpacing: '1px' }}>
              CHARACTERS
            </div>
          </div>
        </div>
      </div>

      {/* ─── Tab navigation ──────────────────────────────────────────────── */}
      <div
        style={{
          padding: '24px 40px 0',
          display: 'flex',
          gap: '4px',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        {TABS.map((tab) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab === 'New Memory') {
                  setEditingSnapshot(null);
                  setWizardOpen(true);
                }
              }}
              style={{
                background: active ? theme.colors.primary + '20' : 'none',
                border: 'none',
                borderBottom: active ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
                color: active ? theme.colors.primary : theme.colors.textMuted,
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '11px',
                letterSpacing: '1px',
                fontFamily: theme.typography.fontBody,
                fontWeight: active ? 'bold' : 'normal',
                transition: 'color 0.2s',
              }}
            >
              {tab.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '32px 40px' }}>

        {/* Timeline tab */}
        {activeTab === 'Timeline' && (
          <div>
            <TimelineView
              snapshots={snapshots}
              characters={characters}
              selectedId={selectedSnapshot?.id}
              onSelect={setSelectedSnapshot}
              onEdit={handleEditSnapshot}
              onDelete={handleDeleteSnapshot}
            />

            {/* Selected snapshot detail */}
            {selectedSnapshot && (
              <div
                style={{
                  marginTop: '40px',
                  display: 'flex',
                  gap: '32px',
                  alignItems: 'flex-start',
                }}
              >
                <SnapshotPanel
                  snapshot={selectedSnapshot}
                  characters={selectedChars}
                />

                <div style={{ flex: 1, maxWidth: '360px' }}>
                  <h2
                    style={{
                      margin: '0 0 8px 0',
                      fontFamily: theme.typography.fontDisplay,
                      fontSize: '22px',
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      color: theme.colors.text,
                    }}
                  >
                    {selectedSnapshot.title}
                  </h2>

                  {selectedSnapshot.when && (
                    <div style={{ color: theme.colors.textMuted, fontSize: '11px', marginBottom: '4px' }}>
                      {selectedSnapshot.when}
                      {selectedSnapshot.where && ` · ${selectedSnapshot.where}`}
                    </div>
                  )}

                  {selectedSnapshot.feeling && (
                    <div
                      style={{
                        display: 'inline-block',
                        background: theme.colors.primary + '20',
                        border: `1px solid ${theme.colors.primary}40`,
                        borderRadius: '4px',
                        padding: '2px 8px',
                        fontSize: '10px',
                        color: theme.colors.primary,
                        marginBottom: '12px',
                      }}
                    >
                      {selectedSnapshot.feeling}
                    </div>
                  )}

                  {selectedSnapshot.what && (
                    <p
                      style={{
                        color: theme.colors.textMuted,
                        fontSize: '13px',
                        lineHeight: 1.6,
                        fontFamily: theme.typography.fontNarrative,
                        margin: '0 0 16px 0',
                      }}
                    >
                      {selectedSnapshot.what}
                    </p>
                  )}

                  {selectedChars.length > 0 && (
                    <div>
                      <div style={{ fontSize: '9px', letterSpacing: '1px', color: theme.colors.textSubtle, marginBottom: '8px' }}>
                        PEOPLE
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {selectedChars.map((char) => (
                          <div
                            key={char.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: char.color + '20',
                              border: `1px solid ${char.color}40`,
                              borderRadius: '20px',
                              padding: '4px 10px 4px 4px',
                            }}
                          >
                            <div
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: char.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                color: '#fff',
                              }}
                            >
                              {char.name.charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontSize: '11px', color: theme.colors.text }}>
                              {char.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Characters tab */}
        {activeTab === 'Characters' && (
          <div style={{ maxWidth: '540px' }}>
            <CharacterLibrary
              characters={characters}
              snapshots={snapshots}
              onAdd={handleAddCharacter}
              onUpdate={handleUpdateCharacter}
              onDelete={handleDeleteCharacter}
            />
          </div>
        )}
      </div>

      {/* ─── Memory Input Wizard ─────────────────────────────────────────── */}
      {wizardOpen && (
        <MemoryInputWizard
          initialSnapshot={editingSnapshot || undefined}
          characters={characters}
          onSave={handleSaveSnapshot}
          onCancel={() => {
            setWizardOpen(false);
            setEditingSnapshot(null);
            setActiveTab('Timeline');
          }}
        />
      )}
    </div>
  );
}

export default BiographySnapshots;
