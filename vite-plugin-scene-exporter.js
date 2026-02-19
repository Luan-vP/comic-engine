import fs from 'fs';
import path from 'path';

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function slugToTitle(slug) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function dataUrlToBuffer(dataUrl) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid data URL');
  return Buffer.from(match[2], 'base64');
}

function dataUrlExtension(dataUrl) {
  const match = dataUrl.match(/^data:image\/([a-z]+);base64,/);
  if (!match) return 'png';
  const mime = match[1];
  if (mime === 'jpeg') return 'jpg';
  return mime;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * generatePageTemplate - Generate a React JSX page component string from scene metadata.
 *
 * Renders both depth layers and inserted objects (memory, iframe, text cards).
 * Exported for testability.
 *
 * @param {object} meta - scene.json object (name, slug, layers, objects, sceneConfig)
 * @returns {string} JSX source code for the page component
 */
export function generatePageTemplate(meta) {
  const { slug, layers = [], objects = [], sceneConfig = {} } = meta;
  const {
    perspective = 1000,
    parallaxIntensity = 1,
    mouseInfluence = { x: 50, y: 30 },
  } = sceneConfig;

  const componentName = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  const needsPanel = objects.length > 0;

  const layerJSX = layers
    .map((layer) => {
      const imgSrc = layer.hasBlurFill
        ? `/local-scenes/${slug}/layer-${layer.index}-blur.png`
        : `/local-scenes/${slug}/layer-${layer.index}.png`;
      const pos = layer.position || [0, 0, 0];
      const pf = layer.parallaxFactor ?? 0.5;
      return `      <SceneObject
        position={[${pos.join(', ')}]}
        parallaxFactor={${pf}}
        interactive={false}
      >
        <img src="${imgSrc}" alt="${layer.name || `Layer ${layer.index}`}" style={{ maxWidth: '80vw', maxHeight: '80vh' }} />
      </SceneObject>`;
    })
    .join('\n\n');

  const objectJSX = objects
    .map((obj) => {
      const pos = obj.position || [0, 0, 0];
      const pf = obj.parallaxFactor ?? 0.6;
      if (obj.type === 'memory') {
        return `      <SceneObject
        position={[${pos.join(', ')}]}
        parallaxFactor={${pf}}
      >
        <Panel variant="polaroid">
          <img src="${obj.data.imageUrl}" alt="${obj.data.caption || 'Memory'}" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Panel>
      </SceneObject>`;
      } else if (obj.type === 'iframe') {
        return `      <SceneObject
        position={[${pos.join(', ')}]}
        parallaxFactor={${pf}}
      >
        <Panel variant="monitor">
          <iframe src="${obj.data.url}" width={280} height={200} sandbox="allow-scripts" style={{ border: 'none' }} title="Embedded content" />
        </Panel>
      </SceneObject>`;
      } else if (obj.type === 'text') {
        return `      <SceneObject
        position={[${pos.join(', ')}]}
        parallaxFactor={${pf}}
      >
        <Panel>
          <div style={{ padding: '20px' }}>
            <h2>${obj.data.title || ''}</h2>
            <p>${obj.data.body || ''}</p>
          </div>
        </Panel>
      </SceneObject>`;
      }
      return '';
    })
    .filter(Boolean)
    .join('\n\n');

  const allChildren = [layerJSX, objectJSX].filter(Boolean).join('\n\n');

  const imports = needsPanel
    ? `import { Scene, SceneObject, Panel } from '../components/scene';`
    : `import { Scene, SceneObject } from '../components/scene';`;

  return `import React from 'react';
${imports}

export function ${componentName}() {
  return (
    <Scene
      perspective={${perspective}}
      parallaxIntensity={${parallaxIntensity}}
      mouseInfluence={{ x: ${mouseInfluence.x}, y: ${mouseInfluence.y} }}
    >
${allChildren}
    </Scene>
  );
}

export default ${componentName};
`;
}

export default function sceneExporter() {
  return {
    name: 'scene-exporter',
    configureServer(server) {
      const root = server.config.root || process.cwd();
      const scenesDir = path.join(root, '.local', 'scenes');

      // Serve static files from .local/scenes/* at /local-scenes/*
      server.middlewares.use('/local-scenes', (req, res, next) => {
        const filePath = path.join(scenesDir, req.url || '');
        // Prevent path traversal
        if (!filePath.startsWith(scenesDir)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const contentType =
            ext === '.png'
              ? 'image/png'
              : ext === '.jpg' || ext === '.jpeg'
                ? 'image/jpeg'
                : ext === '.json'
                  ? 'application/json'
                  : 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(fs.readFileSync(filePath));
        } else {
          next();
        }
      });

      // GET /_dev/scenes — List scenes
      server.middlewares.use('/_dev/scenes', (req, res, next) => {
        if (req.method !== 'GET') return next();
        // Skip if path has more segments (e.g. /_dev/scenes/foo/layers)
        if (req.url && req.url !== '/' && req.url !== '') return next();

        try {
          if (!fs.existsSync(scenesDir)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify([]));
            return;
          }

          const entries = fs.readdirSync(scenesDir, { withFileTypes: true });
          const scenes = [];

          for (const entry of entries) {
            if (!entry.isDirectory()) continue;
            const metaPath = path.join(scenesDir, entry.name, 'scene.json');
            if (!fs.existsSync(metaPath)) continue;

            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

            scenes.push({
              slug: entry.name,
              name: meta.name || slugToTitle(entry.name),
              layerCount: meta.layers?.length || 0,
            });
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(scenes));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // POST /_dev/scenes — Create new scene
      server.middlewares.use('/_dev/scenes', async (req, res, next) => {
        if (req.method !== 'POST') return next();
        // Skip if path has more segments
        if (req.url && req.url !== '/' && req.url !== '') return next();

        try {
          const body = await readBody(req);
          const { name, layers, sceneConfig } = body;

          if (!name || !layers || !layers.length) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'name and layers are required' }));
            return;
          }

          const slug = toSlug(name);
          const sceneDir = path.join(scenesDir, slug);

          if (fs.existsSync(sceneDir)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Scene "${slug}" already exists` }));
            return;
          }

          // Create directory
          fs.mkdirSync(sceneDir, { recursive: true });

          // Save layer images
          const layerMeta = [];
          for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];

            // Main image
            if (layer.imageUrl) {
              fs.writeFileSync(
                path.join(sceneDir, `layer-${i}.png`),
                dataUrlToBuffer(layer.imageUrl),
              );
            }

            // Fill mask
            if (layer.fillMaskUrl) {
              fs.writeFileSync(
                path.join(sceneDir, `layer-${i}-fill.png`),
                dataUrlToBuffer(layer.fillMaskUrl),
              );
            }

            // Blur-filled version
            if (layer.blurFillUrl) {
              fs.writeFileSync(
                path.join(sceneDir, `layer-${i}-blur.png`),
                dataUrlToBuffer(layer.blurFillUrl),
              );
            }

            layerMeta.push({
              index: i,
              groupId: 'initial',
              depth: layer.depth ?? 0,
              name: layer.name || `Layer ${i}`,
              position: layer.position || [0, 0, i * -100],
              parallaxFactor: layer.parallaxFactor ?? 0.1 + i * 0.2,
              hasImage: !!layer.imageUrl,
              hasFillMask: !!layer.fillMaskUrl,
              hasBlurFill: !!layer.blurFillUrl,
            });
          }

          // Write scene.json
          const sceneMeta = {
            name,
            slug,
            createdAt: new Date().toISOString(),
            sceneConfig: sceneConfig || {},
            layers: layerMeta,
            objects: [],
          };
          fs.writeFileSync(path.join(sceneDir, 'scene.json'), JSON.stringify(sceneMeta, null, 2));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ routePath: `/scenes/${slug}` }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // POST /_dev/scenes/:slug/layers — Add layers to existing scene
      server.middlewares.use('/_dev/scenes', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const match = req.url?.match(/^\/([a-z0-9-]+)\/layers\/?$/);
        if (!match) return next();

        const slug = match[1];

        try {
          const sceneDir = path.join(scenesDir, slug);
          const metaPath = path.join(sceneDir, 'scene.json');

          if (!fs.existsSync(metaPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Scene "${slug}" not found` }));
            return;
          }

          const body = await readBody(req);
          const { layers } = body;

          if (!layers || !layers.length) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'layers are required' }));
            return;
          }

          // Read existing metadata to find next index
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          const existingLayers = meta.layers || [];
          const nextIndex =
            existingLayers.length > 0 ? Math.max(...existingLayers.map((l) => l.index)) + 1 : 0;
          const groupId = `export-${Date.now()}`;

          const savedFiles = [];
          const layerMeta = [];

          for (let i = 0; i < layers.length; i++) {
            const layerIndex = nextIndex + i;
            const layer = layers[i];

            if (layer.imageUrl) {
              const fname = `layer-${layerIndex}.png`;
              fs.writeFileSync(path.join(sceneDir, fname), dataUrlToBuffer(layer.imageUrl));
              savedFiles.push(fname);
            }

            if (layer.fillMaskUrl) {
              const fname = `layer-${layerIndex}-fill.png`;
              fs.writeFileSync(path.join(sceneDir, fname), dataUrlToBuffer(layer.fillMaskUrl));
              savedFiles.push(fname);
            }

            if (layer.blurFillUrl) {
              const fname = `layer-${layerIndex}-blur.png`;
              fs.writeFileSync(path.join(sceneDir, fname), dataUrlToBuffer(layer.blurFillUrl));
              savedFiles.push(fname);
            }

            layerMeta.push({
              index: layerIndex,
              groupId,
              depth: layer.depth ?? 0,
              name: layer.name || `Layer ${layerIndex}`,
              position: layer.position || [0, 0, layerIndex * -100],
              parallaxFactor: layer.parallaxFactor ?? 0.1 + layerIndex * 0.2,
              hasImage: !!layer.imageUrl,
              hasFillMask: !!layer.fillMaskUrl,
              hasBlurFill: !!layer.blurFillUrl,
            });
          }

          // Update scene.json — append new layers, do not replace existing ones
          meta.layers = [...existingLayers, ...layerMeta];
          meta.updatedAt = new Date().toISOString();
          fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

          // Generate a code snippet for the user to paste.
          // All new layers share the same groupId, so wrap them in <SceneObjectGroup>.
          const zValues = layerMeta.map((l) => (l.position ? l.position[2] : 0));
          const zFar = Math.min(...zValues);
          const zNear = Math.max(...zValues);
          const innerSnippet = layerMeta
            .map((lm, i) => {
              const layerIndex = nextIndex + i;
              return `  <SceneObject
    position={[${(lm.position || [0, 0, 0]).join(', ')}]}
    parallaxFactor={${lm.parallaxFactor}}
    interactive={false}
  >
    <img src="/local-scenes/${slug}/layer-${layerIndex}.png" alt="Layer ${layerIndex}" style={{ maxWidth: '80vw', maxHeight: '80vh' }} />
  </SceneObject>`;
            })
            .join('\n\n');
          const codeSnippet =
            `<SceneObjectGroup groupId="${groupId}" zRange={{ far: ${zFar}, near: ${zNear} }}>` +
            `\n${innerSnippet}\n` +
            `</SceneObjectGroup>`;

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ savedFiles, codeSnippet }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // POST /_dev/scenes/:slug/assets — Upload an image asset for a scene
      server.middlewares.use('/_dev/scenes', async (req, res, next) => {
        if (req.method !== 'POST') return next();

        const match = req.url?.match(/^\/([a-z0-9-]+)\/assets\/?$/);
        if (!match) return next();

        const slug = match[1];

        try {
          const sceneDir = path.join(scenesDir, slug);
          const metaPath = path.join(sceneDir, 'scene.json');

          if (!fs.existsSync(metaPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Scene "${slug}" not found` }));
            return;
          }

          const body = await readBody(req);
          const { imageUrl } = body;

          if (!imageUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'imageUrl (data URL) is required' }));
            return;
          }

          const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
          const mimeMatch = imageUrl.match(/^data:([^;]+);base64,/);
          if (!mimeMatch || !ALLOWED_MIME.has(mimeMatch[1])) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Only image uploads are accepted' }));
            return;
          }

          const ext = dataUrlExtension(imageUrl);
          const filename = `upload-${Date.now()}.${ext}`;
          fs.writeFileSync(path.join(sceneDir, filename), dataUrlToBuffer(imageUrl));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ path: `/local-scenes/${slug}/${filename}` }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // PATCH /_dev/scenes/:slug — Update layer positions and/or inserted objects
      server.middlewares.use('/_dev/scenes', async (req, res, next) => {
        if (req.method !== 'PATCH') return next();

        const match = req.url?.match(/^\/([a-z0-9-]+)\/?$/);
        if (!match) return next();

        const slug = match[1];

        try {
          const sceneDir = path.join(scenesDir, slug);
          const metaPath = path.join(sceneDir, 'scene.json');

          if (!fs.existsSync(metaPath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Scene "${slug}" not found` }));
            return;
          }

          const body = await readBody(req);
          const { groupOffset, groupOffsets, objects } = body;

          if (!groupOffset && !groupOffsets && objects === undefined) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'groupOffset, groupOffsets, or objects is required' }));
            return;
          }

          // Read current metadata
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

          // Apply offset to each layer's position.
          // groupOffsets (per-group) takes precedence over the global groupOffset.
          for (const layer of meta.layers) {
            if (!layer.position) continue;
            const perGroup = groupOffsets && layer.groupId && groupOffsets[layer.groupId];
            if (perGroup) {
              layer.position[0] += perGroup.x;
              layer.position[1] += perGroup.y;
            } else if (groupOffset) {
              layer.position[0] += groupOffset.x;
              layer.position[1] += groupOffset.y;
            }
          }

          // Update objects array if provided
          if (objects !== undefined) {
            meta.objects = objects;
          }

          meta.updatedAt = new Date().toISOString();
          fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              positions: meta.layers.map((l) => l.position),
              objectCount: (meta.objects || []).length,
            }),
          );
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
