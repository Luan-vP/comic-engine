import React from 'react';
import { VRWrapper } from '../components/vr';
import { SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';

/**
 * VRDemoPage - Demonstrates WebVR/Cardboard stereoscopic view
 *
 * This page shows how to use the VRWrapper component to enable
 * stereoscopic viewing with device orientation tracking.
 *
 * When viewing on a phone:
 * 1. Click "View in VR" button
 * 2. Allow device orientation permissions
 * 3. Put phone in Google Cardboard or similar VR headset
 * 4. Look around to see parallax depth effect
 */
export function VRDemoPage() {
  const { theme } = useTheme();

  return (
    <VRWrapper perspective={1000} parallaxIntensity={1.5} stereoSeparation={64}>
      {/* ===== FAR BACKGROUND ===== */}
      <SceneObject position={[0, 0, -500]} parallaxFactor={0.1} interactive={false}>
        <div
          style={{
            width: '800px',
            height: '800px',
            background: `radial-gradient(circle, ${theme.colors.primary}10 0%, transparent 70%)`,
            borderRadius: '50%',
          }}
        />
      </SceneObject>

      {/* ===== BACKGROUND PANELS ===== */}
      <SceneObject position={[-250, -80, -300]} rotation={[10, -15, -5]} parallaxFactor={0.25}>
        <Panel width={240} height={320} variant="default" title="DEPTH">
          <div
            style={{
              position: 'absolute',
              inset: '60px 20px 20px 20px',
              background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}30)`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '72px',
            }}
          >
            🎨
          </div>
        </Panel>
      </SceneObject>

      <SceneObject position={[280, 100, -280]} rotation={[5, 20, 3]} parallaxFactor={0.3}>
        <Panel width={200} height={280} variant="polaroid">
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#1a1a2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '64px',
            }}
          >
            🌌
          </div>
        </Panel>
      </SceneObject>

      {/* ===== MIDGROUND HERO PANEL ===== */}
      <SceneObject position={[0, 0, 0]} rotation={[0, 0, 0]} parallaxFactor={0.6}>
        <Panel width={360} height={480} variant="default" title="VR DEMO" subtitle="Look around with your head">
          <div
            style={{
              position: 'absolute',
              inset: '80px 30px 30px 30px',
              background: `linear-gradient(135deg, ${theme.colors.primary}30, ${theme.colors.secondary}30)`,
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              padding: '20px',
            }}
          >
            <div style={{ fontSize: '80px' }}>🥽</div>
            <div
              style={{
                color: theme.colors.text,
                fontSize: '16px',
                textAlign: 'center',
                lineHeight: '1.6',
                fontFamily: theme.typography.fontBody,
              }}
            >
              Move your head to see the parallax depth effect
            </div>
          </div>
        </Panel>
      </SceneObject>

      {/* ===== SIDE PANELS ===== */}
      <SceneObject position={[-400, -40, -100]} rotation={[0, 45, 0]} parallaxFactor={0.5}>
        <Panel width={180} height={240} variant="monitor">
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
            }}
          >
            ⬅️
          </div>
        </Panel>
      </SceneObject>

      <SceneObject position={[400, -40, -100]} rotation={[0, -45, 0]} parallaxFactor={0.5}>
        <Panel width={180} height={240} variant="monitor">
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
            }}
          >
            ➡️
          </div>
        </Panel>
      </SceneObject>

      {/* ===== FOREGROUND ELEMENTS ===== */}
      <SceneObject position={[-200, 150, 200]} rotation={[10, 15, -8]} parallaxFactor={0.9}>
        <div
          style={{
            width: '120px',
            height: '120px',
            background: theme.colors.primary,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px',
            boxShadow: `0 20px 60px ${theme.colors.shadow}`,
          }}
        >
          ⭐
        </div>
      </SceneObject>

      <SceneObject position={[220, -120, 250]} rotation={[-8, -12, 5]} parallaxFactor={1.0}>
        <div
          style={{
            width: '100px',
            height: '100px',
            background: theme.colors.secondary,
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '56px',
            boxShadow: `0 20px 60px ${theme.colors.shadow}`,
            transform: 'rotate(45deg)',
          }}
        >
          💎
        </div>
      </SceneObject>

      {/* ===== EXTREME FOREGROUND TEXT ===== */}
      <SceneObject position={[0, -200, 350]} rotation={[0, 0, 0]} parallaxFactor={1.2} interactive={false}>
        <div
          style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: '96px',
            color: theme.colors.primary,
            opacity: 0.2,
            textTransform: 'uppercase',
            letterSpacing: '16px',
            textShadow: `0 0 60px ${theme.colors.shadow}`,
            fontWeight: 'bold',
          }}
        >
          3D
        </div>
      </SceneObject>

      {/* ===== FLOATING PARTICLES ===== */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 350;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.6;
        const z = -200 + i * 50;

        return (
          <SceneObject
            key={i}
            position={[x, y, z]}
            rotation={[0, 0, i * 45]}
            parallaxFactor={0.4 + i * 0.05}
            interactive={false}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                background: `${theme.colors.primary}40`,
                borderRadius: '50%',
                border: `2px solid ${theme.colors.primary}60`,
                boxShadow: `0 0 20px ${theme.colors.primary}40`,
              }}
            />
          </SceneObject>
        );
      })}

      {/* ===== INFO PANEL ===== */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          left: '30px',
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '400px',
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
          🥽 WEBVR / CARDBOARD MODE
        </h3>
        <div style={{ color: theme.colors.textMuted, fontSize: '11px', lineHeight: 1.8 }}>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>Desktop:</strong> Move mouse to see parallax depth
          </p>
          <p style={{ margin: '0 0 12px 0' }}>
            <strong>Mobile VR:</strong> Click "View in VR" button, then:
          </p>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li>Allow device orientation permissions</li>
            <li>Put phone in VR headset (Cardboard, etc.)</li>
            <li>Turn your head to look around the scene</li>
            <li>Each eye sees a slightly different view</li>
          </ul>
          <p style={{ margin: '12px 0 0 0', fontSize: '10px', opacity: 0.7 }}>
            Network: Access via Tailscale by connecting to <code>http://[YOUR_TAILSCALE_IP]:5173</code>
          </p>
        </div>
      </div>
    </VRWrapper>
  );
}

export default VRDemoPage;
