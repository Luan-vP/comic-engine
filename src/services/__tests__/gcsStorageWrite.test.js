import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSave = vi.fn().mockResolvedValue(undefined);
const mockDelete = vi.fn().mockResolvedValue(undefined);
const mockFile = vi.fn(() => ({ save: mockSave, delete: mockDelete }));
const mockGetFiles = vi.fn();
const mockBucket = vi.fn(() => ({ file: mockFile, getFiles: mockGetFiles }));

vi.mock('@google-cloud/storage', () => ({
  Storage: vi.fn(() => ({ bucket: mockBucket })),
}));

// Import after mock is set up
const { saveScene, saveManifest, deleteScene } = await import('../gcsStorageWrite.js');

beforeEach(() => {
  vi.clearAllMocks();
  mockGetFiles.mockResolvedValue([[]]);
});

describe('saveScene', () => {
  it('uploads scene.json with correct path and content type', async () => {
    const sceneData = { name: 'My Scene', slug: 'my-scene', layers: [], objects: [], sceneConfig: {} };
    await saveScene('my-comic', 'my-scene', sceneData);

    expect(mockFile).toHaveBeenCalledWith('my-comic/my-scene/scene.json');
    expect(mockSave).toHaveBeenCalledWith(
      JSON.stringify(sceneData, null, 2),
      { contentType: 'application/json' },
    );
  });

  it('uploads each layer file with correct path', async () => {
    const sceneData = { name: 'S', slug: 's', layers: [], objects: [], sceneConfig: {} };
    const buf0 = Buffer.from('img0');
    const buf1 = Buffer.from('img1');
    await saveScene('my-comic', 'my-scene', sceneData, {
      'layer-0.png': buf0,
      'layer-1.png': buf1,
    });

    expect(mockFile).toHaveBeenCalledWith('my-comic/my-scene/layer-0.png');
    expect(mockFile).toHaveBeenCalledWith('my-comic/my-scene/layer-1.png');
    expect(mockSave).toHaveBeenCalledWith(buf0, { contentType: 'image/png' });
    expect(mockSave).toHaveBeenCalledWith(buf1, { contentType: 'image/png' });
  });

  it('works with no layer files', async () => {
    const sceneData = { name: 'S', slug: 's', layers: [], objects: [], sceneConfig: {} };
    await saveScene('my-comic', 'my-scene', sceneData);
    // Only scene.json save call
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});

describe('saveManifest', () => {
  it('uploads manifest.json to correct path', async () => {
    const manifest = { scenes: [{ slug: 'scene-1', name: 'Scene 1', order: 0 }] };
    await saveManifest('my-comic', manifest);

    expect(mockFile).toHaveBeenCalledWith('my-comic/manifest.json');
    expect(mockSave).toHaveBeenCalledWith(
      JSON.stringify(manifest, null, 2),
      { contentType: 'application/json' },
    );
  });
});

describe('deleteScene', () => {
  it('deletes all files under the scene prefix', async () => {
    const mockFileA = { delete: vi.fn().mockResolvedValue(undefined) };
    const mockFileB = { delete: vi.fn().mockResolvedValue(undefined) };
    mockGetFiles.mockResolvedValue([[mockFileA, mockFileB]]);

    await deleteScene('my-comic', 'my-scene');

    expect(mockGetFiles).toHaveBeenCalledWith({ prefix: 'my-comic/my-scene/' });
    expect(mockFileA.delete).toHaveBeenCalled();
    expect(mockFileB.delete).toHaveBeenCalled();
  });

  it('handles empty scene (no files to delete)', async () => {
    mockGetFiles.mockResolvedValue([[]]);
    await expect(deleteScene('my-comic', 'empty-scene')).resolves.toBeUndefined();
  });
});
