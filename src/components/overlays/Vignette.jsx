import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Vignette - Darkened edges for dramatic framing
 */
export function Vignette({
  intensity: intensityOverride,
  color = 'black',
  shape = 'ellipse', // 'ellipse' | 'rectangle'
  spread = 50, // percentage - how far the vignette extends inward
}) {
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects.vignette;

  if (intensity === 0) return null;

  const gradient =
    shape === 'ellipse'
      ? `radial-gradient(ellipse at center, transparent 0%, transparent ${100 - spread}%, ${color} 100%)`
      : `
        linear-gradient(to right, ${color}, transparent ${spread}%, transparent ${100 - spread}%, ${color}),
        linear-gradient(to bottom, ${color}, transparent ${spread}%, transparent ${100 - spread}%, ${color})
      `;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9998,
        background: gradient,
        opacity: intensity,
      }}
    />
  );
}

export default Vignette;
