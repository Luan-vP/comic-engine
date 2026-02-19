import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { IframeCardModal, TextCardModal } from '../InsertModals';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

afterEach(cleanup);

// MemoryCardModal uses fetch so we test it separately with a mock
describe('IframeCardModal', () => {
  it('renders URL input', () => {
    renderWithTheme(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByPlaceholderText('https://example.com')).toBeDefined();
  });

  it('Insert button is disabled when URL is empty', () => {
    renderWithTheme(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    const insertBtn = screen.getByText('Insert');
    expect(insertBtn.disabled).toBe(true);
  });

  it('Insert button is enabled when URL is provided', () => {
    renderWithTheme(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    const input = screen.getByPlaceholderText('https://example.com');
    fireEvent.change(input, { target: { value: 'https://example.com' } });
    const insertBtn = screen.getByText('Insert');
    expect(insertBtn.disabled).toBe(false);
  });

  it('calls onConfirm with url and position when confirmed', () => {
    const onConfirm = vi.fn();
    renderWithTheme(<IframeCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://test.com' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://test.com',
        panelVariant: 'monitor',
        position: [0, 0, 150],
      }),
    );
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    renderWithTheme(<IframeCardModal onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('trims whitespace from URL', () => {
    const onConfirm = vi.fn();
    renderWithTheme(<IframeCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: '  https://trimmed.com  ' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ url: 'https://trimmed.com' }));
  });
});

describe('TextCardModal', () => {
  it('renders title and body inputs', () => {
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByPlaceholderText('Enter title...')).toBeDefined();
    expect(screen.getByPlaceholderText('Enter body text...')).toBeDefined();
  });

  it('Insert button is disabled when both title and body are empty', () => {
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Insert').disabled).toBe(true);
  });

  it('Insert button is enabled when title is provided', () => {
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Enter title...'), {
      target: { value: 'Hello' },
    });
    expect(screen.getByText('Insert').disabled).toBe(false);
  });

  it('Insert button is enabled when only body is provided', () => {
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Enter body text...'), {
      target: { value: 'Some text' },
    });
    expect(screen.getByText('Insert').disabled).toBe(false);
  });

  it('calls onConfirm with title, body, and correct defaults', () => {
    const onConfirm = vi.fn();
    renderWithTheme(<TextCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Enter title...'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('Enter body text...'), {
      target: { value: 'My body' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My Title',
        body: 'My body',
        panelVariant: 'default',
        position: [0, -100, 0],
      }),
    );
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
