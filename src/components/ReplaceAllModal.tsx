import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ArrowRight, Check, Sparkles } from 'lucide-react';
import { BeadColor, MaterialItem, BeadBrand, InventoryStock } from '../types';
import { BRAND_PALETTES, COLOR_MAP, BRAND_INFO } from '../data/beadPalette';
import { findClosestOwnedColor } from '../utils/inventoryUtils';

interface ReplaceAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  brand: BeadBrand;
  defaultFromColor?: BeadColor | null;
  inventory?: InventoryStock;
  onExecuteReplace: (fromColorId: string, toColorId: string) => void;
}

export const ReplaceAllModal: React.FC<ReplaceAllModalProps> = ({
  isOpen,
  onClose,
  materials,
  brand,
  defaultFromColor,
  inventory,
  onExecuteReplace,
}) => {
  const brandPalette = BRAND_PALETTES[brand] || BRAND_PALETTES.perler;
  const [fromColorId, setFromColorId] = useState<string>(
    defaultFromColor?.id || (materials[0]?.color.id ?? brandPalette[0].id)
  );
  const [toColorId, setToColorId] = useState<string>(
    brandPalette[1]?.id || brandPalette[0].id
  );

  useEffect(() => {
    if (defaultFromColor) {
      setFromColorId(defaultFromColor.id);
    }
  }, [defaultFromColor]);

  if (!isOpen) return null;

  const fromBead = COLOR_MAP.get(fromColorId);
  const toBead = COLOR_MAP.get(toColorId);
  const fromMaterial = materials.find((m) => m.color.id === fromColorId);

  // Closest alternative in inventory
  const suggestedOwnedColor =
    fromBead && inventory
      ? findClosestOwnedColor(fromBead, inventory, brand)
      : null;

  const handleConfirm = () => {
    if (fromColorId && toColorId && fromColorId !== toColorId) {
      onExecuteReplace(fromColorId, toColorId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs select-none">
      <div className="bg-white rounded-none shadow-2xl border-2 border-black w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-black flex items-center justify-between bg-white">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
              Toolbox Command
            </p>
            <h3 className="text-xl font-serif italic font-bold text-[#1A1A1A]">
              Replace Color Everywhere
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 border border-transparent hover:border-black rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto bg-[#FAF9F6]">
          {/* Swap Indicator */}
          <div className="p-4 bg-white border border-black rounded-none flex items-center justify-between">
            {/* From */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border border-black shadow-xs flex items-center justify-center"
                style={{ backgroundColor: fromBead?.hex || '#ccc' }}
              >
                <div className="w-2 h-2 rounded-full bg-black/30" />
              </div>
              <div>
                <div className="text-[9px] uppercase tracking-widest font-mono text-gray-400">
                  REPLACE
                </div>
                <div className="text-xs font-bold text-black">
                  {fromBead?.name || 'Select'}
                </div>
                {fromMaterial && (
                  <div className="text-[10px] font-mono text-gray-500">
                    {fromMaterial.count} beads
                  </div>
                )}
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-black" />

            {/* To */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <div className="text-[9px] uppercase tracking-widest font-mono text-gray-400">
                  WITH NEW
                </div>
                <div className="text-xs font-bold text-black">
                  {toBead?.name || 'Select'}
                </div>
                <div className="text-[10px] font-mono text-gray-500">
                  {toBead?.code || toBead?.hex}
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full border border-black shadow-xs flex items-center justify-center"
                style={{ backgroundColor: toBead?.hex || '#ccc' }}
              >
                <div className="w-2 h-2 rounded-full bg-black/30" />
              </div>
            </div>
          </div>

          {/* 1. Pick From */}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold text-black block mb-2">
              01. Choose color in current pattern to replace:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-1">
              {materials.map((m) => {
                const isSelected = fromColorId === m.color.id;
                return (
                  <button
                    key={m.color.id}
                    onClick={() => setFromColorId(m.color.id)}
                    className={`p-2 border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-black bg-black text-white font-bold'
                        : 'border-black/20 bg-white hover:border-black text-black'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-black/30 shrink-0"
                      style={{ backgroundColor: m.color.hex }}
                    />
                    <div className="truncate">
                      <div className="text-[11px] truncate">{m.color.name}</div>
                      <div className={`text-[9px] font-mono ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                        {m.count} pcs
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pick To */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-black">
                02. Choose replacement {BRAND_INFO[brand]?.name} bead color:
              </label>

              {suggestedOwnedColor && (
                <button
                  type="button"
                  onClick={() => setToColorId(suggestedOwnedColor.id)}
                  className="text-[9.5px] font-mono font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1 cursor-pointer"
                  title="Auto-select closest color currently in your inventory"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Closest in Stock: {suggestedOwnedColor.code || suggestedOwnedColor.name}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white border border-black/20">
              {brandPalette.map((color) => {
                const isSelected = toColorId === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => setToColorId(color.id)}
                    title={`${color.name} (${color.code || color.hex})`}
                    className={`w-7 h-7 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'border-black ring-2 ring-black scale-110'
                        : 'border-black/30 hover:scale-110'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  >
                    <div className="w-2 h-2 rounded-full bg-black/20 flex items-center justify-center">
                      {isSelected && <Check className="w-2 h-2 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[11px] uppercase tracking-wider font-bold text-black hover:underline cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="confirm-replace-all-btn"
            onClick={handleConfirm}
            disabled={fromColorId === toColorId}
            className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-30 text-white text-[11px] uppercase tracking-widest font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Apply Swap</span>
          </button>
        </div>
      </div>
    </div>
  );
};
