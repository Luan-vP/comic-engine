import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { MemoryCardModal, IframeCardModal, TextCardModal } from '../InsertModals';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

afterEach(cleanup);

// ---------------------------------------------------------------------------
// MemoryCardModal
// ---------------------------------------------------------------------------

describe('MemoryCardModal', () => {
  it('renders file input and caption input', () => {
    renderWithTheme(
      <MemoryCardModal onConfirm={() => {}} onCancel={() => {}} slug="test-scene" />,
    );
    expect(screen.getByText('MEMORY CARD')).toBeDefined();
    expect(screen.getByPlaceholderText('A memory...')).toBeDefined();
    // File input
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    renderWithTheme(
      <MemoryCardModal onConfirm={() => {}} onCancel={onCancel} slug="test-scene" />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows error when Insert is clicked without selecting an image', () => {
    renderWithTheme(
      <MemoryCardModal onConfirm={() => {}} onCancel={() => {}} slug="test-scene" />,
    );
    fireEvent.click(screen.getByText('Insert'));
    expect(screen.getByText('Please select an image.')).toBeDefined();
  });

  it('shows error for unsupported file type', () => {
    renderWithTheme(
      <MemoryCardModal onConfirm={() => {}} onCancel={() => {}} slug="test-scene" />,
    );
    const fileInput = document.querySelector('input[type="file"]');
    const file = new File(['data'], 'test.gif', { type: 'image/gif' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    expect(screen.getByText('Only JPEG and PNG files are supported.')).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// IframeCardModal
// ---------------------------------------------------------------------------

describe('IframeCardModal', () => {
  it('renders URL input', () => {
    renderWithTheme(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('IFRAME CARD')).toBeDefined();
    expect(screen.getByPlaceholderText('https://example.com')).toBeDefined();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    renderWithTheme(<IframeCardModal onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows error when Insert is clicked with empty URL', () => {
    renderWithTheme(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Insert'));
    expect(screen.getByText('Please enter a URL.')).toBeDefined();
  });

  it('calls onConfirm with trimmed URL', () => {
    const onConfirm = vi.fn();
    renderWithTheme(<IframeCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: '  https://example.com  ' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onConfirm).toHaveBeenCalledWith({ url: 'https://example.com' });
  });
});

// ---------------------------------------------------------------------------
// TextCardModal
// ---------------------------------------------------------------------------

describe('TextCardModal', () => {
  it('renders title and body inputs', () => {
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('TEXT CARD')).toBeDefined();
    expect(screen.getByPlaceholderText('Title...')).toBeDefined();
    expect(screen.getByPlaceholderText('Body text...')).toBeDefined();
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows error when both title and body are empty', () => {
    renderWithTheme(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByText('Insert'));
    expect(screen.getByText('Please enter a title or body text.')).toBeDefined();
  });

  it('calls onConfirm with title and body', () => {
    const onConfirm = vi.fn();
    renderWithTheme(<TextCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Title...'), {
      target: { value: 'Hello' },
    });
    fireEvent.change(screen.getByPlaceholderText('Body text...'), {
      target: { value: 'World' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onConfirm).toHaveBeenCalledWith({ title: 'Hello', body: 'World' });
  });

  it('calls onConfirm with only title when body is empty', () => {
    const onConfirm = vi.fn();
    renderWithTheme(<TextCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Title...'), {
      target: { value: 'Just a Title' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onConfirm).toHaveBeenCalledWith({ title: 'Just a Title', body: '' });
  });

  it('trims whitespace from inputs', () => {
    const onConfirm = vi.fn();
    renderWithTheme(<TextCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Title...'), {
      target: { value: '  Trimmed  ' },
    });
    fireEvent.click(screen.getByText('Insert'));
    expect(onConfirm).toHaveBeenCalledWith({ title: 'Trimmed', body: '' });
  });
});
