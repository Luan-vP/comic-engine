import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DynamicScenePage } from '../DynamicScenePage.jsx';

// ─────────────────────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────────────────────

// Mock the scene loader so we can control the config returned to the page.
vi.mock('../../hooks/useSceneLoader', () => ({
  useSceneLoader: vi.fn(),
}));

// Mock useZScroll — keep it lightweight and give stable scrollZ=0 so drag math
// uses invScale=1 (perspective compensation test).
vi.mock('../../hooks/useZScroll', () => ({
  useZScroll: () => ({
    scrollZ: 0,
    currentSlideIndex: 0,
    jumpToSlide: vi.fn(),
    progress: 0,
    slidesWithProgress: [],
    containerRef: { current: null },
  }),
}));

// Flatten Scene / SceneObject so we can find the draggable element and trigger
// the `onDragStart` / `onClick` props directly.
vi.mock('../../components/scene', () => ({
  Scene: ({ children }) => <div data-testid="scene">{children}</div>,
  SceneObject: ({ children, onClick, onDragStart, style }) => (
    <div
      data-testid="scene-object"
      style={style}
      onMouseDown={
        onDragStart
          ? (e) => {
              e.stopPropagation();
              onDragStart(e);
            }
          : undefined
      }
      onClick={onClick}
    >
      {children}
    </div>
  ),
}));

// Stub out the card type registry — content is unimportant for drag logic.
vi.mock('../../components/scene/cardTypes', () => ({
  CARD_TYPE_REGISTRY: [
    {
      id: 'text',
      renderContent: (obj) => <div data-testid={`content-${obj.id}`}>{obj.id}</div>,
    },
  ],
}));

// Minimal edit popover — we only need to know when it opens/closes to verify
// selection state changes.
vi.mock('../../components/scene/ObjectEditPopover', () => ({
  ObjectEditPopover: ({ object, onClose }) => (
    <div data-testid="edit-popover">
      popover for {object.id}
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

// Minimap — keep it invisible; accepts onSlideClick but we don't exercise it.
vi.mock('../../components/minimap', () => ({
  ScrollMinimap: () => <div data-testid="minimap" />,
}));

// Theme context — provide the minimum surface used by DynamicScenePage.
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
    setTheme: vi.fn(),
  }),
}));

import { useSceneLoader } from '../../hooks/useSceneLoader';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/scenes/test-scene']}>
      <Routes>
        <Route path="/scenes/:slug" element={<DynamicScenePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('DynamicScenePage — drag & selection', () => {
  function makeConfig(overrides = {}) {
    return {
      scene: {
        layers: [],
        objects: [
          { id: 'card-a', type: 'text', position: [0, 0, 0] },
          { id: 'card-b', type: 'text', position: [100, 50, 0] },
        ],
        sceneConfig: { perspective: 1000, parallaxIntensity: 1 },
      },
      loading: false,
      error: null,
      save: vi.fn(),
      ...overrides,
    };
  }

  function cardEl(id) {
    return screen.getByTestId(`content-${id}`).closest('[data-testid="scene-object"]');
  }

  it('selects an object on click (opens popover)', () => {
    useSceneLoader.mockReturnValue(makeConfig());
    renderPage();

    expect(screen.queryByTestId('edit-popover')).toBeNull();

    // Click the first card — flattened SceneObject forwards onClick to the
    // page's handleCardClick handler.
    fireEvent.click(cardEl('card-a'));

    expect(screen.getByTestId('edit-popover')).toBeTruthy();
    expect(screen.getByText(/popover for card-a/)).toBeTruthy();
  });

  it('deselects (closes popover) when the close handler fires — simulating click outside', () => {
    useSceneLoader.mockReturnValue(makeConfig());
    renderPage();

    fireEvent.click(cardEl('card-a'));
    expect(screen.getByTestId('edit-popover')).toBeTruthy();

    // Trigger the popover's onClose — the page deselects.
    fireEvent.click(screen.getByText('close'));
    expect(screen.queryByTestId('edit-popover')).toBeNull();
  });

  it('treats a small movement (<=3px) as a click, not a drag', () => {
    useSceneLoader.mockReturnValue(makeConfig());
    renderPage();

    // First click selects
    fireEvent.click(cardEl('card-a'));
    expect(screen.getByTestId('edit-popover')).toBeTruthy();

    // Start a "drag" but only move 2px, then release — didDrag stays false.
    fireEvent.mouseDown(cardEl('card-a'), { clientX: 50, clientY: 50 });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 52, clientY: 51 }));
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    // Click on the OTHER card to verify didDrag=false allowed the subsequent
    // click to re-select a different one.
    fireEvent.click(cardEl('card-b'));
    expect(screen.getByText(/popover for card-b/)).toBeTruthy();
  });

  it('treats a movement >3px as a drag — subsequent click is swallowed', () => {
    useSceneLoader.mockReturnValue(makeConfig());
    renderPage();

    // Select card-a
    fireEvent.click(cardEl('card-a'));
    expect(screen.getByText(/popover for card-a/)).toBeTruthy();

    // Start drag on selected card (onDragStart is wired only when selected)
    fireEvent.mouseDown(cardEl('card-a'), { clientX: 100, clientY: 100 });

    // Move 20px — crosses the 3px threshold -> didDrag=true
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 120, clientY: 120 }));
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    // A subsequent click on ANOTHER card fires synchronously after mouseup; the
    // handler's didDragRef check should swallow it (handleCardClick early-returns
    // when didDrag was true, and resets didDrag afterward).
    fireEvent.click(cardEl('card-b'));
    // Popover should still be on card-a — the click was swallowed.
    expect(screen.getByText(/popover for card-a/)).toBeTruthy();
  });

  it('perspective-compensated drag keeps the popover open during the drag (scale=1 at z=0)', () => {
    // With scrollZ=0 and object z=0, cssZ=0 and scale=perspective/(perspective-0)=1,
    // so the position delta equals the raw mouse delta. This smoke test ensures
    // the handler's math doesn't throw when scale=1.
    useSceneLoader.mockReturnValue(makeConfig());
    renderPage();

    fireEvent.click(cardEl('card-a'));
    fireEvent.mouseDown(cardEl('card-a'), { clientX: 200, clientY: 200 });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 210, clientY: 220 }));
    });

    expect(screen.getByText(/popover for card-a/)).toBeTruthy();

    act(() => {
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(screen.getByText(/popover for card-a/)).toBeTruthy();
  });
});

describe('DynamicScenePage — loading/error states', () => {
  it('shows loading indicator while scene is loading', () => {
    useSceneLoader.mockReturnValue({
      scene: null,
      loading: true,
      error: null,
      save: vi.fn(),
    });
    renderPage();
    expect(screen.getByText(/Loading scene/)).toBeTruthy();
  });

  it('shows error state when scene fails to load', () => {
    useSceneLoader.mockReturnValue({
      scene: null,
      loading: false,
      error: 'SCENE_NOT_FOUND',
      save: vi.fn(),
    });
    renderPage();
    expect(screen.getByText('Scene not found')).toBeTruthy();
    expect(screen.getByText('SCENE_NOT_FOUND')).toBeTruthy();
  });
});
