import React, { useRef, useState, useEffect, createContext, useContext } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Scene Context - shares camera/mouse state with all scene objects
 */
const SceneContext = createContext(null);

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a Scene component');
  }
  return context;
}

/**
 * Scene - The 3D container that provides parallax through CSS transforms
 * 
 * This uses CSS 3D transforms to create a parallax effect. In production,
 * you might swap this for a Three.js scene with CSS3DRenderer for more
 * complex 3D objects, but CSS transforms handle flat panels beautifully.
 * 
 * The coordinate system:
 * - X: left (-) to right (+)
 * - Y: up (-) to down (+) [CSS convention]
 * - Z: away from camera (-) to toward camera (+)
 * 
 * Objects further from camera (negative Z) move less = background
 * Objects closer to camera (positive Z) move more = foreground
 */
export function Scene({
  children,
  perspective = 1000, // Lower = more dramatic perspective
  parallaxIntensity = 1, // Global multiplier for mouse movement
  mouseInfluence = { x: 50, y: 30 }, // Max pixels of movement
  scrollEnabled = false, // Enable scroll-based Z movement
  scrollDepth = 500, // How much Z changes on scroll
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const { theme } = useTheme();
  
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollZ, setScrollZ] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Track mouse position normalized to -1 to 1
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setMousePos({ x, y });
    };

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Track scroll for Z movement
  useEffect(() => {
    if (!scrollEnabled) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const scrollProgress = maxScroll > 0 ? scrollY / maxScroll : 0;
      setScrollZ(scrollProgress * scrollDepth);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollEnabled, scrollDepth]);

  const contextValue = {
    mousePos,
    scrollZ,
    dimensions,
    parallaxIntensity,
    mouseInfluence,
    perspective,
  };

  return (
    <SceneContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={className}
        style={{
          width: '100%',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          perspective: `${perspective}px`,
          perspectiveOrigin: '50% 50%',
          background: theme.colors.backgroundGradient,
          ...style,
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
          {children}
        </div>
      </div>
    </SceneContext.Provider>
  );
}

export default Scene;
