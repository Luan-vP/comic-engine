import React, { useMemo } from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Particles - Floating dust/bokeh/snow particles
 * Different presets for various moods
 */
export function Particles({
  preset = 'dust', // 'dust' | 'snow' | 'bokeh' | 'embers' | 'rain'
  count = 50,
  color: colorOverride,
  enabled = true,
}) {
  const { theme } = useTheme();

  const presetConfig = useMemo(() => {
    const configs = {
      dust: {
        sizeRange: [1, 3],
        speedRange: [20, 40],
        opacityRange: [0.1, 0.4],
        color: colorOverride || 'rgba(255, 255, 255, 0.5)',
        blur: 0,
        direction: 'float', // gentle random movement
        glow: false,
      },
      snow: {
        sizeRange: [2, 6],
        speedRange: [10, 25],
        opacityRange: [0.4, 0.8],
        color: colorOverride || '#ffffff',
        blur: 1,
        direction: 'fall',
        glow: false,
      },
      bokeh: {
        sizeRange: [20, 60],
        speedRange: [30, 60],
        opacityRange: [0.05, 0.15],
        color: colorOverride || theme.colors.primary,
        blur: 10,
        direction: 'float',
        glow: true,
      },
      embers: {
        sizeRange: [2, 5],
        speedRange: [8, 15],
        opacityRange: [0.4, 0.9],
        color: colorOverride || '#ff6b35',
        blur: 2,
        direction: 'rise',
        glow: true,
      },
      rain: {
        sizeRange: [1, 2],
        speedRange: [2, 5],
        opacityRange: [0.2, 0.5],
        color: colorOverride || 'rgba(150, 180, 255, 0.6)',
        blur: 0,
        direction: 'fall-fast',
        glow: false,
        elongated: true,
      },
    };
    return configs[preset] || configs.dust;
  }, [preset, colorOverride, theme.colors.primary]);

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const { sizeRange, speedRange, opacityRange } = presetConfig;
      const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
      const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
      const opacity = opacityRange[0] + Math.random() * (opacityRange[1] - opacityRange[0]);

      return {
        id: i,
        size,
        speed,
        opacity,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * speed,
      };
    });
  }, [count, presetConfig]);

  if (!enabled) return null;

  const getAnimation = (direction, speed) => {
    switch (direction) {
      case 'fall':
        return `particleFall ${speed}s linear infinite`;
      case 'fall-fast':
        return `particleFallFast ${speed}s linear infinite`;
      case 'rise':
        return `particleRise ${speed}s ease-out infinite`;
      case 'float':
      default:
        return `particleFloat ${speed}s ease-in-out infinite`;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9990,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes particleFloat {
          0%, 100% { 
            transform: translate(0, 0) rotate(0deg); 
            opacity: var(--particle-opacity);
          }
          25% { 
            transform: translate(10px, -20px) rotate(5deg); 
          }
          50% { 
            transform: translate(-5px, -10px) rotate(-3deg);
            opacity: calc(var(--particle-opacity) * 1.2);
          }
          75% { 
            transform: translate(-15px, -25px) rotate(2deg); 
          }
        }
        @keyframes particleFall {
          0% { 
            transform: translateY(-10vh) translateX(0);
            opacity: 0;
          }
          10% { opacity: var(--particle-opacity); }
          90% { opacity: var(--particle-opacity); }
          100% { 
            transform: translateY(110vh) translateX(20px);
            opacity: 0;
          }
        }
        @keyframes particleFallFast {
          0% { 
            transform: translateY(-10vh) translateX(0);
            opacity: var(--particle-opacity);
          }
          100% { 
            transform: translateY(110vh) translateX(5px);
            opacity: var(--particle-opacity);
          }
        }
        @keyframes particleRise {
          0% { 
            transform: translateY(0) translateX(0);
            opacity: var(--particle-opacity);
          }
          100% { 
            transform: translateY(-110vh) translateX(30px);
            opacity: 0;
          }
        }
      `}</style>

      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: presetConfig.elongated ? `${particle.size}px` : `${particle.size}px`,
            height: presetConfig.elongated ? `${particle.size * 8}px` : `${particle.size}px`,
            borderRadius: presetConfig.elongated ? '2px' : '50%',
            background: presetConfig.color,
            opacity: particle.opacity,
            filter: presetConfig.blur ? `blur(${presetConfig.blur}px)` : 'none',
            boxShadow: presetConfig.glow 
              ? `0 0 ${particle.size * 2}px ${presetConfig.color}` 
              : 'none',
            animation: getAnimation(presetConfig.direction, particle.speed),
            animationDelay: `${particle.delay}s`,
            '--particle-opacity': particle.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default Particles;
