import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useSceneStatic } from './Scene';
import { useGroup } from './SceneObjectGroup';

/**
 * SceneObject - Place any content in the 3D parallax space
 *
 * POSITIONING IN 3D SPACE:
 *
 * position: [x, y, z]
 *   - x: horizontal position (0 = center, negative = left, positive = right)
 *   - y: vertical position (0 = center, negative = up, positive = down)
 *   - z: depth (0 = camera plane, positive = deeper/further, negative = closer)
 *
 * rotation: [rx, ry, rz] (in degrees)
 *   - rx: Rotation around X axis (tilts top away/toward you)
 *         Positive = top tilts away (like a paper tilted back)
 *         Negative = top tilts toward you
 *   - ry: Rotation around Y axis (turns left/right like a door)
 *         Positive = right side comes toward you
 *         Negative = left side comes toward you
 *   - rz: Rotation around Z axis (2D rotation, like turning a steering wheel)
 *         Positive = clockwise
 *         Negative = counter-clockwise
 *
 * PARALLAX BEHAVIOR:
 * The parallaxFactor determines how much this object moves relative to mouse:
 *   - 0 = no movement (fixed background)
 *   - 0.5 = half movement (mid-ground)
 *   - 1 = full movement (foreground)
 *   - >1 = exaggerated movement (extreme foreground)
 *
 * Objects with lower Z naturally feel like background because perspective
 * makes them smaller. The parallaxFactor enhances this by controlling movement.
 *
 * ORIENTATION EXAMPLES FOR FLAT PANELS:
 *
 * Facing camera directly:        rotation={[0, 0, 0]}
 * Tilted back slightly:          rotation={[15, 0, 0]}
 * Angled like a book cover:      rotation={[0, -20, 0]}
 * Dutch angle (tilted):          rotation={[0, 0, 15]}
 * Epic hero shot (low angle):    rotation={[-25, 0, 0]}
 * Wall on the left:              rotation={[0, 60, 0]}
 * Floor beneath:                 rotation={[70, 0, 0]}
 *
 * PERFORMANCE NOTE:
 * scrollZ-driven transform/opacity updates are applied imperatively via a ref
 * (bypassing React reconciliation) to keep smooth 60fps scrolling even with
 * many SceneObjects in the tree. Props like position/rotation/scale still
 * flow through React as normal.
 */
export function SceneObject({
  children,
  position = [0, 0, 0], // [x, y, z]
  rotation = [0, 0, 0], // [rx, ry, rz] in degrees
  scale = 1,
  parallaxFactor = null, // null = auto-calculate from Z
  origin = 'center', // transform origin
  interactive = true, // whether to receive pointer events
  className = '',
  style = {},
  onClick,
  onHover,
  onDragStart, // Called with mousedown event when drag should begin (edit mode)

  // Anchor point relative to parent (alternative to absolute positioning)
  anchor = null, // 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | { x: '50%', y: '50%' }
}) {
  const {
    mousePos,
    parallaxIntensity,
    mouseInfluence,
    perspective,
    editActive,
    groupOffset: sceneGroupOffset,
    scrollZRef,
    subscribeScrollZ,
  } = useSceneStatic();
  // Prefer the nearest group's offset over the scene-level offset so each
  // SceneObjectGroup can move its children independently.
  const group = useGroup();
  const groupOffset = group?.groupOffset ?? sceneGroupOffset;

  const [x, y, z] = position;
  const [rx, ry, rz] = rotation;

  // Ref to the root DOM element — we imperatively update its transform and
  // opacity on scrollZ changes to avoid a React re-render per wheel tick.
  const elementRef = useRef(null);

  // Auto-calculate parallax factor from Z depth if not specified
  // Objects further back (positive Z) move less
  const effectiveParallax = useMemo(() => {
    if (parallaxFactor !== null) return parallaxFactor;
    // Map Z from [-500, 500] to parallax [1.2, 0.2]
    return 0.7 - z / 1000;
  }, [z, parallaxFactor]);

  // Calculate mouse-driven offset
  const mouseOffset = useMemo(
    () => ({
      x: mousePos.x * mouseInfluence.x * effectiveParallax * parallaxIntensity,
      y: mousePos.y * mouseInfluence.y * effectiveParallax * parallaxIntensity,
    }),
    [mousePos, mouseInfluence, effectiveParallax, parallaxIntensity],
  );

  // Calculate anchor position
  const anchorStyles = useMemo(() => {
    if (!anchor) {
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
      };
    }

    if (typeof anchor === 'object') {
      return {
        position: 'absolute',
        left: anchor.x,
        top: anchor.y,
      };
    }

    const anchorMap = {
      center: { left: '50%', top: '50%' },
      'top-left': { left: '10%', top: '10%' },
      'top-right': { left: '90%', top: '10%' },
      'bottom-left': { left: '10%', top: '90%' },
      'bottom-right': { left: '90%', top: '90%' },
      'top-center': { left: '50%', top: '10%' },
      'bottom-center': { left: '50%', top: '90%' },
      'left-center': { left: '10%', top: '50%' },
      'right-center': { left: '90%', top: '50%' },
    };

    return {
      position: 'absolute',
      ...(anchorMap[anchor] || anchorMap['center']),
    };
  }, [anchor]);

  // Apply group offset from edit mode
  const gx = groupOffset?.x || 0;
  const gy = groupOffset?.y || 0;

  // Z-depth culling uses React state so the node can be removed from the
  // tree when fully past the camera. We only toggle on threshold crossings,
  // not every wheel tick.
  const fadeStart = perspective * 0.4;
  const fadeEnd = perspective * 0.6;
  const [culled, setCulled] = useState(() => {
    const initialScrollZ = scrollZRef?.current ?? 0;
    return initialScrollZ - z >= fadeEnd;
  });

  // Helper: compute the rotation/scale tail of the transform string — this
  // never changes with scrollZ so we memoize it.
  const rotateScaleTail = useMemo(
    () =>
      `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
    [rx, ry, rz, scale],
  );

  // Helper: compute transform for a given scrollZ, using the latest
  // position/offset closure values.
  const buildTransform = (currentScrollZ) => {
    const tx = x + mouseOffset.x + gx;
    const ty = y + mouseOffset.y + gy;
    const tz = currentScrollZ - z;
    return `translate3d(${tx}px, ${ty}px, ${tz}px) ${rotateScaleTail}`;
  };

  // Helper: compute opacity for a given scrollZ.
  const computeOpacity = (currentScrollZ) => {
    const cssZ = currentScrollZ - z;
    if (cssZ <= fadeStart) return 1;
    if (cssZ >= fadeEnd) return 0;
    return 1 - (cssZ - fadeStart) / (fadeEnd - fadeStart);
  };

  // Imperatively sync transform + opacity + culling to the live scrollZ.
  // This effect runs once on mount and whenever any input that feeds the
  // transform (besides scrollZ itself) changes. Inside, we subscribe to
  // scrollZ updates so we can mutate the DOM directly without React re-renders.
  useEffect(() => {
    if (!subscribeScrollZ || !scrollZRef) return undefined;

    const applyScrollZ = (currentScrollZ) => {
      const el = elementRef.current;
      if (!el) return;

      const cssZ = currentScrollZ - z;
      const shouldCull = cssZ >= fadeEnd;
      if (shouldCull) {
        // Defer to React to unmount on transition into culled state so
        // pointer events and children are released.
        setCulled((prev) => (prev ? prev : true));
        return;
      }
      // If we were culled and have returned to view, let React re-mount.
      // We intentionally do not early-return above for prev=false path.
      el.style.transform = buildTransform(currentScrollZ);
      el.style.opacity = computeOpacity(currentScrollZ);
    };

    // Initial sync using the current ref value (accurate for both mounted
    // and remounted nodes).
    const initial = scrollZRef.current ?? 0;
    const initiallyCulled = initial - z >= fadeEnd;
    if (initiallyCulled) {
      setCulled(true);
    } else {
      // Ensure culled flag is cleared when we come back into range.
      setCulled(false);
      const el = elementRef.current;
      if (el) {
        el.style.transform = buildTransform(initial);
        el.style.opacity = computeOpacity(initial);
      }
    }

    const unsubscribe = subscribeScrollZ(applyScrollZ);
    return unsubscribe;
    // Re-subscribe when anything that feeds the transform / culling threshold
    // changes. scrollZ itself is intentionally not in this list — it is read
    // imperatively from the ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    x,
    y,
    z,
    rotateScaleTail,
    mouseOffset,
    gx,
    gy,
    fadeStart,
    fadeEnd,
    subscribeScrollZ,
    scrollZRef,
  ]);

  if (culled) return null;

  // Compute the initial transform/opacity using the latest ref value so the
  // first paint is correct. Subsequent scrollZ updates are applied imperatively
  // by the effect above.
  const initialScrollZ = scrollZRef?.current ?? 0;
  const initialTransform = buildTransform(initialScrollZ);
  const initialOpacity = computeOpacity(initialScrollZ);

  return (
    <div
      ref={elementRef}
      className={className}
      onClick={onClick}
      onMouseDown={
        editActive && (onClick || onDragStart)
          ? (e) => {
              e.stopPropagation();
              if (onDragStart) onDragStart(e);
            }
          : undefined
      }
      onMouseEnter={onHover ? () => onHover(true) : undefined}
      onMouseLeave={onHover ? () => onHover(false) : undefined}
      style={{
        ...anchorStyles,
        transform: initialTransform,
        transformStyle: 'preserve-3d',
        transformOrigin: origin,
        opacity: initialOpacity,
        pointerEvents: editActive ? (onClick ? 'auto' : 'none') : interactive ? 'auto' : 'none',
        cursor: editActive && onClick ? 'pointer' : undefined,
        transition: editActive ? 'none' : 'transform 0.1s ease-out, opacity 0.2s ease-out',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Preset configurations for common object placements
 */
export const ObjectPresets = {
  // Background elements - far away, minimal parallax
  farBackground: {
    position: [0, 0, 400],
    parallaxFactor: 0.1,
  },

  // Standard background
  background: {
    position: [0, 0, 200],
    parallaxFactor: 0.3,
  },

  // Midground - default depth
  midground: {
    position: [0, 0, 0],
    parallaxFactor: 0.6,
  },

  // Foreground - close to camera
  foreground: {
    position: [0, 0, -150],
    parallaxFactor: 0.9,
  },

  // Extreme foreground - things passing very close
  nearForeground: {
    position: [0, 0, -300],
    parallaxFactor: 1.2,
  },

  // Wall on left side of scene
  leftWall: {
    position: [-300, 0, 0],
    rotation: [0, 45, 0],
    parallaxFactor: 0.5,
  },

  // Wall on right side of scene
  rightWall: {
    position: [300, 0, 0],
    rotation: [0, -45, 0],
    parallaxFactor: 0.5,
  },

  // Floor element
  floor: {
    position: [0, 200, 100],
    rotation: [60, 0, 0],
    parallaxFactor: 0.4,
  },

  // Dramatic tilt
  heroShot: {
    position: [0, 50, 0],
    rotation: [-15, 5, -5],
    parallaxFactor: 0.7,
  },
};

export default SceneObject;
