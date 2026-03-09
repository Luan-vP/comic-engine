import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * InkSplatter - Random ink blots and drips along edges and corners.
 * Canvas-based, redrawn on resize. Static (no animation loop).
 */
export function InkSplatter({
  intensity: intensityOverride,
  color = 'rgba(0, 0, 0, 0.9)',
  count = 12,
  blendMode = 'multiply',
}) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects.inkSplatter ?? 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || intensity === 0) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Seeded random for consistent look per session
    const seed = 42;
    let s = seed;
    const rand = () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };

    ctx.fillStyle = color;

    for (let i = 0; i < count; i++) {
      // Cluster splatters near edges
      const edge = Math.floor(rand() * 4);
      let cx, cy;
      const margin = 0.15;
      if (edge === 0) {
        cx = rand() * w;
        cy = rand() * h * margin;
      } else if (edge === 1) {
        cx = rand() * w;
        cy = h - rand() * h * margin;
      } else if (edge === 2) {
        cx = rand() * w * margin;
        cy = rand() * h;
      } else {
        cx = w - rand() * w * margin;
        cy = rand() * h;
      }

      const baseRadius = 15 + rand() * 40;

      // Main blob — irregular shape via overlapping circles
      const blobCount = 4 + Math.floor(rand() * 6);
      ctx.beginPath();
      for (let b = 0; b < blobCount; b++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * baseRadius * 0.6;
        const bx = cx + Math.cos(angle) * dist;
        const by = cy + Math.sin(angle) * dist;
        const br = baseRadius * (0.3 + rand() * 0.7);
        ctx.moveTo(bx + br, by);
        ctx.arc(bx, by, br, 0, Math.PI * 2);
      }
      ctx.fill();

      // Drip lines extending downward
      const dripCount = Math.floor(rand() * 3);
      for (let d = 0; d < dripCount; d++) {
        const dx = cx + (rand() - 0.5) * baseRadius;
        const dripLen = 30 + rand() * 80;
        const dripWidth = 1.5 + rand() * 3;
        ctx.beginPath();
        ctx.moveTo(dx, cy + baseRadius * 0.5);
        // Slightly wavy drip
        const midX = dx + (rand() - 0.5) * 6;
        ctx.quadraticCurveTo(
          midX,
          cy + baseRadius * 0.5 + dripLen * 0.5,
          dx + (rand() - 0.5) * 2,
          cy + baseRadius * 0.5 + dripLen,
        );
        ctx.lineWidth = dripWidth;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Drip terminal blob
        ctx.beginPath();
        ctx.arc(
          dx + (rand() - 0.5) * 2,
          cy + baseRadius * 0.5 + dripLen,
          dripWidth * 1.2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      // Tiny satellite dots
      const dotCount = 3 + Math.floor(rand() * 8);
      for (let d = 0; d < dotCount; d++) {
        const angle = rand() * Math.PI * 2;
        const dist = baseRadius + rand() * baseRadius * 1.5;
        const dx = cx + Math.cos(angle) * dist;
        const dy = cy + Math.sin(angle) * dist;
        const dr = 1 + rand() * 3;
        ctx.beginPath();
        ctx.arc(dx, dy, dr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [intensity, color, count]);

  useEffect(() => {
    if (intensity === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      draw();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [intensity, draw]);

  if (intensity === 0) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9995,
        opacity: intensity,
        mixBlendMode: blendMode,
      }}
    />
  );
}

export default InkSplatter;
