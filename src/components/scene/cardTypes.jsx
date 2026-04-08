import React from 'react';
import { CARD_TYPE_REGISTRY as BASE_REGISTRY } from './cardTypesData.js';
import { Panel } from './Panel';
import { MemoryCardModal, IframeCardModal, TextCardModal, VideoCardModal } from './InsertModals';

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
