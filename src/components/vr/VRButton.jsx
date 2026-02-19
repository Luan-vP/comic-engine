import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * VRButton - Floating "View in VR" / "Exit VR" toggle button
 *
 * Props:
 *   isVR    {boolean} - Whether VR mode is currently active
 *   onToggle {function} - Called when the button is clicked
 */
export function VRButton({ isVR, onToggle }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={onToggle}
      aria-label={isVR ? 'Exit VR mode' : 'Enter VR mode'}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: isVR ? theme.colors.primary : 'rgba(0,0,0,0.8)',
        color: isVR ? '#000' : theme.colors.text,
        border: `1px solid ${isVR ? theme.colors.primary : theme.colors.border}`,
        borderRadius: '8px',
        padding: '12px 20px',
        fontSize: '12px',
        fontFamily: theme.typography.fontBody,
        letterSpacing: '1px',
        cursor: 'pointer',
        zIndex: 20000,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.2s ease',
      }}
    >
      {isVR ? 'EXIT VR' : 'VIEW IN VR'}
    </button>
  );
}

export default VRButton;
