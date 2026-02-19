import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * VRViewer - Side-by-side stereoscopic renderer for Google Cardboard / phone VR headsets
 *
 * Renders the provided layers twice — once for each eye — with slightly different
 * CSS perspectiveOrigin offsets to simulate the stereo separation between eyes.
 * Head tracking uses the DeviceOrientation API (gyroscope/accelerometer), with a
 * mouse-position fallback for desktop.
 *
 * Props:
 *   layers         {Array}  - Array of layer objects to render (see shape below)
 *   perspective    {number} - CSS perspective depth in px (default 1000)
 *   mouseInfluence {object} - Max parallax offset { x, y } in px (default { x: 50, y: 30 })
 *   stereoOffset   {number} - How far to shift each eye's perspectiveOrigin from centre
 *                             (percentage points, default 7)
 *
 * Layer shape:
 *   {
 *     id:            string   — unique key
 *     content:       ReactNode — what to render at this layer
 *     position:      [x, y, z] — 3-D position in px  (default [0, 0, 0])
 *     rotation:      [rx, ry, rz] — rotation in degrees (default [0, 0, 0])
 *     parallaxFactor: number | null — movement multiplier; null = auto from Z
 *   }
 */

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Renders a single layer inside one eye viewport
function LayerObject({ layer, lookPos, mouseInfluence }) {
  const { position = [0, 0, 0], rotation = [0, 0, 0], parallaxFactor = null, content } = layer;
  const [x, y, z] = position;
  const [rx, ry, rz] = rotation;

  // Auto-derive parallax factor from Z depth when not explicitly set
  // (mirrors the SceneObject auto-calculation: 0.7 + z/1000)
  const effectiveParallax = parallaxFactor !== null ? parallaxFactor : 0.7 + z / 1000;

  const offsetX = lookPos.x * mouseInfluence.x * effectiveParallax;
  const offsetY = lookPos.y * mouseInfluence.y * effectiveParallax;

  const transform = [
    `translate3d(${x + offsetX}px, ${y + offsetY}px, ${z}px)`,
    `rotateX(${rx}deg)`,
    `rotateY(${ry}deg)`,
    `rotateZ(${rz}deg)`,
  ].join(' ');

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center',
      }}
    >
      {content}
    </div>
  );
}

// One half of the stereoscopic display (left or right eye)
function EyeViewport({ testId, layers, lookPos, perspective, perspectiveOriginX, mouseInfluence }) {
  return (
    <div
      data-testid={testId}
      style={{
        width: '50%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        perspective: `${perspective}px`,
        perspectiveOrigin: `${perspectiveOriginX}% 50%`,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {layers.map((layer) => (
          <LayerObject
            key={layer.id}
            layer={layer}
            lookPos={lookPos}
            mouseInfluence={mouseInfluence}
          />
        ))}
      </div>
    </div>
  );
}

export function VRViewer({
  layers = [],
  perspective = 1000,
  mouseInfluence = { x: 50, y: 30 },
  stereoOffset = 7,
}) {
  const { theme } = useTheme();
  const [lookPos, setLookPos] = useState({ x: 0, y: 0 });
  const [hasOrientation, setHasOrientation] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const viewerRef = useRef(null);

  // Detect whether iOS requires an explicit permission request
  useEffect(() => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      setNeedsPermission(true);
    }
  }, []);

  // Subscribe to device orientation events and return the unsubscribe function
  const subscribeOrientation = useCallback(() => {
    const handleOrientation = (e) => {
      if (e.gamma === null || e.beta === null) return;
      // gamma: left/right tilt (-90° … 90°)
      // beta:  front/back tilt (-180° … 180°); ~45° is neutral phone-held-up
      const x = clamp(e.gamma / 45, -1, 1);
      const y = clamp((e.beta - 45) / 45, -1, 1);
      setLookPos({ x, y });
      setHasOrientation(true);
    };
    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Auto-subscribe on Android/desktop (no permission dialog required)
  useEffect(() => {
    if (!needsPermission) {
      return subscribeOrientation();
    }
  }, [needsPermission, subscribeOrientation]);

  // Mouse fallback when no orientation data is available
  useEffect(() => {
    if (hasOrientation) return;
    const handleMouse = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setLookPos({ x, y });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, [hasOrientation]);

  // iOS 13+: permission must be requested inside a user gesture (tap)
  const handleViewerTap = useCallback(async () => {
    if (!needsPermission) return;
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission === 'granted') {
        setNeedsPermission(false);
        subscribeOrientation();
      }
    } catch (_e) {
      // Permission denied or API unsupported — mouse fallback takes over
      setNeedsPermission(false);
    }
  }, [needsPermission, subscribeOrientation]);

  // Each eye's perspectiveOrigin is shifted left/right of 50% by stereoOffset points
  const leftOriginX = 50 - stereoOffset;
  const rightOriginX = 50 + stereoOffset;

  return (
    <div
      ref={viewerRef}
      onClick={handleViewerTap}
      data-testid="vr-viewer"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        background: theme.colors.background,
        zIndex: 15000,
        overflow: 'hidden',
      }}
    >
      {/* Left eye */}
      <EyeViewport
        testId="eye-left"
        layers={layers}
        lookPos={lookPos}
        perspective={perspective}
        perspectiveOriginX={leftOriginX}
        mouseInfluence={mouseInfluence}
      />

      {/* Centre divider — physical separator between lenses on the headset */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: '2px',
          background: '#000',
          transform: 'translateX(-50%)',
          zIndex: 1,
        }}
      />

      {/* Right eye */}
      <EyeViewport
        testId="eye-right"
        layers={layers}
        lookPos={lookPos}
        perspective={perspective}
        perspectiveOriginX={rightOriginX}
        mouseInfluence={mouseInfluence}
      />

      {/* iOS permission prompt */}
      {needsPermission && (
        <div
          data-testid="permission-hint"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)',
            color: theme.colors.text,
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '11px',
            fontFamily: theme.typography.fontBody,
            whiteSpace: 'nowrap',
            zIndex: 2,
          }}
        >
          Tap to enable head tracking
        </div>
      )}
    </div>
  );
}

export default VRViewer;
