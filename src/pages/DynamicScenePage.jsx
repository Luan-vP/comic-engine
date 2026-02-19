import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Scene, SceneObject } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';

/**
 * DynamicScenePage - Data-driven scene renderer
 *
 * Loads a scene config from /local-scenes/<slug>/scene.json and renders
 * it using <Scene> + <SceneObject> components. Supports edit mode drag
 * with position saving via PATCH /_dev/scenes/:slug.
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
    async ({ groupOffset }) => {
      try {
        const res = await fetch(`/_dev/scenes/${slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupOffset }),
        });
        if (!res.ok) {
          console.error('Failed to save scene positions:', await res.text());
        }
      } catch (err) {
        console.error('Failed to save scene positions:', err);
      }
    },
    [slug],
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

  const { layers = [], sceneConfig = {} } = config;
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
    </Scene>
  );
}

export default DynamicScenePage;
