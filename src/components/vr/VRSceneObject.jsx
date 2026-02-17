import React, { useMemo } from 'react';
import { useScene } from '../scene/Scene';
import { useVR } from './VRScene';

/**
 * VRSceneObject - SceneObject that works in both regular and VR modes
 *
 * When in VR mode, uses device orientation for parallax instead of mouse.
 * Otherwise behaves identically to the regular SceneObject.
 *
 * This is a drop-in replacement for SceneObject that adds VR support.
 */
export function VRSceneObject({
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  parallaxFactor = null,
  origin = 'center',
  interactive = true,
  className = '',
  style = {},
  onClick,
  onHover,
  anchor = null,
}) {
  const sceneContext = useScene();
  const vrContext = useVR();

  const [x, y, z] = position;
  const [rx, ry, rz] = rotation;

  // Determine if we're in VR mode
  const isVRMode = vrContext?.isVRMode || false;

  // Get parallax position from either VR orientation or mouse
  const parallaxPos = isVRMode ? vrContext.parallaxPos : sceneContext.mousePos;
  const mouseInfluence = sceneContext?.mouseInfluence || { x: 50, y: 30 };
  const parallaxIntensity = sceneContext?.parallaxIntensity || 1;
  const scrollZ = sceneContext?.scrollZ || 0;

  // Auto-calculate parallax factor from Z depth if not specified
  const effectiveParallax = useMemo(() => {
    if (parallaxFactor !== null) return parallaxFactor;
    return 0.7 + z / 1000;
  }, [z, parallaxFactor]);

  // Calculate parallax offset
  const parallaxOffset = useMemo(
    () => ({
      x: parallaxPos.x * mouseInfluence.x * effectiveParallax * parallaxIntensity,
      y: parallaxPos.y * mouseInfluence.y * effectiveParallax * parallaxIntensity,
    }),
    [parallaxPos, mouseInfluence, effectiveParallax, parallaxIntensity]
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

  // Build the 3D transform
  const transform = useMemo(() => {
    const parts = [
      `translate3d(${x + parallaxOffset.x}px, ${y + parallaxOffset.y}px, ${z + scrollZ}px)`,
      `rotateX(${rx}deg)`,
      `rotateY(${ry}deg)`,
      `rotateZ(${rz}deg)`,
      `scale(${scale})`,
    ];
    return parts.join(' ');
  }, [x, y, z, rx, ry, rz, scale, parallaxOffset, scrollZ]);

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
        pointerEvents: interactive ? 'auto' : 'none',
        transition: 'transform 0.1s ease-out',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default VRSceneObject;
