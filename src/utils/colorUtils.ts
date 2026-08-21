import {
  BeadColor,
  BeadBrand,
  PatternGrid,
  BackgroundRemovalOptions,
  ImageAdjustmentOptions,
  DitherType,
  ColorMatchingAlgorithm,
  CanvasFitMode,
} from '../types';
import { BRAND_PALETTES, PERLER_PALETTE } from '../data/beadPalette';

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts sRGB [0..255] to CIE XYZ with D65 reference white
 */
export function rgbToXyz(r: number, g: number, b: number): [number, number, number] {
  let nr = r / 255;
  let ng = g / 255;
  let nb = b / 255;

  nr = nr > 0.04045 ? Math.pow((nr + 0.055) / 1.055, 2.4) : nr / 12.92;
  ng = ng > 0.04045 ? Math.pow((ng + 0.055) / 1.055, 2.4) : ng / 12.92;
  nb = nb > 0.04045 ? Math.pow((nb + 0.055) / 1.055, 2.4) : nb / 12.92;

  nr *= 100;
  ng *= 100;
  nb *= 100;

  const x = nr * 0.4124564 + ng * 0.3575761 + nb * 0.1804375;
  const y = nr * 0.2126729 + ng * 0.7151522 + nb * 0.0721750;
  const z = nr * 0.0193339 + ng * 0.1191920 + nb * 0.9503041;

  return [x, y, z];
}

/**
 * Converts CIE XYZ to CIE L*a*b* (D65)
 */
export function xyzToLab(x: number, y: number, z: number): [number, number, number] {
  const refX = 95.047;
  const refY = 100.000;
  const refZ = 108.883;

  const nx = x / refX;
  const ny = y / refY;
  const nz = z / refZ;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);

  const fx = f(nx);
  const fy = f(ny);
  const fz = f(nz);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);

  return [L, a, b];
}

/**
 * Converts sRGB [0..255] directly to CIE L*a*b*
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToLab(x, y, z);
}

/**
 * Delta-E (CIE76 Euclidean distance in Lab color space)
 */
export function deltaE(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Standard CIEDE2000 Color Difference Formula
 * Provides superior perceptual accuracy across all hues, skin tones, and saturated colors.
 */
export function deltaE2000(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;

  const C1 = Math.sqrt(a1 * a1 + b1 * b1);
  const C2 = Math.sqrt(a2 * a2 + b2 * b2);
  const avgC = (C1 + C2) / 2;

  const avgC7 = Math.pow(avgC, 7);
  const G = 0.5 * (1 - Math.sqrt(avgC7 / (avgC7 + 6103515625))); // 25^7 = 6103515625

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;

  const C1p = Math.sqrt(a1p * a1p + b1 * b1);
  const C2p = Math.sqrt(a2p * a2p + b2 * b2);
  const avgCp = (C1p + C2p) / 2;

  let h1p = Math.atan2(b1, a1p) * RAD2DEG;
  if (h1p < 0) h1p += 360;

  let h2p = Math.atan2(b2, a2p) * RAD2DEG;
  if (h2p < 0) h2p += 360;

  const dLp = L2 - L1;
  const avgLp = (L1 + L2) / 2;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    const diff = h2p - h1p;
    if (Math.abs(diff) <= 180) {
      dhp = diff;
    } else if (diff > 180) {
      dhp = diff - 360;
    } else {
      dhp = diff + 360;
    }
  }

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * DEG2RAD);

  let avgHp = h1p + h2p;
  if (C1p * C2p !== 0) {
    const diff = Math.abs(h1p - h2p);
    if (diff <= 180) {
      avgHp = (h1p + h2p) / 2;
    } else if (h1p + h2p < 360) {
      avgHp = (h1p + h2p + 360) / 2;
    } else {
      avgHp = (h1p + h2p - 360) / 2;
    }
  }

  const T =
    1 -
    0.17 * Math.cos((avgHp - 30) * DEG2RAD) +
    0.24 * Math.cos(2 * avgHp * DEG2RAD) +
    0.32 * Math.cos((3 * avgHp + 6) * DEG2RAD) -
    0.2 * Math.cos((4 * avgHp - 63) * DEG2RAD);

  const dTheta = 30 * Math.exp(-Math.pow((avgHp - 275) / 25, 2));
  const avgCp7 = Math.pow(avgCp, 7);
  const RC = 2 * Math.sqrt(avgCp7 / (avgCp7 + 6103515625));

  const avgLp50Sq = Math.pow(avgLp - 50, 2);
  const SL = 1 + (0.015 * avgLp50Sq) / Math.sqrt(20 + avgLp50Sq);
  const SC = 1 + 0.045 * avgCp;
  const SH = 1 + 0.015 * avgCp * T;
  const RT = -Math.sin(2 * dTheta * DEG2RAD) * RC;

  const vL = dLp / SL;
  const vC = dCp / SC;
  const vH = dHp / SH;

  return Math.sqrt(vL * vL + vC * vC + vH * vH + RT * vC * vH);
}

/**
 * Calculates CIEDE2000 color distance between two RGB triplets
 */
export function ciede2000ColorDistance(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const lab1 = rgbToLab(rgb1[0], rgb1[1], rgb1[2]);
  const lab2 = rgbToLab(rgb2[0], rgb2[1], rgb2[2]);
  return deltaE2000(lab1, lab2);
}

/**
 * Weighted Red-Mean RGB distance (used for high-contrast pixel graphics and sprites)
 */
export function deltaRgbWeighted(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const rmean = (rgb1[0] + rgb2[0]) / 2;
  const dr = rgb1[0] - rgb2[0];
  const dg = rgb1[1] - rgb2[1];
  const db = rgb1[2] - rgb2[2];
  const weightR = 2 + rmean / 256;
  const weightG = 4.0;
  const weightB = 2 + (255 - rmean) / 256;
  return Math.sqrt(weightR * dr * dr + weightG * dg * dg + weightB * db * db);
}

/**
 * Find closest bead color using selected color matching algorithm
 */
export function findClosestBeadColorMatch(
  rgb: [number, number, number],
  lab: [number, number, number],
  palette: BeadColor[] = PERLER_PALETTE,
  algorithm: ColorMatchingAlgorithm = 'ciede2000'
): BeadColor {
  let closest = palette[0];
  let minDistance = Infinity;

  if (algorithm === 'weighted_rgb') {
    for (let i = 0; i < palette.length; i++) {
      const color = palette[i];
      const dist = deltaRgbWeighted(rgb, color.rgb);
      if (dist < minDistance) {
        minDistance = dist;
        closest = color;
      }
    }
    return closest;
  }

  if (algorithm === 'cie76') {
    for (let i = 0; i < palette.length; i++) {
      const color = palette[i];
      const colorLab = color.lab || rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2]);
      const dist = deltaE(lab, colorLab);
      if (dist < minDistance) {
        minDistance = dist;
        closest = color;
      }
    }
    return closest;
  }

  // Default: CIEDE2000
  for (let i = 0; i < palette.length; i++) {
    const color = palette[i];
    const colorLab = color.lab || rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2]);
    const dist = deltaE2000(lab, colorLab);
    if (dist < minDistance) {
      minDistance = dist;
      closest = color;
    }
  }

  return closest;
}

export function findClosestBeadColor(
  r: number,
  g: number,
  b: number,
  palette: BeadColor[] = PERLER_PALETTE
): BeadColor {
  const lab = rgbToLab(r, g, b);
  return findClosestBeadColorMatch([r, g, b], lab, palette, 'ciede2000');
}

export function findClosestBeadColorFromLab(
  targetLab: [number, number, number],
  palette: BeadColor[] = PERLER_PALETTE
): BeadColor {
  let closest = palette[0];
  let minDistance = Infinity;

  for (let i = 0; i < palette.length; i++) {
    const color = palette[i];
    const colorLab = color.lab || rgbToLab(color.rgb[0], color.rgb[1], color.rgb[2]);
    const dist = deltaE2000(targetLab, colorLab);
    if (dist < minDistance) {
      minDistance = dist;
      closest = color;
    }
  }

  return closest;
}

export interface PixelSample {
  r: number;
  g: number;
  b: number;
  lab: [number, number, number];
  isTransparent: boolean;
  salienceWeight?: number;
}

/**
 * Quantize palette to the top `maxColors` best matching bead colors for this specific image
 * using K-Means clustering with CIEDE2000 and visual salience weighting.
 */
export function selectBestPaletteSubset(
  pixelSamples: PixelSample[][],
  maxColors: number,
  fullPalette: BeadColor[] = PERLER_PALETTE,
  algorithm: ColorMatchingAlgorithm = 'ciede2000'
): BeadColor[] {
  if (maxColors >= fullPalette.length) {
    return [...fullPalette];
  }

  // 1. Collect non-transparent pixel samples & their initial frequency in full palette
  const validPixels: { rgb: [number, number, number]; lab: [number, number, number]; weight: number }[] = [];
  const colorCounts = new Map<string, { count: number; bead: BeadColor; weightedCount: number }>();

  const height = pixelSamples.length;
  const width = pixelSamples[0]?.length || 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sample = pixelSamples[y][x];
      if (sample.isTransparent) continue;

      // Edge/Salience detection: check difference with adjacent pixels to protect detail colors
      let edgeStrength = 1.0;
      if (x + 1 < width && !pixelSamples[y][x + 1].isTransparent) {
        const next = pixelSamples[y][x + 1];
        const diff = Math.abs(sample.r - next.r) + Math.abs(sample.g - next.g) + Math.abs(sample.b - next.b);
        if (diff > 45) edgeStrength += 1.5;
      }
      if (y + 1 < height && !pixelSamples[y + 1][x].isTransparent) {
        const next = pixelSamples[y + 1][x];
        const diff = Math.abs(sample.r - next.r) + Math.abs(sample.g - next.g) + Math.abs(sample.b - next.b);
        if (diff > 45) edgeStrength += 1.5;
      }

      validPixels.push({
        rgb: [sample.r, sample.g, sample.b],
        lab: sample.lab,
        weight: edgeStrength,
      });

      const closest = findClosestBeadColorMatch([sample.r, sample.g, sample.b], sample.lab, fullPalette, algorithm);
      const existing = colorCounts.get(closest.id);
      if (existing) {
        existing.count++;
        existing.weightedCount += edgeStrength;
      } else {
        colorCounts.set(closest.id, { count: 1, weightedCount: edgeStrength, bead: closest });
      }
    }
  }

  if (validPixels.length === 0) {
    return fullPalette.slice(0, maxColors);
  }

  // If no pixels or fewer than maxColors, return sorted beads + fillers
  const sortedBeads = Array.from(colorCounts.values()).sort((a, b) => b.weightedCount - a.weightedCount);
  if (sortedBeads.length <= maxColors) {
    const selected = sortedBeads.map((s) => s.bead);
    for (const p of fullPalette) {
      if (selected.length >= maxColors) break;
      if (!selected.some((s) => s.id === p.id)) {
        selected.push(p);
      }
    }
    return selected;
  }

  // 2. K-means clustering in Lab space
  const k = Math.max(2, Math.min(maxColors, sortedBeads.length));
  let centroids: [number, number, number][] = sortedBeads.slice(0, k).map((s) => {
    const b = s.bead;
    return b.lab || rgbToLab(b.rgb[0], b.rgb[1], b.rgb[2]);
  });

  // Run 8 iterations of K-Means in Lab space
  for (let iter = 0; iter < 8; iter++) {
    const clusterSums: [number, number, number][] = Array.from({ length: k }, () => [0, 0, 0]);
    const clusterWeights: number[] = Array.from({ length: k }, () => 0);

    for (let i = 0; i < validPixels.length; i++) {
      const p = validPixels[i];
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const dist = deltaE2000(p.lab, centroids[c]);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = c;
        }
      }

      clusterSums[bestIdx][0] += p.lab[0] * p.weight;
      clusterSums[bestIdx][1] += p.lab[1] * p.weight;
      clusterSums[bestIdx][2] += p.lab[2] * p.weight;
      clusterWeights[bestIdx] += p.weight;
    }

    for (let c = 0; c < k; c++) {
      if (clusterWeights[c] > 0) {
        centroids[c] = [
          clusterSums[c][0] / clusterWeights[c],
          clusterSums[c][1] / clusterWeights[c],
          clusterSums[c][2] / clusterWeights[c],
        ];
      }
    }
  }

  const chosenPalette: BeadColor[] = [];
  const chosenIds = new Set<string>();

  for (const cent of centroids) {
    const bead = findClosestBeadColorFromLab(cent, fullPalette);
    if (!chosenIds.has(bead.id)) {
      chosenIds.add(bead.id);
      chosenPalette.push(bead);
    }
  }

  for (const item of sortedBeads) {
    if (chosenPalette.length >= maxColors) break;
    if (!chosenIds.has(item.bead.id)) {
      chosenIds.add(item.bead.id);
      chosenPalette.push(item.bead);
    }
  }

  return chosenPalette;
}

/**
 * Applies optional image contrast/brightness/saturation adjustments to RGB
 */
export function applyAdjustments(
  r: number,
  g: number,
  b: number,
  brightness = 0,
  contrast = 0,
  saturation = 0
): [number, number, number] {
  let nr = r + brightness * 2.55;
  let ng = g + brightness * 2.55;
  let nb = b + brightness * 2.55;

  if (contrast !== 0) {
    const factor = (259 * (contrast + 100)) / (100 * (259 - contrast));
    nr = factor * (nr - 128) + 128;
    ng = factor * (ng - 128) + 128;
    nb = factor * (nb - 128) + 128;
  }

  if (saturation !== 0) {
    const gray = 0.2989 * nr + 0.587 * ng + 0.114 * nb;
    const satFactor = (saturation + 50) / 50;
    nr = gray + satFactor * (nr - gray);
    ng = gray + satFactor * (ng - gray);
    nb = gray + satFactor * (nb - gray);
  }

  return [
    Math.max(0, Math.min(255, nr)),
    Math.max(0, Math.min(255, ng)),
    Math.max(0, Math.min(255, nb)),
  ];
}

/**
 * Checks if a pixel matches the background removal target color within tolerance
 */
export function isBackgroundPixel(
  r: number,
  g: number,
  b: number,
  targetColor: [number, number, number],
  tolerance: number
): boolean {
  const dr = r - targetColor[0];
  const dg = g - targetColor[1];
  const db = b - targetColor[2];
  const distance = Math.sqrt(dr * dr + dg * dg + db * db);
  const maxAllowedDistance = (tolerance / 100) * 441.67;
  return distance <= maxAllowedDistance;
}

/**
 * Applies unsharp mask sharpness enhancement on ImageData
 */
export function applySharpness(imgData: ImageData, sharpness = 0): void {
  if (sharpness <= 0) return;

  const w = imgData.width;
  const h = imgData.height;
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;

  // Strength factor [0..1]
  const amount = (sharpness / 100) * 0.8;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = src[idx + c];
        const top = src[((y - 1) * w + x) * 4 + c];
        const bottom = src[((y + 1) * w + x) * 4 + c];
        const left = src[(y * w + (x - 1)) * 4 + c];
        const right = src[(y * w + (x + 1)) * 4 + c];

        const laplacian = 4 * center - (top + bottom + left + right);
        const sharpened = center + amount * laplacian;
        dst[idx + c] = Math.max(0, Math.min(255, Math.round(sharpened)));
      }
    }
  }
}

/**
 * Crops uniform or near-white/transparent border margins so graphics/stickers fill the available pattern grid.
 */
export function cropContentBounds(
  source: HTMLImageElement | HTMLCanvasElement,
  tolerance = 15
): HTMLCanvasElement {
  const origW = source.width || (source as HTMLImageElement).naturalWidth || 100;
  const origH = source.height || (source as HTMLImageElement).naturalHeight || 100;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = origW;
  tempCanvas.height = origH;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return tempCanvas;

  ctx.drawImage(source, 0, 0);
  const imgData = ctx.getImageData(0, 0, origW, origH);
  const data = imgData.data;

  // Sample corner pixel as the background color reference (e.g. outer white or light gray)
  const bgR = data[0];
  const bgG = data[1];
  const bgB = data[2];
  const bgA = data[3];

  const isBg = (idx: number) => {
    const a = data[idx + 3];
    if (a < 25) return true; // transparent
    if (bgA >= 200) {
      const dr = Math.abs(data[idx] - bgR);
      const dg = Math.abs(data[idx + 1] - bgG);
      const db = Math.abs(data[idx + 2] - bgB);
      // Near background color
      if (dr + dg + db < tolerance * 4.5) return true;
      // Near pure white
      if (data[idx] > 242 && data[idx + 1] > 242 && data[idx + 2] > 242) return true;
    }
    return false;
  };

  let minX = origW;
  let minY = origH;
  let maxX = 0;
  let maxY = 0;
  let found = false;

  for (let y = 0; y < origH; y++) {
    for (let x = 0; x < origW; x++) {
      const idx = (y * origW + x) * 4;
      if (!isBg(idx)) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If entire image is background or crop area is too small, return original
  if (!found || maxX - minX < origW * 0.15 || maxY - minY < origH * 0.15) {
    return tempCanvas;
  }

  // Add a small 2% padding
  const padX = Math.round((maxX - minX) * 0.02);
  const padY = Math.round((maxY - minY) * 0.02);
  const cropX = Math.max(0, minX - padX);
  const cropY = Math.max(0, minY - padY);
  const cropW = Math.min(origW - cropX, maxX - minX + padX * 2);
  const cropH = Math.min(origH - cropY, maxY - minY + padY * 2);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropW;
  croppedCanvas.height = cropH;
  const croppedCtx = croppedCanvas.getContext('2d', { willReadFrequently: true });
  if (croppedCtx) {
    croppedCtx.drawImage(tempCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  }
  return croppedCanvas;
}

/**
 * Text & Graphic Clarity filter:
 * Removes anti-aliasing gray halos around black & white text strokes
 * and sharpens graphic boundaries so letters stay crisp, bold, and readable.
 */
export function applyTextClarity(
  r: number,
  g: number,
  b: number,
  cleanSolidFills = true
): [number, number, number] {
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  const saturation = maxChannel === 0 ? 0 : (maxChannel - minChannel) / maxChannel;

  // If the pixel is low saturation (grayscale / black / white text region)
  if (saturation < 0.32) {
    if (brightness < 125) {
      // Dark text / dark box: snap to pure black
      return [0, 0, 0];
    } else {
      // White text / white background: snap to pure white
      return [255, 255, 255];
    }
  }

  // Strong chromatic colors:
  // Red flag detection: high red, low green & blue
  if (r > 115 && r > g * 1.3 && r > b * 1.3) {
    return [Math.min(255, r * 1.15), Math.max(0, g * 0.7), Math.max(0, b * 0.7)];
  }

  // Green star detection: green channel dominates
  if (g > 40 && g > r * 0.85 && g > b * 1.05) {
    return [Math.max(0, r * 0.4), Math.min(255, g * 1.35), Math.max(0, b * 0.5)];
  }

  return [r, g, b];
}

/**
 * Progressive halving downscale algorithm with high-quality cubic/linear smoothing
 */
export function progressiveDownsample(
  source: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  sharpness = 0
): ImageData {
  const origW = source.width || (source as HTMLImageElement).naturalWidth || targetWidth;
  const origH = source.height || (source as HTMLImageElement).naturalHeight || targetHeight;

  let currentW = origW;
  let currentH = origH;
  let currentSource: HTMLImageElement | HTMLCanvasElement = source;

  while (currentW > targetWidth * 2 || currentH > targetHeight * 2) {
    const halfW = Math.max(targetWidth, Math.floor(currentW / 2));
    const halfH = Math.max(targetHeight, Math.floor(currentH / 2));

    const stepCanvas = document.createElement('canvas');
    stepCanvas.width = halfW;
    stepCanvas.height = halfH;
    const stepCtx = stepCanvas.getContext('2d', { willReadFrequently: true });
    if (!stepCtx) break;

    stepCtx.imageSmoothingEnabled = true;
    stepCtx.imageSmoothingQuality = 'high';
    stepCtx.drawImage(currentSource, 0, 0, halfW, halfH);

    currentSource = stepCanvas;
    currentW = halfW;
    currentH = halfH;
  }

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
  if (!finalCtx) {
    throw new Error('Canvas 2D context not supported');
  }

  finalCtx.imageSmoothingEnabled = true;
  finalCtx.imageSmoothingQuality = 'high';
  finalCtx.drawImage(currentSource, 0, 0, targetWidth, targetHeight);

  const imgData = finalCtx.getImageData(0, 0, targetWidth, targetHeight);
  if (sharpness > 0) {
    applySharpness(imgData, sharpness);
  }

  return imgData;
}

// 4x4 Bayer Dithering Matrix
const BAYER_4X4 = [
  [0 / 16, 8 / 16, 2 / 16, 10 / 16],
  [12 / 16, 4 / 16, 14 / 16, 6 / 16],
  [3 / 16, 11 / 16, 1 / 16, 9 / 16],
  [15 / 16, 7 / 16, 13 / 16, 5 / 16],
];

/**
 * Downsamples image into a PatternGrid with brand selection, background removal,
 * image adjustments, unsharp mask clarity, and multi-mode dithering (Floyd-Steinberg, Atkinson, Burkes, Bayer).
 */
export function convertImageToPattern(
  img: HTMLImageElement | HTMLCanvasElement,
  targetWidth: number,
  preserveAspectRatio: boolean,
  maxColors: number,
  dithering: boolean,
  adjustments: ImageAdjustmentOptions,
  brand: BeadBrand = 'mard',
  bgRemoval?: BackgroundRemovalOptions,
  ditherType: DitherType = 'floyd-steinberg',
  ditherStrength = 75,
  matchingAlgorithm: ColorMatchingAlgorithm = 'ciede2000',
  autoCropMargin = false,
  fitMode: CanvasFitMode = 'natural',
  restrictPaletteColorIds?: string[]
): PatternGrid {
  const rawPalette = BRAND_PALETTES[brand] || BRAND_PALETTES.mard || PERLER_PALETTE;
  const fullPalette =
    restrictPaletteColorIds && restrictPaletteColorIds.length > 0
      ? rawPalette.filter((c) => restrictPaletteColorIds.includes(c.id))
      : rawPalette;

  // If autoCropMargin is enabled, trim uniform outer borders/margins
  const sourceImage = autoCropMargin ? cropContentBounds(img) : img;

  const origW = sourceImage.width || (sourceImage as HTMLImageElement).naturalWidth || 100;
  const origH = sourceImage.height || (sourceImage as HTMLImageElement).naturalHeight || 100;

  let outWidth = targetWidth;
  let outHeight = targetWidth;
  let preparedSource: HTMLImageElement | HTMLCanvasElement = sourceImage;

  if (fitMode === 'contain') {
    // Fit and center rectangular graphic with crisp padding on square board (e.g. 52×52)
    outWidth = targetWidth;
    outHeight = targetWidth;

    const fitCanvas = document.createElement('canvas');
    fitCanvas.width = targetWidth * 4;
    fitCanvas.height = targetWidth * 4;
    const fitCtx = fitCanvas.getContext('2d');
    if (fitCtx) {
      fitCtx.fillStyle = '#FFFFFF';
      fitCtx.fillRect(0, 0, fitCanvas.width, fitCanvas.height);

      const aspect = origW / origH;
      let drawW = fitCanvas.width;
      let drawH = fitCanvas.height;
      let drawX = 0;
      let drawY = 0;

      if (aspect >= 1) {
        drawW = fitCanvas.width;
        drawH = Math.max(1, Math.round(fitCanvas.width / aspect));
        drawX = 0;
        drawY = Math.round((fitCanvas.height - drawH) / 2);
      } else {
        drawH = fitCanvas.height;
        drawW = Math.max(1, Math.round(fitCanvas.height * aspect));
        drawX = Math.round((fitCanvas.width - drawW) / 2);
        drawY = 0;
      }

      fitCtx.imageSmoothingEnabled = true;
      fitCtx.imageSmoothingQuality = 'high';
      fitCtx.drawImage(sourceImage, drawX, drawY, drawW, drawH);
      preparedSource = fitCanvas;
    }
  } else if (fitMode === 'stretch' || !preserveAspectRatio) {
    outWidth = targetWidth;
    outHeight = targetWidth;
  } else {
    outWidth = targetWidth;
    outHeight = Math.max(1, Math.round((origH / origW) * targetWidth));
  }

  // 1. Progressive high-quality downsampling with sharpness enhancement
  const sharpness = adjustments.sharpness ?? 25;
  const imgData = progressiveDownsample(preparedSource, outWidth, outHeight, sharpness);
  const data = imgData.data;

  // 2. Extract pixel samples with Alpha Edge Thresholding, Background Removal & Text Clarity
  const pixelGrid: PixelSample[][] = [];

  for (let y = 0; y < outHeight; y++) {
    const row: PixelSample[] = [];
    for (let x = 0; x < outWidth; x++) {
      const idx = (y * outWidth + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Alpha-edge threshold: < 128 (50%) -> transparent / no bead
      if (a < 128) {
        row.push({
          r: 255,
          g: 255,
          b: 255,
          lab: [100, 0, 0],
          isTransparent: true,
        });
        continue;
      }

      // Background color removal check
      if (
        bgRemoval &&
        bgRemoval.enabled &&
        bgRemoval.targetColor &&
        isBackgroundPixel(r, g, b, bgRemoval.targetColor, bgRemoval.tolerance)
      ) {
        row.push({
          r: 255,
          g: 255,
          b: 255,
          lab: [100, 0, 0],
          isTransparent: true,
        });
        continue;
      }

      const alphaNorm = a / 255;
      let blendedR = r * alphaNorm + 255 * (1 - alphaNorm);
      let blendedG = g * alphaNorm + 255 * (1 - alphaNorm);
      let blendedB = b * alphaNorm + 255 * (1 - alphaNorm);

      // Apply text clarity & anti-aliasing cleanup if enabled
      if (adjustments.textClarity) {
        [blendedR, blendedG, blendedB] = applyTextClarity(
          blendedR,
          blendedG,
          blendedB,
          adjustments.cleanSolidFills ?? true
        );
      }

      const [adjR, adjG, adjB] = applyAdjustments(
        blendedR,
        blendedG,
        blendedB,
        adjustments.brightness,
        adjustments.contrast,
        adjustments.saturation
      );

      const lab = rgbToLab(adjR, adjG, adjB);
      row.push({
        r: adjR,
        g: adjG,
        b: adjB,
        lab,
        isTransparent: false,
      });
    }
    pixelGrid.push(row);
  }

  // 3. Quantize and select palette subset from active brand palette
  const activePalette = selectBestPaletteSubset(pixelGrid, maxColors, fullPalette, matchingAlgorithm);

  // 4. Match colors using chosen dithering engine
  const effectiveDitherType: DitherType = dithering ? ditherType : 'none';
  const cells: (string | null)[][] = [];

  if (effectiveDitherType === 'none') {
    for (let y = 0; y < outHeight; y++) {
      const row: (string | null)[] = [];
      for (let x = 0; x < outWidth; x++) {
        const sample = pixelGrid[y][x];
        if (sample.isTransparent) {
          row.push(null);
        } else {
          const closest = findClosestBeadColorMatch(
            [sample.r, sample.g, sample.b],
            sample.lab,
            activePalette,
            matchingAlgorithm
          );
          row.push(closest.id);
        }
      }
      cells.push(row);
    }
  } else if (effectiveDitherType === 'bayer') {
    // 4x4 Ordered Matrix Dithering
    const strength = (ditherStrength / 100) * 32;
    for (let y = 0; y < outHeight; y++) {
      const row: (string | null)[] = [];
      for (let x = 0; x < outWidth; x++) {
        const sample = pixelGrid[y][x];
        if (sample.isTransparent) {
          row.push(null);
          continue;
        }

        const bayerOffset = (BAYER_4X4[y % 4][x % 4] - 0.5) * strength;
        const adjR = Math.max(0, Math.min(255, sample.r + bayerOffset));
        const adjG = Math.max(0, Math.min(255, sample.g + bayerOffset));
        const adjB = Math.max(0, Math.min(255, sample.b + bayerOffset));
        const adjLab = rgbToLab(adjR, adjG, adjB);

        const closest = findClosestBeadColorMatch([adjR, adjG, adjB], adjLab, activePalette, matchingAlgorithm);
        row.push(closest.id);
      }
      cells.push(row);
    }
  } else {
    // Error Diffusion Dithering (Floyd-Steinberg, Atkinson, or Burkes)
    const strengthMultiplier = Math.max(0, Math.min(1.0, ditherStrength / 100));
    const workRgbBuffer: [number, number, number][][] = pixelGrid.map((row) =>
      row.map((s) => [s.r, s.g, s.b])
    );

    const distributeError = (
      tx: number,
      ty: number,
      errR: number,
      errG: number,
      errB: number,
      weight: number
    ) => {
      if (tx >= 0 && tx < outWidth && ty >= 0 && ty < outHeight) {
        if (!pixelGrid[ty][tx].isTransparent) {
          workRgbBuffer[ty][tx][0] += errR * weight * strengthMultiplier;
          workRgbBuffer[ty][tx][1] += errG * weight * strengthMultiplier;
          workRgbBuffer[ty][tx][2] += errB * weight * strengthMultiplier;
        }
      }
    };

    for (let y = 0; y < outHeight; y++) {
      const row: (string | null)[] = [];
      for (let x = 0; x < outWidth; x++) {
        const sample = pixelGrid[y][x];
        if (sample.isTransparent) {
          row.push(null);
          continue;
        }

        const [currR, currG, currB] = workRgbBuffer[y][x];
        const clampedR = Math.max(0, Math.min(255, currR));
        const clampedG = Math.max(0, Math.min(255, currG));
        const clampedB = Math.max(0, Math.min(255, currB));

        const currLab = rgbToLab(clampedR, clampedG, clampedB);
        const closest = findClosestBeadColorMatch(
          [clampedR, clampedG, clampedB],
          currLab,
          activePalette,
          matchingAlgorithm
        );
        row.push(closest.id);

        const [beadR, beadG, beadB] = closest.rgb;
        const errR = clampedR - beadR;
        const errG = clampedG - beadG;
        const errB = clampedB - beadB;

        if (effectiveDitherType === 'atkinson') {
          // Atkinson Dithering: 1/8 each on 6 neighbors (diffuses 3/4 of error)
          const w = 1 / 8;
          distributeError(x + 1, y, errR, errG, errB, w);
          distributeError(x + 2, y, errR, errG, errB, w);
          distributeError(x - 1, y + 1, errR, errG, errB, w);
          distributeError(x, y + 1, errR, errG, errB, w);
          distributeError(x + 1, y + 1, errR, errG, errB, w);
          distributeError(x, y + 2, errR, errG, errB, w);
        } else if (effectiveDitherType === 'burkes') {
          // Burkes Dithering: smoother 32-fraction distribution
          distributeError(x + 1, y, errR, errG, errB, 8 / 32);
          distributeError(x + 2, y, errR, errG, errB, 4 / 32);
          distributeError(x - 2, y + 1, errR, errG, errB, 2 / 32);
          distributeError(x - 1, y + 1, errR, errG, errB, 4 / 32);
          distributeError(x, y + 1, errR, errG, errB, 8 / 32);
          distributeError(x + 1, y + 1, errR, errG, errB, 4 / 32);
          distributeError(x + 2, y + 1, errR, errG, errB, 2 / 32);
        } else {
          // Default Floyd-Steinberg
          distributeError(x + 1, y, errR, errG, errB, 7 / 16);
          distributeError(x - 1, y + 1, errR, errG, errB, 3 / 16);
          distributeError(x, y + 1, errR, errG, errB, 5 / 16);
          distributeError(x + 1, y + 1, errR, errG, errB, 1 / 16);
        }
      }
      cells.push(row);
    }
  }

  return {
    width: outWidth,
    height: outHeight,
    cells,
  };
}
