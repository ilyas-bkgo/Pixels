import React, { useRef, useState, useMemo } from 'react';
import {
  Upload,
  Zap,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Paintbrush,
  PaintBucket,
  RefreshCw,
  Pipette,
  Type,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Undo2,
  Redo2,
  Check,
  Scissors,
  Layers,
  AlertTriangle,
  Grid,
  Ruler,
  Sliders,
  Star,
} from 'lucide-react';
import {
  BeadColor,
  BeadBrand,
  ConversionSettings,
  ToolType,
  PatternGrid,
  DitherType,
  ColorMatchingAlgorithm,
} from '../types';
import {
  BRAND_PALETTES,
  BRAND_INFO,
  COLOR_MAP,
} from '../data/beadPalette';
import { MARD_SERIES_DEFINITIONS } from '../data/mardPalette';

interface SidebarProps {
  settings: ConversionSettings;
  onUpdateSettings: React.Dispatch<React.SetStateAction<ConversionSettings>>;
  onConvertImage: (img: HTMLImageElement) => void;
  onChangeBrand: (newBrand: BeadBrand) => void;
  activeImage: HTMLImageElement | null;
  grid: PatternGrid;
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  activeColor: BeadColor;
  onSelectColor: (color: BeadColor) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenReplaceModal: () => void;
  userSetMaxColors?: boolean;
  onSetGridWidth?: (width: number) => void;
  onSetMaxColors?: (colors: number) => void;
  onResetMaxColorsAuto?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  onUpdateSettings,
  onConvertImage,
  onChangeBrand,
  activeImage,
  grid,
  activeTool,
  onSelectTool,
  activeColor,
  onSelectColor,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenReplaceModal,
  userSetMaxColors = false,
  onSetGridWidth,
  onSetMaxColors,
  onResetMaxColorsAuto,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [showBgRemoval, setShowBgRemoval] = useState(false);
  const [showAdvancedEngine, setShowAdvancedEngine] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [selectedMardSeries, setSelectedMardSeries] = useState<string>('all');
  const [onlyUsedOnBoard, setOnlyUsedOnBoard] = useState(false);
  const [justConverted, setJustConverted] = useState(false);
  const [sizeUnit, setSizeUnit] = useState<'in' | 'cm'>('in');

  const activeBrandPalette = BRAND_PALETTES[settings.brand] || BRAND_PALETTES.mard;
  const isMardActive = settings.brand === 'mard';

  // Compute colors currently used on the board
  const usedColorIds = useMemo(() => {
    const ids = new Set<string>();
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const id = grid.cells[y]?.[x];
        if (id) ids.add(id);
      }
    }
    return ids;
  }, [grid]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPEG, WebP, SVG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        onConvertImage(img);
        setJustConverted(true);
        setTimeout(() => setJustConverted(false), 2000);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualConvert = () => {
    if (activeImage) {
      onConvertImage(activeImage);
      setJustConverted(true);
      setTimeout(() => setJustConverted(false), 2000);
    }
  };

  const filteredColors = activeBrandPalette.filter((color) => {
    if (onlyUsedOnBoard && !usedColorIds.has(color.id)) {
      return false;
    }

    const matchesSearch =
      color.name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      (color.code && color.code.toLowerCase().includes(paletteSearch.toLowerCase())) ||
      color.hex.toLowerCase().includes(paletteSearch.toLowerCase()) ||
      (color.series && color.series.toLowerCase().includes(paletteSearch.toLowerCase()));

    const matchesSeries =
      !isMardActive ||
      selectedMardSeries === 'all' ||
      (color.code && color.code.startsWith(selectedMardSeries));

    return matchesSearch && matchesSeries;
  });

  // Calculate actual dimensions in current grid (or calculated expected height)
  const currentGridWidth = grid.width;
  const currentGridHeight = grid.height;
  const totalPegboards = Math.ceil((currentGridWidth * currentGridHeight) / (29 * 29));

  // Finished physical size calculation at 5.0mm standard bead spacing
  const widthInCm = (currentGridWidth * 0.5).toFixed(1);
  const heightInCm = (currentGridHeight * 0.5).toFixed(1);
  const widthInInches = ((currentGridWidth * 5.0) / 25.4).toFixed(1);
  const heightInInches = ((currentGridHeight * 5.0) / 25.4).toFixed(1);

  // Common preset sizes for dropdown
  const PRESET_SIZES = [
    { value: 15, label: '15 stitches (Mini)' },
    { value: 20, label: '20 stitches' },
    { value: 29, label: '29 stitches (1 Pegboard • 29×29)' },
    { value: 35, label: '35 stitches' },
    { value: 45, label: '45 stitches' },
    { value: 50, label: '50 stitches' },
    { value: 52, label: '52 stitches (Square 52×52 • 4 Pegboards)' },
    { value: 58, label: '58 stitches (4 Pegboards ★ Best for Text & Logos)' },
    { value: 70, label: '70 stitches (Sharp Lettering)' },
    { value: 87, label: '87 stitches (9 Pegboards ★ High Definition)' },
    { value: 100, label: '100 stitches' },
    { value: 116, label: '116 stitches (16 Pegboards • 116×116)' },
    { value: 130, label: '130 stitches' },
    { value: 145, label: '145 stitches (25 Pegboards • 145×145)' },
    { value: 150, label: '150 stitches (Max)' },
  ];

  const applyPreset = (mode: 'text-logo' | 'photo' | 'pixel-art' | 'vibrant' | 'square-52') => {
    if (mode === 'square-52') {
      if (onSetGridWidth) onSetGridWidth(52);
      onUpdateSettings((prev) => ({
        ...prev,
        gridWidth: 52,
        fitMode: 'contain',
        preserveAspectRatio: true,
        presetMode: 'text-logo',
        dithering: false,
        matchingAlgorithm: 'ciede2000',
        autoCropMargin: true,
        adjustments: {
          ...prev.adjustments,
          contrast: 20,
          saturation: 10,
          sharpness: 60,
          textClarity: true,
          cleanSolidFills: true,
        },
      }));
    } else if (mode === 'text-logo') {
      onUpdateSettings((prev) => ({
        ...prev,
        presetMode: 'text-logo',
        dithering: false,
        ditherType: 'atkinson',
        matchingAlgorithm: 'ciede2000',
        autoCropMargin: true,
        adjustments: {
          ...prev.adjustments,
          contrast: 15,
          saturation: 5,
          sharpness: 55,
          textClarity: true,
          cleanSolidFills: true,
        },
      }));
    } else if (mode === 'photo') {
      onUpdateSettings((prev) => ({
        ...prev,
        presetMode: 'photo',
        dithering: true,
        ditherType: 'floyd-steinberg',
        ditherStrength: 75,
        matchingAlgorithm: 'ciede2000',
        autoCropMargin: false,
        adjustments: {
          ...prev.adjustments,
          contrast: 0,
          saturation: 0,
          sharpness: 25,
          textClarity: false,
          cleanSolidFills: false,
        },
      }));
    } else if (mode === 'pixel-art') {
      onUpdateSettings((prev) => ({
        ...prev,
        presetMode: 'pixel-art',
        dithering: false,
        matchingAlgorithm: 'weighted_rgb',
        autoCropMargin: false,
        adjustments: {
          ...prev.adjustments,
          contrast: 5,
          saturation: 10,
          sharpness: 0,
          textClarity: false,
          cleanSolidFills: false,
        },
      }));
    } else if (mode === 'vibrant') {
      onUpdateSettings((prev) => ({
        ...prev,
        presetMode: 'vibrant',
        dithering: true,
        ditherType: 'atkinson',
        ditherStrength: 50,
        matchingAlgorithm: 'ciede2000',
        autoCropMargin: true,
        adjustments: {
          ...prev.adjustments,
          contrast: 20,
          saturation: 25,
          sharpness: 40,
          textClarity: true,
          cleanSolidFills: true,
        },
      }));
    }
  };

  return (
    <aside className="w-72 sm:w-84 border-r border-pink-800 flex flex-col p-4 sm:p-5 space-y-4 bg-rose-50 overflow-y-auto shrink-0 select-none">
      {/* 01. SOURCE & BRAND PALETTE */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-pink-400">
            01. Bead Brand & Source
          </p>
          {activeImage && (
            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono font-bold text-pink-700 bg-pink-100 px-2 py-0.5 border border-pink-300 rounded">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          )}
        </div>

        {/* Brand Palette Switcher with MARD 221 Star Styling */}
        <div className="mb-2.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-pink-900 flex items-center justify-between mb-2">
            <span className="flex items-center gap-1">
              <span>Bead Brand Palette</span>
              {isMardActive && (
                <span className="text-[8px] bg-pink-800 text-white px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-white" /> MAIN
                </span>
              )}
            </span>
            <span className="text-[9px] font-mono text-pink-500 font-bold">
              {activeBrandPalette.length} colors
            </span>
          </label>
          <select
            id="brand-palette-select"
            value={settings.brand}
            onChange={(e) => {
              const brand = e.target.value as BeadBrand;
              onChangeBrand(brand);
            }}
            className={`w-full border rounded p-2 text-xs font-bold focus:outline-none cursor-pointer ${
              isMardActive
                ? 'border-pink-800 bg-pink-900 text-white font-mono'
                : 'border-pink-800 bg-rose-50 text-pink-900'
            }`}
          >
            <option value="mard">★ MARD 221 (Asian Standard • 221 Colors)</option>
            <option value="perler">Perler Beads (USA Standard • 65 Colors)</option>
            <option value="hama">Hama Beads (Danish Midi • 57 Colors)</option>
            <option value="artkal">Artkal Beads (S-Series • 50 Colors)</option>
            <option value="nabbi">Nabbi / Fuse (Nordic • 25 Colors)</option>
          </select>
          <p className="text-[9px] text-pink-500 mt-2 leading-tight">
            {BRAND_INFO[settings.brand]?.description}
          </p>

          {/* MARD Reference Notice */}
          {isMardActive && (
            <div className="mt-2 p-2.5 bg-pink-50 border border-pink-200 rounded text-pink-950 text-[10px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-[9px] text-pink-900">
                  MARD 221 Engine Active
                </span>
                <span className="leading-tight block text-pink-800">
                  9 full color series (A1-M15) loaded with CIEDE2000 precision color matching for skin, anime, and gradient artwork.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Source Image Preview (if image loaded) */}
        {activeImage ? (
          <div className="border-2 border-pink-800 rounded-xl p-2.5 bg-rose-50 space-y-2 mb-2.5 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white border border-pink-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src={activeImage.src}
                  alt="Source"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-pink-900 truncate">
                  Source Loaded
                </div>
                <div className="text-[9px] font-mono text-pink-500 leading-tight">
                  {activeImage.naturalWidth}×{activeImage.naturalHeight}px
                </div>
                <div className="text-[8px] text-pink-600 font-bold flex items-center gap-1 mt-0.5">
                  <Check className="w-2.5 h-2.5" /> {BRAND_INFO[settings.brand]?.name}
                </div>
              </div>
            </div>

            {/* Re-convert / Update Action Button */}
            <button
              id="convert-pattern-btn"
              onClick={handleManualConvert}
              className={`w-full py-1.5 px-3 border border-pink-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                justConverted
                  ? 'bg-pink-600 text-white animate-scale-up'
                  : 'bg-pink-800 hover:bg-pink-900 text-white'
              }`}
            >
              {justConverted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pattern Recomputed!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Convert & Update Pattern</span>
                </>
              )}
            </button>
          </div>
        ) : null}

        {/* Drag and Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-2.5 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-pink-800 bg-pink-100 scale-[1.01]'
              : 'border-pink-800/30 hover:border-pink-800 bg-rose-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <div className="flex flex-col items-center space-y-1">
            <div className="w-7 h-7 rounded-full border border-pink-800 flex items-center justify-center bg-white shadow-xs">
              <Upload className="w-3.5 h-3.5 text-pink-800" />
            </div>
            <p className="text-[10px] font-bold text-pink-900 leading-tight">
              {activeImage ? 'Upload Different' : 'Drop Image'}
            </p>
            <p className="text-[8.5px] text-pink-500 leading-tight">
              PNG, JPG, WebP
            </p>
          </div>
        </div>
      </div>

      {/* 02. PATTERN SIZE & CONVERTER QUALITY (MakeBead Engine) */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] mb-2.5 font-bold text-pink-400">
          02. Pattern Size & Quality Engine
        </p>

        <div className="space-y-2.5">
          {/* One-Click Presets Bar */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-pink-900 block mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-pink-500" />
              <span>Conversion Preset</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="preset-text-logo-btn"
                onClick={() => applyPreset('text-logo')}
                className={`p-2 border rounded-lg text-left transition-all cursor-pointer ${
                  settings.presetMode === 'text-logo'
                    ? 'bg-pink-800 text-white border-pink-800 shadow-xs'
                    : 'bg-rose-50 text-pink-900 border-pink-800/20 hover:border-pink-800'
                }`}
              >
                <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <span>🔤 Clear Text & Logos</span>
                </div>
                <div className="text-[8px] opacity-80 mt-0.5 leading-tight">
                  Sharp lettering • Made in Morocco
                </div>
              </button>

              <button
                type="button"
                id="preset-photo-btn"
                onClick={() => applyPreset('photo')}
                className={`p-2 border rounded-lg text-left transition-all cursor-pointer ${
                  settings.presetMode === 'photo'
                    ? 'bg-pink-800 text-white border-pink-800 shadow-xs'
                    : 'bg-rose-50 text-pink-900 border-pink-800/20 hover:border-pink-800'
                }`}
              >
                <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <span>🖼️ Photo / Portrait</span>
                </div>
                <div className="text-[8px] opacity-80 mt-0.5 leading-tight">
                  Smooth skin & color blending
                </div>
              </button>

              <button
                type="button"
                id="preset-pixel-art-btn"
                onClick={() => applyPreset('pixel-art')}
                className={`p-2 border rounded-lg text-left transition-all cursor-pointer ${
                  settings.presetMode === 'pixel-art'
                    ? 'bg-pink-800 text-white border-pink-800 shadow-xs'
                    : 'bg-rose-50 text-pink-900 border-pink-800/20 hover:border-pink-800'
                }`}
              >
                <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <span>👾 Pixel Art / Retro</span>
                </div>
                <div className="text-[8px] opacity-80 mt-0.5 leading-tight">
                  1:1 sprite boundaries
                </div>
              </button>

              <button
                type="button"
                id="preset-vibrant-btn"
                onClick={() => applyPreset('vibrant')}
                className={`p-2 border rounded-lg text-left transition-all cursor-pointer ${
                  settings.presetMode === 'vibrant'
                    ? 'bg-pink-800 text-white border-pink-800 shadow-xs'
                    : 'bg-rose-50 text-pink-900 border-pink-800/20 hover:border-pink-800'
                }`}
              >
                <div className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <span>🎨 Vibrant Poster</span>
                </div>
                <div className="text-[8px] opacity-80 mt-0.5 leading-tight">
                  Boosted saturation & pop
                </div>
              </button>
            </div>

            {/* 1-Click 52x52 Square Clarity Preset Button */}
            <button
              type="button"
              id="preset-square-52-btn"
              onClick={() => applyPreset('square-52')}
              className={`w-full p-2.5 border-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between ${
                settings.gridWidth === 52 && settings.fitMode === 'contain'
                  ? 'bg-pink-800 text-white border-pink-800 shadow-sm'
                  : 'bg-pink-50 text-pink-900 border-pink-400 hover:border-pink-800'
              }`}
            >
              <div>
                <div className="text-[11px] font-bold uppercase flex items-center gap-1.5">
                  <span>⭐ 52×52 Clean Square Grid</span>
                </div>
                <div className="text-[8.5px] opacity-80 mt-0.5">
                  Square board • Unsquished aspect ratio • Crisp letters
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-400/30 text-current">
                52×52
              </span>
            </button>
          </div>

          {/* Lettering & Graphic Clarity Optimization Panel */}
          <div className="p-3 border-2 border-pink-800 rounded-xl bg-pink-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-900 flex items-center gap-1">
                <span>Lettering & Text Clarity</span>
                <span className="text-[8px] bg-pink-800 text-white px-1 py-0.2 rounded font-mono font-bold">
                  MARD
                </span>
              </span>
              <input
                type="checkbox"
                id="text-clarity-checkbox"
                checked={settings.adjustments.textClarity ?? true}
                onChange={(e) =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    adjustments: {
                      ...prev.adjustments,
                      textClarity: e.target.checked,
                    },
                  }))
                }
                className="accent-black rounded"
              />
            </div>
            <p className="text-[8.5px] text-pink-600 leading-tight">
              Binarizes anti-aliased font halos and sharpens strokes so &ldquo;MADE IN MOROCCO&rdquo; letters remain clear and solid.
            </p>

            <div className="pt-2 border-t border-pink-200 flex flex-col space-y-1">
              <label className="flex items-center gap-2 text-[10px] text-pink-900 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.adjustments.cleanSolidFills ?? true}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      adjustments: {
                        ...prev.adjustments,
                        cleanSolidFills: e.target.checked,
                      },
                    }))
                  }
                  className="accent-black rounded"
                />
                <span>Clean texture noise in text boxes</span>
              </label>

              <label className="flex items-center gap-2 text-[10px] text-pink-900 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  id="auto-crop-margin-checkbox"
                  checked={settings.autoCropMargin ?? false}
                  onChange={(e) =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      autoCropMargin: e.target.checked,
                    }))
                  }
                  className="accent-black rounded"
                />
                <span>Auto-crop outer white margin (fills grid)</span>
              </label>
            </div>
          </div>
          {/* Continuous Pattern Size Slider + Dropdown Combo Container */}
          <div className="p-3.5 border-2 border-pink-800 rounded-xl bg-rose-50 space-y-2.5 shadow-xs">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="pattern-width-input"
                  className="text-[10px] uppercase font-bold tracking-wider text-pink-900 flex items-center gap-1.5"
                >
                  <Grid className="w-3.5 h-3.5 text-pink-900" />
                  <span>Pattern Width</span>
                </label>
                <span className="text-[9px] font-mono uppercase font-bold text-pink-500">
                  10–150 Range
                </span>
              </div>

              {/* Dropdown + Number Input Combo Row */}
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <input
                    id="pattern-width-input"
                    type="number"
                    min="10"
                    max="150"
                    value={settings.gridWidth}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        const clamped = Math.max(10, Math.min(150, val));
                        if (onSetGridWidth) {
                          onSetGridWidth(clamped);
                        } else {
                          onUpdateSettings((prev) => ({
                            ...prev,
                            gridWidth: clamped,
                          }));
                        }
                      }
                    }}
                    className="w-full bg-white border border-pink-800 rounded px-2.5 py-1.5 text-xs font-mono font-bold text-pink-900 focus:outline-none focus:ring-1 focus:ring-black pr-16"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono uppercase text-pink-500 pointer-events-none font-bold">
                    STITCHES
                  </span>
                </div>

                <select
                  aria-label="Preset Grid Sizes"
                  value={
                    PRESET_SIZES.some((p) => p.value === settings.gridWidth)
                      ? settings.gridWidth
                      : 'custom'
                  }
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      if (onSetGridWidth) {
                        onSetGridWidth(val);
                      } else {
                        onUpdateSettings((prev) => ({
                          ...prev,
                          gridWidth: val,
                        }));
                      }
                    }
                  }}
                  className="w-28 bg-white border border-pink-800 rounded px-2 py-1.5 text-[11px] font-bold text-pink-900 focus:outline-none cursor-pointer"
                >
                  <option value="custom" disabled>
                    Presets...
                  </option>
                  {PRESET_SIZES.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Continuous Horizontal Slider */}
            <div>
              <input
                id="pattern-size-slider"
                type="range"
                min="10"
                max="150"
                step="1"
                value={settings.gridWidth}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value, 10);
                  if (onSetGridWidth) {
                    onSetGridWidth(newWidth);
                  } else {
                    onUpdateSettings((prev) => ({
                      ...prev,
                      gridWidth: newWidth,
                    }));
                  }
                }}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-pink-400 font-mono mt-0.5">
                <span>10</span>
                <span>29 (1 board)</span>
                <span>58 (4)</span>
                <span>87 (9)</span>
                <span>116 (16)</span>
                <span>150</span>
              </div>
            </div>

            {/* Live Text: Beads & Pegboards */}
            <div className="p-2 bg-white rounded border border-pink-200 text-center">
              <div className="font-mono text-xs font-bold text-pink-900">
                {currentGridWidth} × {currentGridHeight} beads
              </div>
              <div className="text-[10px] text-pink-500 font-mono">
                ~{totalPegboards} {totalPegboards === 1 ? 'standard pegboard' : 'standard pegboards'} (29×29)
              </div>
            </div>

            {/* Finished Size Readout with Unit Toggle */}
            <div className="pt-2 border-t border-pink-800/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-pink-900 flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-pink-900" />
                  <span>Finished Size</span>
                </span>

                <div className="flex border border-pink-800 rounded overflow-hidden text-[9px] font-mono font-bold">
                  <button
                    onClick={() => setSizeUnit('in')}
                    className={`px-2 py-0.5 cursor-pointer transition-colors ${
                      sizeUnit === 'in'
                        ? 'bg-pink-800 text-white'
                        : 'bg-white text-pink-900 hover:bg-rose-100'
                    }`}
                  >
                    IN
                  </button>
                  <button
                    onClick={() => setSizeUnit('cm')}
                    className={`px-2 py-0.5 cursor-pointer transition-colors ${
                      sizeUnit === 'cm'
                        ? 'bg-pink-800 text-white'
                        : 'bg-white text-pink-900 hover:bg-rose-100'
                    }`}
                  >
                    CM
                  </button>
                </div>
              </div>

              <div className="text-[11px] font-mono bg-white px-2.5 py-1.5 rounded border border-pink-200 flex items-center justify-between">
                <span className="text-pink-500 text-[10px]">Real Dimension:</span>
                <span className="font-bold text-pink-900">
                  ≈ {sizeUnit === 'in' ? `${widthInInches} × ${heightInInches} in` : `${widthInCm} × ${heightInCm} cm`}
                </span>
              </div>
            </div>

            {/* Board Fitting & Aspect Ratio Controls */}
            <div className="pt-2 border-t border-pink-200 space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-pink-900 flex items-center justify-between">
                <span>Board Fit Mode</span>
                <span className="text-[8.5px] font-mono text-pink-500 font-normal">
                  {settings.fitMode === 'contain'
                    ? 'Square Centered (No Squish)'
                    : settings.fitMode === 'stretch'
                    ? 'Stretched'
                    : 'Natural Ratio'}
                </span>
              </label>

              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  id="fit-mode-contain-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      fitMode: 'contain',
                      preserveAspectRatio: true,
                    }))
                  }
                  className={`py-1 px-1.5 rounded border text-[9.5px] font-bold text-center cursor-pointer transition-all ${
                    (settings.fitMode ?? 'contain') === 'contain'
                      ? 'bg-pink-800 text-white border-pink-800 shadow-2xs'
                      : 'bg-white text-pink-900 border-pink-800/20 hover:border-pink-800'
                  }`}
                  title="Centers rectangular image inside square 52x52 grid without squishing"
                >
                  Square Fit
                </button>

                <button
                  type="button"
                  id="fit-mode-natural-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      fitMode: 'natural',
                      preserveAspectRatio: true,
                    }))
                  }
                  className={`py-1 px-1.5 rounded border text-[9.5px] font-bold text-center cursor-pointer transition-all ${
                    settings.fitMode === 'natural'
                      ? 'bg-pink-800 text-white border-pink-800 shadow-2xs'
                      : 'bg-white text-pink-900 border-pink-800/20 hover:border-pink-800'
                  }`}
                  title="Shrinks height proportionally to image ratio (e.g. 52x29)"
                >
                  Natural
                </button>

                <button
                  type="button"
                  id="fit-mode-stretch-btn"
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      fitMode: 'stretch',
                      preserveAspectRatio: false,
                    }))
                  }
                  className={`py-1 px-1.5 rounded border text-[9.5px] font-bold text-center cursor-pointer transition-all ${
                    settings.fitMode === 'stretch'
                      ? 'bg-pink-800 text-white border-pink-800 shadow-2xs'
                      : 'bg-white text-pink-900 border-pink-800/20 hover:border-pink-800'
                  }`}
                  title="Stretches to fill entire square grid"
                >
                  Stretch
                </button>
              </div>
            </div>
          </div>

          {/* Max Color Palette Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label
                htmlFor="max-colors-slider"
                className="text-[10px] uppercase font-bold tracking-wider text-pink-900"
              >
                Max Colors Palette
              </label>
              <div className="flex items-center gap-1.5">
                {userSetMaxColors ? (
                  <button
                    type="button"
                    onClick={onResetMaxColorsAuto}
                    className="text-[8.5px] font-mono text-pink-500 hover:text-pink-900 underline cursor-pointer"
                    title="Reset to auto-scale based on grid size"
                  >
                    Auto-Scale
                  </button>
                ) : (
                  <span className="text-[8.5px] font-mono text-pink-700 bg-pink-50 px-1 rounded border border-pink-200">
                    Auto
                  </span>
                )}
                <span className="font-mono text-xs font-bold bg-pink-800 text-white px-1.5 py-0.5 rounded text-[10px]">
                  {settings.maxColors}
                </span>
              </div>
            </div>
            <input
              id="max-colors-slider"
              type="range"
              min="5"
              max="50"
              step="1"
              value={settings.maxColors}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (onSetMaxColors) {
                  onSetMaxColors(val);
                } else {
                  onUpdateSettings((prev) => ({
                    ...prev,
                    maxColors: val,
                  }));
                }
              }}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-pink-400 font-mono">
              <span>5 (MIN)</span>
              <span>25</span>
              <span>50 (MAX)</span>
            </div>
          </div>

          {/* Dithering Mode Selector */}
            <div className="p-3 border border-pink-200 rounded-lg bg-rose-50 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Dithering Engine
                </span>
                <span className="text-[9px] text-pink-500">
                  {settings.dithering ? 'Gradient diffusion enabled' : 'Clean / Posterized pixel art'}
                </span>
              </div>
              <button
                type="button"
                id="dithering-toggle"
                onClick={() =>
                  onUpdateSettings((prev) => ({
                    ...prev,
                    dithering: !prev.dithering,
                  }))
                }
                className={`w-10 h-5 rounded-full relative p-0.5 transition-colors cursor-pointer ${
                  settings.dithering ? 'bg-pink-800' : 'bg-rose-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.dithering ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.dithering && (
              <div className="space-y-2 pt-2 border-t border-pink-200">
                <div>
                  <label className="text-[9px] uppercase font-bold text-pink-600 block mb-1">
                    Dither Algorithm
                  </label>
                  <select
                    value={settings.ditherType || 'floyd-steinberg'}
                    onChange={(e) => {
                      const dType = e.target.value as DitherType;
                      onUpdateSettings((prev) => ({
                        ...prev,
                        ditherType: dType,
                      }));
                    }}
                    className="w-full bg-white border border-pink-300 rounded px-2 py-1 text-xs font-bold text-pink-900 focus:outline-none"
                  >
                    <option value="floyd-steinberg">Floyd–Steinberg (Smooth Blend)</option>
                    <option value="atkinson">Atkinson (Crisp Outlines • MakeBead)</option>
                    <option value="burkes">Burkes (Silky Gradient Diffusion)</option>
                    <option value="bayer">Bayer 4×4 Matrix (Retro Crosshatch)</option>
                  </select>
                </div>

                {/* Dither Intensity Slider */}
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-pink-600 mb-0.5">
                    <span>Dither Intensity</span>
                    <span className="font-mono">{settings.ditherStrength ?? 75}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.ditherStrength ?? 75}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        ditherStrength: val,
                      }));
                    }}
                    className="w-full accent-black cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advanced MakeBead Quality Engine (CIEDE2000, Sharpness, Edge Clarity) */}
          <div className="border border-pink-800/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAdvancedEngine((prev) => !prev)}
              className="w-full px-3 py-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-900" />
                <span>Color Science & Clarity</span>
              </div>
              {showAdvancedEngine ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdvancedEngine && (
              <div className="p-3 border-t border-pink-800/10 space-y-2.5 bg-rose-50">
                {/* Color Matching Algorithm */}
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-bold text-pink-700 block mb-1">
                    Color Matching Metric
                  </label>
                  <select
                    value={settings.matchingAlgorithm || 'ciede2000'}
                    onChange={(e) => {
                      const algo = e.target.value as ColorMatchingAlgorithm;
                      onUpdateSettings((prev) => ({
                        ...prev,
                        matchingAlgorithm: algo,
                      }));
                    }}
                    className="w-full bg-white border border-pink-300 rounded px-2 py-1 text-xs font-bold text-pink-900 focus:outline-none cursor-pointer"
                  >
                    <option value="ciede2000">CIEDE2000 (Perceptual Gold Standard)</option>
                    <option value="weighted_rgb">Weighted RGB (Pixel Art & Sprites)</option>
                    <option value="cie76">CIE76 (Standard Lab Distance)</option>
                  </select>
                  <p className="text-[8.5px] text-pink-500 mt-1 leading-tight">
                    {settings.matchingAlgorithm === 'weighted_rgb'
                      ? 'Emphasizes high-contrast pixel boundaries for sprites.'
                      : 'CIEDE2000 accurately preserves skin tones and subtle anime gradients.'}
                  </p>
                </div>

                {/* Edge Sharpness / Clarity Filter */}
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-pink-700 mb-1">
                    <span>Edge Crispness (Unsharp Mask)</span>
                    <span className="font-mono">{settings.adjustments.sharpness ?? 25}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.adjustments.sharpness ?? 25}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onUpdateSettings((prev) => ({
                        ...prev,
                        adjustments: {
                          ...prev.adjustments,
                          sharpness: val,
                        },
                      }));
                    }}
                    className="w-full accent-black cursor-pointer"
                  />
                  <p className="text-[8.5px] text-pink-500 mt-0.5">
                    Sharpens facial outlines and small details before bead quantization.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Background Color Removal Collapsible */}
          <div className="border border-pink-800/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowBgRemoval((prev) => !prev)}
              className="w-full px-3 py-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-pink-900" />
                <span>Remove Background Color</span>
              </div>
              {showBgRemoval ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showBgRemoval && (
              <div className="p-3 border-t border-pink-800/10 space-y-2.5 bg-rose-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-pink-900">
                    Enable Transparent Mask
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.bgRemoval.enabled}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        bgRemoval: {
                          ...prev.bgRemoval,
                          enabled: e.target.checked,
                          targetColor: prev.bgRemoval.targetColor || [255, 255, 255],
                        },
                      }))
                    }
                    className="accent-black rounded"
                  />
                </div>

                <div>
                  <label className="text-[9px] uppercase tracking-wider font-bold text-pink-600 block mb-1">
                    Target Background Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={
                        settings.bgRemoval.targetColor
                          ? `#${settings.bgRemoval.targetColor
                              .map((v) => v.toString(16).padStart(2, '0'))
                              .join('')}`
                          : '#ffffff'
                      }
                      onChange={(e) => {
                        const hex = e.target.value.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        onUpdateSettings((prev) => ({
                          ...prev,
                          bgRemoval: {
                            ...prev.bgRemoval,
                            enabled: true,
                            targetColor: [r, g, b],
                          },
                        }));
                      }}
                      className="w-8 h-8 rounded border border-pink-800 cursor-pointer p-0"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            bgRemoval: {
                              ...prev.bgRemoval,
                              enabled: true,
                              targetColor: [255, 255, 255],
                            },
                          }))
                        }
                        className="px-2 py-1 text-[9px] font-mono border border-pink-800/20 bg-white rounded hover:bg-pink-800 hover:text-white cursor-pointer"
                      >
                        White
                      </button>
                      <button
                        onClick={() =>
                          onUpdateSettings((prev) => ({
                            ...prev,
                            bgRemoval: {
                              ...prev.bgRemoval,
                              enabled: true,
                              targetColor: [0, 0, 0],
                            },
                          }))
                        }
                        className="px-2 py-1 text-[9px] font-mono border border-pink-800/20 bg-white rounded hover:bg-pink-800 hover:text-white cursor-pointer"
                      >
                        Black
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-pink-600 mb-1">
                    <span>Removal Tolerance</span>
                    <span className="font-mono">{settings.bgRemoval.tolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="80"
                    value={settings.bgRemoval.tolerance}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        bgRemoval: {
                          ...prev.bgRemoval,
                          tolerance: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Image Adjustments Collapsible */}
          <div className="border border-pink-800/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAdjustments((prev) => !prev)}
              className="w-full px-3 py-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-pink-900" />
                <span>Adjust Image Exposure</span>
              </div>
              {showAdjustments ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdjustments && (
              <div className="p-3 border-t border-pink-200 space-y-2.5 bg-rose-50">
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-pink-600 mb-1">
                    <span>Brightness</span>
                    <span className="font-mono">{settings.adjustments.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={settings.adjustments.brightness}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        adjustments: {
                          ...prev.adjustments,
                          brightness: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-pink-600 mb-1">
                    <span>Contrast</span>
                    <span className="font-mono">{settings.adjustments.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={settings.adjustments.contrast}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        adjustments: {
                          ...prev.adjustments,
                          contrast: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-pink-600 mb-1">
                    <span>Saturation</span>
                    <span className="font-mono">{settings.adjustments.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={settings.adjustments.saturation}
                    onChange={(e) =>
                      onUpdateSettings((prev) => ({
                        ...prev,
                        adjustments: {
                          ...prev.adjustments,
                          saturation: parseInt(e.target.value, 10),
                        },
                      }))
                    }
                    className="w-full accent-black cursor-pointer"
                  />
                </div>

                <button
                  onClick={() =>
                    onUpdateSettings((prev) => ({
                      ...prev,
                      adjustments: { brightness: 0, contrast: 0, saturation: 0, sharpness: 25 },
                    }))
                  }
                  className="w-full py-1 text-[9px] font-mono uppercase text-pink-500 hover:text-pink-900 border border-pink-800/10 hover:border-pink-800 rounded bg-white transition-colors cursor-pointer"
                >
                  Reset Exposure
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 03. PATTERN EDITING TOOLBOX */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-pink-400">
            03. Editor Toolbox
          </p>
          <div className="flex items-center gap-1">
            <button
              id="undo-btn"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1 border border-pink-800/20 hover:border-pink-800 rounded disabled:opacity-30 transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3 h-3 text-pink-900" />
            </button>
            <button
              id="redo-btn"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1 border border-pink-800/20 hover:border-pink-800 rounded disabled:opacity-30 transition-colors cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3 h-3 text-pink-900" />
            </button>
          </div>
        </div>

        {/* Tool Selector Grid */}
        <div className="grid grid-cols-5 gap-1.5 mb-2.5">
          <button
            id="tool-paint-btn"
            onClick={() => onSelectTool('paint')}
            className={`p-1.5 border rounded flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'paint'
                ? 'bg-pink-800 border-pink-800 text-white'
                : 'bg-white border-pink-800/20 hover:border-pink-800 text-pink-900'
            }`}
            title="Single Bead Pen (P)"
          >
            <Paintbrush className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">Pen</span>
          </button>

          <button
            id="tool-fill-btn"
            onClick={() => onSelectTool('fill')}
            className={`p-1.5 border rounded flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'fill'
                ? 'bg-pink-800 border-pink-800 text-white'
                : 'bg-white border-pink-800/20 hover:border-pink-800 text-pink-900'
            }`}
            title="Flood Bucket (F)"
          >
            <PaintBucket className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">Fill</span>
          </button>

          <button
            id="tool-eyedropper-btn"
            onClick={() => onSelectTool('eyedropper')}
            className={`p-1.5 border rounded flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'eyedropper'
                ? 'bg-pink-800 border-pink-800 text-white'
                : 'bg-white border-pink-800/20 hover:border-pink-800 text-pink-900'
            }`}
            title="Eyedropper Color Pick (E)"
          >
            <Pipette className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">Pick</span>
          </button>

          <button
            id="tool-text-btn"
            onClick={() => onSelectTool('text')}
            className={`p-1.5 border rounded flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'text'
                ? 'bg-pink-800 border-pink-800 text-white'
                : 'bg-white border-pink-800/20 hover:border-pink-800 text-pink-900'
            }`}
            title="Direct Pixel Text & Lettering Tool (T)"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">Text</span>
          </button>

          <button
            id="tool-replace-btn"
            onClick={onOpenReplaceModal}
            className="p-1.5 border border-pink-800/20 hover:border-pink-800 rounded flex flex-col items-center justify-center gap-1 bg-white text-pink-900 transition-all cursor-pointer"
            title="Replace Color Across Whole Board (R)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">Swap</span>
          </button>
        </div>

        {/* Active Color Banner */}
        <div className="p-4 border-2 border-pink-800 rounded-lg bg-white flex items-center justify-between mb-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border-2 border-pink-800 shadow-xs flex items-center justify-center shrink-0 font-mono text-[9px] font-bold transition-all hover:scale-110"
              style={{
                backgroundColor: activeColor.hex,
                color: (activeColor.rgb[0] * 299 + activeColor.rgb[1] * 587 + activeColor.rgb[2] * 114) / 1000 < 135 ? '#fff' : '#000',
              }}
            >
              {activeColor.code || ''}
            </div>
            <div className="flex-1">
              <div className="text-[9px] uppercase font-mono text-pink-500 flex items-center gap-1">
                <span>Brush</span>
                {activeColor.series && (
                  <span className="bg-pink-800 text-white px-1.5 rounded text-[8px] font-bold">
                    {activeColor.series}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-pink-900 truncate max-w-[140px]">
                {activeColor.name}
              </div>
              <div className="text-[9px] font-mono text-pink-600 font-bold">
                {activeColor.hex}
              </div>
            </div>
          </div>
        </div>

        {/* Brand Palette Swatches & Search */}
        <div>
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-pink-400" />
            <input
              type="text"
              placeholder={`Search ${BRAND_INFO[settings.brand]?.name} (${activeBrandPalette.length})...`}
              value={paletteSearch}
              onChange={(e) => setPaletteSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-pink-800/20 rounded text-xs focus:outline-none focus:border-pink-800"
            />
          </div>

          {/* Filter Bar: Used on Board Toggle & MARD Series Selector */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setOnlyUsedOnBoard((prev) => !prev)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 cursor-pointer transition-colors ${
                onlyUsedOnBoard
                  ? 'bg-pink-800 text-white border-pink-800 font-bold'
                  : 'bg-white text-pink-900 border-pink-800/20 hover:border-pink-800'
              }`}
            >
              <Layers className="w-2.5 h-2.5" />
              <span>Used on Board ({usedColorIds.size})</span>
            </button>
            <span className="text-[9px] font-mono text-pink-400 bg-rose-50 px-2 py-0.5 rounded border border-pink-200">
              {filteredColors.length} color{filteredColors.length !== 1 ? 's' : ''} found
            </span>
          </div>

          {/* MARD Series Quick Pills */}
          {isMardActive && (
            <div className="mb-2">
              <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedMardSeries('all')}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono border whitespace-nowrap cursor-pointer transition-colors ${
                    selectedMardSeries === 'all'
                      ? 'bg-pink-800 text-white border-pink-800 font-bold'
                      : 'bg-white text-pink-900 border-pink-800/20 hover:border-pink-800'
                  }`}
                >
                  All (221)
                </button>
                {MARD_SERIES_DEFINITIONS.map((s) => (
                  <button
                    key={s.seriesId}
                    onClick={() => setSelectedMardSeries(s.seriesId)}
                    title={`${s.name} (${s.count} colors)`}
                    className={`px-2 py-0.5 rounded text-[9px] font-mono border whitespace-nowrap cursor-pointer transition-colors ${
                      selectedMardSeries === s.seriesId
                        ? 'bg-pink-800 text-white border-pink-800 font-bold'
                        : 'bg-white text-pink-900 border-pink-800/20 hover:border-pink-800'
                    }`}
                  >
                    {s.seriesId} {s.name.slice(0, 2)} ({s.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Grid with High-Contrast MARD Codes */}
          {filteredColors.length > 0 ? (
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-52 overflow-y-auto p-1.5 bg-rose-50 border border-pink-200 rounded animate-fade-in">
              {filteredColors.map((color) => {
                const isSelected = activeColor.id === color.id;
                const isDark = (color.rgb[0] * 299 + color.rgb[1] * 587 + color.rgb[2] * 114) / 1000 < 135;
                const isUsed = usedColorIds.has(color.id);

                return (
                  <button
                    key={color.id}
                    onClick={() => onSelectColor(color)}
                    title={`${color.name} (${color.code || color.hex})${
                      color.series ? ` · ${color.series}` : ''
                    }${isUsed ? ' • [On Canvas]' : ''}`}
                    className={`h-8 rounded-lg border transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden group ${
                      isSelected
                        ? 'border-pink-800 ring-2 ring-black scale-105 z-10 shadow-md'
                        : 'border-pink-800/30 hover:scale-110 hover:shadow-sm hover:border-pink-800'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <span
                      className="font-mono text-[8.5px] font-bold leading-none select-none group-hover:opacity-80 transition-opacity"
                      style={{ color: isDark ? '#FFFFFF' : '#111111' }}
                    >
                      {color.code || color.hex.slice(1, 4)}
                    </span>
                    {isUsed && (
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isDark ? 'bg-pink-200' : 'bg-pink-800'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 bg-rose-50 border border-pink-200 rounded text-center flex flex-col items-center justify-center min-h-32">
              <Search className="w-5 h-5 text-pink-400 mb-2" />
              <p className="text-xs font-bold text-pink-600 mb-1">No colors found</p>
              <p className="text-[9px] text-pink-500">Try a different search or filter</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
