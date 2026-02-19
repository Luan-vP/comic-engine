import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';

const DEFAULT_PERSPECTIVE = 1000;
const DEFAULT_MOUSE_INFLUENCE = { x: 50, y: 30 };
const DEFAULT_PARALLAX_INTENSITY = 1;
const DEFAULT_EYE_SEPARATION = 7; // % offset from 50% for each eye's perspectiveOrigin

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * VRLayer - Renders one content layer at a 3D depth position with parallax.
 *
 * Mirrors the transform math in SceneObject so depth layers behave consistently
 * in VR mode without importing SceneObject (which requires a Scene context).
 */
function VRLayer({ layer, lookX, lookY, mouseInfluence, parallaxIntensity }) {
  const { position = [0, 0, 0], parallaxFactor, content } = layer;
  const [x, y, z] = position;

  // Match SceneObject's auto-calculate formula: 0.7 + z/1000
  const effectiveParallax =
    parallaxFactor !== undefined && parallaxFactor !== null ? parallaxFactor : 0.7 + z / 1000;

  const offsetX = lookX * mouseInfluence.x * effectiveParallax * parallaxIntensity;
  const offsetY = lookY * mouseInfluence.y * effectiveParallax * parallaxIntensity;

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate3d(${x + offsetX}px, ${y + offsetY}px, ${z}px)`,
        transformStyle: 'preserve-3d',
        transformOrigin: 'center',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {content}
    </div>
  );
}

/**
 * VREye - One half (left or right) of the stereoscopic split view.
 *
 * The `perspectiveOrigin` shift is what creates the stereo disparity: objects
 * at different Z depths appear at slightly different horizontal positions in
 * each eye, which the brain fuses into a sense of depth.
 */
function VREye({
  layers,
  lookX,
  lookY,
  side,
  perspective,
  mouseInfluence,
  parallaxIntensity,
  eyeSeparation,
  background,
}) {
  const originX = side === 'left' ? `${50 - eyeSeparation}%` : `${50 + eyeSeparation}%`;

  return (
    <div
      data-testid={`vr-eye-${side}`}
      style={{
        flex: 1,
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        perspective: `${perspective}px`,
        perspectiveOrigin: `${originX} 50%`,
        background,
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
          <VRLayer
            key={layer.id}
            layer={layer}
            lookX={lookX}
            lookY={lookY}
            mouseInfluence={mouseInfluence}
            parallaxIntensity={parallaxIntensity}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * VRViewer - Stereoscopic side-by-side renderer for Google Cardboard.
 *
 * Renders a parallax scene as two half-width viewports. On mobile, DeviceOrientation
 * (gyroscope/accelerometer) drives the parallax so head movement pans the scene.
 * On desktop, the mouse acts as the look direction.
 *
 * This is a parallel rendering path that does NOT touch Scene.jsx or SceneObject.jsx.
 *
 * @param {Array}  layers            - Layer descriptors: { id, content, position: [x,y,z], parallaxFactor }
 * @param {number} perspective       - CSS perspective depth in px (default 1000)
 * @param {Object} mouseInfluence    - Max pixel movement per axis { x, y }
 * @param {number} parallaxIntensity - Global parallax multiplier
 * @param {number} eyeSeparation     - % perspectiveOrigin offset per eye (default 7)
 */
export function VRViewer({
  layers = [],
  perspective = DEFAULT_PERSPECTIVE,
  mouseInfluence = DEFAULT_MOUSE_INFLUENCE,
  parallaxIntensity = DEFAULT_PARALLAX_INTENSITY,
  eyeSeparation = DEFAULT_EYE_SEPARATION,
}) {
  const { theme } = useTheme();
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [usingOrientation, setUsingOrientation] = useState(false);

  // DeviceOrientation (gyroscope) tracking
  // iOS 13+ needs a user-gesture permission request; Android/desktop do not.
  useEffect(() => {
    let removeOrientation = null;
    let active = true;

    const onOrientation = (e) => {
      // gamma = left-right tilt (-90..90 deg), beta = forward-back (-180..180 deg)
      // Subtract 45° from beta so the "neutral" position is holding the phone upright.
      const x = clamp((e.gamma || 0) / 45, -1, 1);
      const y = clamp(((e.beta || 0) - 45) / 45, -1, 1);
      setLook({ x, y });
      setUsingOrientation(true);
    };

    if (typeof DeviceOrientationEvent === 'undefined') {
      // DeviceOrientation not supported — fall through to mouse handler
      return;
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+: permission must be requested from a user gesture
      const onFirstClick = async () => {
        if (!active) return;
        try {
          const result = await DeviceOrientationEvent.requestPermission();
          if (result === 'granted' && active) {
            window.addEventListener('deviceorientation', onOrientation);
            removeOrientation = () =>
              window.removeEventListener('deviceorientation', onOrientation);
          }
        } catch {
          // Permission denied or API missing — stay on mouse fallback
        }
      };
      document.addEventListener('click', onFirstClick, { once: true });
      return () => {
        active = false;
        document.removeEventListener('click', onFirstClick);
        if (removeOrientation) removeOrientation();
      };
    } else {
      // Android / desktop — no permission required
      window.addEventListener('deviceorientation', onOrientation);
      return () => window.removeEventListener('deviceorientation', onOrientation);
    }
  }, []);

  // Mouse fallback — used on desktop and on mobile before orientation is granted
  useEffect(() => {
    if (usingOrientation) return;

    const onMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setLook({ x, y });
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [usingOrientation]);

  const eyeProps = {
    layers,
    lookX: look.x,
    lookY: look.y,
    perspective,
    mouseInfluence,
    parallaxIntensity,
    eyeSeparation,
    background: theme.colors.backgroundGradient,
  };

  return (
    <div
      data-testid="vr-viewer"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        zIndex: 15000,
        background: '#000',
      }}
    >
      {/* Left eye */}
      <VREye {...eyeProps} side="left" />

      {/* Centre divider — helps the eye-box alignment for Cardboard lenses */}
      <div style={{ width: '2px', background: '#000', flexShrink: 0 }} />

      {/* Right eye */}
      <VREye {...eyeProps} side="right" />

      {/* Mouse hint — visible when head tracking is not yet active */}
      {!usingOrientation && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '6px',
            color: theme.colors.textMuted,
            fontFamily: theme.typography.fontBody,
            fontSize: '10px',
            letterSpacing: '0.5px',
            padding: '8px 14px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 1,
          }}
        >
          Move mouse to look &middot; Tap for head tracking on mobile
        </div>
      )}
    </div>
  );
}

export default VRViewer;
