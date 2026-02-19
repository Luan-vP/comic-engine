import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Mock canvas getContext for components that use <canvas>
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

describe('App', () => {
  it('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByText('THEME')).toBeDefined();
  });
});
