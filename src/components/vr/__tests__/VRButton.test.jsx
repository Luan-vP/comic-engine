import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { VRButton } from '../VRButton';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('VRButton', () => {
  it('renders "View in VR" when isVR is false', () => {
    renderWithTheme(<VRButton isVR={false} onToggle={() => {}} />);
    expect(screen.getByText('View in VR')).toBeDefined();
  });

  it('renders "Exit VR" when isVR is true', () => {
    renderWithTheme(<VRButton isVR={true} onToggle={() => {}} />);
    expect(screen.getByText('Exit VR')).toBeDefined();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    renderWithTheme(<VRButton isVR={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label when not in VR', () => {
    renderWithTheme(<VRButton isVR={false} onToggle={() => {}} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Enter VR mode');
  });

  it('has correct aria-label when in VR', () => {
    renderWithTheme(<VRButton isVR={true} onToggle={() => {}} />);
    expect(screen.getByRole('button').getAttribute('aria-label')).toBe('Exit VR mode');
  });
});
