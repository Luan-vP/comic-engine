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

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases — single slide, no slides, overlapping zCenter
// (Issue #84 — test coverage for drag, scroll, and theme trigger systems)
// ─────────────────────────────────────────────────────────────────────────────

describe('useZScroll — edge cases', () => {
  it('handles a single slide without throwing', () => {
    const single = [{ id: 'only', label: 'Only', zCenter: 250 }];
    const { result } = renderHook(() =>
      useZScroll({ slides: single, scrollDepth: 500, snapEnabled: false }),
    );

    expect(result.current.currentSlideIndex).toBe(0);
    expect(result.current.slidesWithProgress).toHaveLength(1);

    act(() => {
      result.current.jumpToSlide(0);
    });

    expect(result.current.scrollZ).toBeCloseTo(250, 0);
    expect(result.current.currentSlideIndex).toBe(0);
  });

  it('single slide — jumpToSlide with any index clamps to that slide', () => {
    const single = [{ id: 'only', label: 'Only', zCenter: 100 }];
    const { result } = renderHook(() =>
      useZScroll({ slides: single, scrollDepth: 500, snapEnabled: false }),
    );

    act(() => {
      result.current.jumpToSlide(42);
    });

    expect(result.current.scrollZ).toBeCloseTo(100, 0);
  });

  it('handles empty slides array — safe defaults', () => {
    const { result } = renderHook(() =>
      useZScroll({ slides: [], scrollDepth: 400, snapEnabled: false }),
    );

    expect(result.current.scrollZ).toBe(0);
    expect(result.current.currentSlideIndex).toBe(0);
    expect(result.current.slidesWithProgress).toEqual([]);
    expect(result.current.progress).toBe(0);
  });

  it('handles missing slides option (default [])', () => {
    const { result } = renderHook(() => useZScroll());
    expect(result.current.scrollZ).toBe(0);
    expect(result.current.currentSlideIndex).toBe(0);
    expect(result.current.slidesWithProgress).toEqual([]);
  });

  it('handles overlapping zCenter values — first overlapping slide is chosen as nearest', () => {
    // Two slides share zCenter=200. Implementation picks the first encountered
    // one because the reduce uses strict `<` comparison.
    const overlap = [
      { id: 'a', label: 'A', zCenter: 0 },
      { id: 'b', label: 'B', zCenter: 200 },
      { id: 'c', label: 'C', zCenter: 200 },
      { id: 'd', label: 'D', zCenter: 400 },
    ];
    const { result } = renderHook(() =>
      useZScroll({ slides: overlap, scrollDepth: 400, snapEnabled: false }),
    );

    // Jumping to index 1 moves to zCenter=200, matching slide 'b' and 'c'
    act(() => {
      result.current.jumpToSlide(1);
    });

    expect(result.current.scrollZ).toBeCloseTo(200, 0);
    // currentSlideIndex scans forward with strict-less-than so first overlap (1) wins
    expect(result.current.currentSlideIndex).toBe(1);
  });

  it('handles overlapping zCenter — slidesWithProgress marks only one active', () => {
    const overlap = [
      { id: 'a', label: 'A', zCenter: 200 },
      { id: 'b', label: 'B', zCenter: 200 },
    ];
    const { result } = renderHook(() =>
      useZScroll({ slides: overlap, scrollDepth: 400, snapEnabled: false }),
    );

    const activeCount = result.current.slidesWithProgress.filter((s) => s.isActive).length;
    expect(activeCount).toBe(1);
  });
});
