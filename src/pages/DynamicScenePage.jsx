import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';

/**
 * DynamicScenePage - Data-driven scene renderer
 *
 * Loads a scene config from /local-scenes/<slug>/scene.json and renders
 * it using <Scene> + <SceneObject> components. Supports edit mode drag
 * with position saving via PATCH /_dev/scenes/:slug.
 *
 * Also renders inserted objects stored in scene.json's `objects` array,
 * and supports adding new objects via Scene's InsertToolbar (edit mode).
 */
export function DynamicScenePage() {
  const { slug } = useParams();
  const { theme } = useTheme();
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [loadedSlug, setLoadedSlug] = useState(null);
  const loading = loadedSlug !== slug;

  useEffect(() => {
    let cancelled = false;

    fetch(`/local-scenes/${slug}/scene.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Scene "${slug}" not found (${res.status})`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
          setError(null);
          setLoadedSlug(slug);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setConfig(null);
          setError(err.message);
          setLoadedSlug(slug);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleSave = useCallback(
    async ({ groupOffset, groupOffsets, objects: newObjects = [] }) => {
      try {
        // Merge newly inserted objects with any already-saved objects
        const existingObjects = config?.objects || [];
        const allObjects = [...existingObjects, ...newObjects];

        const res = await fetch(`/_dev/scenes/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupOffset, groupOffsets, objects: allObjects }),
        });
        if (!res.ok) {
          console.error('Failed to save scene positions:', await res.text());
        }
      } catch (err) {
        console.error('Failed to save scene positions:', err);
      }
    },
    [slug, config],
  );

  const centeredBox = {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.colors.backgroundGradient,
    fontFamily: theme.typography.fontBody,
  };

  if (loading) {
    return (
      <div style={centeredBox}>
        <div style={{ color: theme.colors.textMuted, fontSize: '14px', letterSpacing: '2px' }}>
          Loading scene…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={centeredBox}>
        <div
          style={{
            color: theme.colors.primary,
            fontSize: '18px',
            marginBottom: '12px',
            letterSpacing: '2px',
          }}
        >
          Scene not found
        </div>
        <div style={{ color: theme.colors.textMuted, fontSize: '12px' }}>{error}</div>
        <div
          style={{ color: theme.colors.textSubtle, fontSize: '11px', marginTop: '8px' }}
        >{`/local-scenes/${slug}/scene.json`}</div>
      </div>
    );
  }

  const { layers = [], objects = [], sceneConfig = {} } = config;
  const {
    perspective = 1000,
    parallaxIntensity = 1,
    mouseInfluence = { x: 50, y: 30 },
  } = sceneConfig;

  return (
    <Scene
      perspective={perspective}
      parallaxIntensity={parallaxIntensity}
      mouseInfluence={mouseInfluence}
      editable
      onSave={handleSave}
      slug={slug}
    >
      {layers.map((layer) => {
        const imgSrc = layer.hasBlurFill
          ? `/local-scenes/${slug}/layer-${layer.index}-blur.png`
          : `/local-scenes/${slug}/layer-${layer.index}.png`;

        return (
          <SceneObject
            key={layer.index}
            position={layer.position || [0, 0, 0]}
            parallaxFactor={layer.parallaxFactor}
            interactive={false}
          >
            <img
              src={imgSrc}
              alt={layer.name || `Layer ${layer.index}`}
              style={{ maxWidth: '80vw', maxHeight: '80vh' }}
            />
          </SceneObject>
        );
      })}

      {objects.map((obj) => (
        <SavedObjectRenderer key={obj.id || `obj-${objects.indexOf(obj)}`} object={obj} />
      ))}
    </Scene>
  );
}

/**
 * SavedObjectRenderer - renders a persisted scene object from scene.json's objects array.
 */
function SavedObjectRenderer({ object }) {
  const position = object.position || [0, 0, 0];
  const parallaxFactor = object.parallaxFactor ?? 0.6;

  let content = null;
  if (object.type === 'memory') {
    content = (
      <Panel variant="polaroid" width={224} height={272}>
        <img
          src={object.data.imageUrl}
          alt={object.data.caption || 'Memory'}
          style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
        />
        {object.data.caption && (
          <div
            style={{
              textAlign: 'center',
              marginTop: '6px',
              fontSize: '11px',
              color: '#333',
              fontFamily: 'Georgia, serif',
            }}
          >
            {object.data.caption}
          </div>
        )}
      </Panel>
    );
  } else if (object.type === 'iframe') {
    content = (
      <Panel variant="monitor" width={296} height={216}>
        <iframe
          src={object.data.url}
          width={280}
          height={200}
          sandbox="allow-scripts allow-same-origin"
          style={{ display: 'block', border: 'none' }}
          title="Embedded content"
        />
      </Panel>
    );
  } else if (object.type === 'text') {
    content = (
      <Panel variant={object.panelVariant || 'default'} width={320} height={200}>
        <div style={{ padding: '20px' }}>
          {object.data.title && (
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{object.data.title}</h2>
          )}
          {object.data.body && (
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>{object.data.body}</p>
          )}
        </div>
      </Panel>
    );
  }

  if (!content) return null;

  return (
    <SceneObject position={position} parallaxFactor={parallaxFactor}>
      {content}
    </SceneObject>
  );
}

export default DynamicScenePage;
