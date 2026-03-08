import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * useZScroll — Lifted scroll state hook for Z-depth slide navigation.
 *
 * Owns scrollZ, derives currentSlideIndex, exposes jumpToSlide().
 * Attaches a wheel listener to a container ref (returned) so the
 * page can pass it to <Scene containerRef={...}>.
 *
 * @param {object} options
 * @param {Array<{id, label, zCenter, thumbnail?}>} options.slides
 * @param {number} options.scrollDepth  Total Z range (default 500)
 * @param {boolean} options.snapEnabled Snap to nearest slide on scroll end (default true)
 * @param {number} options.snapThreshold px distance within which snap fires (default 80)
 *
 * @returns {{ scrollZ, currentSlideIndex, jumpToSlide, progress, slidesWithProgress, containerRef }}
 */
export function useZScroll({
  slides = [],
  scrollDepth = 500,
  snapEnabled = true,
  snapThreshold = 80,
} = {}) {
  const [scrollZ, setScrollZ] = useState(0);
  // Ref mirrors state for use inside RAF callbacks without stale closures
  const scrollZRef = useRef(0);
  const containerRef = useRef(null);
  const rafRef = useRef(null);
  const snapTimeoutRef = useRef(null);

  const clamp = useCallback(
    (val) => Math.max(0, Math.min(scrollDepth, val)),
    [scrollDepth],
  );

  const cancelRaf = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /** Smoothly animate scrollZ to target using RAF lerp (factor 0.12). */
  const animateTo = useCallback(
    (target) => {
      cancelRaf();
      const step = () => {
        const current = scrollZRef.current;
        const diff = target - current;
        if (Math.abs(diff) < 1) {
          scrollZRef.current = target;
          setScrollZ(target);
          rafRef.current = null;
          return;
        }
        const next = current + diff * 0.12;
        scrollZRef.current = next;
        setScrollZ(next);
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    },
    [cancelRaf],
  );

  const findNearestSlide = useCallback(
    (z) => {
      if (!slides.length) return null;
      return slides.reduce((nearest, slide) => {
        const dist = Math.abs(slide.zCenter - z);
        return dist < Math.abs(nearest.zCenter - z) ? slide : nearest;
      }, slides[0]);
    },
    [slides],
  );

  /** Jump camera to slide at given index. */
  const jumpToSlide = useCallback(
    (index) => {
      if (!slides.length) return;
      const clamped = Math.max(0, Math.min(slides.length - 1, index));
      const slide = slides[clamped];
      if (slide) animateTo(clamp(slide.zCenter));
    },
    [slides, animateTo, clamp],
  );

  // Derived current slide index — nearest slide by zCenter distance
  const currentSlideIndex = useMemo(() => {
    if (!slides.length) return 0;
    let nearestIdx = 0;
    let nearestDist = Infinity;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.zCenter - scrollZ);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    });
    return nearestIdx;
  }, [slides, scrollZ]);

  // Ref for keyboard handler to read current index without stale closure
  const currentSlideIndexRef = useRef(currentSlideIndex);
  useEffect(() => {
    currentSlideIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex]);

  // Wheel listener on container — { passive: false } to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      cancelRaf();

      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
        snapTimeoutRef.current = null;
      }

      const next = clamp(scrollZRef.current + e.deltaY * 0.5);
      scrollZRef.current = next;
      setScrollZ(next);

      if (snapEnabled && slides.length) {
        snapTimeoutRef.current = setTimeout(() => {
          const nearest = findNearestSlide(scrollZRef.current);
          if (nearest && Math.abs(scrollZRef.current - nearest.zCenter) <= snapThreshold) {
            animateTo(nearest.zCenter);
          }
        }, 150);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    };
  }, [clamp, cancelRaf, animateTo, findNearestSlide, snapEnabled, slides, snapThreshold]);

  // Keyboard: Arrow up/down + PageUp/Down navigate between slides
  useEffect(() => {
    const handleKey = (e) => {
      if (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp'].includes(e.key)) return;
      e.preventDefault();
      const idx = currentSlideIndexRef.current;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        jumpToSlide(idx + 1);
      } else {
        jumpToSlide(idx - 1);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [jumpToSlide]);

  const slidesWithProgress = useMemo(
    () =>
      slides.map((s, i) => ({
        ...s,
        isActive: i === currentSlideIndex,
        progress: scrollDepth > 0 ? s.zCenter / scrollDepth : 0,
      })),
    [slides, currentSlideIndex, scrollDepth],
  );

  const progress = scrollDepth > 0 ? scrollZ / scrollDepth : 0;

  return {
    scrollZ,
    currentSlideIndex,
    jumpToSlide,
    progress,
    slidesWithProgress,
    containerRef,
  };
}
