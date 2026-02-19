import React, { useRef, useState, useEffect, useCallback, createContext, useContext, useMemo } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { InsertToolbar } from './InsertToolbar';
import { Panel } from './Panel';

/**
 * Scene Context - shares camera/mouse state with all scene objects
 */
const SceneContext = createContext(null);

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a Scene component');
  }
  return context;
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
 * - Z: away from camera (-) to toward camera (+)
 *
 * Objects further from camera (negative Z) move less = background
 * Objects closer to camera (positive Z) move more = foreground
 */
/**
 * InsertedObjectRenderer - renders a dynamically inserted scene object
 * with parallax support. Defined here to avoid circular imports with SceneObject.
 */
function InsertedObjectRenderer({ obj }) {
  const { mousePos, scrollZ, parallaxIntensity, mouseInfluence, editActive, groupOffset } =
    useScene();
  const { theme } = useTheme();

  const [x, y, z] = obj.position;
  const effectiveParallax = obj.parallaxFactor ?? 0.7 + z / 1000;

  const mouseOffset = useMemo(
    () => ({
      x: mousePos.x * mouseInfluence.x * effectiveParallax * parallaxIntensity,
      y: mousePos.y * mouseInfluence.y * effectiveParallax * parallaxIntensity,
    }),
    [mousePos, mouseInfluence, effectiveParallax, parallaxIntensity],
  );

  const gx = groupOffset?.x || 0;
  const gy = groupOffset?.y || 0;

  const transform = useMemo(
    () =>
      [
        `translate3d(${x + mouseOffset.x + gx}px, ${y + mouseOffset.y + gy}px, ${z + scrollZ}px)`,
        'rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1)',
      ].join(' '),
    [x, y, z, mouseOffset, scrollZ, gx, gy],
  );

  let content = null;
  if (obj.type === 'memory') {
    content = (
      <Panel variant="polaroid" width={220} height={280}>
        <img
          src={obj.data.imageUrl}
          alt={obj.data.caption || 'Memory'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {obj.data.caption && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: '11px',
              color: '#333',
              padding: '6px 8px 8px',
            }}
          >
            {obj.data.caption}
          </div>
        )}
      </Panel>
    );
  } else if (obj.type === 'iframe') {
    content = (
      <Panel variant="monitor" width={296} height={216}>
        <iframe
          src={obj.data.url}
          width="280"
          height="200"
          sandbox="allow-scripts allow-same-origin"
          style={{ border: 'none', display: 'block' }}
          title="Embedded content"
        />
      </Panel>
    );
  } else if (obj.type === 'text') {
    content = (
      <Panel width={280} height={200}>
        <div style={{ padding: '20px' }}>
          {obj.data.title && (
            <h2
              style={{
                margin: '0 0 8px 0',
                fontSize: '18px',
                color: theme.colors.text,
                fontFamily: theme.typography.fontHeading,
              }}
            >
              {obj.data.title}
            </h2>
          )}
          {obj.data.body && (
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                color: theme.colors.textMuted,
                lineHeight: 1.5,
              }}
            >
              {obj.data.body}
            </p>
          )}
        </div>
      </Panel>
    );
  }

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

export function Scene({
  children,
  perspective = 1000, // Lower = more dramatic perspective
  parallaxIntensity = 1, // Global multiplier for mouse movement
  mouseInfluence = { x: 50, y: 30 }, // Max pixels of movement
  scrollEnabled = false, // Enable scroll-based Z movement
  scrollDepth = 500, // How much Z changes on scroll
  editable = false, // Show edit mode checkbox
  slug = null, // Scene slug, required for image uploads via Insert toolbar
  onSave = null, // Called with { groupOffset: {x, y}, objects: [...] } when save is clicked
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const { theme } = useTheme();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollZ, setScrollZ] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Edit mode state
  const [editActive, setEditActive] = useState(false);
  const [groupOffset, setGroupOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [insertedObjects, setInsertedObjects] = useState([]);
  const dragStartRef = useRef(null);

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

  // Track scroll for Z movement
  useEffect(() => {
    if (!scrollEnabled) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      setScrollZ(scrollProgress * scrollDepth);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollEnabled, scrollDepth]);

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

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ groupOffset, objects: insertedObjects });
    }
  }, [onSave, groupOffset, insertedObjects]);

  const handleInsert = useCallback((type, data) => {
    const id = `obj-${Date.now()}`;
    setInsertedObjects((prev) => [
      ...prev,
      {
        id,
        type,
        position: data.position,
        parallaxFactor: data.parallaxFactor,
        panelVariant: data.panelVariant,
        data,
      },
    ]);
  }, []);

  const handleReset = useCallback(() => {
    setGroupOffset({ x: 0, y: 0 });
  }, []);

  const saveDisabled = groupOffset.x === 0 && groupOffset.y === 0 && insertedObjects.length === 0;

  const contextValue = {
    mousePos: editActive ? { x: 0, y: 0 } : mousePos,
    scrollZ,
    dimensions,
    parallaxIntensity,
    mouseInfluence,
    perspective,
    editActive,
    groupOffset: editActive ? groupOffset : { x: 0, y: 0 },
  };

  return (
    <SceneContext.Provider value={contextValue}>
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
          }}
        >
          {children}
          {insertedObjects.map((obj) => (
            <InsertedObjectRenderer key={obj.id} obj={obj} />
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
                  if (!e.target.checked) handleReset();
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
                      disabled={saveDisabled}
                      style={{
                        background: saveDisabled ? '#555' : theme.colors.primary,
                        color: saveDisabled ? '#999' : '#000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: saveDisabled ? 'not-allowed' : 'pointer',
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
                <InsertToolbar slug={slug} onInsert={handleInsert} />
              </div>
            )}
          </div>
        )}
      </div>
    </SceneContext.Provider>
  );
}

export default Scene;
