import React from 'react';
import { CARD_TYPE_REGISTRY as BASE_REGISTRY } from './cardTypesData.js';
import { Panel } from './Panel';
import {
  MemoryCardModal,
  IframeCardModal,
  TextCardModal,
  VideoCardModal,
  ImageCardModal,
} from './InsertModals';

/**
 * cardTypes.jsx - React-enriched card type registry.
 *
 * Extends the pure-JS metadata in cardTypesData.js with:
 *   - renderContent(object) → JSX  (used by InsertedObjectRenderer + SavedObjectRenderer)
 *   - Modal  (used by InsertToolbar)
 *
 * To add a new card type:
 *   1. Add metadata + generateJSX in cardTypesData.js
 *   2. Add renderContent + Modal here
 */
const RENDER_EXTENSIONS = {
  memory: {
    renderContent(object) {
      return (
        <Panel variant="polaroid" width={224} height={272}>
          <img
            src={object.data.imageUrl}
            alt={object.data.caption || 'Memory'}
            style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
          />
          {object.data.caption && (
            <div
              style={{
                textAlign: 'center',
                marginTop: '6px',
                fontSize: '11px',
                color: 'var(--color-text-muted, #333)',
                fontFamily: 'Georgia, serif',
              }}
            >
              {object.data.caption}
            </div>
          )}
        </Panel>
      );
    },
    Modal: MemoryCardModal,
  },

  image: {
    renderContent(object) {
      const w = object.data.width || 280;
      const h = object.data.height || 200;
      return (
        <Panel variant="default" width={w} height={h}>
          <img
            src={object.data.imageUrl}
            alt={object.data.caption || 'Image'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              position: 'relative',
              zIndex: 1,
            }}
          />
          {object.data.caption && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '6px 10px',
                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                color: 'var(--color-text, #fff)',
                fontSize: '11px',
                textAlign: 'center',
                zIndex: 2,
              }}
            >
              {object.data.caption}
            </div>
          )}
        </Panel>
      );
    },
    Modal: ImageCardModal,
  },

  iframe: {
    renderContent(object) {
      return (
        <Panel variant="monitor" width={296} height={216}>
          <iframe
            src={object.data.url}
            width={280}
            height={200}
            sandbox="allow-scripts"
            style={{ display: 'block', border: 'none' }}
            title="Embedded content"
          />
        </Panel>
      );
    },
    Modal: IframeCardModal,
  },

  video: {
    renderContent(object) {
      return (
        <video
          src={object.data.videoUrl}
          autoPlay
          loop
          muted
          playsInline
          style={{ maxWidth: `${object.data.width || 400}px`, display: 'block' }}
        />
      );
    },
    Modal: VideoCardModal,
  },

  text: {
    renderContent(object) {
      return (
        <Panel variant="default" width={320} height={200}>
          <div style={{ padding: '20px', color: 'var(--color-text, #fff)' }}>
            {object.data.title && (
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{object.data.title}</h2>
            )}
            {object.data.body && (
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>{object.data.body}</p>
            )}
          </div>
        </Panel>
      );
    },
    Modal: TextCardModal,
  },
};

export const CARD_TYPE_REGISTRY = BASE_REGISTRY.map((entry) => ({
  ...entry,
  ...RENDER_EXTENSIONS[entry.id],
}));
