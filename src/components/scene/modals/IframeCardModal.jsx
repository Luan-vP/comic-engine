import React, { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import ModalBase, { inputStyle } from './ModalBase';

export function IframeCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState('');
  const isValid = url.trim().startsWith('http://') || url.trim().startsWith('https://');

  const handleConfirm = () => {
    onConfirm({
      type: 'iframe',
      position: [0, 0, 150],
      parallaxFactor: 0.85,
      panelVariant: 'monitor',
      data: { url: url.trim() },
    });
  };

  return (
    <ModalBase
      title="ADD IFRAME CARD"
      theme={theme}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      confirmDisabled={!isValid}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          URL
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={{ ...inputStyle(theme), marginTop: '4px' }}
          />
        </label>
        <div style={{ color: theme.colors.textSubtle, fontSize: '10px' }}>
          Embedded with sandbox=&quot;allow-scripts allow-same-origin&quot;
        </div>
      </div>
    </ModalBase>
  );
}

export default IframeCardModal;
