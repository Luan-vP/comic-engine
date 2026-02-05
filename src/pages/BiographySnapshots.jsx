import React, { useState, useEffect } from 'react';
import { Scene } from '../components/scene/Scene';
import { useTheme } from '../theme/ThemeContext';
import { MemoryInputWizard } from '../components/biography/MemoryInputWizard';
import { CharacterLibrary } from '../components/biography/CharacterLibrary';
import { TimelineView } from '../components/biography/TimelineView';
import { SnapshotPanel } from '../components/biography/SnapshotPanel';
import { MoodPresets } from '../components/biography/biographySchema';

/**
 * BiographySnapshots - Main page for biographical storytelling
 *
 * Features:
 * - Create and manage memory snapshots
 * - Timeline view of life story
 * - Character library management
 * - 3D scene view of selected snapshot
 * - Local storage persistence
 */
export function BiographySnapshots() {
  const { theme, setTheme } = useTheme();

  // State management
  const [view, setView] = useState('timeline'); // 'timeline' | 'scene' | 'wizard' | 'characters'
  const [snapshots, setSnapshots] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [editingSnapshot, setEditingSnapshot] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedSnapshots = localStorage.getItem('biographySnapshots');
      const savedCharacters = localStorage.getItem('biographyCharacters');
      if (savedSnapshots) setSnapshots(JSON.parse(savedSnapshots));
      if (savedCharacters) setCharacters(JSON.parse(savedCharacters));
    } catch (error) {
      console.error('Failed to load data from localStorage', error);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('biographySnapshots', JSON.stringify(snapshots));
    } catch (error) {
      console.error('Failed to save snapshots', error);
    }
  }, [snapshots]);

  useEffect(() => {
    try {
      localStorage.setItem('biographyCharacters', JSON.stringify(characters));
    } catch (error) {
      console.error('Failed to save characters', error);
    }
  }, [characters]);

  // Handlers
  const handleSaveSnapshot = (snapshot) => {
    if (editingSnapshot) {
      setSnapshots(snapshots.map((s) => (s.id === snapshot.id ? snapshot : s)));
      setEditingSnapshot(null);
    } else {
      const newSnapshot = { ...snapshot, order: snapshots.length };
      setSnapshots([...snapshots, newSnapshot]);
    }
    setView('timeline');

    // Apply mood theme
    const mood = MoodPresets[snapshot.mood];
    if (mood && mood.theme) {
      setTheme(mood.theme);
    }
  };

  const handleEditSnapshot = (snapshot) => {
    setEditingSnapshot(snapshot);
    setView('wizard');
  };

  const handleDeleteSnapshot = (snapshotId) => {
    setSnapshots(snapshots.filter((s) => s.id !== snapshotId));
    if (selectedSnapshot?.id === snapshotId) {
      setSelectedSnapshot(null);
    }
  };

  const handleSelectSnapshot = (snapshot) => {
    setSelectedSnapshot(snapshot);
    setView('scene');

    // Apply mood theme
    const mood = MoodPresets[snapshot.mood];
    if (mood && mood.theme) {
      setTheme(mood.theme);
    }
  };

  const handleAddCharacter = (character) => {
    setCharacters([...characters, character]);
  };

  const handleEditCharacter = (updatedChar) => {
    setCharacters(characters.map((c) => (c.id === updatedChar.id ? updatedChar : c)));
  };

  const handleDeleteCharacter = (charId) => {
    setCharacters(characters.filter((c) => c.id !== charId));
  };

  // Navigation
  const navButtonStyle = (isActive) => ({
    background: isActive ? theme.colors.primary : 'rgba(255,255,255,0.1)',
    border: `1px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
    borderRadius: '6px',
    padding: '10px 20px',
    color: isActive ? '#fff' : theme.colors.text,
    fontFamily: theme.typography.fontBody,
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 'bold',
    letterSpacing: '1px',
    transition: 'all 0.2s ease',
  });

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative' }}>
      {/* Navigation Bar */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '12px',
          padding: '12px',
          zIndex: 10000,
        }}
      >
        <button onClick={() => setView('timeline')} style={navButtonStyle(view === 'timeline')}>
          Timeline
        </button>
        <button onClick={() => setView('wizard')} style={navButtonStyle(view === 'wizard')}>
          + New Memory
        </button>
        <button onClick={() => setView('characters')} style={navButtonStyle(view === 'characters')}>
          Characters
        </button>
        {selectedSnapshot && (
          <button onClick={() => setView('scene')} style={navButtonStyle(view === 'scene')}>
            View Scene
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '16px',
          zIndex: 10000,
          fontFamily: theme.typography.fontBody,
        }}
      >
        <div style={{ fontSize: '10px', color: theme.colors.textMuted, marginBottom: '8px', letterSpacing: '1px' }}>
          YOUR STORY
        </div>
        <div style={{ fontSize: '24px', color: theme.colors.primary, fontWeight: 'bold', marginBottom: '4px' }}>
          {snapshots.length}
        </div>
        <div style={{ fontSize: '11px', color: theme.colors.text }}>Memories</div>
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme.colors.border}` }}>
          <div style={{ fontSize: '18px', color: theme.colors.secondary, fontWeight: 'bold', marginBottom: '4px' }}>
            {characters.length}
          </div>
          <div style={{ fontSize: '11px', color: theme.colors.text }}>Characters</div>
        </div>
      </div>

      {/* View Content */}
      <div style={{ paddingTop: '100px', paddingBottom: '40px' }}>
        {view === 'timeline' && (
          <div style={{ width: '100%' }}>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '32px',
                fontFamily: theme.typography.fontDisplay,
              }}
            >
              <h1
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: theme.colors.text,
                  textTransform: 'uppercase',
                  letterSpacing: '4px',
                  margin: '0 0 12px 0',
                  textShadow: `0 0 40px ${theme.colors.shadow}`,
                }}
              >
                Your Life Story
              </h1>
              <p
                style={{
                  fontSize: '16px',
                  color: theme.colors.textMuted,
                  fontFamily: theme.typography.fontNarrative,
                  fontStyle: 'italic',
                }}
              >
                A timeline of moments that shaped who you are
              </p>
            </div>
            <TimelineView
              snapshots={snapshots}
              onSelectSnapshot={handleSelectSnapshot}
              onEditSnapshot={handleEditSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
            />
          </div>
        )}

        {view === 'wizard' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 'calc(100vh - 180px)',
            }}
          >
            <MemoryInputWizard
              existingSnapshot={editingSnapshot}
              characters={characters}
              onSave={handleSaveSnapshot}
              onCancel={() => {
                setEditingSnapshot(null);
                setView('timeline');
              }}
            />
          </div>
        )}

        {view === 'characters' && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              minHeight: 'calc(100vh - 180px)',
            }}
          >
            <CharacterLibrary
              characters={characters}
              snapshots={snapshots}
              onAddCharacter={handleAddCharacter}
              onEditCharacter={handleEditCharacter}
              onDeleteCharacter={handleDeleteCharacter}
            />
          </div>
        )}

        {view === 'scene' && selectedSnapshot && (
          <Scene perspective={1200} parallaxIntensity={0.8} mouseInfluence={{ x: 40, y: 25 }}>
            <SnapshotPanel
              snapshot={selectedSnapshot}
              characters={characters}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
            />

            {/* Additional decorative elements based on mood */}
            {selectedSnapshot.mood === 'NOSTALGIC' && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '600px',
                    height: '600px',
                    background: `radial-gradient(circle, ${theme.colors.primary}10, transparent)`,
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: -1,
                  }}
                />
              </>
            )}

            {/* Navigation hint */}
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: theme.colors.textMuted,
                fontSize: '12px',
                fontFamily: theme.typography.fontBody,
                textAlign: 'center',
              }}
            >
              Move your mouse to explore the scene
            </div>
          </Scene>
        )}
      </div>
    </div>
  );
}

export default BiographySnapshots;
