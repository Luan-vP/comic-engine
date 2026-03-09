import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * GraffitiSpray - Spray paint texture overlay with stencil-like marks.
 * Canvas-based, static (redrawn on resize only).
 */
export function GraffitiSpray({ intensity: intensityOverride, blendMode = 'screen' }) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects.graffitiSpray ?? 0;
  const color = theme.colors.primary;
  const accentColor = theme.colors.accent;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || intensity === 0) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    let s = 137;
    const rand = () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };

    // Spray cloud — dense cluster of tiny dots fading at edges
    const sprayCloud = (cx, cy, radius, clr, density) => {
      for (let i = 0; i < density; i++) {
        const angle = rand() * Math.PI * 2;
        // Gaussian-ish distribution: sum of randoms
        const dist = ((rand() + rand() + rand()) / 3) * radius;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const size = 0.5 + rand() * 2;
        const alpha = Math.max(0, 1 - dist / radius) * (0.3 + rand() * 0.7);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = clr;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    // Spray streak — elongated spray along a direction
    const sprayStreak = (x1, y1, x2, y2, width, clr, density) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len;
      const ny = dx / len;

      for (let i = 0; i < density; i++) {
        const t = rand();
        const spread = (rand() - 0.5) * width;
        const px = x1 + dx * t + nx * spread;
        const py = y1 + dy * t + ny * spread;
        const size = 0.5 + rand() * 1.5;
        const alpha = (0.2 + rand() * 0.6) * Math.max(0, 1 - Math.abs(spread) / (width * 0.5));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = clr;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    // Place spray marks in corners and edges
    const marks = [
      // Top-left corner spray clouds
      { cx: w * 0.08, cy: h * 0.06, r: 60, clr: color, d: 400 },
      { cx: w * 0.12, cy: h * 0.1, r: 35, clr: accentColor, d: 200 },
      // Bottom-right corner
      { cx: w * 0.92, cy: h * 0.9, r: 70, clr: color, d: 500 },
      { cx: w * 0.88, cy: h * 0.85, r: 30, clr: accentColor, d: 150 },
      // Top-right scattered
      { cx: w * 0.85, cy: h * 0.08, r: 45, clr: accentColor, d: 300 },
      // Bottom-left
      { cx: w * 0.1, cy: h * 0.88, r: 50, clr: color, d: 350 },
    ];

    marks.forEach(({ cx, cy, r, clr, d }) => {
      sprayCloud(cx, cy, r, clr, d);
    });

    // Spray streaks along edges
    sprayStreak(w * 0.02, h * 0.15, w * 0.02, h * 0.45, 20, color, 300);
    sprayStreak(w * 0.98, h * 0.55, w * 0.98, h * 0.8, 15, accentColor, 200);
    sprayStreak(w * 0.2, h * 0.98, w * 0.5, h * 0.98, 12, color, 250);

    // Drip from a spray cloud
    const drips = [
      { x: w * 0.08, startY: h * 0.08, len: 80, clr: color },
      { x: w * 0.92, startY: h * 0.92, len: -60, clr: color },
    ];

    drips.forEach(({ x, startY, len, clr }) => {
      const steps = Math.abs(len);
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const py = startY + (len > 0 ? i : -i);
        const width = (1 - t * 0.7) * 3;
        const alpha = (1 - t) * 0.6;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = clr;
        ctx.beginPath();
        ctx.arc(x + Math.sin(i * 0.1) * 2, py, width, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1;
  }, [intensity, color, accentColor]);

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
        zIndex: 9994,
        opacity: intensity,
        mixBlendMode: blendMode,
      }}
    />
  );
}

export default GraffitiSpray;
