import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useZScroll } from '../useZScroll.js';

const SLIDES = [
  { id: 'slide-0', label: 'Background', zCenter: 0 },
  { id: 'slide-1', label: 'Midground', zCenter: 200 },
  { id: 'slide-2', label: 'Foreground', zCenter: 400 },
];

beforeEach(() => {
  vi.useFakeTimers();
  // Mock requestAnimationFrame to execute synchronously in tests
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb) => {
      cb();
      return 1;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useZScroll — initial state', () => {
  it('returns scrollZ=0 initially', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES }));
    expect(result.current.scrollZ).toBe(0);
  });

  it('returns currentSlideIndex=0 initially', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES }));
    expect(result.current.currentSlideIndex).toBe(0);
  });

  it('returns progress=0 initially', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES, scrollDepth: 400 }));
    expect(result.current.progress).toBe(0);
  });

  it('returns containerRef object', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES }));
    expect(result.current.containerRef).toBeDefined();
    expect(typeof result.current.containerRef).toBe('object');
  });

  it('returns slidesWithProgress with isActive true for first slide', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES }));
    const swp = result.current.slidesWithProgress;
    expect(swp[0].isActive).toBe(true);
    expect(swp[1].isActive).toBe(false);
    expect(swp[2].isActive).toBe(false);
  });

  it('returns slidesWithProgress with progress values', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES, scrollDepth: 400 }));
    const swp = result.current.slidesWithProgress;
    expect(swp[0].progress).toBe(0);
    expect(swp[1].progress).toBe(0.5);
    expect(swp[2].progress).toBe(1);
  });
});

describe('useZScroll — jumpToSlide', () => {
  it('updates scrollZ when jumpToSlide is called', () => {
    const { result } = renderHook(() =>
      useZScroll({ slides: SLIDES, scrollDepth: 400, snapEnabled: false }),
    );

    act(() => {
      result.current.jumpToSlide(1);
    });

    expect(result.current.scrollZ).toBeCloseTo(200, 0);
  });

  it('clamps index to valid range (below 0)', () => {
    const { result } = renderHook(() =>
      useZScroll({ slides: SLIDES, scrollDepth: 400, snapEnabled: false }),
    );

    act(() => {
      result.current.jumpToSlide(-5);
    });

    // Should jump to first slide (index 0, zCenter=0)
    expect(result.current.scrollZ).toBeCloseTo(0, 0);
  });

  it('clamps index to valid range (above max)', () => {
    const { result } = renderHook(() =>
      useZScroll({ slides: SLIDES, scrollDepth: 400, snapEnabled: false }),
    );

    act(() => {
      result.current.jumpToSlide(99);
    });

    // Should jump to last slide (index 2, zCenter=400)
    expect(result.current.scrollZ).toBeCloseTo(400, 0);
  });

  it('does nothing when slides is empty', () => {
    const { result } = renderHook(() => useZScroll({ slides: [], scrollDepth: 400 }));

    act(() => {
      result.current.jumpToSlide(0);
    });

    expect(result.current.scrollZ).toBe(0);
  });

  it('updates currentSlideIndex after jump', () => {
    const { result } = renderHook(() =>
      useZScroll({ slides: SLIDES, scrollDepth: 400, snapEnabled: false }),
    );

    act(() => {
      result.current.jumpToSlide(2);
    });

    expect(result.current.currentSlideIndex).toBe(2);
  });
});

describe('useZScroll — currentSlideIndex derivation', () => {
  it('currentSlideIndex=0 when scrollZ=0', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES, scrollDepth: 400 }));
    expect(result.current.currentSlideIndex).toBe(0);
  });

  it('currentSlideIndex=1 when scrollZ is nearest to slide 1', () => {
    const { result } = renderHook(() =>
      useZScroll({ slides: SLIDES, scrollDepth: 400, snapEnabled: false }),
    );

    act(() => {
      result.current.jumpToSlide(1);
    });

    expect(result.current.currentSlideIndex).toBe(1);
  });

  it('returns 0 when slides array is empty', () => {
    const { result } = renderHook(() => useZScroll({ slides: [], scrollDepth: 400 }));
    expect(result.current.currentSlideIndex).toBe(0);
  });
});

describe('useZScroll — progress', () => {
  it('progress=0 when scrollZ=0', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES, scrollDepth: 400 }));
    expect(result.current.progress).toBe(0);
  });

  it('progress=0 when scrollDepth=0', () => {
    const { result } = renderHook(() => useZScroll({ slides: SLIDES, scrollDepth: 0 }));
    expect(result.current.progress).toBe(0);
  });

  it('progress increases after jumpToSlide', () => {
    const { result } = renderHook(() =>
      useZScroll({ slides: SLIDES, scrollDepth: 400, snapEnabled: false }),
    );

    act(() => {
      result.current.jumpToSlide(2);
    });

    expect(result.current.progress).toBeCloseTo(1, 1);
  });
});

describe('useZScroll — keyboard navigation', () => {
  it('registers a keydown event listener on window', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useZScroll({ slides: SLIDES, scrollDepth: 400 }));
    const calls = addSpy.mock.calls.map(([event]) => event);
    expect(calls).toContain('keydown');
  });

  it('removes keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useZScroll({ slides: SLIDES, scrollDepth: 400 }));
    unmount();
    const calls = removeSpy.mock.calls.map(([event]) => event);
    expect(calls).toContain('keydown');
  });
});
