import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { listComicBooks, getManifest, getScene, getLayerUrl } from '../gcsStorage.js';

const GCS_BASE = 'https://storage.googleapis.com/comic-engine';

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getLayerUrl', () => {
  it('returns an absolute HTTPS URL', () => {
    const url = getLayerUrl('my-comic', 'scene-1', 'layer-0.png');
    expect(url).toBe(`${GCS_BASE}/my-comic/scene-1/layer-0.png`);
  });

  it('handles blur layer filenames', () => {
    const url = getLayerUrl('comic', 'scene', 'layer-2-blur.png');
    expect(url).toBe(`${GCS_BASE}/comic/scene/layer-2-blur.png`);
  });
});

describe('getManifest', () => {
  it('fetches manifest from the correct URL', async () => {
    const mockManifest = { scenes: [{ slug: 'scene-1', name: 'Scene 1', order: 0 }] };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockManifest) })),
    );

    const result = await getManifest('my-comic');
    expect(fetch).toHaveBeenCalledWith(`${GCS_BASE}/my-comic/manifest.json`);
    expect(result).toEqual(mockManifest);
  });

  it('throws MANIFEST_NOT_FOUND on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 404 })),
    );

    await expect(getManifest('missing-comic')).rejects.toThrow('MANIFEST_NOT_FOUND');
  });
});

describe('getScene', () => {
  it('fetches scene from the correct URL', async () => {
    const mockScene = {
      name: 'Scene 1',
      slug: 'scene-1',
      layers: [],
      objects: [],
      sceneConfig: {},
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(mockScene) })),
    );

    const result = await getScene('my-comic', 'scene-1');
    expect(fetch).toHaveBeenCalledWith(`${GCS_BASE}/my-comic/scene-1/scene.json`);
    expect(result).toEqual(mockScene);
  });

  it('throws SCENE_NOT_FOUND on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 404 })),
    );

    await expect(getScene('my-comic', 'missing-scene')).rejects.toThrow('SCENE_NOT_FOUND');
  });
});

describe('listComicBooks', () => {
  it('parses GCS XML response and returns comic books', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ListBucketResult>
  <CommonPrefixes><Prefix>my-comic/</Prefix></CommonPrefixes>
  <CommonPrefixes><Prefix>another-comic/</Prefix></CommonPrefixes>
</ListBucketResult>`;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(xml) })),
    );

    const result = await listComicBooks();
    expect(result).toEqual([
      { slug: 'my-comic', name: 'My Comic' },
      { slug: 'another-comic', name: 'Another Comic' },
    ]);
  });

  it('returns empty array when no comic books exist', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult></ListBucketResult>`;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(xml) })),
    );

    const result = await listComicBooks();
    expect(result).toEqual([]);
  });

  it('requests the correct GCS listing URL', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><ListBucketResult></ListBucketResult>`;
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(xml) })),
    );

    await listComicBooks();
    expect(fetch).toHaveBeenCalledWith(`${GCS_BASE}/?prefix=&delimiter=/`);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false, status: 500 })),
    );

    await expect(listComicBooks()).rejects.toThrow('GCS list failed with 500');
  });
});
