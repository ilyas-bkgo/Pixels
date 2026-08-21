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
    <aside className="w-72 sm:w-84 border-r border-black flex flex-col p-5 sm:p-6 space-y-6 bg-white overflow-y-auto shrink-0 select-none">
      {/* 01. SOURCE & BRAND PALETTE */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
            01. Bead Brand & Source
          </p>
          {activeImage && (
            <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Active
            </span>
          )}
        </div>

        {/* Brand Palette Switcher with MARD 221 Star Styling */}
        <div className="mb-4">
          <label className="text-[10px] uppercase font-bold tracking-wider text-black flex items-center justify-between mb-1">
            <span className="flex items-center gap-1">
              <span>Bead Brand Palette</span>
              {isMardActive && (
                <span className="text-[8px] bg-black text-amber-300 px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-amber-300" /> MAIN
                </span>
              )}
            </span>
            <span className="text-[9px] font-mono text-gray-500 font-bold">
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
                ? 'border-black bg-neutral-900 text-white font-mono'
                : 'border-black bg-[#FAF9F6] text-black'
            }`}
          >
            <option value="mard">★ MARD 221 (Asian Standard • 221 Colors)</option>
            <option value="perler">Perler Beads (USA Standard • 65 Colors)</option>
            <option value="hama">Hama Beads (Danish Midi • 57 Colors)</option>
            <option value="artkal">Artkal Beads (S-Series • 50 Colors)</option>
            <option value="nabbi">Nabbi / Fuse (Nordic • 25 Colors)</option>
          </select>
          <p className="text-[9px] text-gray-500 mt-1 leading-tight">
            {BRAND_INFO[settings.brand]?.description}
          </p>

          {/* MARD Reference Notice */}
          {isMardActive && (
            <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-950 text-[10px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block uppercase tracking-wider text-[9px] text-blue-900">
                  MARD 221 Engine Active
                </span>
                <span className="leading-tight block text-blue-800">
                  9 full color series (A1-M15) loaded with CIEDE2000 precision color matching for skin, anime, and gradient artwork.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Source Image Preview (if image loaded) */}
        {activeImage ? (
          <div className="border-2 border-black rounded-xl p-3.5 bg-[#FAF9F6] space-y-3 mb-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white border border-black rounded-lg overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                <img
                  src={activeImage.src}
                  alt="Source"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-black truncate">
                  Source Loaded
                </div>
                <div className="text-[10px] font-mono text-gray-500">
                  {activeImage.naturalWidth} × {activeImage.naturalHeight} px
                </div>
                <div className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <Check className="w-3 h-3" /> {BRAND_INFO[settings.brand]?.name} ({activeBrandPalette.length}c)
                </div>
              </div>
            </div>

            {/* Re-convert / Update Action Button */}
            <button
              id="convert-pattern-btn"
              onClick={handleManualConvert}
              className={`w-full py-2 px-3 border border-black rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                justConverted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black hover:bg-neutral-800 text-white'
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
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-black bg-neutral-100 scale-[1.01]'
              : 'border-black/30 hover:border-black bg-[#FAF9F6]'
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
          <div className="flex flex-col items-center space-y-1.5">
            <div className="w-8 h-8 rounded-full border border-black flex items-center justify-center bg-white shadow-xs">
              <Upload className="w-4 h-4 text-black" />
            </div>
            <p className="text-xs font-bold text-[#1A1A1A]">
              {activeImage ? 'Upload Different Image' : 'Drop Image Here'}
            </p>
            <p className="text-[10px] text-gray-500">
              PNG, JPG, WebP (client-side only)
            </p>
          </div>
        </div>
      </div>

      {/* 02. PATTERN SIZE & CONVERTER QUALITY (MakeBead Engine) */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] mb-3 font-bold text-gray-400">
          02. Pattern Size & Quality Engine
        </p>

        <div className="space-y-4">
          {/* One-Click Presets Bar */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider text-black block mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Conversion Preset</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="preset-text-logo-btn"
                onClick={() => applyPreset('text-logo')}
                className={`p-2 border rounded-lg text-left transition-all cursor-pointer ${
                  settings.presetMode === 'text-logo'
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-[#FAF9F6] text-black border-black/20 hover:border-black'
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
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-[#FAF9F6] text-black border-black/20 hover:border-black'
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
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-[#FAF9F6] text-black border-black/20 hover:border-black'
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
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-[#FAF9F6] text-black border-black/20 hover:border-black'
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
                  ? 'bg-black text-white border-black shadow-sm'
                  : 'bg-amber-50 text-black border-amber-400 hover:border-black'
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
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-400/30 text-current">
                52×52
              </span>
            </button>
          </div>

          {/* Lettering & Graphic Clarity Optimization Panel */}
          <div className="p-3 border-2 border-black rounded-xl bg-amber-50/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                <span>Lettering & Text Clarity</span>
                <span className="text-[8px] bg-black text-amber-300 px-1 py-0.2 rounded font-mono font-bold">
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
            <p className="text-[8.5px] text-gray-600 leading-tight">
              Binarizes anti-aliased font halos and sharpens strokes so &ldquo;MADE IN MOROCCO&rdquo; letters remain clear and solid.
            </p>

            <div className="pt-2 border-t border-black/10 flex flex-col space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] text-black font-semibold cursor-pointer">
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

              <label className="flex items-center gap-2 text-[10px] text-black font-semibold cursor-pointer">
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
          <div className="p-3.5 border-2 border-black rounded-xl bg-[#FAF9F6] space-y-3 shadow-xs">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  htmlFor="pattern-width-input"
                  className="text-[10px] uppercase font-bold tracking-wider text-black flex items-center gap-1.5"
                >
                  <Grid className="w-3.5 h-3.5 text-black" />
                  <span>Pattern Width</span>
                </label>
                <span className="text-[9px] font-mono uppercase font-bold text-gray-500">
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
                    className="w-full bg-white border border-black rounded px-2.5 py-1.5 text-xs font-mono font-bold text-black focus:outline-none focus:ring-1 focus:ring-black pr-16"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono uppercase text-gray-500 pointer-events-none font-bold">
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
                  className="w-28 bg-white border border-black rounded px-2 py-1.5 text-[11px] font-bold text-black focus:outline-none cursor-pointer"
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
              <div className="flex justify-between text-[9px] text-gray-400 font-mono mt-0.5">
                <span>10</span>
                <span>29 (1 board)</span>
                <span>58 (4)</span>
                <span>87 (9)</span>
                <span>116 (16)</span>
                <span>150</span>
              </div>
            </div>

            {/* Live Text: Beads & Pegboards */}
            <div className="p-2 bg-white rounded border border-black/10 text-center">
              <div className="font-mono text-xs font-bold text-black">
                {currentGridWidth} × {currentGridHeight} beads
              </div>
              <div className="text-[10px] text-gray-500 font-mono">
                ~{totalPegboards} {totalPegboards === 1 ? 'standard pegboard' : 'standard pegboards'} (29×29)
              </div>
            </div>

            {/* Finished Size Readout with Unit Toggle */}
            <div className="pt-2 border-t border-black/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-black flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-black" />
                  <span>Finished Size</span>
                </span>

                <div className="flex border border-black rounded overflow-hidden text-[9px] font-mono font-bold">
                  <button
                    onClick={() => setSizeUnit('in')}
                    className={`px-2 py-0.5 cursor-pointer transition-colors ${
                      sizeUnit === 'in'
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    IN
                  </button>
                  <button
                    onClick={() => setSizeUnit('cm')}
                    className={`px-2 py-0.5 cursor-pointer transition-colors ${
                      sizeUnit === 'cm'
                        ? 'bg-black text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    CM
                  </button>
                </div>
              </div>

              <div className="text-[11px] font-mono bg-white px-2.5 py-1.5 rounded border border-black/10 flex items-center justify-between">
                <span className="text-gray-500 text-[10px]">Real Dimension:</span>
                <span className="font-bold text-black">
                  ≈ {sizeUnit === 'in' ? `${widthInInches} × ${heightInInches} in` : `${widthInCm} × ${heightInCm} cm`}
                </span>
              </div>
            </div>

            {/* Board Fitting & Aspect Ratio Controls */}
            <div className="pt-2 border-t border-black/10 space-y-1.5">
              <label className="text-[10px] uppercase font-bold tracking-wider text-black flex items-center justify-between">
                <span>Board Fit Mode</span>
                <span className="text-[8.5px] font-mono text-gray-500 font-normal">
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
                      ? 'bg-black text-white border-black shadow-2xs'
                      : 'bg-white text-black border-black/20 hover:border-black'
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
                      ? 'bg-black text-white border-black shadow-2xs'
                      : 'bg-white text-black border-black/20 hover:border-black'
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
                      ? 'bg-black text-white border-black shadow-2xs'
                      : 'bg-white text-black border-black/20 hover:border-black'
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
                className="text-[10px] uppercase font-bold tracking-wider text-black"
              >
                Max Colors Palette
              </label>
              <div className="flex items-center gap-1.5">
                {userSetMaxColors ? (
                  <button
                    type="button"
                    onClick={onResetMaxColorsAuto}
                    className="text-[8.5px] font-mono text-gray-500 hover:text-black underline cursor-pointer"
                    title="Reset to auto-scale based on grid size"
                  >
                    Auto-Scale
                  </button>
                ) : (
                  <span className="text-[8.5px] font-mono text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-200">
                    Auto
                  </span>
                )}
                <span className="font-mono text-xs font-bold bg-black text-white px-1.5 py-0.5 rounded text-[10px]">
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
            <div className="flex justify-between text-[9px] text-gray-400 font-mono">
              <span>5 (MIN)</span>
              <span>25</span>
              <span>50 (MAX)</span>
            </div>
          </div>

          {/* Dithering Mode Selector */}
          <div className="p-3 border border-black/20 rounded-lg bg-[#FAF9F6] space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block">
                  Dithering Engine
                </span>
                <span className="text-[9px] text-gray-500">
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
                  settings.dithering ? 'bg-black' : 'bg-gray-200'
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
              <div className="space-y-2 pt-2 border-t border-black/10">
                <div>
                  <label className="text-[9px] uppercase font-bold text-gray-600 block mb-1">
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
                    className="w-full bg-white border border-black/30 rounded px-2 py-1 text-xs font-bold text-black focus:outline-none"
                  >
                    <option value="floyd-steinberg">Floyd–Steinberg (Smooth Blend)</option>
                    <option value="atkinson">Atkinson (Crisp Outlines • MakeBead)</option>
                    <option value="burkes">Burkes (Silky Gradient Diffusion)</option>
                    <option value="bayer">Bayer 4×4 Matrix (Retro Crosshatch)</option>
                  </select>
                </div>

                {/* Dither Intensity Slider */}
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 mb-0.5">
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
          <div className="border border-black/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAdvancedEngine((prev) => !prev)}
              className="w-full px-3 py-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between hover:bg-[#FAF9F6] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Color Science & Clarity</span>
              </div>
              {showAdvancedEngine ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdvancedEngine && (
              <div className="p-3 border-t border-black/10 space-y-3 bg-[#FAF9F6]">
                {/* Color Matching Algorithm */}
                <div>
                  <label className="text-[9px] uppercase tracking-wider font-bold text-gray-700 block mb-1">
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
                    className="w-full bg-white border border-black/30 rounded px-2 py-1 text-xs font-bold text-black focus:outline-none cursor-pointer"
                  >
                    <option value="ciede2000">CIEDE2000 (Perceptual Gold Standard)</option>
                    <option value="weighted_rgb">Weighted RGB (Pixel Art & Sprites)</option>
                    <option value="cie76">CIE76 (Standard Lab Distance)</option>
                  </select>
                  <p className="text-[8.5px] text-gray-500 mt-1 leading-tight">
                    {settings.matchingAlgorithm === 'weighted_rgb'
                      ? 'Emphasizes high-contrast pixel boundaries for sprites.'
                      : 'CIEDE2000 accurately preserves skin tones and subtle anime gradients.'}
                  </p>
                </div>

                {/* Edge Sharpness / Clarity Filter */}
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-gray-700 mb-1">
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
                  <p className="text-[8.5px] text-gray-500 mt-0.5">
                    Sharpens facial outlines and small details before bead quantization.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Background Color Removal Collapsible */}
          <div className="border border-black/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowBgRemoval((prev) => !prev)}
              className="w-full px-3 py-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between hover:bg-[#FAF9F6] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-black" />
                <span>Remove Background Color</span>
              </div>
              {showBgRemoval ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showBgRemoval && (
              <div className="p-3 border-t border-black/10 space-y-3 bg-[#FAF9F6]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-black">
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
                  <label className="text-[9px] uppercase tracking-wider font-bold text-gray-600 block mb-1">
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
                      className="w-8 h-8 rounded border border-black cursor-pointer p-0"
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
                        className="px-2 py-1 text-[9px] font-mono border border-black/20 bg-white rounded hover:bg-black hover:text-white cursor-pointer"
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
                        className="px-2 py-1 text-[9px] font-mono border border-black/20 bg-white rounded hover:bg-black hover:text-white cursor-pointer"
                      >
                        Black
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 mb-1">
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
          <div className="border border-black/20 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowAdjustments((prev) => !prev)}
              className="w-full px-3 py-2 text-[10px] uppercase font-bold tracking-wider flex items-center justify-between hover:bg-[#FAF9F6] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
                <span>Adjust Image Exposure</span>
              </div>
              {showAdjustments ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdjustments && (
              <div className="p-3 border-t border-black/10 space-y-2.5 bg-[#FAF9F6]">
                <div>
                  <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 mb-1">
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
                  <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 mb-1">
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
                  <div className="flex justify-between text-[9px] uppercase font-bold text-gray-600 mb-1">
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
                  className="w-full py-1 text-[9px] font-mono uppercase text-gray-500 hover:text-black border border-black/10 hover:border-black rounded bg-white transition-colors cursor-pointer"
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
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
            03. Editor Toolbox
          </p>
          <div className="flex items-center gap-1">
            <button
              id="undo-btn"
              onClick={onUndo}
              disabled={!canUndo}
              className="p-1 border border-black/20 hover:border-black rounded disabled:opacity-30 transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-3 h-3 text-black" />
            </button>
            <button
              id="redo-btn"
              onClick={onRedo}
              disabled={!canRedo}
              className="p-1 border border-black/20 hover:border-black rounded disabled:opacity-30 transition-colors cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-3 h-3 text-black" />
            </button>
          </div>
        </div>

        {/* Tool Selector Grid */}
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          <button
            id="tool-paint-btn"
            onClick={() => onSelectTool('paint')}
            className={`p-1.5 border rounded flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
              activeTool === 'paint'
                ? 'bg-black border-black text-white'
                : 'bg-white border-black/20 hover:border-black text-black'
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
                ? 'bg-black border-black text-white'
                : 'bg-white border-black/20 hover:border-black text-black'
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
                ? 'bg-black border-black text-white'
                : 'bg-white border-black/20 hover:border-black text-black'
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
                ? 'bg-black border-black text-white'
                : 'bg-white border-black/20 hover:border-black text-black'
            }`}
            title="Direct Pixel Text & Lettering Tool (T)"
          >
            <Type className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">Text</span>
          </button>

          <button
            id="tool-replace-btn"
            onClick={onOpenReplaceModal}
            className="p-1.5 border border-black/20 hover:border-black rounded flex flex-col items-center justify-center gap-1 bg-white text-black transition-all cursor-pointer"
            title="Replace Color Across Whole Board (R)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[8.5px] font-bold uppercase tracking-wider">Swap</span>
          </button>
        </div>

        {/* Active Color Banner */}
        <div className="p-3 border border-black rounded-lg bg-[#FAF9F6] flex items-center justify-between mb-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full border-2 border-black shadow-xs flex items-center justify-center shrink-0 font-mono text-[9px] font-bold"
              style={{
                backgroundColor: activeColor.hex,
                color: (activeColor.rgb[0] * 299 + activeColor.rgb[1] * 587 + activeColor.rgb[2] * 114) / 1000 < 135 ? '#fff' : '#000',
              }}
            >
              {activeColor.code || ''}
            </div>
            <div>
              <div className="text-[9px] uppercase font-mono text-gray-500 flex items-center gap-1">
                <span>{BRAND_INFO[settings.brand]?.name}</span>
                {activeColor.series && (
                  <span className="bg-gray-200 text-gray-800 px-1 rounded text-[8px]">
                    {activeColor.series}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-black truncate max-w-[130px]">
                {activeColor.name}
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-[10px] text-gray-700 font-bold">
            {activeColor.hex}
          </div>
        </div>

        {/* Brand Palette Swatches & Search */}
        <div>
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${BRAND_INFO[settings.brand]?.name} (${activeBrandPalette.length})...`}
              value={paletteSearch}
              onChange={(e) => setPaletteSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-black/20 rounded text-xs focus:outline-none focus:border-black"
            />
          </div>

          {/* Filter Bar: Used on Board Toggle & MARD Series Selector */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setOnlyUsedOnBoard((prev) => !prev)}
              className={`px-2 py-0.5 rounded text-[9px] font-mono border flex items-center gap-1 cursor-pointer transition-colors ${
                onlyUsedOnBoard
                  ? 'bg-black text-white border-black font-bold'
                  : 'bg-white text-gray-700 border-black/20 hover:border-black'
              }`}
            >
              <Layers className="w-2.5 h-2.5" />
              <span>Used on Board ({usedColorIds.size})</span>
            </button>
            <span className="text-[9px] font-mono text-gray-400">
              Showing {filteredColors.length}
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
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-black border-black/20 hover:border-black'
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
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-white text-black border-black/20 hover:border-black'
                    }`}
                  >
                    {s.seriesId} {s.name.slice(0, 2)} ({s.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Grid with High-Contrast MARD Codes */}
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5 max-h-52 overflow-y-auto p-1.5 bg-[#FAF9F6] border border-black/20 rounded">
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
                  className={`h-8 rounded border transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden ${
                    isSelected
                      ? 'border-black ring-2 ring-black scale-105 z-10 shadow-xs'
                      : 'border-black/30 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                >
                  <span
                    className="font-mono text-[8.5px] font-bold leading-none select-none"
                    style={{ color: isDark ? '#FFFFFF' : '#111111' }}
                  >
                    {color.code || color.hex.slice(1, 4)}
                  </span>
                  {isUsed && (
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                        isDark ? 'bg-amber-300' : 'bg-black'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
