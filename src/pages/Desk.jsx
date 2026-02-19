import React, { useCallback } from 'react';
import { Scene, SceneObject } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import layer0Blur from '/scenes/desk/layer-0-blur.png';
import layer1Blur from '/scenes/desk/layer-1-blur.png';
import layer2Blur from '/scenes/desk/layer-2-blur.png';
import layer3Blur from '/scenes/desk/layer-3-blur.png';
import layer4Blur from '/scenes/desk/layer-4-blur.png';
import layer5Blur from '/scenes/desk/layer-5-blur.png';

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
      <SceneObject position={[-693, -345, -400]} parallaxFactor={0.1135} interactive={false}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer0Blur}
            alt="Layer 0"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(0.81)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject position={[-693, -345, -350]} parallaxFactor={0.3115} interactive={false}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer1Blur}
            alt="Layer 1"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(0.89)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject
        position={[-693, -345, -300]}
        parallaxFactor={0.49150000000000005}
        interactive={false}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer2Blur}
            alt="Layer 2"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(0.97)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject position={[-693, -345, -250]} parallaxFactor={0.6715} interactive={false}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer3Blur}
            alt="Layer 3"
            style={{
              display: 'block',
              maxWidth: '80vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              filter: 'brightness(1.05)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject
        position={[-693, -345, -200]}
        parallaxFactor={0.8514999999999999}
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
              filter: 'brightness(1.13)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </SceneObject>

      <SceneObject
        position={[-693, -345, -150]}
        parallaxFactor={0.9954999999999999}
        interactive={false}
      >
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img
            src={layer5Blur}
            alt="Layer 5"
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
