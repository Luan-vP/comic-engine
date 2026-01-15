# Comic Engine - Scene Positioning Guide

## Coordinate System

```
                    -Y (up)
                      │
                      │
                      │
  -X (left) ──────────┼──────────► +X (right)
                      │
                      │
                      │
                    +Y (down)

  -Z (away/background) ◄────────────────► +Z (toward camera/foreground)
```

## Position Array: `[x, y, z]`

- **x**: Horizontal position in pixels from center
  - Negative = left
  - Positive = right
  
- **y**: Vertical position in pixels from center
  - Negative = up
  - Positive = down
  
- **z**: Depth position (most important for parallax)
  - Negative = further from camera (background)
  - Zero = mid-ground
  - Positive = closer to camera (foreground)

## Rotation Array: `[rx, ry, rz]` (in degrees)

### rx: Rotation around X-axis (horizontal axis)
```
Top tilts away (positive rx):     Top tilts toward (negative rx):
    ┌─────────┐                       ┌─────────┐
   ╱           ╲                       │         │
  ╱             ╲                      │         │
  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾                     ╲         ╱
                                        ╲       ╱
```
- `rx = 15`: Panel tilts back, like looking at a book on a table
- `rx = -15`: Panel tilts forward, like a sign above you
- `rx = 70-90`: Becomes a floor

### ry: Rotation around Y-axis (vertical axis)
```
Positive ry:              Negative ry:
Right side toward you     Left side toward you
      │╱                      ╲│
      │                        │
      │╲                      ╱│
```
- `ry = 30`: Like a door opening to the left
- `ry = -30`: Like a door opening to the right
- `ry = 90`: Perpendicular wall on right
- `ry = -90`: Perpendicular wall on left

### rz: Rotation around Z-axis (depth axis)
```
Positive rz (clockwise):    Negative rz (counter-clockwise):
    ╱‾‾‾‾╲                      ╱‾‾‾‾╲
   ╱      ╲                    ╱      ╲
   ╲      ╱                    ╲      ╱
    ╲____╱                      ╲____╱
```
- Dutch angle / tilted composition
- `rz = 10`: Slight tilt right
- `rz = -15`: Slight tilt left

## Parallax Factor

The `parallaxFactor` controls how much an object moves in response to mouse movement:

| Factor | Effect | Use Case |
|--------|--------|----------|
| 0 | No movement | Fixed background elements |
| 0.1-0.3 | Subtle movement | Distant background |
| 0.4-0.6 | Medium movement | Mid-ground content |
| 0.7-0.9 | Strong movement | Foreground elements |
| 1.0+ | Exaggerated | Extreme foreground |

**Auto-calculation**: If you don't set `parallaxFactor`, it's calculated from Z position automatically.

## Common Placement Recipes

### Background Panel (tilted back)
```jsx
<SceneObject
  position={[-150, 0, -200]}
  rotation={[15, -5, 0]}
  parallaxFactor={0.25}
>
```

### Main Center Panel (facing camera)
```jsx
<SceneObject
  position={[0, 0, 0]}
  rotation={[0, 0, 0]}
  parallaxFactor={0.6}
>
```

### Side Wall (like gallery)
```jsx
<SceneObject
  position={[300, 0, 0]}
  rotation={[0, -45, 0]}
  parallaxFactor={0.5}
>
```

### Floor Element
```jsx
<SceneObject
  position={[0, 250, -100]}
  rotation={[70, 0, 0]}
  parallaxFactor={0.3}
>
```

### Floating Foreground (video/iframe)
```jsx
<SceneObject
  position={[-200, 100, 200]}
  rotation={[5, 10, -3]}
  parallaxFactor={0.9}
>
```

### Hero Shot (dramatic low angle)
```jsx
<SceneObject
  position={[0, 50, 50]}
  rotation={[-20, 0, 5]}
  parallaxFactor={0.7}
>
```

## Tips

1. **Depth creates parallax**: Objects at different Z positions naturally create parallax as perspective changes with mouse movement.

2. **Rotation adds drama**: Even small rotations (5-15°) make panels feel more dynamic than flat, forward-facing ones.

3. **Combine rotations**: Mix rx, ry, and rz for complex angles. Example: `[10, -15, 5]` creates a panel that's tilted back, turned slightly, and has a dutch angle.

4. **Layer your panels**: Place multiple SceneObjects at increasing Z values to create a layered comic spread.

5. **Use presets**: Import `ObjectPresets` for common configurations:
   ```jsx
   import { ObjectPresets } from './components/scene';
   
   <SceneObject {...ObjectPresets.background}>
   ```
