# Comic Engine — Dev Log

> Snapshot date: 2026-02-19

This document describes the current state of the comic engine: what exists, how the
pieces fit together, what is placeholder, and what is planned.

It complements [`CLAUDE.md`](./CLAUDE.md), which is a terse agent guide. This file is
narrative and descriptive.

---

## Table of Contents

1. [Architecture overview](#architecture-overview)
2. [Scene system](#scene-system)
3. [Overlay system](#overlay-system)
4. [Theme system](#theme-system)
5. [Depth segmentation pipeline](#depth-segmentation-pipeline)
6. [Pages](#pages)
7. [Dev controls](#dev-controls)
8. [App routing](#app-routing)
9. [Backend](#backend)
10. [Infrastructure and CI](#infrastructure-and-ci)
11. [Current state](#current-state)
12. [Open issues](#open-issues)

---

## Architecture overview

The engine is a **React + Vite** single-page application (no TypeScript — JSX
throughout). The frontend renders comic scenes via CSS 3D transforms and post-processing
overlays. A separate **FastAPI + Python** backend serves a monocular depth estimation
model used to turn photographs into parallax-ready layer stacks.

```
comic-engine/
├── src/
│   ├── components/
│   │   ├── scene/          # 3D scene system
│   │   └── overlays/       # Post-processing effects
│   ├── pages/              # Scene compositions (one file = one page)
│   ├── theme/              # Theme definitions and context
│   └── utils/depth/        # Photo-to-layers pipeline (frontend side)
├── backend/                # FastAPI depth estimation service
│   ├── comic_engine/       # Python package
│   │   ├── adapters/       # Outbound adapters (HuggingFace model)
│   │   └── core/           # Domain logic
│   ├── app.py              # FastAPI entry point
│   └── Dockerfile
├── vite.config.js          # Vite + Vitest config; /api proxy to backend
├── Tiltfile                # Tilt orchestration (docker-compose)
└── CLAUDE.md               # Agent guide
```

---

## Scene system

**Location:** `src/components/scene/`
**Exports:** `Scene`, `useScene`, `SceneObject`, `ObjectPresets`, `Panel`

### `Scene` (`src/components/scene/Scene.jsx`)

A full-viewport CSS `perspective` container that provides 3D parallax driven by mouse
position and (optionally) scroll.

**Coordinate system:**

- X: left (−) → right (+)
- Y: up (−) → down (+) (CSS convention)
- Z: away from camera (−) → toward camera (+)

**Key props:**

| Prop | Default | Description |
| --- | --- | --- |
| `perspective` | `1000` | CSS perspective in px. Lower = more dramatic. |
| `parallaxIntensity` | `1` | Global multiplier applied to all child parallax. |
| `mouseInfluence` | `{x:50, y:30}` | Max pixel offset per axis. |
| `scrollEnabled` | `false` | Enables scroll-to-Z movement. |
| `scrollDepth` | `500` | Total Z change over full page scroll. |

**Behaviour:** Mouse position is normalized to `[−1, 1]` within the container.
`SceneContext` shares `mousePos`, `scrollZ`, `dimensions`, `parallaxIntensity`, and
`mouseInfluence` with all children.

### `SceneObject` (`src/components/scene/SceneObject.jsx`)

Positions any React content in 3D space with parallax.

**Key props:**

| Prop | Default | Description |
| --- | --- | --- |
| `position` | `[0,0,0]` | `[x, y, z]` in pixels. |
| `rotation` | `[0,0,0]` | `[rx, ry, rz]` in degrees (X=tilt, Y=turn, Z=2D rotate). |
| `scale` | `1` | Uniform scale. |
| `parallaxFactor` | `null` | Mouse movement multiplier. `null` auto-calculates from Z (`0.7 + z/1000`). |
| `anchor` | `null` | Named anchor (`'center'`, `'top-left'`, etc.) or `{x, y}` CSS object. |
| `interactive` | `true` | Whether pointer events pass through. |

**`ObjectPresets`** is a named map of common placements ready to spread onto a
`SceneObject`:

| Preset | Z | parallaxFactor |
| --- | --- | --- |
| `farBackground` | −400 | 0.1 |
| `background` | −200 | 0.3 |
| `midground` | 0 | 0.6 |
| `foreground` | +150 | 0.9 |
| `nearForeground` | +300 | 1.2 |
| `leftWall` | −300, Y-rotated 45° | 0.5 |
| `rightWall` | +300, Y-rotated −45° | 0.5 |
| `floor` | Y+200, X-rotated 60° | 0.4 |
| `heroShot` | Y+50, X−15° Y+5° Z−5° | 0.7 |

### `Panel` (`src/components/scene/Panel.jsx`)

A themed comic-book panel frame wrapping arbitrary content or an array of auto-stacked
image layers.

**Key props:**

| Prop | Default | Description |
| --- | --- | --- |
| `width` / `height` | `320` / `420` | Panel dimensions in px. |
| `variant` | `'default'` | Frame style (see below). |
| `title` / `subtitle` | — | Header text drawn with display / narrative fonts. |
| `layers` | `null` | Array of `{src, style, className}` for automatic image stacking. |

**Variants:**

| Variant | Description |
| --- | --- |
| `default` | Dark background with theme border, box shadow, and a subtle halftone dot overlay. |
| `borderless` | Transparent, no border or shadow. |
| `torn` | Cream paper with clipped polygon edges and a sepia filter. |
| `polaroid` | White frame with large bottom margin. |
| `monitor` | Dark CRT monitor with built-in scanline stripes. |

---

## Overlay system

**Location:** `src/components/overlays/`
**Exports:** `OverlayStack`, `FilmGrain`, `Vignette`, `Scanlines`, `AsciiShader`,
`Particles`

All overlays are `position: fixed`, `pointer-events: none`, and layered in the high
z-index range (9996–9999). Each overlay reads its default intensity from the active
theme's `effects` object but accepts an `intensity` override prop.

### `OverlayStack` (`src/components/overlays/index.jsx`)

Master controller that renders all overlays from a single component. Drop it once at the
app level.

```jsx
<OverlayStack
  filmGrain={true}
  vignette={true}
  scanlines={true}
  particles="dust" // preset name, or config object, or null
  ascii={false}
/>
```

Individual overlay props are forwarded via `filmGrainProps`, `vignetteProps`, etc.

### `FilmGrain` (`src/components/overlays/FilmGrain.jsx`)

Animated film-grain noise rendered on a `<canvas>` at half resolution (for performance).
Uses `requestAnimationFrame` at configurable FPS.

Props: `intensity`, `speed` (fps, default 60), `monochrome` (default true),
`blendMode` (default `'overlay'`).

### `Vignette` (`src/components/overlays/Vignette.jsx`)

Edge-darkening via a `radial-gradient` or crossing linear gradients.

Props: `intensity`, `color` (default `'black'`), `shape` (`'ellipse'`|`'rectangle'`),
`spread` (how far inward, default 50%).

### `Scanlines` (`src/components/overlays/Scanlines.jsx`)

CRT horizontal scanlines via `repeating-linear-gradient`.

Props: `intensity`, `spacing` (px between lines, default 4), `color`, `animate`
(scroll animation), `speed` (animation loop duration in seconds).

### `AsciiShader` (`src/components/overlays/AsciiShader.jsx`)

A full-screen `<canvas>` grid of ASCII characters driven by a sine-wave noise function
with a radial brightness gradient (lighter centre, darker edges).

Built-in charsets: `standard` (`@%#*+=-:. `), `simple` (`@#*-. `), `blocks`
(`█▓▒░ `), `matrix` (katakana + `01`).

Props: `intensity`, `charset`, `cellWidth`, `cellHeight`, `fontSize`, `color`,
`blendMode`, `refreshRate` (fps, default 20).

### `Particles` (`src/components/overlays/Particles.jsx`)

CSS-animated floating particles. Seeds are generated once on mount and never change
(stable between renders).

**Presets:**

| Preset | Motion | Notes |
| --- | --- | --- |
| `dust` | Gentle float | Small, low opacity |
| `snow` | Falling | Slight blur |
| `bokeh` | Float | Large, very transparent, glow, theme primary colour |
| `embers` | Rising | Orange glow |
| `rain` | Fast fall | Elongated drops |

Props: `preset`, `count` (default 50), `color` (override), `enabled`.

---

## Theme system

**Location:** `src/theme/`
**Exports:** `themes`, `defaultTheme` (from `themes.js`); `ThemeProvider`, `useTheme`
(from `ThemeContext.jsx`)

### Theme structure

Each theme defines three namespaces:

```js
{
  name: 'Noir',
  colors: {
    background, backgroundGradient,
    primary, secondary, accent,
    text, textMuted, textSubtle,
    border, shadow
  },
  typography: {
    fontDisplay,  // headlines
    fontBody,     // monospace / UI text
    fontNarrative // body copy / captions
  },
  effects: {
    filmGrain, vignette, scanlines,
    chromaticAberration, bloom, asciiShader
  }
}
```

### Available themes

| Key | Name | Character |
| --- | --- | --- |
| `noir` | Noir | Deep purple-black, red primary. JetBrains Mono body. (default) |
| `cyberpunk` | Cyberpunk | Electric pink + cyan. Orbitron display font. Heavy scanlines. |
| `dreamscape` | Dreamscape | Purple-teal. Playfair Display. Soft bloom, no scanlines. |
| `pulp` | Pulp | Warm amber paper. Alfa Slab One. Heavy film grain + vignette. |
| `minimal` | Minimal | White background, near-black text. No effects. |

### `ThemeProvider` / `useTheme`

`ThemeProvider` wraps the app and exposes theme state via React context. It also injects
CSS custom properties (`--color-*`, `--font-*`, `--effect-*`) onto the wrapper `<div>`.

The context value:

```js
{
  theme,            // merged theme object (base + overrides)
  themeName,        // active theme key string
  availableThemes,  // array of all theme key strings
  setTheme(name),   // switch to a named theme
  overrideTheme(partial), // deep-merge partial overrides on top of the base theme
  resetOverrides(),       // clear all overrides
  cssVariables,     // object of CSS custom properties
}
```

---

## Depth segmentation pipeline

**Location:** `src/utils/depth/`

Converts a single photograph into a stack of depth-separated PNG layers, each with
an alpha mask, ready to be placed as `SceneObject` children at different Z positions.

### Pipeline stages

```
Photo → estimateDepth() → quantizeDepth() → segmentLayers() → ProcessedLayer[]
```

#### 1. `estimateDepth` (`depthEstimation.js`)

Calls `POST /api/depth` on the backend (uploads image as `multipart/form-data`, receives
a grayscale PNG with `X-Depth-Width` / `X-Depth-Height` headers). If the backend is
unavailable the function catches the error and falls back to a mock depth map (vertical
gradient top=far, bottom=near, plus ±10% brightness variance).

Returns a `DepthMap: { width, height, data: Float32Array, model }` with values
normalised to `[0, 1]` (0 = far, 1 = near).

#### 2. `quantizeDepth` (`quantization.js`)

Finds natural breakpoints in the depth histogram using local-maxima peak detection.
The `granularity` parameter controls minimum peak separation (lower = more layers).

Maps layer depth to Z position via `depthToZPosition`: `depth [0,1] → z [-400, 200]`.

Returns a `QuantizedDepthMap` with per-pixel layer assignments.

#### 3. `segmentLayers` (`segmentation.js`)

Extracts per-layer PNG images (with alpha) from the source photograph using the
quantized mask. Connected components smaller than `minObjectSize` pixels are discarded
as noise.

**Cutout fill modes** (controlled by the `blurFill` option in `processPhotoToLayers`):

- `blurFill = 0` — transparent cut-outs (default)
- `blurFill > 0` — transparent regions are filled with a blurred copy of the source
  image, but only where no nearer layer has sharp content. This hides holes that appear
  during parallax movement. A fill-mask PNG (white where fill applies) is also produced.

Also supports **solid colour fill** in the UI (applied at render time using the
fill-mask as a CSS mask, not baked into the image).

#### 4. Layer arrangement

Two built-in Z-arrangement strategies:

- `fixedStepArrangement(count)` — layers spaced 50px apart starting at z=−400
- `fillRangeArrangement(count)` — layers distributed evenly across z=[−400, 200]

#### Entry point

```js
import { processPhotoToLayers } from 'src/utils/depth';

const result = await processPhotoToLayers(imageElement, {
  granularity: 0.3,     // 0.0–1.0; lower = more layers
  blurFill: 20,         // blur radius in px; 0 = transparent
  minObjectSize: 100,   // minimum component size in pixels
  depthModel: 'depth-anything-v2',
  onProgress: (step, value) => { /* step = stage name, value = 0–1 */ },
  layerArrangement: null, // defaults to fixedStepArrangement
});

// result.layers[i].sceneObjectProps = { position: [0, 0, z], parallaxFactor }
```

---

## Pages

**Location:** `src/pages/`

### `BeHereMeow` (`src/pages/BeHereMeow.jsx`)

A meditative cat buddha scene demonstrating multi-depth parallax composition with pure
CSS elements. No external assets.

Layer stack (back to front):

| Z | Content |
| --- | --- |
| −450 | Mountains / clouds (blurred divs, parallaxFactor 0.05) |
| −400 | Floating cloud divs (parallaxFactor 0.08) |
| −250 to −220 | Lotus flowers (helper `Lotus` component, CSS petals) |
| 0 | Cat Buddha placeholder (click to toggle "omming" state) |
| +100 to +120 | Incense smoke wisps (`SmokeWisp` helper) |
| +180 to +220 | Floating mantras: OM, MANI, PADME, HUM (`FloatingText` helper) |
| +280 to +300 | Close foreground lotus blur elements |

Interaction: clicking the cat buddha toggles `isOmmming` state, which activates pulsing
aura rings and the floating mantra animation.

**Status:** The cat figure is a placeholder (`🐱` emoji + `[ Your cat buddha artwork here ]`
label). No real artwork has been placed yet.

### `ExamplePage` (`src/pages/ExamplePage.jsx`)

A reference scene showing how to use the full `Panel` variant set and all depth layers.
All panel content areas show `[ artwork placeholder ]` labels. Intended as a copy-paste
starting point.

Demonstrates: far background shapes, tilted-back Panel (default variant), midground
facing Panel (default), side polaroid Panel, foreground video placeholder, extreme
foreground text overlay, floor element (X-rotated 75°).

### `DepthSegmentationPage` (`src/pages/DepthSegmentationPage.jsx`)

Thin wrapper around `src/components/DepthSegmentationDemo.jsx`. Global overlays are
suppressed on this route (see `App.jsx`).

**`DepthSegmentationDemo`** provides:

- File upload (JPEG/PNG)
- Granularity slider (0.05–0.90)
- Cutout fill controls: blur fill (with radius slider 5–50px) or solid colour (theme
  background colour applied via fill-mask)
- "Process Image" button — runs the full pipeline with progress reporting
- Parallax scene rendering of processed layers (`Scene` + `SceneObject` per layer)
- Depth map visualisation thumbnail (bottom-right, grayscale)

---

## Dev controls

Rendered inside `App.jsx`, visible on all pages except `/depth-segmentation`.

| Control | Position | Description |
| --- | --- | --- |
| Theme Switcher | top-right | `<select>` to switch between all 5 themes live. |
| Overlay Controls | top-right (below switcher) | Toggle checkboxes for Film Grain, Vignette, Scanlines, ASCII Shader. Dropdown for Particles preset (none/dust/snow/bokeh/embers/rain). |
| Page Navigator | bottom-left | `<Link>` buttons for all registered routes. |

---

## App routing

**File:** `src/App.jsx`

Routes are declared with `react-router-dom` v7:

| Path | Component |
| --- | --- |
| `/` | `BeHereMeow` |
| `/example` | `ExamplePage` |
| `/depth-segmentation` | `DepthSegmentationPage` |

`ThemeProvider` wraps the entire app with initial theme `'noir'`. Overlays and dev
controls are rendered in `AppContent` (inside the provider so they can access the theme
context).

The Vite dev server proxies `/api/*` to `http://localhost:5666` (configurable via the
`VITE_API_TARGET` environment variable).

---

## Backend

**Location:** `backend/`
**Language:** Python 3.12
**Framework:** FastAPI

### API endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check — returns `{"status": "ok"}`. |
| `POST` | `/api/depth` | Accepts `multipart/form-data` with a `file` field (PNG/JPEG). Returns a grayscale PNG depth map with headers `X-Depth-Width` and `X-Depth-Height`. |

### Depth model

Model: **Depth Anything V2 Small** (`depth-anything/Depth-Anything-V2-Small-hf`) via
HuggingFace Transformers.

Device selection is automatic: MPS (Apple Silicon) → CUDA → CPU. The model is loaded
lazily on the first request and cached in memory. Weights are cached on disk at
`backend/models/` (configured via `HF_HOME`).

**Status:** The model is real and produces genuine depth maps when the backend is
running. The frontend pipeline falls back to a mock depth map (vertical gradient) if the
backend is unreachable.

### Package structure

```
backend/
├── app.py                     # FastAPI app, /api/depth endpoint
└── comic_engine/
    ├── core/
    │   ├── depth.py           # estimate_depth() domain function
    │   ├── image_utils.py     # decode_upload(), depth_to_png()
    │   └── ports.py           # DepthModel protocol (interface)
    └── adapters/
        └── depth_anything.py  # DepthAnythingV2Adapter (HuggingFace)
```

### Running the backend

The backend is Dockerised. With Tilt:

```bash
tilt up   # starts both frontend and backend via docker-compose
```

Or directly:

```bash
cd backend
uv pip install .
uvicorn app:app --port 8000
```

The frontend Vite dev server (port 5173) proxies `/api` to port 5666 by default (the
docker-compose mapping). Set `VITE_API_TARGET=http://localhost:8000` if running the
backend directly on port 8000.

---

## Infrastructure and CI

### Local dev tooling

| Tool | Purpose |
| --- | --- |
| Husky (`.husky/pre-commit`) | Pre-commit hook: runs lint-staged |
| lint-staged | On `src/**/*.{js,jsx}`: ESLint --fix + Prettier. On `*.{json,md}`: Prettier. |
| ESLint | JavaScript linting (`eslint src/`) |
| Prettier | Code formatting |
| Vitest | Unit tests (`npm test`) |
| size-limit | Bundle size guard — 250kB limit on `dist/**/*.js` |
| knip | Dead code detection |
| jscpd | Duplicate code detection (5% threshold) |

### GitHub Actions workflows (`.github/workflows/`)

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | Push/PR to main | Lint, format check, test + coverage, dead code (knip), duplicate detection (jscpd), TODO tracker in summary, build, bundle size check (non-blocking) |
| `docs.yml` | Push/PR to main | Documentation validation |
| `pr-lint.yml` | PR events | PR title format linting |
| `security.yml` | Push/PR to main | CodeQL security scanning |
| `release.yml` | Release events | Release workflow |
| `claude.yml` | Issue/PR comments | Claude Code AI task execution |
| `claude-code-review.yml` | PR opened/updated | Claude Code automated PR review |

### Other integrations

- **Sentry** (`@sentry/react`) — error tracking (configured in app, not shown here)
- **Dependabot** — automated dependency updates

---

## Current state

### Works end-to-end (no backend required)

- Scene + SceneObject + Panel composition
- All overlays (FilmGrain, Vignette, Scanlines, AsciiShader, Particles)
- Theme switching (all 5 themes)
- BeHereMeow page (interactive cat buddha)
- ExamplePage (reference composition)
- DepthSegmentationDemo UI: image upload, settings, pipeline stages 2–4
  (quantization, segmentation, parallax rendering) with **mock depth** (vertical
  gradient fallback)

### Requires backend to be running

- Real depth estimation in the pipeline — `POST /api/depth` must succeed. When the
  backend is unavailable, `estimateDepth()` falls back to the mock and logs a warning.

### Placeholder / demo only

- The cat buddha figure in `BeHereMeow` is a placeholder (emoji + label text). No real
  artwork assets are committed.
- All `ExamplePage` panel content areas show placeholder labels.
- The depth pipeline mock produces a simple vertical gradient, which gives reasonable
  but not photorealistic layer separation.

### Not yet implemented (planned)

- `vite-plugin-scene-exporter.js` — Vite dev-server plugin for scene CRUD REST
  endpoints (`GET/POST /_dev/scenes`, etc.) — referenced in issue comments, not yet
  merged.
- Scene edit mode — an `editable` prop on `Scene` with group drag, save/reset controls
  — not yet implemented.
- Automated route registration via marker comments in `App.jsx`
  (`// @scene-imports`, `// @scene-pages`, `{/* @scene-routes */}`) — not yet
  implemented.
- Generated page templates (e.g. `Desk.jsx`) with editable + onSave wiring — not yet
  implemented.
- Export-to-scene flow in `DepthSegmentationDemo` — not yet implemented.

---

## Open issues

| # | Title | Description |
| --- | --- | --- |
| [#1](https://github.com/Luan-vP/comic-engine/issues/1) | Journal Integration | New feature module |
| [#2](https://github.com/Luan-vP/comic-engine/issues/2) | Biography Snapshots | New feature module |
| [#18](https://github.com/Luan-vP/comic-engine/issues/18) | WebVR/Cardboard stereoscopic view | Stereoscopic rendering mode |
| [#20](https://github.com/Luan-vP/comic-engine/issues/20) | Preserve true layer depth | Depth pipeline accuracy |
| [#21](https://github.com/Luan-vP/comic-engine/issues/21) | Multi-group SceneObject grouping | Scene system enhancement |
| [#23](https://github.com/Luan-vP/comic-engine/issues/23) | Fix App.test.jsx | Test infrastructure |
| [#24](https://github.com/Luan-vP/comic-engine/issues/24) | Object insertion toolbar | Scene editing UI |
| [#25](https://github.com/Luan-vP/comic-engine/issues/25) | Exporting layers should append to scene | Pipeline → scene export flow |
