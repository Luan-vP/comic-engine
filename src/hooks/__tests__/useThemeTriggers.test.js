import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeTriggers } from '../useThemeTriggers.js';

/**
 * Shared-path test (see issue #90) — this hook powers theme switching in BOTH
 * the reader (ComicBookReader.jsx) and the editor (DynamicScenePage.jsx). If a
 * trigger fires at a given scrollZ here, it fires at the same scrollZ in both
 * pages because they both consume `activeThemeName` from this hook.
 */
describe('useThemeTriggers — z-depth trigger threshold', () => {
  const triggers = [{ type: 'zDepth', zThreshold: 500, theme: 'cyberpunk' }];

  it('returns baseTheme while scrollZ is below the threshold', () => {
    const { result } = renderHook(
      ({ scrollZ }) => useThemeTriggers({ triggers, scrollZ, baseTheme: 'pulp' }),
      { initialProps: { scrollZ: 499 } },
    );
    expect(result.current.activeThemeName).toBe('pulp');
  });

  it('switches to trigger theme when scrollZ crosses the threshold', () => {
    const { result, rerender } = renderHook(
      ({ scrollZ }) => useThemeTriggers({ triggers, scrollZ, baseTheme: 'pulp' }),
      { initialProps: { scrollZ: 0 } },
    );
    expect(result.current.activeThemeName).toBe('pulp');
    act(() => {
      rerender({ scrollZ: 500 });
    });
    expect(result.current.activeThemeName).toBe('cyberpunk');
  });

  it('object-click trigger takes priority over z-depth trigger', () => {
    const mixed = [
      { type: 'zDepth', zThreshold: 500, theme: 'cyberpunk' },
      { type: 'objectClick', objectId: 'door-1', theme: 'dreamscape' },
    ];
    const { result } = renderHook(() =>
      useThemeTriggers({ triggers: mixed, scrollZ: 1000, baseTheme: 'pulp' }),
    );
    expect(result.current.activeThemeName).toBe('cyberpunk');
    act(() => {
      result.current.handleObjectClick('door-1');
    });
    expect(result.current.activeThemeName).toBe('dreamscape');
  });

  it('merges overlayOverrides on top of baseOverlays', () => {
    const t = [
      {
        type: 'zDepth',
        zThreshold: 100,
        theme: 'cyberpunk',
        overlayOverrides: { scanlines: true },
      },
    ];
    const { result } = renderHook(() =>
      useThemeTriggers({
        triggers: t,
        scrollZ: 200,
        baseTheme: 'pulp',
        baseOverlays: { vignette: true, scanlines: false },
      }),
    );
    expect(result.current.activeOverlays).toEqual({
      vignette: true,
      scanlines: true,
    });
  });
});
