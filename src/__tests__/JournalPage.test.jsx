import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../theme/ThemeContext';
import { JournalPage } from '../pages/JournalPage';

// Mock canvas for any components that use it
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  font: '',
  textBaseline: '',
  fillStyle: '',
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  clearRect: vi.fn(),
  createImageData: vi.fn((w, h) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  })),
  putImageData: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  drawImage: vi.fn(),
  canvas: { width: 100, height: 100 },
}));

function renderJournalPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider initialTheme="noir">
        <JournalPage />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('JournalPage', () => {
  it('renders without crashing', () => {
    renderJournalPage();
    // Header label is always present
    expect(screen.getByText('JOURNAL')).toBeDefined();
  });

  it('shows the file upload button in empty state', () => {
    renderJournalPage();
    expect(screen.getByText('Open .md / .json')).toBeDefined();
  });

  it('shows the empty state instruction text', () => {
    renderJournalPage();
    expect(screen.getByText('JOURNAL INTEGRATION')).toBeDefined();
  });
});
