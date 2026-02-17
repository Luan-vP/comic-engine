---
name: scene-composition
description: Create and edit comic engine scenes with panels, objects, overlays, and themes.
---

# Scene Composition

## Creating a new page

1. Create a file in `src/pages/YourPage.jsx`
2. Import scene primitives:
   ```jsx
   import { Scene, SceneObject, Panel } from '../components/scene';
   import { useTheme } from '../theme/ThemeContext';
   ```
3. Compose a scene with panels and objects at various z-depths for parallax

## Z-depth conventions

- `-400` to `-200`: Far background (mountains, sky, clouds)
- `-200` to `0`: Mid-ground (buildings, trees)
- `0` to `200`: Foreground (characters, objects)
- `200`+: Extreme foreground (UI elements, particles)

## Adding overlays

Overlays are configured in `App.jsx` via `OverlayStack`. Available overlays:

- `filmGrain` (boolean)
- `vignette` (boolean)
- `scanlines` (boolean)
- `ascii` (boolean)
- `particles` ('dust' | 'snow' | 'bokeh' | 'embers' | 'rain' | null)

## Switching themes

Call `setTheme(themeName)` from `useTheme()`. Available: noir, cyberpunk, dreamscape, pulp, minimal.
