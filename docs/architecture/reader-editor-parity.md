# Reader / Editor Architecture Parity

Audit of how the comic **reader** and **editor** share core viewing code, where
they diverge, and open deployment questions. Tracks issue
[#89](https://github.com/luanvanpletsen/comic-engine/issues/89).

## Current Topology

Today the reader and the editor are a **single Vite SPA** served from **one
Docker image**.

- Entry: `src/App.jsx`
- Build: `Dockerfile` (multi-stage: `node:20-slim` builds, `nginx:alpine`
  serves `/usr/share/nginx/html` on port `8080`)
- Dev: `docker-compose.yml` runs the same frontend + a `backend` FastAPI
  service (see `backend/app.py`) that provides `/_dev/scenes/:slug` routes
  used by the editor.

Route-based branching inside `App.jsx` decides which layout to mount
(`src/App.jsx:453-458`):

```jsx
function AppContent() {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');
  return isReader ? <ReaderLayout /> : <EditorLayout />;
}
```

- `ReaderLayout` (`src/App.jsx:378-385`) — mounts only `ComicBookReader`
  at `/read/:comicBookSlug[/:slide]`. No dev controls, no page navigator,
  no `OverlayStack` (the reader owns its own overlays internally).
- `EditorLayout` (`src/App.jsx:390-449`) — mounts `ThemeSwitcher`,
  `OverlayControls`, `PageNavigator`, plus the auto-discovered pages
  and `DynamicScenePage` at `/scenes/:slug`.

**There is no build-time mode flag.** The editor bundle ships with the
reader and vice-versa; the route decides at runtime.

## Single Source of Truth for Scene Primitives

Both reader and editor import the same primitives from
`src/components/scene/`:

| Primitive     | File                                   | Used by reader                                   | Used by editor                                    |
| ------------- | -------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `Scene`       | `src/components/scene/Scene.jsx`       | `ComicBookReader.jsx:206-242`                    | `DynamicScenePage.jsx:256-291`                    |
| `SceneObject` | `src/components/scene/SceneObject.jsx` | `ComicBookReader.jsx:220-232` (layers)           | `DynamicScenePage.jsx:267-278` (layers)           |
| `Panel`       | `src/components/scene/Panel.jsx`       | via `cardTypes.jsx` render functions             | via `cardTypes.jsx` render functions              |
| `cardTypes`   | `src/components/scene/cardTypes.jsx`   | `ComicBookReader.jsx:251` (`CARD_TYPE_REGISTRY`) | `DynamicScenePage.jsx:321` (`CARD_TYPE_REGISTRY`) |

Confirmed: the primitives are the single source of truth. Both paths use
the same `CARD_TYPE_REGISTRY`, the same `Scene` 3D container, the same
`SceneObject` parallax/transform math, and the same `Panel` chrome.

## Renderer Divergence Table

Both pages wrap persisted objects in their own `SavedObjectRenderer`
function component. The editor additionally supports live, not-yet-saved
objects inserted via the toolbar through `Scene`'s internal
`InsertedObjectRenderer`.

| Concern                            | Reader (`ComicBookReader.jsx`)                                         | Editor (`DynamicScenePage.jsx`)                                               | Classification                                                                                                                                                                |
| ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted object renderer          | `SavedObjectRenderer` (lines 247-264), read-only                       | `SavedObjectRenderer` (lines 317-357), wired to select + drag + outline       | **Bug — #80**: two near-identical copies of `SavedObjectRenderer`. Extract one shared component that accepts optional edit props.                                             |
| Unsaved / freshly inserted objects | Not applicable (reader has no insert flow)                             | `InsertedObjectRenderer` inside `Scene.jsx:24-61`, fed by `InsertToolbar`     | **Intentional (editor-only)**. Reader never inserts objects; it reads `manifest.json` from GCS.                                                                               |
| Layer `<img>` source               | `getLayerUrl(comicBookSlug, sceneSlug, layerFile)` (GCS URL)           | `layer.url` baked into scene config by `useSceneLoader` / dev scene service   | **Intentional**. Reader reads published GCS assets; editor reads dev/local assets. Different data sources are expected.                                                       |
| `SceneObject interactive` flag     | `interactive={false}` on layers (`ComicBookReader.jsx:224`)            | `interactive={false}` on layers (`DynamicScenePage.jsx:271`)                  | Same — parity.                                                                                                                                                                |
| `Scene editable` flag              | Not passed (defaults `false`)                                          | `editable` passed (`DynamicScenePage.jsx:260`), unlocks edit checkbox         | **Intentional (editor-only)**. Gates Save button, group drag, `InsertToolbar`.                                                                                                |
| Scene drag                         | Not wired                                                              | `Scene`'s internal `onMouseDown`/`handleDragStart` (`Scene.jsx:161-196`)      | **Intentional (editor-only)**.                                                                                                                                                |
| Object selection + popover         | Not wired                                                              | `handleSelect` / `ObjectEditPopover` (`DynamicScenePage.jsx:96-142`, 293-303) | **Intentional (editor-only)**.                                                                                                                                                |
| Per-object drag                    | Not wired                                                              | `handleCardDragStart` (lines 149-198), perspective-compensated                | **Intentional (editor-only)**.                                                                                                                                                |
| Persistence                        | Read-only (`useComicBook` pulls GCS manifest)                          | `useSceneLoader` + `handleSave` → `PATCH /_dev/scenes/:slug`                  | **Intentional (editor-only, dev-only endpoint)**.                                                                                                                             |
| Theme base                         | `sceneConfig.theme.base` via `useThemeTriggers`                        | First entry of `sceneConfig.themeKeyframes`                                   | **Bug — #90**: different config shapes. Reader uses `theme.triggers`; editor uses `themeKeyframes`. Should unify, and reader should also honour scroll-based theme switching. |
| Scroll-based theme switching       | Handled by `useThemeTriggers` based on `triggers` array                | Direct `useEffect` scanning `themeKeyframes` against `scrollZ` (lines 80-93)  | **Bug — #90**: divergent code paths for the same feature. Consolidate both paths on one hook.                                                                                 |
| `OverlayStack`                     | Owned internally by `ComicBookReader.jsx:195-205`                      | Owned by `EditorLayout` in `App.jsx:414-425`                                  | **Intentional split** — reader overlays are driven by scene data, editor overlays are driven by dev controls. Keep, but document.                                             |
| Z-scroll                           | `useZScroll` with `snapEnabled: false` (`ComicBookReader.jsx:114-118`) | `useZScroll` (default snap) (`DynamicScenePage.jsx:60-63`)                    | **Intentional**. Reader is a linear slide experience; editor snaps between layers while composing.                                                                            |
| Navigation (keyboard / touch)      | `ArrowRight/Left/Up/Down` + swipe (`ComicBookReader.jsx:44-82`)        | None                                                                          | **Intentional (reader-only)**.                                                                                                                                                |
| `ScrollMinimap`                    | Not rendered                                                           | Rendered at `DynamicScenePage.jsx:305-309`                                    | **Intentional (editor-only)** — authoring aid.                                                                                                                                |

## Known bugs cross-referenced

- **[#80](https://github.com/luanvanpletsen/comic-engine/issues/80)** —
  duplicate `SavedObjectRenderer`. This audit confirms the two copies in
  `src/pages/ComicBookReader.jsx:247-264` and
  `src/pages/DynamicScenePage.jsx:317-357` are the same render with
  different props. Fix by extracting to `src/components/scene/`.
- **[#90](https://github.com/luanvanpletsen/comic-engine/issues/90)** —
  reader does not respect scene theme triggers. The reader reads
  `sceneConfig.theme.triggers`, the editor reads
  `sceneConfig.themeKeyframes`. Unify shape and hook.

## Open Questions for Deployment Topology

Issue #89 raises the question: are the reader and the editor meant to be
**two separate Cloud Run services**, or **one image with route-based
branching**? The repo as-is does not answer this; please pick one.

### Option A — Single artifact, single Cloud Run service

Deploy one image and keep `AppContent`'s runtime branching.

Pros:

- Zero new build infrastructure. What ships today already works.
- The reader and editor are guaranteed to stay in lockstep; a change to
  `Scene`/`SceneObject` ships to both simultaneously.
- Simpler CI/CD (one Dockerfile, one push).

Cons:

- The **public reader bundle ships editor code**:
  `DynamicScenePage`, `InsertToolbar`, `ObjectEditPopover`,
  `useSceneLoader`, the dev `_dev/scenes` fetch code, etc. This is
  dead-code on `/read/*` but still increases TTFB and bundle size.
- `/_dev/scenes/:slug` is reachable from the reader origin unless
  nginx is configured to block it — one misconfiguration away from an
  unauthenticated write path. Today `docker-compose.yml` proxies it
  through `VITE_API_TARGET=http://backend:8000`; production posture
  must be confirmed.
- Public users can manually navigate to `/scenes/:slug` on the reader
  origin and hit a partially-functional editor UI.

### Option B — Two Cloud Run services from the same repo

Build **two Vite bundles** — `reader` and `editor` — and deploy each to
its own Cloud Run service (e.g. `reader.comic-engine.app` vs.
`editor.comic-engine.app`). Share `src/components/scene/`, `src/theme/`,
`src/components/overlays/`, and the reader-safe hooks.

Pros:

- Public reader bundle excludes `DynamicScenePage`, `InsertToolbar`,
  `ObjectEditPopover`, `useSceneLoader`, and any `/_dev/*` code paths.
  Smaller bundle, tighter security boundary.
- Cloud Run services can have different scaling profiles, different
  IAM (editor behind IAP, reader public), different domains.
- Dockerfile per service keeps the nginx config for each honest — the
  reader image never needs to proxy `_dev/*`.

Cons:

- Two CI pipelines (or one pipeline that builds twice).
- Shared components must stay genuinely shared; any reader-editor
  coupling must be kept in `src/components/scene/` or similar.
- Need a build-time gate so a reader import of `DynamicScenePage`
  fails loudly instead of silently bundling it.

### Proposed gate if Option B is chosen: `VITE_APP_MODE`

Introduce an env var read at build time:

```js
// vite.config.js
const mode = process.env.VITE_APP_MODE || 'editor';

export default defineConfig({
  define: {
    __APP_MODE__: JSON.stringify(mode),
  },
});
```

Then in `App.jsx`:

```jsx
const isReader = __APP_MODE__ === 'reader';

// Conditionally import only in editor mode so tree-shaking drops
// DynamicScenePage and friends from the reader bundle.
```

Concretely:

- `VITE_APP_MODE=reader npm run build` → bundle contains
  `ComicBookReader`, `Scene`, `SceneObject`, `Panel`, `cardTypes`,
  `OverlayStack`, `useComicBook`, `useZScroll`, `useThemeTriggers`,
  `ThemeProvider`. **Excludes** `DynamicScenePage`, `NewScenePage`,
  `InsertToolbar`, `ObjectEditPopover`, `useSceneLoader`, `usePages`,
  `ScrollMinimap`, `PageNavigator`, `ThemeSwitcher`, `OverlayControls`.
- `VITE_APP_MODE=editor npm run build` → bundle contains everything
  (editor mode can still mount `ComicBookReader` internally if
  preview-of-published is desired).
- Dockerfile takes `ARG APP_MODE` and passes it into `npm run build`.
- Two CI targets: `gcloud run deploy reader --image ...:reader` and
  `gcloud run deploy editor --image ...:editor`.

### Decision needed

This audit does **not** pick a topology. It surfaces the trade-off so
the team can decide and then a follow-up PR can implement the gate (if
Option B is chosen) or document Option A as intentional.

## Acceptance Checklist for Issue #89

- [x] Document the intended deployment topology in `docs/` — this file
      documents the **current** topology (one artifact) and surfaces the
      **intended** topology as an open question above. Once the team
      chooses, update this section.
- [x] Confirm scene-viewing primitives are the single source of truth —
      see **Single Source of Truth** above.
- [x] List every divergence between reader and editor, each classified
      as intentional or bug — see **Renderer Divergence Table** above,
      with cross-references to #80 and #90.
- [ ] If we ship two Cloud Run services, add build-mode gating — **deferred**
      pending topology decision; implementation sketch in **Option B** above.
