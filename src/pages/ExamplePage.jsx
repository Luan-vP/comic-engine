import React, { useState } from 'react';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import { useZScroll } from '../hooks/useZScroll';
import { ScrollMinimap } from '../components/minimap';

/**
 * ExamplePage - Demonstrates how to compose a scene
 *
 * This shows various ways to place objects in 3D space with parallax.
 * Copy this pattern for your own pages.
 */

export function ExamplePage() {
  const { theme } = useTheme();
  const [, setActivePanel] = useState(null);
  const [zGap, setZGap] = useState(500);

  const slides = [
    { id: 'fg', label: 'FOREGROUND', zCenter: 0 },
    { id: 'mid', label: 'MIDGROUND', zCenter: zGap },
    { id: 'bg', label: 'BACKGROUND', zCenter: zGap * 2 },
  ];

  const { scrollZ, currentSlideIndex, jumpToSlide, slidesWithProgress, containerRef } = useZScroll({
    slides,
    scrollDepth: zGap * 2,
  });

  return (
    <>
      <Scene
        perspective={1000}
        parallaxIntensity={1}
        mouseInfluence={{ x: 50, y: 30 }}
        controlledScrollZ={scrollZ}
        containerRef={containerRef}
      >
        {/* ===== FAR BACKGROUND LAYER ===== */}
        <SceneObject
          position={[-200, -100, zGap * 2.5]}
          rotation={[0, 0, 15]}
          parallaxFactor={0.1}
          interactive={false}
        >
          <div
            style={{
              width: '200px',
              height: '200px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '50%',
              opacity: 0.3,
            }}
          />
        </SceneObject>

        <SceneObject
          position={[250, 150, zGap * 2.2]}
          rotation={[0, 0, -20]}
          parallaxFactor={0.15}
          interactive={false}
        >
          <div
            style={{
              width: '150px',
              height: '150px',
              border: `1px solid ${theme.colors.secondary}`,
              opacity: 0.2,
            }}
          />
        </SceneObject>

        {/* ===== BACKGROUND PANEL ===== */}
        <SceneObject
          position={[-180, 30, zGap * 2]}
          rotation={[15, -10, -3]}
          parallaxFactor={0.3}
        >
          <Panel
            width={280}
            height={360}
            title="CHAPTER I"
            subtitle="The beginning..."
            onClick={() => setActivePanel('chapter1')}
          >
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                height: '200px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px dashed ${theme.colors.border}`,
              }}
            >
              <span style={{ color: theme.colors.textSubtle, fontSize: '11px' }}>
                [ Background artwork ]
              </span>
            </div>
          </Panel>
        </SceneObject>

        {/* ===== MIDGROUND PANEL ===== */}
        <SceneObject
          position={[50, -20, zGap]}
          rotation={[0, 0, 0]}
          parallaxFactor={0.6}
        >
          <Panel
            width={320}
            height={420}
            variant="default"
            title="THE PRESENT"
            subtitle="Where we find ourselves"
            onClick={() => setActivePanel('present')}
          >
            <div
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                height: '250px',
                background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)`,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px dashed ${theme.colors.primary}50`,
              }}
            >
              <span style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
                [ Main panel artwork ]
              </span>
            </div>
          </Panel>
        </SceneObject>

        {/* ===== SIDE PANEL ===== */}
        <SceneObject
          position={[320, 0, zGap * 0.5]}
          rotation={[0, -35, 0]}
          parallaxFactor={0.5}
        >
          <Panel width={200} height={300} variant="polaroid">
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#666', fontSize: '10px' }}>MEMORY</span>
            </div>
          </Panel>
        </SceneObject>

        {/* ===== FOREGROUND - VIDEO PLACEHOLDER ===== */}
        <SceneObject
          position={[-250, 120, -zGap * 0.3]}
          rotation={[5, 15, -5]}
          parallaxFactor={0.85}
        >
          <div
            style={{
              width: '200px',
              height: '130px',
              background: '#000',
              border: '3px solid #333',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                border: `2px solid ${theme.colors.primary}`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: `12px solid ${theme.colors.primary}`,
                  marginLeft: '3px',
                }}
              />
            </div>
            <span style={{ color: '#555', fontSize: '9px', marginTop: '10px' }}>
              VIDEO / IFRAME
            </span>
          </div>
        </SceneObject>

        {/* ===== EXTREME FOREGROUND - FLOATING TEXT ===== */}
        <SceneObject
          position={[200, -150, -zGap * 0.5]}
          rotation={[-5, -10, 8]}
          parallaxFactor={1.1}
          interactive={false}
        >
          <div
            style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: '48px',
              color: theme.colors.primary,
              opacity: 0.15,
              textTransform: 'uppercase',
              letterSpacing: '8px',
              textShadow: `0 0 40px ${theme.colors.shadow}`,
            }}
          >
            2025
          </div>
        </SceneObject>

        {/* ===== FLOOR ELEMENT ===== */}
        <SceneObject
          position={[0, 280, zGap]}
          rotation={[75, 0, 0]}
          parallaxFactor={0.35}
          interactive={false}
        >
          <div
            style={{
              width: '600px',
              height: '300px',
              background: `linear-gradient(180deg, transparent 0%, ${theme.colors.background} 100%)`,
              borderTop: `1px solid ${theme.colors.border}`,
              opacity: 0.5,
            }}
          />
        </SceneObject>

        {/* ===== INFO PANEL ===== */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '30px',
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '8px',
            padding: '20px',
            maxWidth: '350px',
            fontFamily: theme.typography.fontBody,
            zIndex: 100,
          }}
        >
          <h3
            style={{
              color: theme.colors.primary,
              margin: '0 0 12px 0',
              fontSize: '14px',
              letterSpacing: '2px',
            }}
          >
            SCENE COMPOSITION
          </h3>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: theme.colors.textMuted,
              fontSize: '11px',
              margin: '0 0 12px 0',
            }}
          >
            Z Gap: <strong style={{ color: theme.colors.primary }}>{zGap}</strong>
            <input
              type="range"
              min={200}
              max={1500}
              step={50}
              value={zGap}
              onChange={(e) => setZGap(Number(e.target.value))}
              style={{ flex: 1 }}
            />
          </label>
          <p
            style={{ color: theme.colors.textMuted, margin: 0, fontSize: '11px', lineHeight: 1.6 }}
          >
            • <strong>Background</strong>: z={zGap * 2}, tilted back
            <br />• <strong>Midground</strong>: z={zGap}, facing camera
            <br />• <strong>Side wall</strong>: z={zGap * 0.5}, Y-rotated
            <br />• <strong>Foreground</strong>: z={Math.round(-zGap * 0.3)}
            <br />• <strong>Text</strong>: z={Math.round(-zGap * 0.5)}
          </p>
        </div>
      </Scene>

      {/* Scroll minimap — fixed right side, outside the 3D scene */}
      <ScrollMinimap
        slides={slidesWithProgress}
        currentSlideIndex={currentSlideIndex}
        onSlideClick={jumpToSlide}
      />
    </>
  );
}

export const PAGE_NAV = { path: '/example', label: 'Example', section: 'tools' };

export default ExamplePage;
