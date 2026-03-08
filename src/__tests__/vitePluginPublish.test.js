/* global Buffer */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock @google-cloud/storage ---
const mockSave = vi.fn().mockResolvedValue(undefined);
const mockDownload = vi.fn();
const mockFile = vi.fn(() => ({ save: mockSave, download: mockDownload }));
const mockBucket = vi.fn(() => ({ file: mockFile }));
class MockStorage {
  bucket = mockBucket;
}

vi.mock('@google-cloud/storage', () => ({
  Storage: MockStorage,
}));

// --- Mock gcsStorageWrite ---
const mockSaveScene = vi.fn().mockResolvedValue(undefined);
const mockSaveManifest = vi.fn().mockResolvedValue(undefined);

vi.mock('../../src/services/gcsStorageWrite.js', () => ({
  saveScene: mockSaveScene,
  saveManifest: mockSaveManifest,
}));

// --- Mock fs ---
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual,
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
      readdirSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
  };
});

import fs from 'fs';
import {
  publishScene,
  reorderManifest,
  readGCSManifest,
} from '../../vite-plugin-scene-exporter.js';

const SCENES_DIR = '/fake/.local/scenes';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// readGCSManifest
// ---------------------------------------------------------------------------
describe('readGCSManifest', () => {
  it('returns parsed manifest when file exists', async () => {
    const manifest = { scenes: [{ slug: 'scene-a', name: 'Scene A', order: 0 }] };
    mockDownload.mockResolvedValueOnce([Buffer.from(JSON.stringify(manifest))]);

    const result = await readGCSManifest('my-comic');

    expect(mockBucket).toHaveBeenCalledWith('comic-engine');
    expect(mockFile).toHaveBeenCalledWith('my-comic/manifest.json');
    expect(result).toEqual(manifest);
  });

  it('returns empty scenes array when manifest does not exist', async () => {
    mockDownload.mockRejectedValueOnce(new Error('Not Found'));

    const result = await readGCSManifest('new-comic');

    expect(result).toEqual({ scenes: [] });
  });
});

// ---------------------------------------------------------------------------
// publishScene
// ---------------------------------------------------------------------------
describe('publishScene', () => {
  const sceneSlug = 'test-scene';
  const comicBookSlug = 'my-comic';
  const sceneData = { name: 'Test Scene', slug: sceneSlug, layers: [], objects: [] };

  beforeEach(() => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockImplementation((filePath) => {
      if (filePath.endsWith('scene.json')) return JSON.stringify(sceneData);
      return Buffer.from('fake-image-bytes');
    });
    fs.readdirSync.mockReturnValue([
      'scene.json',
      'layer-0.png',
      'layer-1.png',
      'layer-1-blur.png',
    ]);
    // No existing manifest
    mockDownload.mockRejectedValue(new Error('Not Found'));
  });

  it('throws when scene directory does not exist', async () => {
    fs.existsSync.mockReturnValue(false);
    await expect(publishScene(SCENES_DIR, sceneSlug, comicBookSlug)).rejects.toThrow(
      `Scene "${sceneSlug}" not found`,
    );
  });

  it('uploads scene.json and all layer PNGs', async () => {
    await publishScene(SCENES_DIR, sceneSlug, comicBookSlug);

    expect(mockSaveScene).toHaveBeenCalledOnce();
    const [calledComicSlug, calledSceneSlug, calledSceneData, calledLayerFiles] =
      mockSaveScene.mock.calls[0];
    expect(calledComicSlug).toBe(comicBookSlug);
    expect(calledSceneSlug).toBe(sceneSlug);
    expect(calledSceneData).toEqual(sceneData);
    // Only PNG files matching layer-*.png
    expect(Object.keys(calledLayerFiles)).toEqual(
      expect.arrayContaining(['layer-0.png', 'layer-1.png', 'layer-1-blur.png']),
    );
    expect(Object.keys(calledLayerFiles)).not.toContain('scene.json');
  });

  it('uploads to correct GCS paths via saveScene', async () => {
    await publishScene(SCENES_DIR, sceneSlug, comicBookSlug);
    expect(mockSaveScene).toHaveBeenCalledWith(
      comicBookSlug,
      sceneSlug,
      sceneData,
      expect.any(Object),
    );
  });

  it('creates a new manifest entry when comic book is new', async () => {
    await publishScene(SCENES_DIR, sceneSlug, comicBookSlug);

    expect(mockSaveManifest).toHaveBeenCalledOnce();
    const [calledSlug, manifest] = mockSaveManifest.mock.calls[0];
    expect(calledSlug).toBe(comicBookSlug);
    expect(manifest.scenes).toHaveLength(1);
    expect(manifest.scenes[0]).toMatchObject({ slug: sceneSlug, name: 'Test Scene', order: 0 });
  });

  it('updates existing scene entry in manifest without duplicating', async () => {
    const existingManifest = {
      scenes: [
        { slug: sceneSlug, name: 'Old Name', order: 0 },
        { slug: 'other-scene', name: 'Other', order: 1 },
      ],
    };
    mockDownload.mockResolvedValueOnce([Buffer.from(JSON.stringify(existingManifest))]);

    await publishScene(SCENES_DIR, sceneSlug, comicBookSlug);

    const [, manifest] = mockSaveManifest.mock.calls[0];
    expect(manifest.scenes).toHaveLength(2);
    const updated = manifest.scenes.find((s) => s.slug === sceneSlug);
    expect(updated.name).toBe('Test Scene');
  });

  it('adds new scene to existing manifest', async () => {
    const existingManifest = {
      scenes: [{ slug: 'existing-scene', name: 'Existing', order: 0 }],
    };
    mockDownload.mockResolvedValueOnce([Buffer.from(JSON.stringify(existingManifest))]);

    await publishScene(SCENES_DIR, sceneSlug, comicBookSlug);

    const [, manifest] = mockSaveManifest.mock.calls[0];
    expect(manifest.scenes).toHaveLength(2);
    const newEntry = manifest.scenes.find((s) => s.slug === sceneSlug);
    expect(newEntry).toMatchObject({ slug: sceneSlug, order: 1 });
  });

  it('returns published: true with correct URL', async () => {
    const result = await publishScene(SCENES_DIR, sceneSlug, comicBookSlug);
    expect(result).toEqual({
      published: true,
      url: `gs://comic-engine/${comicBookSlug}/${sceneSlug}/`,
    });
  });
});

// ---------------------------------------------------------------------------
// reorderManifest
// ---------------------------------------------------------------------------
describe('reorderManifest', () => {
  const comicBookSlug = 'my-comic';
  const existingManifest = {
    scenes: [
      { slug: 'scene-a', name: 'Scene A', order: 0 },
      { slug: 'scene-b', name: 'Scene B', order: 1 },
      { slug: 'scene-c', name: 'Scene C', order: 2 },
    ],
  };

  beforeEach(() => {
    mockDownload.mockResolvedValue([Buffer.from(JSON.stringify(existingManifest))]);
  });

  it('reorders scenes according to provided slug order', async () => {
    const result = await reorderManifest(comicBookSlug, ['scene-c', 'scene-a', 'scene-b']);

    expect(result.scenes[0].slug).toBe('scene-c');
    expect(result.scenes[0].order).toBe(0);
    expect(result.scenes[1].slug).toBe('scene-a');
    expect(result.scenes[1].order).toBe(1);
    expect(result.scenes[2].slug).toBe('scene-b');
    expect(result.scenes[2].order).toBe(2);
  });

  it('saves updated manifest to GCS', async () => {
    await reorderManifest(comicBookSlug, ['scene-b', 'scene-a', 'scene-c']);
    expect(mockSaveManifest).toHaveBeenCalledOnce();
    const [calledSlug] = mockSaveManifest.mock.calls[0];
    expect(calledSlug).toBe(comicBookSlug);
  });

  it('appends scenes not in the provided list at the end', async () => {
    const result = await reorderManifest(comicBookSlug, ['scene-b']);

    expect(result.scenes[0].slug).toBe('scene-b');
    expect(result.scenes[0].order).toBe(0);
    // scene-a and scene-c appended after
    const remainder = result.scenes.slice(1).map((s) => s.slug);
    expect(remainder).toContain('scene-a');
    expect(remainder).toContain('scene-c');
  });

  it('ignores unknown slugs in the provided list', async () => {
    const result = await reorderManifest(comicBookSlug, ['scene-a', 'nonexistent', 'scene-c']);
    expect(result.scenes.map((s) => s.slug)).not.toContain('nonexistent');
  });
});
