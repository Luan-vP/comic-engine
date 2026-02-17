import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * VRButton - Toggle button to enter/exit VR mode
 *
 * Shows when WebXR is available on the device.
 * Triggers VR session request when clicked.
 */
export function VRButton({ onEnterVR, onExitVR, isVRActive = false, className = '' }) {
  const { theme } = useTheme();

  return (
    <button
      onClick={isVRActive ? onExitVR : onEnterVR}
      className={className}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: isVRActive ? theme.colors.secondary : theme.colors.primary,
        color: isVRActive ? theme.colors.text : '#000',
        border: `2px solid ${isVRActive ? theme.colors.border : theme.colors.primary}`,
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: theme.typography.fontDisplay,
        cursor: 'pointer',
        zIndex: 10000,
        textTransform: 'uppercase',
        letterSpacing: '2px',
        boxShadow: `0 4px 20px ${theme.colors.shadow}`,
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.05)';
        e.target.style.boxShadow = `0 6px 30px ${theme.colors.shadow}`;
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = `0 4px 20px ${theme.colors.shadow}`;
      }}
    >
      <span style={{ fontSize: '18px' }}>{isVRActive ? '🔙' : '🥽'}</span>
      {isVRActive ? 'Exit VR' : 'View in VR'}
    </button>
  );
}

export default VRButton;
