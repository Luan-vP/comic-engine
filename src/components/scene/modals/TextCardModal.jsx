import React, { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import ModalBase, { inputStyle } from './ModalBase';

export function TextCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleConfirm = () => {
    onConfirm({
      type: 'text',
      position: [0, -100, 0],
      parallaxFactor: 0.6,
      panelVariant: 'default',
      data: { title, body },
    });
  };

  return (
    <ModalBase
      title="ADD TEXT CARD"
      theme={theme}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      confirmDisabled={!title.trim() && !body.trim()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Card title..."
            style={{ ...inputStyle(theme), marginTop: '4px' }}
          />
        </label>
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Card body text..."
            rows={3}
            style={{ ...inputStyle(theme), marginTop: '4px', resize: 'vertical' }}
          />
        </label>
      </div>
    </ModalBase>
  );
}

export default TextCardModal;
