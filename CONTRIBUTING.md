# Contributing to Comic Engine

## Getting Started

```bash
git clone git@github.com:Luan-vP/comic-engine.git
cd comic-engine
npm install
npm run dev
```

## Development Workflow

1. Create a branch from `main`
2. Make your changes
3. Run checks: `npm run lint && npm test`
4. Submit a pull request using the PR template

## Code Style

- ESLint and Prettier enforce style automatically via pre-commit hooks
- Components use PascalCase (`SceneObject.jsx`)
- Utilities use camelCase (`themes.js`)
- Tests go in `src/__tests__/` with `.test.jsx` suffix

## Project Structure

See [README.md](README.md#project-structure) for the full directory layout.

## Adding Features

- **New theme**: Add to `src/theme/themes.js`
- **New overlay**: Create in `src/components/overlays/`, export from `index.jsx`
- **New page/scene**: Create in `src/pages/`, use `Scene`/`Panel`/`SceneObject`
