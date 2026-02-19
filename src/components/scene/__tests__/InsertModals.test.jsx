import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { IframeCardModal, TextCardModal, MemoryCardModal } from '../InsertModals';

afterEach(cleanup);

function renderWithProviders(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

// ─────────────────────────────────────────────────────────────────────────────
// IframeCardModal
// ─────────────────────────────────────────────────────────────────────────────

describe('IframeCardModal', () => {
  it('renders URL input', () => {
    renderWithProviders(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByPlaceholderText('https://example.com')).toBeDefined();
  });

  it('confirm button disabled when URL is empty', () => {
    renderWithProviders(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Add').disabled).toBe(true);
  });

  it('confirm button enabled when valid https URL entered', () => {
    renderWithProviders(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://example.com' },
    });
    expect(screen.getByText('Add').disabled).toBe(false);
  });

  it('confirm button enabled when valid http URL entered', () => {
    renderWithProviders(<IframeCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'http://localhost:3000' },
    });
    expect(screen.getByText('Add').disabled).toBe(false);
  });

  it('calls onConfirm with iframe type and url', () => {
    const onConfirm = vi.fn();
    renderWithProviders(<IframeCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
      target: { value: 'https://example.com' },
    });
    fireEvent.click(screen.getByText('Add'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'iframe',
        data: { url: 'https://example.com' },
      }),
    );
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    renderWithProviders(<IframeCardModal onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TextCardModal
// ─────────────────────────────────────────────────────────────────────────────

describe('TextCardModal', () => {
  it('renders title and body inputs', () => {
    renderWithProviders(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByPlaceholderText('Card title...')).toBeDefined();
    expect(screen.getByPlaceholderText('Card body text...')).toBeDefined();
  });

  it('confirm button disabled when both inputs empty', () => {
    renderWithProviders(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('Add').disabled).toBe(true);
  });

  it('confirm button enabled when title entered', () => {
    renderWithProviders(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Card title...'), {
      target: { value: 'Hello' },
    });
    expect(screen.getByText('Add').disabled).toBe(false);
  });

  it('confirm button enabled when only body entered', () => {
    renderWithProviders(<TextCardModal onConfirm={() => {}} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Card body text...'), {
      target: { value: 'Some body text' },
    });
    expect(screen.getByText('Add').disabled).toBe(false);
  });

  it('calls onConfirm with title and body', () => {
    const onConfirm = vi.fn();
    renderWithProviders(<TextCardModal onConfirm={onConfirm} onCancel={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText('Card title...'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByPlaceholderText('Card body text...'), {
      target: { value: 'My Body' },
    });
    fireEvent.click(screen.getByText('Add'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text',
        data: { title: 'My Title', body: 'My Body' },
      }),
    );
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    renderWithProviders(<TextCardModal onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MemoryCardModal
// ─────────────────────────────────────────────────────────────────────────────

describe('MemoryCardModal', () => {
  it('renders file input for image upload', () => {
    renderWithProviders(
      <MemoryCardModal slug="test-scene" onConfirm={() => {}} onCancel={() => {}} />,
    );
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy();
  });

  it('file input accepts jpeg and png', () => {
    renderWithProviders(
      <MemoryCardModal slug="test-scene" onConfirm={() => {}} onCancel={() => {}} />,
    );
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput.accept).toContain('image/jpeg');
    expect(fileInput.accept).toContain('image/png');
  });

  it('confirm button disabled when no file selected', () => {
    renderWithProviders(
      <MemoryCardModal slug="test-scene" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByText('Add').disabled).toBe(true);
  });

  it('renders caption input', () => {
    renderWithProviders(
      <MemoryCardModal slug="test-scene" onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.getByPlaceholderText('A memory...')).toBeDefined();
  });

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <MemoryCardModal slug="test-scene" onConfirm={() => {}} onCancel={onCancel} />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
