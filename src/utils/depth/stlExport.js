/**
 * STL Export — convert a depth map into a watertight 3D solid (binary STL).
 *
 * Builds a closed mesh with:
 *  - Top surface: heightmap from depth values
 *  - Bottom plate: flat quad at z = 0
 *  - Side walls: connecting top edges to bottom edges
 *
 * Values outside [capMin, capMax] are clamped.
 */

/**
 * Generate a binary STL ArrayBuffer from a DepthMap.
 *
 * @param {DepthMap} depthMap            — { width, height, data: Float32Array }
 * @param {Object}   [opts]
 * @param {number}   [opts.capMin=0]     — depth values below this are clamped
 * @param {number}   [opts.capMax=1]     — depth values above this are clamped
 * @param {number}   [opts.zScale=50]    — multiplier for the Z (height) axis
 * @param {number}   [opts.baseHeight=2] — thickness of the solid base below the lowest point
 * @param {number}   [opts.xyScale=1]    — multiplier for the X/Y plane
 * @param {number}   [opts.maxDim=512]   — down-sample longer axis to this many vertices
 * @returns {ArrayBuffer} Binary STL data
 */
export function depthMapToSTL(depthMap, opts = {}) {
  const {
    capMin = 0,
    capMax = 1,
    zScale = 50,
    baseHeight = 2,
    xyScale = 1,
    maxDim = 512,
  } = opts;

  // --- down-sample if needed ------------------------------------------------
  let { width, height, data } = depthMap;
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height);
    const nw = Math.max(2, Math.round(width * scale));
    const nh = Math.max(2, Math.round(height * scale));
    data = downsample(data, width, height, nw, nh);
    width = nw;
    height = nh;
  }

  // --- clamp + build vertex heights -----------------------------------------
  const heights = new Float32Array(width * height);
  for (let i = 0; i < data.length; i++) {
    heights[i] = Math.min(capMax, Math.max(capMin, data[i])) * zScale + baseHeight;
  }

  const cols = width - 1;
  const rows = height - 1;

  // --- count triangles ------------------------------------------------------
  const topTris = cols * rows * 2;
  const bottomTris = cols * rows * 2;
  // Side walls: 4 edges. Top/bottom edges have `cols` segments, left/right have `rows` segments.
  // Each segment = 2 triangles (quad).
  const sideTris = (cols + cols + rows + rows) * 2;
  const triCount = topTris + bottomTris + sideTris;

  // Binary STL: 80-byte header + 4-byte tri count + 50 bytes per triangle
  const bufLen = 80 + 4 + triCount * 50;
  const buf = new ArrayBuffer(bufLen);
  const view = new DataView(buf);

  // Header — write "solid" hint for viewers that peek at the header
  const header = 'binary STL from comic-engine depth pipeline';
  for (let i = 0; i < header.length && i < 80; i++) {
    view.setUint8(i, header.charCodeAt(i));
  }

  view.setUint32(80, triCount, true);

  let offset = 84;

  // --- helpers --------------------------------------------------------------
  const writeTri = (v0, v1, v2) => {
    // Compute face normal via cross product
    const ux = v1[0] - v0[0],
      uy = v1[1] - v0[1],
      uz = v1[2] - v0[2];
    const wx = v2[0] - v0[0],
      wy = v2[1] - v0[1],
      wz = v2[2] - v0[2];

    let nx = uy * wz - uz * wy;
    let ny = uz * wx - ux * wz;
    let nz = ux * wy - uy * wx;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;

    // Normal
    view.setFloat32(offset, nx, true);
    view.setFloat32(offset + 4, ny, true);
    view.setFloat32(offset + 8, nz, true);
    offset += 12;

    // 3 vertices
    for (const v of [v0, v1, v2]) {
      view.setFloat32(offset, v[0], true);
      view.setFloat32(offset + 4, v[1], true);
      view.setFloat32(offset + 8, v[2], true);
      offset += 12;
    }

    // Attribute byte count
    view.setUint16(offset, 0, true);
    offset += 2;
  };

  const vx = (x) => x * xyScale;
  const vy = (y) => (height - 1 - y) * xyScale; // flip Y

  // --- top surface (normals point up) ---------------------------------------
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const z00 = heights[y * width + x];
      const z10 = heights[y * width + (x + 1)];
      const z01 = heights[(y + 1) * width + x];
      const z11 = heights[(y + 1) * width + (x + 1)];

      // CCW winding when viewed from above (positive Z)
      writeTri(
        [vx(x), vy(y), z00],
        [vx(x), vy(y + 1), z01],
        [vx(x + 1), vy(y), z10],
      );
      writeTri(
        [vx(x + 1), vy(y), z10],
        [vx(x), vy(y + 1), z01],
        [vx(x + 1), vy(y + 1), z11],
      );
    }
  }

  // --- bottom plate (normals point down, at z = 0) --------------------------
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      // CW winding when viewed from above → normals point down
      writeTri(
        [vx(x), vy(y), 0],
        [vx(x + 1), vy(y), 0],
        [vx(x), vy(y + 1), 0],
      );
      writeTri(
        [vx(x + 1), vy(y), 0],
        [vx(x + 1), vy(y + 1), 0],
        [vx(x), vy(y + 1), 0],
      );
    }
  }

  // --- side walls -----------------------------------------------------------
  // Bottom edge (y = 0): connects top surface row 0 to bottom at z=0
  for (let x = 0; x < cols; x++) {
    const y = 0;
    const tl = [vx(x), vy(y), heights[y * width + x]];
    const tr = [vx(x + 1), vy(y), heights[y * width + (x + 1)]];
    const bl = [vx(x), vy(y), 0];
    const br = [vx(x + 1), vy(y), 0];
    // Outward normal points in +vy direction (since vy flips, this is "up" in image = max vy)
    writeTri(tl, tr, br);
    writeTri(tl, br, bl);
  }

  // Top edge (y = rows): connects top surface last row to bottom
  for (let x = 0; x < cols; x++) {
    const y = rows;
    const tl = [vx(x), vy(y), heights[y * width + x]];
    const tr = [vx(x + 1), vy(y), heights[y * width + (x + 1)]];
    const bl = [vx(x), vy(y), 0];
    const br = [vx(x + 1), vy(y), 0];
    // Outward normal points in -vy direction
    writeTri(tl, br, tr);
    writeTri(tl, bl, br);
  }

  // Left edge (x = 0)
  for (let y = 0; y < rows; y++) {
    const x = 0;
    const tt = [vx(x), vy(y), heights[y * width + x]];
    const tb = [vx(x), vy(y + 1), heights[(y + 1) * width + x]];
    const bt = [vx(x), vy(y), 0];
    const bb = [vx(x), vy(y + 1), 0];
    // Outward normal points in -vx direction
    writeTri(tt, bb, tb);
    writeTri(tt, bt, bb);
  }

  // Right edge (x = cols)
  for (let y = 0; y < rows; y++) {
    const x = cols;
    const tt = [vx(x), vy(y), heights[y * width + x]];
    const tb = [vx(x), vy(y + 1), heights[(y + 1) * width + x]];
    const bt = [vx(x), vy(y), 0];
    const bb = [vx(x), vy(y + 1), 0];
    // Outward normal points in +vx direction
    writeTri(tt, tb, bb);
    writeTri(tt, bb, bt);
  }

  return buf;
}

/**
 * Convenience: generate STL and trigger a browser download.
 *
 * @param {DepthMap} depthMap
 * @param {Object}   [opts]         — same as depthMapToSTL opts
 * @param {string}   [filename]     — download file name
 */
export function downloadDepthSTL(depthMap, opts = {}, filename = 'depthmap.stl') {
  const buf = depthMapToSTL(depthMap, opts);

  const blob = new Blob([buf], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- internal helpers -------------------------------------------------------

/**
 * Bilinear down-sample a Float32Array grid.
 * @private
 */
function downsample(data, srcW, srcH, dstW, dstH) {
  const out = new Float32Array(dstW * dstH);
  const sx = srcW / dstW;
  const sy = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    for (let x = 0; x < dstW; x++) {
      const srcX = x * sx;
      const srcY = y * sy;
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, srcW - 1);
      const y1 = Math.min(y0 + 1, srcH - 1);
      const fx = srcX - x0;
      const fy = srcY - y0;

      const v00 = data[y0 * srcW + x0];
      const v10 = data[y0 * srcW + x1];
      const v01 = data[y1 * srcW + x0];
      const v11 = data[y1 * srcW + x1];

      out[y * dstW + x] =
        v00 * (1 - fx) * (1 - fy) +
        v10 * fx * (1 - fy) +
        v01 * (1 - fx) * fy +
        v11 * fx * fy;
    }
  }

  return out;
}
