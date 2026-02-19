import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { MemoryCardModal, IframeCardModal, TextCardModal } from './InsertModals';

/**
 * InsertToolbar - Add Object picker for scene edit mode
 *
 * Renders inside the edit controls panel when editActive is true.
 * Presents card type options and opens the appropriate modal for input.
 * Calls onInsert({ type, data }) when an object is confirmed.
 */
export function InsertToolbar({ onInsert, slug }) {
  const { theme } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'memory' | 'iframe' | 'text'

  const handlePickType = (type) => {
    setPickerOpen(false);
    setActiveModal(type);
  };

  const handleConfirm = (type, data) => {
    setActiveModal(null);
    onInsert({ type, data });
  };

  const handleCancel = () => {
    setActiveModal(null);
    setPickerOpen(false);
  };

  const typeButtonStyle = {
    background: 'rgba(255,255,255,0.08)',
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: theme.typography.fontBody,
    textAlign: 'left',
    width: '100%',
  };

  return (
    <>
      <div
        style={{
          marginTop: '10px',
          borderTop: `1px solid ${theme.colors.border}`,
          paddingTop: '10px',
        }}
      >
        <button
          onClick={() => setPickerOpen((o) => !o)}
          style={{
            background: pickerOpen ? theme.colors.primary : 'rgba(255,255,255,0.1)',
            color: pickerOpen ? '#000' : theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '11px',
            fontFamily: theme.typography.fontBody,
            width: '100%',
          }}
        >
          + Add Object
        </button>

        {pickerOpen && (
          <div
            style={{
              marginTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <button onClick={() => handlePickType('memory')} style={typeButtonStyle}>
              Memory Card
            </button>
            <button onClick={() => handlePickType('iframe')} style={typeButtonStyle}>
              Iframe Card
            </button>
            <button onClick={() => handlePickType('text')} style={typeButtonStyle}>
              Text Card
            </button>
          </div>
        )}
      </div>

      {activeModal === 'memory' && (
        <MemoryCardModal
          onConfirm={(data) => handleConfirm('memory', data)}
          onCancel={handleCancel}
          slug={slug}
        />
      )}
      {activeModal === 'iframe' && (
        <IframeCardModal
          onConfirm={(data) => handleConfirm('iframe', data)}
          onCancel={handleCancel}
        />
      )}
      {activeModal === 'text' && (
        <TextCardModal onConfirm={(data) => handleConfirm('text', data)} onCancel={handleCancel} />
      )}
    </>
  );
}

export default InsertToolbar;
