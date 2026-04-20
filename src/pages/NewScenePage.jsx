import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme/ThemeContext';
import { toSlug } from '../utils/slug';

function inputStyle(theme) {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.text,
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };
}

/**
 * NewScenePage - Wizard for creating a new scene page.
 *
 * Calls POST /_dev/scenes with the scene name, optional layer images, and
 * scene config. On success, navigates to /scenes/<slug> and calls onCreated()
 * so the PageNavigator can refresh its scene list.
 */
export function NewScenePage({ onCreated }) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [perspective, setPerspective] = useState(1000);
  const [parallaxIntensity, setParallaxIntensity] = useState(1);
  const [layerFiles, setLayerFiles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const slug = toSlug(name);
  const canCreate = name.trim().length > 0;

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve({ name: file.name, imageUrl: ev.target.result });
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    ).then(setLayerFiles);
  };

  const handleCreate = async () => {
    if (!canCreate || creating) return;
    setCreating(true);
    setError(null);

    try {
      // Backend requires at least one layer entry. For blank scenes we send a
      // placeholder layer with no imageUrl — the server skips writing the file
      // but still creates the scene directory and scene.json.
      const layers =
        layerFiles.length > 0
          ? layerFiles.map((f) => ({ name: f.name, imageUrl: f.imageUrl }))
          : [{ name: 'Background' }];

      const sceneConfig = {
        perspective,
        parallaxIntensity,
        mouseInfluence: { x: 50, y: 30 },
      };

      const res = await fetch('/_dev/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), layers, sceneConfig }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create scene');
      }

      const { routePath } = await res.json();
      if (onCreated) onCreated();
      navigate(routePath);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const labelStyle = {
    color: theme.colors.textMuted,
    fontSize: '11px',
    display: 'block',
    marginBottom: '6px',
    letterSpacing: '1px',
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.backgroundGradient,
        fontFamily: theme.typography.fontBody,
      }}
    >
      <div
        style={{
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '12px',
          padding: '32px',
          width: '440px',
          maxWidth: '90vw',
        }}
      >
        <h2
          style={{
            color: theme.colors.text,
            margin: '0 0 24px 0',
            fontSize: '13px',
            letterSpacing: '3px',
            fontFamily: theme.typography.fontDisplay,
          }}
        >
          NEW PAGE
        </h2>

        {/* Page name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>PAGE NAME</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="My Scene"
            autoFocus
            style={inputStyle(theme)}
          />
          {name.trim() && (
            <div style={{ color: theme.colors.textMuted, fontSize: '10px', marginTop: '4px' }}>
              /scenes/{slug}
            </div>
          )}
        </div>

        {/* Scene config */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>PERSPECTIVE</label>
            <input
              type="number"
              value={perspective}
              onChange={(e) => setPerspective(Number(e.target.value))}
              min={200}
              max={3000}
              step={100}
              style={inputStyle(theme)}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>PARALLAX INTENSITY</label>
            <input
              type="number"
              value={parallaxIntensity}
              onChange={(e) => setParallaxIntensity(Number(e.target.value))}
              min={0}
              max={5}
              step={0.1}
              style={inputStyle(theme)}
            />
          </div>
        </div>

        {/* Background layer upload */}
        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>BACKGROUND LAYERS (optional)</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            style={{
              color: theme.colors.text,
              fontSize: '11px',
              display: 'block',
            }}
          />
          {layerFiles.length > 0 && (
            <div style={{ color: theme.colors.textMuted, fontSize: '10px', marginTop: '6px' }}>
              {layerFiles.length} layer{layerFiles.length !== 1 ? 's' : ''} selected
            </div>
          )}
          {layerFiles.length === 0 && (
            <div style={{ color: theme.colors.textSubtle, fontSize: '10px', marginTop: '6px' }}>
              No file chosen — scene will start blank
            </div>
          )}
        </div>

        {error && (
          <div style={{ color: '#f55', fontSize: '12px', marginBottom: '16px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate || creating}
            style={{
              background: canCreate && !creating ? theme.colors.primary : '#555',
              color: canCreate && !creating ? '#000' : '#999',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              cursor: canCreate && !creating ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              fontSize: '12px',
              fontFamily: 'inherit',
            }}
          >
            {creating ? 'Creating…' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewScenePage;
