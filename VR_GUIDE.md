# WebVR / Google Cardboard Guide

This guide explains how to use the stereoscopic VR mode for viewing parallax scenes immersively.

## Features

- **Stereoscopic Rendering**: Side-by-side view for VR headsets (Google Cardboard, etc.)
- **Device Orientation Tracking**: Head tracking via gyroscope/accelerometer replaces mouse-based parallax
- **Network Access**: Dev server binds to `0.0.0.0` for Tailscale/local network access
- **WebXR Compatible**: Uses modern WebXR API with graceful fallback

## Quick Start

### Desktop Testing

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `/vr-demo` in your browser
3. Move your mouse to see parallax depth effect

### Mobile VR (Google Cardboard)

#### Setup

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Start dev server** on your computer:
   ```bash
   npm run dev
   ```

   The server will bind to `0.0.0.0:5173` (accessible on your network).

3. **Find your Tailscale IP** (or local network IP):
   ```bash
   # Tailscale
   tailscale ip -4

   # Or local network
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

4. **Access from phone**:
   - Open browser on your phone
   - Navigate to: `http://[YOUR_IP]:5173/vr-demo`
   - Example: `http://100.64.1.5:5173/vr-demo`

#### Using VR Mode

1. **Click "View in VR" button** on the page
2. **Allow device orientation permissions** when prompted
3. **Enter fullscreen** (happens automatically)
4. **Put phone in VR headset** (Google Cardboard, etc.)
5. **Look around** - head tracking controls the parallax view

## Components

### VRWrapper

Drop-in replacement for `Scene` that adds VR support:

```jsx
import { VRWrapper } from '../components/vr';
import { SceneObject, Panel } from '../components/scene';

function MyVRPage() {
  return (
    <VRWrapper
      perspective={1000}
      parallaxIntensity={1.5}
      stereoSeparation={64}
    >
      <SceneObject position={[0, 0, -200]}>
        <Panel width={320} height={420}>
          Content here
        </Panel>
      </SceneObject>
    </VRWrapper>
  );
}
```

### Props

- `perspective` - CSS perspective value (default: 1000)
- `parallaxIntensity` - Multiplier for parallax effect (default: 1)
- `stereoSeparation` - Eye separation in pixels (default: 64, ~typical IPD)
- `showVRButton` - Show/hide VR toggle button (default: true)

### VRButton

Standalone button component:

```jsx
import { VRButton } from '../components/vr';

<VRButton
  onEnterVR={() => setVRMode(true)}
  onExitVR={() => setVRMode(false)}
  isVRActive={vrMode}
/>
```

## How It Works

### Stereoscopic Rendering

The scene is rendered twice with horizontal offset:
- **Left eye**: Offset +32px (half of stereoSeparation)
- **Right eye**: Offset -32px

This simulates interpupillary distance (IPD) for depth perception.

### Head Tracking

Device orientation events provide rotation data:
- **Alpha**: Compass direction (Z-axis rotation)
- **Beta**: Front-to-back tilt (X-axis rotation)
- **Gamma**: Left-to-right tilt (Y-axis rotation)

These are converted to normalized parallax values (-1 to 1) that replace mouse tracking.

### Depth Layers

The existing `SceneObject` system uses Z-position and `parallaxFactor`:
- `z = -500`: Far background (minimal movement)
- `z = 0`: Midground (moderate movement)
- `z = 300`: Foreground (maximum movement)

In VR mode, head rotation moves these layers proportionally for 3D depth effect.

## Network Access

### Tailscale Setup

1. Install Tailscale on both computer and phone
2. Connect both devices to same Tailscale network
3. Use Tailscale IP for access (typically `100.x.x.x`)

### Local Network (WiFi)

1. Ensure both devices on same WiFi network
2. Find computer's local IP (usually `192.168.x.x`)
3. Access from phone browser

### QR Code (Optional)

Generate QR code for easy URL sharing:

```bash
# Install qrencode
brew install qrencode  # macOS
apt-get install qrencode  # Linux

# Generate QR code
qrencode -t UTF8 "http://$(tailscale ip -4):5173/vr-demo"
```

Scan with phone camera to open URL directly.

## Browser Compatibility

- **Chrome/Edge (Mobile)**: Full WebXR + orientation support ✅
- **Safari (iOS)**: Requires permission prompt for DeviceOrientation ✅
- **Firefox (Mobile)**: Full support ✅
- **Desktop browsers**: Mouse parallax only (no VR mode) ⚠️

## Troubleshooting

### "Device orientation permission denied"

- **iOS 13+**: Requires explicit permission via button click
- Make sure to click "View in VR" button (triggers permission request)
- Check Settings → Safari → Motion & Orientation Access

### Stereoscopic view not aligned

- Adjust `stereoSeparation` prop (default 64px)
- Typical IPD: 62-68mm, scale to screen pixels
- Try values 50-80 for different headsets

### Performance issues

- Reduce `parallaxIntensity` for less movement
- Simplify scene (fewer `SceneObject` instances)
- Disable overlays on VR page (film grain, particles, etc.)

### Can't access from phone

- Check firewall settings (allow port 5173)
- Verify both devices on same network
- Try local IP if Tailscale doesn't work
- Use `http://` not `https://` (dev server is HTTP)

## Examples

See `/vr-demo` page for complete working example with:
- Multiple depth layers (-500 to 350 Z range)
- Rotated panels (simulating walls, floors)
- Floating elements with high parallax
- Informational UI overlay

## Future Enhancements

Potential improvements (not yet implemented):
- QR code generator for easy URL sharing
- WebXR `immersive-vr` session mode (currently using inline stereoscopic)
- Controller support for Google Daydream/Oculus Quest
- Eye distance calibration UI
- Performance optimization (render caching, LOD)

## References

- [WebXR Device API](https://immersive-web.github.io/webxr/)
- [Google Cardboard](https://arvr.google.com/cardboard/)
- [Device Orientation API](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events)
- [CSS 3D Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transforms/Using_CSS_transforms#3d_specific_css_properties)
