import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { InsertToolbar } from './InsertToolbar';

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
 * InsertedObjectRenderer - Renders a dynamically inserted scene object.
 * Defined here (not in SceneObject.jsx) to avoid a circular import between
 * Scene ↔ SceneObject.
 */
function InsertedObjectRenderer({ object }) {
  const { mousePos, scrollZ, parallaxIntensity, mouseInfluence, editActive, groupOffset } =
    useContext(SceneContext);

  const [x, y, z] = object.position || [0, 0, 0];
  const parallaxFactor = object.parallaxFactor ?? 0.7 + z / 1000;

  const mouseOffsetX = mousePos.x * mouseInfluence.x * parallaxFactor * parallaxIntensity;
  const mouseOffsetY = mousePos.y * mouseInfluence.y * parallaxFactor * parallaxIntensity;

  const gx = groupOffset?.x || 0;
  const gy = groupOffset?.y || 0;

  const transform = [
    `translate3d(${x + mouseOffsetX + gx}px, ${y + mouseOffsetY + gy}px, ${z + scrollZ}px)`,
  ].join(' ');

  let content = null;
  if (object.type === 'memory') {
    content = (
      <div
        style={{
          background: '#fff',
          padding: '12px 12px 48px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          borderRadius: '2px',
          display: 'inline-block',
        }}
      >
        <img
          src={object.data.imageUrl}
          alt={object.data.caption || 'Memory'}
          style={{ display: 'block', width: '200px', height: '200px', objectFit: 'cover' }}
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
      </div>
    );
  } else if (object.type === 'iframe') {
    content = (
      <div
        style={{
          background: '#111',
          border: '8px solid #222',
          borderRadius: '4px',
          boxShadow: '0 0 30px rgba(0,255,0,0.2)',
          display: 'inline-block',
        }}
      >
        <iframe
          src={object.data.url}
          width={280}
          height={200}
          sandbox="allow-scripts"
          style={{ display: 'block', border: 'none' }}
          title="Embedded content"
        />
      </div>
    );
  } else if (object.type === 'text') {
    content = (
      <div
        style={{
          padding: '20px',
          background: 'rgba(0,0,0,0.8)',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          maxWidth: '280px',
        }}
      >
        {object.data.title && (
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#fff' }}>
            {object.data.title}
          </h2>
        )}
        {object.data.body && (
          <p style={{ margin: 0, fontSize: '13px', color: '#aaa', lineHeight: 1.5 }}>
            {object.data.body}
          </p>
        )}
      </div>
    );
  }

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
 * - Z: away from camera (-) to toward camera (+)
 *
 * Objects further from camera (negative Z) move less = background
 * Objects closer to camera (positive Z) move more = foreground
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
}) {
  const containerRef = useRef(null);
  const { theme } = useTheme();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollZ, setScrollZ] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

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

  const contextValue = {
    mousePos: editActive ? { x: 0, y: 0 } : mousePos,
    scrollZ,
    dimensions,
    parallaxIntensity,
    mouseInfluence,
    perspective,
    editActive,
    groupOffset: editActive ? groupOffset : { x: 0, y: 0 },
    // Group selection — used by SceneObjectGroup for visual highlight and
    // by Scene to ensure the scene-level drag only fires for ungrouped objects.
    selectedGroupId,
    setSelectedGroupId,
    // Called by each SceneObjectGroup to report its current drag offset upward
    // so Scene can include per-group offsets in handleSave.
    registerGroupOffset,
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
    </SceneContext.Provider>
  );
}

export default Scene;
