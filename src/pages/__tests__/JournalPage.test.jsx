import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../theme/ThemeContext';
import { JournalPage } from '../JournalPage';

// Mock canvas getContext used by overlay components
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

function renderJournalPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider initialTheme="noir">
        <JournalPage />
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('JournalPage', () => {
  it('renders without crashing', () => {
    renderJournalPage();
    expect(screen.getByText('Load .md / .json')).toBeDefined();
  });

  it('shows the JOURNAL heading in the control panel', () => {
    renderJournalPage();
    // At least one element contains JOURNAL text
    const elements = screen.getAllByText('JOURNAL');
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows the import button', () => {
    renderJournalPage();
    expect(screen.getByText('Load .md / .json')).toBeDefined();
  });

  it('shows empty state message when no entries are loaded', () => {
    renderJournalPage();
    expect(screen.getByText(/Load Obsidian markdown files/)).toBeDefined();
  });
});
