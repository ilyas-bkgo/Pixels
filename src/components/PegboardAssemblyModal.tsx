import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Layers,
  ChevronRight,
  Download,
  Printer,
  Grid,
  CheckCircle2,
  Maximize2,
  Eye,
  FileText,
} from 'lucide-react';
import { PatternGrid, BeadBrand, MaterialItem } from '../types';
import { COLOR_MAP, DEFAULT_BEAD_COLOR, BRAND_INFO } from '../data/beadPalette';
import { downloadPatternPng } from '../utils/exportUtils';

interface PegboardAssemblyModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: PatternGrid;
  brand: BeadBrand;
  materials: MaterialItem[];
}

export interface SubBoard {
  id: string; // e.g. "A1", "A2", "B1", "B2"
  rowLabel: string; // e.g. "A", "B"
  colLabel: string; // e.g. "1", "2"
  startX: number;
  startY: number;
  width: number;
  height: number;
  totalBeads: number;
}

export const PegboardAssemblyModal: React.FC<PegboardAssemblyModalProps> = ({
  isOpen,
  onClose,
  grid,
  brand,
  materials,
}) => {
  const boardSize = 29; // standard 29x29 perler/hama/mard pegboard
  const cols = Math.ceil(grid.width / boardSize);
  const rows = Math.ceil(grid.height / boardSize);

  // Generate sub-board metadata
  const subBoards: SubBoard[] = useMemo(() => {
    const list: SubBoard[] = [];
    for (let r = 0; r < rows; r++) {
      const rowLetter = String.fromCharCode(65 + r); // 'A', 'B', 'C'
      for (let c = 0; c < cols; c++) {
        const colNum = (c + 1).toString(); // '1', '2', '3'
        const startX = c * boardSize;
        const startY = r * boardSize;
        const width = Math.min(boardSize, grid.width - startX);
        const height = Math.min(boardSize, grid.height - startY);

        let beadCount = 0;
        for (let y = startY; y < startY + height; y++) {
          for (let x = startX; x < startX + width; x++) {
            if (grid.cells[y]?.[x]) beadCount++;
          }
        }

        list.push({
          id: `${rowLetter}${colNum}`,
          rowLabel: rowLetter,
          colLabel: colNum,
          startX,
          startY,
          width,
          height,
          totalBeads: beadCount,
        });
      }
    }
    return list;
  }, [grid, rows, cols, boardSize]);

  const [activeBoardId, setActiveBoardId] = useState<string>(subBoards[0]?.id || 'A1');
  const activeBoard = subBoards.find((b) => b.id === activeBoardId) || subBoards[0];

  const subBoardCanvasRef = useRef<HTMLCanvasElement>(null);

  // Calculate materials specifically for active sub-board
  const subBoardMaterials = useMemo(() => {
    if (!activeBoard) return [];
    const countMap = new Map<string, number>();

    for (let y = activeBoard.startY; y < activeBoard.startY + activeBoard.height; y++) {
      for (let x = activeBoard.startX; x < activeBoard.startX + activeBoard.width; x++) {
        const colorId = grid.cells[y]?.[x];
        if (colorId) {
          countMap.set(colorId, (countMap.get(colorId) || 0) + 1);
        }
      }
    }

    const list: { colorId: string; count: number; code?: string; name: string; hex: string }[] = [];
    countMap.forEach((count, colorId) => {
      const bead = COLOR_MAP.get(colorId) || DEFAULT_BEAD_COLOR;
      list.push({
        colorId,
        count,
        code: bead.code,
        name: bead.name,
        hex: bead.hex,
      });
    });

    return list.sort((a, b) => b.count - a.count);
  }, [activeBoard, grid]);

  // Render Zoomed Sub-board on Canvas
  useEffect(() => {
    const canvas = subBoardCanvasRef.current;
    if (!canvas || !activeBoard) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 28;
    const rulerSize = 32;
    const canvasW = rulerSize + activeBoard.width * cellSize;
    const canvasH = rulerSize + activeBoard.height * cellSize;

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Coordinate Rulers
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, canvasW, rulerSize);
    ctx.fillRect(0, 0, rulerSize, canvasH);

    ctx.fillStyle = '#4B5563';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top Ruler (1-29 Local Board Coordinates)
    for (let x = 0; x < activeBoard.width; x++) {
      const globalX = activeBoard.startX + x + 1;
      const localX = x + 1;
      const cx = rulerSize + x * cellSize + cellSize / 2;
      const isFive = localX % 5 === 0;

      ctx.font = isFive ? 'bold 10px monospace' : '9px monospace';
      ctx.fillText(`${localX}`, cx, rulerSize / 2);
    }

    // Left Ruler (1-29 Local Board Coordinates)
    ctx.textAlign = 'right';
    for (let y = 0; y < activeBoard.height; y++) {
      const globalY = activeBoard.startY + y + 1;
      const localY = y + 1;
      const cy = rulerSize + y * cellSize + cellSize / 2;
      const isFive = localY % 5 === 0;

      ctx.font = isFive ? 'bold 10px monospace' : '9px monospace';
      ctx.fillText(`${localY}`, rulerSize - 6, cy);
    }

    // Draw Board Pegs & Beads
    for (let y = 0; y < activeBoard.height; y++) {
      for (let x = 0; x < activeBoard.width; x++) {
        const globalX = activeBoard.startX + x;
        const globalY = activeBoard.startY + y;
        const colorId = grid.cells[globalY]?.[globalX];

        const px = rulerSize + x * cellSize;
        const py = rulerSize + y * cellSize;

        if (!colorId) {
          // Empty peg
          ctx.fillStyle = '#FAFAF9';
          ctx.fillRect(px, py, cellSize, cellSize);
          ctx.beginPath();
          ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fill();
        } else {
          const bead = COLOR_MAP.get(colorId) || DEFAULT_BEAD_COLOR;
          ctx.fillStyle = bead.hex;
          ctx.fillRect(px, py, cellSize, cellSize);

          // Bead Code text (e.g. A14, H6)
          if (bead.code) {
            const isDark = (bead.rgb[0] * 299 + bead.rgb[1] * 587 + bead.rgb[2] * 114) / 1000 < 135;
            ctx.fillStyle = isDark ? '#FFFFFF' : '#000000';
            ctx.font = 'bold 9.5px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bead.code, px + cellSize / 2, py + cellSize / 2);
          }
        }

        // Cell boundary line
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }
  }, [activeBoard, grid]);

  if (!isOpen) return null;

  const handleExportSubBoardPng = () => {
    if (!activeBoard) return;
    // Extract subgrid
    const subCells: (string | null)[][] = [];
    for (let y = activeBoard.startY; y < activeBoard.startY + activeBoard.height; y++) {
      const row: (string | null)[] = [];
      for (let x = activeBoard.startX; x < activeBoard.startX + activeBoard.width; x++) {
        row.push(grid.cells[y]?.[x] ?? null);
      }
      subCells.push(row);
    }

    const subGrid: PatternGrid = {
      width: activeBoard.width,
      height: activeBoard.height,
      cells: subCells,
    };

    downloadPatternPng(
      subGrid,
      `koukars-craft-board-${activeBoard.id}-${activeBoard.width}x${activeBoard.height}.png`,
      {
        cellSize: 28,
        showGridLines: true,
        showNumbers: true,
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-black w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-black bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black text-white rounded-lg">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-gray-500">
                  Assembly Guide • Standard 29×29 Pegboards
                </span>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-black text-white">
                  {subBoards.length} Total Pegboards ({cols}×{rows} grid)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif italic font-bold text-black">
                Multi-Pegboard Assembly & Board-by-Board Navigator
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 border border-transparent hover:border-black rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Content Body: Left Minimap & Info, Right Zoomed Board Canvas */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-gray-50/50">
          {/* Left Column: Board Minimap & Specs */}
          <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-black p-5 bg-white flex flex-col justify-between overflow-y-auto space-y-4">
            <div>
              <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-black block mb-2">
                1. Select Pegboard Unit:
              </label>

              {/* Interactive Minimap Grid */}
              <div
                className="grid gap-2 p-3 bg-gray-100 border border-black/20 rounded-xl mb-4"
                style={{
                  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                }}
              >
                {subBoards.map((b) => {
                  const isSelected = activeBoard?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setActiveBoardId(b.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                        isSelected
                          ? 'border-black bg-black text-white shadow-md scale-102'
                          : 'border-black/30 bg-white text-black hover:border-black hover:bg-amber-50'
                      }`}
                    >
                      <span className="text-base font-bold font-mono">
                        Board {b.id}
                      </span>
                      <span
                        className={`text-[9px] font-mono mt-0.5 ${
                          isSelected ? 'text-amber-300' : 'text-gray-500'
                        }`}
                      >
                        {b.width}×{b.height} pegs
                      </span>
                      <span
                        className={`text-[8.5px] font-mono ${
                          isSelected ? 'text-gray-300' : 'text-gray-400'
                        }`}
                      >
                        {b.totalBeads} beads
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Board Details */}
              {activeBoard && (
                <div className="p-3.5 bg-amber-50/60 border border-amber-300 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between font-bold text-black border-b border-amber-200 pb-1.5">
                    <span>Active Selection:</span>
                    <span>Board {activeBoard.id}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Global Span:</span>
                    <span>
                      X: {activeBoard.startX + 1}–{activeBoard.startX + activeBoard.width}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Vertical Span:</span>
                    <span>
                      Y: {activeBoard.startY + 1}–{activeBoard.startY + activeBoard.height}
                    </span>
                  </div>
                  <div className="flex justify-between text-black font-bold">
                    <span>Board Beads:</span>
                    <span>{activeBoard.totalBeads.toLocaleString()} pcs</span>
                  </div>
                </div>
              )}

              {/* Material List for this board */}
              <div className="mt-4">
                <label className="text-[10px] uppercase font-mono font-bold tracking-wider text-black block mb-1.5">
                  Colors for Board {activeBoard?.id} ({subBoardMaterials.length} shades):
                </label>
                <div className="max-h-36 overflow-y-auto divide-y divide-gray-100 border border-black/20 rounded-lg bg-white p-1">
                  {subBoardMaterials.map((m) => (
                    <div
                      key={m.colorId}
                      className="p-1.5 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-black/30 shrink-0"
                          style={{ backgroundColor: m.hex }}
                        />
                        <span className="font-mono font-bold text-[10px]">
                          [{m.code || m.hex.slice(1, 4)}]
                        </span>
                        <span className="truncate max-w-[100px] text-gray-800">
                          {m.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-black">
                        {m.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 pt-2 border-t border-black/10">
              <button
                type="button"
                id="export-single-board-png-btn"
                onClick={handleExportSubBoardPng}
                className="w-full py-2 bg-black hover:bg-neutral-800 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Board {activeBoard?.id} PNG</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2 bg-white hover:bg-gray-100 border border-black text-black rounded-lg font-bold text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Assembly Sheet</span>
              </button>
            </div>
          </div>

          {/* Right Column: Zoomed High-Resolution Board Grid */}
          <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-black">
                  Pegboard {activeBoard?.id} Detailed Bead Layout
                </span>
                <span className="text-[10px] font-mono text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                  Local Coordinates (1–{activeBoard?.width})
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-500">
                Printed beads show MARD color codes
              </span>
            </div>

            <div className="flex-1 overflow-auto bg-white border border-black rounded-xl p-4 flex items-center justify-center shadow-inner">
              <canvas
                ref={subBoardCanvasRef}
                className="shadow-md border border-black/20 max-w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black bg-white flex items-center justify-between font-mono text-xs">
          <span className="text-gray-500">
            Tip: Standard interlocking pegboards snap together seamlessly. Assemble one board at a time!
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-black rounded-lg font-bold text-xs uppercase transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
