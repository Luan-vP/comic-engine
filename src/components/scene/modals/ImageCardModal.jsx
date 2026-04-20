import React, { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import ModalBase, { inputStyle } from './ModalBase';

export function ImageCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [naturalWidth, setNaturalWidth] = useState(null);
  const [naturalHeight, setNaturalHeight] = useState(null);
  const [caption, setCaption] = useState('');
  const [scale, setScale] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFilename(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImageDataUrl(dataUrl);
      // Read natural dimensions to preserve aspect ratio
      const img = new Image();
      img.onload = () => {
        // Cap base size so the default fits on screen
        const maxBase = 400;
        const ratio = Math.min(maxBase / img.naturalWidth, maxBase / img.naturalHeight, 1);
        setNaturalWidth(Math.round(img.naturalWidth * ratio));
        setNaturalHeight(Math.round(img.naturalHeight * ratio));
        setScale(1);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const baseW = naturalWidth || 280;
  const baseH = naturalHeight || 200;

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
        type: 'image',
        position: [0, 0, 0],
        parallaxFactor: 0.6,
        panelVariant: 'default',
        data: { imageUrl: url, caption, baseWidth: baseW, baseHeight: baseH, scale },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalBase
      title="ADD IMAGE CARD"
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
            placeholder="Image caption..."
            style={{ ...inputStyle(theme), marginTop: '4px' }}
          />
        </label>
        {naturalWidth && (
          <div>
            <div style={{ color: theme.colors.textSubtle, fontSize: '10px', marginBottom: '4px' }}>
              {baseW}×{baseH}px @ {scale}x = {Math.round(baseW * scale)}×{Math.round(baseH * scale)}px
            </div>
            <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
              Scale
              <input
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </label>
          </div>
        )}
        {error && <div style={{ color: '#f55', fontSize: '11px' }}>{error}</div>}
      </div>
    </ModalBase>
  );
}

export default ImageCardModal;
