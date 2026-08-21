import { BeadColor, MaterialItem, BeadBrand } from '../types';
import { BRAND_PALETTES, COLOR_MAP } from '../data/beadPalette';
import { ciede2000ColorDistance } from './colorUtils';

export const INVENTORY_STORAGE_KEY = 'bead_craft_inventory_v1';

export type InventoryStock = Record<string, number>; // colorId -> quantity

// Load inventory from localStorage
export function loadInventory(): InventoryStock {
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load inventory from storage:', err);
    return {};
  }
}

// Save inventory to localStorage
export function saveInventory(stock: InventoryStock): void {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(stock));
  } catch (err) {
    console.error('Failed to save inventory to storage:', err);
  }
}

// Deficit analysis item
export interface MaterialStockStatus {
  material: MaterialItem;
  inStock: number;
  deficit: number; // > 0 if we need to purchase more
  status: 'sufficient' | 'partial' | 'missing';
}

export function analyzeStock(
  materials: MaterialItem[],
  inventory: InventoryStock
): {
  items: MaterialStockStatus[];
  totalDeficitBeads: number;
  missingColorCount: number;
  allInStock: boolean;
} {
  let totalDeficitBeads = 0;
  let missingColorCount = 0;

  const items: MaterialStockStatus[] = materials.map((mat) => {
    const owned = inventory[mat.color.id] || 0;
    const deficit = Math.max(0, mat.count - owned);

    if (deficit > 0) {
      totalDeficitBeads += deficit;
      missingColorCount++;
    }

    let status: 'sufficient' | 'partial' | 'missing' = 'sufficient';
    if (owned === 0) {
      status = 'missing';
    } else if (owned < mat.count) {
      status = 'partial';
    }

    return {
      material: mat,
      inStock: owned,
      deficit,
      status,
    };
  });

  return {
    items,
    totalDeficitBeads,
    missingColorCount,
    allInStock: totalDeficitBeads === 0,
  };
}

// Find closest owned color replacement
export function findClosestOwnedColor(
  targetColor: BeadColor,
  inventory: InventoryStock,
  brand: BeadBrand
): BeadColor | null {
  const brandColors = BRAND_PALETTES[brand] || BRAND_PALETTES.perler;
  const ownedColors = brandColors.filter(
    (c) => (inventory[c.id] || 0) > 0 && c.id !== targetColor.id
  );

  if (ownedColors.length === 0) return null;

  let bestMatch: BeadColor | null = null;
  let minDistance = Infinity;

  for (const c of ownedColors) {
    const dist = ciede2000ColorDistance(targetColor.rgb, c.rgb);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = c;
    }
  }

  return bestMatch;
}

// Export inventory as CSV
export function exportInventoryCsv(brand: BeadBrand, inventory: InventoryStock): void {
  const brandColors = BRAND_PALETTES[brand] || BRAND_PALETTES.perler;
  const rows = [
    ['Brand', 'Code', 'Color Name', 'Hex', 'Series', 'In Stock Quantity'],
    ...brandColors.map((c) => [
      c.brand.toUpperCase(),
      c.code || '',
      c.name,
      c.hex,
      c.series || '',
      (inventory[c.id] || 0).toString(),
    ]),
  ];

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${brand}-bead-inventory-stock.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
