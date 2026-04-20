import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeTriggers } from '../useThemeTriggers.js';

// ─────────────────────────────────────────────────────────────────────────────
// Baseline behaviour — no triggers / defaults
// ─────────────────────────────────────────────────────────────────────────────

describe('useThemeTriggers — baseline', () => {
  it('returns baseTheme when no triggers are provided', () => {
    const { result } = renderHook(() =>
      useThemeTriggers({ triggers: [], scrollZ: 0, baseTheme: 'noir' }),
    );
    expect(result.current.activeThemeName).toBe('noir');
  });

  it('returns baseTheme when triggers is undefined', () => {
    const { result } = renderHook(() =>
      useThemeTriggers({ scrollZ: 0, baseTheme: 'noir', baseOverlays: { grain: 0.2 } }),
    );
    expect(result.current.activeThemeName).toBe('noir');
    expect(result.current.activeOverlays).toEqual({ grain: 0.2 });
  });

  it('returns safe defaults with no args', () => {
    const { result } = renderHook(() => useThemeTriggers());
    expect(result.current.activeThemeName).toBeUndefined();
    expect(result.current.activeOverlays).toEqual({});
    expect(typeof result.current.handleObjectClick).toBe('function');
  });

  it('merges baseOverlays when there are no active triggers', () => {
    const baseOverlays = { vignette: 0.4, grain: 0.1 };
    const { result } = renderHook(() =>
      useThemeTriggers({ triggers: [], scrollZ: 0, baseTheme: 'noir', baseOverlays }),
    );
    expect(result.current.activeOverlays).toEqual(baseOverlays);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Z-depth triggers
// ─────────────────────────────────────────────────────────────────────────────

describe('useThemeTriggers — zDepth triggers', () => {
  it('switches theme once scrollZ crosses a forward threshold', () => {
    const triggers = [
      { type: 'zDepth', zThreshold: 500, direction: 'forward', theme: 'cyberpunk' },
    ];

    const { result, rerender } = renderHook(
      ({ scrollZ }) => useThemeTriggers({ triggers, scrollZ, baseTheme: 'noir' }),
      { initialProps: { scrollZ: 0 } },
    );

    // Under threshold — keeps base theme
    expect(result.current.activeThemeName).toBe('noir');

    // Cross threshold
    rerender({ scrollZ: 500 });
    expect(result.current.activeThemeName).toBe('cyberpunk');

    // Stay beyond threshold
    rerender({ scrollZ: 900 });
    expect(result.current.activeThemeName).toBe('cyberpunk');
  });

  it('defaults to forward direction when direction is omitted', () => {
    const triggers = [{ type: 'zDepth', zThreshold: 300, theme: 'dreamscape' }];

    const { result, rerender } = renderHook(
      ({ scrollZ }) => useThemeTriggers({ triggers, scrollZ, baseTheme: 'noir' }),
      { initialProps: { scrollZ: 100 } },
    );

    expect(result.current.activeThemeName).toBe('noir');

    rerender({ scrollZ: 400 });
    expect(result.current.activeThemeName).toBe('dreamscape');
  });

  it('applies overlayOverrides from the active trigger', () => {
    const triggers = [
      {
        type: 'zDepth',
        zThreshold: 200,
        direction: 'forward',
        theme: 'cyberpunk',
        overlayOverrides: { scanlines: 0.8 },
      },
    ];

    const { result, rerender } = renderHook(
      ({ scrollZ }) =>
        useThemeTriggers({
          triggers,
          scrollZ,
          baseTheme: 'noir',
          baseOverlays: { grain: 0.2 },
        }),
      { initialProps: { scrollZ: 0 } },
    );

    expect(result.current.activeOverlays).toEqual({ grain: 0.2 });

    rerender({ scrollZ: 250 });
    // baseOverlays merged with trigger overrides
    expect(result.current.activeOverlays).toEqual({ grain: 0.2, scanlines: 0.8 });
  });

  it('applies the highest zThreshold when multiple triggers are crossed', () => {
    const triggers = [
      { type: 'zDepth', zThreshold: 100, direction: 'forward', theme: 'cyberpunk' },
      { type: 'zDepth', zThreshold: 500, direction: 'forward', theme: 'dreamscape' },
      { type: 'zDepth', zThreshold: 900, direction: 'forward', theme: 'noir' },
    ];

    const { result, rerender } = renderHook(
      ({ scrollZ }) => useThemeTriggers({ triggers, scrollZ, baseTheme: 'base' }),
      { initialProps: { scrollZ: 0 } },
    );

    // Cross first
    rerender({ scrollZ: 150 });
    expect(result.current.activeThemeName).toBe('cyberpunk');

    // Cross first + second — the deeper one wins
    rerender({ scrollZ: 600 });
    expect(result.current.activeThemeName).toBe('dreamscape');

    // Cross all three — the deepest wins
    rerender({ scrollZ: 1000 });
    expect(result.current.activeThemeName).toBe('noir');

    // Move back below all thresholds — falls back to base
    rerender({ scrollZ: 50 });
    expect(result.current.activeThemeName).toBe('base');
  });

  it('supports backward direction triggers (fires when scrollZ <= threshold)', () => {
    const triggers = [
      { type: 'zDepth', zThreshold: 300, direction: 'backward', theme: 'nostalgia' },
    ];

    const { result, rerender } = renderHook(
      ({ scrollZ }) => useThemeTriggers({ triggers, scrollZ, baseTheme: 'base' }),
      { initialProps: { scrollZ: 500 } },
    );

    // Above threshold — inactive
    expect(result.current.activeThemeName).toBe('base');

    // Scroll back past threshold — activates
    rerender({ scrollZ: 200 });
    expect(result.current.activeThemeName).toBe('nostalgia');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Object click triggers
// ─────────────────────────────────────────────────────────────────────────────

describe('useThemeTriggers — objectClick triggers', () => {
  it('switches theme when handleObjectClick is called for a matching objectId', () => {
    const triggers = [{ type: 'objectClick', objectId: 'door-1', theme: 'dreamscape' }];

    const { result } = renderHook(() =>
      useThemeTriggers({ triggers, scrollZ: 0, baseTheme: 'noir' }),
    );

    expect(result.current.activeThemeName).toBe('noir');

    act(() => {
      result.current.handleObjectClick('door-1');
    });

    expect(result.current.activeThemeName).toBe('dreamscape');
  });

  it('ignores clicks for unknown objectIds', () => {
    const triggers = [{ type: 'objectClick', objectId: 'door-1', theme: 'dreamscape' }];
    const { result } = renderHook(() =>
      useThemeTriggers({ triggers, scrollZ: 0, baseTheme: 'noir' }),
    );

    act(() => {
      result.current.handleObjectClick('missing');
    });

    expect(result.current.activeThemeName).toBe('noir');
  });

  it('toggles the click theme off when the same object is clicked again', () => {
    const triggers = [{ type: 'objectClick', objectId: 'door-1', theme: 'dreamscape' }];
    const { result } = renderHook(() =>
      useThemeTriggers({ triggers, scrollZ: 0, baseTheme: 'noir' }),
    );

    act(() => {
      result.current.handleObjectClick('door-1');
    });
    expect(result.current.activeThemeName).toBe('dreamscape');

    act(() => {
      result.current.handleObjectClick('door-1');
    });
    expect(result.current.activeThemeName).toBe('noir');
  });

  it('click theme overrides an active zDepth theme', () => {
    const triggers = [
      { type: 'zDepth', zThreshold: 100, direction: 'forward', theme: 'cyberpunk' },
      { type: 'objectClick', objectId: 'artifact', theme: 'dreamscape' },
    ];

    const { result, rerender } = renderHook(
      ({ scrollZ }) => useThemeTriggers({ triggers, scrollZ, baseTheme: 'noir' }),
      { initialProps: { scrollZ: 200 } },
    );

    // z-trigger active
    expect(result.current.activeThemeName).toBe('cyberpunk');

    act(() => {
      result.current.handleObjectClick('artifact');
    });

    // click takes priority
    expect(result.current.activeThemeName).toBe('dreamscape');

    // still priority as scrollZ changes
    rerender({ scrollZ: 300 });
    expect(result.current.activeThemeName).toBe('dreamscape');
  });

  it('merges overlayOverrides from both z and click triggers with click winning conflicts', () => {
    const triggers = [
      {
        type: 'zDepth',
        zThreshold: 100,
        direction: 'forward',
        theme: 'cyberpunk',
        overlayOverrides: { grain: 0.5, scanlines: 0.3 },
      },
      {
        type: 'objectClick',
        objectId: 'artifact',
        theme: 'dreamscape',
        overlayOverrides: { scanlines: 0.9, vignette: 0.7 },
      },
    ];

    const { result } = renderHook(() =>
      useThemeTriggers({
        triggers,
        scrollZ: 200,
        baseTheme: 'noir',
        baseOverlays: { grain: 0.1 },
      }),
    );

    act(() => {
      result.current.handleObjectClick('artifact');
    });

    // base < z overrides < click overrides
    expect(result.current.activeOverlays).toEqual({
      grain: 0.5, // from z, overrides base
      scanlines: 0.9, // click wins the conflict with z
      vignette: 0.7, // from click
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Triggers identity change — resets state
// ─────────────────────────────────────────────────────────────────────────────

describe('useThemeTriggers — trigger set resets', () => {
  it('resets click state when triggers array reference changes', () => {
    const firstTriggers = [{ type: 'objectClick', objectId: 'a', theme: 'alpha' }];
    const secondTriggers = [{ type: 'objectClick', objectId: 'b', theme: 'beta' }];

    const { result, rerender } = renderHook(
      ({ triggers }) => useThemeTriggers({ triggers, scrollZ: 0, baseTheme: 'base' }),
      { initialProps: { triggers: firstTriggers } },
    );

    act(() => {
      result.current.handleObjectClick('a');
    });
    expect(result.current.activeThemeName).toBe('alpha');

    rerender({ triggers: secondTriggers });

    // After reset, base returns
    expect(result.current.activeThemeName).toBe('base');
  });
});
