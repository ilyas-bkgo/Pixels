import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Hash,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  RotateCcw,
  Tag,
  Crosshair,
} from 'lucide-react';
import { BeadColor, PatternGrid, ToolType } from '../types';
import { COLOR_MAP, DEFAULT_BEAD_COLOR } from '../data/beadPalette';

interface PatternCanvasProps {
  grid: PatternGrid;
  activeColor: BeadColor;
  activeTool: ToolType;
  highlightedColorId: string | null;
  activeImage: HTMLImageElement | null;
  isCraftingMode: boolean;
  placedCells: Record<string, boolean>;
  showGridLines?: boolean;
  setShowGridLines?: React.Dispatch<React.SetStateAction<boolean>>;
  showNumbers?: boolean;
  setShowNumbers?: React.Dispatch<React.SetStateAction<boolean>>;
  onCellClick: (x: number, y: number) => void;
  onToggleCellPlaced: (x: number, y: number) => void;
  onSetCellPlaced?: (x: number, y: number, placed: boolean) => void;
  onPickColor: (color: BeadColor) => void;
  onCellHover?: (x: number, y: number, color: BeadColor | null) => void;
  textPreviewBitmap?: { width: number; height: number; pixels: boolean[][] } | null;
  onStampText?: (startX: number, startY: number) => void;
  onToggleCraftingMode: () => void;
  onResetCraftingProgress: () => void;
  onMarkAllPlaced: () => void;
}

export const PatternCanvas: React.FC<PatternCanvasProps> = ({
  grid,
  activeColor,
  activeTool,
  highlightedColorId,
  activeImage,
  isCraftingMode,
  placedCells,
  showGridLines: propShowGridLines,
  setShowGridLines: propSetShowGridLines,
  showNumbers: propShowNumbers,
  setShowNumbers: propSetShowNumbers,
  onCellClick,
  onToggleCellPlaced,
  onSetCellPlaced,
  onPickColor,
  onCellHover,
  textPreviewBitmap,
  onStampText,
  onToggleCraftingMode,
  onResetCraftingProgress,
  onMarkAllPlaced,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  // Spacebar pan tracking
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const isSpacePressedRef = useRef<boolean>(false);

  // Drag tracking for crafting mode and drawing
  const lastToggledCoordRef = useRef<{ x: number; y: number } | null>(null);
  const dragPlacementModeRef = useRef<boolean | null>(null);

  // View preferences
  const [localShowGridLines, setLocalShowGridLines] = useState<boolean>(false);
  const [localShowNumbers, setLocalShowNumbers] = useState<boolean>(false);
  const [showColorCodes, setShowColorCodes] = useState<boolean>(false);
  const [showOriginalOverlay, setShowOriginalOverlay] = useState<boolean>(false);

  const showGridLines = propShowGridLines !== undefined ? propShowGridLines : localShowGridLines;
  const setShowGridLines = propSetShowGridLines || setLocalShowGridLines;
  const showNumbers = propShowNumbers !== undefined ? propShowNumbers : localShowNumbers;
  const setShowNumbers = propSetShowNumbers || setLocalShowNumbers;

  const baseCellSize = 22;
  const numberMargin = showNumbers ? 26 : 0;

  // Spacebar hold listener for smooth intuitive canvas panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
        isSpacePressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isSpacePressedRef.current = false;
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Compute color counts for live hover inspection
  const colorFrequencyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const id = grid.cells[y]?.[x];
        if (id) {
          map.set(id, (map.get(id) || 0) + 1);
        }
      }
    }
    return map;
  }, [grid]);

  // Crafting progress metrics
  const totalValidBeads = useMemo(() => {
    let count = 0;
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.cells[y]?.[x] !== null && grid.cells[y]?.[x] !== undefined) {
          count++;
        }
      }
    }
    return count;
  }, [grid]);

  const totalPlacedCount = Object.keys(placedCells).length;
  const progressPercent = totalValidBeads > 0
    ? Math.min(100, Math.round((totalPlacedCount / totalValidBeads) * 100))
    : 0;

  // Render Grid onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const cellSize = baseCellSize;
    const totalW = numberMargin + grid.width * cellSize;
    const totalH = numberMargin + grid.height * cellSize;

    canvas.width = totalW;
    canvas.height = totalH;

    // Clear canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, totalW, totalH);

    // Coordinate Numbers Ruler (Top & Left)
    if (showNumbers) {
      ctx.fillStyle = '#fce7f3';
      ctx.fillRect(0, 0, totalW, numberMargin);
      ctx.fillRect(0, 0, numberMargin, totalH);

      ctx.fillStyle = '#be185d';
      ctx.textBaseline = 'middle';

      // Top X coordinates
      ctx.textAlign = 'center';
      for (let x = 0; x < grid.width; x++) {
        const isFive = (x + 1) % 5 === 0;
        const isEdge = x === 0 || x === grid.width - 1;
        if (isFive || isEdge) {
          const cx = numberMargin + x * cellSize + cellSize / 2;
          ctx.font = isFive ? 'bold 9px "Space Mono", monospace' : '8.5px "Space Mono", monospace';
          ctx.fillText(`${x + 1}`, cx, numberMargin / 2);
        }
      }

      // Left Y coordinates
      ctx.textAlign = 'right';
      for (let y = 0; y < grid.height; y++) {
        const isFive = (y + 1) % 5 === 0;
        const isEdge = y === 0 || y === grid.height - 1;
        if (isFive || isEdge) {
          const cy = numberMargin + y * cellSize + cellSize / 2;
          ctx.font = isFive ? 'bold 9px "Space Mono", monospace' : '8.5px "Space Mono", monospace';
          ctx.fillText(`${y + 1}`, numberMargin - 5, cy);
        }
      }
    }

    // Draw Beads
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        const colorId = grid.cells[y]?.[x];
        const px = numberMargin + x * cellSize;
        const py = numberMargin + y * cellSize;
        const cellKey = `${x},${y}`;
        const isPlaced = !!placedCells[cellKey];

        if (colorId === null || colorId === undefined) {
          // Empty pegboard peg
          ctx.fillStyle = '#fdf2f8';
          ctx.fillRect(px, py, cellSize, cellSize);

          const cx = px + cellSize / 2;
          const cy = py + cellSize / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, cellSize * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(190, 24, 93, 0.12)';
          ctx.fill();
          continue;
        }

        const bead = COLOR_MAP.get(colorId) || DEFAULT_BEAD_COLOR;
        const isHighlighted =
          highlightedColorId === null || highlightedColorId === colorId;

        ctx.save();
        if (!isHighlighted) {
          ctx.globalAlpha = 0.15;
        }

        ctx.fillStyle = bead.hex;
        ctx.fillRect(px, py, cellSize, cellSize);

        // Render Bead Code Badge (e.g. A14, H7, G1) if enabled
        if (showColorCodes && bead.code && (!isCraftingMode || !isPlaced)) {
          const isDark = (bead.rgb[0] * 299 + bead.rgb[1] * 587 + bead.rgb[2] * 114) / 1000 < 135;
          ctx.font = `bold ${Math.max(7, Math.floor(cellSize * 0.38))}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';
          ctx.fillText(bead.code, px + cellSize / 2, py + cellSize / 2 + 0.5);
        }

        // Crafting Mode Placed Marker
        if (isCraftingMode && isPlaced) {
          ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
          ctx.fillRect(px, py, cellSize, cellSize);

          const cx = px + cellSize / 2;
          const cy = py + cellSize / 2;
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(cx, cy, cellSize * 0.22, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 2.5, cy);
          ctx.lineTo(cx - 0.5, cy + 2);
          ctx.lineTo(cx + 2.5, cy - 2);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // Gridlines
    if (showGridLines) {
      for (let x = 0; x <= grid.width; x++) {
        const px = numberMargin + x * cellSize;
        const isPegboardBorder = x > 0 && x < grid.width && x % 29 === 0;
        const isMajor = x % 5 === 0;
        ctx.beginPath();
        ctx.moveTo(px, numberMargin);
        ctx.lineTo(px, totalH);
        if (isPegboardBorder) {
          ctx.strokeStyle = '#be185d'; // Pink pegboard board boundary
          ctx.lineWidth = 2.0;
        } else {
          ctx.strokeStyle = isMajor ? 'rgba(190, 24, 93, 0.45)' : 'rgba(190, 24, 93, 0.12)';
          ctx.lineWidth = isMajor ? 1.2 : 0.5;
        }
        ctx.stroke();
      }

      for (let y = 0; y <= grid.height; y++) {
        const py = numberMargin + y * cellSize;
        const isPegboardBorder = y > 0 && y < grid.height && y % 29 === 0;
        const isMajor = y % 5 === 0;
        ctx.beginPath();
        ctx.moveTo(numberMargin, py);
        ctx.lineTo(totalW, py);
        if (isPegboardBorder) {
          ctx.strokeStyle = '#be185d'; // Pink pegboard board boundary
          ctx.lineWidth = 2.0;
        } else {
          ctx.strokeStyle = isMajor ? 'rgba(190, 24, 93, 0.45)' : 'rgba(190, 24, 93, 0.12)';
          ctx.lineWidth = isMajor ? 1.2 : 0.5;
        }
        ctx.stroke();
      }
    }

    // Hover Cell Focus Frame or Ghost Text Stamp
    if (hoverCoord) {
      if (activeTool === 'text' && textPreviewBitmap && textPreviewBitmap.width > 0) {
        // Draw ghost preview of text bitmap
        const startX = hoverCoord.x;
        const startY = hoverCoord.y;

        // Bounding box
        const bboxX = numberMargin + startX * cellSize;
        const bboxY = numberMargin + startY * cellSize;
        const bboxW = textPreviewBitmap.width * cellSize;
        const bboxH = textPreviewBitmap.height * cellSize;

        ctx.strokeStyle = '#be185d';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(bboxX, bboxY, bboxW, bboxH);
        ctx.setLineDash([]);

        // Ghost pixels
        for (let dy = 0; dy < textPreviewBitmap.height; dy++) {
          for (let dx = 0; dx < textPreviewBitmap.width; dx++) {
            if (textPreviewBitmap.pixels[dy]?.[dx]) {
              const gx = startX + dx;
              const gy = startY + dy;
              if (gx < grid.width && gy < grid.height) {
                const px = numberMargin + gx * cellSize;
                const py = numberMargin + gy * cellSize;
                ctx.fillStyle = activeColor.hex;
                ctx.globalAlpha = 0.75;
                ctx.fillRect(px, py, cellSize, cellSize);

                // Small center bead dot
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
              }
            }
          }
        }
      } else {
        const hx = numberMargin + hoverCoord.x * cellSize;
        const hy = numberMargin + hoverCoord.y * cellSize;
        ctx.strokeStyle = isCraftingMode ? '#ec4899' : '#be185d';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx, hy, cellSize, cellSize);
      }
    }
  }, [
    grid,
    baseCellSize,
    numberMargin,
    showGridLines,
    showNumbers,
    showColorCodes,
    highlightedColorId,
    hoverCoord,
    isCraftingMode,
    placedCells,
    activeTool,
    textPreviewBitmap,
    activeColor,
  ]);

  const getGridCoord = (e: React.MouseEvent<HTMLElement> | MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    // Convert screen coordinates to canvas internal pixel coordinates (accounting for zoom/scale transforms & DPI)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const internalX = (e.clientX - rect.left) * scaleX;
    const internalY = (e.clientY - rect.top) * scaleY;

    const boardX = internalX - numberMargin;
    const boardY = internalY - numberMargin;

    if (boardX < 0 || boardY < 0) return null;

    const x = Math.floor(boardX / baseCellSize);
    const y = Math.floor(boardY / baseCellSize);

    if (x >= 0 && x < grid.width && y >= 0 && y < grid.height) {
      return { x, y };
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || isSpacePressedRef.current || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const coord = getGridCoord(e);
    if (!coord) return;

    if (isCraftingMode) {
      const cellKey = `${coord.x},${coord.y}`;
      const currentlyPlaced = !!placedCells[cellKey];
      const targetPlaced = !currentlyPlaced;
      dragPlacementModeRef.current = targetPlaced;
      lastToggledCoordRef.current = coord;

      if (onSetCellPlaced) {
        onSetCellPlaced(coord.x, coord.y, targetPlaced);
      } else {
        onToggleCellPlaced(coord.x, coord.y);
      }
      setIsDrawing(true);
      return;
    }

    if (activeTool === 'eyedropper') {
      const colorId = grid.cells[coord.y]?.[coord.x];
      if (colorId) {
        const pickedColor = COLOR_MAP.get(colorId);
        if (pickedColor) {
          onPickColor(pickedColor);
        }
      }
      return;
    }

    if (activeTool === 'text') {
      if (onStampText) {
        onStampText(coord.x, coord.y);
      } else {
        onCellClick(coord.x, coord.y);
      }
      return;
    }

    setIsDrawing(true);
    lastToggledCoordRef.current = coord;
    onCellClick(coord.x, coord.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const coord = getGridCoord(e);
    setHoverCoord(coord);

    if (coord && onCellHover) {
      const colorId = grid.cells[coord.y]?.[coord.x];
      const color = colorId ? COLOR_MAP.get(colorId) || null : null;
      onCellHover(coord.x, coord.y, color);
    }

    if (!isDrawing || !coord) return;

    // Check if moving onto a different cell than last visited
    const last = lastToggledCoordRef.current;
    if (last && last.x === coord.x && last.y === coord.y) {
      return;
    }
    lastToggledCoordRef.current = coord;

    if (isCraftingMode) {
      if (dragPlacementModeRef.current !== null) {
        if (onSetCellPlaced) {
          onSetCellPlaced(coord.x, coord.y, dragPlacementModeRef.current);
        } else {
          onToggleCellPlaced(coord.x, coord.y);
        }
      }
    } else if (activeTool === 'paint') {
      onCellClick(coord.x, coord.y);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDrawing(false);
    lastToggledCoordRef.current = null;
    dragPlacementModeRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
    setIsDrawing(false);
    setHoverCoord(null);
    lastToggledCoordRef.current = null;
    dragPlacementModeRef.current = null;
  };

  // Inspect current hovered bead
  const hoveredBead = useMemo(() => {
    if (!hoverCoord) return null;
    const colorId = grid.cells[hoverCoord.y]?.[hoverCoord.x];
    if (!colorId) return null;
    const bead = COLOR_MAP.get(colorId);
    if (!bead) return null;
    const count = colorFrequencyMap.get(colorId) || 0;
    return { bead, count, x: hoverCoord.x, y: hoverCoord.y };
  }, [hoverCoord, grid, colorFrequencyMap]);

  return (
    <div
      ref={containerRef}
      className="relative max-w-4xl h-full w-full bg-[#E5E5E5] overflow-hidden flex flex-col select-none rounded-lg shadow-lg"
    >
      {/* Top Floating Viewport Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left Status Mode Pills */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Crafting Mode Toggle Button */}
          <button
            id="crafting-mode-toggle-btn"
            onClick={onToggleCraftingMode}
            className={`px-3 py-1.5 rounded-full border shadow-sm text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCraftingMode
                ? 'bg-pink-600 border-pink-700 text-white shadow-pink-500/20 ring-2 ring-pink-400'
                : 'bg-white border-pink-800/20 text-pink-900 hover:border-pink-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isCraftingMode ? 'Crafting Mode ON' : 'Crafting Tracker'}</span>
          </button>
        </div>

        {/* Right View & Zoom Controls */}
        <div className="bg-white/95 border border-pink-800/30 rounded-full px-3 py-1 shadow-md flex items-center gap-1 pointer-events-auto">
          {/* Gridlines Toggle */}
          <button
            id="toggle-gridlines-btn"
            onClick={() => setShowGridLines((g) => !g)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              showGridLines ? 'bg-pink-800 text-white' : 'hover:bg-rose-100 text-pink-400'
            }`}
            title="Toggle Grid Lines"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Bead Codes Overlay Toggle */}
          <button
            id="toggle-bead-codes-btn"
            onClick={() => setShowColorCodes((c) => !c)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1 px-2 ${
              showColorCodes ? 'bg-pink-800 text-white font-bold' : 'hover:bg-rose-100 text-pink-500'
            }`}
            title="Toggle Bead Code Labels on Cells (A1, H7, etc.)"
          >
            <Hash className="w-3.5 h-3.5" />
            <span className="text-[9px] font-mono uppercase">Codes</span>
          </button>

          {/* Numbers Toggle */}
          <button
            id="toggle-numbers-btn"
            onClick={() => setShowNumbers((n) => !n)}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              showNumbers ? 'bg-pink-800 text-white' : 'hover:bg-rose-100 text-pink-400'
            }`}
            title="Toggle Row/Col Coordinates"
          >
            <span className="text-[9px] font-mono font-bold px-0.5">123</span>
          </button>

          {/* Peek Original Image Toggle */}
          {activeImage && (
            <button
              id="toggle-original-img-btn"
              onClick={() => setShowOriginalOverlay((o) => !o)}
              className={`p-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1 px-2.5 ${
                showOriginalOverlay
                  ? 'bg-pink-800 border-pink-800 text-white'
                  : 'hover:bg-rose-100 border-pink-800/30 text-pink-900'
              }`}
              title="Compare with Original Image"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold uppercase">
                {showOriginalOverlay ? 'Pattern' : 'Original'}
              </span>
            </button>
          )}

          <div className="w-px h-3 bg-pink-800/20 my-auto mx-1" />

          {/* Zoom Buttons */}
          <button
            id="zoom-out-btn"
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
            className="p-1.5 hover:bg-rose-100 rounded-full transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="font-mono text-[10px] px-1 text-pink-900 font-bold w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <button
            id="zoom-in-btn"
            onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))}
            className="p-1.5 hover:bg-rose-100 rounded-full transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            id="zoom-reset-btn"
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1.5 hover:bg-rose-100 rounded-full transition-colors cursor-pointer"
            title="Reset Zoom & Pan"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Crafting Mode Progress Floating Ribbon */}
      {isCraftingMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-white/95 border-2 border-pink-600 rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-pink-700 font-bold uppercase">Crafting Progress:</span>
            <span className="font-bold text-pink-900">
              {totalPlacedCount} / {totalValidBeads} ({progressPercent}%)
            </span>
          </div>

          <div className="w-32 bg-rose-200 h-2.5 rounded-full overflow-hidden border border-pink-800/20">
            <div
              className="bg-pink-500 h-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-pink-200">
            <button
              id="mark-all-placed-btn"
              onClick={onMarkAllPlaced}
              className="px-2 py-1 bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-300 rounded text-[10px] font-bold uppercase cursor-pointer"
            >
              All Done
            </button>
            <button
              id="reset-crafting-progress-btn"
              onClick={onResetCraftingProgress}
              className="p-1 hover:bg-rose-100 text-pink-500 hover:text-pink-900 rounded transition-colors cursor-pointer"
              title="Reset Placement Progress"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Live Hover Bead Inspector Card (Bottom Left) */}
      {hoveredBead && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 border-2 border-pink-800 rounded-xl p-3 shadow-xl flex items-center gap-3 text-xs font-sans pointer-events-none">
          <div
            className="w-9 h-9 rounded-lg border border-pink-800 shadow-xs flex items-center justify-center font-mono font-bold text-xs"
            style={{
              backgroundColor: hoveredBead.bead.hex,
              color: (hoveredBead.bead.rgb[0] * 299 + hoveredBead.bead.rgb[1] * 587 + hoveredBead.bead.rgb[2] * 114) / 1000 < 135 ? '#fff' : '#000',
            }}
          >
            {hoveredBead.bead.code || ''}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-pink-900 text-xs">
                {hoveredBead.bead.name}
              </span>
              {hoveredBead.bead.code && (
                <span className="font-mono text-[10px] bg-pink-800 text-white px-1.5 py-0.2 rounded font-bold">
                  {hoveredBead.bead.code}
                </span>
              )}
              {hoveredBead.bead.series && (
                <span className="text-[9px] font-mono text-pink-600 bg-rose-100 px-1 py-0.2 rounded border border-pink-200">
                  {hoveredBead.bead.series}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-pink-500 mt-0.5">
              <span>Coord: ({hoveredBead.x + 1}, {hoveredBead.y + 1})</span>
              <span>•</span>
              <span>Used: {hoveredBead.count} beads</span>
              <span>•</span>
              <span>{hoveredBead.bead.hex}</span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas Viewport */}
      <div
        className={`w-full h-full flex items-center justify-center overflow-hidden ${
          isPanning
            ? 'cursor-grabbing'
            : isSpacePressed
            ? 'cursor-grab'
            : isCraftingMode
            ? 'cursor-pointer'
            : activeTool === 'eyedropper'
            ? 'cursor-copy'
            : 'cursor-crosshair'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 0.05s ease-out',
          }}
          className="relative shadow-2xl border border-pink-800/30 bg-white"
        >
          {/* Main Drawing Canvas */}
          <canvas
            ref={canvasRef}
            className="block"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Original Image Overlay Layer */}
          {showOriginalOverlay && activeImage && (
            <div
              className="absolute inset-0 z-10 pointer-events-none opacity-90 transition-opacity"
              style={{
                marginLeft: `${numberMargin}px`,
                marginTop: `${numberMargin}px`,
                width: `${grid.width * baseCellSize}px`,
                height: `${grid.height * baseCellSize}px`,
              }}
            >
              <img
                src={activeImage.src}
                alt="Original source"
                className="w-full h-full object-fill border border-dashed border-red-500"
              />
              <div className="absolute top-2 left-2 bg-pink-800/80 text-white px-2 py-0.5 rounded text-[10px] font-mono">
                ORIGINAL IMAGE PEEK
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
