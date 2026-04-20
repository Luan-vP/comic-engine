import React, { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import ModalBase, { inputStyle } from './ModalBase';

export function CodeCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [body, setBody] = useState('');
  const [width, setWidth] = useState(320);
  const [height, setHeight] = useState(200);

  const handleConfirm = () => {
    onConfirm({
      type: 'code',
      position: [0, 0, 0],
      parallaxFactor: 0.6,
      panelVariant: 'monitor',
      data: { body, width, height, speed: 40, holdMs: 2000 },
    });
  };

  return (
    <ModalBase
      title="ADD CODE CARD"
      theme={theme}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      confirmDisabled={!body.trim()}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          Text (whitespace preserved)
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'> hello world\n> system online...'}
            rows={5}
            style={{
              ...inputStyle(theme),
              marginTop: '4px',
              resize: 'vertical',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '11px',
            }}
          />
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <label style={{ color: theme.colors.textMuted, fontSize: '11px', flex: 1 }}>
            Width
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              min={100}
              step={10}
              style={{ ...inputStyle(theme), marginTop: '4px' }}
            />
          </label>
          <label style={{ color: theme.colors.textMuted, fontSize: '11px', flex: 1 }}>
            Height
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              min={50}
              step={10}
              style={{ ...inputStyle(theme), marginTop: '4px' }}
            />
          </label>
        </div>
      </div>
    </ModalBase>
  );
}

export default CodeCardModal;
