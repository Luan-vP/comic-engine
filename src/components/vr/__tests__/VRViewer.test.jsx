import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { VRViewer } from '../VRViewer';

// DeviceOrientationEvent is not available in jsdom; stub it out so
// VRViewer falls back to the mouse handler (no-op in tests).
vi.stubGlobal('DeviceOrientationEvent', undefined);

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('VRViewer', () => {
  it('renders without crashing', () => {
    renderWithTheme(<VRViewer layers={[]} />);
    expect(screen.getByTestId('vr-viewer')).toBeDefined();
  });

  it('renders both eye viewports', () => {
    renderWithTheme(<VRViewer layers={[]} />);
    expect(screen.getByTestId('vr-eye-left')).toBeDefined();
    expect(screen.getByTestId('vr-eye-right')).toBeDefined();
  });

  it('renders each layer in both eyes', () => {
    const layers = [
      {
        id: 'test-layer',
        position: [0, 0, 0],
        content: <div data-testid="test-layer-content">Test</div>,
      },
    ];
    renderWithTheme(<VRViewer layers={layers} />);
    // Layer appears once per eye = 2 total
    expect(screen.getAllByTestId('test-layer-content')).toHaveLength(2);
  });

  it('renders multiple layers in both eyes', () => {
    const layers = [
      { id: 'a', position: [0, 0, -200], content: <div data-testid="layer-a">A</div> },
      { id: 'b', position: [0, 0, 0], content: <div data-testid="layer-b">B</div> },
      { id: 'c', position: [0, 0, 200], content: <div data-testid="layer-c">C</div> },
    ];
    renderWithTheme(<VRViewer layers={layers} />);
    expect(screen.getAllByTestId('layer-a')).toHaveLength(2);
    expect(screen.getAllByTestId('layer-b')).toHaveLength(2);
    expect(screen.getAllByTestId('layer-c')).toHaveLength(2);
  });

  it('shows mouse hint status when not using device orientation', () => {
    renderWithTheme(<VRViewer layers={[]} />);
    // The status element is shown when usingOrientation is false (default in jsdom)
    expect(screen.getByRole('status')).toBeDefined();
  });
});
