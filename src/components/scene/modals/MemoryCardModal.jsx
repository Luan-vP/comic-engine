import React, { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { useImageUpload } from '../../../hooks/useImageUpload';
import ModalBase, { inputStyle } from './ModalBase';

export function MemoryCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const { imageDataUrl, uploading, error, handleFileChange, upload } = useImageUpload();
  const [caption, setCaption] = useState('');

  const handleConfirm = async () => {
    if (!imageDataUrl) return;
    try {
      const url = await upload();
      onConfirm({
        type: 'memory',
        position: [0, 0, 0],
        parallaxFactor: 0.6,
        panelVariant: 'polaroid',
        data: { imageUrl: url, caption },
      });
    } catch {
      // error state is surfaced by the hook
    }
  };

  return (
    <ModalBase
      title="ADD MEMORY CARD"
      theme={theme}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      confirmLabel={uploading ? 'Uploading…' : 'Add'}
      confirmDisabled={!imageDataUrl || uploading}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          Image (JPEG/PNG)
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            style={{
              display: 'block',
              marginTop: '4px',
              color: theme.colors.text,
              fontSize: '11px',
            }}
          />
        </label>
        {imageDataUrl && (
          <img
            src={imageDataUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '120px',
              objectFit: 'cover',
              borderRadius: '4px',
            }}
          />
        )}
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          Caption (optional)
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A memory..."
            style={{ ...inputStyle(theme), marginTop: '4px' }}
          />
        </label>
        {error && <div style={{ color: '#f55', fontSize: '11px' }}>{error}</div>}
      </div>
    </ModalBase>
  );
}

export default MemoryCardModal;
