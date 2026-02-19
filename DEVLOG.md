# Comic Engine — Devlog

**As of:** 2026-02-19 | **Branch:** `main`

A snapshot of every system that exists in the comic engine today — what it does, how it is wired
up, and what is still missing or placeholder.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Scene System](#scene-system)
3. [Overlay System](#overlay-system)
4. [Theme System](#theme-system)
5. [Depth Segmentation Pipeline](#depth-segmentation-pipeline)
6. [Scene Exporter (Vite Plugin)](#scene-exporter-vite-plugin)
7. [Pages](#pages)
8. [Dev Controls](#dev-controls)
9. [App Routing & Marker Comment System](#app-routing--marker-comment-system)
10. [Backend](#backend)
11. [Infrastructure & CI](#infrastructure--ci)
12. [Current State](#current-state)
13. [Open Issues](#open-issues)

---

## Architecture Overview

React + Vite single-page application. No TypeScript — JSX throughout.

```
comic-engine/
├── src/
│   ├── components/
│   │   ├── scene/              # Scene, SceneObject, Panel
│   │   │   ├── Scene.jsx
│   │   │   ├── SceneObject.jsx
│   │   │   ├── Panel.jsx
│   │   │   └── index.js
│   │   ├── overlays/           # Post-processing effects
│   │   │   ├── index.jsx       # OverlayStack
│   │   │   ├── FilmGrain.jsx
│   │   │   ├── Vignette.jsx
│   │   │   ├── Scanlines.jsx
│   │   │   ├── AsciiShader.jsx
│   │   │   └── Particles.jsx
│   │   └── DepthSegmentationDemo.jsx
│   ├── pages/
│   │   ├── BeHereMeow.jsx
│   │   ├── ExamplePage.jsx
│   │   └── DepthSegmentationPage.jsx
│   ├── theme/
│   │   ├── themes.js
│   │   └── ThemeContext.jsx
│   └── utils/
│       └── depth/
│           ├── pipeline.js
│           ├── depthEstimation.js
│           ├── quantization.js
│           └── segmentation.js
├── backend/
│   ├── app.py                  # FastAPI entry point
│   └── comic_engine/
│       ├── adapters/
│       │   └── depth_anything.py
│       └── core/
│           ├── depth.py
│           ├── image_utils.py
│           └── ports.py
├── vite-plugin-scene-exporter.js
├── vite.config.js
├── Tiltfile
└── docker-compose.yml
```

**Runtime stack:** React 18, React Router v7, Vite 5, `@sentry/react`

**Dev stack:** Vitest, ESLint 9, Prettier 3, Husky + lint-staged, size-limit, jscpd, knip

---

## Scene System

`src/components/scene/`

The scene system provides a CSS 3D perspective container and a set of components for placing
content at arbitrary positions in 3D space with mouse-driven parallax.

### Coordinate system

| Axis | Direction |
| ---- | --------- |
| X    | Left (−) → Right (+) |
| Y    | Up (−) → Down (+) — CSS convention |
| Z    | Far (−) → Near (+) |

Objects at a more negative Z appear smaller (further away) and move less with the mouse. Objects
at a more positive Z appear larger and move more.

---

### `Scene` — `src/components/scene/Scene.jsx`

The root container. Sets up a CSS `perspective` div, tracks mouse position normalised to `[-1,
1]`, and optionally tracks scroll for Z movement. Exposes state to children via `SceneContext`.

**Props:**

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `perspective` | `1000` | CSS perspective distance in px. Lower = more dramatic foreshortening. |
| `parallaxIntensity` | `1` | Global multiplier applied to all child parallax movement. |
| `mouseInfluence` | `{ x: 50, y: 30 }` | Maximum pixel offset caused by mouse movement. |
| `scrollEnabled` | `false` | If true, scroll position drives Z offset for all objects. |
| `scrollDepth` | `500` | Total Z range swept over a full scroll. |
| `editable` | `false` | Renders an "Edit Layout" overlay with drag and save/reset controls. |
| `onSave` | `null` | Callback `({ groupOffset: { x, y } })` called when the Save button is clicked in edit mode. |
| `className` / `style` | — | Passed to the outer div. |

**Edit mode:** When `editable` is true a checkbox appears in the top-left corner. Checking it
pauses parallax and allows the user to click-drag all scene objects as a group. The accumulated
`groupOffset` is reported to `onSave`. Generated pages wire this up to `PATCH /_dev/scenes/:slug`
so the drag result is persisted back to `scene.json` and the page file is regenerated.

**Context hook:** `useScene()` returns `{ mousePos, scrollZ, dimensions, parallaxIntensity,
mouseInfluence, perspective, editActive, groupOffset }`.

---

### `SceneObject` — `src/components/scene/SceneObject.jsx`

Places any React content at a position in 3D space and applies mouse-driven parallax via CSS
`transform: translate3d(…) rotateX(…) rotateY(…) rotateZ(…) scale(…)`.

**Props:**

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `position` | `[0, 0, 0]` | `[x, y, z]` in pixels. |
| `rotation` | `[0, 0, 0]` | `[rx, ry, rz]` in degrees. rx tilts top away/toward, ry turns left/right, rz is 2D spin. |
| `scale` | `1` | Uniform scale factor. |
| `parallaxFactor` | `null` (auto) | Amount of mouse-driven movement. Auto-computed from Z as `0.7 + z / 1000` when `null`. |
| `origin` | `'center'` | CSS `transform-origin`. |
| `interactive` | `true` | Whether the element receives pointer events. |
| `anchor` | `null` | Named anchor (`'center'`, `'top-left'`, `'bottom-right'`, …) or `{ x, y }` object for absolute positioning relative to parent. Defaults to centred. |
| `onClick` / `onHover` | — | Event handlers. |
| `className` / `style` | — | Passed to the wrapper div. |

**`ObjectPresets`** — a set of pre-configured position/parallaxFactor combinations:

| Preset | Z | parallaxFactor |
| ------ | - | -------------- |
| `farBackground` | −400 | 0.1 |
| `background` | −200 | 0.3 |
| `midground` | 0 | 0.6 |
| `foreground` | 150 | 0.9 |
| `nearForeground` | 300 | 1.2 |
| `leftWall` | 0, rotY 45° | 0.5 |
| `rightWall` | 0, rotY −45° | 0.5 |
| `floor` | rotX 60° | 0.4 |
| `heroShot` | rotX −15°, rotY 5°, rotZ −5° | 0.7 |

Spread presets onto a `SceneObject`: `<SceneObject {...ObjectPresets.background}>…</SceneObject>`

---

### `Panel` — `src/components/scene/Panel.jsx`

A comic-book panel frame with optional title/subtitle header and automatic image layer stacking.
Always used inside a `SceneObject`.

**Props:**

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `width` / `height` | `320` / `420` | Pixel dimensions. |
| `variant` | `'default'` | Panel style (see table below). |
| `title` / `subtitle` | — | Text rendered in a header at the top of the panel. |
| `layers` | `null` | Array of `{ src, alt, style, className }` objects stacked as absolutely-positioned `<img>` elements. |
| `onClick` | — | Click handler. |
| `className` / `style` | — | Passed to the outer div. |

**Variants:**

| Variant | Visual style |
| ------- | ------------ |
| `default` | Gradient background, themed border, box-shadow glow, halftone dot overlay |
| `borderless` | Transparent, no border or shadow |
| `torn` | Off-white paper texture, `clipPath` polygon to simulate torn edge, sepia filter |
| `polaroid` | White background, thick bottom padding, drop shadow |
| `monitor` | Dark background, thick dark border, CRT scanline overlay, green glow shadow |

---

## Overlay System

`src/components/overlays/`

Post-processing visual effects rendered as fixed-position elements on top of everything. All
intensity values default to the active theme's `effects` settings and can be overridden per
instance.

---

### `OverlayStack` — `src/components/overlays/index.jsx`

Master controller. Drop once at app level. Each effect can be toggled and individually configured.

```jsx
<OverlayStack
  filmGrain={true}
  vignette={true}
  scanlines={true}
  particles="dust"   // preset name, or config object, or null to disable
  ascii={false}
  filmGrainProps={{}}
  vignetteProps={{}}
  scanlinesProps={{}}
  particlesProps={{}}
  asciiProps={{}}
/>
```

Individual components are also re-exported for granular use.

---

### `FilmGrain` — `src/components/overlays/FilmGrain.jsx`

Animated per-frame random noise rendered to a `<canvas>` at half resolution for performance.
Blended over the scene with CSS `mix-blend-mode`.

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `intensity` | theme | Opacity of the grain layer (0 = off). |
| `speed` | `60` | Target fps for grain animation. |
| `monochrome` | `true` | If false, RGB channels are randomised independently. |
| `blendMode` | `'overlay'` | CSS `mix-blend-mode` value. |

---

### `Vignette` — `src/components/overlays/Vignette.jsx`

Edge darkening via a CSS radial or rectangular gradient.

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `intensity` | theme | Opacity (0 = off). |
| `color` | `'black'` | Vignette colour. |
| `shape` | `'ellipse'` | `'ellipse'` or `'rectangle'`. |
| `spread` | `50` | How far (%) the dark edge extends inward. |

---

### `Scanlines` — `src/components/overlays/Scanlines.jsx`

CRT-style horizontal lines via `repeating-linear-gradient`.

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `intensity` | theme | Opacity (0 = off). |
| `spacing` | `4` | Pixels between scanline bands. |
| `color` | `'rgba(0,0,0,0.8)'` | Line colour. |
| `animate` | `false` | Scrolls the scanlines downward when true. |
| `speed` | `30` | Animation duration in seconds. |

---

### `AsciiShader` — `src/components/overlays/AsciiShader.jsx`

Generates an animated ASCII-character grid driven by a sine-wave noise field on a `<canvas>`.
Characters are mapped from a dense (dark) to sparse (light) character set based on noise
brightness.

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `intensity` | theme | Opacity (0 = off). |
| `charset` | `'standard'` | `'standard'` (`@%#*+=-:. `), `'simple'` (`@#*-. `), `'blocks'` (`█▓▒░ `), `'matrix'` (katakana + `01`). Or any custom string. |
| `cellWidth` / `cellHeight` | `8` / `16` | Grid cell size in px. |
| `fontSize` | `12` | Font size in px. |
| `color` | theme text | Character colour. |
| `blendMode` | `'overlay'` | CSS `mix-blend-mode`. |
| `refreshRate` | `20` | Target fps. |

---

### `Particles` — `src/components/overlays/Particles.jsx`

Floating CSS-animated particles. Particle positions are seeded on mount.

| Prop | Default | Description |
| ---- | ------- | ----------- |
| `preset` | `'dust'` | Particle behaviour preset (see table below). |
| `count` | `50` | Number of particles. |
| `color` | preset | Override particle colour. |
| `enabled` | `true` | Toggle without unmounting. |

**Presets:**

| Preset | Motion | Notes |
| ------ | ------ | ----- |
| `dust` | Float (gentle random) | 1–3 px, low opacity, no glow |
| `snow` | Fall | 2–6 px, soft blur, high opacity |
| `bokeh` | Float | 20–60 px, heavy blur, glow, primary colour |
| `embers` | Rise | 2–5 px, orange glow, fades as it rises |
| `rain` | Fall fast | 1–2 px, elongated 8× vertically |

---

## Theme System

`src/theme/`

Five built-in themes. Theme state is managed in React context and drives both component styles
and overlay effect intensities.

---

### `themes.js` — theme definitions

Each theme exports a plain object with three sections:

```js
{
  name: 'Human-readable name',
  colors: {
    background, backgroundGradient,
    primary, secondary, accent,
    text, textMuted, textSubtle,
    border, shadow,
  },
  typography: {
    fontDisplay,   // headings / titles
    fontBody,      // UI / code
    fontNarrative, // story text
  },
  effects: {
    filmGrain,           // 0–1 opacity
    vignette,            // 0–1 opacity
    scanlines,           // 0–1 opacity
    chromaticAberration, // reserved, not yet rendered
    bloom,               // reserved, not yet rendered
    asciiShader,         // 0–1 opacity
  },
}
```

**Available themes:**

| Key | Name | Primary | Feel |
| --- | ---- | ------- | ---- |
| `noir` | Noir | `#e94560` | Deep purple/navy, heavy grain and vignette |
| `cyberpunk` | Cyberpunk | `#ff2a6d` | Dark violet, cyan accents, strong scanlines |
| `dreamscape` | Dreamscape | `#a855f7` | Cool purple/teal, soft grain, no scanlines |
| `pulp` | Pulp | `#d4a04a` | Warm sepia tones, maximum grain and vignette |
| `minimal` | Minimal | `#171717` | Light background, all effects off |

Default theme: `noir`.

---

### `ThemeContext.jsx` — provider and hook

**`ThemeProvider`** wraps the app and injects CSS custom properties as inline styles on its root
div (e.g. `--color-primary`, `--font-display`, `--effect-vignette`, …).

Props: `initialTheme` (default `'noir'`).

**`useTheme()`** returns:

| Key | Description |
| --- | ----------- |
| `theme` | Active theme object (merged with any overrides). |
| `themeName` | Active theme key string. |
| `availableThemes` | Array of all theme key strings. |
| `setTheme(name)` | Switch to a named theme. Warns if name not found. |
| `overrideTheme(overrides)` | Deep-merge partial overrides into the active theme without changing `themeName`. |
| `resetOverrides()` | Clear all overrides. |
| `cssVariables` | The CSS custom property object injected by the provider. |

---

## Depth Segmentation Pipeline

`src/utils/depth/`

Converts a single photograph into multiple depth-segmented layers, each as a PNG with an alpha
mask, ready to be placed in a `Scene` as stacked `SceneObject`s.

### Entry point: `processPhotoToLayers`

```js
import { processPhotoToLayers } from './src/utils/depth/pipeline.js';

const result = await processPhotoToLayers(imageOrDataUrl, {
  granularity: 0.3,       // 0.05 (many fine layers) – 0.9 (few coarse layers)
  depthModel: 'depth-anything-v2',
  minObjectSize: 100,     // Minimum connected-component area in px²
  blurFill: 20,           // Blur radius for fill pixels; 0 = transparent cutouts
  layerArrangement: null, // Custom Z-placement function(count) → number[]
  onProgress: (step, value) => {},  // 'depth-estimation' | 'quantization' | 'segmentation' | 'export' | 'complete'
});

// result.layers[i].sceneObjectProps = { position: [0, 0, z], parallaxFactor }
// result.layers[i].imageUrl         = data URL (sharp cutout)
// result.layers[i].blurFillUrl      = data URL (blur-filled version)
// result.layers[i].fillMaskUrl      = data URL (white mask for solid colour fill)
```

---

### Stage 1 — Depth estimation (`depthEstimation.js`)

`estimateDepth(image, { model })` → `{ width, height, data: Float32Array, model }` where `data`
is normalised `[0, 1]` (0 = far, 1 = near).

**Backend path:** Sends the image to `POST /api/depth` on the backend (see [Backend](#backend)).
Returns a grayscale PNG; the red channel is decoded as depth.

**Fallback / mock:** If the backend is unreachable, a synthetic depth map is generated by mapping
vertical pixel position (top = far, bottom = near) with ±10 % brightness variance. The `model`
field in the result is set to `'mock'`.

`visualizeDepthMap(depthMap)` → grayscale data URL (for preview / debugging).

---

### Stage 2 — Quantization (`quantization.js`)

`quantizeDepth(depthMap, granularity)` → `QuantizedDepthMap`

Builds a 100-bin depth histogram, finds local maxima with sufficient separation (controlled by
`granularity`), and assigns every pixel to its nearest peak. The result is an integer layer ID per
pixel plus layer metadata including average depth and Z position.

`depthToZPosition(depth)` maps `[0, 1]` → `[-400, 200]` (the SceneObject Z range).

`fixedStepArrangement(count, { start = -400, step = 50 })` — default Z placement: layers spaced
50 px apart starting at −400.

`fillRangeArrangement(count, { far = -400, near = 200 })` — spreads layers evenly across the full
Z range.

---

### Stage 3 — Segmentation (`segmentation.js`)

`segmentLayers(sourceImage, quantizedMap, { minObjectSize, blurFill })` → `LayerObject[]`

For each depth layer:

1. Builds a binary mask from `layerAssignments`.
2. Runs 4-connectivity flood fill to find connected components; discards components smaller than
   `minObjectSize` pixels.
3. Produces a **cumulative "above" mask** — the union of all nearer layers' sharp pixels. This
   prevents a layer's blur fill from occluding content that visually sits in front of it.
4. Extracts the layer image:
   - **Sharp cutout** (always): source pixels where the mask is set; transparent elsewhere.
   - **Blur-filled** (when `blurFill > 0`): sharp where the mask is set; blurred source where the
     above-mask is set (i.e. regions that will be covered by nearer layers); transparent elsewhere.
5. Generates a **fill mask PNG** (white = "above" region, transparent elsewhere) for solid-colour
   fill mode.

---

### Stage 4 — Export (`pipeline.js`)

Converts `LayerObject[]` into `ProcessedLayer[]` with:

- `sceneObjectProps.position` — `[0, 0, z]` from the chosen arrangement function.
- `sceneObjectProps.parallaxFactor` — mapped from depth `[0, 1]` → `[0.1, 1.0]`.

`getSceneLayers(result)` returns a simplified array with `{ id, name, imageUrl, position,
parallaxFactor }`.

---

### Fill modes summary

| Mode | How cutout areas are filled | Set via |
| ---- | --------------------------- | ------- |
| None (default) | Transparent | `blurFill: 0` |
| Blur fill | Blurred copy of source image (only under nearer layers) | `blurFill: <radius>` |
| Solid colour | Theme background colour via CSS mask | Generated page uses `fillMaskUrl` |

---

## Scene Exporter (Vite Plugin)

`vite-plugin-scene-exporter.js`, registered in `vite.config.js`

A **dev-only** Vite plugin that adds REST endpoints for creating and updating scenes without
touching source code manually. Only active during `npm run dev`.

Scenes are stored under `public/scenes/<slug>/` alongside a `scene.json` manifest. Generated
React page components are written to `src/pages/<ComponentName>.jsx` and wired into `App.jsx`
automatically via marker comments (see [App Routing](#app-routing--marker-comment-system)).

### Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/_dev/scenes` | List all scenes that have a `scene.json`. Returns `{ slug, name, layerCount, hasPage }[]`. |
| `POST` | `/_dev/scenes` | Create a new scene. Body: `{ name, layers[], sceneConfig }`. Saves PNG assets, writes `scene.json`, generates a page component, and updates `App.jsx`. |
| `POST` | `/_dev/scenes/:slug/layers` | Replace layer assets in an existing scene. Body: `{ layers[] }`. Returns saved file list and a JSX code snippet. |
| `PATCH` | `/_dev/scenes/:slug` | Apply a group drag offset from edit mode. Body: `{ groupOffset: { x, y } }`. Updates `scene.json` positions and regenerates the page component. |

### Layer asset files per scene

For each layer index `i`, up to three files may be written:

| File | Content |
| ---- | ------- |
| `layer-<i>.png` | Sharp cutout (transparent background) |
| `layer-<i>-fill.png` | Fill mask (white = solid fill region) |
| `layer-<i>-blur.png` | Blur-filled version |

### Generated page template

`POST /_dev/scenes` generates a page component with:

- Static imports for layer PNG assets (`/scenes/<slug>/layer-<i>-blur.png` for blur mode,
  `layer-<i>.png` + `layer-<i>-fill.png` for solid mode).
- A `<Scene>` with the scene's saved `perspective`, `parallaxIntensity`, and `mouseInfluence`
  config, plus `editable` and an `onSave` handler that calls `PATCH /_dev/scenes/:slug`.
- One `<SceneObject>` per layer with saved position and parallaxFactor.
- A title `<SceneObject>`.

---

## Pages

`src/pages/`

### `BeHereMeow` — `src/pages/BeHereMeow.jsx`

The first real composition: a meditative cat buddha scene. Demonstrates multi-layer parallax with
hand-crafted CSS artwork. Clicking the cat buddha toggles an "omm" state that pulses the aura,
brightens the third eye, and animates the floating mantras.

Layer stack (back → front):

| Layer | Z | parallaxFactor | Content |
| ----- | - | -------------- | ------- |
| Mountain glow | −450 | 0.05 | Blurred gradient ellipse |
| Clouds ×5 | −400 → −420 | 0.08 | Small radial gradient blobs |
| Lotus (far left) | −250 | 0.20 | CSS lotus, primary colour |
| Lotus (far right) | −220 | 0.25 | CSS lotus, secondary colour |
| Lotus (mid) | −280 | 0.18 | CSS lotus, accent, 60% opacity |
| Cat Buddha | 0 | 0.5 | Central placeholder shape with emoji cat face, halo rings, paws |
| Smoke wisp left | 100 | 0.70 | Animated rising smoke |
| Smoke wisp right | 120 | 0.75 | Animated rising smoke |
| Mantra: OM | 180 | 0.85 | Floating text |
| Mantra: MANI | 200 | 0.90 | Floating text |
| Mantra: PADME | 220 | 0.95 | Floating text |
| Mantra: HUM | 250 | 1.00 | Floating text |
| Title | 150 | 0.80 | "BE HERE MEOW" |
| Close lotus left | 280 | 1.10 | Blurred lotus, 30% opacity |
| Close lotus right | 300 | 1.15 | Blurred lotus, 25% opacity |

---

### `ExamplePage` — `src/pages/ExamplePage.jsx`

Reference implementation. Shows how to use all scene composition patterns:

- Far background decorative shapes (z=−400/−350, parallaxFactor 0.1–0.15)
- Background panel tilted away from camera (z=−200, rotX 15°, rotY −10°)
- Midground panel facing camera (z=0)
- Side panel rotated on Y axis like a wall (z=−50, rotY −35°)
- Foreground video placeholder close to camera (z=150)
- Extreme foreground floating text (z=250)
- Floor element rotated 75° on X axis (z=−150)

Includes an info panel in the bottom-left corner documenting the layout. Copy this file as a
starting point for new scenes.

---

### `DepthSegmentationPage` — `src/pages/DepthSegmentationPage.jsx`

Thin wrapper around `DepthSegmentationDemo`. The demo provides:

- File upload (JPEG/PNG)
- Granularity slider (0.05 coarse → 0.9 fine) with label
- Cutout fill mode toggle: "Blur Fill" (with blur radius sub-slider) or "Solid Color"
- Process button with four-stage progress display
- Live parallax preview of the resulting layers in a `Scene`
- Depth map thumbnail in the bottom-right corner
- Export buttons once processing is complete:
  - **Export to New Scene** — enter a name, calls `POST /_dev/scenes`, navigates to the new route
  - **Export to Existing Scene** — select from a list fetched via `GET /_dev/scenes`, calls `POST
    /_dev/scenes/:slug/layers`, shows a JSX code snippet

---

### Generated pages (pattern)

When a scene is exported via the exporter plugin, a page component is generated at
`src/pages/<ComponentName>.jsx`. Generated pages:

- Import layer assets as static ES module imports.
- Include `editable` and `onSave` props on `<Scene>` wired to `PATCH /_dev/scenes/:slug`.
- Are self-contained and can be committed directly to the repo.

No generated pages exist on `main` yet.

---

## Dev Controls

All three controls live in `src/App.jsx` as internal components, rendered globally by `AppContent`
(hidden on `/depth-segmentation` which has its own UI).

| Control | Position | Function |
| ------- | -------- | -------- |
| **ThemeSwitcher** | Top-right | `<select>` over all available themes; calls `setTheme()`. |
| **OverlayControls** | Top-right (below ThemeSwitcher) | Checkboxes for filmGrain, vignette, scanlines, ASCII shader; `<select>` for particle preset (none / dust / snow / bokeh / embers / rain). |
| **PageNavigator** | Bottom-left | Link buttons to each registered route. Active route is highlighted. |

---

## App Routing & Marker Comment System

`src/App.jsx`, `src/main.jsx`

The app uses React Router v7 with `<BrowserRouter>` (wrapped in `main.jsx`). Routes are defined
in `AppContent` inside `<Routes>`.

**Hardcoded routes:**

| Path | Component |
| ---- | --------- |
| `/` | `BeHereMeow` |
| `/example` | `ExamplePage` |
| `/depth-segmentation` | `DepthSegmentationPage` |

**Marker comments for automated route registration:**

The scene exporter plugin inserts new entries by searching for these exact comment strings in
`App.jsx`:

| Marker | Location | Inserted content |
| ------ | -------- | ---------------- |
| `// @scene-imports` | Top-level import block | `import { ComponentName } from './pages/ComponentName';` |
| `// @scene-pages` | `pages` array in `PageNavigator` | `{ path: '/<slug>', label: '<Title>' }` |
| `{/* @scene-routes */}` | `<Routes>` block | `<Route path="/<slug>" element={<ComponentName />} />` |

Do not remove these comments — they are required for the automated export flow to work.

**Vite proxy:** `/api` requests are proxied to `VITE_API_TARGET` (default
`http://localhost:5666`), which is where the Python backend listens.

---

## Backend

`backend/`

A Python FastAPI service that serves depth estimation via Depth Anything V2. Started as part of
the Docker Compose stack; not required for basic frontend development.

### API

| Method | Path | Description |
| ------ | ---- | ----------- |
| `GET` | `/api/health` | Returns `{ "status": "ok" }`. |
| `POST` | `/api/depth` | Accepts a multipart image upload (`file`). Returns a grayscale PNG with `X-Depth-Width` and `X-Depth-Height` response headers. |

### Model

**Depth Anything V2 Small** (`depth-anything/Depth-Anything-V2-Small-hf` on HuggingFace).

The adapter (`comic_engine/adapters/depth_anything.py`) lazy-loads the model on the first
request. Device selection priority: Apple MPS → CUDA → CPU.

Model weights are cached in `backend/models/` (controlled by `$HF_HOME`). The `models/` directory
is gitignored; the model is downloaded automatically on first start.

### Package structure

```
backend/
├── app.py                         # FastAPI app, registers routes
└── comic_engine/
    ├── core/
    │   ├── depth.py               # estimate_depth() — calls the port
    │   ├── image_utils.py         # decode_upload(), depth_to_png()
    │   └── ports.py               # DepthModelPort protocol
    └── adapters/
        └── depth_anything.py      # DepthAnythingV2Adapter implements DepthModelPort
```

The core is structured around a hexagonal / ports-and-adapters pattern: `depth.py` depends only
on the `DepthModelPort` protocol; the adapter wires the real model in.

### Running the backend

```bash
# With Tilt (recommended for local dev — hot-reloads both services)
tilt up

# Or with Docker Compose directly
docker compose up

# Backend listens on http://localhost:5666 by default
```

---

## Infrastructure & CI

### Local tooling

| Tool | Purpose |
| ---- | ------- |
| Husky + lint-staged | Pre-commit: ESLint --fix + Prettier on `src/**/*.{js,jsx}`; Prettier on `*.{json,md}` |
| ESLint 9 | Linting (`npm run lint`) |
| Prettier 3 | Formatting (`npm run format` / `format:check`). Print width 100. |
| Vitest | Unit tests (`npm test`) |
| size-limit | Bundle size gate: 250 kB across all JS output (`npm run size:check`) |
| jscpd | Copy-paste detection (configured in devDependencies) |
| knip | Dead code / unused exports detection (configured in devDependencies) |
| Tilt | Local dev orchestration for Docker Compose frontend + backend |

### GitHub Actions workflows

| File | Trigger | Purpose |
| ---- | ------- | ------- |
| `ci.yml` | Push / PR | Build, lint, test, size check |
| `security.yml` | Push / PR / schedule | CodeQL static analysis |
| `pr-lint.yml` | PR | Validates PR title format |
| `docs.yml` | PR | Validates documentation changes |
| `release.yml` | Tag push | Release automation |
| `claude.yml` | Issue / PR comment | Claude Code GitHub Actions integration |
| `claude-code-review.yml` | PR | Claude automated code review |

### Error tracking

`@sentry/react` is listed as a runtime dependency. Sentry is available for error capture and
performance monitoring; integration details are in `src/main.jsx`.

### Dependabot

Configured to keep npm and GitHub Actions dependencies up to date (`.github/dependabot.yml`).

---

## Current State

### Works end-to-end (no backend required)

- All five themes, theme switching, CSS custom properties
- All overlay effects: FilmGrain, Vignette, Scanlines, AsciiShader, Particles (all presets)
- Scene, SceneObject, Panel — parallax, rotation, variants
- `BeHereMeow` page — CSS artwork, interactive OM state
- `ExamplePage` — reference implementation
- `DepthSegmentationPage` UI — file upload, controls, export buttons
- Depth pipeline — quantization and segmentation stages run in the browser
- Scene exporter plugin — full create / update / drag-save flow during `npm run dev`
- Scene edit mode — drag to reposition, PATCH save, page regeneration

### Requires the backend to be running

- Real depth estimation in `DepthSegmentationDemo` — the frontend falls back to a mock depth map
  (vertical gradient + brightness variance) when `POST /api/depth` is unreachable.

### Placeholder / incomplete

- **Cat Buddha artwork** in `BeHereMeow.jsx`: the central figure is a styled div with an emoji
  cat face (`🐱`). The comment says _"replace with your artwork"_.
- **`chromaticAberration` and `bloom` effects**: defined in theme `effects` objects and exposed as
  CSS custom properties, but no overlay component renders them yet.
- **`ExamplePage` panels**: all content areas are labelled placeholder divs (`"[ Background
  artwork ]"`, `"[ Main panel artwork ]"`, etc.).

### Not yet implemented (see open issues)

- Stereoscopic / WebVR view (#18)
- True depth layer ordering preserved through export (#20)
- Multi-group SceneObject dragging in edit mode (#21)
- Object insertion toolbar (#24)
- Exporting layers should append rather than overwrite (#25)
- Journal integration (#1) and Biography Snapshots (#2) — new feature modules

---

## Open Issues

| # | Title | Area |
| - | ----- | ---- |
| [#1](https://github.com/Luan-vP/comic-engine/issues/1) | Journal Integration | New feature |
| [#2](https://github.com/Luan-vP/comic-engine/issues/2) | Biography Snapshots | New feature |
| [#18](https://github.com/Luan-vP/comic-engine/issues/18) | WebVR/Cardboard stereoscopic view | Scene system |
| [#20](https://github.com/Luan-vP/comic-engine/issues/20) | Preserve true layer depth | Depth pipeline / export |
| [#21](https://github.com/Luan-vP/comic-engine/issues/21) | Multi-group SceneObject grouping | Scene edit mode |
| [#23](https://github.com/Luan-vP/comic-engine/issues/23) | Fix App.test.jsx | Testing |
| [#24](https://github.com/Luan-vP/comic-engine/issues/24) | Object insertion toolbar | Dev UX |
| [#25](https://github.com/Luan-vP/comic-engine/issues/25) | Exporting layers should append | Scene exporter |
