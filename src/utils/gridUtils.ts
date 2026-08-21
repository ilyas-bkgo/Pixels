import { MaterialItem, PatternGrid } from '../types';
import { COLOR_MAP, DEFAULT_BEAD_COLOR } from '../data/beadPalette';

export function cloneGrid(grid: PatternGrid): PatternGrid {
  return {
    width: grid.width,
    height: grid.height,
    cells: grid.cells.map((row) => [...row]),
  };
}

export function createBlankGrid(
  width = 29,
  height = 29,
  initialColorId: string | null = 'white'
): PatternGrid {
  const cells: (string | null)[][] = [];
  for (let y = 0; y < height; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < width; x++) {
      row.push(initialColorId);
    }
    cells.push(row);
  }
  return { width, height, cells };
}

export function setCellColor(
  grid: PatternGrid,
  x: number,
  y: number,
  colorId: string | null
): PatternGrid {
  if (x < 0 || x >= grid.width || y < 0 || y >= grid.height) {
    return grid;
  }
  if (grid.cells[y][x] === colorId) {
    return grid;
  }
  const next = cloneGrid(grid);
  next.cells[y][x] = colorId;
  return next;
}

export function floodFill(
  grid: PatternGrid,
  startX: number,
  startY: number,
  fillColorId: string | null
): PatternGrid {
  if (startX < 0 || startX >= grid.width || startY < 0 || startY >= grid.height) {
    return grid;
  }

  const targetColorId = grid.cells[startY][startX];
  if (targetColorId === fillColorId) {
    return grid;
  }

  const next = cloneGrid(grid);
  const queue: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(grid.width * grid.height);

  const getIdx = (x: number, y: number) => y * grid.width + x;

  visited[getIdx(startX, startY)] = 1;
  next.cells[startY][startX] = fillColorId;

  const neighbors: [number, number][] = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;

    for (const [dx, dy] of neighbors) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx >= 0 && nx < grid.width && ny >= 0 && ny < grid.height) {
        const idx = getIdx(nx, ny);
        if (!visited[idx] && next.cells[ny][nx] === targetColorId) {
          visited[idx] = 1;
          next.cells[ny][nx] = fillColorId;
          queue.push([nx, ny]);
        }
      }
    }
  }

  return next;
}

export function replaceAllColors(
  grid: PatternGrid,
  targetColorId: string | null,
  newColorId: string | null
): PatternGrid {
  if (targetColorId === newColorId) return grid;

  const next = cloneGrid(grid);
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (next.cells[y][x] === targetColorId) {
        next.cells[y][x] = newColorId;
      }
    }
  }
  return next;
}

export function computeMaterials(grid: PatternGrid): MaterialItem[] {
  const counts = new Map<string, number>();
  let totalBeads = 0;

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const colorId = grid.cells[y][x];
      if (colorId !== null) {
        counts.set(colorId, (counts.get(colorId) || 0) + 1);
        totalBeads++;
      }
    }
  }

  const items: MaterialItem[] = [];
  counts.forEach((count, colorId) => {
    const color = COLOR_MAP.get(colorId) || {
      ...DEFAULT_BEAD_COLOR,
      id: colorId,
      name: `Unknown (${colorId})`,
    };
    items.push({
      color,
      count,
      percentage: totalBeads > 0 ? (count / totalBeads) * 100 : 0,
    });
  });

  return items.sort((a, b) => b.count - a.count);
}
