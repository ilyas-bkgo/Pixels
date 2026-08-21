import React from 'react';
import { Grid3X3, RotateCcw, HelpCircle, Layers, Download } from 'lucide-react';

interface HeaderProps {
  gridWidth: number;
  gridHeight: number;
  totalBeads: number;
  colorCount: number;
  onResetBoard: () => void;
  onOpenHelp: () => void;
  onQuickExport: () => void;
  onNavigateAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gridWidth,
  gridHeight,
  totalBeads,
  colorCount,
  onResetBoard,
  onOpenHelp,
  onQuickExport,
  onNavigateAdmin,
}) => {
  return (
    <header className="h-16 border-b border-black flex items-center justify-between px-4 sm:px-8 bg-white sticky top-0 z-30 shrink-0">
      {/* Brand & Edition */}
      <div className="flex items-baseline space-x-3 sm:space-x-4">
        <h1 className="text-xl sm:text-2xl font-serif italic font-bold tracking-tight text-[#1A1A1A]">
          koukar's Craft
        </h1>
        <button
          onClick={onNavigateAdmin}
          title="Open Admin Route"
          className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 hover:text-rose-600 transition-colors hidden sm:inline-block cursor-pointer"
        >
          , her Ex edition v1
        </button>
      </div>

      {/* Center Stats Badges */}
      <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
        <div className="flex items-center space-x-1.5 opacity-80">
          <Grid3X3 className="w-3.5 h-3.5 text-black" />
          <span>{gridWidth}×{gridHeight} PEGS</span>
        </div>
        <span className="opacity-30">/</span>
        <div className="flex items-center space-x-1.5 opacity-80">
          <Layers className="w-3.5 h-3.5 text-black" />
          <span>{totalBeads.toLocaleString()} BEADS</span>
        </div>
        <span className="opacity-30">/</span>
        <div className="flex items-center space-x-1.5 opacity-80">
          <span className="w-2 h-2 rounded-full bg-black inline-block" />
          <span>{colorCount} COLORS</span>
        </div>
      </div>

      {/* Right Action Menu */}
      <div className="flex items-center space-x-2 sm:space-x-4 text-sm font-medium">
        {/* Clear Canvas */}
        <button
          id="header-reset-btn"
          onClick={onResetBoard}
          title="New Blank Canvas"
          className="text-xs uppercase tracking-wider font-bold hover:underline opacity-80 hover:opacity-100 transition-opacity hidden md:inline-block cursor-pointer"
        >
          New Canvas
        </button>

        {/* Help & Guide */}
        <button
          id="header-help-btn"
          onClick={onOpenHelp}
          title="Guide & Shortcuts"
          className="p-1.5 hover:bg-gray-100 border border-transparent hover:border-black rounded-lg transition-all cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-black" />
        </button>

        {/* Save / Export Project Pill */}
        <button
          id="header-save-btn"
          onClick={onQuickExport}
          className="bg-black hover:bg-neutral-800 text-white px-4 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
