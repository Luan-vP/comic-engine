import React, { useState, useEffect } from 'react';
import { Scene, SceneObject } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import { useZScroll } from '../hooks/useZScroll';
import { ScrollMinimap } from '../components/minimap';

const SLIDES = [
  { id: 'hero', label: 'HERO', zCenter: 0 },
  { id: 'features', label: 'FEATURES', zCenter: 300 },
  { id: 'depth', label: 'DEPTH', zCenter: 600 },
];

export function HomePage() {
  const { theme } = useTheme();
  const [tick, setTick] = useState(0);

  const { scrollZ, currentSlideIndex, jumpToSlide, slidesWithProgress, containerRef } =
    useZScroll({ slides: SLIDES, scrollDepth: 600 });

  // Slow animation tick for floating elements
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Scene
        perspective={1200}
        parallaxIntensity={1.2}
        mouseInfluence={{ x: 60, y: 35 }}
        controlledScrollZ={scrollZ}
        containerRef={containerRef}
      >
        {/* ===== DEEP BACKGROUND — GRID FLOOR ===== */}
        <SceneObject
          position={[0, 300, 600]}
          rotation={[80, 0, 0]}
          parallaxFactor={0.05}
          interactive={false}
        >
          <div
            style={{
              width: '1200px',
              height: '800px',
              backgroundImage: `
                linear-gradient(${theme.colors.primary}15 1px, transparent 1px),
                linear-gradient(90deg, ${theme.colors.primary}15 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              maskImage: 'radial-gradient(ellipse 60% 80% at 50% 30%, black 20%, transparent 70%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 60% 80% at 50% 30%, black 20%, transparent 70%)',
            }}
          />
        </SceneObject>

        {/* ===== DEEP BACKGROUND — RADIAL GLOW ===== */}
        <SceneObject
          position={[0, 0, 500]}
          parallaxFactor={0.08}
          interactive={false}
        >
          <div
            style={{
              width: '800px',
              height: '800px',
              background: `radial-gradient(circle, ${theme.colors.primary}20 0%, ${theme.colors.secondary}10 30%, transparent 60%)`,
              filter: 'blur(40px)',
            }}
          />
        </SceneObject>

        {/* ===== FLOATING GEOMETRIC SHAPES — FAR ===== */}
        {[
          { x: -320, y: -140, z: 420, size: 120, rot: 20, color: theme.colors.secondary },
          { x: 350, y: 100, z: 380, size: 90, rot: -15, color: theme.colors.primary },
          { x: -150, y: 200, z: 450, size: 70, rot: 35, color: theme.colors.accent },
          { x: 280, y: -180, z: 400, size: 100, rot: -30, color: theme.colors.secondary },
        ].map((s, i) => (
          <SceneObject
            key={`geo-${i}`}
            position={[s.x, s.y, s.z]}
            rotation={[0, 0, s.rot + (tick % 2 === 0 ? 2 : 0)]}
            parallaxFactor={0.1 + i * 0.03}
            interactive={false}
          >
            <div
              style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                border: `1px solid ${s.color}40`,
                borderRadius: i % 2 === 0 ? '50%' : '0',
                transform: `rotate(${i * 45}deg)`,
                opacity: 0.25,
              }}
            />
          </SceneObject>
        ))}

        {/* ===== FEATURE PANELS — MIDGROUND ===== */}
        <SceneObject
          position={[-260, 20, 280]}
          rotation={[10, 20, -3]}
          parallaxFactor={0.25}
        >
          <FeaturePanel
            theme={theme}
            title="3D PARALLAX"
            icon="◆"
            description="Layer objects at different depths with mouse-reactive parallax movement"
          />
        </SceneObject>

        <SceneObject
          position={[260, 40, 250]}
          rotation={[8, -18, 2]}
          parallaxFactor={0.28}
        >
          <FeaturePanel
            theme={theme}
            title="THEMES"
            icon="◈"
            description="Five built-in visual themes — noir, cyberpunk, dreamscape, pulp, and minimal"
          />
        </SceneObject>

        <SceneObject
          position={[-180, 200, 320]}
          rotation={[15, 12, -5]}
          parallaxFactor={0.2}
        >
          <FeaturePanel
            theme={theme}
            title="OVERLAYS"
            icon="◇"
            description="Film grain, scanlines, particles, ASCII shader, halftone, and more"
          />
        </SceneObject>

        <SceneObject
          position={[200, 190, 300]}
          rotation={[12, -14, 4]}
          parallaxFactor={0.22}
        >
          <FeaturePanel
            theme={theme}
            title="PANELS"
            icon="▣"
            description="Comic-style panel frames with torn, polaroid, monitor, and borderless variants"
          />
        </SceneObject>

        {/* ===== HERO TITLE — CENTER ===== */}
        <SceneObject
          position={[0, -60, 0]}
          rotation={[0, 0, 0]}
          parallaxFactor={0.5}
        >
          <div style={{ textAlign: 'center', userSelect: 'none' }}>
            <h1
              style={{
                fontFamily: theme.typography.fontDisplay,
                fontSize: '72px',
                color: theme.colors.text,
                margin: 0,
                letterSpacing: '12px',
                textTransform: 'uppercase',
                textShadow: `
                  0 0 60px ${theme.colors.primary}60,
                  0 0 120px ${theme.colors.primary}20
                `,
                lineHeight: 1,
              }}
            >
              COMIC
              <br />
              ENGINE
            </h1>
            <div
              style={{
                width: '120px',
                height: '2px',
                background: `linear-gradient(90deg, transparent, ${theme.colors.primary}, transparent)`,
                margin: '20px auto',
              }}
            />
            <p
              style={{
                fontFamily: theme.typography.fontBody,
                fontSize: '13px',
                color: theme.colors.textMuted,
                letterSpacing: '4px',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              3D parallax scene composer
            </p>
          </div>
        </SceneObject>

        {/* ===== DECORATIVE LINES — MID ===== */}
        {[-1, 1].map((side) => (
          <SceneObject
            key={`line-${side}`}
            position={[side * 380, 0, 100]}
            rotation={[0, side * -30, 0]}
            parallaxFactor={0.4}
            interactive={false}
          >
            <div
              style={{
                width: '1px',
                height: '500px',
                background: `linear-gradient(180deg, transparent, ${theme.colors.border}, transparent)`,
              }}
            />
          </SceneObject>
        ))}

        {/* ===== FLOATING TEXT FRAGMENTS — FOREGROUND ===== */}
        {[
          { text: 'SCROLL', x: -240, y: -160, z: -100, rot: -8, factor: 0.75 },
          { text: 'EXPLORE', x: 200, y: 160, z: -130, rot: 6, factor: 0.8 },
          { text: 'CREATE', x: -100, y: 220, z: -160, rot: -4, factor: 0.85 },
        ].map((f, i) => (
          <SceneObject
            key={`text-${i}`}
            position={[f.x, f.y, f.z]}
            rotation={[0, 0, f.rot]}
            parallaxFactor={f.factor}
            interactive={false}
          >
            <span
              style={{
                fontFamily: theme.typography.fontDisplay,
                fontSize: '18px',
                color: theme.colors.primary,
                opacity: 0.12,
                letterSpacing: '8px',
                textTransform: 'uppercase',
              }}
            >
              {f.text}
            </span>
          </SceneObject>
        ))}

        {/* ===== EXTREME FOREGROUND — BOKEH CIRCLES ===== */}
        {[
          { x: -300, y: -120, z: -250, size: 60, color: theme.colors.primary },
          { x: 280, y: 80, z: -280, size: 45, color: theme.colors.secondary },
          { x: -80, y: 200, z: -300, size: 35, color: theme.colors.accent },
          { x: 320, y: -200, z: -260, size: 50, color: theme.colors.primary },
        ].map((b, i) => (
          <SceneObject
            key={`bokeh-${i}`}
            position={[b.x, b.y, b.z]}
            parallaxFactor={1.0 + i * 0.05}
            interactive={false}
          >
            <div
              style={{
                width: `${b.size}px`,
                height: `${b.size}px`,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${b.color}15, transparent 70%)`,
                border: `1px solid ${b.color}10`,
                filter: `blur(${2 + i}px)`,
              }}
            />
          </SceneObject>
        ))}

        {/* ===== CORNER ACCENTS ===== */}
        <SceneObject
          position={[-350, -220, -50]}
          rotation={[0, 0, 0]}
          parallaxFactor={0.6}
          interactive={false}
          anchor="top-left"
        >
          <CornerAccent theme={theme} />
        </SceneObject>

        <SceneObject
          position={[350, 220, -50]}
          rotation={[0, 0, 180]}
          parallaxFactor={0.6}
          interactive={false}
          anchor="bottom-right"
        >
          <CornerAccent theme={theme} />
        </SceneObject>

        {/* ===== SCROLL HINT ===== */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 100,
            opacity: scrollZ < 50 ? 1 : 0,
            transition: 'opacity 0.5s ease',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: theme.typography.fontBody,
              fontSize: '10px',
              color: theme.colors.textSubtle,
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            scroll to explore
          </div>
          <div
            style={{
              width: '1px',
              height: '24px',
              background: `linear-gradient(180deg, ${theme.colors.textSubtle}, transparent)`,
              margin: '0 auto',
              animation: 'scrollPulse 2s ease-in-out infinite',
            }}
          />
        </div>

        <style>{`
          @keyframes scrollPulse {
            0%, 100% { opacity: 0.3; transform: translateY(0); }
            50% { opacity: 0.8; transform: translateY(6px); }
          }
        `}</style>
      </Scene>

      <ScrollMinimap
        slides={slidesWithProgress}
        currentSlideIndex={currentSlideIndex}
        onSlideClick={jumpToSlide}
      />
    </>
  );
}

/* ===== HELPER COMPONENTS ===== */

function FeaturePanel({ theme, title, icon, description }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '200px',
        padding: '24px 20px',
        background: hovered ? `${theme.colors.background}ee` : `${theme.colors.background}cc`,
        border: `1px solid ${hovered ? theme.colors.primary + '60' : theme.colors.border}`,
        borderRadius: '4px',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        cursor: 'default',
        boxShadow: hovered
          ? `0 8px 32px ${theme.colors.shadow}, inset 0 1px 0 ${theme.colors.primary}20`
          : `0 4px 20px ${theme.colors.shadow}`,
      }}
    >
      <div
        style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: '24px',
          color: hovered ? theme.colors.primary : theme.colors.textMuted,
          marginBottom: '12px',
          transition: 'color 0.3s ease',
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: theme.typography.fontDisplay,
          fontSize: '14px',
          color: theme.colors.text,
          margin: '0 0 8px 0',
          letterSpacing: '3px',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: theme.typography.fontBody,
          fontSize: '11px',
          color: theme.colors.textMuted,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function CornerAccent({ theme }) {
  return (
    <div style={{ width: '60px', height: '60px', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '60px',
          height: '1px',
          background: theme.colors.primary,
          opacity: 0.4,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '1px',
          height: '60px',
          background: theme.colors.primary,
          opacity: 0.4,
        }}
      />
    </div>
  );
}

export const PAGE_NAV = { path: '/', label: 'Home' };

export default HomePage;
