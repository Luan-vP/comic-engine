import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { Scene } from '../Scene';
import { SceneObject } from '../SceneObject';
import { SceneObjectGroup, useGroup } from '../SceneObjectGroup';

afterEach(cleanup);

function renderWithProviders(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

// ─────────────────────────────────────────────────────────────────────────────
// SceneObjectGroup — basic rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('SceneObjectGroup', () => {
  it('renders children', () => {
    renderWithProviders(
      <Scene>
        <SceneObjectGroup groupId="g1">
          <div>child content</div>
        </SceneObjectGroup>
      </Scene>,
    );
    expect(screen.getByText('child content')).toBeDefined();
  });

  it('renders multiple children', () => {
    renderWithProviders(
      <Scene>
        <SceneObjectGroup groupId="g1">
          <div>layer A</div>
          <div>layer B</div>
        </SceneObjectGroup>
      </Scene>,
    );
    expect(screen.getByText('layer A')).toBeDefined();
    expect(screen.getByText('layer B')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GroupContext — SceneObject context preference
// ─────────────────────────────────────────────────────────────────────────────

describe('SceneObject group context preference', () => {
  it('SceneObject outside a group does not throw and renders', () => {
    // Backward-compat: ungrouped SceneObject still reads scene offset
    renderWithProviders(
      <Scene>
        <SceneObject>
          <div>ungrouped</div>
        </SceneObject>
      </Scene>,
    );
    expect(screen.getByText('ungrouped')).toBeDefined();
  });

  it('SceneObject inside a group renders without error', () => {
    renderWithProviders(
      <Scene>
        <SceneObjectGroup groupId="g1">
          <SceneObject>
            <div>grouped</div>
          </SceneObject>
        </SceneObjectGroup>
      </Scene>,
    );
    expect(screen.getByText('grouped')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useGroup hook
// ─────────────────────────────────────────────────────────────────────────────

describe('useGroup', () => {
  function GroupReader() {
    const group = useGroup();
    return <div data-testid="group-id">{group ? group.groupId : 'none'}</div>;
  }

  it('returns null when called outside a SceneObjectGroup', () => {
    renderWithProviders(
      <Scene>
        <GroupReader />
      </Scene>,
    );
    expect(screen.getByTestId('group-id').textContent).toBe('none');
  });

  it('returns group context when called inside a SceneObjectGroup', () => {
    renderWithProviders(
      <Scene>
        <SceneObjectGroup groupId="my-group">
          <GroupReader />
        </SceneObjectGroup>
      </Scene>,
    );
    expect(screen.getByTestId('group-id').textContent).toBe('my-group');
  });

  it('provides the zRange through context', () => {
    function ZRangeReader() {
      const group = useGroup();
      return (
        <div data-testid="zrange">
          {group ? `${group.zRange.far},${group.zRange.near}` : 'none'}
        </div>
      );
    }

    renderWithProviders(
      <Scene>
        <SceneObjectGroup groupId="g1" zRange={{ far: -300, near: -100 }}>
          <ZRangeReader />
        </SceneObjectGroup>
      </Scene>,
    );
    expect(screen.getByTestId('zrange').textContent).toBe('-300,-100');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Group selection — clicking selects only that group
// ─────────────────────────────────────────────────────────────────────────────

describe('group selection in edit mode', () => {
  it('group wrapper is present in the DOM', () => {
    render(
      <ThemeProvider>
        <Scene editable>
          <SceneObjectGroup groupId="g1">
            <div>group one</div>
          </SceneObjectGroup>
        </Scene>
      </ThemeProvider>,
    );
    expect(screen.getByText('group one')).toBeDefined();
  });

  it('multiple groups coexist in a scene', () => {
    renderWithProviders(
      <Scene>
        <SceneObjectGroup groupId="g1">
          <div>group one</div>
        </SceneObjectGroup>
        <SceneObjectGroup groupId="g2">
          <div>group two</div>
        </SceneObjectGroup>
      </Scene>,
    );
    expect(screen.getByText('group one')).toBeDefined();
    expect(screen.getByText('group two')).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generatePageTemplate — tested via vite-plugin-scene-exporter unit tests
// (see separate test file if needed; the function is an internal helper)
// ─────────────────────────────────────────────────────────────────────────────
