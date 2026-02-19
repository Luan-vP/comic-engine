import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { InsertToolbar } from '../InsertToolbar';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

afterEach(cleanup);

describe('InsertToolbar', () => {
  it('renders the Add Object button', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    expect(screen.getByText('+ Add Object')).toBeDefined();
  });

  it('does not show card type picker by default', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    expect(screen.queryByText('Memory Card')).toBeNull();
    expect(screen.queryByText('Iframe Card')).toBeNull();
    expect(screen.queryByText('Text Card')).toBeNull();
  });

  it('shows card type picker when Add Object is clicked', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    fireEvent.click(screen.getByText('+ Add Object'));
    expect(screen.getByText('Memory Card')).toBeDefined();
    expect(screen.getByText('Iframe Card')).toBeDefined();
    expect(screen.getByText('Text Card')).toBeDefined();
  });

  it('toggles picker closed when Add Object is clicked again', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('+ Add Object'));
    expect(screen.queryByText('Memory Card')).toBeNull();
  });

  it('opens memory modal when Memory Card is selected', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Memory Card'));
    expect(screen.getByText('MEMORY CARD')).toBeDefined();
  });

  it('opens iframe modal when Iframe Card is selected', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Iframe Card'));
    expect(screen.getByText('IFRAME CARD')).toBeDefined();
  });

  it('opens text modal when Text Card is selected', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    expect(screen.getByText('TEXT CARD')).toBeDefined();
  });

  it('calls onInsert with correct type and data when text modal is confirmed', () => {
    const onInsert = vi.fn();
    renderWithTheme(<InsertToolbar onInsert={onInsert} slug="test-scene" />);

    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));

    fireEvent.change(screen.getByPlaceholderText('Title...'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('Body text...'), {
      target: { value: 'My body' },
    });
    fireEvent.click(screen.getByText('Insert'));

    expect(onInsert).toHaveBeenCalledWith({
      type: 'text',
      data: { title: 'My Title', body: 'My body' },
    });
  });

  it('closes modal and picker after cancel', () => {
    renderWithTheme(<InsertToolbar onInsert={() => {}} slug="test-scene" />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    expect(screen.getByText('TEXT CARD')).toBeDefined();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('TEXT CARD')).toBeNull();
    expect(screen.queryByText('Text Card')).toBeNull();
  });
});
