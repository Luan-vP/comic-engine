import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeContext';

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10001,
};

function modalBoxStyle(theme) {
  return {
    background: 'rgba(0,0,0,0.92)',
    backdropFilter: 'blur(10px)',
    border: `1px solid ${theme.colors.primary}`,
    borderRadius: '8px',
    padding: '24px',
    minWidth: '320px',
    maxWidth: '480px',
    fontFamily: theme.typography.fontBody,
  };
}

function labelStyle(theme) {
  return {
    display: 'block',
    color: theme.colors.textMuted,
    fontSize: '11px',
    marginBottom: '4px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  };
}

function inputStyle(theme) {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    padding: '8px 10px',
    color: theme.colors.text,
    fontSize: '12px',
    fontFamily: theme.typography.fontBody,
    boxSizing: 'border-box',
    outline: 'none',
  };
}

function primaryBtnStyle(theme) {
  return {
    background: theme.colors.primary,
    color: '#000',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
    fontFamily: theme.typography.fontBody,
  };
}

function secondaryBtnStyle(theme) {
  return {
    background: 'rgba(255,255,255,0.1)',
    color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: theme.typography.fontBody,
  };
}

export function MemoryCardModal({ onConfirm, onCancel, slug }) {
  const { theme } = useTheme();
  const [caption, setCaption] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [filename, setFilename] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPEG and PNG files are supported.');
      return;
    }
    setError('');
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => setImageDataUrl(evt.target.result);
    reader.readAsDataURL(file);
  };

  const handleConfirm = async () => {
    if (!imageDataUrl) {
      setError('Please select an image.');
      return;
    }
    setUploading(true);
    try {
      const res = await fetch(`/_dev/scenes/${slug}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl, filename }),
      });
      if (!res.ok) throw new Error('Upload failed');
      const { path } = await res.json();
      onConfirm({ imageUrl: path, caption });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={modalOverlayStyle} onMouseDown={(e) => e.stopPropagation()}>
      <div style={modalBoxStyle(theme)}>
        <h3
          style={{
            color: theme.colors.primary,
            margin: '0 0 16px 0',
            fontSize: '14px',
            letterSpacing: '2px',
            fontFamily: theme.typography.fontDisplay,
          }}
        >
          MEMORY CARD
        </h3>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle(theme)}>Image (JPEG/PNG)</label>
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            style={{ ...inputStyle(theme), padding: '6px' }}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle(theme)}>Caption (optional)</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A memory..."
            style={inputStyle(theme)}
          />
        </div>
        {imageDataUrl && (
          <div style={{ marginBottom: '12px' }}>
            <img
              src={imageDataUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '4px', display: 'block' }}
            />
          </div>
        )}
        {error && (
          <div style={{ color: '#f44', fontSize: '11px', marginBottom: '8px' }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={secondaryBtnStyle(theme)}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading || !imageDataUrl}
            style={{
              ...primaryBtnStyle(theme),
              opacity: uploading || !imageDataUrl ? 0.5 : 1,
              cursor: uploading || !imageDataUrl ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? 'Uploading...' : 'Insert'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function IframeCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!url.trim()) {
      setError('Please enter a URL.');
      return;
    }
    onConfirm({ url: url.trim() });
  };

  return (
    <div style={modalOverlayStyle} onMouseDown={(e) => e.stopPropagation()}>
      <div style={modalBoxStyle(theme)}>
        <h3
          style={{
            color: theme.colors.primary,
            margin: '0 0 16px 0',
            fontSize: '14px',
            letterSpacing: '2px',
            fontFamily: theme.typography.fontDisplay,
          }}
        >
          IFRAME CARD
        </h3>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle(theme)}>URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={inputStyle(theme)}
          />
        </div>
        <div
          style={{
            color: theme.colors.textMuted,
            fontSize: '10px',
            marginBottom: '12px',
            fontStyle: 'italic',
          }}
        >
          Embedded with sandbox=&quot;allow-scripts allow-same-origin&quot;
        </div>
        {error && (
          <div style={{ color: '#f44', fontSize: '11px', marginBottom: '8px' }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={secondaryBtnStyle(theme)}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={primaryBtnStyle(theme)}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

export function TextCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!title.trim() && !body.trim()) {
      setError('Please enter a title or body text.');
      return;
    }
    onConfirm({ title: title.trim(), body: body.trim() });
  };

  return (
    <div style={modalOverlayStyle} onMouseDown={(e) => e.stopPropagation()}>
      <div style={modalBoxStyle(theme)}>
        <h3
          style={{
            color: theme.colors.primary,
            margin: '0 0 16px 0',
            fontSize: '14px',
            letterSpacing: '2px',
            fontFamily: theme.typography.fontDisplay,
          }}
        >
          TEXT CARD
        </h3>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle(theme)}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title..."
            style={inputStyle(theme)}
          />
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle(theme)}>Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Body text..."
            rows={4}
            style={{ ...inputStyle(theme), resize: 'vertical' }}
          />
        </div>
        {error && (
          <div style={{ color: '#f44', fontSize: '11px', marginBottom: '8px' }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={secondaryBtnStyle(theme)}>
            Cancel
          </button>
          <button onClick={handleConfirm} style={primaryBtnStyle(theme)}>
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}
