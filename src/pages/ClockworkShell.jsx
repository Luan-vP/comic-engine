import React from 'react';
import { Scene, SceneObject, Panel } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';
import { useZScroll } from '../hooks/useZScroll';
import { ScrollMinimap } from '../components/minimap';

// Theme suggestion: noir
const SLIDES = [
  { id: 'valuation', label: 'VALUATION', zCenter: 0 },
  { id: 'clockwork', label: 'CLOCKWORK', zCenter: 200 },
  { id: 'waking', label: 'WAKING UP', zCenter: 400 },
  { id: 'forgiveness', label: 'FORGIVENESS', zCenter: 600 },
  { id: 'angel', label: 'ANGEL / DICKHEAD', zCenter: 800 },
];

export function ClockworkShell() {
  const { theme } = useTheme();
  const { scrollZ, currentSlideIndex, jumpToSlide, slidesWithProgress, containerRef } =
    useZScroll({ slides: SLIDES, scrollDepth: 800 });

  return (
    <>
      <Scene
        perspective={1200}
        parallaxIntensity={1}
        mouseInfluence={{ x: 40, y: 25 }}
        controlledScrollZ={scrollZ}
        containerRef={containerRef}
      >
        {/* ===== DEEP ATMOSPHERE ===== */}
        <SceneObject
          position={[0, 0, -500]}
          rotation={[0, 0, 0]}
          parallaxFactor={0.05}
          interactive={false}
        >
          <div
            style={{
              width: '800px',
              height: '600px',
              background: `radial-gradient(ellipse at center, ${theme.colors.primary}08, transparent 70%)`,
              filter: 'blur(30px)',
            }}
          />
        </SceneObject>

        {/* Faint clockwork gears — background texture */}
        {[...Array(3)].map((_, i) => (
          <SceneObject
            key={`gear-${i}`}
            position={[-300 + i * 280, -80 + (i % 2) * 160, -420 + i * 30]}
            rotation={[0, 0, i * 45]}
            parallaxFactor={0.08}
            interactive={false}
          >
            <div
              style={{
                width: `${120 + i * 40}px`,
                height: `${120 + i * 40}px`,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: '50%',
                opacity: 0.12,
                animation: `spinSlow ${20 + i * 10}s linear infinite`,
                animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
              }}
            />
          </SceneObject>
        ))}

        {/* ===== PASSAGE 1: VALUATION ===== */}
        <SceneObject
          position={[-120, -30, -50]}
          rotation={[3, -5, -2]}
          parallaxFactor={0.3}
        >
          <Panel width={340} height={180} variant="torn">
            <div style={{ padding: '24px', fontFamily: theme.typography.fontNarrative }}>
              <p style={{
                color: theme.colors.text,
                fontSize: '15px',
                lineHeight: 1.7,
                margin: 0,
              }}>
                I've never much valued my life, but I imagine that changing as I taste the certainty of these being my final moments.
              </p>
            </div>
          </Panel>
        </SceneObject>

        {/* ===== PASSAGE 2: CLOCKWORK ===== */}
        <SceneObject
          position={[100, 40, 170]}
          rotation={[-2, 8, 1]}
          parallaxFactor={0.45}
        >
          <Panel width={320} height={160} variant="monitor">
            <div style={{ padding: '24px', fontFamily: theme.typography.fontNarrative }}>
              <p style={{
                color: theme.colors.text,
                fontSize: '14px',
                lineHeight: 1.7,
                margin: 0,
                letterSpacing: '0.5px',
              }}>
                In my heart is clockwork shell of motives that keeps my heart going when it breaks.
              </p>
            </div>
          </Panel>
        </SceneObject>

        {/* Floating "clockwork" text — atmosphere */}
        <SceneObject
          position={[280, -120, 220]}
          rotation={[0, -15, 6]}
          parallaxFactor={0.55}
          interactive={false}
        >
          <span style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: '32px',
            color: theme.colors.primary,
            opacity: 0.08,
            letterSpacing: '6px',
            textTransform: 'uppercase',
          }}>
            CLOCKWORK
          </span>
        </SceneObject>

        {/* ===== PASSAGE 3: WAKING UP ===== */}
        <SceneObject
          position={[-80, -60, 370]}
          rotation={[0, 3, -1]}
          parallaxFactor={0.65}
        >
          <Panel width={380} height={280} variant="borderless">
            <div style={{ padding: '28px', fontFamily: theme.typography.fontNarrative }}>
              <p style={{
                color: theme.colors.text,
                fontSize: '15px',
                lineHeight: 1.8,
                margin: 0,
              }}>
                And I wake up, it's 4 years into the future, and I realise that I haven't died in a paragliding accident, because I sold my wing to buy this Ableton Push.
              </p>
              <p style={{
                color: theme.colors.textMuted,
                fontSize: '14px',
                lineHeight: 1.8,
                marginTop: '16px',
                marginBottom: 0,
              }}>
                And so, because I feel like this is my chance finally, to step back and really take a look at the path my life has taken.
              </p>
            </div>
          </Panel>
        </SceneObject>

        {/* The turning point — a faint line dividing the space */}
        <SceneObject
          position={[0, 200, 350]}
          rotation={[75, 0, 0]}
          parallaxFactor={0.5}
          interactive={false}
        >
          <div style={{
            width: '500px',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${theme.colors.primary}40, transparent)`,
          }} />
        </SceneObject>

        {/* ===== PASSAGE 4: FORGIVENESS ===== */}
        <SceneObject
          position={[130, 20, 570]}
          rotation={[-1, -6, 2]}
          parallaxFactor={0.78}
        >
          <Panel width={360} height={240} variant="borderless">
            <div style={{ padding: '28px', fontFamily: theme.typography.fontNarrative }}>
              <p style={{
                color: theme.colors.text,
                fontSize: '15px',
                lineHeight: 1.8,
                margin: 0,
              }}>
                That was always the easy part. Forgiving myself. Because I know that people make mistakes, and I am people.
              </p>
              <p style={{
                color: theme.colors.textMuted,
                fontSize: '13px',
                lineHeight: 1.7,
                marginTop: '16px',
                marginBottom: 0,
                fontStyle: 'italic',
              }}>
                If someone would pick up this comic and read it halfway, will it still have been worth it.
              </p>
            </div>
          </Panel>
        </SceneObject>

        {/* ===== PASSAGE 5: ANGEL / DICKHEAD ===== */}
        <SceneObject
          position={[-60, -40, 780]}
          rotation={[2, 4, -1]}
          parallaxFactor={0.92}
        >
          <Panel width={380} height={300} variant="default">
            <div style={{ padding: '28px', fontFamily: theme.typography.fontNarrative }}>
              <blockquote style={{
                color: theme.colors.text,
                fontSize: '14px',
                lineHeight: 1.8,
                margin: 0,
                paddingLeft: '16px',
                borderLeft: `2px solid ${theme.colors.primary}60`,
              }}>
                "I believe that an angel is someone who's intentions are so pure, the world around them aches to fulfil them, and miracles are a moment away."
              </blockquote>
              <blockquote style={{
                color: theme.colors.textMuted,
                fontSize: '14px',
                lineHeight: 1.8,
                margin: '12px 0 0 0',
                paddingLeft: '16px',
                borderLeft: `2px solid ${theme.colors.primary}40`,
              }}>
                "And I believe that that's an achievable and noble goal."
              </blockquote>
              <p style={{
                color: theme.colors.text,
                fontSize: '15px',
                lineHeight: 1.8,
                marginTop: '20px',
                marginBottom: 0,
                textAlign: 'right',
              }}>
                It should not be surprising that I turned into a massive Dickhead.
              </p>
            </div>
          </Panel>
        </SceneObject>

        {/* Floating closing echo */}
        <SceneObject
          position={[200, -180, 850]}
          rotation={[-3, -10, 5]}
          parallaxFactor={1.1}
          interactive={false}
        >
          <span style={{
            fontFamily: theme.typography.fontDisplay,
            fontSize: '56px',
            color: theme.colors.primary,
            opacity: 0.06,
            letterSpacing: '10px',
          }}>
            ★
          </span>
        </SceneObject>

        {/* Floor gradient */}
        <SceneObject
          position={[0, 280, 300]}
          rotation={[75, 0, 0]}
          parallaxFactor={0.35}
          interactive={false}
        >
          <div style={{
            width: '800px',
            height: '400px',
            background: `linear-gradient(180deg, transparent 0%, ${theme.colors.background} 100%)`,
            borderTop: `1px solid ${theme.colors.border}`,
            opacity: 0.3,
          }} />
        </SceneObject>

        {/* Keyframes */}
        <style>{`
          @keyframes spinSlow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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

export default ClockworkShell;
