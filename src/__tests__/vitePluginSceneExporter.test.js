import { describe, it, expect } from 'vitest';
import { generatePageTemplate } from '../../vite-plugin-scene-exporter.js';

const sampleLayer = {
  index: 0,
  position: [0, 0, -100],
  parallaxFactor: 0.3,
  depth: 0.5,
};

// ---------------------------------------------------------------------------
// generatePageTemplate — layers only
// ---------------------------------------------------------------------------

describe('generatePageTemplate — layers only', () => {
  it('renders a valid React component string', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).toContain('export function MyScene()');
    expect(result).toContain('export default MyScene');
  });

  it('imports Scene and SceneObject but not Panel when no objects', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).toContain("import { Scene, SceneObject }");
    expect(result).not.toContain('Panel');
  });

  it('includes the slug-based title', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).toContain('My Scene');
  });

  it('includes the handleSave function with PATCH call', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).toContain("fetch('/_dev/scenes/my-scene'");
    expect(result).toContain("method: 'PATCH'");
  });

  it('passes slug prop to Scene', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).toContain('slug="my-scene"');
  });

  it('renders layer as SceneObject with correct position', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).toContain('position={[0, 0, -100]}');
    expect(result).toContain('parallaxFactor={0.3}');
  });
});

// ---------------------------------------------------------------------------
// generatePageTemplate — with inserted objects
// ---------------------------------------------------------------------------

describe('generatePageTemplate — with inserted objects', () => {
  it('imports Panel when memory objects are present', () => {
    const objects = [
      {
        id: 'obj-1',
        type: 'memory',
        position: [0, 0, 0],
        parallaxFactor: 0.6,
        data: { imageUrl: '/scenes/my-scene/upload-123.jpg', caption: 'A memory' },
      },
    ];
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {}, objects);
    expect(result).toContain("import { Scene, SceneObject, Panel }");
  });

  it('renders memory object with polaroid variant', () => {
    const objects = [
      {
        id: 'obj-1',
        type: 'memory',
        position: [0, 0, 0],
        parallaxFactor: 0.6,
        data: { imageUrl: '/scenes/my-scene/upload-123.jpg', caption: 'A memory' },
      },
    ];
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {}, objects);
    expect(result).toContain('variant="polaroid"');
    expect(result).toContain('src="/scenes/my-scene/upload-123.jpg"');
    expect(result).toContain('A memory');
  });

  it('renders iframe object with monitor variant', () => {
    const objects = [
      {
        id: 'obj-2',
        type: 'iframe',
        position: [0, 0, 150],
        parallaxFactor: 0.85,
        data: { url: 'https://example.com' },
      },
    ];
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {}, objects);
    expect(result).toContain('variant="monitor"');
    expect(result).toContain('src="https://example.com"');
    expect(result).toContain('sandbox="allow-scripts allow-same-origin"');
  });

  it('renders text object with default variant', () => {
    const objects = [
      {
        id: 'obj-3',
        type: 'text',
        position: [0, -100, 0],
        parallaxFactor: 0.6,
        data: { title: 'Hello', body: 'World' },
      },
    ];
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {}, objects);
    expect(result).toContain('variant="default"');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('renders correct positions for inserted objects', () => {
    const objects = [
      {
        id: 'obj-4',
        type: 'text',
        position: [50, -20, 100],
        parallaxFactor: 0.7,
        data: { title: 'Test', body: '' },
      },
    ];
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {}, objects);
    expect(result).toContain('position={[50, -20, 100]}');
    expect(result).toContain('parallaxFactor={0.7}');
  });

  it('handles empty objects array gracefully (default)', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {}, []);
    expect(result).not.toContain('Panel');
    expect(result).toContain('export function MyScene()');
  });

  it('handles undefined objects gracefully (omitted param)', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).not.toContain('Panel');
    expect(result).toContain('export function MyScene()');
  });

  it('sends objects in PATCH body in generated handleSave', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', [sampleLayer], {});
    expect(result).toContain('JSON.stringify({ groupOffset, objects })');
  });
});
