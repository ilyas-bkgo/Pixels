import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  BeadColor,
  BeadBrand,
  PatternGrid,
  ToolType,
  ConversionSettings,
} from './types';
import {
  PERLER_PALETTE,
  BRAND_PALETTES,
  COLOR_MAP,
  DEFAULT_BEAD_COLOR,
  rematchPatternToBrand,
} from './data/beadPalette';
import {
  cloneGrid,
  createBlankGrid,
  setCellColor,
  floodFill,
  replaceAllColors,
  computeMaterials,
} from './utils/gridUtils';
import { convertImageToPattern } from './utils/colorUtils';
import { downloadPatternPng } from './utils/exportUtils';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PatternCanvas } from './components/PatternCanvas';
import { MaterialsList } from './components/MaterialsList';
import { ReplaceAllModal } from './components/ReplaceAllModal';
import { HelpModal } from './components/HelpModal';
import { AdminView } from './components/AdminView';

// Helper to inspect initial route path
function getInitialRoute(): 'studio' | 'admin' {
  if (typeof window === 'undefined') return 'studio';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (path.includes('/admin') || hash.includes('admin') || search.includes('admin')) {
    return 'admin';
  }
  return 'studio';
}

// Helper to compute a unique, stable storage key for crafting placement progress per pattern
function getPatternStorageKey(
  imgSrc: string | null,
  width: number,
  height: number,
  brand: BeadBrand
): string {
  const srcIdentifier = imgSrc
    ? imgSrc.startsWith('data:')
      ? `data_${imgSrc.length}`
      : imgSrc
    : 'blank';
  return `beadcraft_placed_${srcIdentifier}_${width}x${height}_${brand}`;
}

export default function App() {
  // Routing State
  const [currentRoute, setCurrentRoute] = useState<'studio' | 'admin'>(getInitialRoute);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigate = useCallback((to: 'studio' | 'admin') => {
    setCurrentRoute(to);
    const targetUrl = to === 'admin' ? '/admin' : '/';
    try {
      window.history.pushState(null, '', targetUrl);
    } catch {
      window.location.hash = to === 'admin' ? '#/admin' : '#/';
    }
  }, []);

  // Settings for image conversion with MARD 221 default & text clarity
  const [settings, setSettings] = useState<ConversionSettings>({
    brand: 'mard',
    gridWidth: 52,
    preserveAspectRatio: true,
    fitMode: 'contain',
    maxColors: 35,
    dithering: false,
    ditherType: 'atkinson',
    ditherStrength: 70,
    matchingAlgorithm: 'ciede2000',
    presetMode: 'text-logo',
    autoCropMargin: true,
    adjustments: {
      brightness: 0,
      contrast: 15,
      saturation: 5,
      sharpness: 50,
      textClarity: true,
      cleanSolidFills: true,
    },
    bgRemoval: {
      enabled: false,
      targetColor: null,
      tolerance: 25,
    },
  });

  // Track if user has manually adjusted maxColors (to avoid overwriting manual preference with auto-scale)
  const [userSetMaxColors, setUserSetMaxColors] = useState<boolean>(false);

  // Current active loaded image (for re-conversion on setting change)
  const [activeImage, setActiveImage] = useState<HTMLImageElement | null>(null);

  // Pattern Grid & Undo/Redo History
  const [grid, setGrid] = useState<PatternGrid>(() => createBlankGrid(52, 52, 'm_h6'));
  const [history, setHistory] = useState<PatternGrid[]>([createBlankGrid(52, 52, 'm_h6')]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Lifted View Preferences (synchronized between on-screen canvas & exports)
  const [showGridLines, setShowGridLines] = useState<boolean>(false);
  const [showNumbers, setShowNumbers] = useState<boolean>(false);

  // Crafting Mode & Scoped Progress Tracker (scoped per image + dimensions + brand)
  const [isCraftingMode, setIsCraftingMode] = useState<boolean>(false);
  const patternKey = useMemo(
    () => getPatternStorageKey(activeImage?.src || null, grid.width, grid.height, settings.brand),
    [activeImage, grid.width, grid.height, settings.brand]
  );

  const [placedCells, setPlacedCells] = useState<Record<string, boolean>>({});

  // When pattern identity changes (new conversion, new image, or dimension/brand change), load scoped progress
  const currentKeyRef = useRef(patternKey);
  useEffect(() => {
    currentKeyRef.current = patternKey;
    try {
      const saved = localStorage.getItem(patternKey);
      setPlacedCells(saved ? JSON.parse(saved) : {});
    } catch {
      setPlacedCells({});
    }
  }, [patternKey]);

  // Persist placed cells to scoped key whenever placedCells changes
  useEffect(() => {
    try {
      localStorage.setItem(currentKeyRef.current, JSON.stringify(placedCells));
    } catch {
      // ignore storage quota errors
    }
  }, [placedCells]);

  // Auto-scaling Max Colors when grid width changes (unless manually overridden by user)
  const handleSetGridWidth = useCallback(
    (newWidth: number) => {
      setSettings((prev) => {
        let newMaxColors = prev.maxColors;
        if (!userSetMaxColors) {
          if (newWidth >= 87) newMaxColors = 45;
          else if (newWidth >= 58) newMaxColors = 35;
          else newMaxColors = 25;
        }
        return {
          ...prev,
          gridWidth: newWidth,
          maxColors: newMaxColors,
        };
      });
    },
    [userSetMaxColors]
  );

  const handleSetMaxColors = useCallback((colors: number) => {
    setUserSetMaxColors(true);
    setSettings((prev) => ({ ...prev, maxColors: colors }));
  }, []);

  const handleResetMaxColorsAuto = useCallback(() => {
    setUserSetMaxColors(false);
    setSettings((prev) => {
      let autoColors = 25;
      if (prev.gridWidth >= 87) autoColors = 45;
      else if (prev.gridWidth >= 58) autoColors = 35;
      return {
        ...prev,
        maxColors: autoColors,
      };
    });
  }, []);

  // Tool & Color states
  const [activeTool, setActiveTool] = useState<ToolType>('paint');
  const [activeColor, setActiveColor] = useState<BeadColor>(
    COLOR_MAP.get('m_f11') || COLOR_MAP.get('m_h1') || BRAND_PALETTES.mard[0]
  );
  const [highlightedColorId, setHighlightedColorId] = useState<string | null>(null);

  // Modals
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Push new state to undo/redo history
  const pushHistory = useCallback(
    (newGrid: PatternGrid) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        next.push(newGrid);
        if (next.length > 30) {
          next.shift();
        }
        return next;
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 29));
      setGrid(newGrid);
    },
    [historyIndex]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (canUndo) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setGrid(cloneGrid(history[prevIdx]));
    }
  }, [canUndo, historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setGrid(cloneGrid(history[nextIdx]));
    }
  }, [canRedo, historyIndex, history]);

  // Convert an image element using current settings
  const handleConvertImage = useCallback(
    (img: HTMLImageElement) => {
      try {
        setActiveImage(img);
        const newGrid = convertImageToPattern(
          img,
          settings.gridWidth,
          settings.preserveAspectRatio,
          settings.maxColors,
          settings.dithering,
          settings.adjustments,
          settings.brand,
          settings.bgRemoval,
          settings.ditherType,
          settings.ditherStrength,
          settings.matchingAlgorithm,
          settings.autoCropMargin,
          settings.fitMode ?? 'contain'
        );
        pushHistory(newGrid);
      } catch (err) {
        console.error('Conversion error:', err);
      }
    },
    [settings, pushHistory]
  );

  // Brand Switch Handler: Instantly rematches the CURRENT pattern grid to the new brand palette
  const handleChangeBrand = useCallback(
    (newBrand: BeadBrand) => {
      setSettings((prev) => ({ ...prev, brand: newBrand }));
      const newPalette = BRAND_PALETTES[newBrand] || BRAND_PALETTES.mard;

      // Update active drawing color to matching or first color of new brand
      setActiveColor(newPalette[0]);

      // Rematch existing pattern to new brand
      const rematchedGrid = rematchPatternToBrand(grid, newBrand);
      pushHistory(rematchedGrid);
    },
    [grid, pushHistory]
  );

  // Re-convert when key conversion settings change
  useEffect(() => {
    if (activeImage) {
      const timer = setTimeout(() => {
        handleConvertImage(activeImage);
      }, 150); // 150ms debounce for responsive slider tuning
      return () => clearTimeout(timer);
    }
  }, [
    settings.gridWidth,
    settings.preserveAspectRatio,
    settings.fitMode,
    settings.maxColors,
    settings.dithering,
    settings.ditherType,
    settings.ditherStrength,
    settings.matchingAlgorithm,
    settings.autoCropMargin,
    settings.adjustments.brightness,
    settings.adjustments.contrast,
    settings.adjustments.saturation,
    settings.adjustments.sharpness,
    settings.adjustments.textClarity,
    settings.adjustments.cleanSolidFills,
    settings.bgRemoval.enabled,
    settings.bgRemoval.tolerance,
    settings.bgRemoval.targetColor,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Canvas Cell Click Handler (when not in crafting mode)
  const handleCellClick = useCallback(
    (x: number, y: number) => {
      if (activeTool === 'paint') {
        const next = setCellColor(grid, x, y, activeColor.id);
        if (next !== grid) {
          pushHistory(next);
        }
      } else if (activeTool === 'fill') {
        const next = floodFill(grid, x, y, activeColor.id);
        if (next !== grid) {
          pushHistory(next);
        }
      } else if (activeTool === 'replace') {
        const targetColorId = grid.cells[y]?.[x];
        if (targetColorId !== undefined) {
          const next = replaceAllColors(grid, targetColorId, activeColor.id);
          if (next !== grid) {
            pushHistory(next);
          }
        }
      }
    },
    [activeTool, activeColor, grid, pushHistory]
  );

  // Crafting Mode Progress Handlers (precise, non-flickering cell state setters)
  const handleToggleCellPlaced = useCallback((x: number, y: number) => {
    const key = `${x},${y}`;
    setPlacedCells((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  }, []);

  const handleSetCellPlaced = useCallback((x: number, y: number, placed: boolean) => {
    const key = `${x},${y}`;
    setPlacedCells((prev) => {
      if (placed) {
        if (prev[key]) return prev;
        return { ...prev, [key]: true };
      } else {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
    });
  }, []);

  const handleResetCraftingProgress = useCallback(() => {
    if (window.confirm('Reset crafting placement progress for this pattern?')) {
      setPlacedCells({});
    }
  }, []);

  const handleMarkAllPlaced = useCallback(() => {
    const allPlaced: Record<string, boolean> = {};
    for (let y = 0; y < grid.height; y++) {
      for (let x = 0; x < grid.width; x++) {
        if (grid.cells[y]?.[x] !== null) {
          allPlaced[`${x},${y}`] = true;
        }
      }
    }
    setPlacedCells(allPlaced);
  }, [grid]);

  // Replace All Modal execution
  const handleExecuteReplaceAll = useCallback(
    (fromColorId: string, toColorId: string) => {
      const next = replaceAllColors(grid, fromColorId, toColorId);
      if (next !== grid) {
        pushHistory(next);
      }
    },
    [grid, pushHistory]
  );

  // Reset to blank board
  const handleResetBoard = useCallback(() => {
    if (window.confirm('Reset board to a blank white canvas?')) {
      const blankColorId = BRAND_PALETTES[settings.brand][0].id;
      const blank = createBlankGrid(settings.gridWidth, settings.gridWidth, blankColorId);
      setActiveImage(null);
      setPlacedCells({});
      pushHistory(blank);
    }
  }, [settings.brand, settings.gridWidth, pushHistory]);

  // Computed materials breakdown
  const materials = useMemo(() => computeMaterials(grid), [grid]);
  const totalBeads = grid.width * grid.height;

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('paint');
      } else if (e.key.toLowerCase() === 'f') {
        setActiveTool('fill');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eyedropper');
      } else if (e.key.toLowerCase() === 'r') {
        setIsReplaceModalOpen(true);
      } else if (e.key.toLowerCase() === 'c') {
        setIsCraftingMode((c) => !c);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleQuickExport = useCallback(() => {
    downloadPatternPng(grid, `koukars-craft-${grid.width}x${grid.height}.png`, {
      cellSize: 24,
      showGridLines,
      showNumbers,
    });
  }, [grid, showGridLines, showNumbers]);

  if (currentRoute === 'admin') {
    return <AdminView onNavigateHome={() => navigate('studio')} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#FAF9F6] font-sans text-[#1A1A1A]">
      {/* Top Header */}
      <Header
        gridWidth={grid.width}
        gridHeight={grid.height}
        totalBeads={totalBeads}
        colorCount={materials.length}
        onResetBoard={handleResetBoard}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onQuickExport={handleQuickExport}
        onNavigateAdmin={() => navigate('admin')}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Tools & Upload */}
        <Sidebar
          settings={settings}
          onUpdateSettings={setSettings}
          onConvertImage={handleConvertImage}
          onChangeBrand={handleChangeBrand}
          activeImage={activeImage}
          grid={grid}
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          activeColor={activeColor}
          onSelectColor={setActiveColor}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onOpenReplaceModal={() => setIsReplaceModalOpen(true)}
          userSetMaxColors={userSetMaxColors}
          onSetGridWidth={handleSetGridWidth}
          onSetMaxColors={handleSetMaxColors}
          onResetMaxColorsAuto={handleResetMaxColorsAuto}
        />

        {/* Right Content Area: Canvas (Top) & Materials List (Bottom) */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto">
          {/* Pattern Canvas Container */}
          <div className="h-[60vh] min-h-[350px] flex flex-col items-center justify-center shrink-0 bg-gradient-to-b from-rose-50 to-rose-50/50">
            <PatternCanvas
              grid={grid}
              activeImage={activeImage}
              activeTool={activeTool}
              activeColor={activeColor}
              highlightedColorId={highlightedColorId}
              isCraftingMode={isCraftingMode}
              placedCells={placedCells}
              showGridLines={showGridLines}
              setShowGridLines={setShowGridLines}
              showNumbers={showNumbers}
              setShowNumbers={setShowNumbers}
              onCellClick={handleCellClick}
              onToggleCellPlaced={handleToggleCellPlaced}
              onSetCellPlaced={handleSetCellPlaced}
              onPickColor={(color) => {
                setActiveColor(color);
                setActiveTool('paint');
              }}
              onToggleCraftingMode={() => setIsCraftingMode((c) => !c)}
              onResetCraftingProgress={handleResetCraftingProgress}
              onMarkAllPlaced={handleMarkAllPlaced}
            />
          </div>

          {/* Materials Table & Export Section */}
          <div className="flex-1">
            <MaterialsList
              grid={grid}
              materials={materials}
              brand={settings.brand}
              highlightedColorId={highlightedColorId}
              showGridLines={showGridLines}
              showNumbers={showNumbers}
              onToggleHighlight={setHighlightedColorId}
              onSelectColor={(color) => {
                setActiveColor(color);
                setActiveTool('paint');
              }}
            />
          </div>
        </main>
      </div>

      {/* Replace All Color Modal */}
      <ReplaceAllModal
        isOpen={isReplaceModalOpen}
        onClose={() => setIsReplaceModalOpen(false)}
        materials={materials}
        brand={settings.brand}
        defaultFromColor={activeColor}
        onExecuteReplace={handleExecuteReplaceAll}
      />

      {/* Shortcuts & Help Guide Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}
