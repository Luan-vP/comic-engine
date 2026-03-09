import React, { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * SpeedLines - Radial motion lines converging toward center.
 * Classic manga/comic action effect. Canvas-based, static.
 */
export function SpeedLines({
  intensity: intensityOverride,
  lineCount = 80,
  color: colorOverride,
  focusX = 0.5,
  focusY = 0.45,
  innerRadius = 0.3,
  blendMode = 'screen',
}) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects.speedLines ?? 0;
  const color = colorOverride || theme.colors.text;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || intensity === 0) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * focusX;
    const cy = h * focusY;
    const maxRadius = Math.sqrt(w * w + h * h);
    const innerR = maxRadius * innerRadius;

    let s = 73;
    const rand = () => {
      s = (s * 16807 + 0) % 2147483647;
      return s / 2147483647;
    };

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';

    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2 + rand() * 0.05;

      // Vary where each line starts and ends
      const startR = innerR + rand() * innerR * 0.4;
      const endR = maxRadius * (0.7 + rand() * 0.3);

      const x1 = cx + Math.cos(angle) * startR;
      const y1 = cy + Math.sin(angle) * startR;
      const x2 = cx + Math.cos(angle) * endR;
      const y2 = cy + Math.sin(angle) * endR;

      // Thicker lines = more prominent
      const lineWidth = 0.5 + rand() * 2;
      const alpha = 0.15 + rand() * 0.35;

      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Fade center with radial gradient to keep focal area clear
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR * 1.2);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }, [intensity, lineCount, color, focusX, focusY, innerRadius]);

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
        zIndex: 9992,
        opacity: intensity,
        mixBlendMode: blendMode,
      }}
    />
  );
}

export default SpeedLines;
