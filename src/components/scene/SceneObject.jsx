import React, { useMemo } from 'react';
import { useScene } from './Scene';
import { useGroup } from './SceneObjectGroup';

/**
 * SceneObject - Place any content in the 3D parallax space
 *
 * POSITIONING IN 3D SPACE:
 *
 * position: [x, y, z]
 *   - x: horizontal position (0 = center, negative = left, positive = right)
 *   - y: vertical position (0 = center, negative = up, positive = down)
 *   - z: depth (negative = background/far, 0 = mid, positive = foreground/near)
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

  // Anchor point relative to parent (alternative to absolute positioning)
  anchor = null, // 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | { x: '50%', y: '50%' }
}) {
  const {
    mousePos,
    scrollZ,
    parallaxIntensity,
    mouseInfluence,
    editActive,
    groupOffset: sceneGroupOffset,
  } = useScene();
  // Prefer the nearest group's offset over the scene-level offset so each
  // SceneObjectGroup can move its children independently.
  const group = useGroup();
  const groupOffset = group?.groupOffset ?? sceneGroupOffset;

  const [x, y, z] = position;
  const [rx, ry, rz] = rotation;

  // Auto-calculate parallax factor from Z depth if not specified
  // Objects further back (negative Z) move less
  const effectiveParallax = useMemo(() => {
    if (parallaxFactor !== null) return parallaxFactor;
    // Map Z from [-500, 500] to parallax [0.2, 1.2]
    return 0.7 + z / 1000;
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

  // Build the 3D transform
  const transform = useMemo(() => {
    const parts = [
      // First translate to position (including mouse offset and group drag offset)
      `translate3d(${x + mouseOffset.x + gx}px, ${y + mouseOffset.y + gy}px, ${z + scrollZ}px)`,
      // Then apply rotations
      `rotateX(${rx}deg)`,
      `rotateY(${ry}deg)`,
      `rotateZ(${rz}deg)`,
      // Finally scale
      `scale(${scale})`,
    ];
    return parts.join(' ');
  }, [x, y, z, rx, ry, rz, scale, mouseOffset, scrollZ, gx, gy]);

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={onHover ? () => onHover(true) : undefined}
      onMouseLeave={onHover ? () => onHover(false) : undefined}
      style={{
        ...anchorStyles,
        transform,
        transformStyle: 'preserve-3d',
        transformOrigin: origin,
        pointerEvents: editActive ? 'none' : interactive ? 'auto' : 'none',
        transition: editActive ? 'none' : 'transform 0.1s ease-out',
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
    position: [0, 0, -400],
    parallaxFactor: 0.1,
  },

  // Standard background
  background: {
    position: [0, 0, -200],
    parallaxFactor: 0.3,
  },

  // Midground - default depth
  midground: {
    position: [0, 0, 0],
    parallaxFactor: 0.6,
  },

  // Foreground - close to camera
  foreground: {
    position: [0, 0, 150],
    parallaxFactor: 0.9,
  },

  // Extreme foreground - things passing very close
  nearForeground: {
    position: [0, 0, 300],
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
    position: [0, 200, -100],
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
