import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../../theme/ThemeContext';
import DraggableNumberLabel from './DraggableNumberLabel';
import { inputStyle } from './modals/ModalBase';

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

export default ObjectEditPopover;
