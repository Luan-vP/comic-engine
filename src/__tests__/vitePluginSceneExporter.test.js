import { describe, it, expect } from 'vitest';
import { generatePageTemplate } from '../../vite-plugin-scene-exporter.js';

const baseLayers = [
  {
    position: [0, 0, 0],
    parallaxFactor: 0.5,
    depth: 0,
  },
];

const sceneConfig = {
  perspective: 1000,
  parallaxIntensity: 1.2,
  mouseInfluence: { x: 60, y: 40 },
  fillMode: 'blur',
};

describe('generatePageTemplate', () => {
  it('generates a valid React component string', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', baseLayers, sceneConfig);
    expect(result).toContain('export function MyScene');
    expect(result).toContain('import React');
  });

  it('imports Panel when objects are present', () => {
    const objects = [
      {
        type: 'text',
        position: [0, 0, 0],
        parallaxFactor: 0.6,
        data: { title: 'Hi', body: 'World' },
      },
    ];
    const result = generatePageTemplate('MyScene', 'my-scene', baseLayers, sceneConfig, objects);
    expect(result).toContain(', Panel }');
  });

  it('does not import Panel when no objects', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', baseLayers, sceneConfig, []);
    expect(result).not.toContain(', Panel }');
    expect(result).toContain('{ Scene, SceneObject }');
  });

  it('renders memory card object in template', () => {
    const objects = [
      {
        type: 'memory',
        position: [10, 20, 0],
        parallaxFactor: 0.6,
        data: { imageUrl: '/scenes/test/upload-123.png', caption: 'A photo' },
      },
    ];
    const result = generatePageTemplate('TestScene', 'test', baseLayers, sceneConfig, objects);
    expect(result).toContain('variant="polaroid"');
    expect(result).toContain('/scenes/test/upload-123.png');
    expect(result).toContain('A photo');
  });

  it('renders iframe card object in template', () => {
    const objects = [
      {
        type: 'iframe',
        position: [0, 0, 150],
        parallaxFactor: 0.9,
        data: { url: 'https://example.com' },
      },
    ];
    const result = generatePageTemplate('TestScene', 'test', baseLayers, sceneConfig, objects);
    expect(result).toContain('variant="monitor"');
    expect(result).toContain('https://example.com');
    expect(result).toContain('sandbox="allow-scripts allow-same-origin"');
  });

  it('renders text card object in template', () => {
    const objects = [
      {
        type: 'text',
        position: [0, -100, 0],
        parallaxFactor: 0.6,
        data: { title: 'Hello', body: 'World text' },
      },
    ];
    const result = generatePageTemplate('TestScene', 'test', baseLayers, sceneConfig, objects);
    expect(result).toContain('Hello');
    expect(result).toContain('World text');
  });

  it('includes slug as a prop on the Scene component', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', baseLayers, sceneConfig);
    expect(result).toContain('slug="my-scene"');
  });

  it('passes objects to PATCH endpoint in handleSave', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', baseLayers, sceneConfig);
    expect(result).toContain('groupOffset, objects');
    expect(result).toContain('JSON.stringify({ groupOffset, objects })');
  });

  it('handles multiple objects of different types', () => {
    const objects = [
      { type: 'text', position: [0, 0, 0], parallaxFactor: 0.6, data: { title: 'A', body: '' } },
      {
        type: 'iframe',
        position: [0, 0, 150],
        parallaxFactor: 0.9,
        data: { url: 'https://a.com' },
      },
    ];
    const result = generatePageTemplate('TestScene', 'test', baseLayers, sceneConfig, objects);
    expect(result).toContain('https://a.com');
    expect(result).toContain('A');
    // Both Panel uses should appear
    expect(result).toContain('variant="monitor"');
  });

  it('renders no extra object JSX when objects array is empty', () => {
    const result = generatePageTemplate('MyScene', 'my-scene', baseLayers, sceneConfig, []);
    expect(result).not.toContain('variant="polaroid"');
    expect(result).not.toContain('variant="monitor"');
  });
});
