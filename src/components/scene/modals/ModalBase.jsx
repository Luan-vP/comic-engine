import React from 'react';

const MODAL_OVERLAY_STYLE = {
  position: 'fixed',
  inset: 0,
  zIndex: 10001,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(0,0,0,0.7)',
  backdropFilter: 'blur(4px)',
};

export function inputStyle(theme) {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    color: theme.colors.text,
    padding: '6px 10px',
    fontSize: '12px',
    fontFamily: theme.typography.fontBody,
    boxSizing: 'border-box',
  };
}

export default function ModalBase({
  title,
  children,
  onConfirm,
  onCancel,
  confirmLabel = 'Add',
  confirmDisabled = false,
  theme,
}) {
  return (
    <div style={MODAL_OVERLAY_STYLE} onMouseDown={(e) => e.stopPropagation()}>
      <div
        style={{
          background: 'rgba(0,0,0,0.92)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '10px',
          padding: '24px',
          minWidth: '320px',
          maxWidth: '420px',
          width: '90vw',
        }}
      >
        <h3
          style={{
            color: theme.colors.text,
            margin: '0 0 16px 0',
            fontSize: '13px',
            letterSpacing: '2px',
            fontFamily: theme.typography.fontDisplay,
          }}
        >
          {title}
        </h3>
        {children}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '4px',
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: theme.typography.fontBody,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            style={{
              background: confirmDisabled ? '#555' : theme.colors.primary,
              color: confirmDisabled ? '#999' : '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 14px',
              cursor: confirmDisabled ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              fontFamily: theme.typography.fontBody,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
