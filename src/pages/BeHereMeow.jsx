import React, { useState } from 'react';
import { Scene, SceneObject } from '../components/scene';
import { useTheme } from '../theme/ThemeContext';

/**
 * BeHereMeow - A meditative scene with a cat buddha
 *
 * Layer breakdown (back to front):
 * - Distant mountains/clouds (z: -400)
 * - Floating lotus flowers (z: -250)
 * - Main cat buddha (z: 0)
 * - Incense smoke wisps (z: 100)
 * - Floating mantras (z: 200)
 * - Close bokeh/particles (z: 300)
 */
export function BeHereMeow() {
  const { theme } = useTheme();
  const [isOmmming, setIsOmmming] = useState(false);

  return (
    <Scene perspective={1200} parallaxIntensity={0.8} mouseInfluence={{ x: 40, y: 25 }}>
      {/* ===== DISTANT BACKGROUND - MOUNTAINS/CLOUDS ===== */}
      <SceneObject
        position={[0, 50, -450]}
        rotation={[0, 0, 0]}
        parallaxFactor={0.05}
        interactive={false}
      >
        <div
          style={{
            width: '900px',
            height: '400px',
            background: `linear-gradient(180deg, 
              transparent 0%, 
              ${theme.colors.secondary}15 30%,
              ${theme.colors.primary}10 60%,
              transparent 100%)`,
            borderRadius: '50% 50% 0 0',
            opacity: 0.6,
            filter: 'blur(20px)',
          }}
        />
      </SceneObject>

      {/* Distant floating clouds */}
      {[...Array(5)].map((_, i) => (
        <SceneObject
          key={`cloud-${i}`}
          position={[-300 + i * 150, -120 + (i % 3) * 40, -400 - i * 20]}
          rotation={[0, 0, i * 5]}
          parallaxFactor={0.08}
          interactive={false}
        >
          <div
            style={{
              width: `${100 + i * 30}px`,
              height: `${40 + i * 10}px`,
              background: `radial-gradient(ellipse, ${theme.colors.text}08, transparent)`,
              borderRadius: '50%',
              filter: 'blur(8px)',
            }}
          />
        </SceneObject>
      ))}

      {/* ===== LOTUS FLOWERS - MID BACKGROUND ===== */}
      <SceneObject
        position={[-220, 120, -250]}
        rotation={[15, 20, -5]}
        parallaxFactor={0.2}
        interactive={false}
      >
        <Lotus color={theme.colors.primary} size={60} />
      </SceneObject>

      <SceneObject
        position={[200, 140, -220]}
        rotation={[10, -15, 8]}
        parallaxFactor={0.25}
        interactive={false}
      >
        <Lotus color={theme.colors.secondary} size={50} />
      </SceneObject>

      <SceneObject
        position={[-80, 180, -280]}
        rotation={[20, 5, -3]}
        parallaxFactor={0.18}
        interactive={false}
      >
        <Lotus color={theme.colors.accent} size={40} opacity={0.6} />
      </SceneObject>

      {/* ===== MAIN CAT BUDDHA - CENTER STAGE ===== */}
      <SceneObject position={[0, 20, 0]} rotation={[0, 0, 0]} parallaxFactor={0.5}>
        <div
          onClick={() => setIsOmmming(!isOmmming)}
          style={{
            cursor: 'pointer',
            transition: 'transform 0.5s ease',
            transform: isOmmming ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {/* Meditation cushion */}
          <div
            style={{
              position: 'absolute',
              bottom: '-40px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '200px',
              height: '50px',
              background: `radial-gradient(ellipse, ${theme.colors.primary}60, ${theme.colors.primary}20, transparent)`,
              borderRadius: '50%',
              filter: 'blur(5px)',
            }}
          />

          {/* Cat Buddha placeholder - replace with your artwork */}
          <div
            style={{
              width: '240px',
              height: '320px',
              background: `linear-gradient(180deg, 
                ${theme.colors.background} 0%, 
                ${theme.colors.primary}20 50%,
                ${theme.colors.secondary}20 100%)`,
              borderRadius: '120px 120px 80px 80px',
              border: `2px solid ${theme.colors.primary}40`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: `
                0 0 60px ${theme.colors.primary}30,
                inset 0 0 60px ${theme.colors.background}
              `,
            }}
          >
            {/* Halo/Aura */}
            <div
              style={{
                position: 'absolute',
                top: '-30px',
                width: '280px',
                height: '280px',
                borderRadius: '50%',
                border: `1px solid ${theme.colors.accent}30`,
                animation: isOmmming ? 'pulseAura 2s ease-in-out infinite' : 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                border: `1px solid ${theme.colors.secondary}20`,
                animation: isOmmming ? 'pulseAura 2s ease-in-out infinite 0.3s' : 'none',
              }}
            />

            {/* Cat face area */}
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🐱</div>

            {/* Placeholder text */}
            <span
              style={{
                color: theme.colors.textSubtle,
                fontSize: '10px',
                textAlign: 'center',
                padding: '0 20px',
              }}
            >
              [ Your cat buddha artwork here ]
            </span>

            {/* Third eye */}
            <div
              style={{
                position: 'absolute',
                top: '60px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: isOmmming
                  ? `radial-gradient(${theme.colors.accent}, ${theme.colors.primary})`
                  : theme.colors.textSubtle,
                boxShadow: isOmmming ? `0 0 20px ${theme.colors.accent}` : 'none',
                transition: 'all 0.5s ease',
              }}
            />
          </div>

          {/* Paws in meditation pose */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '80px',
            }}
          >
            <div style={{ fontSize: '24px', transform: 'scaleX(-1)' }}>🐾</div>
            <div style={{ fontSize: '24px' }}>🐾</div>
          </div>
        </div>
      </SceneObject>

      {/* ===== INCENSE SMOKE - FOREGROUND ===== */}
      <SceneObject
        position={[-150, 80, 100]}
        rotation={[5, 15, -10]}
        parallaxFactor={0.7}
        interactive={false}
      >
        <SmokeWisp color={theme.colors.textMuted} />
      </SceneObject>

      <SceneObject
        position={[160, 100, 120]}
        rotation={[-5, -10, 8]}
        parallaxFactor={0.75}
        interactive={false}
      >
        <SmokeWisp color={theme.colors.secondary} delay={1} />
      </SceneObject>

      {/* ===== FLOATING MANTRAS ===== */}
      <SceneObject
        position={[-200, -80, 180]}
        rotation={[0, 15, -8]}
        parallaxFactor={0.85}
        interactive={false}
      >
        <FloatingText text="OM" color={theme.colors.primary} size={36} animate={isOmmming} />
      </SceneObject>

      <SceneObject
        position={[180, -60, 200]}
        rotation={[0, -12, 5]}
        parallaxFactor={0.9}
        interactive={false}
      >
        <FloatingText
          text="MANI"
          color={theme.colors.secondary}
          size={28}
          delay={0.5}
          animate={isOmmming}
        />
      </SceneObject>

      <SceneObject
        position={[50, -120, 220]}
        rotation={[0, 5, -3]}
        parallaxFactor={0.95}
        interactive={false}
      >
        <FloatingText
          text="PADME"
          color={theme.colors.accent}
          size={24}
          delay={1}
          animate={isOmmming}
        />
      </SceneObject>

      <SceneObject
        position={[-100, -150, 250]}
        rotation={[0, -8, 6]}
        parallaxFactor={1.0}
        interactive={false}
      >
        <FloatingText
          text="HUM"
          color={theme.colors.primary}
          size={32}
          delay={1.5}
          animate={isOmmming}
        />
      </SceneObject>

      {/* ===== TITLE ===== */}
      <SceneObject
        position={[0, -200, 150]}
        rotation={[-5, 0, 0]}
        parallaxFactor={0.8}
        interactive={false}
      >
        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '48px',
            fontWeight: 'normal',
            color: theme.colors.text,
            textAlign: 'center',
            textShadow: `0 0 40px ${theme.colors.shadow}`,
            letterSpacing: '8px',
            margin: 0,
          }}
        >
          BE HERE MEOW
        </h1>
        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: theme.colors.textMuted,
            textAlign: 'center',
            fontStyle: 'italic',
            marginTop: '10px',
            letterSpacing: '3px',
          }}
        >
          click the cat to meditate
        </p>
      </SceneObject>

      {/* ===== CLOSE FOREGROUND ELEMENTS ===== */}
      <SceneObject
        position={[-280, 150, 280]}
        rotation={[10, 25, -15]}
        parallaxFactor={1.1}
        interactive={false}
      >
        <Lotus color={theme.colors.primary} size={80} opacity={0.3} blur={3} />
      </SceneObject>

      <SceneObject
        position={[260, -100, 300]}
        rotation={[-5, -20, 10]}
        parallaxFactor={1.15}
        interactive={false}
      >
        <Lotus color={theme.colors.secondary} size={70} opacity={0.25} blur={4} />
      </SceneObject>

      {/* Animation keyframes */}
      <style>{`
        @keyframes pulseAura {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes floatText {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-15px) rotate(3deg); opacity: 1; }
        }
        @keyframes smokeRise {
          0% { transform: translateY(0) scaleX(1); opacity: 0.4; }
          100% { transform: translateY(-100px) scaleX(1.5); opacity: 0; }
        }
      `}</style>
    </Scene>
  );
}

/* ===== HELPER COMPONENTS ===== */

function Lotus({ color, size = 50, opacity = 1, blur = 0 }) {
  const petalCount = 8;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        opacity,
        filter: blur ? `blur(${blur}px)` : 'none',
      }}
    >
      {[...Array(petalCount)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size * 0.4,
            height: size * 0.7,
            background: `linear-gradient(180deg, ${color}60, ${color}20)`,
            borderRadius: '50% 50% 50% 50%',
            transformOrigin: 'center bottom',
            transform: `translate(-50%, -100%) rotate(${i * (360 / petalCount)}deg)`,
          }}
        />
      ))}
      {/* Center */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.3,
          height: size * 0.3,
          background: `radial-gradient(${color}, ${color}60)`,
          borderRadius: '50%',
        }}
      />
    </div>
  );
}

function SmokeWisp({ color, delay = 0 }) {
  return (
    <div style={{ position: 'relative', width: '40px', height: '100px' }}>
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: '20px',
            height: '60px',
            background: `linear-gradient(180deg, transparent, ${color}30)`,
            borderRadius: '50%',
            transform: 'translateX(-50%)',
            animation: `smokeRise ${3 + i}s ease-out infinite`,
            animationDelay: `${delay + i * 0.5}s`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

function FloatingText({ text, color, size = 24, delay = 0, animate = false }) {
  return (
    <span
      style={{
        fontFamily: 'Georgia, serif',
        fontSize: `${size}px`,
        color: color,
        textShadow: `0 0 20px ${color}`,
        letterSpacing: '4px',
        opacity: animate ? 1 : 0.4,
        animation: animate ? `floatText 3s ease-in-out infinite` : 'none',
        animationDelay: `${delay}s`,
        transition: 'opacity 0.5s ease',
      }}
    >
      {text}
    </span>
  );
}

export default BeHereMeow;
