import React, { useState, useMemo } from 'react';
import {
  X,
  Package,
  Plus,
  Minus,
  Search,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  Boxes,
} from 'lucide-react';
import { BeadBrand, BeadColor, InventoryStock, MaterialItem } from '../types';
import { BRAND_PALETTES, BRAND_INFO } from '../data/beadPalette';
import { MARD_SERIES_DEFINITIONS } from '../data/mardPalette';
import { exportInventoryCsv } from '../utils/inventoryUtils';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand: BeadBrand;
  inventory: InventoryStock;
  materials: MaterialItem[];
  restrictToOwned: boolean;
  onUpdateInventory: (stock: InventoryStock) => void;
  onToggleRestrictToOwned: (enabled: boolean) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  brand,
  inventory,
  materials,
  restrictToOwned,
  onUpdateInventory,
  onToggleRestrictToOwned,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  const brandColors = BRAND_PALETTES[brand] || BRAND_PALETTES.mard;
  const isMardBrand = brand === 'mard';

  // Stats
  const totalColorsCount = brandColors.length;
  const inStockColorsCount = brandColors.filter((c) => (inventory[c.id] || 0) > 0).length;
  const totalBeadsInStock = brandColors.reduce((sum, c) => sum + (inventory[c.id] || 0), 0);

  // Filtered color list
  const filteredColors = useMemo(() => {
    return brandColors.filter((color) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        color.name.toLowerCase().includes(q) ||
        (color.code && color.code.toLowerCase().includes(q)) ||
        (color.series && color.series.toLowerCase().includes(q)) ||
        color.hex.toLowerCase().includes(q);

      const matchesSeries =
        selectedSeries === 'all' ||
        (color.code && color.code.startsWith(selectedSeries));

      const count = inventory[color.id] || 0;
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'in_stock' && count > 0) ||
        (stockFilter === 'out_of_stock' && count === 0);

      return matchesSearch && matchesSeries && matchesStock;
    });
  }, [brandColors, searchQuery, selectedSeries, stockFilter, inventory]);

  if (!isOpen) return null;

  const handleSetStock = (colorId: string, count: number) => {
    const updated = { ...inventory, [colorId]: Math.max(0, count) };
    onUpdateInventory(updated);
  };

  const handleAdjustStock = (colorId: string, delta: number) => {
    const current = inventory[colorId] || 0;
    handleSetStock(colorId, current + delta);
  };

  const handleSetAllCount = (count: number) => {
    const updated: InventoryStock = { ...inventory };
    brandColors.forEach((c) => {
      updated[c.id] = count;
    });
    onUpdateInventory(updated);
  };

  const handleClearAll = () => {
    const updated: InventoryStock = { ...inventory };
    brandColors.forEach((c) => {
      delete updated[c.id];
    });
    onUpdateInventory(updated);
  };

  const handleSyncCurrentPattern = () => {
    const updated: InventoryStock = { ...inventory };
    materials.forEach((m) => {
      const current = updated[m.color.id] || 0;
      // Ensure at least enough beads for the current project + 100 buffer
      if (current < m.count) {
        updated[m.color.id] = m.count + 200;
      }
    });
    onUpdateInventory(updated);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === 'object' && parsed !== null) {
          onUpdateInventory({ ...inventory, ...parsed });
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-black w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-black bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black text-white rounded-lg">
              <Boxes className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-gray-500">
                  {BRAND_INFO[brand]?.name} • Stock Manager
                </span>
                <span className="text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {inStockColorsCount}/{totalColorsCount} colors owned
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif italic font-bold text-black">
                Physical Bead Inventory & Stock Tracker
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

        {/* Global Owned-Color Conversion Lock Banner */}
        <div className="px-6 py-3.5 bg-amber-50 border-b border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <div className="text-xs text-amber-950">
              <span className="font-bold">Conversion Restriction: </span>
              <span>
                {restrictToOwned
                  ? 'Active — New image conversions will strictly match ONLY colors currently in your stock.'
                  : 'Inactive — Conversions use the full 221-color MARD palette.'}
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold font-mono text-black cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-black shadow-2xs">
            <input
              type="checkbox"
              id="restrict-to-owned-checkbox"
              checked={restrictToOwned}
              onChange={(e) => onToggleRestrictToOwned(e.target.checked)}
              className="accent-black rounded cursor-pointer"
            />
            <span>Lock to In-Stock Beads</span>
          </label>
        </div>

        {/* Action Toolbar & Search */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-[#FAF9F6] space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by code (e.g. A14, H6), name (e.g. Emerald), or series..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-black/30 rounded-lg text-xs focus:outline-none focus:border-black font-sans"
              />
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSetAllCount(1000)}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-black/30 rounded-md text-[10px] font-mono font-bold text-black transition-colors cursor-pointer"
                title="Sets 1,000 beads for all 221 colors"
              >
                + Full Set (1k pcs)
              </button>

              <button
                type="button"
                onClick={handleSyncCurrentPattern}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 border border-black/30 rounded-md text-[10px] font-mono font-bold text-black transition-colors cursor-pointer"
                title="Stock all beads needed for current pattern"
              >
                Stock Current Project
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-2 py-1.5 bg-white hover:bg-red-50 border border-red-300 text-red-700 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Reset all stock to 0"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>

              <button
                type="button"
                onClick={() => exportInventoryCsv(brand, inventory)}
                className="p-1.5 bg-white hover:bg-gray-100 border border-black/30 rounded-md text-black transition-colors cursor-pointer"
                title="Export Stock CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <label
                className="p-1.5 bg-white hover:bg-gray-100 border border-black/30 rounded-md text-black transition-colors cursor-pointer flex items-center"
                title="Import JSON Stock file"
              >
                <Upload className="w-3.5 h-3.5" />
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Series & Stock Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {/* MARD Series Pills */}
            {isMardBrand && (
              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={() => setSelectedSeries('all')}
                  className={`px-2 py-0.5 rounded text-[9.5px] font-mono border transition-all cursor-pointer ${
                    selectedSeries === 'all'
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-gray-700 border-black/20 hover:border-black'
                  }`}
                >
                  All Series
                </button>
                {MARD_SERIES_DEFINITIONS.map((s) => (
                  <button
                    key={s.seriesId}
                    onClick={() => setSelectedSeries(s.seriesId)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all cursor-pointer ${
                      selectedSeries === s.seriesId
                        ? 'bg-black text-white border-black font-bold'
                        : 'bg-white text-gray-700 border-black/20 hover:border-black'
                    }`}
                  >
                    {s.seriesId}
                  </button>
                ))}
              </div>
            )}

            {/* Stock Level Filter */}
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                onClick={() => setStockFilter('all')}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  stockFilter === 'all'
                    ? 'bg-black text-white border-black font-bold'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                All ({brandColors.length})
              </button>
              <button
                onClick={() => setStockFilter('in_stock')}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  stockFilter === 'in_stock'
                    ? 'bg-black text-white border-black font-bold'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                In Stock ({inStockColorsCount})
              </button>
              <button
                onClick={() => setStockFilter('out_of_stock')}
                className={`px-2 py-0.5 rounded border cursor-pointer ${
                  stockFilter === 'out_of_stock'
                    ? 'bg-black text-white border-black font-bold'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                Out of Stock ({totalColorsCount - inStockColorsCount})
              </button>
            </div>
          </div>
        </div>

        {/* Color Grid Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {filteredColors.map((color) => {
              const count = inventory[color.id] || 0;
              const hasStock = count > 0;
              const isDark =
                (color.rgb[0] * 299 + color.rgb[1] * 587 + color.rgb[2] * 114) / 1000 < 135;

              return (
                <div
                  key={color.id}
                  id={`inventory-card-${color.id}`}
                  className={`p-2.5 rounded-xl border transition-all bg-white flex flex-col justify-between ${
                    hasStock
                      ? 'border-black/30 shadow-2xs'
                      : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  {/* Top: Swatch, Code & Name */}
                  <div className="flex items-start gap-2.5 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg border border-black/30 shrink-0 flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: color.hex }}
                    >
                      <div className="w-2 h-2 rounded-full bg-black/20" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border border-black/20"
                          style={{
                            backgroundColor: color.hex,
                            color: isDark ? '#FFFFFF' : '#000000',
                          }}
                        >
                          {color.code || color.hex.slice(1, 4)}
                        </span>
                        {color.series && (
                          <span className="text-[8px] font-mono text-gray-500">
                            {color.series}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-black truncate mt-0.5">
                        {color.name}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Quantity Controls */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAdjustStock(color.id, -100)}
                        disabled={count <= 0}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 text-black flex items-center justify-center text-xs font-bold cursor-pointer"
                        title="-100 beads"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={count}
                        onChange={(e) =>
                          handleSetStock(color.id, parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-1 py-0.5 text-center font-mono text-xs font-bold border border-black/20 rounded focus:outline-none focus:border-black"
                      />

                      <button
                        type="button"
                        onClick={() => handleAdjustStock(color.id, 100)}
                        className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-black flex items-center justify-center text-xs font-bold cursor-pointer"
                        title="+100 beads"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSetStock(color.id, hasStock ? 0 : 500)}
                      className={`text-[9px] font-mono font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                        hasStock
                          ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {hasStock ? 'In Stock' : '+500'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-4 text-gray-600">
            <div>
              Total In Stock:{' '}
              <span className="font-bold text-black">
                {totalBeadsInStock.toLocaleString()} beads
              </span>
            </div>
            <div>
              Palette Coverage:{' '}
              <span className="font-bold text-black">
                {Math.round((inStockColorsCount / totalColorsCount) * 100)}%
              </span>
            </div>
          </div>

          <button
            id="close-inventory-modal-btn"
            onClick={onClose}
            className="px-6 py-2 bg-black hover:bg-neutral-800 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer self-end sm:self-auto"
          >
            Done & Save
          </button>
        </div>
      </div>
    </div>
  );
};
