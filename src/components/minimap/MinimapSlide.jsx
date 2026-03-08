import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * MinimapSlide — Individual slide entry in the scroll minimap.
 *
 * Renders a thumbnail image when available, otherwise a labeled abstract block.
 * Each slide is a <button> for keyboard accessibility.
 */
export const MinimapSlide = React.memo(function MinimapSlide({ slide, isActive, onClick }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={onClick}
      aria-label={slide.label}
      aria-pressed={isActive}
      style={{
        display: 'block',
        width: '48px',
        height: '64px',
        padding: 0,
        border: isActive
          ? `2px solid ${theme.colors.primary}`
          : `1px solid ${theme.colors.border}`,
        borderRadius: '3px',
        cursor: 'pointer',
        overflow: 'hidden',
        background: isActive ? `${theme.colors.primary}20` : 'rgba(0,0,0,0.4)',
        transition: 'border-color 0.2s, background 0.2s',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {slide.thumbnail ? (
        <img
          src={slide.thumbnail}
          alt=""
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: isActive ? theme.colors.primary : theme.colors.textMuted,
              fontSize: '8px',
              fontFamily: theme.typography.fontBody,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              textAlign: 'center',
              padding: '2px',
              wordBreak: 'break-word',
            }}
          >
            {slide.label}
          </span>
        </div>
      )}
    </button>
  );
});
