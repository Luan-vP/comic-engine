import React, { useState, useRef } from 'react';
import { Scene, SceneObject } from './scene';
import { loadSceneFromFile, parseSceneBundle } from '../utils/sceneExport';
import { useTheme } from '../theme/ThemeContext';

/**
 * SceneViewer - Component for loading and viewing saved scenes
 *
 * Allows users to upload .scene.json files and view the rendered scene
 */
export function SceneViewer() {
  const { theme } = useTheme();
  const [scene, setScene] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const bundle = await loadSceneFromFile(file);
      const sceneData = parseSceneBundle(bundle);
      setScene(sceneData);
    } catch (err) {
      console.error('Load error:', err);
      setError(err.message || 'Failed to load scene');
    } finally {
      setLoading(false);
    }
  };

  const renderControls = () => (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '20px',
        zIndex: 1000,
        maxWidth: '500px',
        fontFamily: theme.typography.fontBody,
      }}
    >
      <h2
        style={{
          color: theme.colors.primary,
          margin: '0 0 16px 0',
          fontSize: '18px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        Scene Viewer
      </h2>

      {/* File upload */}
      <div style={{ marginBottom: '16px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".scene.json,application/json"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          style={{
            background: loading ? '#555' : theme.colors.primary,
            color: loading ? '#999' : '#000',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            fontFamily: theme.typography.fontBody,
          }}
        >
          {loading ? 'Loading...' : scene ? 'Load Another Scene' : 'Load Scene'}
        </button>
      </div>

      {/* Scene info */}
      {scene && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(0,255,0,0.1)',
            border: `1px solid ${theme.colors.primary}50`,
            borderRadius: '4px',
            fontSize: '12px',
            color: theme.colors.text,
          }}
        >
          <strong>Scene loaded!</strong>
          <br />
          {scene.layers.length} layer{scene.layers.length !== 1 ? 's' : ''}
          <br />
          <span style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
            Granularity: {scene.metadata.granularity?.toFixed(2)} · Blur fill:{' '}
            {scene.metadata.blurFill}px
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.5)',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#ff6b6b',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );

  const renderScene = () => {
    if (!scene) {
      return (
        <div
          style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.colors.backgroundGradient,
            color: theme.colors.textMuted,
            fontSize: '14px',
            fontFamily: theme.typography.fontBody,
          }}
        >
          Load a scene file to view
        </div>
      );
    }

    return (
      <Scene
        perspective={1000}
        parallaxIntensity={1.2}
        mouseInfluence={{ x: 60, y: 40 }}
      >
        {scene.layers.map((layer) => {
          const [x, y, z] = layer.sceneObjectProps.position;
          return (
            <SceneObject
              key={layer.id}
              position={[x - 150, y - 100, z]}
              parallaxFactor={layer.sceneObjectProps.parallaxFactor}
              interactive={false}
            >
              <img
                src={layer.imageUrl}
                alt={layer.name}
                style={{
                  display: 'block',
                  maxWidth: '80vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  filter: `brightness(${0.8 + layer.depth * 0.4})`,
                  pointerEvents: 'none',
                }}
              />
            </SceneObject>
          );
        })}

        {/* Depth visualization overlay */}
        {scene.depthVisualization && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.85)',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              padding: '12px',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                color: theme.colors.textMuted,
                fontSize: '11px',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Depth Map
            </div>
            <img
              src={scene.depthVisualization}
              alt="Depth visualization"
              style={{
                display: 'block',
                width: '150px',
                height: 'auto',
                borderRadius: '4px',
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          </div>
        )}
      </Scene>
    );
  };

  return (
    <>
      {renderControls()}
      {renderScene()}
    </>
  );
}

export default SceneViewer;
