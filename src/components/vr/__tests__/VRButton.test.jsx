import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ThemeProvider } from '../../../theme/ThemeContext';
import { VRButton } from '../VRButton';

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

afterEach(cleanup);

describe('VRButton', () => {
  it('shows "VIEW IN VR" label when not in VR mode', () => {
    renderWithTheme(<VRButton isVR={false} onToggle={() => {}} />);
    expect(screen.getByText('VIEW IN VR')).toBeDefined();
  });

  it('shows "EXIT VR" label when in VR mode', () => {
    renderWithTheme(<VRButton isVR={true} onToggle={() => {}} />);
    expect(screen.getByText('EXIT VR')).toBeDefined();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    renderWithTheme(<VRButton isVR={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByText('VIEW IN VR'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('has correct aria-label when not in VR', () => {
    renderWithTheme(<VRButton isVR={false} onToggle={() => {}} />);
    expect(screen.getByLabelText('Enter VR mode')).toBeDefined();
  });

  it('has correct aria-label when in VR', () => {
    renderWithTheme(<VRButton isVR={true} onToggle={() => {}} />);
    expect(screen.getByLabelText('Exit VR mode')).toBeDefined();
  });
});
