import fs from 'fs';
import path from 'path';

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toPascalCase(name) {
  return name
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
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

function buildSceneObjectJsx(layer, fillMode, slug, indent) {
  const i = layer.index;
  const pos = layer.position || [0, 0, i * -100];
  const pf = layer.parallaxFactor ?? 0.1 + i * 0.2;
  const brightness = (0.8 + (layer.depth ?? 0) * 0.4).toFixed(2);

  let imgSrc;
  if (fillMode === 'blur') {
    imgSrc = `layer${i}Blur`;
  } else {
    imgSrc = `layer${i}`;
  }

  let solidFillJsx = '';
  if (fillMode === 'solid') {
    solidFillJsx = `
${indent}          <div
${indent}            style={{
${indent}              position: 'absolute',
${indent}              inset: 0,
${indent}              backgroundColor: theme.colors.background,
${indent}              WebkitMaskImage: \`url(\${layer${i}Fill})\`,
${indent}              maskImage: \`url(\${layer${i}Fill})\`,
${indent}              WebkitMaskSize: '100% 100%',
${indent}              maskSize: '100% 100%',
${indent}              WebkitMaskRepeat: 'no-repeat',
${indent}              maskRepeat: 'no-repeat',
${indent}            }}
${indent}          />`;
  }

  return `${indent}<SceneObject
${indent}  position={[${pos.join(', ')}]}
${indent}  parallaxFactor={${pf}}
${indent}  interactive={false}
${indent}>
${indent}  <div style={{ position: 'relative', display: 'inline-block' }}>${solidFillJsx}
${indent}    <img
${indent}      src={${imgSrc}}
${indent}      alt="Layer ${i}"
${indent}      style={{
${indent}        display: 'block',
${indent}        maxWidth: '80vw',
${indent}        maxHeight: '80vh',
${indent}        objectFit: 'contain',
${indent}        filter: 'brightness(${brightness})',
${indent}        pointerEvents: 'none',
${indent}      }}
${indent}    />
${indent}  </div>
${indent}</SceneObject>`;
}

function generatePageTemplate(componentName, slug, layers, sceneConfig) {
  const {
    perspective = 1000,
    parallaxIntensity = 1.2,
    mouseInfluence = { x: 60, y: 40 },
    fillMode = 'blur',
  } = sceneConfig || {};
  const title = slugToTitle(slug);

  const layerImports = layers
    .map((layer) => {
      const i = layer.index;
      const lines = [];
      if (fillMode === 'blur') {
        lines.push(`import layer${i}Blur from '/scenes/${slug}/layer-${i}-blur.png';`);
      } else {
        lines.push(`import layer${i} from '/scenes/${slug}/layer-${i}.png';`);
      }
      if (fillMode === 'solid') {
        lines.push(`import layer${i}Fill from '/scenes/${slug}/layer-${i}-fill.png';`);
      }
      return lines.join('\n');
    })
    .join('\n');

  // Group layers by groupId to decide whether to emit <SceneObjectGroup> wrappers.
  // Layers without a groupId (or whose groupId is the legacy 'initial' singleton) are
  // rendered flat.  Layers sharing a distinct groupId get wrapped together.
  const groupMap = new Map();
  for (const layer of layers) {
    const gid = layer.groupId || '__ungrouped__';
    if (!groupMap.has(gid)) groupMap.set(gid, []);
    groupMap.get(gid).push(layer);
  }

  // We only wrap in <SceneObjectGroup> when there are at least 2 distinct groupIds
  // that aren't the legacy '__ungrouped__' / 'initial' fallback, OR when a single
  // non-initial groupId exists (i.e. depth-segmentation export appended layers).
  const namedGroups = [...groupMap.keys()].filter(
    (gid) => gid !== '__ungrouped__' && gid !== 'initial',
  );
  const useGroups = namedGroups.length > 0;

  let sceneObjects = '';

  if (useGroups) {
    // Render each named group wrapped in <SceneObjectGroup>, then ungrouped/initial flat.
    const blocks = [];

    for (const [gid, gLayers] of groupMap.entries()) {
      if (gid === '__ungrouped__' || gid === 'initial') {
        // Render flat
        blocks.push(gLayers.map((l) => buildSceneObjectJsx(l, fillMode, slug, '      ')).join('\n\n'));
      } else {
        // Compute z-range from actual layer positions
        const zValues = gLayers.map((l) => (l.position ? l.position[2] : 0));
        const zFar = Math.min(...zValues);
        const zNear = Math.max(...zValues);

        const innerObjects = gLayers
          .map((l) => buildSceneObjectJsx(l, fillMode, slug, '        '))
          .join('\n\n');

        blocks.push(
          `      <SceneObjectGroup groupId="${gid}" zRange={{ far: ${zFar}, near: ${zNear} }}>\n${innerObjects}\n      </SceneObjectGroup>`,
        );
      }
    }

    sceneObjects = blocks.join('\n\n');
  } else {
    // Original flat rendering — no groups
    sceneObjects = layers
      .map((layer) => buildSceneObjectJsx(layer, fillMode, slug, '      '))
      .join('\n\n');
  }

  const sceneImport = useGroups
    ? `import { Scene, SceneObject, SceneObjectGroup } from '../components/scene';`
    : `import { Scene, SceneObject } from '../components/scene';`;

  return `import React, { useCallback } from 'react';
${sceneImport}
import { useTheme } from '../theme/ThemeContext';
${layerImports}

export function ${componentName}() {
  const { theme } = useTheme();

  const handleSave = useCallback(async ({ groupOffset }) => {
    try {
      const res = await fetch('/_dev/scenes/${slug}', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupOffset }),
      });
      if (!res.ok) throw new Error('Save failed');
      window.location.reload();
    } catch (err) {
      console.error('Failed to save positions:', err);
    }
  }, []);

  return (
    <Scene perspective={${perspective}} parallaxIntensity={${parallaxIntensity}} mouseInfluence={{ x: ${mouseInfluence.x}, y: ${mouseInfluence.y} }} editable onSave={handleSave}>
${sceneObjects}

      {/* Title */}
      <SceneObject
        position={[0, -200, 150]}
        parallaxFactor={0.8}
        interactive={false}
      >
        <h1
          style={{
            fontFamily: theme.typography.fontHeading || 'Georgia, serif',
            fontSize: '48px',
            fontWeight: 'normal',
            color: theme.colors.text,
            textAlign: 'center',
            textShadow: \`0 0 40px \${theme.colors.shadow}\`,
            letterSpacing: '8px',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          ${title}
        </h1>
      </SceneObject>
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
      const publicDir = path.join(root, 'public');
      const scenesDir = path.join(publicDir, 'scenes');
      const pagesDir = path.join(root, 'src', 'pages');
      const appFile = path.join(root, 'src', 'App.jsx');

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
            const componentName = toPascalCase(entry.name);
            const pagePath = path.join(pagesDir, `${componentName}.jsx`);

            scenes.push({
              slug: entry.name,
              name: meta.name || slugToTitle(entry.name),
              layerCount: meta.layers?.length || 0,
              hasPage: fs.existsSync(pagePath),
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
          const componentName = toPascalCase(name);
          const sceneDir = path.join(scenesDir, slug);

          if (fs.existsSync(sceneDir)) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Scene "${slug}" already exists` }));
            return;
          }

          // Create directories
          fs.mkdirSync(sceneDir, { recursive: true });
          fs.mkdirSync(pagesDir, { recursive: true });

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
          };
          fs.writeFileSync(path.join(sceneDir, 'scene.json'), JSON.stringify(sceneMeta, null, 2));

          // Generate page component
          const pageContent = generatePageTemplate(componentName, slug, layerMeta, sceneConfig);
          fs.writeFileSync(path.join(pagesDir, `${componentName}.jsx`), pageContent);

          // Update App.jsx
          let appContent = fs.readFileSync(appFile, 'utf-8');

          // Insert import
          const importLine = `import { ${componentName} } from './pages/${componentName}';`;
          appContent = appContent.replace('// @scene-imports', `${importLine}\n// @scene-imports`);

          // Insert page nav entry
          const pageEntry = `    { path: '/${slug}', label: '${slugToTitle(slug)}' },`;
          appContent = appContent.replace(
            '    // @scene-pages',
            `${pageEntry}\n    // @scene-pages`,
          );

          // Insert route
          const routeEntry = `        <Route path="/${slug}" element={<${componentName} />} />`;
          appContent = appContent.replace(
            '        {/* @scene-routes */}',
            `${routeEntry}\n        {/* @scene-routes */}`,
          );

          fs.writeFileSync(appFile, appContent);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ routePath: `/${slug}` }));
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

          // Generate a code snippet for the user to paste
          const codeSnippet = layers
            .map((_, i) => {
              const layerIndex = nextIndex + i;
              return `<SceneObject
  position={[${(layerMeta[i].position || [0, 0, 0]).join(', ')}]}
  parallaxFactor={${layerMeta[i].parallaxFactor}}
  interactive={false}
>
  <img src="/scenes/${slug}/layer-${layerIndex}.png" alt="Layer ${layerIndex}" style={{ maxWidth: '80vw', maxHeight: '80vh' }} />
</SceneObject>`;
            })
            .join('\n\n');

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ savedFiles, codeSnippet }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // PATCH /_dev/scenes/:slug — Update layer positions (from edit mode drag)
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
          const { groupOffset, groupOffsets } = body;

          if (!groupOffset && !groupOffsets) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'groupOffset or groupOffsets is required' }));
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
          meta.updatedAt = new Date().toISOString();
          fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

          // Regenerate the page component with updated positions
          const componentName = toPascalCase(slug);
          const pagePath = path.join(pagesDir, `${componentName}.jsx`);
          if (fs.existsSync(pagePath)) {
            const pageContent = generatePageTemplate(
              componentName,
              slug,
              meta.layers,
              meta.sceneConfig,
            );
            fs.writeFileSync(pagePath, pageContent);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ positions: meta.layers.map((l) => l.position) }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
