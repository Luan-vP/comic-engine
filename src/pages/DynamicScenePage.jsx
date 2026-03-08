import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Scene, SceneObject } from '../components/scene';
import { CARD_TYPE_REGISTRY } from '../components/scene/cardTypes';
import { useTheme } from '../theme/ThemeContext';
import { useSceneLoader } from '../hooks/useSceneLoader';
import { useZScroll } from '../hooks/useZScroll';
import { ScrollMinimap } from '../components/minimap';

/**
 * DynamicScenePage - Data-driven scene renderer
 *
 * Loads a scene config from /local-scenes/<slug>/scene.json (dev) or GCS (prod)
 * and renders it using <Scene> + <SceneObject> components. Supports edit mode drag
 * with position saving via PATCH /_dev/scenes/:slug (dev only).
 *
 * Also renders inserted objects stored in scene.json's `objects` array,
 * and supports adding new objects via Scene's InsertToolbar (edit mode).
 */
export function DynamicScenePage() {
  const { slug } = useParams();
  const { theme } = useTheme();
  const { scene: config, loading, error, save: handleSave } = useSceneLoader(slug);

  // Derive data from config (safe-defaults so hooks can run before early returns)
  const { layers = [], objects = [], sceneConfig = {} } = config || {};
  const {
    perspective = 1000,
    parallaxIntensity = 1,
    mouseInfluence = { x: 50, y: 30 },
  } = sceneConfig;

  // Auto-derive slides from layers: zCenter = layer Z position, thumbnail from local-scenes path
  const slides = useMemo(
    () =>
      layers.map((layer, n) => ({
        id: `layer-${layer.index ?? n}`,
        label: layer.name || `Layer ${layer.index ?? n}`,
        zCenter: (layer.position || [0, 0, 0])[2],
        thumbnail: `/local-scenes/${slug}/layer-${layer.index ?? n}.png`,
      })),
    [layers, slug],
  );

  const scrollDepth = useMemo(() => {
    if (!layers.length) return 500;
    const zValues = layers.map((l) => (l.position || [0, 0, 0])[2]);
    return Math.max(...zValues) - Math.min(...zValues) || 500;
  }, [layers]);

  const { scrollZ, currentSlideIndex, jumpToSlide, slidesWithProgress, containerRef } = useZScroll({
    slides,
    scrollDepth,
  });

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

  return (
    <>
      <Scene
        perspective={perspective}
        parallaxIntensity={parallaxIntensity}
        mouseInfluence={mouseInfluence}
        editable
        onSave={handleSave}
        slug={slug}
        controlledScrollZ={scrollZ}
        containerRef={containerRef}
      >
        {layers.map((layer) => (
          <SceneObject
            key={layer.index}
            position={layer.position || [0, 0, 0]}
            parallaxFactor={layer.parallaxFactor}
            interactive={false}
          >
            <img
              src={layer.url}
              alt={layer.name || `Layer ${layer.index}`}
              style={{ maxWidth: '80vw', maxHeight: '80vh' }}
            />
          </SceneObject>
        ))}

        {objects.map((obj) => (
          <SavedObjectRenderer key={obj.id || `obj-${objects.indexOf(obj)}`} object={obj} />
        ))}
      </Scene>

      <ScrollMinimap
        slides={slidesWithProgress}
        currentSlideIndex={currentSlideIndex}
        onSlideClick={jumpToSlide}
      />
    </>
  );
}

/**
 * SavedObjectRenderer - renders a persisted scene object from scene.json's objects array.
 */
function SavedObjectRenderer({ object }) {
  const position = object.position || [0, 0, 0];
  const parallaxFactor = object.parallaxFactor ?? 0.6;

  const cardType = CARD_TYPE_REGISTRY.find((ct) => ct.id === object.type);
  const content = cardType ? cardType.renderContent(object) : null;

  if (!content) return null;

  return (
    <SceneObject position={position} parallaxFactor={parallaxFactor}>
      {content}
    </SceneObject>
  );
}

export default DynamicScenePage;
