import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { BiographySnapshots } from '../../../pages/BiographySnapshots';

// Mock canvas (same pattern as App.test.jsx)
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  font: '',
  textBaseline: '',
  fillStyle: '',
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  clearRect: vi.fn(),
  canvas: { width: 100, height: 100 },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

function Wrapper({ children }) {
  return (
    <MemoryRouter>
      <ThemeProvider initialTheme="noir">{children}</ThemeProvider>
    </MemoryRouter>
  );
}

describe('BiographySnapshots page', () => {
  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders without crashing', () => {
    render(<BiographySnapshots />, { wrapper: Wrapper });
    expect(screen.getByText('Biography Snapshots')).toBeDefined();
  });

  it('shows the Timeline tab by default', () => {
    render(<BiographySnapshots />, { wrapper: Wrapper });
    expect(screen.getByText('No Memories Yet')).toBeDefined();
  });

  it('displays stat counts', () => {
    render(<BiographySnapshots />, { wrapper: Wrapper });
    // Both stats start at 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });
});
