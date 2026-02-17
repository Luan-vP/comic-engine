# Depth Segmentation Pipeline

Converts photographs into depth-based layered scene objects for parallax effects.

## Quick Start

```javascript
import { processPhotoToLayers } from './utils/depth';

// Process an image
const result = await processPhotoToLayers(imageUrl, {
  granularity: 0.3,  // 0.0 = fine (many layers), 1.0 = coarse (few layers)
  onProgress: (step, progress) => console.log(step, progress)
});

// Use layers in Scene
result.layers.forEach(layer => {
  console.log(layer.name, layer.zPosition, layer.imageUrl);
});
```

## Pipeline Stages

### 1. Depth Estimation

Generates a depth map from the input image.

```javascript
import { estimateDepth, visualizeDepthMap } from './utils/depth';

const depthMap = await estimateDepth(image);
const visualization = visualizeDepthMap(depthMap); // Data URL
```

**Current implementation**: Mock gradient-based (vertical position = depth)

**Production**: Replace with:
- **Depth Anything v2** (recommended, state-of-art)
- **MiDaS v3.1** (robust, well-tested)
- **ZoeDepth** (indoor scenes)

### 2. Quantization

Converts continuous depth to discrete layers.

```javascript
import { quantizeDepth } from './utils/depth';

const quantized = quantizeDepth(depthMap, 0.3); // granularity 0.3
console.log(quantized.layers); // Array of layer metadata
```

**How it works**:
- Builds histogram of depth values
- Finds peaks (natural depth clusters)
- Assigns pixels to nearest peak
- Granularity controls minimum separation between peaks

### 3. Segmentation

Extracts layer images with alpha masks.

```javascript
import { segmentLayers } from './utils/depth';

const layers = await segmentLayers(sourceImage, quantizedMap);
layers.forEach(layer => {
  console.log(layer.imageData); // PNG data URL with alpha
  console.log(layer.bounds);    // Bounding box
});
```

**Features**:
- Connected component analysis
- Alpha mask generation
- Bounding box calculation
- Noise filtering

### 4. Export

Formats layers for Scene components.

```javascript
const result = await processPhotoToLayers(image, { granularity: 0.3 });

result.layers.forEach(layer => {
  // Ready to use with SceneObject
  const { position, parallaxFactor } = layer.sceneObjectProps;
});
```

## Granularity Guide

| Value | Effect | Use Case |
|-------|--------|----------|
| 0.05-0.2 | Fine-grained (8-12 layers) | Detailed depth, many objects |
| 0.3-0.5 | Medium (3-5 layers) | Balanced, typical scenes |
| 0.6-0.9 | Coarse (1-3 layers) | Simplified, minimal layers |

## Integration with Scene

The pipeline outputs layers in Scene-ready format:

```javascript
import { Scene, SceneObject } from '../components/scene';

const result = await processPhotoToLayers(photo, { granularity: 0.3 });

<Scene>
  {result.layers.map(layer => (
    <SceneObject
      key={layer.id}
      position={layer.sceneObjectProps.position}
      parallaxFactor={layer.sceneObjectProps.parallaxFactor}
    >
      <img src={layer.imageUrl} alt={layer.name} />
    </SceneObject>
  ))}
</Scene>
```

## Depth Model Integration

### Client-Side (ONNX Runtime)

```javascript
// Example with ONNX Runtime Web
import * as ort from 'onnxruntime-web';

async function runDepthModel(imageData) {
  const session = await ort.InferenceSession.create('depth-anything-v2.onnx');
  const tensor = preprocessImage(imageData);
  const { output } = await session.run({ input: tensor });
  return postprocessDepth(output);
}
```

**Pros**: Offline, fast, private
**Cons**: Large model file (~100MB), requires WebGPU for speed

### Server-Side (Hugging Face API)

```javascript
async function runDepthModel(imageUrl) {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/depth-anything/Depth-Anything-V2-Large',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${HF_TOKEN}` },
      body: await fetch(imageUrl).then(r => r.blob()),
    }
  );
  return await response.json();
}
```

**Pros**: No local compute, always up-to-date models
**Cons**: Requires API key, network latency, cost

## File Format Support

**Input**: JPEG, PNG
**Output**: PNG with alpha channel (data URLs)

## Performance

**Mock implementation**: ~100ms for 1MP image
**Real depth model**:
- Client (GPU): 200-500ms
- Server (API): 1-3s (network + compute)

## Limitations

- Mock depth estimation (needs real model for production)
- No inpainting (occluded areas stay transparent)
- Single output format (could add sprite sheets)
- 4-connectivity for components (could use 8-connectivity)

## Future Enhancements

- [ ] Real depth model integration
- [ ] Inpainting for occluded regions
- [ ] Sprite sheet export
- [ ] WebGPU acceleration
- [ ] Background/foreground separation hints
- [ ] Manual layer editing UI
- [ ] Layer merge/split tools
