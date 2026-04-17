import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
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

export function VideoCardModal({ onConfirm, onCancel }) {
  const { theme } = useTheme();
  const [videoUrl, setVideoUrl] = useState('');
  const [width, setWidth] = useState(400);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const resp = await fetch('/_dev/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: reader.result }),
        });
        const data = await resp.json();
        if (data.url) setVideoUrl(data.url);
        else if (data.path) setVideoUrl(data.path);
      } catch (err) {
        console.error('Upload failed:', err);
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = () => {
    onConfirm({
      type: 'video',
      position: [0, 0, 50],
      parallaxFactor: 0.7,
      panelVariant: 'borderless',
      data: { videoUrl, width },
    });
  };

  return (
    <ModalBase
      title="ADD VIDEO OVERLAY"
      theme={theme}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      confirmDisabled={!videoUrl}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          Video URL
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://... or upload below"
            style={{ ...inputStyle(theme), marginTop: '4px' }}
          />
        </label>
        <label
          style={{
            color: theme.colors.textMuted,
            fontSize: '11px',
            cursor: 'pointer',
            padding: '8px',
            border: `1px dashed ${theme.colors.border}`,
            borderRadius: '4px',
            textAlign: 'center',
          }}
        >
          {uploading ? 'Uploading...' : 'Or upload a file (WebM, MP4)'}
          <input
            type="file"
            accept="video/webm,video/mp4"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        <label style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
          Max width (px)
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            min={100}
            max={1920}
            step={50}
            style={{ ...inputStyle(theme), marginTop: '4px', width: '100px' }}
          />
        </label>
        <div style={{ color: theme.colors.textSubtle, fontSize: '10px' }}>
          WebM with VP9 alpha supports transparent backgrounds. Video will autoplay, loop, and be
          muted.
        </div>
      </div>
    </ModalBase>
  );
}

/**
 * DraggableNumberLabel - A label you can drag vertically to scrub the value.
 * Dragging up increases, dragging down decreases.
 */
function DraggableNumberLabel({ children, value, onChange, sensitivity = 1, style }) {
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      const startY = e.clientY;
      const startVal = value;

      const handleMove = (moveE) => {
        const dy = startY - moveE.clientY; // up = positive
        onChange(Math.round(startVal + dy * sensitivity));
      };

      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [value, onChange, sensitivity],
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ cursor: 'ns-resize', userSelect: 'none', ...style }}
    >
      {children}
    </div>
  );
}

export function ObjectEditPopover({
  object,
  position,
  onPositionChange,
  onUpdate,
  onClose,
  onDelete,
}) {
  const { theme } = useTheme();
  const [data, setData] = useState({ ...object.data });
  const [parallaxFactor, setParallaxFactor] = useState(object.parallaxFactor ?? 0.6);

  const handleApply = () => {
    onUpdate({ ...object, data, position, parallaxFactor });
  };

  const setPos = useCallback(
    (idx, val) => {
      const next = [...position];
      next[idx] = Number(val);
      onPositionChange(next);
    },
    [position, onPositionChange],
  );

  const iStyle = inputStyle(theme);
  const lStyle = { color: theme.colors.textMuted, fontSize: '10px', letterSpacing: '1px' };

  const popover = (
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 10002,
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '10px',
        padding: '16px',
        width: '280px',
        fontFamily: theme.typography.fontBody,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <span
          style={{
            color: theme.colors.text,
            fontSize: '11px',
            letterSpacing: '2px',
            fontFamily: theme.typography.fontDisplay,
          }}
        >
          EDIT {object.type.toUpperCase()}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          x
        </button>
      </div>

      {/* Type-specific fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {object.type === 'text' && (
          <>
            <div>
              <div style={lStyle}>TITLE</div>
              <input
                type="text"
                value={data.title || ''}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                style={{ ...iStyle, marginTop: '2px' }}
              />
            </div>
            <div>
              <div style={lStyle}>BODY</div>
              <textarea
                value={data.body || ''}
                onChange={(e) => setData({ ...data, body: e.target.value })}
                rows={3}
                style={{ ...iStyle, marginTop: '2px', resize: 'vertical' }}
              />
            </div>
          </>
        )}
        {object.type === 'memory' && (
          <div>
            <div style={lStyle}>CAPTION</div>
            <input
              type="text"
              value={data.caption || ''}
              onChange={(e) => setData({ ...data, caption: e.target.value })}
              style={{ ...iStyle, marginTop: '2px' }}
            />
          </div>
        )}
        {object.type === 'image' && (
          <>
            <div>
              <div style={lStyle}>CAPTION</div>
              <input
                type="text"
                value={data.caption || ''}
                onChange={(e) => setData({ ...data, caption: e.target.value })}
                style={{ ...iStyle, marginTop: '2px' }}
              />
            </div>
            <div>
              <div style={{ ...lStyle, marginBottom: '2px' }}>
                SCALE ({Math.round((data.baseWidth || data.width || 280) * (data.scale || 1))}×
                {Math.round((data.baseHeight || data.height || 200) * (data.scale || 1))}px)
              </div>
              <DraggableNumberLabel
                value={Math.round((data.scale || 1) * 100)}
                onChange={(v) => setData({ ...data, scale: Math.max(10, v) / 100 })}
                sensitivity={1}
                style={{ color: theme.colors.textSubtle, fontSize: '9px', marginBottom: '2px' }}
              >
                {Math.round((data.scale || 1) * 100)}%
              </DraggableNumberLabel>
              <input
                type="range"
                min={0.1}
                max={3}
                step={0.05}
                value={data.scale || 1}
                onChange={(e) => setData({ ...data, scale: Number(e.target.value) })}
                style={{ width: '100%', marginTop: '2px' }}
              />
            </div>
          </>
        )}
        {object.type === 'code' && (
          <>
            <div>
              <div style={lStyle}>TEXT</div>
              <textarea
                value={data.body || ''}
                onChange={(e) => setData({ ...data, body: e.target.value })}
                rows={4}
                style={{
                  ...iStyle,
                  marginTop: '2px',
                  resize: 'vertical',
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '11px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 1 }}>
                <DraggableNumberLabel
                  value={data.width || 320}
                  onChange={(v) => setData({ ...data, width: Math.max(100, v) })}
                  sensitivity={2}
                  style={{ color: theme.colors.textSubtle, fontSize: '9px', marginBottom: '2px' }}
                >
                  WIDTH
                </DraggableNumberLabel>
                <input
                  type="number"
                  value={data.width || 320}
                  onChange={(e) => setData({ ...data, width: Math.max(100, Number(e.target.value)) })}
                  min={100}
                  step={10}
                  style={{ ...iStyle, padding: '4px 6px', fontSize: '11px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <DraggableNumberLabel
                  value={data.height || 200}
                  onChange={(v) => setData({ ...data, height: Math.max(50, v) })}
                  sensitivity={2}
                  style={{ color: theme.colors.textSubtle, fontSize: '9px', marginBottom: '2px' }}
                >
                  HEIGHT
                </DraggableNumberLabel>
                <input
                  type="number"
                  value={data.height || 200}
                  onChange={(e) => setData({ ...data, height: Math.max(50, Number(e.target.value)) })}
                  min={50}
                  step={10}
                  style={{ ...iStyle, padding: '4px 6px', fontSize: '11px' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ flex: 1 }}>
                <div style={lStyle}>SPEED (ms)</div>
                <input
                  type="number"
                  value={data.speed || 40}
                  onChange={(e) => setData({ ...data, speed: Math.max(5, Number(e.target.value)) })}
                  min={5}
                  step={5}
                  style={{ ...iStyle, padding: '4px 6px', fontSize: '11px', marginTop: '2px' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={lStyle}>HOLD (ms)</div>
                <input
                  type="number"
                  value={data.holdMs || 2000}
                  onChange={(e) => setData({ ...data, holdMs: Math.max(0, Number(e.target.value)) })}
                  min={0}
                  step={500}
                  style={{ ...iStyle, padding: '4px 6px', fontSize: '11px', marginTop: '2px' }}
                />
              </div>
            </div>
          </>
        )}
        {object.type === 'iframe' && (
          <div>
            <div style={lStyle}>URL</div>
            <input
              type="url"
              value={data.url || ''}
              onChange={(e) => setData({ ...data, url: e.target.value })}
              style={{ ...iStyle, marginTop: '2px' }}
            />
          </div>
        )}
      </div>

      {/* Position — drag labels to scrub values */}
      <div style={{ marginBottom: '12px' }}>
        <div style={lStyle}>POSITION (drag labels to scrub)</div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
          {['X', 'Y', 'Z'].map((axis, i) => (
            <div key={axis} style={{ flex: 1 }}>
              <DraggableNumberLabel
                value={position[i]}
                onChange={(v) => setPos(i, v)}
                sensitivity={2}
                style={{ color: theme.colors.textSubtle, fontSize: '9px', marginBottom: '2px' }}
              >
                {axis}
              </DraggableNumberLabel>
              <input
                type="number"
                value={position[i]}
                onChange={(e) => setPos(i, e.target.value)}
                step={10}
                style={{ ...iStyle, padding: '4px 6px', fontSize: '11px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Parallax */}
      <div style={{ marginBottom: '14px' }}>
        <div style={lStyle}>PARALLAX FACTOR</div>
        <input
          type="number"
          value={parallaxFactor}
          onChange={(e) => setParallaxFactor(Number(e.target.value))}
          step={0.1}
          min={0}
          max={2}
          style={{ ...iStyle, marginTop: '4px', width: '80px' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'space-between' }}>
        {onDelete && (
          <button
            onClick={() => onDelete(object.id)}
            style={{
              background: 'rgba(255,80,80,0.15)',
              color: '#f55',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: '4px',
              padding: '5px 10px',
              cursor: 'pointer',
              fontSize: '11px',
              fontFamily: theme.typography.fontBody,
            }}
          >
            Delete
          </button>
        )}
        <button
          onClick={handleApply}
          style={{
            background: theme.colors.primary,
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            padding: '5px 14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '11px',
            fontFamily: theme.typography.fontBody,
            marginLeft: 'auto',
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );

  return ReactDOM.createPortal(popover, document.body);
}
