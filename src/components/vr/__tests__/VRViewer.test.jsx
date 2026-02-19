import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { VRViewer } from '../VRViewer';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const testLayers = [
  {
    id: 'layer-bg',
    position: [0, 0, -200],
    parallaxFactor: 0.3,
    content: <div>Background</div>,
  },
  {
    id: 'layer-mid',
    position: [0, 0, 0],
    parallaxFactor: 0.6,
    content: <div>Midground</div>,
  },
];

afterEach(cleanup);

describe('VRViewer', () => {
  it('renders without crashing', () => {
    renderWithTheme(<VRViewer layers={[]} />);
    expect(screen.getByTestId('vr-viewer')).toBeDefined();
  });

  it('renders left and right eye viewports', () => {
    renderWithTheme(<VRViewer layers={[]} />);
    expect(screen.getByTestId('eye-left')).toBeDefined();
    expect(screen.getByTestId('eye-right')).toBeDefined();
  });

  it('renders layer content in both eye viewports', () => {
    renderWithTheme(<VRViewer layers={testLayers} />);
    // Each layer's content appears once per eye
    const backgrounds = screen.getAllByText('Background');
    expect(backgrounds.length).toBe(2);
    const midgrounds = screen.getAllByText('Midground');
    expect(midgrounds.length).toBe(2);
  });

  it('renders with empty layers without crashing', () => {
    renderWithTheme(<VRViewer layers={[]} />);
    expect(screen.getByTestId('vr-viewer')).toBeDefined();
  });

  it('accepts custom perspective and stereoOffset props', () => {
    renderWithTheme(<VRViewer layers={[]} perspective={800} stereoOffset={10} />);
    expect(screen.getByTestId('vr-viewer')).toBeDefined();
  });
});
