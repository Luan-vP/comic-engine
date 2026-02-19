import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { BiographySnapshots } from '../../../pages/BiographySnapshots';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

function renderPage() {
  return render(
    <MemoryRouter>
      <ThemeProvider initialTheme="noir">
        <BiographySnapshots />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('BiographySnapshots page', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders without crashing', () => {
    renderPage();
    expect(screen.getByText('Biography')).toBeDefined();
  });

  it('shows memory and character stats', () => {
    renderPage();
    // Stats should show 0 initially — text may appear in both tabs and stats
    expect(screen.getAllByText('MEMORIES').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('CHARACTERS').length).toBeGreaterThanOrEqual(1);
  });

  it('shows the Timeline tab by default', () => {
    renderPage();
    expect(screen.getByText('TIMELINE')).toBeDefined();
  });

  it('shows empty state when no memories exist', () => {
    renderPage();
    expect(screen.getByText('No memories yet')).toBeDefined();
  });
});
