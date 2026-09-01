import React, { useState } from 'react';
import { Type, Sparkles, X, Check, AlignCenter, ArrowDown, CornerDownLeft } from 'lucide-react';
import { BeadColor, PatternGrid } from '../types';
import { PixelFontStyle, renderTextToPixelBitmap } from '../utils/pixelFont';

interface TextToolBarProps {
  isOpen: boolean;
  onClose: () => void;
  activeColor: BeadColor;
  grid: PatternGrid;
  onApplyTextToGrid: (
    text: string,
    fontStyle: PixelFontStyle,
    startX: number,
    startY: number,
    colorId: string
  ) => void;
  textConfig: {
    text: string;
    fontStyle: PixelFontStyle;
    letterSpacing: number;
  };
  onUpdateTextConfig: (config: {
    text: string;
    fontStyle: PixelFontStyle;
    letterSpacing: number;
  }) => void;
}

export const TextToolBar: React.FC<TextToolBarProps> = ({
  isOpen,
  onClose,
  activeColor,
  grid,
  onApplyTextToGrid,
  textConfig,
  onUpdateTextConfig,
}) => {
  if (!isOpen) return null;

  const bitmap = renderTextToPixelBitmap(
    textConfig.text,
    textConfig.fontStyle,
    textConfig.letterSpacing
  );

  const handleCenterOnBoard = () => {
    if (!textConfig.text.trim() || bitmap.width === 0) return;
    const startX = Math.max(0, Math.floor((grid.width - bitmap.width) / 2));
    const startY = Math.max(0, Math.floor((grid.height - bitmap.height) / 2));
    onApplyTextToGrid(
      textConfig.text,
      textConfig.fontStyle,
      startX,
      startY,
      activeColor.id
    );
  };

  const handleBottomBanner = () => {
    if (!textConfig.text.trim() || bitmap.width === 0) return;
    const startX = Math.max(0, Math.floor((grid.width - bitmap.width) / 2));
    const startY = Math.max(0, grid.height - bitmap.height - 2);
    onApplyTextToGrid(
      textConfig.text,
      textConfig.fontStyle,
      startX,
      startY,
      activeColor.id
    );
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-white border-2 border-pink-800 rounded-xl shadow-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 select-none max-w-[95vw]">
      {/* Icon and Title */}
      <div className="flex items-center gap-2 pr-2 sm:border-r border-pink-800/20">
        <div className="p-1.5 bg-pink-800 text-pink-300 rounded-lg">
          <Type className="w-4 h-4" />
        </div>
        <div>
          <div className="text-[9px] uppercase font-mono font-bold text-pink-500">
            Pixel Typography
          </div>
          <div className="text-xs font-bold text-pink-900 whitespace-nowrap">
            Text Stamp Tool
          </div>
        </div>
      </div>

      {/* Text Input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          id="pixel-text-input"
          placeholder="Type letters, e.g. MOROCCO or 2026..."
          value={textConfig.text}
          onChange={(e) =>
            onUpdateTextConfig({
              ...textConfig,
              text: e.target.value,
            })
          }
          className="px-3 py-1.5 border border-pink-800/30 rounded-lg text-xs font-mono font-bold w-48 sm:w-56 focus:outline-none focus:border-pink-800 uppercase tracking-wider"
          autoFocus
        />

        {/* Font Style Selector */}
        <select
          value={textConfig.fontStyle}
          onChange={(e) =>
            onUpdateTextConfig({
              ...textConfig,
              fontStyle: e.target.value as PixelFontStyle,
            })
          }
          className="px-2 py-1.5 border border-pink-800/30 rounded-lg text-xs font-mono bg-white cursor-pointer focus:outline-none focus:border-pink-800"
        >
          <option value="classic_5x7">5×7 Classic</option>
          <option value="mini_3x5">3×5 Mini</option>
          <option value="bold_7x9">7×9 Bold Block</option>
        </select>
      </div>

      {/* Quick Placement Actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleCenterOnBoard}
          disabled={!textConfig.text.trim()}
          className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 disabled:opacity-30 border border-pink-800/20 rounded-lg text-[10px] font-mono font-bold text-pink-900 transition-colors flex items-center gap-1 cursor-pointer"
          title="Center text horizontally and vertically on canvas"
        >
          <AlignCenter className="w-3 h-3" /> Center
        </button>

        <button
          type="button"
          onClick={handleBottomBanner}
          disabled={!textConfig.text.trim()}
          className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 disabled:opacity-30 border border-pink-800/20 rounded-lg text-[10px] font-mono font-bold text-pink-900 transition-colors flex items-center gap-1 cursor-pointer"
          title="Place text at bottom edge as a banner"
        >
          <ArrowDown className="w-3 h-3" /> Bottom
        </button>
      </div>

      {/* Info indicator */}
      <div className="hidden md:flex items-center gap-1.5 text-[9.5px] font-mono text-pink-500 border-l border-pink-800/20 pl-2">
        <span>Click anywhere on the board to stamp</span>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-1 hover:bg-rose-100 rounded-lg text-pink-600 hover:text-pink-900 cursor-pointer ml-auto"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
