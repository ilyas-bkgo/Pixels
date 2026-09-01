import React from 'react';
import { X, Keyboard, Sparkles, HelpCircle, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'P', desc: 'Activate Paint / Pen tool' },
    { key: 'F', desc: 'Activate Flood Fill bucket' },
    { key: 'E', desc: 'Activate Eyedropper color picker' },
    { key: 'R', desc: 'Open Replace All tool' },
    { key: 'C', desc: 'Toggle Crafting Progress Mode' },
    { key: 'Ctrl / ⌘ + Z', desc: 'Undo last change' },
    { key: 'Ctrl / ⌘ + Y', desc: 'Redo change' },
    { key: 'Ctrl + Scroll', desc: 'Zoom in and out on canvas' },
    { key: 'Space + Drag', desc: 'Pan canvas around' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-pink-800/40 backdrop-blur-2xs select-none">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-pink-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-pink-800 flex items-center justify-between bg-white">
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-pink-400">
              Studio Reference
            </p>
            <h3 className="text-xl font-serif italic font-bold text-pink-900">
              Keyboard Shortcuts & Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-rose-100 border border-transparent hover:border-pink-800 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-pink-900" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto bg-rose-50">
          {/* Shortcuts */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-pink-900 mb-3">
              01. Keyboard Commands
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {shortcuts.map((sc, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-white border border-pink-200 flex items-center justify-between text-xs"
                >
                  <span className="text-pink-700 text-[11px]">{sc.desc}</span>
                  <kbd className="px-2 py-0.5 bg-pink-800 text-white font-mono font-bold text-[10px]">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Crafting tips */}
          <div className="pt-3 border-t border-pink-800/10">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-pink-900 mb-3">
              02. Studio Pegboard Specs
            </p>
            <ul className="space-y-2 text-xs text-pink-700 font-sans">
              <li className="flex items-start gap-2 bg-white p-2.5 border border-pink-800/20">
                <Check className="w-4 h-4 text-pink-900 shrink-0 mt-0.5" />
                <span>
                  <strong>Standard Pegboard:</strong> 1 standard square board = 29×29 pegs (841 beads). Four interlocking pegboards form a 58×58 grid.
                </span>
              </li>
              <li className="flex items-start gap-2 bg-white p-2.5 border border-pink-800/20">
                <Check className="w-4 h-4 text-pink-900 shrink-0 mt-0.5" />
                <span>
                  <strong>Isolate Color on Board:</strong> Click the eye icon in the Materials list to dim all other beads for fast physical placement.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-pink-800 bg-white flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-pink-800 hover:bg-pink-900 text-white text-[11px] uppercase tracking-widest font-bold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
