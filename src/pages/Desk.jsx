import React, { useCallback } from 'react';
import { Scene, SceneObject } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import layer0Blur from '/scenes/desk/layer-0-blur.png';
import layer1Blur from '/scenes/desk/layer-1-blur.png';
import layer2Blur from '/scenes/desk/layer-2-blur.png';
import layer3Blur from '/scenes/desk/layer-3-blur.png';
import layer4Blur from '/scenes/desk/layer-4-blur.png';

export function Desk() {
  const { theme } = useTheme();

  const handleSave = useCallback(async ({ groupOffset }) => {
    try {
      const res = await fetch('/_dev/scenes/desk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupOffset }),
      });
      if (!res.ok) throw new Error('Save failed');
      window.location.reload();
    } catch (err) {
      console.error('Failed to save positions:', err);
    }
  }, []);

  return (
    <Scene
      perspective={1000}
      parallaxIntensity={1.2}
      mouseInfluence={{ x: 60, y: 40 }}
      editable
      onSave={handleSave}
    >
      <SceneObject
        position={[-542, -495, -400]}
        parallaxFactor={0.10450000000000001}
        interactive={false}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer0Blur}
            alt="Layer 0"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(0.80)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject
        position={[-542, -495, -350]}
        parallaxFactor={0.14950000000000002}
        interactive={false}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer1Blur}
            alt="Layer 1"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(0.82)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject position={[-542, -495, -300]} parallaxFactor={0.4285} interactive={false}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer2Blur}
            alt="Layer 2"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(0.95)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject position={[-542, -495, -250]} parallaxFactor={0.7075} interactive={false}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer3Blur}
            alt="Layer 3"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(1.07)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject
        position={[-542, -495, -200]}
        parallaxFactor={0.9954999999999999}
        interactive={false}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer4Blur}
            alt="Layer 4"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(1.20)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      {/* Title */}
      <SceneObject position={[0, -200, 150]} parallaxFactor={0.8} interactive={false}>
        <h1
          style={{
            fontFamily: theme.typography.fontHeading || 'Georgia, serif',
            fontSize: '48px',
            fontWeight: 'normal',
            color: theme.colors.text,
            textAlign: 'center',
            textShadow: `0 0 40px ${theme.colors.shadow}`,
            letterSpacing: '8px',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          Desk
        </h1>
      </SceneObject>
    </Scene>
  );
}

export default Desk;
