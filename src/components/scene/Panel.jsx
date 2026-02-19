import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Panel - A comic book panel that can contain layered artwork
 *
 * This wraps content in a styled panel frame. Use inside SceneObject
 * to position it in 3D space.
 *
 * For layered artwork, pass children as multiple absolutely-positioned
 * elements, or use the layers prop for automatic stacking.
 */
export function Panel({
  children,
  width = 320,
  height = 420,
  variant = 'default', // 'default' | 'borderless' | 'torn' | 'polaroid' | 'monitor'
  title,
  subtitle,
  onClick,
  className = '',
  style = {},

  // For automatic layer stacking
  layers = null, // Array of { src, style, className } for layered images
}) {
  const { theme } = useTheme();

  const variantStyles = {
    default: {
      background: `linear-gradient(135deg, ${theme.colors.background} 0%, rgba(0,0,0,0.8) 100%)`,
      border: `2px solid ${theme.colors.primary}`,
      borderRadius: '8px',
      boxShadow: `0 0 40px ${theme.colors.shadow}, inset 0 0 60px rgba(0,0,0,0.5)`,
    },
    borderless: {
      background: 'transparent',
      border: 'none',
      borderRadius: '0',
      boxShadow: 'none',
    },
    torn: {
      background: '#f5f5dc',
      border: 'none',
      borderRadius: '0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      clipPath: 'polygon(2% 0%, 98% 2%, 100% 98%, 3% 100%)',
      filter: 'sepia(20%)',
    },
    polaroid: {
      background: '#fff',
      border: 'none',
      borderRadius: '2px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      padding: '12px 12px 48px 12px',
    },
    monitor: {
      background: '#111',
      border: '8px solid #222',
      borderRadius: '4px',
      boxShadow: '0 0 30px rgba(0,255,0,0.2), inset 0 0 100px rgba(0,0,0,0.8)',
    },
  };

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: theme.typography.fontBody,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        ...variantStyles[variant],
        ...style,
      }}
    >
      {/* Halftone overlay for comic effect */}
      {variant === 'default' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '4px 4px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}

      {/* Monitor scanlines */}
      {variant === 'monitor' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        />
      )}

      {/* Title/subtitle header */}
      {(title || subtitle) && (
        <div style={{ position: 'relative', zIndex: 5, padding: '20px' }}>
          {title && (
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: theme.colors.text,
                textTransform: 'uppercase',
                letterSpacing: '3px',
                fontFamily: theme.typography.fontDisplay,
                textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
                margin: 0,
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: '12px',
                color: theme.colors.textMuted,
                marginTop: '8px',
                fontStyle: 'italic',
                fontFamily: theme.typography.fontNarrative,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Automatic layer stacking */}
      {layers && (
        <div style={{ position: 'absolute', inset: 0 }}>
          {layers.map((layer, index) => (
            <img
              key={index}
              src={layer.src}
              alt={layer.alt || `Layer ${index}`}
              className={layer.className}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                ...layer.style,
              }}
            />
          ))}
        </div>
      )}

      {/* Custom children */}
      {children}
    </div>
  );
}

export default Panel;
