import React, { useState, useRef } from 'react';
import { useTheme } from '../../theme/ThemeContext';

function ModalOverlay({ onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function ModalBox({ theme, title, children, onConfirm, onCancel, confirmLabel = 'Insert', confirmDisabled = false }) {
  const inputBase = {
    fontFamily: theme.typography.fontBody,
    fontSize: '12px',
  };

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${theme.colors.primary}`,
        borderRadius: '8px',
        padding: '24px',
        minWidth: '320px',
        maxWidth: '480px',
        ...inputBase,
        color: theme.colors.text,
      }}
    >
      <h2
        style={{
          margin: '0 0 16px 0',
          fontSize: '13px',
          fontFamily: theme.typography.fontDisplay || theme.typography.fontHeading,
          letterSpacing: '2px',
          color: theme.colors.primary,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h2>
      <div style={{ marginBottom: '16px' }}>{children}</div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '4px',
            padding: '8px 16px',
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
            padding: '8px 16px',
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
  );
}

const labelStyle = (theme) => ({
  display: 'block',
  marginBottom: '6px',
  fontSize: '11px',
  color: theme.colors.textMuted,
});

const inputStyle = (theme) => ({
  width: '100%',
  padding: '8px',
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '4px',
  color: theme.colors.text,
  fontFamily: theme.typography.fontBody,
  fontSize: '12px',
  boxSizing: 'border-box',
});

export function MemoryCardModal({ slug, onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [imageUrl, setImageUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`/_dev/scenes/${slug}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: dataUrl }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { path } = await res.json();
      setImageUrl(path);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirm = () => {
    if (!imageUrl) return;
    onConfirm({
      imageUrl,
      caption,
      position: [0, 0, 0],
      parallaxFactor: 0.6,
      panelVariant: 'polaroid',
    });
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <ModalBox
        theme={theme}
        title="Add Memory Card"
        onConfirm={handleConfirm}
        onCancel={onCancel}
        confirmLabel={isUploading ? 'Uploading...' : 'Insert'}
        confirmDisabled={!imageUrl || isUploading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle(theme)}>Image (JPEG or PNG)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ ...inputStyle(theme), padding: '4px' }}
            />
          </div>
          {isUploading && (
            <div style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
              Uploading image...
            </div>
          )}
          {error && <div style={{ color: '#ff4444', fontSize: '11px' }}>{error}</div>}
          {imageUrl && (
            <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>
              Saved: {imageUrl}
            </div>
          )}
          <div>
            <label style={labelStyle(theme)}>Caption (optional)</label>
            <input
              type="text"
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={inputStyle(theme)}
            />
          </div>
        </div>
      </ModalBox>
    </ModalOverlay>
  );
}

export function IframeCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState('');

  const handleConfirm = () => {
    if (!url.trim()) return;
    onConfirm({
      url: url.trim(),
      position: [0, 0, 150],
      parallaxFactor: 0.9,
      panelVariant: 'monitor',
    });
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <ModalBox
        theme={theme}
        title="Add Iframe Card"
        onConfirm={handleConfirm}
        onCancel={onCancel}
        confirmDisabled={!url.trim()}
      >
        <div>
          <label style={labelStyle(theme)}>URL to embed</label>
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={inputStyle(theme)}
          />
          <p style={{ margin: '8px 0 0 0', fontSize: '10px', color: theme.colors.textMuted }}>
            Note: Some sites block embedding. The iframe uses sandbox restrictions.
          </p>
        </div>
      </ModalBox>
    </ModalOverlay>
  );
}

export function TextCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleConfirm = () => {
    if (!title.trim() && !body.trim()) return;
    onConfirm({
      title: title.trim(),
      body: body.trim(),
      position: [0, -100, 0],
      parallaxFactor: 0.6,
      panelVariant: 'default',
    });
  };

  return (
    <ModalOverlay onClose={onCancel}>
      <ModalBox
        theme={theme}
        title="Add Text Card"
        onConfirm={handleConfirm}
        onCancel={onCancel}
        confirmDisabled={!title.trim() && !body.trim()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={labelStyle(theme)}>Title</label>
            <input
              type="text"
              placeholder="Enter title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle(theme)}
            />
          </div>
          <div>
            <label style={labelStyle(theme)}>Body</label>
            <textarea
              placeholder="Enter body text..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              style={{ ...inputStyle(theme), resize: 'vertical' }}
            />
          </div>
        </div>
      </ModalBox>
    </ModalOverlay>
  );
}
