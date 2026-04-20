import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * FilmGrain - Animated noise overlay for that analog film look
 * Uses canvas for performant real-time noise generation.
 *
 * Performance note: the backing ImageData buffer (~2MB at typical sizes)
 * is allocated once per canvas size and reused across animation frames.
 * Only on resize do we allocate a new buffer. Previously, createImageData
 * was called every frame, producing garbage and GC pressure.
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

    // Reused ImageData buffer. Reallocated only on resize (or first frame).
    let imageData = null;

    const resize = () => {
      canvas.width = window.innerWidth / 2; // Lower res for performance
      canvas.height = window.innerHeight / 2;
      // Invalidate cached buffer so it is reallocated at the new size on
      // the next frame.
      imageData = null;
    };

    const generateNoise = (timestamp) => {
      if (timestamp - lastTime < frameInterval) {
        animationId = requestAnimationFrame(generateNoise);
        return;
      }
      lastTime = timestamp;

      // Lazily (re)allocate buffer on first frame and after resize.
      if (
        !imageData ||
        imageData.width !== canvas.width ||
        imageData.height !== canvas.height
      ) {
        imageData = ctx.createImageData(canvas.width, canvas.height);
        // Alpha channel is constant — initialize once so the hot loop
        // below can skip writing it.
        const data = imageData.data;
        for (let i = 3; i < data.length; i += 4) {
          data[i] = 255;
        }
      }

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
        // Alpha already set to 255 at allocation time.
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
