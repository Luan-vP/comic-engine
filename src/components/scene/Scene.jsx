import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useContext,
  createContext,
  useMemo,
} from 'react';
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
 * InsertedObjectRenderer - renders a dynamically inserted scene object
 *
 * Defined here (not in SceneObject.jsx) to avoid circular imports.
 * Uses SceneContext directly since it is always rendered inside Scene.
 */
function InsertedObjectRenderer({ object }) {
  const { mousePos, parallaxIntensity, mouseInfluence, scrollZ, groupOffset, editActive } =
    useContext(SceneContext);
  const { theme } = useTheme();

  const [posX, posY, posZ] = object.position;
  const pf = object.parallaxFactor;

  const mouseOffsetX = mousePos.x * mouseInfluence.x * pf * parallaxIntensity;
  const mouseOffsetY = mousePos.y * mouseInfluence.y * pf * parallaxIntensity;
  const gx = groupOffset?.x || 0;
  const gy = groupOffset?.y || 0;

  const transform = useMemo(
    () =>
      `translate3d(${posX + mouseOffsetX + gx}px, ${posY + mouseOffsetY + gy}px, ${posZ + scrollZ}px)`,
    [posX, posY, posZ, mouseOffsetX, mouseOffsetY, gx, gy, scrollZ],
  );

  let content = null;
  if (object.type === 'memory') {
    content = (
      <div
        style={{
          background: '#fff',
          borderRadius: '2px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          padding: '12px 12px 48px 12px',
          width: '220px',
          position: 'relative',
        }}
      >
        <img
          src={object.data.imageUrl}
          alt={object.data.caption || 'Memory'}
          style={{ width: '196px', height: '196px', objectFit: 'cover', display: 'block' }}
        />
        {object.data.caption && (
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontFamily: 'Georgia, serif',
              fontSize: '11px',
              color: '#555',
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
          width: '296px',
          height: '216px',
          overflow: 'hidden',
          boxShadow: '0 0 30px rgba(0,255,0,0.2)',
        }}
      >
        <iframe
          src={object.data.url}
          sandbox="allow-scripts allow-same-origin"
          style={{ width: '280px', height: '200px', border: 'none', display: 'block' }}
          title="Embedded content"
        />
      </div>
    );
  } else if (object.type === 'text') {
    content = (
      <div
        style={{
          background: `linear-gradient(135deg, ${theme.colors.background} 0%, rgba(0,0,0,0.8) 100%)`,
          border: `2px solid ${theme.colors.primary}`,
          borderRadius: '8px',
          padding: '20px',
          minWidth: '200px',
          maxWidth: '280px',
          boxShadow: `0 0 40px ${theme.colors.shadow}`,
        }}
      >
        {object.data.title && (
          <h2
            style={{
              color: theme.colors.text,
              margin: '0 0 8px 0',
              fontSize: '16px',
              fontFamily: theme.typography.fontDisplay,
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {object.data.title}
          </h2>
        )}
        {object.data.body && (
          <p
            style={{
              color: theme.colors.textMuted,
              margin: 0,
              fontSize: '12px',
              lineHeight: 1.6,
              fontFamily: theme.typography.fontBody,
            }}
          >
            {object.data.body}
          </p>
        )}
      </div>
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
        pointerEvents: editActive ? 'none' : 'none',
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
  onSave = null, // Called with { groupOffset: {x, y}, objects: [] } when save is clicked
  slug = '', // Scene slug, used for asset uploads
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
  const dragStartRef = useRef(null);

  // Dynamically inserted objects (persisted on Save)
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

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ groupOffset, objects: insertedObjects });
    }
  }, [onSave, groupOffset, insertedObjects]);

  const handleReset = useCallback(() => {
    setGroupOffset({ x: 0, y: 0 });
  }, []);

  // Called by InsertToolbar when user confirms a new object
  const handleInsert = useCallback((insertion) => {
    const defaults = {
      memory: { position: [0, 0, 0], parallaxFactor: 0.6, panelVariant: 'polaroid' },
      iframe: { position: [0, 0, 150], parallaxFactor: 0.85, panelVariant: 'monitor' },
      text: { position: [0, -100, 0], parallaxFactor: 0.6, panelVariant: 'default' },
    };
    const def = defaults[insertion.type] || defaults.text;
    const newObj = {
      id: `obj-${Date.now()}`,
      type: insertion.type,
      position: def.position,
      parallaxFactor: def.parallaxFactor,
      panelVariant: def.panelVariant,
      data: insertion.data,
    };
    setInsertedObjects((prev) => [...prev, newObj]);
  }, []);

  const hasPendingChanges =
    groupOffset.x !== 0 || groupOffset.y !== 0 || insertedObjects.length > 0;

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
                      disabled={!hasPendingChanges}
                      style={{
                        background: !hasPendingChanges ? '#555' : theme.colors.primary,
                        color: !hasPendingChanges ? '#999' : '#000',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        cursor: !hasPendingChanges ? 'not-allowed' : 'pointer',
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

                <InsertToolbar onInsert={handleInsert} slug={slug} />
              </div>
            )}
          </div>
        )}
      </div>
    </SceneContext.Provider>
  );
}

export default Scene;
