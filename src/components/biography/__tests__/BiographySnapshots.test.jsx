import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    // Stats should show 0 initially
    expect(screen.getByText('MEMORIES')).toBeDefined();
    expect(screen.getByText('CHARACTERS')).toBeDefined();
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
