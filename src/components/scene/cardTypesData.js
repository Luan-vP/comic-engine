/**
 * cardTypesData.js - Card type metadata and static JSX string generators.
 *
 * Pure JavaScript (no JSX syntax, no React imports) so this module can be
 * imported by both browser code and the vite-plugin-scene-exporter (Node.js).
 *
 * To add a new card type:
 *   1. Add an entry here (metadata + generateJSX)
 *   2. Add a renderContent function and Modal to cardTypes.jsx
 */
export const CARD_TYPE_REGISTRY = [
  {
    id: 'memory',
    label: 'Memory Card',
    description: 'Upload an image (polaroid style)',
    defaultPosition: [0, 0, 0],
    defaultParallaxFactor: 0.6,
    panelVariant: 'polaroid',
    generateJSX(obj) {
      const pos = obj.position || [0, 0, 0];
      const pf = obj.parallaxFactor ?? 0.6;
      const captionLine = obj.data.caption
        ? `          <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '11px', color: '#333', fontFamily: 'Georgia, serif' }}>${obj.data.caption}</div>`
        : null;
      return [
        `      <SceneObject`,
        `        position={[${pos.join(', ')}]}`,
        `        parallaxFactor={${pf}}`,
        `      >`,
        `        <Panel variant="polaroid">`,
        `          <img src="${obj.data.imageUrl}" alt="${obj.data.caption || 'Memory'}" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />`,
        captionLine,
        `        </Panel>`,
        `      </SceneObject>`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },
  {
    id: 'iframe',
    label: 'Iframe Card',
    description: 'Embed a URL (monitor style)',
    defaultPosition: [0, 0, 150],
    defaultParallaxFactor: 0.85,
    panelVariant: 'monitor',
    generateJSX(obj) {
      const pos = obj.position || [0, 0, 150];
      const pf = obj.parallaxFactor ?? 0.85;
      return [
        `      <SceneObject`,
        `        position={[${pos.join(', ')}]}`,
        `        parallaxFactor={${pf}}`,
        `      >`,
        `        <Panel variant="monitor">`,
        `          <iframe src="${obj.data.url}" width={280} height={200} sandbox="allow-scripts" style={{ border: 'none' }} title="Embedded content" />`,
        `        </Panel>`,
        `      </SceneObject>`,
      ].join('\n');
    },
  },
  {
    id: 'text',
    label: 'Text Card',
    description: 'Add title + body text',
    defaultPosition: [0, -100, 0],
    defaultParallaxFactor: 0.6,
    panelVariant: 'default',
    generateJSX(obj) {
      const pos = obj.position || [0, -100, 0];
      const pf = obj.parallaxFactor ?? 0.6;
      return [
        `      <SceneObject`,
        `        position={[${pos.join(', ')}]}`,
        `        parallaxFactor={${pf}}`,
        `      >`,
        `        <Panel>`,
        `          <div style={{ padding: '20px' }}>`,
        obj.data.title ? `            <h2>${obj.data.title}</h2>` : null,
        obj.data.body ? `            <p>${obj.data.body}</p>` : null,
        `          </div>`,
        `        </Panel>`,
        `      </SceneObject>`,
      ]
        .filter(Boolean)
        .join('\n');
    },
  },
];
