# Comic Engine — Agent Guide

## Commands

- `npm run dev` — Start Vite dev server (port 5173)
- `npm run build` — Production build to `dist/`
- `npm test` — Run tests with Vitest
- `npm run lint` — Lint with ESLint
- `npm run format` — Format with Prettier

## Architecture

React + Vite application. No TypeScript — uses JSX throughout.

### Key abstractions

- **Themes** (`src/theme/`) — `ThemeContext.jsx` provides theme via React context. `themes.js` defines color palettes, typography, and effect intensities per theme.
- **Overlays** (`src/components/overlays/`) — Post-processing visual effects (film grain, vignette, scanlines, ASCII shader, particles). Composed via `OverlayStack` from `index.jsx`.
- **Scenes** (`src/components/scene/`) — Panel-based layout system. `Scene` contains `Panel`s which contain `SceneObject`s.
- **Pages** (`src/pages/`) — Complete scene compositions that combine panels, objects, and overlays.

### Naming conventions

- Components: PascalCase (`SceneObject.jsx`)
- Utilities/configs: camelCase (`themes.js`)
- Test files: `__tests__/*.test.jsx`

### Adding a new theme

Add an entry to the `themes` object in `src/theme/themes.js` following the existing structure (colors, typography, effects).

### Adding a new overlay

1. Create component in `src/components/overlays/`
2. Export from `src/components/overlays/index.jsx` in the `OverlayStack`
