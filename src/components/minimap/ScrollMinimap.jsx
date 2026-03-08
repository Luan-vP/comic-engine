import React, { useCallback } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { MinimapSlide } from './MinimapSlide';

/**
 * ScrollMinimap — VSCode-style vertical minimap showing all slides.
 *
 * Renders a fixed overlay strip with slide thumbnails on the right side.
 * The active slide is highlighted with a viewport indicator.
 * Clicking a slide calls onSlideClick(index).
 *
 * Hidden when there is 1 or fewer slides.
 *
 * @param {object} props
 * @param {Array<{id, label, zCenter, thumbnail?, isActive}>} props.slides  slidesWithProgress from useZScroll
 * @param {number} props.currentSlideIndex
 * @param {function} props.onSlideClick  Called with slide index
 */
export const ScrollMinimap = React.memo(function ScrollMinimap({
  slides = [],
  currentSlideIndex = 0,
  onSlideClick,
}) {
  const { theme } = useTheme();

  const handleClick = useCallback(
    (index) => {
      if (onSlideClick) onSlideClick(index);
    },
    [onSlideClick],
  );

  if (slides.length <= 1) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        zIndex: 20000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '12px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          color: theme.colors.textMuted,
          fontSize: '9px',
          fontFamily: theme.typography.fontBody,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}
      >
        SLIDES
      </span>

      {slides.map((slide, index) => (
        <MinimapSlide
          key={slide.id}
          slide={slide}
          isActive={index === currentSlideIndex}
          onClick={() => handleClick(index)}
        />
      ))}
    </div>
  );
});
