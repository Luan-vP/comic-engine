import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * AsciiShader - ASCII character overlay for retro/terminal aesthetic
 * Uses canvas to render a grid of ASCII characters based on noise sampling
 */

// Character sets ordered from dense/dark to sparse/light
const CHARSETS = {
  standard: '@%#*+=-:. ',           // 10 chars, classic ASCII
  simple: '@#*-. ',                  // 6 chars, more performant
  blocks: '█▓▒░ ',                   // 5 chars, solid blocks
  matrix: 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ01 ',  // Matrix style
};

export function AsciiShader({
  intensity: intensityOverride,
  charset = 'standard',
  cellWidth = 8,
  cellHeight = 16,
  fontSize = 12,
  color: colorOverride,
  blendMode = 'overlay',
  refreshRate = 20, // fps for updates
}) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects?.asciiShader ?? 0;
  const color = colorOverride ?? theme.colors?.text ?? '#ffffff';

  useEffect(() => {
    if (intensity === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = 0;
    const frameInterval = 1000 / refreshRate;
    let cols = 0;
    let rows = 0;

    // Get character set
    const charsetString = typeof charset === 'string'
      ? (CHARSETS[charset] || charset)
      : charset;
    const chars = charsetString.split('');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Calculate grid dimensions
      cols = Math.floor(canvas.width / cellWidth);
      rows = Math.floor(canvas.height / cellHeight);

      // Limit max columns for performance
      if (cols > 150) {
        const scale = 150 / cols;
        cols = 150;
        rows = Math.floor(rows * scale);
      }

      // Set up font
      ctx.font = `${fontSize}px ${theme.typography?.fontBody || 'monospace'}`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = color;
    };

    // Simple noise function using sine waves
    const noise = (x, y, time) => {
      const freq1 = 0.05;
      const freq2 = 0.03;
      const timeScale = 0.0002;

      const n1 = Math.sin(x * freq1 + time * timeScale) *
                 Math.cos(y * freq1 + time * timeScale);
      const n2 = Math.sin(x * freq2 - time * timeScale * 0.5) *
                 Math.cos(y * freq2 - time * timeScale * 0.5);
      const n3 = Math.sin((x + y) * 0.02 + time * timeScale * 1.5);

      return (n1 + n2 * 0.5 + n3 * 0.3) / 1.8; // Range: -1 to 1
    };

    // Generate brightness map and render ASCII
    const render = (timestamp) => {
      if (timestamp - lastTime < frameInterval) {
        animationId = requestAnimationFrame(render);
        return;
      }
      lastTime = timestamp;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate center for gradient
      const centerX = cols / 2;
      const centerY = rows / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      // Render character grid
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Generate noise-based brightness
          const noiseValue = noise(x, y, timestamp);

          // Add radial gradient (lighter center, darker edges)
          const dx = x - centerX;
          const dy = y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const gradient = 1 - (dist / maxDist) * 0.5;

          // Combine noise and gradient: -1 to 1 range -> 0 to 1
          let brightness = (noiseValue * 0.7 + gradient * 0.3 + 1) / 2;
          brightness = Math.max(0, Math.min(1, brightness));

          // Map brightness to character index
          const charIndex = Math.floor(brightness * (chars.length - 1));
          const char = chars[charIndex];

          // Render character
          const px = x * cellWidth;
          const py = y * cellHeight;
          ctx.fillText(char, px, py);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [intensity, charset, cellWidth, cellHeight, fontSize, color, refreshRate, theme]);

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
        zIndex: 9996,
        opacity: intensity,
        mixBlendMode: blendMode,
      }}
    />
  );
}

export default AsciiShader;
