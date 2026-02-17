import React, { useState, useEffect } from 'react';
import { Scene } from '../scene/Scene';
import { VRScene } from './VRScene';
import { VRButton } from './VRButton';

/**
 * VRWrapper - Manages VR mode state and switches between regular and VR rendering
 *
 * This component automatically handles:
 * - Detecting WebXR/VR capability
 * - Showing/hiding VR button
 * - Switching between regular Scene and VR stereoscopic view
 * - Requesting device orientation permissions
 *
 * Usage:
 * <VRWrapper perspective={1000} parallaxIntensity={1}>
 *   <SceneObject ...>...</SceneObject>
 *   ...
 * </VRWrapper>
 */
export function VRWrapper({
  children,
  perspective = 1000,
  parallaxIntensity = 1,
  mouseInfluence = { x: 50, y: 30 },
  scrollEnabled = false,
  scrollDepth = 500,
  stereoSeparation = 64,
  showVRButton = true,
  className = '',
  style = {},
}) {
  const [isVRMode, setIsVRMode] = useState(false);
  const [isVRSupported, setIsVRSupported] = useState(false);

  // Check if WebXR or device orientation is supported
  useEffect(() => {
    const checkVRSupport = async () => {
      // Check for device orientation support (needed for head tracking)
      const hasOrientation = 'DeviceOrientationEvent' in window;

      // Check for WebXR support (optional, gracefully degrade)
      const hasWebXR = 'xr' in navigator;

      // We support VR if we have orientation tracking
      // WebXR is nice to have but not required for basic stereoscopic view
      setIsVRSupported(hasOrientation);

      if (hasWebXR) {
        try {
          const isSupported = await navigator.xr?.isSessionSupported('immersive-vr');
          console.log('WebXR immersive-vr supported:', isSupported);
        } catch (err) {
          console.log('WebXR check failed:', err);
        }
      }
    };

    checkVRSupport();
  }, []);

  const handleEnterVR = async () => {
    // Request device orientation permission on iOS 13+
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const permissionState = await DeviceOrientationEvent.requestPermission();
        if (permissionState === 'granted') {
          setIsVRMode(true);
        } else {
          alert('Device orientation permission denied. VR mode requires gyroscope access.');
        }
      } catch (err) {
        console.error('Error requesting device orientation permission:', err);
        alert('Failed to request device orientation permission.');
      }
    } else {
      // No permission needed, just enter VR mode
      setIsVRMode(true);
    }

    // Request fullscreen for better VR experience
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.log('Fullscreen request failed:', err);
    }
  };

  const handleExitVR = () => {
    setIsVRMode(false);

    // Exit fullscreen
    if (document.exitFullscreen && document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  return (
    <>
      {/* Show VR button if supported and enabled */}
      {isVRSupported && showVRButton && (
        <VRButton onEnterVR={handleEnterVR} onExitVR={handleExitVR} isVRActive={isVRMode} />
      )}

      {/* Render either VR or regular scene */}
      {isVRMode ? (
        <VRScene
          perspective={perspective}
          stereoSeparation={stereoSeparation}
          active={isVRMode}
          className={className}
          style={style}
        >
          {children}
        </VRScene>
      ) : (
        <Scene
          perspective={perspective}
          parallaxIntensity={parallaxIntensity}
          mouseInfluence={mouseInfluence}
          scrollEnabled={scrollEnabled}
          scrollDepth={scrollDepth}
          className={className}
          style={style}
        >
          {children}
        </Scene>
      )}
    </>
  );
}

export default VRWrapper;
