import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Scene, SceneObject, SavedObjectRenderer } from '../components/scene';
import { ObjectEditPopover } from '../components/scene/InsertModals';
import { OverlayStack } from '../components/overlays';
import { useTheme } from '../theme/ThemeContext';
import { useSceneLoader } from '../hooks/useSceneLoader';
import { useZScroll } from '../hooks/useZScroll';
import { useThemeTriggers } from '../hooks/useThemeTriggers';
import { ScrollMinimap } from '../components/minimap';
import { centeredBox } from '../utils/pageLayout';
import { computeMaxZ, computeScrollDepth } from '../utils/sceneDepth';

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
  const maxZ = useMemo(() => computeMaxZ(layers, objects), [layers, objects]);

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

  const scrollDepth = useMemo(
    () => computeScrollDepth(maxZ, perspective),
    [maxZ, perspective],
  );

  const { scrollZ, currentSlideIndex, jumpToSlide, slidesWithProgress, containerRef } = useZScroll({
    slides,
    scrollDepth,
  });

  // Per-scene theme: read from sceneConfig.theme (canonical schema shared with reader).
  // See issue #90 — both reader and editor now use `theme.triggers` via useThemeTriggers.
  const sceneTheme = sceneConfig.theme;
  const baseThemeName = sceneTheme?.base;
  const baseOverlays = useMemo(() => sceneTheme?.overlays || {}, [sceneTheme?.overlays]);
  const triggers = useMemo(() => sceneTheme?.triggers || [], [sceneTheme?.triggers]);

  const { activeThemeName, activeOverlays, handleObjectClick } = useThemeTriggers({
    triggers,
    scrollZ,
    baseTheme: baseThemeName,
    baseOverlays,
  });

  // Apply active theme to the global ThemeContext (use ref to avoid render loop)
  const appliedThemeRef = useRef(null);
  useEffect(() => {
    if (activeThemeName && activeThemeName !== appliedThemeRef.current) {
      appliedThemeRef.current = activeThemeName;
      setTheme(activeThemeName);
    }
  }, [activeThemeName, setTheme]);

  // Object editing — position is lifted so drag and popover share it
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [editPosition, setEditPosition] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const selectedObject = objects.find((o) => o.id === selectedObjectId) || null;

  const handleSelect = useCallback(
    (id) => {
      const obj = objects.find((o) => o.id === id);
      if (obj) {
        setSelectedObjectId(id);
        setEditPosition([...(obj.position || [0, 0, 0])]);
        setSaveError(null);
      }
    },
    [objects],
  );

  const handleDeselect = useCallback(() => {
    setSelectedObjectId(null);
    setEditPosition(null);
    setSaveError(null);
  }, []);

  const handleObjectUpdate = useCallback(
    async (updated) => {
      const nextObjects = objects.map((o) => (o.id === updated.id ? updated : o));
      setSaving(true);
      setSaveError(null);
      const ok = await handleSave({
        groupOffset: { x: 0, y: 0 },
        groupOffsets: {},
        objects: nextObjects,
        replaceObjects: true,
      });
      setSaving(false);
      if (ok) {
        handleDeselect();
      } else {
        setSaveError('Failed to save — changes not persisted');
      }
    },
    [objects, handleSave, handleDeselect],
  );

  const handleObjectDelete = useCallback(
    async (id) => {
      const nextObjects = objects.filter((o) => o.id !== id);
      setSaving(true);
      setSaveError(null);
      const ok = await handleSave({
        groupOffset: { x: 0, y: 0 },
        groupOffsets: {},
        objects: nextObjects,
        replaceObjects: true,
      });
      setSaving(false);
      if (ok) {
        handleDeselect();
      } else {
        setSaveError('Failed to delete — object still present');
      }
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
      // Fire object-click theme trigger so triggers can be previewed in the editor.
      handleObjectClick(id);
      if (id === selectedObjectId) return;
      handleSelect(id);
    },
    [selectedObjectId, handleSelect, handleObjectClick],
  );

  if (loading) {
    return (
      <div style={centeredBox(theme)}>
        <div style={{ color: theme.colors.textMuted, fontSize: '14px', letterSpacing: '2px' }}>
          Loading scene…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={centeredBox(theme)}>
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
      <OverlayStack
        filmGrain={activeOverlays.filmGrain}
        vignette={activeOverlays.vignette}
        scanlines={activeOverlays.scanlines}
        particles={activeOverlays.particles}
        ascii={activeOverlays.ascii}
        inkSplatter={activeOverlays.inkSplatter}
        graffitiSpray={activeOverlays.graffitiSpray}
        halftone={activeOverlays.halftone}
        speedLines={activeOverlays.speedLines}
      />
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

      {(saving || saveError) && (
        <div
          style={{
            position: 'fixed',
            top: '50px',
            right: '20px',
            zIndex: 10003,
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            letterSpacing: '1px',
            fontFamily: theme.typography.fontBody,
            background: saveError ? 'rgba(255,80,80,0.2)' : 'rgba(0,0,0,0.7)',
            color: saveError ? '#f55' : theme.colors.textMuted,
            border: saveError ? '1px solid rgba(255,80,80,0.4)' : '1px solid transparent',
          }}
        >
          {saveError || 'Saving…'}
        </div>
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
