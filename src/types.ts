export type BeadBrand = 'mard' | 'perler' | 'hama' | 'artkal' | 'nabbi';

export interface BeadColor {
  id: string;
  name: string;
  code?: string;
  hex: string;
  brand: BeadBrand;
  category: string;
  series?: string;
  verified?: boolean;
  rgb: [number, number, number];
  lab?: [number, number, number];
}

export interface PatternCell {
  colorId: string | null;
}

export interface PatternGrid {
  width: number;
  height: number;
  cells: (string | null)[][]; // 2D array of colorId (null represents empty/transparent pegboard hole)
}

export type ToolType = 'paint' | 'fill' | 'replace' | 'eyedropper' | 'text';

export type InventoryStock = Record<string, number>; // colorId -> count in stock

export interface MaterialItem {
  color: BeadColor;
  count: number;
  percentage: number;
}

export interface ImageAdjustmentOptions {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  sharpness?: number; // 0 to 100
  textClarity?: boolean; // When true, sharpens letter strokes and removes anti-aliased gray halos
  cleanSolidFills?: boolean; // Cleans distressed/vintage noise inside black/white text areas
}

export interface BackgroundRemovalOptions {
  enabled: boolean;
  targetColor: [number, number, number] | null; // RGB [0..255]
  tolerance: number; // 0 to 100
}

export type DitherType = 'none' | 'floyd-steinberg' | 'atkinson' | 'burkes' | 'bayer';
export type ColorMatchingAlgorithm = 'ciede2000' | 'cie76' | 'weighted_rgb';
export type ConversionPreset = 'custom' | 'text-logo' | 'photo' | 'pixel-art' | 'vibrant';
export type CanvasFitMode = 'natural' | 'contain' | 'stretch';

export interface ConversionSettings {
  brand: BeadBrand;
  gridWidth: number;
  preserveAspectRatio: boolean;
  fitMode?: CanvasFitMode; // 'natural' = auto height, 'contain' = centered on square board, 'stretch' = fill board
  maxColors: number;
  dithering: boolean;
  ditherType?: DitherType;
  ditherStrength?: number; // 0 to 100
  matchingAlgorithm?: ColorMatchingAlgorithm;
  presetMode?: ConversionPreset;
  autoCropMargin?: boolean;
  restrictToOwned?: boolean;
  adjustments: ImageAdjustmentOptions;
  bgRemoval: BackgroundRemovalOptions;
}

export interface CraftingProgress {
  placedCells: Record<string, boolean>; // "x,y" => true
  totalPlaced: number;
}
