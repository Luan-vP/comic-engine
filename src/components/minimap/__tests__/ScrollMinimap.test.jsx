import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { ScrollMinimap } from '../ScrollMinimap';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

afterEach(cleanup);

const SLIDES = [
  { id: 'slide-0', label: 'Background', zCenter: 0, isActive: true, progress: 0 },
  { id: 'slide-1', label: 'Midground', zCenter: 200, isActive: false, progress: 0.5 },
  { id: 'slide-2', label: 'Foreground', zCenter: 400, isActive: false, progress: 1 },
];

describe('ScrollMinimap', () => {
  it('renders null when slides.length <= 1', () => {
    const { container } = renderWithTheme(
      <ScrollMinimap slides={[SLIDES[0]]} currentSlideIndex={0} onSlideClick={() => {}} />,
    );
    // ThemeProvider wraps in a div, so check its child is empty
    expect(container.querySelector('[style*="position: fixed"]')).toBeNull();
  });

  it('renders null when slides is empty', () => {
    const { container } = renderWithTheme(
      <ScrollMinimap slides={[]} currentSlideIndex={0} onSlideClick={() => {}} />,
    );
    expect(container.querySelector('[style*="position: fixed"]')).toBeNull();
  });

  it('renders minimap when slides.length >= 2', () => {
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={0} onSlideClick={() => {}} />,
    );
    expect(screen.getByText('SLIDES')).toBeDefined();
  });

  it('renders a button for each slide', () => {
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={0} onSlideClick={() => {}} />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(SLIDES.length);
  });

  it('each button has aria-label matching slide label', () => {
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={0} onSlideClick={() => {}} />,
    );
    expect(screen.getByLabelText('Background')).toBeDefined();
    expect(screen.getByLabelText('Midground')).toBeDefined();
    expect(screen.getByLabelText('Foreground')).toBeDefined();
  });

  it('active slide button has aria-pressed=true', () => {
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={1} onSlideClick={() => {}} />,
    );
    const midBtn = screen.getByLabelText('Midground');
    expect(midBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('inactive slide buttons have aria-pressed=false', () => {
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={1} onSlideClick={() => {}} />,
    );
    const bgBtn = screen.getByLabelText('Background');
    expect(bgBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('calls onSlideClick with correct index when slide is clicked', () => {
    const onSlideClick = vi.fn();
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={0} onSlideClick={onSlideClick} />,
    );
    fireEvent.click(screen.getByLabelText('Midground'));
    expect(onSlideClick).toHaveBeenCalledTimes(1);
    expect(onSlideClick).toHaveBeenCalledWith(1);
  });

  it('calls onSlideClick with index 0 for first slide', () => {
    const onSlideClick = vi.fn();
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={1} onSlideClick={onSlideClick} />,
    );
    fireEvent.click(screen.getByLabelText('Background'));
    expect(onSlideClick).toHaveBeenCalledWith(0);
  });

  it('calls onSlideClick with last index for last slide', () => {
    const onSlideClick = vi.fn();
    renderWithTheme(
      <ScrollMinimap slides={SLIDES} currentSlideIndex={0} onSlideClick={onSlideClick} />,
    );
    fireEvent.click(screen.getByLabelText('Foreground'));
    expect(onSlideClick).toHaveBeenCalledWith(2);
  });

  it('renders thumbnail img when slide has thumbnail', () => {
    const slidesWithThumbs = [
      { ...SLIDES[0], thumbnail: '/img/slide-0.png' },
      { ...SLIDES[1], thumbnail: '/img/slide-1.png' },
    ];
    const { container } = renderWithTheme(
      <ScrollMinimap slides={slidesWithThumbs} currentSlideIndex={0} onSlideClick={() => {}} />,
    );
    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(2);
    expect(imgs[0].getAttribute('src')).toBe('/img/slide-0.png');
  });

  it('does not crash when onSlideClick is not provided', () => {
    renderWithTheme(<ScrollMinimap slides={SLIDES} currentSlideIndex={0} />);
    // Should not throw on click
    fireEvent.click(screen.getByLabelText('Background'));
  });
});
