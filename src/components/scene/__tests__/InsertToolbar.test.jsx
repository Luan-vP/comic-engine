import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { InsertToolbar } from '../InsertToolbar';

// Mock InsertModals to avoid fetch calls in unit tests
vi.mock('../InsertModals', () => ({
  MemoryCardModal: ({ onCancel }) => (
    <div data-testid="memory-modal">
      <button onClick={onCancel}>cancel-memory</button>
    </div>
  ),
  IframeCardModal: ({ onConfirm, onCancel }) => (
    <div data-testid="iframe-modal">
      <button onClick={() => onConfirm({ url: 'https://example.com', position: [0, 0, 150], parallaxFactor: 0.9, panelVariant: 'monitor' })}>confirm-iframe</button>
      <button onClick={onCancel}>cancel-iframe</button>
    </div>
  ),
  TextCardModal: ({ onConfirm, onCancel }) => (
    <div data-testid="text-modal">
      <button onClick={() => onConfirm({ title: 'Hi', body: 'World', position: [0, -100, 0], parallaxFactor: 0.6, panelVariant: 'default' })}>confirm-text</button>
      <button onClick={onCancel}>cancel-text</button>
    </div>
  ),
}));

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

afterEach(cleanup);

describe('InsertToolbar', () => {
  it('renders the Add Object button', () => {
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    expect(screen.getByText('+ Add Object')).toBeDefined();
  });

  it('shows card type picker after clicking Add Object', () => {
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    expect(screen.getByText('Memory Card')).toBeDefined();
    expect(screen.getByText('Iframe Card')).toBeDefined();
    expect(screen.getByText('Text Card')).toBeDefined();
  });

  it('hides picker on second click of Add Object button', () => {
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    expect(screen.getByText('Memory Card')).toBeDefined();
    fireEvent.click(screen.getByText('+ Add Object'));
    expect(screen.queryByText('Memory Card')).toBeNull();
  });

  it('opens memory modal when Memory Card is selected', () => {
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Memory Card'));
    expect(screen.getByTestId('memory-modal')).toBeDefined();
  });

  it('opens iframe modal when Iframe Card is selected', () => {
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Iframe Card'));
    expect(screen.getByTestId('iframe-modal')).toBeDefined();
  });

  it('opens text modal when Text Card is selected', () => {
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    expect(screen.getByTestId('text-modal')).toBeDefined();
  });

  it('calls onInsert with type and data when iframe modal confirms', () => {
    const onInsert = vi.fn();
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={onInsert} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Iframe Card'));
    fireEvent.click(screen.getByText('confirm-iframe'));
    expect(onInsert).toHaveBeenCalledWith('iframe', expect.objectContaining({ url: 'https://example.com' }));
  });

  it('calls onInsert with type and data when text modal confirms', () => {
    const onInsert = vi.fn();
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={onInsert} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Text Card'));
    fireEvent.click(screen.getByText('confirm-text'));
    expect(onInsert).toHaveBeenCalledWith('text', expect.objectContaining({ title: 'Hi', body: 'World' }));
  });

  it('closes modal when cancel is clicked', () => {
    renderWithTheme(<InsertToolbar slug="test-scene" onInsert={() => {}} />);
    fireEvent.click(screen.getByText('+ Add Object'));
    fireEvent.click(screen.getByText('Memory Card'));
    expect(screen.getByTestId('memory-modal')).toBeDefined();
    fireEvent.click(screen.getByText('cancel-memory'));
    expect(screen.queryByTestId('memory-modal')).toBeNull();
  });
});
