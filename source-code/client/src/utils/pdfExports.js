import jsPDF from 'jspdf';
import { getCurrencyLabel } from './currencyLabels';
import { getTransactionTypeLabel } from './transactionTypeLabels';
import {
  buildInvoiceExportSections,
  buildInvoiceHeaderMeta,
} from './invoiceExportLayout';
import {
  formatEnglishLongDate,
  shouldUseTayAlRawiBranding,
  TAY_ALRAWI_BRAND_ASSETS,
  resolveBrandAssets,
  TAY_ALRAWI_BRAND_COLORS,
} from './exportBranding';

const imageElementCache = new Map();

const CANVAS_PAGE_SPECS = {
  landscape: {
    width: 2808,
    height: 1984,
    pdfWidth: 297,
    pdfHeight: 210,
  },
  portrait: {
    width: 1984,
    height: 2808,
    pdfWidth: 210,
    pdfHeight: 297,
  },
};

const PDF_BODY_FONT_FAMILY = '"Tajawal", "Cairo", Tahoma, "Segoe UI", Arial, sans-serif';
const PDF_TITLE_FONT_FAMILY = '"Tajawal", "Cairo", Tahoma, "Segoe UI", Arial, sans-serif';

async function ensurePdfFontsReady() {
  if (typeof document === 'undefined' || !document.fonts?.ready) return;

  try {
    await Promise.allSettled([
      document.fonts.load('700 24px Tajawal'),
      document.fonts.load('800 52px Tajawal'),
      document.fonts.load('600 24px Cairo'),
      document.fonts.ready,
    ]);
  } catch {
    // Fall back to the available system stack when web fonts are unavailable.
  }
}

function formatCellValue(val, format) {
  if (val === null || val === undefined || val === '') return '-';
  if (format === 'date') return String(val).split(' ')[0];
  if (format === 'currency') return getCurrencyLabel(val);
  if (format === 'number') return Number(val).toLocaleString('en-US');
  if (format === 'money') return `$${Number(val).toLocaleString('en-US')}`;
  if (format === 'money_iqd') return `${Number(val).toLocaleString('en-US')} د.ع`;
  return String(val);
}

function resolveAssetUrl(path) {
  try {
    return new URL(path, window.location.origin).href;
  } catch {
    return path;
  }
}

function loadImage(url) {
  if (!url) return Promise.resolve(null);
  if (imageElementCache.has(url)) return imageElementCache.get(url);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = resolveAssetUrl(url);
  });

  imageElementCache.set(url, promise);
  return promise;
}

async function loadBrandAssets(assetOverrides = {}, { sectionKey } = {}) {
  const brand = resolveBrandAssets({ sectionKey });
  const [header, footer, logo, logoOnWhite] = await Promise.all([
    loadImage(assetOverrides.header || brand.header),
    loadImage(assetOverrides.footer || brand.footer),
    loadImage(assetOverrides.logo || brand.logo),
    loadImage(assetOverrides.logoOnWhite || brand.logoOnWhite),
  ]);

  return { header, footer, logo, logoOnWhite };
}

function createCanvasPage(orientation) {
  const spec = CANVAS_PAGE_SPECS[orientation] || CANVAS_PAGE_SPECS.landscape;
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  if ('imageSmoothingEnabled' in ctx) {
    ctx.imageSmoothingEnabled = true;
  }
  if ('imageSmoothingQuality' in ctx) {
    ctx.imageSmoothingQuality = 'high';
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, spec.width, spec.height);
  if ('direction' in ctx) {
    ctx.direction = 'rtl';
  }
  ctx.textBaseline = 'middle';
  return { canvas, ctx, spec };
}

function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle = null, lineWidth = 1) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.stroke();
  }
}

function drawImageCover(ctx, image, x, y, width, height) {
  if (!image) return;

  const scale = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawImageContain(ctx, image, x, y, width, height) {
  if (!image) return;

  const scale = Math.min(width / image.width, height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

function drawImageFitWidth(ctx, image, x, y, width) {
  if (!image) return 0;

  const scale = width / image.width;
  const drawHeight = image.height * scale;
  ctx.drawImage(image, x, y, width, drawHeight);
  return drawHeight;
}

function setFont(ctx, weight, size, family = PDF_BODY_FONT_FAMILY) {
  ctx.font = `${weight} ${size}px ${family}`;
}

function truncateText(ctx, text, maxWidth) {
  const value = String(text ?? '');
  if (!maxWidth || ctx.measureText(value).width <= maxWidth) return value;

  const ellipsis = '...';
  let result = value;
  while (result.length > 1 && ctx.measureText(`${result}${ellipsis}`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}${ellipsis}`;
}

function splitLongToken(ctx, token, maxWidth) {
  const value = String(token ?? '');
  if (!value) return [''];
  if (!maxWidth || ctx.measureText(value).width <= maxWidth) return [value];

  const segments = [];
  let current = '';

  Array.from(value).forEach((char) => {
    const next = `${current}${char}`;
    if (current && ctx.measureText(next).width > maxWidth) {
      segments.push(current);
      current = char;
      return;
    }

    current = next;
  });

  if (current) {
    segments.push(current);
  }

  return segments.length ? segments : [truncateText(ctx, value, maxWidth)];
}

function wrapTextLines(ctx, text, maxWidth) {
  const value = String(text ?? '').trim();
  if (!value) return ['-'];
  if (!maxWidth) return [value];

  const words = value.split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    if (ctx.measureText(word).width > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = '';
      }
      splitLongToken(ctx, word, maxWidth).forEach((segment) => {
        lines.push(segment);
      });
      return;
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (!currentLine || ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : ['-'];
}

function getWrappedLines(ctx, text, maxWidth, maxLines = 4) {
  const lines = wrapTextLines(ctx, text, maxWidth);
  if (lines.length <= maxLines) {
    return lines;
  }

  const visibleLines = lines.slice(0, maxLines);
  visibleLines[maxLines - 1] = truncateText(ctx, visibleLines[maxLines - 1], maxWidth);
  return visibleLines;
}

function drawText(ctx, text, x, y, { align = 'right', color = '#000', size = 24, weight = '700', maxWidth = null, family = PDF_BODY_FONT_FAMILY } = {}) {
  setFont(ctx, weight, size, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  const finalText = maxWidth ? truncateText(ctx, text, maxWidth) : String(text ?? '');
  ctx.fillText(finalText, x, y);
}

function measureWrappedText(ctx, text, {
  maxWidth,
  lineHeight = 32,
  maxLines = 4,
  size = 24,
  weight = '500',
  family = PDF_BODY_FONT_FAMILY,
} = {}) {
  setFont(ctx, weight, size, family);
  return getWrappedLines(ctx, text, maxWidth, maxLines).length * lineHeight;
}

function drawWrappedText(ctx, text, x, y, {
  maxWidth,
  lineHeight = 32,
  maxLines = 4,
  align = 'right',
  color = '#000',
  size = 24,
  weight = '500',
  family = PDF_BODY_FONT_FAMILY,
} = {}) {
  setFont(ctx, weight, size, family);
  ctx.fillStyle = color;
  ctx.textAlign = align;

  const lines = getWrappedLines(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => {
    ctx.fillText(line, x, y + (index * lineHeight));
  });

  return lines.length * lineHeight;
}

function drawPageBackdrop(ctx, spec, branded, assets) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, spec.width, spec.height);

  let headerHeight = Math.round(spec.height * 0.08);
  let footerHeight = Math.round(spec.height * 0.07);

  if (branded && assets?.header) {
    headerHeight = Math.round(drawImageFitWidth(ctx, assets.header, 0, 0, spec.width));
  } else {
    ctx.fillStyle = TAY_ALRAWI_BRAND_COLORS.headerNavy;
    ctx.fillRect(0, 0, spec.width, headerHeight);
  }

  if (branded && assets?.footer) {
    footerHeight = Math.round((spec.width / assets.footer.width) * assets.footer.height);
    ctx.drawImage(assets.footer, 0, spec.height - footerHeight, spec.width, footerHeight);
  } else {
    ctx.fillStyle = TAY_ALRAWI_BRAND_COLORS.footerNavy;
    ctx.fillRect(0, spec.height - footerHeight, spec.width, footerHeight);
  }

  if (branded && assets?.logo) {
    ctx.save();
    ctx.globalAlpha = 0.06;
    const logoWidth = spec.width * 0.28;
    const logoHeight = logoWidth * 0.72;
    const x = (spec.width - logoWidth) / 2;
    const y = (spec.height - logoHeight) / 2;
    ctx.drawImage(assets.logo, x, y, logoWidth, logoHeight);
    ctx.restore();
  }

  ctx.strokeStyle = TAY_ALRAWI_BRAND_COLORS.headerNavy;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(spec.width, headerHeight);
  ctx.stroke();

  return { headerHeight, footerHeight };
}

function drawInvoiceBackdrop(ctx, spec, branded, assets) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, spec.width, spec.height);

  let headerHeight = Math.round(spec.height * 0.085);
  let footerHeight = Math.round(spec.height * 0.075);

  if (branded && assets?.header) {
    headerHeight = Math.round(drawImageFitWidth(ctx, assets.header, 0, 0, spec.width));
  } else {
    ctx.fillStyle = TAY_ALRAWI_BRAND_COLORS.headerNavy;
    ctx.fillRect(0, 0, spec.width, headerHeight);
  }

  if (branded && assets?.footer) {
    footerHeight = Math.round(drawImageFitWidth(ctx, assets.footer, 0, spec.height - ((spec.width / assets.footer.width) * assets.footer.height), spec.width));
  } else {
    ctx.fillStyle = TAY_ALRAWI_BRAND_COLORS.footerNavy;
    ctx.fillRect(0, spec.height - footerHeight, spec.width, footerHeight);
  }

  return { headerHeight, footerHeight };
}

function drawFooterOverlay(ctx, spec, footerHeight, pageNumber, totalPages, { showMeta = true } = {}) {
  if (!showMeta) return;

  const dateText = formatEnglishLongDate(new Date());
  const footerY = spec.height - footerHeight * 0.24;
  drawText(ctx, dateText, spec.width * 0.055, footerY, { align: 'left', color: '#ffffff', size: 30, weight: '500', maxWidth: spec.width * 0.2 });
  drawText(ctx, `Page ${pageNumber} of ${totalPages}`, spec.width * 0.895, footerY, { align: 'right', color: '#ffffff', size: 30, weight: '500', maxWidth: spec.width * 0.12 });
}

function drawInvoiceFooterOverlay(ctx, spec, footerHeight, pageNumber, totalPages) {
  const footerTop = spec.height - footerHeight;
  const dateText = formatEnglishLongDate(new Date());
  const pageText = `Page ${pageNumber} of ${totalPages}`;
  const textY = footerTop + footerHeight * 0.73;

  drawText(ctx, dateText, spec.width * 0.145, textY, {
    align: 'center',
    color: '#ffffff',
    size: 28,
    weight: '500',
    maxWidth: spec.width * 0.24,
  });
  drawText(ctx, pageText, spec.width * 0.84, textY, {
    align: 'center',
    color: '#ffffff',
    size: 28,
    weight: '500',
    maxWidth: spec.width * 0.15,
  });
}

function getColumnWeights(columns) {
  return columns.map((column) => {
    const key = String(column.key || '').toLowerCase();
    const label = String(column.label || '');

    if (key.includes('note') || label.includes('ملاحظ')) return 1.9;
    if (key.includes('account') || key.includes('driver') || key.includes('vehicle') || key.includes('good') || key.includes('company')) return 1.35;
    if (key.includes('amount') || key.includes('cost')) return 1.15;
    if (key.includes('date') || key.includes('currency') || key.includes('direction')) return 1.0;
    return 1.0;
  });
}

function computeColumnLayouts(columns, tableWidth) {
  const weights = getColumnWeights(columns);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  return weights.map((weight) => (tableWidth * weight) / totalWeight);
}

function splitRowsIntoPages(rows, firstPageCapacity, otherPagesCapacity, reserveLastRow = false) {
  if (!rows.length) return [[]];
  const pages = [];
  let index = 0;
  let pageIndex = 0;

  while (index < rows.length) {
    const remaining = rows.length - index;
    let capacity = pageIndex === 0 ? firstPageCapacity : otherPagesCapacity;
    if (reserveLastRow && remaining <= capacity) {
      capacity = Math.max(1, capacity - 1);
    }
    pages.push(rows.slice(index, index + capacity));
    index += capacity;
    pageIndex += 1;
  }

  return pages;
}

function drawReportHeader(ctx, spec, xRight, startY, { title, subtitle }) {
  let y = startY;
  drawText(ctx, title || '', xRight, y, { size: 65, weight: '800', color: TAY_ALRAWI_BRAND_COLORS.headerNavy });
  y += 75;
  if (subtitle) {
    drawText(ctx, subtitle, xRight, y, { size: 45, weight: '700', color: TAY_ALRAWI_BRAND_COLORS.accentRedDark });
    y += 50;
  }
  return y;
}

function drawSummaryCards(ctx, spec, x, y, width, summaryCards) {
  if (!summaryCards?.length) return y;

  const cardsPerRow = Math.min(summaryCards.length, spec.width > spec.height ? 4 : 2);
  const gap = 18;
  const cardHeight = 108;
  const cardWidth = (width - gap * (cardsPerRow - 1)) / cardsPerRow;
  const rows = Math.ceil(summaryCards.length / cardsPerRow);

  for (let row = 0; row < rows; row += 1) {
    const rowCards = summaryCards.slice(row * cardsPerRow, (row + 1) * cardsPerRow);
    rowCards.forEach((card, index) => {
      const cardX = x + width - ((index + 1) * cardWidth) - (index * gap);
      const cardY = y + row * (cardHeight + 12);
      drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 18, '#ffffff', '#d8dce7', 2);
      drawText(ctx, card.label, cardX + cardWidth - 24, cardY + 34, { size: 36, weight: '700', color: '#5c6482', maxWidth: cardWidth - 34 });
      drawText(ctx, card.value, cardX + cardWidth - 24, cardY + 74, { size: 54, weight: '700', color: TAY_ALRAWI_BRAND_COLORS.headerNavy, maxWidth: cardWidth - 34 });
    });
  }

  return y + rows * (cardHeight + 12);
}

function drawTable(ctx, { x, y, width, columns, rows, totalsRow, orientation }) {
  const headerHeight = orientation === 'portrait' ? 78 : 64;
  const rowHeight = orientation === 'portrait' ? 68 : 56;
  const columnWidths = computeColumnLayouts(columns, width);

  let cursorX = x + width;
  columns.forEach((column, index) => {
    const cellWidth = columnWidths[index];
    cursorX -= cellWidth;
    drawRoundedRect(ctx, cursorX, y, cellWidth, headerHeight, 0, TAY_ALRAWI_BRAND_COLORS.tableNavy, '#d7dbe4', 1);
    drawText(ctx, column.label, cursorX + cellWidth / 2, y + headerHeight / 2, {
      align: 'center',
      color: '#ffffff',
      size: orientation === 'portrait' ? 44 : 38,
      weight: '700',
      maxWidth: cellWidth - 20,
    });
  });

  let rowY = y + headerHeight;
  rows.forEach((row, rowIndex) => {
    const transTypeId = Number(row?.TransTypeID || row?.transTypeId || 0);
    const direction = String(row?.Direction || row?.direction || '').toUpperCase();
    const rt = String(row?.RecordType || row?.recordType || '').toLowerCase();
    const tn = String(row?.TransTypeName || row?.transTypeName || '').toLowerCase();
    
    let rowClass = 'default';
    if (transTypeId === 1 || direction === 'IN' || direction === 'DR' || rt === 'invoice' || tn.includes('فاتورة') || tn.includes('استحقاق') || row?.ShipID || row?.shipment_id) rowClass = 'invoice';
    if (transTypeId === 2 || direction === 'OUT' || direction === 'CR' || rt === 'payment' || tn.includes('قبض') || tn.includes('دفع')) rowClass = 'payment';
    if (transTypeId === 3 || rt === 'debit-note' || tn.includes('إضافة') || tn.includes('اضافة')) rowClass = 'debit';

    let rowFill = rowIndex % 2 === 1 ? TAY_ALRAWI_BRAND_COLORS.rowTint : '#ffffff';
    if (rowClass === 'invoice') rowFill = '#fff7ed';
    if (rowClass === 'payment') rowFill = '#ecfdf5';
    if (rowClass === 'debit') rowFill = '#fff1f2';

    const textColor = rowClass === 'invoice' ? '#ea580c' : rowClass === 'payment' ? '#0f7a3c' : rowClass === 'debit' ? '#e11d48' : '#1f2937';
    const textWeight = rowClass !== 'default' ? '700' : '500';
    let currentX = x + width;
    columns.forEach((column, index) => {
      const cellWidth = columnWidths[index];
      currentX -= cellWidth;
      drawRoundedRect(ctx, currentX, rowY, cellWidth, rowHeight, 0, rowFill, '#d7dbe4', 1);
      drawText(ctx, formatCellValue(row[column.key], column.format), currentX + cellWidth / 2, rowY + rowHeight / 2, {
        align: 'center',
        color: textColor,
        size: orientation === 'portrait' ? 38 : 34,
        weight: textWeight,
        maxWidth: cellWidth - 18,
      });
    });
    rowY += rowHeight;
  });

  if (totalsRow) {
    let currentX = x + width;
    columns.forEach((column, index) => {
      const cellWidth = columnWidths[index];
      currentX -= cellWidth;
      drawRoundedRect(ctx, currentX, rowY, cellWidth, rowHeight, 0, '#eef1f7', '#d7dbe4', 1);
      const value = index === 0 ? 'المجموع' : (totalsRow[column.key] !== undefined ? formatCellValue(totalsRow[column.key], column.format) : '');
      drawText(ctx, value, currentX + cellWidth / 2, rowY + rowHeight / 2, {
        align: 'center',
        color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
        size: orientation === 'portrait' ? 38 : 34,
        weight: '700',
        maxWidth: cellWidth - 18,
      });
    });
    rowY += rowHeight;
  }

  return rowY;
}

function resolveExportColumnValue(row, column) {
  if (typeof column?.getValue === 'function') {
    return column.getValue(row);
  }

  return row?.[column?.key] ?? row?.[column?.rawKey];
}

function formatExportCellValue(val, format) {
  if (val === null || val === undefined || val === '') return '-';
  if (format === 'date') return String(val).split(' ')[0];
  if (format === 'currency') return getCurrencyLabel(val);
  if (format === 'number') return Number(val).toLocaleString('en-US');
  if (format === 'money') return `$${Number(val).toLocaleString('en-US')}`;
  if (format === 'money_iqd') return `${Number(val).toLocaleString('en-US')} \u062f.\u0639`;
  return String(val);
}

function computeAdaptiveColumnLayouts(columns, tableWidth, orientation = 'landscape') {
  const compactScale = columns.length >= (orientation === 'portrait' ? 7 : 9) ? 0.9 : 1;
  const baseWidths = columns.map((column) => {
    const key = String(column.key || '').toLowerCase();
    const isPortrait = orientation === 'portrait';

    if (key.includes('note')) return (isPortrait ? 280 : 340) * compactScale;
    if (key.includes('account') || key.includes('driver') || key.includes('vehicle') || key.includes('good') || key.includes('company')) return (isPortrait ? 170 : 215) * compactScale;
    if (key.includes('gov')) return (isPortrait ? 150 : 190) * compactScale;
    if (key.includes('amount') || key.includes('cost') || key.includes('fee') || key.includes('price')) return (isPortrait ? 132 : 150) * compactScale;
    if (key.includes('date')) return (isPortrait ? 126 : 148) * compactScale;
    if (key.includes('weight') || key.includes('qty') || key.includes('meter')) return (isPortrait ? 112 : 126) * compactScale;
    return (isPortrait ? 124 : 142) * compactScale;
  });

  const totalBaseWidth = baseWidths.reduce((sum, width) => sum + width, 0) || 1;
  if (totalBaseWidth <= tableWidth) {
    const extraWidth = tableWidth - totalBaseWidth;
    const weights = getColumnWeights(columns);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
    return baseWidths.map((width, index) => width + ((extraWidth * weights[index]) / totalWeight));
  }

  const minWidth = orientation === 'portrait' ? 84 : 96;
  const scaledWidths = baseWidths.map((width) => Math.max(minWidth, (width / totalBaseWidth) * tableWidth));
  const scaledTotalWidth = scaledWidths.reduce((sum, width) => sum + width, 0);

  if (scaledTotalWidth <= tableWidth) {
    return scaledWidths;
  }

  const overflow = scaledTotalWidth - tableWidth;
  const shrinkBudget = scaledWidths.reduce((sum, width) => sum + Math.max(0, width - minWidth), 0);

  if (shrinkBudget <= 0) {
    return scaledWidths.map(() => tableWidth / columns.length);
  }

  return scaledWidths.map((width) => {
    const reducible = Math.max(0, width - minWidth);
    const reduction = overflow * (reducible / shrinkBudget);
    return Math.max(minWidth, width - reduction);
  });
}

function paginateMeasuredRows(rowHeights, firstPageAvailableHeight, otherPageAvailableHeight, totalsHeight = 0) {
  if (!rowHeights.length) {
    return [{ start: 0, end: 0 }];
  }

  const pages = [];
  let startIndex = 0;
  let availableHeight = firstPageAvailableHeight;

  while (startIndex < rowHeights.length) {
    let usedHeight = 0;
    let endIndex = startIndex;

    while (endIndex < rowHeights.length) {
      const reserveHeight = endIndex === rowHeights.length - 1 ? totalsHeight : 0;
      const nextHeight = rowHeights[endIndex];
      const wouldOverflow = usedHeight + nextHeight + reserveHeight > availableHeight;

      if (wouldOverflow && endIndex > startIndex) {
        break;
      }

      usedHeight += nextHeight;
      endIndex += 1;

      if (wouldOverflow) {
        break;
      }
    }

    pages.push({ start: startIndex, end: endIndex });
    startIndex = endIndex;
    availableHeight = otherPageAvailableHeight;
  }

  return pages;
}

function getAdaptiveTableMetrics(orientation, columnCount) {
  const compact = columnCount >= (orientation === 'portrait' ? 7 : 9);
  const dense = columnCount >= (orientation === 'portrait' ? 9 : 11);

  return {
    headerFontSize: orientation === 'portrait'
      ? (dense ? 48 : compact ? 56 : 64)
      : (dense ? 44 : compact ? 52 : 60),
    cellFontSize: orientation === 'portrait'
      ? (dense ? 46 : compact ? 54 : 60)
      : (dense ? 42 : compact ? 48 : 56),
    headerLineHeight: orientation === 'portrait' ? 66 : 60,
    cellLineHeight: orientation === 'portrait' ? 64 : 56,
    maxHeaderLines: 1,
    maxCellLines: dense ? 3 : 2,
    paddingX: dense ? 16 : 20,
    paddingY: dense ? 16 : 18,
    minHeaderHeight: orientation === 'portrait' ? 100 : 88,
    minRowHeight: orientation === 'portrait' ? 120 : 100,
    summaryLabelSize: orientation === 'portrait' ? 44 : 48,
    summaryValueSize: orientation === 'portrait' ? 64 : 68,
    summaryLabelLineHeight: orientation === 'portrait' ? 46 : 50,
    summaryValueLineHeight: orientation === 'portrait' ? 66 : 70,
  };
}

function measureWrappedLineCount(ctx, text, { maxWidth, maxLines, size, weight }) {
  setFont(ctx, weight, size);
  return getWrappedLines(ctx, text, maxWidth, maxLines).length;
}

function drawWrappedTableCellText(ctx, text, {
  x,
  y,
  width,
  height,
  maxLines,
  lineHeight,
  size,
  weight,
  align = 'center',
  color = '#000',
  paddingX = 12,
} = {}) {
  setFont(ctx, weight, size);
  ctx.fillStyle = color;
  ctx.textAlign = align;

  const innerWidth = Math.max(18, width - (paddingX * 2));
  const lines = getWrappedLines(ctx, text, innerWidth, maxLines);
  const totalHeight = lines.length * lineHeight;
  const startY = y + ((height - totalHeight) / 2) + (lineHeight / 2);
  const drawX = align === 'left'
    ? x + paddingX
    : align === 'center'
      ? x + (width / 2)
      : x + width - paddingX;

  lines.forEach((line, index) => {
    ctx.fillText(line, drawX, startY + (index * lineHeight));
  });

  return totalHeight;
}

function fitColumnsForHeaders(ctx, columns, tableWidth, orientation, metrics) {
  const paddingTotal = metrics.paddingX * 2;
  const baseWidths = computeAdaptiveColumnLayouts(columns, tableWidth, orientation);
  let fontSize = metrics.headerFontSize;
  const minFontSize = 16;

  while (fontSize >= minFontSize) {
    setFont(ctx, '700', fontSize);
    const requiredWidths = columns.map((column) => ctx.measureText(String(column.label ?? '')).width + paddingTotal);
    const targetWidths = columns.map((_, i) => Math.max(baseWidths[i], requiredWidths[i]));
    const totalTarget = targetWidths.reduce((s, w) => s + w, 0);

    if (totalTarget <= tableWidth) {
      const extra = tableWidth - totalTarget;
      const result = targetWidths.map((w) => w + (extra * (w / totalTarget)));
      return { columnWidths: result, headerFontSize: fontSize };
    }

    const scaled = targetWidths.map((w) => (w / totalTarget) * tableWidth);
    const allFit = columns.every((column, i) => {
      const innerWidth = scaled[i] - paddingTotal;
      return ctx.measureText(String(column.label ?? '')).width <= innerWidth;
    });

    if (allFit) {
      return { columnWidths: scaled, headerFontSize: fontSize };
    }

    fontSize -= 2;
  }

  setFont(ctx, '700', minFontSize);
  const requiredWidths = columns.map((column) => ctx.measureText(String(column.label ?? '')).width + paddingTotal);
  const targetWidths = columns.map((_, i) => Math.max(baseWidths[i], requiredWidths[i]));
  const totalTarget = targetWidths.reduce((s, w) => s + w, 0);
  const finalWidths = targetWidths.map((w) => (w / totalTarget) * tableWidth);
  return { columnWidths: finalWidths, headerFontSize: minFontSize };
}

function measureAdaptiveTableLayout(ctx, { columns, rows, totalsRow, width, orientation }) {
  const metrics = getAdaptiveTableMetrics(orientation, columns.length);
  const fitted = fitColumnsForHeaders(ctx, columns, width, orientation, metrics);
  const columnWidths = fitted.columnWidths;
  metrics.headerFontSize = fitted.headerFontSize;

  const headerHeight = columns.reduce((maxHeight, column, index) => {
    const innerWidth = Math.max(18, columnWidths[index] - (metrics.paddingX * 2));
    const lineCount = measureWrappedLineCount(ctx, column.label, {
      maxWidth: innerWidth,
      maxLines: metrics.maxHeaderLines,
      size: metrics.headerFontSize,
      weight: '700',
    });
    return Math.max(maxHeight, (metrics.paddingY * 2) + (lineCount * metrics.headerLineHeight));
  }, metrics.minHeaderHeight);

  const rowHeights = rows.map((row) => columns.reduce((maxHeight, column, index) => {
    const innerWidth = Math.max(18, columnWidths[index] - (metrics.paddingX * 2));
    const value = formatExportCellValue(resolveExportColumnValue(row, column), column.format);
    const transTypeId = Number(row?.TransTypeID || row?.transTypeId || 0);
    const direction = String(row?.Direction || row?.direction || '').toUpperCase();
    let weight = '500';
    if (transTypeId === 1 || transTypeId === 2 || transTypeId === 3 || direction === 'IN' || direction === 'DR' || direction === 'OUT' || direction === 'CR') weight = '700';
    const lineCount = measureWrappedLineCount(ctx, value, {
      maxWidth: innerWidth,
      maxLines: metrics.maxCellLines,
      size: metrics.cellFontSize,
      weight,
    });
    return Math.max(maxHeight, (metrics.paddingY * 2) + (lineCount * metrics.cellLineHeight));
  }, metrics.minRowHeight));

  const totalsHeight = totalsRow
    ? columns.reduce((maxHeight, column, index) => {
      const innerWidth = Math.max(18, columnWidths[index] - (metrics.paddingX * 2));
      const value = index === 0
        ? '\u0627\u0644\u0645\u062c\u0645\u0648\u0639'
        : (totalsRow[column.key] !== undefined ? formatExportCellValue(totalsRow[column.key], column.format) : '');
      const lineCount = measureWrappedLineCount(ctx, value, {
        maxWidth: innerWidth,
        maxLines: 1,
        size: metrics.cellFontSize,
        weight: '700',
      });
      return Math.max(maxHeight, (metrics.paddingY * 2) + (lineCount * metrics.cellLineHeight));
    }, metrics.minRowHeight)
    : 0;

  return {
    metrics,
    columnWidths,
    headerHeight,
    rowHeights,
    totalsHeight,
  };
}

function drawCenteredReportHeader(ctx, spec, startY, { title, subtitle }) {
  let y = startY;
  const centerX = spec.width / 2;
  const maxWidth = spec.width * 0.78;
  const titleHeight = drawWrappedText(ctx, title || '', centerX, y, {
    align: 'center',
    size: 52,
    weight: '800',
    lineHeight: 64,
    maxLines: 2,
    color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
    maxWidth,
    family: PDF_TITLE_FONT_FAMILY,
  });
  y += titleHeight + 20;

  if (subtitle) {
    const subtitleHeight = drawWrappedText(ctx, subtitle, centerX, y, {
      align: 'center',
      size: 24,
      weight: '600',
      lineHeight: 32,
      maxLines: 2,
      color: TAY_ALRAWI_BRAND_COLORS.accentRedDark,
      maxWidth,
      family: PDF_BODY_FONT_FAMILY,
    });
    y += subtitleHeight + 16;
  }

  return y;
}

function drawAdaptiveSummaryCards(ctx, spec, x, y, width, summaryCards) {
  if (!summaryCards?.length) return y;

  const metrics = getAdaptiveTableMetrics(spec.width > spec.height ? 'landscape' : 'portrait', summaryCards.length);
  const cardsPerRow = Math.min(summaryCards.length, spec.width > spec.height ? (summaryCards.length > 4 ? 3 : 4) : 2);
  const gap = 18;
  const cardWidth = (width - gap * (cardsPerRow - 1)) / cardsPerRow;
  const rows = Math.ceil(summaryCards.length / cardsPerRow);
  let cursorY = y;

  for (let row = 0; row < rows; row += 1) {
    const rowCards = summaryCards.slice(row * cardsPerRow, (row + 1) * cardsPerRow);
    const rowHeights = rowCards.map((card) => {
      const innerWidth = cardWidth - 40;
      const labelHeight = measureWrappedText(ctx, card.label, {
        maxWidth: innerWidth,
        lineHeight: metrics.summaryLabelLineHeight,
        maxLines: 2,
        size: metrics.summaryLabelSize,
        weight: '700',
      });
      const valueHeight = measureWrappedText(ctx, card.value, {
        maxWidth: innerWidth,
        lineHeight: metrics.summaryValueLineHeight,
        maxLines: 2,
        size: metrics.summaryValueSize,
        weight: '800',
      });
      return Math.max(116, 24 + labelHeight + 10 + valueHeight + 20);
    });
    const rowHeight = Math.max(...rowHeights);

    rowCards.forEach((card, index) => {
      const cardX = x + width - ((index + 1) * cardWidth) - (index * gap);
      const cardY = cursorY;
      const innerWidth = cardWidth - 40;
      drawRoundedRect(ctx, cardX, cardY, cardWidth, rowHeight, 18, '#ffffff', '#d8dce7', 2);
      const labelHeight = drawWrappedText(ctx, card.label, cardX + cardWidth - 20, cardY + 28, {
        maxWidth: innerWidth,
        lineHeight: metrics.summaryLabelLineHeight,
        maxLines: 2,
        size: metrics.summaryLabelSize,
        weight: '700',
        color: '#5c6482',
      });
      drawWrappedText(ctx, card.value, cardX + cardWidth - 20, cardY + 28 + labelHeight + 10, {
        maxWidth: innerWidth,
        lineHeight: metrics.summaryValueLineHeight,
        maxLines: 2,
        size: metrics.summaryValueSize,
        weight: '800',
        color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
      });
    });

    cursorY += rowHeight + 12;
  }

  return cursorY - 12;
}

function drawAdaptiveTable(ctx, { x, y, width, columns, rows, rowHeights, totalsRow, orientation, layout }) {
  const tableLayout = layout || measureAdaptiveTableLayout(ctx, {
    columns,
    rows,
    totalsRow,
    width,
    orientation,
  });
  const {
    metrics,
    columnWidths,
    headerHeight,
    totalsHeight,
  } = tableLayout;

  let cursorX = x + width;
  columns.forEach((column, index) => {
    const cellWidth = columnWidths[index];
    cursorX -= cellWidth;
    drawRoundedRect(ctx, cursorX, y, cellWidth, headerHeight, 0, TAY_ALRAWI_BRAND_COLORS.tableNavy, '#d7dbe4', 1);
    drawWrappedTableCellText(ctx, column.label, {
      x: cursorX,
      y,
      width: cellWidth,
      height: headerHeight,
      color: '#ffffff',
      size: metrics.headerFontSize,
      weight: '700',
      lineHeight: metrics.headerLineHeight,
      maxLines: metrics.maxHeaderLines,
      align: 'center',
      paddingX: metrics.paddingX,
    });
  });

  let rowY = y + headerHeight;
  rows.forEach((row, rowIndex) => {
    const transTypeId = Number(row?.TransTypeID || row?.transTypeId || 0);
    const direction = String(row?.Direction || row?.direction || '').toUpperCase();
    const rt = String(row?.RecordType || row?.recordType || '').toLowerCase();
    const tn = String(row?.TransTypeName || row?.transTypeName || '').toLowerCase();
    let rowClass = 'default';
    if (transTypeId === 1 || direction === 'IN' || direction === 'DR' || rt === 'invoice' || tn.includes('فاتورة') || tn.includes('استحقاق') || row?.ShipID || row?.shipment_id) rowClass = 'invoice';
    if (transTypeId === 2 || direction === 'OUT' || direction === 'CR' || rt === 'payment' || tn.includes('قبض') || tn.includes('دفع')) rowClass = 'payment';
    if (transTypeId === 3 || rt === 'debit-note' || tn.includes('إضافة') || tn.includes('اضافة')) rowClass = 'debit';

    let rowFill = rowIndex % 2 === 1 ? TAY_ALRAWI_BRAND_COLORS.rowTint : '#ffffff';
    if (rowClass === 'invoice') rowFill = '#fff7ed';
    if (rowClass === 'payment') rowFill = '#ecfdf5';
    if (rowClass === 'debit') rowFill = '#fff1f2';

    const textColor = rowClass === 'invoice' ? '#ea580c' : rowClass === 'payment' ? '#0f7a3c' : rowClass === 'debit' ? '#e11d48' : '#1f2937';
    const textWeight = rowClass !== 'default' ? '700' : '500';
    const rowHeight = rowHeights?.[rowIndex] || metrics.minRowHeight;

    let currentX = x + width;
    columns.forEach((column, index) => {
      const cellWidth = columnWidths[index];
      currentX -= cellWidth;
      drawRoundedRect(ctx, currentX, rowY, cellWidth, rowHeight, 0, rowFill, '#d7dbe4', 1);
      drawWrappedTableCellText(ctx, formatExportCellValue(resolveExportColumnValue(row, column), column.format), {
        x: currentX,
        y: rowY,
        width: cellWidth,
        height: rowHeight,
        color: textColor,
        size: metrics.cellFontSize,
        weight: textWeight,
        lineHeight: metrics.cellLineHeight,
        maxLines: metrics.maxCellLines,
        align: 'center',
        paddingX: metrics.paddingX,
      });
    });
    rowY += rowHeight;
  });

  if (totalsRow) {
    const totalRowHeight = totalsHeight || metrics.minRowHeight;
    let currentX = x + width;
    columns.forEach((column, index) => {
      const cellWidth = columnWidths[index];
      currentX -= cellWidth;
      drawRoundedRect(ctx, currentX, rowY, cellWidth, totalRowHeight, 0, '#eef1f7', '#d7dbe4', 1);
      const value = index === 0
        ? '\u0627\u0644\u0645\u062c\u0645\u0648\u0639'
        : (totalsRow[column.key] !== undefined ? formatExportCellValue(totalsRow[column.key], column.format) : '');
      const innerWidth = cellWidth - (metrics.paddingX * 2);
      let cellFontSize = metrics.cellFontSize;
      setFont(ctx, '700', cellFontSize);
      while (cellFontSize > 14 && ctx.measureText(String(value ?? '')).width > innerWidth) {
        cellFontSize -= 2;
        setFont(ctx, '700', cellFontSize);
      }
      drawWrappedTableCellText(ctx, value, {
        x: currentX,
        y: rowY,
        width: cellWidth,
        height: totalRowHeight,
        color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
        size: cellFontSize,
        weight: '700',
        lineHeight: metrics.cellLineHeight,
        maxLines: 1,
        align: 'center',
        paddingX: metrics.paddingX,
      });
    });
    rowY += totalRowHeight;
  }

  return rowY;
}

function drawSaudiStatementHeaderGrid(ctx, spec, startY, grid) {
  if (!grid) return startY;

  const fontSize = 30;
  const lineHeight = 44;
  const marginLeft = 60;
  const marginRight = 60;
  const navy = TAY_ALRAWI_BRAND_COLORS.headerNavy;
  const red = '#d82534';

  const rightX = spec.width - marginRight - 80;
  const leftX = marginLeft + 420 - 10;
  const centerX = spec.width / 2 + 140;

  let cursorY = startY + 18;

  if (grid.accountName) {
    drawText(ctx, `${grid.accountLabel || 'اسم التاجر'} : ${grid.accountName}`, rightX, cursorY, {
      align: 'right',
      size: fontSize,
      weight: '700',
      color: navy,
      family: PDF_BODY_FONT_FAMILY,
    });
  }

  drawText(ctx, `${grid.fromLabel || 'من تاريخ'} : ${grid.fromDate || '---'}`, leftX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: navy,
    family: PDF_BODY_FONT_FAMILY,
  });

  cursorY += lineHeight;

  if (grid.totalLabel) {
    drawText(ctx, `${grid.totalLabel}: ${grid.totalValue || '---'}`, rightX, cursorY, {
      align: 'right',
      size: fontSize,
      weight: '700',
      color: grid.totalColor || red,
      family: PDF_BODY_FONT_FAMILY,
    });
  }

  if (grid.selectedLabel) {
    drawText(ctx, `${grid.selectedLabel}: ${grid.selectedValue || '---'}`, centerX, cursorY, {
      align: 'right',
      size: fontSize,
      weight: '700',
      color: navy,
      family: PDF_BODY_FONT_FAMILY,
    });
  }

  drawText(ctx, `${grid.toLabel || 'الى تاريخ'} : ${grid.toDate || '---'}`, leftX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: navy,
    family: PDF_BODY_FONT_FAMILY,
  });

  cursorY += lineHeight;
  return cursorY + 8;
}

function drawPartnershipHeaderGrid(ctx, spec, startY, grid) {
  if (!grid) return startY;

  const fontSize = 30;
  const lineHeight = 46;
  const marginLeft = 60;
  const marginRight = 60;
  const navy = TAY_ALRAWI_BRAND_COLORS.headerNavy;
  const red = '#d82534';

  const rightX = spec.width - marginRight - 40;
  const leftX = marginLeft + 300;
  const centerX = rightX - 500;

  let cursorY = startY + 18;

  drawText(ctx, `اسم التاجر : ${grid.accountName || '---'}`, rightX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: navy,
    family: PDF_BODY_FONT_FAMILY,
  });

  drawText(ctx, `المبلغ الصافي: ${grid.netValue || '---'}`, centerX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: red,
    family: PDF_BODY_FONT_FAMILY,
  });

  drawText(ctx, `من تاريخ : ${grid.fromDate || '---'}`, leftX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: navy,
    family: PDF_BODY_FONT_FAMILY,
  });

  cursorY += lineHeight;

  drawText(ctx, `المبلغ عليه: ${grid.amountOnValue || '---'}`, rightX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: navy,
    family: PDF_BODY_FONT_FAMILY,
  });

  drawText(ctx, `المبلغ له: ${grid.amountForValue || '---'}`, centerX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: navy,
    family: PDF_BODY_FONT_FAMILY,
  });

  drawText(ctx, `الى تاريخ : ${grid.toDate || '---'}`, leftX, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: navy,
    family: PDF_BODY_FONT_FAMILY,
  });

  cursorY += lineHeight;
  return cursorY + 8;
}

function drawTextLineSummary(ctx, spec, startY, summaryCards) {
  if (!summaryCards?.length) return startY;

  const fontSize = 30;
  const lineHeight = 42;
  const marginLeft = 60;
  const marginRight = 60;

  let cursorY = startY + 18;

  const firstCard = summaryCards[0];
  const restCards = summaryCards.slice(1);

  drawText(ctx, `${firstCard.label} :  ${firstCard.value}`, spec.width - marginRight - 80, cursorY, {
    align: 'right',
    size: fontSize,
    weight: '700',
    color: firstCard.color || TAY_ALRAWI_BRAND_COLORS.headerNavy,
    family: PDF_BODY_FONT_FAMILY,
  });

  const leftColWidth = 420;
  const leftGroupX = marginLeft + leftColWidth * 2 + 20;

  for (let i = 0; i < restCards.length; i += 2) {
    const rowY = cursorY + Math.floor(i / 2) * lineHeight;
    const card1 = restCards[i];
    const card2 = restCards[i + 1];

    if (card2) {
      drawText(ctx, `${card2.label} :  ${card2.value}`, marginLeft + leftColWidth - 10, rowY, {
        align: 'right',
        size: fontSize,
        weight: '700',
        color: card2.color || TAY_ALRAWI_BRAND_COLORS.headerNavy,
        family: PDF_BODY_FONT_FAMILY,
      });
    }

    drawText(ctx, `${card1.label} :  ${card1.value}`, leftGroupX, rowY, {
      align: 'right',
      size: fontSize,
      weight: '700',
      color: card1.color || TAY_ALRAWI_BRAND_COLORS.headerNavy,
      family: PDF_BODY_FONT_FAMILY,
    });
  }

  const totalDataRows = Math.ceil(restCards.length / 2);
  cursorY += totalDataRows * lineHeight;

  return cursorY + 8;
}

async function exportReportAsCanvasPdf({ rows, columns, title, subtitle, filename, summaryCards = [], summaryGrid, totalsRow, orientation = 'landscape', branded, summaryStyle, sectionKey }) {
  await ensurePdfFontsReady();
  const assets = await loadBrandAssets({}, { sectionKey });
  const spec = CANVAS_PAGE_SPECS[orientation] || CANVAS_PAGE_SPECS.landscape;
  const marginX = 54;
  const topGap = 160;
  const tableGap = 24;

  const useTextLines = summaryStyle === 'text-lines';
  const useSaudiGrid = summaryStyle === 'saudi-statement-grid' && summaryGrid;
  const usePartnerGrid = summaryStyle === 'partnership-grid' && summaryGrid;
  const pageProbe = createCanvasPage(orientation);
  const { headerHeight, footerHeight } = drawPageBackdrop(pageProbe.ctx, pageProbe.spec, branded, assets);
  let firstPageTableY;
  if (usePartnerGrid) {
    const summaryEndY = drawPartnershipHeaderGrid(pageProbe.ctx, spec, headerHeight + 8, summaryGrid);
    firstPageTableY = summaryEndY + tableGap;
  } else if (useSaudiGrid) {
    const summaryEndY = drawSaudiStatementHeaderGrid(pageProbe.ctx, spec, headerHeight + 8, summaryGrid);
    firstPageTableY = summaryEndY + tableGap;
  } else if (useTextLines && summaryCards.length) {
    const summaryEndY = drawTextLineSummary(pageProbe.ctx, spec, headerHeight + 8, summaryCards);
    firstPageTableY = summaryEndY + tableGap;
  } else {
    const titleEndY = drawCenteredReportHeader(pageProbe.ctx, spec, headerHeight + topGap, { title, subtitle });
    const summaryEndY = drawAdaptiveSummaryCards(pageProbe.ctx, spec, marginX, titleEndY + 8, spec.width - marginX * 2, summaryCards);
    firstPageTableY = summaryCards.length ? summaryEndY + tableGap : titleEndY + 16;
  }
  const nextPageTableY = headerHeight + topGap + 52;
  const tableLayout = measureAdaptiveTableLayout(pageProbe.ctx, {
    columns,
    rows,
    totalsRow,
    width: spec.width - marginX * 2,
    orientation,
  });
  const availableFirstPageHeight = Math.max(120, spec.height - footerHeight - 26 - firstPageTableY - tableLayout.headerHeight);
  const availableOtherPageHeight = Math.max(120, spec.height - footerHeight - 26 - nextPageTableY - tableLayout.headerHeight);
  const pageSlices = paginateMeasuredRows(
    tableLayout.rowHeights,
    availableFirstPageHeight,
    availableOtherPageHeight,
    tableLayout.totalsHeight,
  );

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });

  for (let pageIndex = 0; pageIndex < pageSlices.length; pageIndex += 1) {
    if (pageIndex > 0) doc.addPage();

    const { canvas, ctx } = createCanvasPage(orientation);
    const { headerHeight: currentHeaderHeight, footerHeight: currentFooterHeight } = drawPageBackdrop(ctx, spec, branded, assets);

    let tableY;
    if (usePartnerGrid) {
      if (pageIndex === 0) {
        const currentSummaryEndY = drawPartnershipHeaderGrid(ctx, spec, currentHeaderHeight + 8, summaryGrid);
        tableY = currentSummaryEndY + tableGap;
      } else {
        tableY = nextPageTableY;
      }
    } else if (useSaudiGrid) {
      if (pageIndex === 0) {
        const currentSummaryEndY = drawSaudiStatementHeaderGrid(ctx, spec, currentHeaderHeight + 8, summaryGrid);
        tableY = currentSummaryEndY + tableGap;
      } else {
        tableY = nextPageTableY;
      }
    } else if (useTextLines && summaryCards.length) {
      if (pageIndex === 0) {
        const currentSummaryEndY = drawTextLineSummary(ctx, spec, currentHeaderHeight + 8, summaryCards);
        tableY = currentSummaryEndY + tableGap;
      } else {
        tableY = nextPageTableY;
      }
    } else {
      const currentTitleEndY = drawCenteredReportHeader(ctx, spec, currentHeaderHeight + topGap, { title, subtitle });
      if (pageIndex === 0) {
        const currentSummaryEndY = drawAdaptiveSummaryCards(ctx, spec, marginX, currentTitleEndY + 8, spec.width - marginX * 2, summaryCards);
        tableY = summaryCards.length ? currentSummaryEndY + tableGap : currentTitleEndY + 16;
      } else {
        tableY = nextPageTableY;
      }
    }

    const slice = pageSlices[pageIndex];
    const pageRows = rows.slice(slice.start, slice.end);
    const pageRowHeights = tableLayout.rowHeights.slice(slice.start, slice.end);
    const isLastPage = pageIndex === pageSlices.length - 1;
    drawAdaptiveTable(ctx, {
      x: marginX,
      y: tableY,
      width: spec.width - marginX * 2,
      columns,
      rows: pageRows,
      rowHeights: pageRowHeights,
      totalsRow: isLastPage ? totalsRow : null,
      orientation,
      layout: tableLayout,
    });

    drawFooterOverlay(ctx, spec, currentFooterHeight, pageIndex + 1, pageSlices.length, { showMeta: true });
    doc.addImage(canvas.toDataURL('image/png', 1), 'PNG', 0, 0, spec.pdfWidth, spec.pdfHeight);
  }

  doc.save(`${filename}.pdf`);
}

function buildSaudiStatementPdfSummaryCards(printContext = {}, templateVariant = 'both') {
  const totals = printContext?.totals || {};
  const summaryCards = [
    { label: 'اسم التاجر', value: printContext?.accountName || '---' },
    { label: 'من تاريخ', value: printContext?.fromDate || '---' },
    { label: 'إلى تاريخ', value: printContext?.toDate || '---' },
  ];

  const totalUsd = `$${Number(totals.totalInvoicesUSD || 0).toLocaleString('en-US')}`;
  const totalIqd = `${Number(totals.totalInvoicesIQD || 0).toLocaleString('en-US')} د.ع`;
  const balanceUsd = `$${Number(totals.balanceUSD || 0).toLocaleString('en-US')}`;
  const balanceIqd = `${Number(totals.balanceIQD || 0).toLocaleString('en-US')} د.ع`;

  if (templateVariant === 'usd') {
    summaryCards.push(
      { label: 'الطلب الكلي', value: totalUsd },
      { label: 'مبلغ المحدد', value: balanceUsd },
    );
  } else if (templateVariant === 'iqd') {
    summaryCards.push(
      { label: 'الطلب الكلي', value: totalIqd },
      { label: 'مبلغ المحدد', value: balanceIqd },
    );
  } else {
    summaryCards.push(
      { label: 'الطلب الكلي دولار', value: totalUsd },
      { label: 'الطلب الكلي دينار', value: totalIqd },
      { label: 'مبلغ المحدد دولار', value: balanceUsd },
      { label: 'مبلغ المحدد دينار', value: balanceIqd },
    );
  }

  if (totals.totalWeight !== undefined && totals.totalWeight !== null) {
    summaryCards.push({
      label: 'مجموع الوزن الكلي',
      value: Number(totals.totalWeight || 0).toLocaleString('en-US'),
    });
  }

  return summaryCards;
}

function buildUnifiedSaudiStatementPdfSummaryCards(printContext = {}, templateVariant = 'both') {
  const totals = printContext?.totals || {};
  const summaryCards = [
    { label: '\u0627\u0633\u0645 \u0627\u0644\u062a\u0627\u062c\u0631', value: printContext?.accountName || '---' },
    { label: '\u0645\u0646 \u062a\u0627\u0631\u064a\u062e', value: printContext?.fromDate || '---' },
    { label: '\u0625\u0644\u0649 \u062a\u0627\u0631\u064a\u062e', value: printContext?.toDate || '---' },
  ];

  const totalUsd = `$${Number(totals.totalInvoicesUSD || 0).toLocaleString('en-US')}`;
  const totalIqd = `${Number(totals.totalInvoicesIQD || 0).toLocaleString('en-US')} \u062f.\u0639`;
  const balanceUsd = `$${Number(totals.balanceUSD || 0).toLocaleString('en-US')}`;
  const balanceIqd = `${Number(totals.balanceIQD || 0).toLocaleString('en-US')} \u062f.\u0639`;

  if (templateVariant === 'usd') {
    summaryCards.push(
      { label: '\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0643\u0644\u064a', value: totalUsd },
      { label: '\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062d\u062f\u062f', value: balanceUsd },
    );
  } else if (templateVariant === 'iqd') {
    summaryCards.push(
      { label: '\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0643\u0644\u064a', value: totalIqd },
      { label: '\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062d\u062f\u062f', value: balanceIqd },
    );
  } else {
    summaryCards.push(
      { label: '\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0643\u0644\u064a \u062f\u0648\u0644\u0627\u0631', value: totalUsd },
      { label: '\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0643\u0644\u064a \u062f\u064a\u0646\u0627\u0631', value: totalIqd },
      { label: '\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062d\u062f\u062f \u062f\u0648\u0644\u0627\u0631', value: balanceUsd },
      { label: '\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062d\u062f\u062f \u062f\u064a\u0646\u0627\u0631', value: balanceIqd },
    );
  }

  if (totals.totalWeight !== undefined && totals.totalWeight !== null) {
    summaryCards.push({
      label: '\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0648\u0632\u0646 \u0627\u0644\u0643\u0644\u064a',
      value: Number(totals.totalWeight || 0).toLocaleString('en-US'),
    });
  }

  return summaryCards;
}

const INVOICE_SHELL_MARGIN = 52;
const INVOICE_SHELL_PADDING = 20;
const INVOICE_SECTION_GAP = 18;
const INVOICE_CARD_GAP = 12;
const INVOICE_FIELD_CARD_HEIGHT = 96;

function inferInvoiceTargetKey(transaction = {}) {
  const typeId = Number(transaction?.TransTypeID);
  if (typeId === 2) return 'payment';
  if (typeId === 3) return 'debit-note';
  return 'invoice';
}

function isInvoiceNotesSection(section = {}) {
  const keys = (section.items || []).map((item) => String(item.key || '').toLowerCase());
  return keys.length > 0 && keys.every((key) => key.includes('note'));
}

function getInvoiceSectionTone(section = {}) {
  const keys = (section.items || []).map((item) => String(item.key || '').toLowerCase());

  if (isInvoiceNotesSection(section)) {
    return {
      fill: '#fafafc',
      stroke: '#d8deea',
      accent: TAY_ALRAWI_BRAND_COLORS.accentRedDark,
      value: '#1f2937',
    };
  }

  if (keys.some((key) => (
    key.includes('amount')
    || key.includes('cost')
    || key.includes('fee')
    || key.includes('price')
    || key.includes('cus')
  ))) {
    return {
      fill: '#fff5f5',
      stroke: '#f2c7cb',
      accent: TAY_ALRAWI_BRAND_COLORS.accentRedDark,
      value: '#7f1d1d',
    };
  }

  return {
    fill: '#f8fafc',
    stroke: '#d8deea',
    accent: TAY_ALRAWI_BRAND_COLORS.headerNavy,
    value: TAY_ALRAWI_BRAND_COLORS.headerNavy,
  };
}

function measureInvoiceNoteCardHeight(ctx, value, width) {
  setFont(ctx, '500', 72);
  const lineCount = wrapTextLines(ctx, value, width).slice(0, 5).length;
  return Math.max(240, 150 + (lineCount * 82));
}

function measureInvoiceSectionHeight(ctx, section, width) {
  const contentWidth = width - INVOICE_SHELL_PADDING * 2;
  let contentHeight = 82;

  if (section.subtitle) {
    setFont(ctx, '500', 18);
    const subtitleLines = wrapTextLines(ctx, section.subtitle, contentWidth).slice(0, 2).length;
    contentHeight += subtitleLines * 24 + 8;
  }

  if (isInvoiceNotesSection(section)) {
    const totalNotesHeight = (section.items || []).reduce((sum, item, index) => (
      sum
      + measureInvoiceNoteCardHeight(ctx, item.value, contentWidth - 28)
      + (index > 0 ? INVOICE_CARD_GAP : 0)
    ), 0);
    return contentHeight + totalNotesHeight + INVOICE_SHELL_PADDING;
  }

  const rows = Math.ceil((section.items || []).length / 2);
  if (!rows) return contentHeight + INVOICE_SHELL_PADDING;

  return contentHeight
    + (rows * INVOICE_FIELD_CARD_HEIGHT)
    + ((rows - 1) * 18)
    + INVOICE_SHELL_PADDING;
}

function drawInvoiceMetaCard(ctx, x, y, width, height, label, value) {
  drawRoundedRect(ctx, x, y, width, height, 12, '#f8fafc', '#d7ddea', 1);
  drawText(ctx, label, x + width - 16, y + 22, {
    size: 15,
    weight: '700',
    color: '#64748b',
    maxWidth: width - 32,
  });
  drawWrappedText(ctx, value, x + width - 16, y + 42, {
    maxWidth: width - 32,
    lineHeight: 19,
    maxLines: 2,
    size: 19,
    weight: '700',
    color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
  });
}

function drawInvoiceHeaderBlock(ctx, spec, assets, {
  title,
  companyName,
  transactionTypeLabel,
  metaItems,
}, startY) {
  const shellX = INVOICE_SHELL_MARGIN;
  const shellWidth = spec.width - (INVOICE_SHELL_MARGIN * 2);
  const titleCenterX = shellX + (shellWidth / 2);
  const textLeftX = shellX + 28;
  const metaGap = 12;
  const metaInset = 18;
  const metaWidth = (shellWidth - (metaInset * 2) - (metaGap * 3)) / 4;
  const titleText = title || transactionTypeLabel;
  const titleWidth = shellWidth - 260;
  const titleHeight = measureWrappedText(ctx, titleText, {
    maxWidth: titleWidth,
    lineHeight: 38,
    maxLines: 2,
    size: 48,
    weight: '800',
    family: PDF_TITLE_FONT_FAMILY,
  });
  const companyY = startY + 32 + titleHeight + 10;
  const companyHeight = measureWrappedText(ctx, companyName, {
    maxWidth: shellWidth - 300,
    lineHeight: 24,
    maxLines: 2,
    size: 22,
    weight: '700',
    family: PDF_BODY_FONT_FAMILY,
  });
  const shouldShowSideType = Boolean(transactionTypeLabel && transactionTypeLabel !== titleText);
  const metaY = Math.max(startY + 132, companyY + companyHeight + 20);
  const shellHeight = (metaY - startY) + 96;

  drawRoundedRect(ctx, shellX, startY, shellWidth, shellHeight, 18, '#ffffff', '#d7ddea', 1.8);
  ctx.strokeStyle = TAY_ALRAWI_BRAND_COLORS.accentRedDark;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(shellX + shellWidth - 220, startY + 22);
  ctx.lineTo(shellX + shellWidth - 24, startY + 22);
  ctx.stroke();

  drawWrappedText(ctx, titleText, titleCenterX, startY + 32, {
    align: 'center',
    maxWidth: titleWidth,
    lineHeight: 38,
    maxLines: 2,
    size: 48,
    weight: '800',
    color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
    family: PDF_TITLE_FONT_FAMILY,
  });
  drawWrappedText(ctx, companyName, titleCenterX, companyY, {
    align: 'center',
    maxWidth: shellWidth - 300,
    lineHeight: 24,
    maxLines: 2,
    size: 22,
    weight: '700',
    color: '#475569',
    family: PDF_BODY_FONT_FAMILY,
  });
  if (shouldShowSideType) {
    drawText(ctx, transactionTypeLabel, textLeftX, companyY + 2, {
      align: 'left',
      size: 22,
      weight: '700',
      color: TAY_ALRAWI_BRAND_COLORS.accentRedDark,
      maxWidth: 240,
      family: PDF_BODY_FONT_FAMILY,
    });
  }

  metaItems.slice(0, 4).forEach((item, index) => {
    drawInvoiceMetaCard(ctx, shellX + metaInset + (index * (metaWidth + metaGap)), metaY, metaWidth, 72, item.label, item.value);
  });

  return startY + shellHeight;
}

function drawInvoiceContinuationHeader(ctx, spec, { title, referenceText }, startY) {
  const shellX = INVOICE_SHELL_MARGIN;
  const shellWidth = spec.width - (INVOICE_SHELL_MARGIN * 2);
  const shellHeight = 82;
  const titleCenterX = shellX + (shellWidth / 2);

  drawRoundedRect(ctx, shellX, startY, shellWidth, shellHeight, 14, '#ffffff', '#d7ddea', 1.6);
  drawWrappedText(ctx, title, titleCenterX, startY + 26, {
    align: 'center',
    size: 30,
    weight: '800',
    lineHeight: 28,
    maxLines: 1,
    color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
    maxWidth: shellWidth - 360,
    family: PDF_TITLE_FONT_FAMILY,
  });
  drawText(ctx, referenceText, shellX + 20, startY + 28, {
    align: 'left',
    size: 18,
    weight: '600',
    color: '#334155',
    maxWidth: 280,
    family: PDF_BODY_FONT_FAMILY,
  });

  return startY + shellHeight;
}

function drawInvoiceSection(ctx, spec, section, startY, width) {
  const shellX = INVOICE_SHELL_MARGIN;
  const contentWidth = width - INVOICE_SHELL_PADDING * 2;
  const tone = getInvoiceSectionTone(section);
  const sectionHeight = measureInvoiceSectionHeight(ctx, section, width);

  drawRoundedRect(ctx, shellX, startY, width, sectionHeight, 16, '#ffffff', tone.stroke, 1.8);
  drawRoundedRect(ctx, shellX, startY, width, 46, 16, tone.fill);
  drawText(ctx, section.title || '-', shellX + width - 22, startY + 42, {
    size: 42,
    weight: '800',
    color: tone.accent,
    maxWidth: width - 44,
  });

  let contentY = startY + 86;
  if (section.subtitle) {
    const subtitleHeight = drawWrappedText(ctx, section.subtitle, shellX + width - 22, contentY, {
      maxWidth: width - 44,
      lineHeight: 20,
      maxLines: 2,
      size: 16,
      weight: '500',
      color: '#64748b',
    });
    contentY += subtitleHeight + 6;
  }

  if (isInvoiceNotesSection(section)) {
    (section.items || []).forEach((item) => {
      const noteHeight = measureInvoiceNoteCardHeight(ctx, item.value, contentWidth - 28);
      drawRoundedRect(ctx, shellX + INVOICE_SHELL_PADDING, contentY, contentWidth, noteHeight, 12, '#ffffff', '#d7ddea', 1);
      drawText(ctx, item.label, shellX + width - 36, contentY + 52, {
        size: 52,
        weight: '700',
        color: tone.accent,
        maxWidth: contentWidth - 32,
      });
      drawWrappedText(ctx, item.value, shellX + width - 36, contentY + 128, {
        maxWidth: contentWidth - 32,
        lineHeight: 82,
        maxLines: 5,
        size: 72,
        weight: '500',
        color: '#1f2937',
      });
      contentY += noteHeight + INVOICE_CARD_GAP;
    });

    return sectionHeight;
  }

  const rowHeight = INVOICE_FIELD_CARD_HEIGHT;
  const rowGap = 18;
  const rowWidth = contentWidth;
  const cellWidth = rowWidth / 2;
  const groupedItems = [];

  for (let index = 0; index < (section.items || []).length; index += 2) {
    groupedItems.push((section.items || []).slice(index, index + 2));
  }

  groupedItems.forEach((rowItems, rowIndex) => {
    const rowY = contentY + (rowIndex * (rowHeight + rowGap));
    const rowX = shellX + INVOICE_SHELL_PADDING;

    drawRoundedRect(ctx, rowX, rowY, rowWidth, rowHeight, 10, '#ffffff', '#d7ddea', 1);

    if (rowItems.length > 1) {
      ctx.strokeStyle = '#d7ddea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rowX + cellWidth, rowY + 12);
      ctx.lineTo(rowX + cellWidth, rowY + rowHeight - 12);
      ctx.stroke();
    }

    rowItems.forEach((item, itemIndex) => {
      const cellX = rowItems.length === 1
        ? rowX
        : (itemIndex === 0 ? rowX + cellWidth : rowX);
      const currentWidth = rowItems.length === 1 ? rowWidth : cellWidth;

      drawText(ctx, item.label, cellX + currentWidth - 16, rowY + 56, {
        size: 46,
        weight: '700',
        color: '#64748b',
        maxWidth: currentWidth - 32,
      });
      drawWrappedText(ctx, item.value, cellX + currentWidth - 16, rowY + 152, {
        maxWidth: currentWidth - 32,
        lineHeight: 76,
        maxLines: 2,
        size: 72,
        weight: '700',
        color: tone.value,
      });
    });
  });

  return sectionHeight;
}

async function exportInvoiceAsCanvasPdfV2({
  transaction,
  title,
  companyName,
  branded,
  sectionKey,
}) {
  await ensurePdfFontsReady();
  const targetKey = inferInvoiceTargetKey(transaction);
  const transactionTypeLabel = getTransactionTypeLabel(transaction?.TransTypeName, transaction?.TransTypeID, {
    sectionKey,
    recordType: transaction?.RecordType,
  });
  const documentTitle = title || transactionTypeLabel;
  const metaItems = buildInvoiceHeaderMeta(transaction, targetKey, sectionKey);
  const sections = buildInvoiceExportSections(transaction, sectionKey, targetKey);
  const assets = await loadBrandAssets(branded ? { footer: TAY_ALRAWI_BRAND_ASSETS.invoiceFooter } : {});
  const pages = [];

  const createInvoicePage = () => {
    const page = createCanvasPage('portrait');
    const chrome = drawInvoiceBackdrop(page.ctx, page.spec, branded, assets);
    return { ...page, ...chrome };
  };

  let currentPage = createInvoicePage();
  const shellWidth = currentPage.spec.width - (INVOICE_SHELL_MARGIN * 2);
  let currentY = drawInvoiceHeaderBlock(currentPage.ctx, currentPage.spec, assets, {
    title: documentTitle,
    companyName,
    transactionTypeLabel,
    metaItems,
  }, currentPage.headerHeight + 26) + 18;

  sections.forEach((section) => {
    const sectionHeight = measureInvoiceSectionHeight(currentPage.ctx, section, shellWidth);
    const availableBottom = currentPage.spec.height - currentPage.footerHeight - 28;

    if (currentY + sectionHeight > availableBottom) {
      pages.push(currentPage);
      currentPage = createInvoicePage();
      currentY = drawInvoiceContinuationHeader(currentPage.ctx, currentPage.spec, {
        title: documentTitle,
        referenceText: `${metaItems[0]?.label || 'Reference'}: ${metaItems[0]?.value || '-'}`,
      }, currentPage.headerHeight + 26) + 16;
    }

    currentY += drawInvoiceSection(currentPage.ctx, currentPage.spec, section, currentY, shellWidth) + INVOICE_SECTION_GAP;
  });

  pages.push(currentPage);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  pages.forEach((page, pageIndex) => {
    if (pageIndex > 0) {
      doc.addPage();
    }

    drawInvoiceFooterOverlay(page.ctx, page.spec, page.footerHeight, pageIndex + 1, pages.length);
    doc.addImage(page.canvas.toDataURL('image/png', 1), 'PNG', 0, 0, page.spec.pdfWidth, page.spec.pdfHeight);
  });

  doc.save(`${transaction.RefNo || 'invoice'}.pdf`);
}

function getInvoiceFields(transaction, transactionTypeLabel) {
  return [
    { label: 'اسم التاجر', value: transaction.AccountName || '-' },
    { label: 'العملة', value: getCurrencyLabel(transaction.CurrencyName || transaction.Currency) },
    { label: 'اسم السائق', value: transaction.DriverName || '-' },
    { label: 'رقم السيارة', value: transaction.PlateNumber || transaction.VehiclePlate || '-' },
    { label: 'نوع البضاعة', value: transaction.GoodTypeName || transaction.GoodType || '-' },
    { label: 'الوزن', value: transaction.Weight ? Number(transaction.Weight).toLocaleString('en-US') : '-' },
    { label: 'العدد', value: transaction.Qty || '-' },
    { label: 'الأمتار', value: transaction.Meters || '-' },
    { label: 'المبلغ دولار', value: transaction.AmountUSD ? `$${Number(transaction.AmountUSD).toLocaleString('en-US')}` : '-' },
    { label: 'المبلغ دينار', value: transaction.AmountIQD ? `${Number(transaction.AmountIQD).toLocaleString('en-US')} د.ع` : '-' },
    { label: 'المحافظة', value: transaction.GovName || '-' },
    { label: 'الشركة', value: transaction.CompanyName || '-' },
    { label: 'نوع الحركة', value: transactionTypeLabel },
    { label: 'المنفذ', value: transaction.PortName || '-' },
  ];
}

async function exportInvoiceAsCanvasPdf({ transaction, title, companyName, branded, sectionKey }) {
  await ensurePdfFontsReady();
  const { canvas, ctx, spec } = createCanvasPage('portrait');
  const assets = await loadBrandAssets();
  const { headerHeight, footerHeight } = drawPageBackdrop(ctx, spec, branded, assets);
  const transactionTypeLabel = getTransactionTypeLabel(transaction?.TransTypeName, transaction?.TransTypeID, {
    sectionKey,
    recordType: transaction?.RecordType,
  });
  const xRight = spec.width - 52;

  drawText(ctx, title || transactionTypeLabel, xRight, headerHeight + 34, {
    size: 46,
    weight: '700',
    color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
    maxWidth: spec.width - 120,
  });
  drawText(ctx, companyName, xRight, headerHeight + 68, {
    size: 28,
    weight: '700',
    color: TAY_ALRAWI_BRAND_COLORS.accentRedDark,
    maxWidth: spec.width - 120,
  });

  drawText(ctx, `رقم المرجع: ${transaction.RefNo || '-'}`, 52, headerHeight + 34, {
    align: 'left',
    size: 26,
    weight: '600',
    color: '#1f2937',
    maxWidth: 300,
  });
  drawText(ctx, `التاريخ: ${transaction.TransDate?.split(' ')[0] || '-'}`, 52, headerHeight + 68, {
    align: 'left',
    size: 26,
    weight: '600',
    color: '#1f2937',
    maxWidth: 300,
  });

  const fields = getInvoiceFields(transaction, transactionTypeLabel);
  const cardWidth = (spec.width - 52 * 2 - 20) / 2;
  const cardHeight = 108;
  const gridY = headerHeight + 102;

  fields.forEach((field, index) => {
    const columnIndex = index % 2;
    const rowIndex = Math.floor(index / 2);
    const x = spec.width - 52 - cardWidth - (columnIndex * (cardWidth + 20));
    const y = gridY + rowIndex * (cardHeight + 14);

    drawRoundedRect(ctx, x, y, cardWidth, cardHeight, 18, '#ffffff', '#d8dce7', 2);
    drawText(ctx, field.label, x + cardWidth - 16, y + 20, {
      size: 22,
      weight: '700',
      color: '#5c6482',
      maxWidth: cardWidth - 24,
    });
    drawText(ctx, field.value, x + cardWidth - 16, y + 46, {
      size: 30,
      weight: '700',
      color: TAY_ALRAWI_BRAND_COLORS.headerNavy,
      maxWidth: cardWidth - 24,
    });
  });

  const notes = [transaction.TraderNote, transaction.Notes, transaction.CustomsNote].filter(Boolean);
  if (notes.length > 0) {
    const noteY = gridY + Math.ceil(fields.length / 2) * (cardHeight + 14) + 10;
    drawRoundedRect(ctx, 52, noteY, spec.width - 104, 110, 16, '#ffffff', '#d8dce7', 1.5);
    drawText(ctx, 'الملاحظات', spec.width - 70, noteY + 24, {
      size: 24,
      weight: '700',
      color: TAY_ALRAWI_BRAND_COLORS.accentRedDark,
      maxWidth: 300,
    });
    drawText(ctx, notes.join(' | '), spec.width - 70, noteY + 58, {
      size: 24,
      weight: '500',
      color: '#1f2937',
      maxWidth: spec.width - 150,
    });
  }

  drawFooterOverlay(ctx, spec, footerHeight, 1, 1, { showMeta: false });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.addImage(canvas.toDataURL('image/png', 1), 'PNG', 0, 0, spec.pdfWidth, spec.pdfHeight);
  doc.save(`${transaction.RefNo || 'invoice'}.pdf`);
}

export async function exportToPDF({
  rows,
  columns,
  title,
  subtitle,
  filename,
  summaryCards,
  totalsRow,
  orientation = 'landscape',
  sectionKey,
  summaryStyle,
  printContext,
}) {
  const branded = shouldUseTayAlRawiBranding({ sectionKey });

  if (sectionKey === 'special-partner' && printContext) {
    const totals = printContext.totals || {};
    const fmt = (val) => Number(val || 0).toLocaleString('en-US');
    const summaryGrid = {
      accountName: printContext.accountName || '---',
      fromDate: printContext.fromDate || '---',
      toDate: printContext.toDate || '---',
      amountOnValue: `$${fmt(totals.totalAmountUSD)}`,
      amountForValue: `$${fmt(totals.totalPartnerUSD)}`,
      netValue: `$${fmt(totals.totalNetUSD)}`,
    };

    await exportReportAsCanvasPdf({
      rows,
      columns,
      title: undefined,
      subtitle: undefined,
      filename,
      summaryGrid,
      totalsRow,
      orientation,
      branded,
      summaryStyle: 'partnership-grid',
      sectionKey,
    });
    return;
  }

  await exportReportAsCanvasPdf({
    rows,
    columns,
    title,
    subtitle,
    filename,
    summaryCards,
    totalsRow,
    orientation,
    branded,
    summaryStyle,
    sectionKey,
  });
}

function buildPortStatementSummaryCards(printContext = {}) {
  const totals = printContext?.totals || {};
  const fmt = (val) => Number(val || 0).toLocaleString('en-US');
  const cards = [];

  if (printContext.accountName) {
    cards.push({ label: 'اسم التاجر', value: printContext.accountName });
  }
  if (printContext.fromDate || printContext.toDate) {
    const range = `${printContext.fromDate || '---'}  →  ${printContext.toDate || '---'}`;
    cards.push({ label: 'الفترة', value: range });
  }
  if (totals.totalInvoicesIQD !== undefined) {
    cards.push({ label: 'الاجمالي دينار', value: fmt(totals.totalInvoicesIQD) });
  }
  if (totals.balanceIQD !== undefined) {
    cards.push({ label: 'المبلغ المحدد دينار', value: fmt(totals.balanceIQD), color: '#d82534' });
  }
  if (totals.totalInvoicesUSD !== undefined) {
    cards.push({ label: 'الاجمالي دولار', value: `$${fmt(totals.totalInvoicesUSD)}` });
  }
  if (totals.balanceUSD !== undefined) {
    cards.push({ label: 'المبلغ المحدد دولار', value: `$${fmt(totals.balanceUSD)}`, color: '#d82534' });
  }
  if (totals.totalWeight !== undefined && totals.totalWeight !== null) {
    cards.push({ label: 'مجموع الوزن', value: fmt(totals.totalWeight) });
  }
  return cards;
}

export async function exportSaudiStatementPDF({
  rows,
  columns,
  title,
  subtitle,
  filename,
  templateVariant = 'both',
  printContext,
  sectionKey,
  totalsRow,
}) {
  const branded = shouldUseTayAlRawiBranding({ sectionKey });
  const useGridHeader = templateVariant === 'usd' || templateVariant === 'iqd';

  if (useGridHeader) {
    const totals = printContext?.totals || {};
    const fmt = (val) => Number(val || 0).toLocaleString('en-US');
    const totalValue = templateVariant === 'usd'
      ? `$${fmt(totals.totalInvoicesUSD)}`
      : fmt(totals.totalInvoicesIQD);
    const selectedValue = templateVariant === 'usd'
      ? `$${fmt(totals.balanceUSD)}`
      : fmt(totals.balanceIQD);

    const summaryGrid = {
      accountName: sectionKey === 'port-3' ? null : (printContext?.accountName || '---'),
      fromDate: printContext?.fromDate || '---',
      toDate: printContext?.toDate || '---',
      totalLabel: '\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0643\u0644\u064a',
      totalValue,
      selectedLabel: '\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u062d\u062f\u062f',
      selectedValue,
    };

    await exportReportAsCanvasPdf({
      rows,
      columns,
      title,
      subtitle: subtitle || '\u0643\u0634\u0641 \u062d\u0633\u0627\u0628',
      filename,
      summaryGrid,
      totalsRow,
      summaryStyle: 'saudi-statement-grid',
      orientation: 'landscape',
      branded,
      sectionKey,
    });
    return;
  }

  const summaryCards = buildPortStatementSummaryCards(printContext);

  await exportReportAsCanvasPdf({
    rows,
    columns,
    title,
    subtitle: subtitle || '\u0643\u0634\u0641 \u062d\u0633\u0627\u0628',
    filename,
    summaryCards,
    totalsRow,
    summaryStyle: summaryCards.length ? 'text-lines' : undefined,
    sectionKey,
    orientation: 'landscape',
    branded,
  });
}

export async function exportInvoicePDF({
  transaction,
  title,
  companyName = '\u0634\u0631\u0643\u0629 \u0637\u064a \u0627\u0644\u0631\u0627\u0648\u064a \u0644\u0644\u0646\u0642\u0644 \u0648\u0627\u0644\u062a\u062e\u0644\u064a\u0635 \u0627\u0644\u0643\u0645\u0631\u0643\u064a',
  sectionKey,
  portId,
}) {
  const branded = shouldUseTayAlRawiBranding({ sectionKey, portId, transaction });
  await exportInvoiceAsCanvasPdfV2({
    transaction,
    title,
    companyName,
    branded,
    sectionKey,
  });
}
