import React from 'react';
import { FilmGrain } from './FilmGrain';
import { Vignette } from './Vignette';
import { Scanlines } from './Scanlines';
import { Particles } from './Particles';
import { AsciiShader } from './AsciiShader';
import { InkSplatter } from './InkSplatter';
import { GraffitiSpray } from './GraffitiSpray';
import { Halftone } from './Halftone';
import { SpeedLines } from './SpeedLines';

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
  inkSplatter = false,
  graffitiSpray = false,
  halftone = false,
  speedLines = false,

  // Individual overrides
  filmGrainProps = {},
  vignetteProps = {},
  scanlinesProps = {},
  particlesProps = {},
  asciiProps = {},
  inkSplatterProps = {},
  graffitiSprayProps = {},
  halftoneProps = {},
  speedLinesProps = {},
}) {
  return (
    <>
      {ascii && <AsciiShader {...asciiProps} />}
      {filmGrain && <FilmGrain {...filmGrainProps} />}
      {vignette && <Vignette {...vignetteProps} />}
      {scanlines && <Scanlines {...scanlinesProps} />}
      {inkSplatter && <InkSplatter {...inkSplatterProps} />}
      {graffitiSpray && <GraffitiSpray {...graffitiSprayProps} />}
      {halftone && <Halftone {...halftoneProps} />}
      {speedLines && <SpeedLines {...speedLinesProps} />}
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
export {
  FilmGrain,
  Vignette,
  Scanlines,
  Particles,
  AsciiShader,
  InkSplatter,
  GraffitiSpray,
  Halftone,
  SpeedLines,
};

export default OverlayStack;
