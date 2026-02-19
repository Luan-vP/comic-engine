import React, { useState, useCallback, useContext, createContext, useEffect, useRef } from 'react';
import { useScene } from './Scene';
import { useTheme } from '../../theme/ThemeContext';

/**
 * GroupContext - shared by all SceneObjects inside a SceneObjectGroup.
 * null when a SceneObject is not inside any group.
 */
const GroupContext = createContext(null);

/**
 * useGroup - reads the nearest GroupContext.
 * Returns null when called outside a SceneObjectGroup.
 */
export function useGroup() {
  return useContext(GroupContext);
}

/**
 * SceneObjectGroup - wraps SceneObjects into an independently-draggable group.
 *
 * Each group:
 * - Has its own drag state (groupOffset) independent of other groups and of the
 *   scene-level drag fallback.
 * - Defines a z-range that child layers can be auto-arranged within (by the
 *   page template generator at code-generation time).
 * - Is click-selectable in edit mode (visual outline); only one group is
 *   selected at a time (managed via SceneContext's selectedGroupId).
 * - Stops mouse-down propagation to the scene container so dragging a group
 *   does not also trigger the scene-level drag.
 *
 * Props:
 *   zRange    - { far: number, near: number } z-range for child arrangement
 *   position  - [x, y, z] static base-position offset applied to the wrapper
 *   draggable - whether dragging is enabled in edit mode (default true)
 *   groupId   - string identifier matching scene.json's groupId field
 */
export function SceneObjectGroup({
  children,
  zRange = { far: -400, near: -200 },
  position = [0, 0, 0],
  draggable = true,
  groupId,
}) {
  const { editActive, selectedGroupId, setSelectedGroupId, registerGroupOffset } = useScene();
  const { theme } = useTheme();

  // Per-group drag offset, independent of other groups
  const [groupOffset, setGroupOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);

  const isSelected = editActive && selectedGroupId === groupId;

  const handleMouseDown = useCallback(
    (e) => {
      if (!editActive || !draggable) return;
      // Prevent scene-level drag from also firing
      e.stopPropagation();
      e.preventDefault();

      // Select this group so other groups deselect visually
      setSelectedGroupId(groupId);

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - groupOffset.x,
        y: e.clientY - groupOffset.y,
      };
    },
    [editActive, draggable, groupId, setSelectedGroupId, groupOffset],
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

  // Report this group's drag offset to the Scene so handleSave can collect all offsets.
  useEffect(() => {
    if (registerGroupOffset && groupId) {
      registerGroupOffset(groupId, editActive ? groupOffset : { x: 0, y: 0 });
    }
  }, [registerGroupOffset, groupId, groupOffset, editActive]);

  const [px, py, pz = 0] = position;

  // Expose offset to children (zero when not in edit mode so parallax is unaffected)
  const contextValue = {
    groupOffset: editActive ? groupOffset : { x: 0, y: 0 },
    groupId,
    zRange,
    position,
  };

  return (
    <GroupContext.Provider value={contextValue}>
      <div
        onMouseDown={editActive && draggable ? handleMouseDown : undefined}
        style={{
          // Fill the scene container so child SceneObjects (position: absolute,
          // left: 50%, top: 50%) stay centered as in an ungrouped scene.
          position: 'absolute',
          inset: 0,
          // Static base-position offset from the position prop
          transform: `translate3d(${px}px, ${py}px, ${pz}px)`,
          // Preserve the 3D transform chain for child SceneObjects
          transformStyle: 'preserve-3d',
          // Visual selection highlight in edit mode
          outline: isSelected ? `2px dashed ${theme.colors.primary}` : 'none',
          cursor: editActive && draggable ? (isDragging ? 'grabbing' : 'grab') : 'default',
          // Allow pointer events in edit mode for drag; transparent otherwise
          pointerEvents: editActive && draggable ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </GroupContext.Provider>
  );
}

export default SceneObjectGroup;
