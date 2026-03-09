import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Halftone - Ben-Day dot pattern overlay (classic comic book print effect).
 * Pure CSS — no canvas needed.
 */
export function Halftone({
  intensity: intensityOverride,
  dotSize = 2,
  spacing = 8,
  color = 'rgba(0, 0, 0, 0.8)',
  angle = 45,
  blendMode = 'multiply',
}) {
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects.halftone ?? 0;

  if (intensity === 0) return null;

  // Rotated dot grid using radial-gradient
  return (
    <div
      style={{
        position: 'fixed',
        top: '-10%',
        left: '-10%',
        width: '120%',
        height: '120%',
        pointerEvents: 'none',
        zIndex: 9993,
        opacity: intensity,
        mixBlendMode: blendMode,
        backgroundImage: `radial-gradient(circle, ${color} ${dotSize}px, transparent ${dotSize}px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}

export default Halftone;
