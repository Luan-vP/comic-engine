import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useTheme } from '../../theme/ThemeContext';

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
export function Scene({
  children,
  perspective = 1000, // Lower = more dramatic perspective
  parallaxIntensity = 1, // Global multiplier for mouse movement
  mouseInfluence = { x: 50, y: 30 }, // Max pixels of movement
  scrollEnabled = false, // Enable scroll-based Z movement
  scrollDepth = 500, // How much Z changes on scroll
  editable = false, // Show edit mode checkbox
  onSave = null, // Called with { groupOffset: {x, y} } when save is clicked
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
    Object.values(groupOffsets).some((o) => o.x !== 0 || o.y !== 0);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({ groupOffset, groupOffsets });
    }
  }, [onSave, groupOffset, groupOffsets]);

  const handleReset = useCallback(() => {
    setGroupOffset({ x: 0, y: 0 });
    setGroupOffsets({});
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
              </div>
            )}
          </div>
        )}
      </div>
    </SceneContext.Provider>
  );
}

export default Scene;
