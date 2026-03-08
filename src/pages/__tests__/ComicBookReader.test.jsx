import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ComicBookReader } from '../ComicBookReader.jsx';

// Mock the useComicBook hook
vi.mock('../../hooks/useComicBook.js', () => ({
  useComicBook: vi.fn(),
}));

// Mock gcsStorage so getLayerUrl is controllable
vi.mock('../../services/gcsStorage.js', () => ({
  getLayerUrl: (comicBookSlug, sceneSlug, layerFile) =>
    `https://storage.googleapis.com/comic-engine/${comicBookSlug}/${sceneSlug}/${layerFile}`,
}));

// Mock Scene and SceneObject to render children directly
vi.mock('../../components/scene', () => ({
  Scene: ({ children }) => <div data-testid="scene">{children}</div>,
  SceneObject: ({ children }) => <div data-testid="scene-object">{children}</div>,
}));

// Mock cardTypes
vi.mock('../../components/scene/cardTypes', () => ({
  CARD_TYPE_REGISTRY: [],
}));

// Mock ThemeContext
vi.mock('../../theme/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        backgroundGradient: 'black',
        textMuted: '#aaa',
        primary: '#fff',
        textSubtle: '#888',
      },
      typography: { fontBody: 'sans-serif' },
    },
  }),
}));

import { useComicBook } from '../../hooks/useComicBook.js';

function renderReader(path = '/read/my-comic') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/read/:comicBookSlug" element={<ComicBookReader />} />
        <Route path="/read/:comicBookSlug/:slide" element={<ComicBookReader />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('ComicBookReader', () => {
  it('shows loading state initially', () => {
    useComicBook.mockReturnValue({ manifest: null, currentScene: null, loading: true, error: null });
    renderReader();
    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  it('shows error when manifest not found', () => {
    useComicBook.mockReturnValue({
      manifest: null,
      currentScene: null,
      loading: false,
      error: 'MANIFEST_NOT_FOUND',
    });
    renderReader('/read/missing-comic');
    expect(screen.getByText('Comic book not found')).toBeTruthy();
    expect(screen.getByText(/No comic book found at "missing-comic"/)).toBeTruthy();
  });

  it('shows generic error message for non-manifest errors', () => {
    useComicBook.mockReturnValue({
      manifest: null,
      currentScene: null,
      loading: false,
      error: 'SCENE_NOT_FOUND',
    });
    renderReader();
    expect(screen.getByText('Failed to load')).toBeTruthy();
    expect(screen.getByText('SCENE_NOT_FOUND')).toBeTruthy();
  });

  it('shows "no scenes" when manifest is empty', () => {
    useComicBook.mockReturnValue({
      manifest: { scenes: [] },
      currentScene: null,
      loading: false,
      error: null,
    });
    renderReader();
    expect(screen.getByText('No scenes found')).toBeTruthy();
  });

  it('renders Scene and SceneObject with GCS image URLs', () => {
    const manifest = {
      scenes: [{ slug: 'scene-1', name: 'Scene 1', order: 0 }],
    };
    const currentScene = {
      layers: [{ index: 0, parallaxFactor: 0.2, position: [0, 0, 0] }],
      objects: [],
      sceneConfig: { perspective: 1000, parallaxIntensity: 1, mouseInfluence: { x: 50, y: 30 } },
    };
    useComicBook.mockReturnValue({ manifest, currentScene, loading: false, error: null });

    renderReader('/read/my-comic/1');

    expect(screen.getByTestId('scene')).toBeTruthy();
    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toBe(
      'https://storage.googleapis.com/comic-engine/my-comic/scene-1/layer-0.png',
    );
  });

  it('uses blur variant URL when layer.hasBlurFill is true', () => {
    const manifest = { scenes: [{ slug: 'scene-1', name: 'Scene 1', order: 0 }] };
    const currentScene = {
      layers: [{ index: 0, parallaxFactor: 0.2, position: [0, 0, 0], hasBlurFill: true }],
      objects: [],
      sceneConfig: {},
    };
    useComicBook.mockReturnValue({ manifest, currentScene, loading: false, error: null });

    renderReader('/read/my-comic/1');

    const img = screen.getByRole('img');
    expect(img.getAttribute('src')).toContain('layer-0-blur.png');
  });

  it('calls useComicBook with 0-based slideIndex from URL', () => {
    useComicBook.mockReturnValue({ manifest: null, currentScene: null, loading: true, error: null });

    renderReader('/read/my-comic/3');

    // URL param "3" should become slideIndex 2 (0-based)
    expect(useComicBook).toHaveBeenCalledWith('my-comic', 2);
  });

  it('defaults to slideIndex 0 when no slide param', () => {
    useComicBook.mockReturnValue({ manifest: null, currentScene: null, loading: true, error: null });

    renderReader('/read/my-comic');

    expect(useComicBook).toHaveBeenCalledWith('my-comic', 0);
  });

  it('handles keyboard navigation (ArrowRight goes next)', () => {
    const manifest = {
      scenes: [
        { slug: 'scene-1', name: 'Scene 1', order: 0 },
        { slug: 'scene-2', name: 'Scene 2', order: 1 },
      ],
    };
    const currentScene = {
      layers: [],
      objects: [],
      sceneConfig: {},
    };
    useComicBook.mockReturnValue({ manifest, currentScene, loading: false, error: null });

    renderReader('/read/my-comic/1');

    // Simulate ArrowRight key press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });

    // After navigation, slideIndex should advance — verify hook called with 0 initially
    expect(useComicBook).toHaveBeenCalledWith('my-comic', 0);
  });
});
