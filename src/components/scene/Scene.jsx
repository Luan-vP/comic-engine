import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { InsertToolbar } from './InsertToolbar';
import { CARD_TYPE_REGISTRY } from './cardTypes';

/**
 * Scene context split into two pieces to avoid re-rendering scroll-driven
 * consumers (like SceneObject) on every wheel tick:
 *
 *  - SceneStaticContext: values that change infrequently (mousePos, editActive,
 *    dimensions, subscribe handles, refs). Consumers re-render only when these
 *    actually change.
 *  - SceneScrollZContext: the current scrollZ value. Consumers that need the
 *    React state (e.g. InsertedObjectRenderer) read from this context. Perf-
 *    sensitive consumers instead subscribe via scrollZRef + subscribeScrollZ
 *    exposed on SceneStaticContext and imperatively mutate their DOM.
 */
const SceneStaticContext = createContext(null);
const SceneScrollZContext = createContext(0);

/**
 * useScene — backward-compatible hook returning the merged context.
 * Callers that destructure `scrollZ` will re-render on scroll changes.
 * Prefer useSceneStatic() + subscribeScrollZ for perf-sensitive consumers.
 */
export function useScene() {
  const staticContext = useContext(SceneStaticContext);
  const scrollZ = useContext(SceneScrollZContext);
  if (!staticContext) {
    throw new Error('useScene must be used within a Scene component');
  }
  return { ...staticContext, scrollZ };
}

/**
 * useSceneStatic — reads only the stable slice of scene context.
 * Consumers do NOT re-render when scrollZ changes. Use this in combination
 * with scrollZRef/subscribeScrollZ for scroll-driven imperative updates.
 */
export function useSceneStatic() {
  const staticContext = useContext(SceneStaticContext);
  if (!staticContext) {
    throw new Error('useSceneStatic must be used within a Scene component');
  }
  return staticContext;
}

/**
 * InsertedObjectRenderer - Renders a dynamically inserted scene object.
 * Defined here (not in SceneObject.jsx) to avoid a circular import between
 * Scene ↔ SceneObject.
 */
function InsertedObjectRenderer({ object }) {
  const { mousePos, parallaxIntensity, mouseInfluence, editActive, groupOffset } =
    useContext(SceneStaticContext);
  const scrollZ = useContext(SceneScrollZContext);

  const [x, y, z] = object.position || [0, 0, 0];
  const parallaxFactor = object.parallaxFactor ?? 0.7 + z / 1000;

  const mouseOffsetX = mousePos.x * mouseInfluence.x * parallaxFactor * parallaxIntensity;
  const mouseOffsetY = mousePos.y * mouseInfluence.y * parallaxFactor * parallaxIntensity;

  const gx = groupOffset?.x || 0;
  const gy = groupOffset?.y || 0;

  const transform = [
    `translate3d(${x + mouseOffsetX + gx}px, ${y + mouseOffsetY + gy}px, ${scrollZ - z}px)`,
  ].join(' ');

  const cardType = CARD_TYPE_REGISTRY.find((ct) => ct.id === object.type);
  const content = cardType ? cardType.renderContent(object) : null;

  if (!content) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center',
        pointerEvents: editActive ? 'none' : 'auto',
        transition: editActive ? 'none' : 'transform 0.1s ease-out',
      }}
    >
      {content}
    </div>
  );
}

/**
 * Scene - The 3D container that provides parallax through CSS transforms
 *
 * This uses CSS 3D transforms to create a parallax effect. In production,
 * you might swap this for a Three.js scene with CSS3DRenderer for more
 * complex 3D objects, but CSS transforms handle flat panels beautifully.
 *
 * The coordinate system:
 * - X: left (-) to right (+)
 * - Y: up (-) to down (+) [CSS convention]
 * - Z: 0 = camera plane, positive = deeper into scene (further from camera)
 *
 * Objects with higher Z are further away and move less = background
 * Objects with lower/negative Z are closer and move more = foreground
 */
export function Scene({
  children,
  perspective = 1000, // Lower = more dramatic perspective
  parallaxIntensity = 1, // Global multiplier for mouse movement
  mouseInfluence = { x: 50, y: 30 }, // Max pixels of movement
  scrollEnabled = false, // Enable scroll-based Z movement
  scrollDepth = 500, // How much Z changes on scroll
  editable = false, // Show edit mode checkbox
  onSave = null, // Called with { groupOffset, groupOffsets, objects } when save is clicked
  slug = null, // Scene slug, used by InsertToolbar for asset uploads
  className = '',
  style = {},
  controlledScrollZ = null, // When provided, overrides internal scroll state (for useZScroll)
  containerRef: externalContainerRef = null, // External ref for container div (for useZScroll)
}) {
  const internalContainerRef = useRef(null);
  const containerRef = externalContainerRef || internalContainerRef;
  const { theme } = useTheme();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [internalScrollZ, setInternalScrollZ] = useState(0);
  const scrollZ = controlledScrollZ !== null ? controlledScrollZ : internalScrollZ;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Ref mirror of scrollZ so imperative subscribers can read latest value
  // without closing over stale state.
  const scrollZRef = useRef(scrollZ);
  // Stable set of listener callbacks invoked whenever scrollZ changes.
  const scrollZListenersRef = useRef(new Set());

  // Stable subscribe function — never changes identity, so consumers can
  // pass it into useEffect dependency arrays without churn.
  const subscribeScrollZ = useCallback((listener) => {
    scrollZListenersRef.current.add(listener);
    return () => {
      scrollZListenersRef.current.delete(listener);
    };
  }, []);

  // Mirror scrollZ into the ref and notify subscribers on every change.
  useEffect(() => {
    scrollZRef.current = scrollZ;
    scrollZListenersRef.current.forEach((listener) => {
      try {
        listener(scrollZ);
      } catch (e) {
        // Don't let one listener break others
        console.error('scrollZ listener error', e);
      }
    });
  }, [scrollZ]);

  // Edit mode state
  const [editActive, setEditActive] = useState(false);
  const [groupOffset, setGroupOffset] = useState({ x: 0, y: 0 });
  const [groupOffsets, setGroupOffsets] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  // Which SceneObjectGroup is currently selected for dragging (null = ungrouped drag)
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // Dynamically inserted objects (persisted on save)
  const [insertedObjects, setInsertedObjects] = useState([]);

  // Track mouse position normalized to -1 to 1
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    };

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Track scroll for Z movement (only when not externally controlled)
  useEffect(() => {
    if (!scrollEnabled || controlledScrollZ !== null) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      setInternalScrollZ(scrollProgress * scrollDepth);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollEnabled, scrollDepth, controlledScrollZ]);

  // Drag handlers for edit mode
  const handleDragStart = useCallback(
    (e) => {
      if (!editActive) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - groupOffset.x,
        y: e.clientY - groupOffset.y,
      };
    },
    [editActive, groupOffset],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e) => {
      if (!dragStartRef.current) return;
      setGroupOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    };

    const handleUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const registerGroupOffset = useCallback((gId, offset) => {
    setGroupOffsets((prev) => ({ ...prev, [gId]: offset }));
  }, []);

  const hasAnyOffset =
    groupOffset.x !== 0 ||
    groupOffset.y !== 0 ||
    Object.values(groupOffsets).some((o) => o.x !== 0 || o.y !== 0) ||
    insertedObjects.length > 0;

  const handleInsert = useCallback((objectData) => {
    setInsertedObjects((prev) => [...prev, objectData]);
  }, []);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ groupOffset, groupOffsets, objects: insertedObjects });
    }
  }, [onSave, groupOffset, groupOffsets, insertedObjects]);

  const handleReset = useCallback(() => {
    setGroupOffset({ x: 0, y: 0 });
    setGroupOffsets({});
    setInsertedObjects([]);
  }, []);

  // Build the stable context value. This intentionally excludes `scrollZ`
  // so consumers of SceneStaticContext do not re-render on wheel ticks.
  // Changes here still rerender consumers, but these values change at
  // human-interaction speeds (mousemove, drag, edit toggle) rather than
  // at 60fps.
  const staticContextValue = useMemo(
    () => ({
      mousePos: editActive ? { x: 0, y: 0 } : mousePos,
      dimensions,
      parallaxIntensity,
      mouseInfluence,
      perspective,
      editActive,
      groupOffset: editActive ? groupOffset : { x: 0, y: 0 },
      selectedGroupId,
      setSelectedGroupId,
      registerGroupOffset,
      // Scroll subscription primitives — stable references.
      scrollZRef,
      subscribeScrollZ,
    }),
    [
      mousePos,
      dimensions,
      parallaxIntensity,
      mouseInfluence,
      perspective,
      editActive,
      groupOffset,
      selectedGroupId,
      registerGroupOffset,
      subscribeScrollZ,
    ],
  );

  return (
    <SceneStaticContext.Provider value={staticContextValue}>
      <SceneScrollZContext.Provider value={scrollZ}>
        <div
          ref={containerRef}
          className={className}
          onMouseDown={editActive ? handleDragStart : undefined}
          style={{
            width: '100%',
            height: '100vh',
            overflow: 'hidden',
            position: 'relative',
            perspective: `${perspective}px`,
            perspectiveOrigin: '50% 50%',
            background: theme.colors.backgroundGradient,
            cursor: editActive ? (isDragging ? 'grabbing' : 'grab') : 'default',
            ...style,
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              // Allow clicks to pass through to children at negative Z depths.
              // Without this, the container plane at z=0 intercepts pointer events
              // before they reach elements behind it in 3D space.
              pointerEvents: 'none',
            }}
          >
            {children}
            {insertedObjects.map((obj) => (
              <InsertedObjectRenderer key={obj.id} object={obj} />
            ))}
          </div>

          {/* Edit mode controls */}
          {editable && (
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${editActive ? theme.colors.primary : theme.colors.border}`,
                borderRadius: '8px',
                padding: '12px 16px',
                zIndex: 10000,
                fontFamily: theme.typography.fontBody,
                userSelect: 'none',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: theme.colors.text,
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => {
                    setEditActive(e.target.checked);
                    if (!e.target.checked) {
                      handleReset();
                      setSelectedGroupId(null);
                    }
                  }}
                  style={{ accentColor: theme.colors.primary }}
                />
                Edit Layout
              </label>

              {editActive && (
                <div style={{ marginTop: '10px' }}>
                  <div
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    Offset: {Math.round(groupOffset.x)}, {Math.round(groupOffset.y)}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {onSave && (
                      <button
                        onClick={handleSave}
                        disabled={!hasAnyOffset}
                        style={{
                          background: hasAnyOffset ? theme.colors.primary : '#555',
                          color: hasAnyOffset ? '#000' : '#999',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: hasAnyOffset ? 'pointer' : 'not-allowed',
                          fontWeight: 'bold',
                          fontSize: '11px',
                          fontFamily: theme.typography.fontBody,
                        }}
                      >
                        Save
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: theme.colors.text,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontFamily: theme.typography.fontBody,
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  {slug && <InsertToolbar slug={slug} onInsert={handleInsert} />}
                </div>
              )}
            </div>
          )}
        </div>
      </SceneScrollZContext.Provider>
    </SceneStaticContext.Provider>
  );
}

export default Scene;
