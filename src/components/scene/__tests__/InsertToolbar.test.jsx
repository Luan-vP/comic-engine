import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { InsertToolbar } from '../InsertToolbar';

afterEach(cleanup);

function renderWithProviders(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('InsertToolbar', () => {
  it('renders Add Object button', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    expect(screen.getByText('+ Add Object')).toBeDefined();
  });

  it('does not show card type picker by default', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    expect(screen.queryByText('Memory Card')).toBeNull();
  });

  it('shows card type picker when button clicked', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    expect(screen.getByText('Memory Card')).toBeDefined();
    expect(screen.getByText('Iframe Card')).toBeDefined();
    expect(screen.getByText('Text Card')).toBeDefined();
  });

  it('hides picker after clicking a card type', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Iframe Card'));
    expect(screen.queryByText('Memory Card')).toBeNull();
  });

  it('opens Iframe modal when Iframe Card selected', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Iframe Card'));
    expect(screen.getByText('ADD IFRAME CARD')).toBeDefined();
  });

  it('opens Text modal when Text Card selected', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    expect(screen.getByText('ADD TEXT CARD')).toBeDefined();
  });

  it('opens Memory modal when Memory Card selected', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Memory Card'));
    expect(screen.getByText('ADD MEMORY CARD')).toBeDefined();
  });

  it('closes modal when Cancel is clicked', () => {
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('ADD TEXT CARD')).toBeNull();
  });

  it('calls onInsert with correct data when Text modal is confirmed', () => {
    const onInsert = vi.fn();
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={onInsert} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    fireEvent.change(screen.getByPlaceholderText('Card title...'), {
      target: { value: 'Hello' },
    });
    fireEvent.click(screen.getByText('Add'));
    expect(onInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text',
        data: expect.objectContaining({ title: 'Hello' }),
      }),
    );
  });

  it('onInsert payload includes an id', () => {
    const onInsert = vi.fn();
    renderWithProviders(<InsertToolbar slug="test-scene" onInsert={onInsert} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    fireEvent.change(screen.getByPlaceholderText('Card title...'), {
      target: { value: 'Test' },
    });
    fireEvent.click(screen.getByText('Add'));
    expect(onInsert).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });
});
