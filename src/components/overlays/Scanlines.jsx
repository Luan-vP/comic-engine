import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Scanlines - CRT monitor / TV effect
 */
export function Scanlines({ 
  intensity: intensityOverride,
  spacing = 4, // pixels between lines
  color = 'rgba(0, 0, 0, 0.8)',
  animate = false,
  speed = 30, // animation speed in seconds
}) {
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects.scanlines;

  if (intensity === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: animate ? '200%' : '100%',
        pointerEvents: 'none',
        zIndex: 9997,
        background: `repeating-linear-gradient(
          0deg,
          transparent,
          transparent ${spacing - 1}px,
          ${color} ${spacing - 1}px,
          ${color} ${spacing}px
        )`,
        opacity: intensity,
        animation: animate ? `scanlineMove ${speed}s linear infinite` : 'none',
      }}
    >
      <style>{`
        @keyframes scanlineMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}

export default Scanlines;
