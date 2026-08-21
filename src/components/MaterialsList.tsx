import React, { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  Sparkles,
  Eye,
  EyeOff,
  Paintbrush,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  ArrowUpDown,
  Layers,
  Star,
  RefreshCw,
  Boxes,
  ShoppingCart,
  CheckCircle2,
} from 'lucide-react';
import { MaterialItem, PatternGrid, BeadColor, BeadBrand, InventoryStock } from '../types';
import {
  downloadPatternPng,
  downloadPatternPdf,
  downloadMaterialsCsv,
} from '../utils/exportUtils';
import { BRAND_INFO } from '../data/beadPalette';
import { MARD_SERIES_DEFINITIONS } from '../data/mardPalette';
import { analyzeStock } from '../utils/inventoryUtils';

interface MaterialsListProps {
  grid: PatternGrid;
  materials: MaterialItem[];
  brand: BeadBrand;
  highlightedColorId: string | null;
  showGridLines?: boolean;
  showNumbers?: boolean;
  inventory?: InventoryStock;
  onToggleHighlight: (colorId: string | null) => void;
  onSelectColor: (color: BeadColor) => void;
  onOpenReplaceModal?: (color: BeadColor) => void;
  onOpenAssemblyModal?: () => void;
  onOpenInventoryModal?: () => void;
}

export const MaterialsList: React.FC<MaterialsListProps> = ({
  grid,
  materials,
  brand,
  highlightedColorId,
  showGridLines = true,
  showNumbers = true,
  inventory = {},
  onToggleHighlight,
  onSelectColor,
  onOpenReplaceModal,
  onOpenAssemblyModal,
  onOpenInventoryModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('all');
  const [sortMode, setSortMode] = useState<'count' | 'code' | 'name' | 'deficit'>('count');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const totalBeads = materials.reduce((sum, item) => sum + item.count, 0);
  const totalColors = materials.length;
  const boardCount = Math.ceil((grid.width * grid.height) / (29 * 29));
  const estimatedCost = (totalBeads * 0.004).toFixed(2); // approximate craft bead cost estimation
  const isMardBrand = brand === 'mard';

  // Stock deficit analysis
  const stockAnalysis = useMemo(() => {
    return analyzeStock(materials, inventory);
  }, [materials, inventory]);

  // Filtered and Sorted Materials List
  const filteredAndSorted = useMemo(() => {
    let list = materials.filter((m) => {
      const matchesSearch =
        m.color.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.color.code && m.color.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.color.series && m.color.series.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.color.hex.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeries =
        selectedSeriesFilter === 'all' ||
        (m.color.code && m.color.code.startsWith(selectedSeriesFilter));

      return matchesSearch && matchesSeries;
    });

    if (sortMode === 'count') {
      list.sort((a, b) => b.count - a.count);
    } else if (sortMode === 'code') {
      list.sort((a, b) => (a.color.code || '').localeCompare(b.color.code || '', undefined, { numeric: true }));
    } else if (sortMode === 'name') {
      list.sort((a, b) => a.color.name.localeCompare(b.color.name));
    } else if (sortMode === 'deficit') {
      list.sort((a, b) => {
        const defA = Math.max(0, a.count - (inventory[a.color.id] || 0));
        const defB = Math.max(0, b.count - (inventory[b.color.id] || 0));
        return defB - defA;
      });
    }

    return list;
  }, [materials, searchQuery, selectedSeriesFilter, sortMode, inventory]);

  // Series Usage Breakdown for MARD
  const seriesBreakdown = useMemo(() => {
    if (!isMardBrand) return [];
    return MARD_SERIES_DEFINITIONS.map((def) => {
      const usedInSeries = materials.filter(
        (m) => m.color.code && m.color.code.startsWith(def.seriesId)
      );
      const totalCount = usedInSeries.reduce((s, i) => s + i.count, 0);
      return {
        ...def,
        usedShadesCount: usedInSeries.length,
        totalCount,
      };
    }).filter((s) => s.usedShadesCount > 0);
  }, [materials, isMardBrand]);

  const handleDownloadPng = () => {
    downloadPatternPng(grid, `koukars-craft-${grid.width}x${grid.height}.png`, {
      cellSize: 24,
      showGridLines,
      showNumbers,
    });
  };

  const handleDownloadPdf = () => {
    setIsExportingPdf(true);
    try {
      downloadPatternPdf(
        grid,
        materials,
        `koukars-craft-${grid.width}x${grid.height}-pattern.pdf`,
        `koukar's Craft ${grid.width}×${grid.height} Pattern`,
        brand,
        {
          showGridLines,
          showNumbers,
        }
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleDownloadCsv = () => {
    downloadMaterialsCsv(materials, brand, `koukars-craft-materials-list.csv`);
  };

  const handlePrint = () => {
    window.print();
  };

  const maxMaterialCount = materials.length > 0 ? Math.max(...materials.map((m) => m.count)) : 1;

  return (
    <div className="bg-white border-t border-black flex flex-col font-sans select-none">
      {/* Header & Export Action Banner */}
      <div className="p-6 sm:p-8 border-b border-black flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
              Palette & Specifications
            </p>
            {isMardBrand && (
              <span className="text-[9px] bg-black text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-amber-300" /> MARD 221 Standard
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif italic font-bold leading-none text-[#1A1A1A]">
            Materials & Palette Breakdown
          </h2>
        </div>

        {/* Studio Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenInventoryModal && (
            <button
              id="open-inventory-from-materials-btn"
              onClick={onOpenInventoryModal}
              className="bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-950 px-3.5 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Track physical bead inventory stock"
            >
              <Boxes className="w-3.5 h-3.5 text-amber-900" />
              <span>Inventory Stock</span>
            </button>
          )}

          {onOpenAssemblyModal && (
            <button
              id="open-assembly-from-materials-btn"
              onClick={onOpenAssemblyModal}
              className="bg-neutral-900 hover:bg-black text-amber-300 border border-black px-3.5 py-2 text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Split into 29x29 interlocking pegboard modules"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>29×29 Assembly Guide</span>
            </button>
          )}

          <button
            id="download-png-btn"
            onClick={handleDownloadPng}
            className="bg-white hover:bg-[#FAF9F6] border border-black px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>Export PNG</span>
          </button>

          <button
            id="download-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="bg-black hover:bg-neutral-800 disabled:opacity-40 text-white border border-black px-4 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Export PDF'}</span>
          </button>

          <button
            id="download-csv-btn"
            onClick={handleDownloadCsv}
            className="bg-white hover:bg-[#FAF9F6] border border-black px-3.5 py-2 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
            title="Download CSV Shopping List"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
          </button>

          <button
            id="print-pattern-btn"
            onClick={handlePrint}
            className="bg-white hover:bg-[#FAF9F6] border border-black p-2 text-[11px] rounded-lg transition-colors cursor-pointer"
            title="Print Studio Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-black" />
          </button>
        </div>
      </div>

      {/* MARD 221 Series Ribbon Showcase */}
      {isMardBrand && seriesBreakdown.length > 0 && (
        <div className="px-6 py-3 bg-[#FAF9F6] border-b border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold text-gray-500">
              Active MARD Series:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {seriesBreakdown.map((s) => (
                <button
                  key={s.seriesId}
                  onClick={() =>
                    setSelectedSeriesFilter((curr) =>
                      curr === s.seriesId ? 'all' : s.seriesId
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[9.5px] font-mono border transition-all cursor-pointer ${
                    selectedSeriesFilter === s.seriesId
                      ? 'bg-black text-white border-black font-bold shadow-xs'
                      : 'bg-white text-black border-black/20 hover:border-black'
                  }`}
                >
                  <span className="font-bold">[{s.seriesId}]</span> {s.name.slice(0, 2)} ({s.usedShadesCount}/{s.count})
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedSeriesFilter !== 'all' && (
              <button
                onClick={() => setSelectedSeriesFilter('all')}
                className="text-[10px] font-mono underline text-gray-600 hover:text-black cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filter / Highlight Active Bar */}
      {highlightedColorId && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-900 font-bold">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>SOLO ISOLATION: Dimming non-matching beads on canvas board</span>
          </div>
          <button
            id="clear-highlight-btn"
            onClick={() => onToggleHighlight(null)}
            className="font-bold underline hover:opacity-70 uppercase tracking-wider text-[11px] cursor-pointer text-amber-950"
          >
            Show Full Board
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Sort */}
      <div className="px-6 py-3 bg-white border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Filter palette by name, code (e.g. A14), or series..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 border border-black/20 rounded-lg text-xs w-full sm:w-80 focus:outline-none focus:border-black"
          />
          <span className="text-[10px] font-mono text-gray-400 whitespace-nowrap">
            {filteredAndSorted.length} of {materials.length} colors
          </span>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-1.5 text-xs self-end sm:self-auto font-mono">
          <span className="text-gray-400 text-[10px] uppercase font-bold flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <button
            onClick={() => setSortMode('count')}
            className={`px-2 py-1 rounded text-[10px] border cursor-pointer ${
              sortMode === 'count'
                ? 'bg-black text-white border-black font-bold'
                : 'bg-white text-gray-700 border-gray-200 hover:border-black'
            }`}
          >
            Count
          </button>
          <button
            onClick={() => setSortMode('code')}
            className={`px-2 py-1 rounded text-[10px] border cursor-pointer ${
              sortMode === 'code'
                ? 'bg-black text-white border-black font-bold'
                : 'bg-white text-gray-700 border-gray-200 hover:border-black'
            }`}
          >
            MARD Code
          </button>
          <button
            onClick={() => setSortMode('name')}
            className={`px-2 py-1 rounded text-[10px] border cursor-pointer ${
              sortMode === 'name'
                ? 'bg-black text-white border-black font-bold'
                : 'bg-white text-gray-700 border-gray-200 hover:border-black'
            }`}
          >
            Name
          </button>
          <button
            onClick={() => setSortMode('deficit')}
            className={`px-2 py-1 rounded text-[10px] border cursor-pointer ${
              sortMode === 'deficit'
                ? 'bg-black text-white border-black font-bold'
                : 'bg-white text-amber-900 border-amber-300 hover:border-black'
            }`}
          >
            Missing Deficit
          </button>
        </div>
      </div>

      {/* Table & Metrics Split */}
      <div className="flex flex-col xl:flex-row">
        {/* Table Column */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-black">
              <tr>
                <th className="p-3.5 text-[9px] uppercase tracking-widest font-bold border-b border-black w-10 text-center">
                  #
                </th>
                <th className="p-3.5 text-[9px] uppercase tracking-widest font-bold border-b border-black w-24">
                  Code
                </th>
                <th className="p-3.5 text-[9px] uppercase tracking-widest font-bold border-b border-black">
                  Bead Color
                </th>
                <th className="p-3.5 text-[9px] uppercase tracking-widest font-bold border-b border-black text-right w-24">
                  Needed
                </th>
                <th className="p-3.5 text-[9px] uppercase tracking-widest font-bold border-b border-black w-36">
                  In Stock
                </th>
                <th className="p-3.5 text-[9px] uppercase tracking-widest font-bold border-b border-black w-36">
                  Share
                </th>
                <th className="p-3.5 text-[9px] uppercase tracking-widest font-bold border-b border-black text-center w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredAndSorted.map((item, idx) => {
                const isCurrentHighlight = highlightedColorId === item.color.id;
                const isDark =
                  (item.color.rgb[0] * 299 + item.color.rgb[1] * 587 + item.color.rgb[2] * 114) / 1000 < 135;
                const stock = inventory[item.color.id] || 0;
                const isDeficit = stock < item.count;
                const deficitCount = Math.max(0, item.count - stock);

                return (
                  <tr
                    key={item.color.id}
                    id={`material-row-${item.color.id}`}
                    className={`hover:bg-[#FAF9F6] transition-colors ${
                      isCurrentHighlight ? 'bg-amber-50/60 font-bold' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center font-mono text-xs text-gray-400">
                      {idx + 1}
                    </td>

                    {/* MARD / Brand Code Badge */}
                    <td className="p-3.5">
                      <div
                        className="inline-flex items-center justify-center px-2 py-0.5 rounded font-mono text-[10px] font-bold border border-black/30 shadow-2xs"
                        style={{
                          backgroundColor: item.color.hex,
                          color: isDark ? '#FFFFFF' : '#000000',
                        }}
                      >
                        {item.color.code || item.color.hex.slice(1, 4)}
                      </div>
                    </td>

                    {/* Color Swatch & Name */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-black shrink-0"
                          style={{ backgroundColor: item.color.hex }}
                        />
                        <span className="text-xs font-semibold text-[#1A1A1A]">
                          {item.color.name}
                        </span>
                        {item.color.series && (
                          <span className="text-[8.5px] font-mono text-gray-600 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                            {item.color.series}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Needed Count */}
                    <td className="p-3.5 text-xs text-right font-mono font-bold text-[#1A1A1A]">
                      {item.count.toLocaleString()}
                    </td>

                    {/* Stock Status Badge */}
                    <td className="p-3.5">
                      {isDeficit ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          <ShoppingCart className="w-2.5 h-2.5" /> Need {deficitCount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> In Stock ({stock})
                        </span>
                      )}
                    </td>

                    {/* Share Bar */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: item.color.hex,
                              width: `${(item.count / maxMaterialCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-gray-500 w-8 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() =>
                            onToggleHighlight(isCurrentHighlight ? null : item.color.id)
                          }
                          title={isCurrentHighlight ? 'Clear highlight' : 'Isolate color on board'}
                          className={`p-1 rounded border transition-colors cursor-pointer ${
                            isCurrentHighlight
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-black border-black/30 hover:border-black'
                          }`}
                        >
                          {isCurrentHighlight ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                        <button
                          onClick={() => onSelectColor(item.color)}
                          title="Set as active drawing color"
                          className="p-1 rounded bg-white text-black border border-black/30 hover:border-black transition-colors cursor-pointer"
                        >
                          <Paintbrush className="w-3 h-3" />
                        </button>
                        {onOpenReplaceModal && (
                          <button
                            onClick={() => onOpenReplaceModal(item.color)}
                            title="Replace / swap this color in the pattern"
                            className="p-1 rounded bg-amber-50 text-amber-900 border border-amber-300 hover:border-black transition-colors cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right Summary Metrics Card */}
        <div className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-black p-6 bg-gray-50 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">
              Project & Stock Summary
            </p>

            <div className="flex justify-between text-xs font-bold text-black border-b border-black/10 pb-2">
              <span className="uppercase tracking-wider">Active Brand</span>
              <span className="font-mono text-sm">
                {BRAND_INFO[brand]?.name}
              </span>
            </div>

            <div className="flex justify-between text-xs font-bold text-black border-b border-black/10 pb-2">
              <span className="uppercase tracking-wider">Grid Dimensions</span>
              <span className="font-mono text-sm">
                {grid.width} × {grid.height} pegs
              </span>
            </div>

            <div className="flex justify-between text-xs font-bold text-black border-b border-black/10 pb-2">
              <span className="uppercase tracking-wider">Total Pattern Beads</span>
              <span className="font-mono text-sm">{totalBeads.toLocaleString()}</span>
            </div>

            <div className="flex justify-between text-xs font-bold text-black border-b border-black/10 pb-2">
              <span className="uppercase tracking-wider">Color Palette</span>
              <span className="font-mono text-sm">{totalColors} shades</span>
            </div>

            {/* In-Stock Readiness */}
            <div className="p-3 bg-white border border-black rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex justify-between font-bold">
                <span>Inventory Readiness:</span>
                <span
                  className={
                    stockAnalysis.isFullyCovered ? 'text-emerald-700' : 'text-amber-700'
                  }
                >
                  {stockAnalysis.isFullyCovered
                    ? '100% Ready'
                    : `${stockAnalysis.deficitColorsCount} colors missing`}
                </span>
              </div>
              <div className="text-[10px] text-gray-600">
                {stockAnalysis.isFullyCovered ? (
                  'You own all beads needed to build this pattern!'
                ) : (
                  <span>
                    Missing <strong>{stockAnalysis.totalMissingBeads}</strong> beads in total.
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between text-xs text-gray-600 border-b border-black/10 pb-2">
              <span className="uppercase tracking-wider text-[11px] font-bold">Pegboards (29×29)</span>
              <span className="font-mono text-xs font-bold text-black">~{boardCount} {boardCount === 1 ? 'board' : 'boards'}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-600">
              <span className="uppercase tracking-wider text-[11px] font-bold">Estimated Cost</span>
              <span className="font-mono text-xs font-bold text-black">${estimatedCost}</span>
            </div>
          </div>

          <div className="space-y-2">
            {onOpenAssemblyModal && (
              <button
                type="button"
                onClick={onOpenAssemblyModal}
                className="w-full py-2 bg-black text-amber-300 hover:bg-neutral-800 rounded-lg text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open 29×29 Assembly Guide</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
