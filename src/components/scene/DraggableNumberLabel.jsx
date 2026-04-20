import React, { useCallback } from 'react';

/**
 * DraggableNumberLabel - A label you can drag vertically to scrub the value.
 * Dragging up increases, dragging down decreases.
 */
export default function DraggableNumberLabel({
  children,
  value,
  onChange,
  sensitivity = 1,
  style,
}) {
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startVal = value;

      const handleMove = (moveE) => {
        const dy = startY - moveE.clientY; // up = positive
        onChange(Math.round(startVal + dy * sensitivity));
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [value, onChange, sensitivity],
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ cursor: 'ns-resize', userSelect: 'none', ...style }}
    >
      {children}
    </div>
  );
}
