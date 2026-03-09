import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../theme/ThemeContext';
import { CARD_TYPE_REGISTRY } from './cardTypes';

export function InsertToolbar({ slug, onInsert }) {
  const { theme } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const handlePickType = (typeId) => {
    setPickerOpen(false);
    setActiveModal(typeId);
  };

  const handleModalConfirm = (objectData) => {
    setActiveModal(null);
    const id = `obj-${Date.now()}`;
    onInsert({ id, ...objectData });
  };

  const handleModalCancel = () => {
    setActiveModal(null);
  };

  const activeCardType = activeModal
    ? CARD_TYPE_REGISTRY.find((ct) => ct.id === activeModal)
    : null;
  // Capitalized so JSX treats it as a component (not a DOM element)
  const ActiveModal = activeCardType?.Modal ?? null;

  return (
    <>
      <div style={{ marginTop: '10px', position: 'relative' }}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          style={{
            background: 'rgba(255,255,255,0.12)',
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: theme.typography.fontBody,
            width: '100%',
            textAlign: 'left',
          }}
        >
          + Add Object
        </button>
        {pickerOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              background: 'rgba(0,0,0,0.92)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '6px',
              padding: '6px',
              zIndex: 10001,
              minWidth: '180px',
            }}
          >
            {CARD_TYPE_REGISTRY.map((ct) => (
              <button
                key={ct.id}
                onClick={() => handlePickType(ct.id)}
                title={ct.description}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  color: theme.colors.text,
                  padding: '8px 10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: theme.typography.fontBody,
                  borderRadius: '4px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                {ct.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {ActiveModal &&
        createPortal(
          <ActiveModal slug={slug} onConfirm={handleModalConfirm} onCancel={handleModalCancel} />,
          document.body,
        )}
    </>
  );
}

export default InsertToolbar;
