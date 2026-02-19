import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLocalPages } from '../useLocalPages.js';

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useLocalPages', () => {
  it('returns loading=true initially', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    ); // never resolves
    const { result } = renderHook(() => useLocalPages());
    expect(result.current.loading).toBe(true);
    expect(result.current.pages).toEqual([]);
  });

  it('returns pages and loading=false on success', async () => {
    const mockScenes = [
      { slug: 'my-scene', name: 'My Scene', layerCount: 3 },
      { slug: 'second-scene', name: 'Second Scene', layerCount: 1 },
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockScenes),
        }),
      ),
    );

    const { result } = renderHook(() => useLocalPages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toEqual(mockScenes);
  });

  it('returns empty array when no scenes exist (server returns [])', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        }),
      ),
    );

    const { result } = renderHook(() => useLocalPages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toEqual([]);
  });

  it('returns empty array and logs warning on fetch error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network error'))),
    );

    const { result } = renderHook(() => useLocalPages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toEqual([]);
    expect(console.warn).toHaveBeenCalledWith(
      '[useLocalPages] Failed to fetch scene manifest:',
      expect.any(Error),
    );
  });

  it('returns empty array and logs warning when server returns non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'internal error' }),
        }),
      ),
    );

    const { result } = renderHook(() => useLocalPages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });

  it('handles non-array response gracefully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        }),
      ),
    );

    const { result } = renderHook(() => useLocalPages());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pages).toEqual([]);
  });
});
