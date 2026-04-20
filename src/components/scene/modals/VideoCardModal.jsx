import React, { useState, useCallback } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import ModalBase, { inputStyle } from './ModalBase';

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

export default VideoCardModal;
