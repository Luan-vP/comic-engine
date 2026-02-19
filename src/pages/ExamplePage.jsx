import React, { useState, useMemo } from 'react';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import { VRButton, VRViewer } from '../components/vr';

/**
 * ExamplePage - Demonstrates how to compose a scene
 *
 * This shows various ways to place objects in 3D space with parallax.
 * Copy this pattern for your own pages.
 */
export function ExamplePage() {
  const { theme } = useTheme();
  const [, setActivePanel] = useState(null);
  const [isVR, setIsVR] = useState(false);

  // Layer data for the VR viewer — mirrors the scene objects below.
  // Kept separate so VRViewer works as a parallel rendering path
  // without touching Scene.jsx or SceneObject.jsx.
  const vrLayers = useMemo(
    () => [
      {
        id: 'bg-circle',
        position: [-200, -100, -400],
        parallaxFactor: 0.1,
        content: (
          <div
            style={{
              width: '200px',
              height: '200px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '50%',
              opacity: 0.3,
            }}
          />
        ),
      },
      {
        id: 'bg-square',
        position: [250, 150, -350],
        parallaxFactor: 0.15,
        content: (
          <div
            style={{
              width: '150px',
              height: '150px',
              border: `1px solid ${theme.colors.secondary}`,
              opacity: 0.2,
            }}
          />
        ),
      },
      {
        id: 'bg-panel',
        position: [-180, 30, -200],
        parallaxFactor: 0.3,
        content: (
          <div
            style={{
              width: '280px',
              height: '360px',
              border: `1px solid ${theme.colors.border}`,
              background: 'rgba(0,0,0,0.4)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.textSubtle,
              fontSize: '11px',
            }}
          >
            CHAPTER I
          </div>
        ),
      },
      {
        id: 'mid-panel',
        position: [50, -20, 0],
        parallaxFactor: 0.6,
        content: (
          <div
            style={{
              width: '320px',
              height: '420px',
              border: `1px solid ${theme.colors.primary}50`,
              background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.textMuted,
              fontSize: '11px',
            }}
          >
            THE PRESENT
          </div>
        ),
      },
      {
        id: 'side-panel',
        position: [320, 0, -50],
        parallaxFactor: 0.5,
        content: (
          <div
            style={{
              width: '200px',
              height: '300px',
              background: '#333',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              fontSize: '10px',
            }}
          >
            MEMORY
          </div>
        ),
      },
      {
        id: 'fg-text',
        position: [200, -150, 250],
        parallaxFactor: 1.1,
        content: (
          <div
            style={{
              fontFamily: theme.typography.fontDisplay,
              fontSize: '48px',
              color: theme.colors.primary,
              opacity: 0.15,
              textTransform: 'uppercase',
              letterSpacing: '8px',
            }}
          >
            2025
          </div>
        ),
      },
    ],
    [theme]
  );

  return (
    <>
    <Scene perspective={1000} parallaxIntensity={1} mouseInfluence={{ x: 50, y: 30 }}>
      {/* ===== FAR BACKGROUND LAYER ===== */}
      {/* Decorative shapes that barely move */}
      <SceneObject
        position={[-200, -100, -400]}
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
        position={[250, 150, -350]}
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

      {/* ===== BACKGROUND PANEL - TILTED BACK ===== */}
      {/* This panel is tilted away from viewer, creating depth */}
      <SceneObject
        position={[-180, 30, -200]}
        rotation={[15, -10, -3]} // Tilted back and to the left
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

      {/* ===== MIDGROUND PANEL - FACING CAMERA ===== */}
      {/* Standard forward-facing panel */}
      <SceneObject
        position={[50, -20, 0]}
        rotation={[0, 0, 0]} // Straight on
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

      {/* ===== SIDE PANEL - ANGLED LIKE A WALL ===== */}
      {/* Rotated on Y axis so it's like a wall on the right */}
      <SceneObject
        position={[320, 0, -50]}
        rotation={[0, -35, 0]} // Rotated to face left
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

      {/* ===== FOREGROUND ELEMENT - VIDEO PLACEHOLDER ===== */}
      {/* Close to camera, moves a lot with parallax */}
      <SceneObject
        position={[-250, 120, 150]}
        rotation={[5, 15, -5]} // Slight tilt
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
          {/* Play button */}
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
          <span style={{ color: '#555', fontSize: '9px', marginTop: '10px' }}>VIDEO / IFRAME</span>
        </div>
      </SceneObject>

      {/* ===== EXTREME FOREGROUND - FLOATING TEXT ===== */}
      {/* Very close, dramatic parallax */}
      <SceneObject
        position={[200, -150, 250]}
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
      {/* Rotated on X to appear as floor */}
      <SceneObject
        position={[0, 280, -150]}
        rotation={[75, 0, 0]} // Heavy X rotation = floor
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
        <p style={{ color: theme.colors.textMuted, margin: 0, fontSize: '11px', lineHeight: 1.6 }}>
          Objects are placed at different Z depths and rotations:
          <br />• <strong>Background</strong>: z=-200, tilted back
          <br />• <strong>Midground</strong>: z=0, facing camera
          <br />• <strong>Side wall</strong>: z=-50, Y-rotated
          <br />• <strong>Foreground</strong>: z=150, close to camera
          <br />• <strong>Floor</strong>: z=-150, X-rotated 75°
        </p>
      </div>
    </Scene>

    {/* VR toggle — fixed bottom-right, visible on all pages */}
    <VRButton isVR={isVR} onToggle={() => setIsVR((v) => !v)} />

    {/* VR viewer — fullscreen stereoscopic overlay, rendered outside Scene */}
    {isVR && <VRViewer layers={vrLayers} />}
    </>
  );
}

export default ExamplePage;
