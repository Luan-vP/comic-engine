import React from 'react';
import { FilmGrain } from './FilmGrain';
import { Vignette } from './Vignette';
import { Scanlines } from './Scanlines';
import { Particles } from './Particles';
import { AsciiShader } from './AsciiShader';

/**
 * OverlayStack - Master controller for all visual overlays
 * Drop this once at the app level and all overlays are managed
 */
export function OverlayStack({
  filmGrain = true,
  vignette = true,
  scanlines = true,
  particles = null, // null = disabled, or preset name / config object
  ascii = false, // ASCII shader overlay

  // Individual overrides
  filmGrainProps = {},
  vignetteProps = {},
  scanlinesProps = {},
  particlesProps = {},
  asciiProps = {},
}) {
  return (
    <>
      {ascii && <AsciiShader {...asciiProps} />}
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
export { FilmGrain, Vignette, Scanlines, Particles, AsciiShader };

export default OverlayStack;
