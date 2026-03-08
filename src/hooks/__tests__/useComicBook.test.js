import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useComicBook } from '../useComicBook.js';

const MOCK_MANIFEST = {
  scenes: [
    { slug: 'scene-1', name: 'Scene 1', order: 0 },
    { slug: 'scene-2', name: 'Scene 2', order: 1 },
    { slug: 'scene-3', name: 'Scene 3', order: 2 },
  ],
};

const MOCK_SCENE = {
  name: 'Scene 1',
  slug: 'scene-1',
  layers: [
    { index: 0, parallaxFactor: 0.2, position: [0, 0, 0] },
    { index: 1, parallaxFactor: 0.5, position: [0, 0, 50] },
  ],
  objects: [],
  sceneConfig: { perspective: 1000, parallaxIntensity: 1 },
};

function makeSuccessResponse(data) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function makeErrorResponse(status = 404) {
  return Promise.resolve({ ok: false, status });
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  // Stub Image so layer prefetch doesn't fail in jsdom
  vi.stubGlobal('Image', class { set src(_) {} });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('useComicBook', () => {
  it('returns loading=true initially', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const { result } = renderHook(() => useComicBook('my-comic', 0));
    expect(result.current.loading).toBe(true);
    expect(result.current.manifest).toBeNull();
    expect(result.current.currentScene).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loads manifest and first scene on mount', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url.includes('manifest.json')) return makeSuccessResponse(MOCK_MANIFEST);
        return makeSuccessResponse(MOCK_SCENE);
      }),
    );

    const { result } = renderHook(() => useComicBook('my-comic', 0));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.manifest).toEqual(MOCK_MANIFEST);
    expect(result.current.currentScene).toEqual(MOCK_SCENE);
    expect(result.current.error).toBeNull();
  });

  it('sets error when manifest fetch fails (404)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => makeErrorResponse(404)));

    const { result } = renderHook(() => useComicBook('missing-comic', 0));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.manifest).toBeNull();
    expect(result.current.error).toBe('MANIFEST_NOT_FOUND');
  });

  it('sets error when scene fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url.includes('manifest.json')) return makeSuccessResponse(MOCK_MANIFEST);
        return makeErrorResponse(404);
      }),
    );

    const { result } = renderHook(() => useComicBook('my-comic', 0));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentScene).toBeNull();
    expect(result.current.error).toBe('SCENE_NOT_FOUND');
  });

  it('loads the correct scene for a given slideIndex', async () => {
    const scene2 = { ...MOCK_SCENE, slug: 'scene-2', name: 'Scene 2' };
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url.includes('manifest.json')) return makeSuccessResponse(MOCK_MANIFEST);
        if (url.includes('scene-2')) return makeSuccessResponse(scene2);
        return makeSuccessResponse(MOCK_SCENE);
      }),
    );

    const { result } = renderHook(() => useComicBook('my-comic', 1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.currentScene).toEqual(scene2);
  });

  it('clamps slideIndex to valid range', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url.includes('manifest.json')) return makeSuccessResponse(MOCK_MANIFEST);
        return makeSuccessResponse(MOCK_SCENE);
      }),
    );

    // slideIndex 99 should clamp to last scene (index 2 → scene-3)
    const { result } = renderHook(() => useComicBook('my-comic', 99));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const fetchCalls = vi.mocked(global.fetch).mock.calls;
    const sceneUrls = fetchCalls.filter(([url]) => url.includes('/scene.json'));
    // The first scene fetch should be for scene-3 (last scene)
    expect(sceneUrls[0][0]).toContain('scene-3');
  });

  it('resets state when comicBookSlug changes', async () => {
    const comic2Manifest = { scenes: [{ slug: 'other-scene', name: 'Other', order: 0 }] };
    const comic2Scene = { ...MOCK_SCENE, slug: 'other-scene' };

    let callCount = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        callCount++;
        if (url.includes('manifest.json')) {
          return url.includes('comic-2')
            ? makeSuccessResponse(comic2Manifest)
            : makeSuccessResponse(MOCK_MANIFEST);
        }
        return url.includes('comic-2')
          ? makeSuccessResponse(comic2Scene)
          : makeSuccessResponse(MOCK_SCENE);
      }),
    );

    const { result, rerender } = renderHook(({ slug }) => useComicBook(slug, 0), {
      initialProps: { slug: 'comic-1' },
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.manifest).toEqual(MOCK_MANIFEST);

    rerender({ slug: 'comic-2' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.manifest).toEqual(comic2Manifest);
    expect(result.current.currentScene).toEqual(comic2Scene);
  });
});
