import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MaterialItem, PatternGrid, BeadBrand } from '../types';
import { COLOR_MAP, DEFAULT_BEAD_COLOR, BRAND_INFO } from '../data/beadPalette';
import { computeMaterials } from './gridUtils';

export interface RenderExportCanvasOptions {
  grid: PatternGrid;
  cellSize?: number;
  showGridLines?: boolean;
  showNumbers?: boolean;
  subGrid?: {
    startX: number;
    startY: number;
    width: number;
    height: number;
  };
}

/**
 * Draws high-resolution canvas of the pattern or a sub-board
 */
export function renderPatternToCanvas(options: RenderExportCanvasOptions): HTMLCanvasElement {
  const {
    grid,
    cellSize = 20,
    showGridLines = true,
    showNumbers = true,
    subGrid,
  } = options;

  const startX = subGrid ? subGrid.startX : 0;
  const startY = subGrid ? subGrid.startY : 0;
  const renderW = subGrid ? Math.min(subGrid.width, grid.width - startX) : grid.width;
  const renderH = subGrid ? Math.min(subGrid.height, grid.height - startY) : grid.height;

  const numberMargin = showNumbers ? 28 : 0;
  const canvas = document.createElement('canvas');
  canvas.width = renderW * cellSize + numberMargin;
  canvas.height = renderH * cellSize + numberMargin;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#FAF9F6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Coordinate numbers
  if (showNumbers) {
    ctx.fillStyle = '#475569';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top X coordinates
    for (let x = 0; x < renderW; x++) {
      const globalX = startX + x + 1;
      if (globalX % 5 === 0 || x === 0 || x === renderW - 1) {
        const cx = numberMargin + x * cellSize + cellSize / 2;
        ctx.fillText(`${globalX}`, cx, numberMargin / 2);
      }
    }

    // Left Y coordinates
    ctx.textAlign = 'right';
    for (let y = 0; y < renderH; y++) {
      const globalY = startY + y + 1;
      if (globalY % 5 === 0 || y === 0 || y === renderH - 1) {
        const cy = numberMargin + y * cellSize + cellSize / 2;
        ctx.fillText(`${globalY}`, numberMargin - 5, cy);
      }
    }
  }

  // Draw cells
  for (let y = 0; y < renderH; y++) {
    for (let x = 0; x < renderW; x++) {
      const globalX = startX + x;
      const globalY = startY + y;
      const colorId = grid.cells[globalY]?.[globalX];
      const px = numberMargin + x * cellSize;
      const py = numberMargin + y * cellSize;

      if (colorId === null || colorId === undefined) {
        // Empty pegboard peg
        ctx.fillStyle = '#FAF9F6';
        ctx.fillRect(px, py, cellSize, cellSize);

        const centerX = px + cellSize / 2;
        const centerY = py + cellSize / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, cellSize * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fill();
        continue;
      }

      const bead = COLOR_MAP.get(colorId) || DEFAULT_BEAD_COLOR;
      ctx.fillStyle = bead.hex;
      ctx.fillRect(px, py, cellSize, cellSize);
    }
  }

  // Grid lines
  if (showGridLines) {
    for (let x = 0; x <= renderW; x++) {
      const globalX = startX + x;
      const px = numberMargin + x * cellSize;
      const isMajor = globalX % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(px, numberMargin);
      ctx.lineTo(px, canvas.height);
      ctx.strokeStyle = isMajor ? 'rgba(30, 41, 59, 0.45)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = isMajor ? 1.2 : 0.5;
      ctx.stroke();
    }

    for (let y = 0; y <= renderH; y++) {
      const globalY = startY + y;
      const py = numberMargin + y * cellSize;
      const isMajor = globalY % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(numberMargin, py);
      ctx.lineTo(canvas.width, py);
      ctx.strokeStyle = isMajor ? 'rgba(30, 41, 59, 0.45)' : 'rgba(148, 163, 184, 0.2)';
      ctx.lineWidth = isMajor ? 1.2 : 0.5;
      ctx.stroke();
    }
  }

  return canvas;
}

/**
 * Downloads PNG file of pattern
 */
export function downloadPatternPng(
  grid: PatternGrid,
  filename = 'koukars-craft-pattern.png',
  options: Partial<RenderExportCanvasOptions> = {}
) {
  const canvas = renderPatternToCanvas({
    grid,
    cellSize: 24,
    showGridLines: true,
    showNumbers: true,
    ...options,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export interface PdfExportOptions {
  showGridLines?: boolean;
  showNumbers?: boolean;
}

/**
 * Generates and downloads a complete multi-page/multi-board PDF pattern booklet with materials list
 */
export function downloadPatternPdf(
  grid: PatternGrid,
  materials: MaterialItem[],
  filename = 'koukars-craft-pattern.pdf',
  patternTitle = "koukar's Craft Pattern",
  brand: BeadBrand = 'perler',
  options: PdfExportOptions = {}
) {
  const showGridLines: boolean = options.showGridLines !== undefined ? options.showGridLines : true;
  const showNumbers: boolean = options.showNumbers !== undefined ? options.showNumbers : true;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const totalBeads = materials.reduce((acc, m) => acc + m.count, 0);
  const totalColors = materials.length;
  const brandDetails = BRAND_INFO[brand] || BRAND_INFO.perler;

  const boardsAcross = Math.ceil(grid.width / 29);
  const boardsDown = Math.ceil(grid.height / 29);
  const totalBoards = boardsAcross * boardsDown;

  // -------------------------------------------------------------
  // PAGE 1: OVERVIEW & SPECIFICATIONS
  // -------------------------------------------------------------
  // Top Banner
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, pageWidth, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text("koukar's Craft v1 • Pattern Guide", margin, 14);

  // Metadata summary
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  doc.text(`Project: ${patternTitle}`, margin, 29);
  doc.text(`Palette Brand: ${brandDetails.name} (${brandDetails.tag})`, margin, 34);
  doc.text(`Dimensions: ${grid.width} × ${grid.height} grid (${totalBeads.toLocaleString()} beads)`, margin, 39);
  doc.text(`Total Standard 29×29 Pegboards Required: ${totalBoards} (${boardsAcross} wide × ${boardsDown} tall)`, margin, 44);

  // Overview Pattern Image
  const overviewCanvas = renderPatternToCanvas({
    grid,
    cellSize: 16,
    showGridLines,
    showNumbers,
  });
  const overviewImgData = overviewCanvas.toDataURL('image/png');

  const maxImgH = totalBoards > 1 ? 65 : 85;
  const imgAspect = overviewCanvas.width / overviewCanvas.height;
  let imgW = pageWidth - margin * 2;
  let imgH = imgW / imgAspect;
  if (imgH > maxImgH) {
    imgH = maxImgH;
    imgW = imgH * imgAspect;
  }
  const imgX = (pageWidth - imgW) / 2;
  const imgY = 48;

  doc.addImage(overviewImgData, 'PNG', imgX, imgY, imgW, imgH);

  // Board Assembly Grid Map (if multi-board)
  let tableStartY = imgY + imgH + 6;

  if (totalBoards > 1) {
    doc.setFillColor(245, 245, 240);
    doc.roundedRect(margin, tableStartY, pageWidth - margin * 2, 22, 2, 2, 'F');
    doc.setTextColor(26, 26, 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`Pegboard Layout Assembly Map (${boardsAcross} × ${boardsDown} Boards):`, margin + 4, tableStartY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let mapText = '';
    for (let r = 0; r < boardsDown; r++) {
      const rowBoards = [];
      for (let c = 0; c < boardsAcross; c++) {
        const boardIdx = r * boardsAcross + c + 1;
        rowBoards.push(`[Board ${boardIdx}: (${c * 29 + 1}..${Math.min((c + 1) * 29, grid.width)}, ${r * 29 + 1}..${Math.min((r + 1) * 29, grid.height)})]`);
      }
      mapText += rowBoards.join('   ') + (r < boardsDown - 1 ? '  |  ' : '');
    }
    doc.text(mapText, margin + 4, tableStartY + 14, { maxWidth: pageWidth - margin * 2 - 8 });
    tableStartY += 26;
  }

  // Master Materials Table
  const tableData = materials.map((m, index) => [
    `${index + 1}`,
    m.color.hex,
    m.color.code || '-',
    m.color.name,
    `${m.count.toLocaleString()} pcs`,
    `${m.percentage.toFixed(1)}%`,
  ]);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin, bottom: margin + 6 },
    head: [['#', 'Color', 'Code', `${brandDetails.name} Color`, 'Count', '% Share']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [26, 26, 26],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 249, 246],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26, halign: 'center' },
      2: { cellWidth: 18, halign: 'center' },
      3: { halign: 'left' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 1) {
        const hex = data.cell.raw as string;
        const cleanHex = hex.replace('#', '');
        const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
        const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
        const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

        const cellX = data.cell.x + 2;
        const cellY = data.cell.y + 2;
        const swatchW = 8;
        const swatchH = data.cell.height - 4;

        doc.setFillColor(r, g, b);
        doc.setDrawColor(203, 213, 225);
        doc.rect(cellX, cellY, swatchW, swatchH, 'FD');

        doc.setTextColor(71, 85, 105);
        doc.setFontSize(7.5);
        doc.text(hex, cellX + swatchW + 2, cellY + swatchH / 2 + 1);
      }
    },
  });

  // -------------------------------------------------------------
  // MULTI-PAGE BOARD SLICES (If pattern > 29x29)
  // -------------------------------------------------------------
  if (totalBoards > 1) {
    let boardIndex = 1;
    for (let r = 0; r < boardsDown; r++) {
      for (let c = 0; c < boardsAcross; c++) {
        doc.addPage('a4', 'portrait');

        const startX = c * 29;
        const startY = r * 29;
        const endX = Math.min((c + 1) * 29, grid.width);
        const endY = Math.min((r + 1) * 29, grid.height);

        // Header for this board
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 0, pageWidth, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Board ${boardIndex} of ${totalBoards} — Row ${r + 1}, Column ${c + 1}`, margin, 13);

        // Sub-title
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(`Grid Coordinates: Columns ${startX + 1} to ${endX} • Rows ${startY + 1} to ${endY}`, margin, 27);

        // Render this specific 29x29 board canvas in crisp high detail
        const boardCanvas = renderPatternToCanvas({
          grid,
          cellSize: 22,
          showGridLines,
          showNumbers,
          subGrid: {
            startX,
            startY,
            width: 29,
            height: 29,
          },
        });
        const boardImgData = boardCanvas.toDataURL('image/png');

        const maxBoardImgH = 135;
        const boardAspect = boardCanvas.width / boardCanvas.height;
        let boardW = pageWidth - margin * 2;
        let boardH = boardW / boardAspect;
        if (boardH > maxBoardImgH) {
          boardH = maxBoardImgH;
          boardW = boardH * boardAspect;
        }
        const bImgX = (pageWidth - boardW) / 2;
        const bImgY = 32;

        doc.addImage(boardImgData, 'PNG', bImgX, bImgY, boardW, boardH);

        // Compute sub-materials for this specific board
        const subGridCells: (string | null)[][] = [];
        for (let y = startY; y < endY; y++) {
          const row: (string | null)[] = [];
          for (let x = startX; x < endX; x++) {
            row.push(grid.cells[y]?.[x] ?? null);
          }
          subGridCells.push(row);
        }
        const subMaterials = computeMaterials({
          width: endX - startX,
          height: endY - startY,
          cells: subGridCells,
        });

        const subTableData = subMaterials.map((m, idx) => [
          `${idx + 1}`,
          m.color.hex,
          m.color.code || '-',
          m.color.name,
          `${m.count} pcs`,
        ]);

        autoTable(doc, {
          startY: bImgY + boardH + 6,
          margin: { left: margin, right: margin, bottom: margin + 6 },
          head: [['#', 'Color', 'Code', 'Bead Color Name', 'Board Count']],
          body: subTableData,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 1.8,
            valign: 'middle',
          },
          headStyles: {
            fillColor: [26, 26, 26],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 26, halign: 'center' },
            2: { cellWidth: 18, halign: 'center' },
            3: { halign: 'left' },
            4: { cellWidth: 28, halign: 'right' },
          },
          didDrawCell: (data) => {
            if (data.section === 'body' && data.column.index === 1) {
              const hex = data.cell.raw as string;
              const cleanHex = hex.replace('#', '');
              const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
              const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
              const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

              const cellX = data.cell.x + 2;
              const cellY = data.cell.y + 2;
              const swatchW = 7;
              const swatchH = data.cell.height - 4;

              doc.setFillColor(r, g, b);
              doc.setDrawColor(203, 213, 225);
              doc.rect(cellX, cellY, swatchW, swatchH, 'FD');

              doc.setTextColor(71, 85, 105);
              doc.setFontSize(7);
              doc.text(hex, cellX + swatchW + 2, cellY + swatchH / 2 + 1);
            }
          },
        });

        boardIndex++;
      }
    }
  }

  // Footer page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `BeadCraft Pattern Guide • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  doc.save(filename);
}

/**
 * Downloads CSV file containing bead materials list
 */
export function downloadMaterialsCsv(
  materials: MaterialItem[],
  brand: BeadBrand = 'perler',
  filename = 'bead-shopping-list.csv'
) {
  const brandName = BRAND_INFO[brand]?.name || 'Fuse Beads';
  const rows = [
    ['Index', 'Brand', 'Series', 'Color Code', 'Color Name', 'Hex Color', 'Bead Count', 'Percentage Share'],
    ...materials.map((m, i) => [
      `${i + 1}`,
      `"${brandName}"`,
      `"${m.color.series || '-'}"`,
      m.color.code || '',
      `"${m.color.name}"`,
      m.color.hex,
      `${m.count}`,
      `${m.percentage.toFixed(2)}%`,
    ]),
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
