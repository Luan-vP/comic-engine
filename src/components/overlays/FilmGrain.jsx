import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * FilmGrain - Animated noise overlay for that analog film look
 * Uses canvas for performant real-time noise generation
 */
export function FilmGrain({
  intensity: intensityOverride,
  speed = 60, // fps for grain animation
  monochrome = true,
  blendMode = 'overlay',
}) {
  const canvasRef = useRef(null);
  const { theme } = useTheme();
  const intensity = intensityOverride ?? theme.effects.filmGrain;

  useEffect(() => {
    if (intensity === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let lastTime = 0;
    const frameInterval = 1000 / speed;

    const resize = () => {
      canvas.width = window.innerWidth / 2; // Lower res for performance
      canvas.height = window.innerHeight / 2;
    };

    const generateNoise = (timestamp) => {
      if (timestamp - lastTime < frameInterval) {
        animationId = requestAnimationFrame(generateNoise);
        return;
      }
      lastTime = timestamp;

      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;

        if (monochrome) {
          data[i] = value; // R
          data[i + 1] = value; // G
          data[i + 2] = value; // B
        } else {
          data[i] = Math.random() * 255; // R
          data[i + 1] = Math.random() * 255; // G
          data[i + 2] = Math.random() * 255; // B
        }
        data[i + 3] = 255; // A
      }

      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(generateNoise);
    };

    resize();
    window.addEventListener('resize', resize);
    animationId = requestAnimationFrame(generateNoise);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [intensity, speed, monochrome]);

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
        zIndex: 9999,
        opacity: intensity,
        mixBlendMode: blendMode,
        imageRendering: 'pixelated',
      }}
    />
  );
}

export default FilmGrain;
