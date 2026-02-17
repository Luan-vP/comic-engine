# Scene Persistence

This document describes how to save, load, and manage depth-segmented scenes in Comic Engine.

## Overview

The scene persistence system allows you to:
- Save processed depth-segmented scenes for later viewing
- Share scenes as portable JSON files
- Load and view previously saved scenes
- Optionally commit scenes to the repository for static hosting

## Usage

### Saving a Scene

1. Navigate to `/depth-segmentation`
2. Upload an image
3. Adjust granularity and blur fill settings
4. Click "Process Image"
5. Once processing completes, click "Save Scene"
6. A `.scene.json` file will be downloaded to your browser's download folder

### Loading a Saved Scene

1. Navigate to `/scene-viewer`
2. Click "Load Scene"
3. Select a previously saved `.scene.json` file
4. The scene will render with full parallax effects

## Scene File Format

Scene files are JSON bundles containing:

```json
{
  "slug": "my-photo",
  "metadata": {
    "version": "1.0",
    "createdAt": "2026-02-17T19:00:00.000Z",
    "settings": {
      "granularity": 0.3,
      "blurFill": 20,
      "depthModel": "depth-anything-v2",
      "minObjectSize": 100
    },
    "layers": [
      {
        "id": "layer-0",
        "name": "Layer 0 (z: -400)",
        "depth": 0.1,
        "zPosition": -400,
        "parallaxFactor": 0.19,
        "position": [0, 0, -400],
        "filename": "layer-0.png"
      }
    ]
  },
  "files": {
    "scene.json": "...",
    "source.jpg": "data:image/jpeg;base64,...",
    "depth.png": "data:image/png;base64,...",
    "layer-0.png": "data:image/png;base64,...",
    "layer-1.png": "data:image/png;base64,..."
  }
}
```

## Static Hosting (Optional)

To include scenes in your production build:

1. Save a scene from the depth segmentation page
2. Place the `.scene.json` file in `public/scenes/`
3. The file will be available at `/scenes/your-scene.scene.json` in production

Note: The `public/scenes/` directory is gitignored by default. Commit individual scene files as needed.

## Implementation Details

### Scene Export (`src/utils/sceneExport.js`)

- `exportSceneAsZip(result, sourceImage, settings, filename)` - Export a scene as a downloadable JSON file
- `loadSceneFromFile(file)` - Load a scene bundle from a file
- `parseSceneBundle(bundle)` - Parse a scene bundle into pipeline result format

### Components

- `DepthSegmentationDemo` - Includes "Save Scene" button
- `SceneViewer` - Standalone viewer for loading saved scenes
- `SceneViewerPage` - Route wrapper for the viewer

### Routes

- `/depth-segmentation` - Process images and save scenes
- `/scene-viewer` - Load and view saved scenes

## Future Enhancements

Potential improvements for this system:

1. **Scene Gallery** - Index page at `/scenes` listing all available scenes
2. **Backend API** - `POST /api/scenes` endpoint for server-side storage
3. **ZIP Export** - Use JSZip to create proper zip archives instead of JSON bundles
4. **Vite Plugin** - Auto-discover scenes in `public/scenes/` and generate routes at build time
5. **Thumbnails** - Generate and store preview images for scene gallery
6. **Metadata** - Add tags, descriptions, and other metadata to scenes
7. **Sharing** - Generate shareable URLs for scenes

## Related Files

- `src/utils/sceneExport.js` - Export/import utilities
- `src/components/DepthSegmentationDemo.jsx` - Scene creation and export
- `src/components/SceneViewer.jsx` - Scene loading and viewing
- `src/pages/SceneViewerPage.jsx` - Viewer page
- `public/scenes/` - Static scene storage (optional)
