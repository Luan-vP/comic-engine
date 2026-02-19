import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * VRButton - Floating toggle button to enter/exit VR stereoscopic mode
 *
 * Drop this into any page that has a VRViewer. It manages no state of its own;
 * the parent controls `isVR` and provides `onToggle`.
 *
 * @param {boolean}  isVR     - Whether VR mode is currently active
 * @param {Function} onToggle - Called when the user clicks the button
 */
export function VRButton({ isVR, onToggle }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={onToggle}
      aria-label={isVR ? 'Exit VR mode' : 'Enter VR mode'}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        background: isVR ? theme.colors.primary : 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isVR ? theme.colors.primary : theme.colors.border}`,
        borderRadius: '8px',
        color: isVR ? '#000' : theme.colors.text,
        cursor: 'pointer',
        fontFamily: theme.typography.fontBody,
        fontSize: '11px',
        letterSpacing: '1px',
        padding: '10px 16px',
        textTransform: 'uppercase',
        zIndex: 20000,
      }}
    >
      {isVR ? 'Exit VR' : 'View in VR'}
    </button>
  );
}

export default VRButton;
