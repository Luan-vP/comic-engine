import React, { useState, useRef, useMemo, Children, cloneElement } from 'react';
import { useScene } from './Scene';

/**
 * SceneObjectGroup - Container for multiple SceneObjects with custom z-range
 *
 * Groups allow you to define a custom z-range for a set of layers, keeping them
 * contained within a specific depth slice. The group itself can be positioned
 * and optionally dragged, moving all child layers together.
 *
 * USAGE:
 * <SceneObjectGroup
 *   zRange={{ far: -400, near: -200 }}
 *   position={[0, 0, 0]}
 *   draggable={true}
 *   arrangement={fillRangeArrangement}
 * >
 *   <SceneObject>{layer1}</SceneObject>
 *   <SceneObject>{layer2}</SceneObject>
 *   <SceneObject>{layer3}</SceneObject>
 * </SceneObjectGroup>
 *
 * BEHAVIOR:
 * - Child SceneObjects are automatically arranged within the zRange
 * - The arrangement function distributes children across the z-range
 * - position offsets all children (acts as transform parent)
 * - If draggable=true, pointer events allow click-and-drag repositioning
 * - Parallax is calculated per-layer based on their effective z position
 *
 * ARRANGEMENT:
 * The arrangement function receives the child count and should return an array
 * of z-positions. Default is fillRangeArrangement which evenly spaces children
 * across the entire z-range.
 */
export function SceneObjectGroup({
  children,
  zRange = { far: -400, near: 200 }, // Z bounds for this group
  position = [0, 0, 0], // Group position offset [x, y, z]
  draggable = false, // Enable click-and-drag
  arrangement = null, // Z-arrangement function (count) => number[]
  className = '',
  style = {},
  onDragStart,
  onDragEnd,
}) {
  const { mousePos, mouseInfluence, parallaxIntensity } = useScene();
  const [groupPosition, setGroupPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState(null);
  const [initialGroupPos, setInitialGroupPos] = useState(null);
  const containerRef = useRef(null);

  const childArray = Children.toArray(children);
  const childCount = childArray.length;

  // Default arrangement: fillRangeArrangement-style distribution
  const getZPositions = useMemo(() => {
    if (arrangement) {
      return arrangement(childCount, { far: zRange.far, near: zRange.near });
    }

    // Default: evenly distribute across the z-range
    if (childCount <= 1) return [zRange.far];
    const step = (zRange.near - zRange.far) / (childCount - 1);
    return Array.from({ length: childCount }, (_, i) => zRange.far + i * step);
  }, [arrangement, childCount, zRange.far, zRange.near]);

  // Pointer event handlers for drag
  const handlePointerDown = (e) => {
    if (!draggable) return;

    setIsDragging(true);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setInitialGroupPos([...groupPosition]);

    // Capture pointer to track movement outside element
    e.currentTarget.setPointerCapture(e.pointerId);

    if (onDragStart) onDragStart(groupPosition);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStartPos || !initialGroupPos) return;

    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;

    // Update group position based on drag delta
    setGroupPosition([
      initialGroupPos[0] + deltaX,
      initialGroupPos[1] + deltaY,
      initialGroupPos[2], // Keep Z constant during drag
    ]);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;

    setIsDragging(false);
    setDragStartPos(null);
    setInitialGroupPos(null);

    e.currentTarget.releasePointerCapture(e.pointerId);

    if (onDragEnd) onDragEnd(groupPosition);
  };

  // Clone children and inject group-relative positions
  const arrangedChildren = useMemo(() => {
    return childArray.map((child, index) => {
      const zPosition = getZPositions[index] || zRange.far;

      // Calculate parallax factor based on effective z position
      const effectiveZ = groupPosition[2] + zPosition;
      const parallaxFactor = 0.7 + (effectiveZ / 1000);

      // Override child's position to be relative to group
      const childPosition = [
        (child.props.position?.[0] || 0) + groupPosition[0],
        (child.props.position?.[1] || 0) + groupPosition[1],
        zPosition + groupPosition[2],
      ];

      return cloneElement(child, {
        position: childPosition,
        parallaxFactor: child.props.parallaxFactor ?? parallaxFactor,
        key: child.key || `group-child-${index}`,
      });
    });
  }, [childArray, getZPositions, groupPosition, zRange.far]);

  return (
    <div
      ref={containerRef}
      className={className}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: draggable ? 'auto' : 'none',
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'none', // Prevent default touch behaviors
        ...style,
      }}
    >
      {arrangedChildren}
    </div>
  );
}

/**
 * Preset group configurations for common use cases
 */
export const GroupPresets = {
  // Background layer group
  backgroundGroup: {
    zRange: { far: -500, near: -300 },
    position: [0, 0, 0],
  },

  // Midground layer group
  midgroundGroup: {
    zRange: { far: -200, near: 0 },
    position: [0, 0, 0],
  },

  // Foreground layer group
  foregroundGroup: {
    zRange: { far: 50, near: 250 },
    position: [0, 0, 0],
  },

  // Tight stacking (minimal depth separation)
  tightStack: {
    zRange: { far: -50, near: 50 },
    position: [0, 0, 0],
  },
};

export default SceneObjectGroup;
