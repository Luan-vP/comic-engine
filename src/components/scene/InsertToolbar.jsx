import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { MemoryCardModal, IframeCardModal, TextCardModal } from './InsertModals';

const CARD_TYPES = [
  {
    id: 'memory',
    label: 'Memory Card',
    description: 'Photo in a polaroid frame',
  },
  {
    id: 'iframe',
    label: 'Iframe Card',
    description: 'Embed a URL in a monitor frame',
  },
  {
    id: 'text',
    label: 'Text Card',
    description: 'Title and body text',
  },
];

/**
 * InsertToolbar - Add Object toolbar for scene edit mode
 *
 * Renders inside the edit controls panel. Shows a "+ Add Object" button
 * that opens a card type picker, then a modal for the selected type.
 *
 * Props:
 *   slug     - scene slug (required for image upload endpoint)
 *   onInsert - called with (type, data) when user confirms an object insertion
 */
export function InsertToolbar({ slug, onInsert }) {
  const { theme } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const handleCardTypeSelect = (typeId) => {
    setPickerOpen(false);
    setActiveModal(typeId);
  };

  const handleModalConfirm = (typeId, data) => {
    setActiveModal(null);
    if (onInsert) onInsert(typeId, data);
  };

  const handleModalCancel = () => {
    setActiveModal(null);
  };

  const btnBase = {
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontFamily: theme.typography.fontBody,
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
          onClick={() => setPickerOpen((v) => !v)}
          style={{
            ...btnBase,
            background: theme.colors.primary,
            color: '#000',
            padding: '6px 12px',
            fontWeight: 'bold',
            fontSize: '11px',
            width: '100%',
          }}
        >
          + Add Object
        </button>

        {pickerOpen && (
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {CARD_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => handleCardTypeSelect(type.id)}
                style={{
                  ...btnBase,
                  background: 'rgba(255,255,255,0.05)',
                  color: theme.colors.text,
                  border: `1px solid ${theme.colors.border}`,
                  padding: '8px 10px',
                  fontSize: '11px',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>{type.label}</div>
                <div
                  style={{
                    color: theme.colors.textMuted,
                    fontSize: '10px',
                    marginTop: '2px',
                  }}
                >
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeModal === 'memory' && (
        <MemoryCardModal
          slug={slug}
          onConfirm={(data) => handleModalConfirm('memory', data)}
          onCancel={handleModalCancel}
        />
      )}
      {activeModal === 'iframe' && (
        <IframeCardModal
          onConfirm={(data) => handleModalConfirm('iframe', data)}
          onCancel={handleModalCancel}
        />
      )}
      {activeModal === 'text' && (
        <TextCardModal
          onConfirm={(data) => handleModalConfirm('text', data)}
          onCancel={handleModalCancel}
        />
      )}
    </>
  );
}

export default InsertToolbar;
