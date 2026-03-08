import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSceneLoader } from '../useSceneLoader.js';

const MOCK_SCENE = {
  name: 'Test Scene',
  slug: 'test-scene',
  layers: [
    { index: 0, parallaxFactor: 0.2, position: [0, 0, 0] },
    { index: 1, parallaxFactor: 0.5, position: [0, 0, 50] },
    { index: 2, parallaxFactor: 0.8, position: [0, 0, 100], hasBlurFill: true },
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
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('useSceneLoader — local source', () => {
  it('returns loading=true initially', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    const { result } = renderHook(() => useSceneLoader('test-scene', 'local'));
    expect(result.current.loading).toBe(true);
    expect(result.current.scene).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('loads scene from local path and resolves layer URLs', async () => {
    vi.stubGlobal('fetch', vi.fn(() => makeSuccessResponse(MOCK_SCENE)));

    const { result } = renderHook(() => useSceneLoader('test-scene', 'local'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.scene).not.toBeNull();

    const layers = result.current.scene.layers;
    expect(layers[0].url).toBe('/local-scenes/test-scene/layer-0.png');
    expect(layers[1].url).toBe('/local-scenes/test-scene/layer-1.png');
    // hasBlurFill layer gets -blur suffix
    expect(layers[2].url).toBe('/local-scenes/test-scene/layer-2-blur.png');
  });

  it('fetches from /local-scenes/:slug/scene.json', async () => {
    const fetchMock = vi.fn(() => makeSuccessResponse(MOCK_SCENE));
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useSceneLoader('test-scene', 'local'));
    await waitFor(() => {});

    expect(fetchMock).toHaveBeenCalledWith('/local-scenes/test-scene/scene.json');
  });

  it('sets error when fetch fails with non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn(() => makeErrorResponse(404)));

    const { result } = renderHook(() => useSceneLoader('test-scene', 'local'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.scene).toBeNull();
    expect(result.current.error).toContain('"test-scene"');
  });

  it('sets error when fetch rejects (network error)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network error'))));

    const { result } = renderHook(() => useSceneLoader('test-scene', 'local'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.scene).toBeNull();
    expect(result.current.error).toBe('network error');
  });

  it('preserves existing layer properties when adding url', async () => {
    vi.stubGlobal('fetch', vi.fn(() => makeSuccessResponse(MOCK_SCENE)));

    const { result } = renderHook(() => useSceneLoader('test-scene', 'local'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const layer = result.current.scene.layers[0];
    expect(layer.index).toBe(0);
    expect(layer.parallaxFactor).toBe(0.2);
    expect(layer.position).toEqual([0, 0, 0]);
    expect(layer.url).toBe('/local-scenes/test-scene/layer-0.png');
  });
});

describe('useSceneLoader — gcs source', () => {
  it('loads scene via GCS fetch and resolves GCS layer URLs', async () => {
    // getScene and getLayerUrl in gcsStorage.js use fetch internally
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url.includes('scene.json')) return makeSuccessResponse(MOCK_SCENE);
        return makeErrorResponse(404);
      }),
    );

    const { result } = renderHook(() =>
      useSceneLoader('test-scene', 'gcs', { comicBookSlug: 'my-comic' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    const layers = result.current.scene.layers;
    expect(layers[0].url).toBe(
      'https://storage.googleapis.com/comic-engine/my-comic/test-scene/layer-0.png',
    );
    expect(layers[2].url).toBe(
      'https://storage.googleapis.com/comic-engine/my-comic/test-scene/layer-2-blur.png',
    );
  });

  it('fetches scene.json from GCS URL', async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes('scene.json')) return makeSuccessResponse(MOCK_SCENE);
      return makeErrorResponse(404);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useSceneLoader('test-scene', 'gcs', { comicBookSlug: 'my-comic' }));
    await waitFor(() => {});

    const sceneJsonCall = fetchMock.mock.calls.find(([url]) => url.includes('scene.json'));
    expect(sceneJsonCall[0]).toBe(
      'https://storage.googleapis.com/comic-engine/my-comic/test-scene/scene.json',
    );
  });

  it('sets error when comicBookSlug is missing for gcs source', async () => {
    const { result } = renderHook(() => useSceneLoader('test-scene', 'gcs'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.scene).toBeNull();
    expect(result.current.error).toContain('comicBookSlug');
  });

  it('sets error when GCS scene fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => makeErrorResponse(404)));

    const { result } = renderHook(() =>
      useSceneLoader('test-scene', 'gcs', { comicBookSlug: 'my-comic' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.scene).toBeNull();
    expect(result.current.error).toBe('SCENE_NOT_FOUND');
  });
});

describe('useSceneLoader — auto-detection', () => {
  it('uses local source when import.meta.env.DEV is true', async () => {
    vi.stubEnv('DEV', true);
    const fetchMock = vi.fn(() => makeSuccessResponse(MOCK_SCENE));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useSceneLoader('test-scene'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith('/local-scenes/test-scene/scene.json');
  });

  it('uses gcs source when import.meta.env.DEV is false', async () => {
    vi.stubEnv('DEV', false);
    const fetchMock = vi.fn((url) => {
      if (url.includes('scene.json')) return makeSuccessResponse(MOCK_SCENE);
      return makeErrorResponse(404);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useSceneLoader('test-scene', undefined, { comicBookSlug: 'my-comic' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const sceneJsonCall = fetchMock.mock.calls.find(([url]) => url.includes('scene.json'));
    expect(sceneJsonCall[0]).toContain('storage.googleapis.com');
  });
});

describe('useSceneLoader — save function', () => {
  it('sends PATCH request for local source', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => makeSuccessResponse(MOCK_SCENE))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useSceneLoader('test-scene', 'local'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.save({ groupOffset: [1, 2], groupOffsets: {}, objects: [] });
    });

    const patchCall = fetchMock.mock.calls.find(([url]) => url.includes('/_dev/scenes'));
    expect(patchCall).toBeDefined();
    expect(patchCall[0]).toBe('/_dev/scenes/test-scene');
    expect(patchCall[1].method).toBe('PATCH');
  });

  it('is a no-op for gcs source (does not call fetch)', async () => {
    const fetchMock = vi.fn((url) => {
      if (url.includes('scene.json')) return makeSuccessResponse(MOCK_SCENE);
      return makeErrorResponse(404);
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() =>
      useSceneLoader('test-scene', 'gcs', { comicBookSlug: 'my-comic' }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callCountAfterLoad = fetchMock.mock.calls.length;

    await act(async () => {
      await result.current.save({ groupOffset: [0, 0], groupOffsets: {}, objects: [] });
    });

    // No additional fetch calls were made after the initial scene load
    expect(fetchMock.mock.calls.length).toBe(callCountAfterLoad);
  });

  it('merges existing and new objects when saving', async () => {
    const sceneWithObjects = {
      ...MOCK_SCENE,
      objects: [{ id: 'existing-1', type: 'card' }],
    };
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() => makeSuccessResponse(sceneWithObjects))
      .mockImplementationOnce(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useSceneLoader('test-scene', 'local'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const newObj = { id: 'new-1', type: 'label' };
    await act(async () => {
      await result.current.save({ groupOffset: [0, 0], groupOffsets: {}, objects: [newObj] });
    });

    const patchCall = fetchMock.mock.calls.find(([url]) => url.includes('/_dev/scenes'));
    const body = JSON.parse(patchCall[1].body);
    expect(body.objects).toHaveLength(2);
    expect(body.objects[0]).toEqual({ id: 'existing-1', type: 'card' });
    expect(body.objects[1]).toEqual(newObj);
  });
});
