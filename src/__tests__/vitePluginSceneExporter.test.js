import { describe, it, expect } from 'vitest';
import { generatePageTemplate } from '../../vite-plugin-scene-exporter.js';

describe('generatePageTemplate', () => {
  it('returns a string', () => {
    const result = generatePageTemplate({ name: 'Test', slug: 'test', layers: [], objects: [] });
    expect(typeof result).toBe('string');
  });

  it('includes the component name derived from slug', () => {
    const result = generatePageTemplate({
      name: 'My Scene',
      slug: 'my-scene',
      layers: [],
      objects: [],
    });
    expect(result).toContain('MyScene');
  });

  it('multi-word slugs produce PascalCase component names', () => {
    const result = generatePageTemplate({
      name: 'The Big Scene',
      slug: 'the-big-scene',
      layers: [],
      objects: [],
    });
    expect(result).toContain('TheBigScene');
  });

  it('contains a Scene element', () => {
    const result = generatePageTemplate({ name: 'Test', slug: 'test', layers: [], objects: [] });
    expect(result).toContain('<Scene');
    expect(result).toContain('</Scene>');
  });

  it('renders layer SceneObjects with correct image src', () => {
    const result = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [{ index: 0, position: [0, 0, 0], parallaxFactor: 0.3, hasBlurFill: false }],
      objects: [],
    });
    expect(result).toContain('SceneObject');
    expect(result).toContain('/local-scenes/test-scene/layer-0.png');
  });

  it('uses blur fill image when layer has hasBlurFill=true', () => {
    const result = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [{ index: 0, position: [0, 0, 0], parallaxFactor: 0.3, hasBlurFill: true }],
      objects: [],
    });
    expect(result).toContain('layer-0-blur.png');
  });

  it('renders memory object with polaroid variant', () => {
    const result = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [],
      objects: [
        {
          type: 'memory',
          position: [0, 0, 0],
          parallaxFactor: 0.6,
          data: { imageUrl: '/local-scenes/test-scene/upload-123.png', caption: 'A photo' },
        },
      ],
    });
    expect(result).toContain('polaroid');
    expect(result).toContain('/local-scenes/test-scene/upload-123.png');
  });

  it('renders iframe object with monitor variant and sandbox attribute', () => {
    const result = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [],
      objects: [
        {
          type: 'iframe',
          position: [0, 0, 150],
          parallaxFactor: 0.85,
          data: { url: 'https://example.com' },
        },
      ],
    });
    expect(result).toContain('monitor');
    expect(result).toContain('https://example.com');
    expect(result).toContain('sandbox');
  });

  it('renders text object with title and body', () => {
    const result = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [],
      objects: [
        {
          type: 'text',
          position: [0, -100, 0],
          parallaxFactor: 0.6,
          data: { title: 'Hello', body: 'World' },
        },
      ],
    });
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('renders both layers and objects together', () => {
    const result = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [{ index: 0, position: [0, 0, -200], parallaxFactor: 0.3, hasBlurFill: false }],
      objects: [
        {
          type: 'text',
          position: [0, 0, 0],
          parallaxFactor: 0.6,
          data: { title: 'Hi', body: 'There' },
        },
      ],
    });
    expect(result).toContain('layer-0.png');
    expect(result).toContain('Hi');
  });

  it('imports Panel only when objects are present', () => {
    const withObjects = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [],
      objects: [
        {
          type: 'text',
          position: [0, 0, 0],
          parallaxFactor: 0.6,
          data: { title: 'A', body: 'B' },
        },
      ],
    });
    expect(withObjects).toContain('Panel');

    const withoutObjects = generatePageTemplate({
      name: 'Test',
      slug: 'test-scene',
      layers: [{ index: 0, position: [0, 0, 0], parallaxFactor: 0.3, hasBlurFill: false }],
      objects: [],
    });
    // No Panel import when there are no objects
    expect(withoutObjects).not.toContain('import { Scene, SceneObject, Panel }');
  });
});
