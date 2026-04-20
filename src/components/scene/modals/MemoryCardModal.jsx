import React, { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import ModalBase, { inputStyle } from './ModalBase';

export function MemoryCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setImageDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!imageDataUrl) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/_dev/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageDataUrl, filename: originalFilename }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const { url } = await res.json();
      onConfirm({
        type: 'memory',
        position: [0, 0, 0],
        parallaxFactor: 0.6,
        panelVariant: 'polaroid',
        data: { imageUrl: url, caption },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
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
