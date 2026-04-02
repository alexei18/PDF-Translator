const fs   = require('fs');
const path = require('path');
const Module = require('module');
const { PDFDocument } = require('pdf-lib');

// Redirect require('canvas') → @napi-rs/canvas shim
const shimPath = path.resolve(__dirname, 'canvas-shim.js');
const _origResolve = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'canvas') return shimPath;
  return _origResolve(request, parent, isMain, options);
};

const { createCanvas, DOMMatrix, Path2D } = require('@napi-rs/canvas');
if (!globalThis.DOMMatrix) globalThis.DOMMatrix = DOMMatrix;
if (!globalThis.Path2D)   globalThis.Path2D   = Path2D;

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = false;

const PT_TO_PX = 96 / 72; // PDF points → CSS pixels

// ── Matrix helper ─────────────────────────────────────────────────────────────

function multiplyMatrix([a1,b1,c1,d1,e1,f1], [a2,b2,c2,d2,e2,f2]) {
  return [
    a1*a2+c1*b2, b1*a2+d1*b2,
    a1*c2+c1*d2, b1*c2+d1*d2,
    a1*e2+c1*f2+e1, b1*e2+d1*f2+f1,
  ];
}

// ── Image extraction (CTM-tracked) ────────────────────────────────────────────

async function extractImageRegions(page, viewportPt, renderScale, renderedCanvas) {
  const { OPS } = pdfjsLib;
  const ops     = await page.getOperatorList();
  const pageH   = viewportPt.height;

  const ctmStack = [[1,0,0,1,0,0]];
  const seen     = new Set();
  const images   = [];

  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn   = ops.fnArray[i];
    const args = ops.argsArray[i];
    const ctm  = ctmStack[ctmStack.length - 1];

    if      (fn === OPS.save)      { ctmStack.push([...ctm]); continue; }
    else if (fn === OPS.restore)   { if (ctmStack.length > 1) ctmStack.pop(); continue; }
    else if (fn === OPS.transform) { ctmStack[ctmStack.length-1] = multiplyMatrix(ctm, args); continue; }

    const isImg = fn === OPS.paintImageXObject
               || fn === OPS.paintInlineImageXObject
               || fn === OPS.paintImageMaskXObject
               || fn === OPS.paintSolidColorImageMask;
    if (!isImg) continue;

    const [a,b,c,d,e,f] = ctm;
    const pts = [[e,f],[a+e,b+f],[c+e,d+f],[a+c+e,b+d+f]];
    const xs  = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const pdfX = Math.min(...xs), pdfX2 = Math.max(...xs);
    const pdfY = Math.min(...ys), pdfY2 = Math.max(...ys);
    const pdfW = pdfX2 - pdfX, pdfH = pdfY2 - pdfY;

    if (pdfW < 8 || pdfH < 8) continue;

    const key = `${Math.round(pdfX)},${Math.round(pdfY)},${Math.round(pdfW)},${Math.round(pdfH)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const cx = Math.max(0, Math.floor(pdfX  * renderScale));
    const cy = Math.max(0, Math.floor((pageH - pdfY2) * renderScale));
    const cw = Math.min(renderedCanvas.width  - cx, Math.ceil(pdfW * renderScale));
    const ch = Math.min(renderedCanvas.height - cy, Math.ceil(pdfH * renderScale));
    if (cw < 1 || ch < 1) continue;

    const crop    = createCanvas(cw, ch);
    const cropCtx = crop.getContext('2d');
    cropCtx.drawImage(renderedCanvas, cx, cy, cw, ch, 0, 0, cw, ch);
    const base64 = (await crop.encode('png')).toString('base64');

    images.push({
      x:      Math.round(pdfX  * PT_TO_PX),
      y:      Math.round((pageH - pdfY2) * PT_TO_PX),
      width:  Math.round(pdfW  * PT_TO_PX),
      height: Math.round(pdfH  * PT_TO_PX),
      base64,
    });
  }
  return images;
}

// ── Main extractor ────────────────────────────────────────────────────────────

async function extractPdfData(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const standardFontDataUrl = `file://${path
    .join(__dirname, '../node_modules/pdfjs-dist/standard_fonts/')
    .replace(/\\/g, '/')}/`;

  const pdf = await pdfjsLib.getDocument({ data, standardFontDataUrl, useSystemFonts: true, disableFontFace: true }).promise;
  const pages = [];

  let pdfDoc = null;
  try {
    pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  } catch (e) {
    console.warn(`[pdfExtractor] pdf-lib could not parse document (${e.message}) — per-page PDF will be omitted, using screenshots only.`);
  }

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page       = await pdf.getPage(pageNum);
    const viewportPt = page.getViewport({ scale: 1.0 });
    const widthPt    = Math.round(viewportPt.width);
    const heightPt   = Math.round(viewportPt.height);
    const widthPx    = Math.round(widthPt  * PT_TO_PX);
    const heightPx   = Math.round(heightPt * PT_TO_PX);

    const textContent = await page.getTextContent();
    const rawTextItems = textContent.items.map(item => item.str);
    const rawText = rawTextItems.join(' ');

    const renderScale    = 1.5;
    const renderViewport = page.getViewport({ scale: renderScale });
    const canvas         = createCanvas(Math.round(renderViewport.width), Math.round(renderViewport.height));
    await page.render({ canvasContext: canvas.getContext('2d'), viewport: renderViewport }).promise;
    const pageImage = (await canvas.encode('png')).toString('base64');

    let pagePdfBase64 = null;
    if (pdfDoc) {
      try {
        const singlePageDoc = await PDFDocument.create();
        const [copiedPage] = await singlePageDoc.copyPages(pdfDoc, [pageNum - 1]);
        singlePageDoc.addPage(copiedPage);
        pagePdfBase64 = Buffer.from(await singlePageDoc.save()).toString('base64');
      } catch (e) {
        console.warn(`[pdfExtractor] Could not extract page ${pageNum} as PDF: ${e.message}`);
      }
    }

    const images = await extractImageRegions(page, viewportPt, renderScale, canvas);

    pages.push({ pageNum, widthPt, heightPt, width: widthPx, height: heightPx, rawText, images, pageImage, pagePdfBase64 });
  }
  return pages;
}

module.exports = { extractPdfData };