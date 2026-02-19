import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';

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

function inputStyle(theme) {
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

function ModalBase({
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

export function MemoryCardModal({ slug, onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImageDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!imageDataUrl) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/_dev/scenes/${slug}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageDataUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const { path } = await res.json();
      onConfirm({
        type: 'memory',
        position: [0, 0, 0],
        parallaxFactor: 0.6,
        panelVariant: 'polaroid',
        data: { imageUrl: path, caption },
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
