import React from 'react';
import { FilmGrain } from './FilmGrain';
import { Vignette } from './Vignette';
import { Scanlines } from './Scanlines';
import { Particles } from './Particles';

/**
 * OverlayStack - Master controller for all visual overlays
 * Drop this once at the app level and all overlays are managed
 */
export function OverlayStack({
  filmGrain = true,
  vignette = true,
  scanlines = true,
  particles = null, // null = disabled, or preset name / config object
  
  // Individual overrides
  filmGrainProps = {},
  vignetteProps = {},
  scanlinesProps = {},
  particlesProps = {},
}) {
  return (
    <>
      {filmGrain && <FilmGrain {...filmGrainProps} />}
      {vignette && <Vignette {...vignetteProps} />}
      {scanlines && <Scanlines {...scanlinesProps} />}
      {particles && (
        <Particles
          preset={typeof particles === 'string' ? particles : 'dust'}
          {...(typeof particles === 'object' ? particles : {})}
          {...particlesProps}
        />
      )}
    </>
  );
}

// Re-export individual components for granular control
export { FilmGrain, Vignette, Scanlines, Particles };

export default OverlayStack;
