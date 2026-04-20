import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scene, SceneObject, SavedObjectRenderer } from '../components/scene';
import { ObjectEditPopover } from '../components/scene/InsertModals';
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
  const { theme, setTheme } = useTheme();
  const { scene: config, loading, error, save: handleSave } = useSceneLoader(slug);

  // Derive data from config (safe-defaults so hooks can run before early returns)
  const { layers = [], objects = [], sceneConfig = {} } = config || {};
  const {
    perspective = 1000,
    parallaxIntensity = 1,
    mouseInfluence = { x: 50, y: 30 },
  } = sceneConfig;

  // Auto-derive slides from layers.
  // With positive-Z-deeper convention, scrollZ=Z brings object at z=Z to camera plane.
  // So zCenter = layer.z directly, and scrollDepth covers the max Z.
  const maxZ = useMemo(() => {
    const layerZs = layers.map((l) => (l.position || [0, 0, 0])[2]);
    const objectZs = objects.map((o) => (o.position || [0, 0, 0])[2]);
    const allZs = [...layerZs, ...objectZs];
    return allZs.length ? Math.max(...allZs) : 0;
  }, [layers, objects]);

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
    // Add perspective so the deepest objects can scroll past the camera
    return (maxZ || 500) + perspective;
  }, [maxZ, perspective]);

  const { scrollZ, currentSlideIndex, jumpToSlide, slidesWithProgress, containerRef } = useZScroll({
    slides,
    scrollDepth,
  });

  // Theme keyframes — switch theme as user scrolls past Z thresholds
  const themeKeyframes = sceneConfig.themeKeyframes;
  const prevThemeRef = useRef(null);

  // Set starting theme on mount (lowest z keyframe = start of scroll)
  useEffect(() => {
    if (!themeKeyframes || !themeKeyframes.length) return;
    const sorted = [...themeKeyframes].sort((a, b) => a.z - b.z);
    setTheme(sorted[0].theme);
    prevThemeRef.current = sorted[0].theme;
  }, [themeKeyframes, setTheme]);

  // Switch theme as user scrolls past Z thresholds.
  // scrollZ increases as user scrolls deeper. Keyframe z values match object positions.
  // Keyframe { z: 5000 } triggers when scrollZ >= 5000.
  useEffect(() => {
    if (!themeKeyframes || !themeKeyframes.length) return;
    const sorted = [...themeKeyframes].sort((a, b) => a.z - b.z);
    let activeTheme = sorted[0].theme;
    for (const kf of sorted) {
      if (scrollZ >= kf.z) {
        activeTheme = kf.theme;
      }
    }
    if (activeTheme !== prevThemeRef.current) {
      prevThemeRef.current = activeTheme;
      setTheme(activeTheme);
    }
  }, [scrollZ, themeKeyframes, setTheme]);

  // Object editing — position is lifted so drag and popover share it
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [editPosition, setEditPosition] = useState(null);
  const selectedObject = objects.find((o) => o.id === selectedObjectId) || null;

  const handleSelect = useCallback(
    (id) => {
      const obj = objects.find((o) => o.id === id);
      if (obj) {
        setSelectedObjectId(id);
        setEditPosition([...(obj.position || [0, 0, 0])]);
      }
    },
    [objects],
  );

  const handleDeselect = useCallback(() => {
    setSelectedObjectId(null);
    setEditPosition(null);
  }, []);

  const handleObjectUpdate = useCallback(
    (updated) => {
      const nextObjects = objects.map((o) => (o.id === updated.id ? updated : o));
      handleSave({
        groupOffset: { x: 0, y: 0 },
        groupOffsets: {},
        objects: nextObjects,
        replaceObjects: true,
      });
      handleDeselect();
    },
    [objects, handleSave, handleDeselect],
  );

  const handleObjectDelete = useCallback(
    (id) => {
      const nextObjects = objects.filter((o) => o.id !== id);
      handleSave({
        groupOffset: { x: 0, y: 0 },
        groupOffsets: {},
        objects: nextObjects,
        replaceObjects: true,
      });
      handleDeselect();
    },
    [objects, handleSave, handleDeselect],
  );

  // Card dragging — perspective-compensated XY movement
  const [isDraggingCard, setIsDraggingCard] = useState(false);
  const cardDragRef = useRef(null);
  const didDragRef = useRef(false);

  const handleCardDragStart = useCallback(
    (e) => {
      if (!editPosition) return;
      const cssZ = scrollZ - editPosition[2];
      const scale = perspective / (perspective - cssZ);
      cardDragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPos: [...editPosition],
        invScale: 1 / scale,
      };
      didDragRef.current = false;
      setIsDraggingCard(true);
    },
    [editPosition, scrollZ, perspective],
  );

  useEffect(() => {
    if (!isDraggingCard) return;

    const handleMove = (e) => {
      const d = cardDragRef.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDragRef.current = true;
      setEditPosition([
        Math.round(d.startPos[0] + dx * d.invScale),
        Math.round(d.startPos[1] + dy * d.invScale),
        d.startPos[2],
      ]);
    };

    const handleUp = () => {
      cardDragRef.current = null;
      setIsDraggingCard(false);
      // Reset didDrag after a tick so the click event (which fires after mouseup)
      // can still check it, but it doesn't linger for future clicks.
      setTimeout(() => {
        didDragRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingCard]);

  const handleCardClick = useCallback(
    (id) => {
      if (didDragRef.current) {
        didDragRef.current = false;
        return;
      }
      if (id === selectedObjectId) return;
      handleSelect(id);
    },
    [selectedObjectId, handleSelect],
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
          <SavedObjectRenderer
            key={obj.id || `obj-${objects.indexOf(obj)}`}
            object={obj}
            selected={obj.id === selectedObjectId}
            overridePosition={obj.id === selectedObjectId ? editPosition : undefined}
            onSelect={handleCardClick}
            onDragStart={obj.id === selectedObjectId ? handleCardDragStart : undefined}
          />
        ))}
      </Scene>

      {selectedObject && editPosition && (
        <ObjectEditPopover
          key={selectedObject.id}
          object={selectedObject}
          position={editPosition}
          onPositionChange={setEditPosition}
          onUpdate={handleObjectUpdate}
          onDelete={handleObjectDelete}
          onClose={handleDeselect}
        />
      )}

      <ScrollMinimap
        slides={slidesWithProgress}
        currentSlideIndex={currentSlideIndex}
        onSlideClick={jumpToSlide}
      />
    </>
  );
}

export default DynamicScenePage;
