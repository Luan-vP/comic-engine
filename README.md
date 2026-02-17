# Comic Engine

A React-based visual engine for creating cinematic comic-style experiences with themes, overlays, and scene composition.

## Features

- **Theme system** — Noir, Cyberpunk, Dreamscape, Pulp, and Minimal presets with full customization
- **Visual overlays** — Film grain, vignette, scanlines, ASCII shader, and particle effects (dust, snow, bokeh, embers, rain)
- **Scene composition** — Panel-based layout with configurable scene objects
- **Depth segmentation** — Convert photos into depth-based layers with parallax effects
- **Scene persistence** — Save and load processed scenes as portable JSON files ([docs](docs/scenes.md))

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview  # preview production build
```

## Test

```bash
npm test           # run tests once
npm run test:watch # run tests in watch mode
```

## Lint & Format

```bash
npm run lint          # check for lint issues
npm run format        # auto-format code
npm run format:check  # check formatting without changing files
```

## Project Structure

```
src/
├── App.jsx                    # Root component with theme/overlay controls
├── main.jsx                   # Entry point
├── components/
│   ├── overlays/              # Visual effect overlays
│   │   ├── AsciiShader.jsx
│   │   ├── FilmGrain.jsx
│   │   ├── Particles.jsx
│   │   ├── Scanlines.jsx
│   │   └── Vignette.jsx
│   ├── scene/                 # Scene composition
│   │   ├── Panel.jsx
│   │   ├── Scene.jsx
│   │   └── SceneObject.jsx
│   ├── DepthSegmentationDemo.jsx  # Photo-to-layers pipeline demo
│   └── SceneViewer.jsx        # Saved scene viewer
├── pages/                     # Page-level scene compositions
│   ├── BeHereMeow.jsx
│   ├── ExamplePage.jsx
│   ├── DepthSegmentationPage.jsx
│   └── SceneViewerPage.jsx
├── theme/                     # Theme definitions and context
│   ├── ThemeContext.jsx
│   └── themes.js
└── utils/                     # Utilities
    ├── depth/                 # Depth segmentation pipeline
    └── sceneExport.js         # Scene save/load utilities
```
