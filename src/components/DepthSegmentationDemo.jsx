import React, { useState, useRef } from 'react';
import { Scene, SceneObject } from './scene';
import { processPhotoToLayers } from '../utils/depth';
import { useTheme } from '../theme/ThemeContext';

/**
 * DepthSegmentationDemo - Interactive demo of the photo-to-layers pipeline
 *
 * This component demonstrates:
 * 1. Loading a photograph
 * 2. Adjusting granularity with a slider
 * 3. Processing the image into depth-segmented layers
 * 4. Rendering the layers in a 3D Scene with parallax
 */
export function DepthSegmentationDemo() {
  const { theme } = useTheme();
  const [granularity, setGranularity] = useState(0.3);
  const [blurFill, setBlurFill] = useState(20);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ step: '', value: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [sourceImage, setSourceImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG or PNG)');
      return;
    }

    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceImage(e.target.result);
      setResult(null);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to load image');
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    if (!sourceImage) return;

    setProcessing(true);
    setError(null);
    setProgress({ step: 'Starting...', value: 0 });

    try {
      const pipelineResult = await processPhotoToLayers(sourceImage, {
        granularity,
        blurFill,
        depthModel: 'depth-anything-v2',
        minObjectSize: 100,
        onProgress: (step, value) => {
          const stepNames = {
            'depth-estimation': 'Estimating depth',
            'quantization': 'Quantizing layers',
            'segmentation': 'Segmenting objects',
            'export': 'Preparing export',
            'complete': 'Complete',
          };
          setProgress({
            step: stepNames[step] || step,
            value: Math.round(value * 100),
          });
        },
      });

      setResult(pipelineResult);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err.message || 'Failed to process image');
    } finally {
      setProcessing(false);
    }
  };

  const renderControls = () => (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '20px',
        zIndex: 1000,
        maxWidth: '500px',
        fontFamily: theme.typography.fontBody,
      }}
    >
      <h2
        style={{
          color: theme.colors.primary,
          margin: '0 0 16px 0',
          fontSize: '18px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        Depth Segmentation Pipeline
      </h2>

      {/* File upload */}
      <div style={{ marginBottom: '16px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleImageUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: theme.colors.primary,
            color: '#000',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            fontFamily: theme.typography.fontBody,
          }}
        >
          {sourceImage ? 'Change Image' : 'Upload Image'}
        </button>
        {sourceImage && (
          <span
            style={{
              color: theme.colors.textMuted,
              fontSize: '12px',
              marginLeft: '12px',
            }}
          >
            Image loaded
          </span>
        )}
      </div>

      {/* Granularity slider */}
      {sourceImage && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <label
              style={{
                color: theme.colors.text,
                fontSize: '13px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Granularity: {granularity.toFixed(2)}
              <span style={{ color: theme.colors.textMuted, marginLeft: '8px' }}>
                ({granularity < 0.2 ? 'Fine' : granularity < 0.5 ? 'Medium' : 'Coarse'})
              </span>
            </label>
            <input
              type="range"
              min="0.05"
              max="0.9"
              step="0.05"
              value={granularity}
              onChange={(e) => setGranularity(parseFloat(e.target.value))}
              disabled={processing}
              style={{ width: '100%' }}
            />
            <div
              style={{
                fontSize: '11px',
                color: theme.colors.textMuted,
                marginTop: '4px',
              }}
            >
              Lower = more layers (fine detail) · Higher = fewer layers (simplified)
            </div>
          </div>

          {/* Blur fill slider */}
          <div style={{ marginBottom: '8px' }}>
            <label
              style={{
                color: theme.colors.text,
                fontSize: '13px',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Blur Fill: {blurFill}px
              <span style={{ color: theme.colors.textMuted, marginLeft: '8px' }}>
                ({blurFill === 0 ? 'Off' : blurFill < 15 ? 'Subtle' : 'Strong'})
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={blurFill}
              onChange={(e) => setBlurFill(parseInt(e.target.value, 10))}
              disabled={processing}
              style={{ width: '100%' }}
            />
            <div
              style={{
                fontSize: '11px',
                color: theme.colors.textMuted,
                marginTop: '4px',
              }}
            >
              Fills cut-out areas with blurred source to hide gaps during parallax
            </div>
          </div>

          {/* Process button */}
          <button
            onClick={handleProcess}
            disabled={processing}
            style={{
              background: processing ? '#555' : theme.colors.secondary,
              color: processing ? '#999' : '#000',
              border: 'none',
              borderRadius: '4px',
              padding: '12px 24px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              fontFamily: theme.typography.fontBody,
              width: '100%',
              marginTop: '12px',
            }}
          >
            {processing ? `${progress.step} (${progress.value}%)` : 'Process Image'}
          </button>
        </>
      )}

      {/* Results info */}
      {result && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(0,255,0,0.1)',
            border: `1px solid ${theme.colors.primary}50`,
            borderRadius: '4px',
            fontSize: '12px',
            color: theme.colors.text,
          }}
        >
          <strong>Processing complete!</strong>
          <br />
          Generated {result.layers.length} layer{result.layers.length !== 1 ? 's' : ''}
          <br />
          <span style={{ color: theme.colors.textMuted, fontSize: '11px' }}>
            Move your mouse to see parallax effect
          </span>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255,0,0,0.1)',
            border: '1px solid rgba(255,0,0,0.5)',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#ff6b6b',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );

  const renderScene = () => {
    if (!result) {
      return (
        <div
          style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: theme.colors.backgroundGradient,
            color: theme.colors.textMuted,
            fontSize: '14px',
            fontFamily: theme.typography.fontBody,
          }}
        >
          {sourceImage ? 'Adjust settings and click Process Image' : 'Upload an image to begin'}
        </div>
      );
    }

    return (
      <Scene
        perspective={1000}
        parallaxIntensity={1.2}
        mouseInfluence={{ x: 60, y: 40 }}
      >
        {result.layers.map((layer, index) => {
          const [x, y, z] = layer.sceneObjectProps.position;
          return (
            <SceneObject
              key={layer.id}
              position={[x - 150, y - 100, z]}
              parallaxFactor={layer.sceneObjectProps.parallaxFactor}
              interactive={false}
            >
              <img
                src={layer.imageUrl}
                alt={layer.name}
                style={{
                  display: 'block',
                  maxWidth: '80vw',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  filter: `brightness(${0.8 + layer.depth * 0.4})`,
                  pointerEvents: 'none',
                }}
              />
            </SceneObject>
          );
        })}

        {/* Depth visualization overlay (optional) */}
        {result.depthVisualization && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.85)',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '8px',
              padding: '12px',
              zIndex: 1000,
            }}
          >
            <div
              style={{
                color: theme.colors.textMuted,
                fontSize: '11px',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Depth Map
            </div>
            <img
              src={result.depthVisualization}
              alt="Depth visualization"
              style={{
                display: 'block',
                width: '150px',
                height: 'auto',
                borderRadius: '4px',
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          </div>
        )}
      </Scene>
    );
  };

  return (
    <>
      {renderControls()}
      {renderScene()}
    </>
  );
}

export default DepthSegmentationDemo;
