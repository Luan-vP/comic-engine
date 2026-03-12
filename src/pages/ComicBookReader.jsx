import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scene, SceneObject } from '../components/scene';
import { CARD_TYPE_REGISTRY } from '../components/scene/cardTypes';
import { OverlayStack } from '../components/overlays';
import { VRButton, VRViewer } from '../components/vr';
import { useTheme } from '../theme/ThemeContext';
import { useComicBook } from '../hooks/useComicBook';
import { useZScroll } from '../hooks/useZScroll';
import { useThemeTriggers } from '../hooks/useThemeTriggers';
import { getLayerUrl } from '../services/gcsStorage';

/**
 * ComicBookReader - Read-only viewer for published comic books loaded from GCS.
 *
 * Routes:
 *   /read/:comicBookSlug         → first slide
 *   /read/:comicBookSlug/:slide  → specific slide (1-based in URL, 0-based internally)
 */
export function ComicBookReader() {
  const { comicBookSlug, slide } = useParams();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // Convert 1-based URL param to 0-based index
  const slideIndex = slide ? Math.max(0, parseInt(slide, 10) - 1) : 0;

  const { manifest, currentScene, loading, error } = useComicBook(comicBookSlug, slideIndex);

  const scenes = manifest?.scenes || [];
  const totalSlides = scenes.length;

  const goToSlide = useCallback(
    (index) => {
      const clamped = Math.max(0, Math.min(index, totalSlides - 1));
      navigate(`/read/${comicBookSlug}/${clamped + 1}`, { replace: true });
    },
    [navigate, comicBookSlug, totalSlides],
  );

  const goNext = useCallback(() => goToSlide(slideIndex + 1), [goToSlide, slideIndex]);
  const goPrev = useCallback(() => goToSlide(slideIndex - 1), [goToSlide, slideIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Touch/swipe navigation
  useEffect(() => {
    let touchStartX = null;
    let touchStartY = null;

    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Only count as a horizontal swipe if it's more horizontal than vertical
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) goNext();
        else goPrev();
      }
      touchStartX = null;
      touchStartY = null;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goNext, goPrev]);

  // Extract scene data with safe defaults (hooks must run before early returns)
  const sceneSlug = scenes[slideIndex]?.slug;
  const { layers = [], objects = [], sceneConfig = {} } = currentScene || {};
  const {
    perspective = 1000,
    parallaxIntensity = 1,
    mouseInfluence = { x: 50, y: 30 },
  } = sceneConfig;

  const minZ = useMemo(() => {
    const layerZs = layers.map((l) => (l.position || [0, 0, 0])[2]);
    const objectZs = objects.map((o) => (o.position || [0, 0, 0])[2]);
    const allZs = [...layerZs, ...objectZs];
    return allZs.length ? Math.min(...allZs) : 0;
  }, [layers, objects]);

  const slides = useMemo(
    () =>
      layers.map((layer) => ({
        id: `layer-${layer.index}`,
        label: layer.name || `Layer ${layer.index}`,
        zCenter: (layer.position || [0, 0, 0])[2] - minZ,
      })),
    [layers, minZ],
  );

  const scrollDepth = useMemo(() => {
    const layerZs = layers.map((l) => (l.position || [0, 0, 0])[2]);
    const objectZs = objects.map((o) => (o.position || [0, 0, 0])[2]);
    const allZs = [...layerZs, ...objectZs];
    if (!allZs.length) return 500;
    const range = Math.max(...allZs) - Math.min(...allZs) || 500;
    return range + perspective;
  }, [layers, objects, perspective]);

  const { scrollZ, containerRef } = useZScroll({
    slides,
    scrollDepth,
    snapEnabled: false,
  });

  // Per-scene theme: read from sceneConfig.theme (stabilize references to avoid re-render loops)
  const sceneTheme = sceneConfig.theme;
  const baseThemeName = sceneTheme?.base || 'pulp';
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
    if (currentScene && activeThemeName && activeThemeName !== appliedThemeRef.current) {
      appliedThemeRef.current = activeThemeName;
      setTheme(activeThemeName);
    }
  }, [activeThemeName, currentScene, setTheme]);

  // VR mode
  const [isVR, setIsVR] = useState(false);

  const vrLayers = useMemo(() => {
    const vr = layers.map((layer) => {
      const layerFile = layer.hasBlurFill
        ? `layer-${layer.index}-blur.png`
        : `layer-${layer.index}.png`;
      const imgSrc = getLayerUrl(comicBookSlug, sceneSlug, layerFile);
      return {
        id: `layer-${layer.index}`,
        position: layer.position || [0, 0, 0],
        parallaxFactor: layer.parallaxFactor,
        content: (
          <img
            src={imgSrc}
            alt={layer.name || `Layer ${layer.index}`}
            style={{ maxWidth: '80vw', maxHeight: '80vh' }}
          />
        ),
      };
    });
    objects.forEach((obj, i) => {
      const cardType = CARD_TYPE_REGISTRY.find((ct) => ct.id === obj.type);
      const content = cardType ? cardType.renderContent(obj) : null;
      if (content) {
        vr.push({
          id: obj.id || `obj-${i}`,
          position: obj.position || [0, 0, 0],
          parallaxFactor: obj.parallaxFactor ?? 0.6,
          content,
        });
      }
    });
    return vr;
  }, [layers, objects, comicBookSlug, sceneSlug]);

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
          Loading…
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
          {error === 'MANIFEST_NOT_FOUND' ? 'Comic book not found' : 'Failed to load'}
        </div>
        <div style={{ color: theme.colors.textMuted, fontSize: '12px' }}>
          {error === 'MANIFEST_NOT_FOUND' ? `No comic book found at "${comicBookSlug}"` : error}
        </div>
      </div>
    );
  }

  if (!currentScene) {
    return (
      <div style={centeredBox}>
        <div style={{ color: theme.colors.textMuted, fontSize: '14px', letterSpacing: '2px' }}>
          No scenes found
        </div>
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
        controlledScrollZ={scrollZ}
        containerRef={containerRef}
      >
        {layers.map((layer) => {
          const layerFile = layer.hasBlurFill
            ? `layer-${layer.index}-blur.png`
            : `layer-${layer.index}.png`;
          const imgSrc = getLayerUrl(comicBookSlug, sceneSlug, layerFile);

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

        {objects.map((obj, i) => (
          <SavedObjectRenderer
            key={obj.id || `obj-${i}`}
            object={obj}
            onObjectClick={handleObjectClick}
          />
        ))}
      </Scene>

      <VRButton isVR={isVR} onToggle={() => setIsVR((v) => !v)} />
      {isVR && (
        <VRViewer
          layers={vrLayers}
          perspective={perspective}
          mouseInfluence={mouseInfluence}
          scrollDepth={scrollDepth}
        />
      )}
    </>
  );
}

function SavedObjectRenderer({ object, onObjectClick }) {
  const position = object.position || [0, 0, 0];
  const parallaxFactor = object.parallaxFactor ?? 0.6;

  const cardType = CARD_TYPE_REGISTRY.find((ct) => ct.id === object.type);
  const content = cardType ? cardType.renderContent(object) : null;

  if (!content) return null;

  return (
    <SceneObject
      position={position}
      parallaxFactor={parallaxFactor}
      onClick={onObjectClick ? () => onObjectClick(object.id) : undefined}
    >
      {content}
    </SceneObject>
  );
}

export default ComicBookReader;
