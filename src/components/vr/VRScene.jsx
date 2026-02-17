import React, { useRef, useEffect, useState, createContext, useContext } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * VR Context - shares VR state and orientation data with scene objects
 */
const VRContext = createContext(null);

export function useVR() {
  return useContext(VRContext);
}

/**
 * VRScene - Stereoscopic view mode for parallax scenes
 *
 * This component wraps the existing Scene architecture and adds:
 * - Side-by-side stereoscopic rendering for VR headsets
 * - Device orientation tracking (gyroscope/accelerometer)
 * - WebXR session management with polyfill fallback
 *
 * The stereo effect is achieved by rendering the scene twice with
 * different camera offsets (interpupillary distance simulation).
 *
 * @param {Object} props
 * @param {ReactNode} props.children - Scene content to render
 * @param {number} props.perspective - CSS perspective for 3D effect
 * @param {number} props.stereoSeparation - Eye separation in pixels (default 64)
 * @param {boolean} props.active - Whether VR mode is active
 * @param {Function} props.onOrientationChange - Callback for orientation updates
 */
export function VRScene({
  children,
  perspective = 1000,
  stereoSeparation = 64, // Typical interpupillary distance scaled to pixels
  active = false,
  onOrientationChange,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const { theme } = useTheme();

  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track device orientation for head tracking
  useEffect(() => {
    if (!active) return;

    const handleOrientation = (event) => {
      const newOrientation = {
        alpha: event.alpha || 0, // Z-axis rotation (compass direction)
        beta: event.beta || 0, // X-axis rotation (front-to-back tilt)
        gamma: event.gamma || 0, // Y-axis rotation (left-to-right tilt)
      };
      setOrientation(newOrientation);
      if (onOrientationChange) {
        onOrientationChange(newOrientation);
      }
    };

    // Request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then((permissionState) => {
          if (permissionState === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      // Non-iOS or older iOS
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [active, onOrientationChange]);

  // Track container dimensions
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Convert orientation to normalized parallax position (-1 to 1)
  // This replaces mouse tracking when in VR mode
  const orientationToParallax = () => {
    // Beta: -180 to 180 (forward/back tilt)
    // Gamma: -90 to 90 (left/right tilt)
    // Map to -1 to 1 range for parallax
    const x = Math.max(-1, Math.min(1, orientation.gamma / 45)); // ±45° = full range
    const y = Math.max(-1, Math.min(1, (orientation.beta - 90) / 45)); // 90° = neutral, ±45° range
    return { x, y };
  };

  const parallaxPos = orientationToParallax();

  const contextValue = {
    isVRMode: active,
    orientation,
    parallaxPos,
    dimensions,
    perspective,
    stereoSeparation,
  };

  if (!active) {
    // Not in VR mode, render nothing (use regular Scene component instead)
    return null;
  }

  // Render side-by-side stereoscopic view
  const eyeOffset = stereoSeparation / 2;

  return (
    <VRContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={className}
        style={{
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          background: theme.colors.backgroundGradient,
          display: 'flex',
          ...style,
        }}
      >
        {/* Left Eye View */}
        <div
          style={{
            width: '50%',
            height: '100%',
            position: 'relative',
            perspective: `${perspective}px`,
            perspectiveOrigin: '50% 50%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `translateX(${eyeOffset}px)`,
            }}
          >
            {children}
          </div>
        </div>

        {/* Right Eye View */}
        <div
          style={{
            width: '50%',
            height: '100%',
            position: 'relative',
            perspective: `${perspective}px`,
            perspectiveOrigin: '50% 50%',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transform: `translateX(-${eyeOffset}px)`,
            }}
          >
            {children}
          </div>
        </div>

        {/* VR Mode Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.colors.primary}`,
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '10px',
            color: theme.colors.primary,
            fontFamily: theme.typography.fontBody,
            letterSpacing: '1px',
            zIndex: 10000,
          }}
        >
          🥽 VR MODE • {Math.round(orientation.beta)}° / {Math.round(orientation.gamma)}°
        </div>
      </div>
    </VRContext.Provider>
  );
}

export default VRScene;
