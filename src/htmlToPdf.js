const puppeteer = require('puppeteer');
const { PDFDocument } = require('pdf-lib');

let browser = null;

async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
      ],
    });
  }
  return browser;
}

// ── Overflow fitting ──────────────────────────────────────────────────────────

async function isOverflowing(page, heightPx) {
  return page.evaluate((maxH) => {
    // Check both scroll height and actual bounding boxes (catches absolute-positioned elements)
    const scrollH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
    if (scrollH > maxH + 2) return true;
    const allBottoms = Array.from(document.querySelectorAll('*'))
      .map(el => el.getBoundingClientRect().bottom);
    return allBottoms.some(b => b > maxH + 2);
  }, heightPx);
}

async function fitContentToPage(page, heightPx) {
  if (!(await isOverflowing(page, heightPx))) return;
  console.log('[htmlToPdf] Overflow detected — reducing vertical spacing…');

  // Phase 1: reduce vertical margins, paddings, gaps, line-height by 1px per round
  for (let round = 0; round < 30; round++) {
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        const cs = window.getComputedStyle(el);

        const mt = parseFloat(cs.marginTop);
        if (mt > 0) el.style.marginTop = `${Math.max(0, mt - 1)}px`;

        const mb = parseFloat(cs.marginBottom);
        if (mb > 0) el.style.marginBottom = `${Math.max(0, mb - 1)}px`;

        const pt = parseFloat(cs.paddingTop);
        if (pt > 0) el.style.paddingTop = `${Math.max(0, pt - 1)}px`;

        const pb = parseFloat(cs.paddingBottom);
        if (pb > 0) el.style.paddingBottom = `${Math.max(0, pb - 1)}px`;

        const rg = parseFloat(cs.rowGap);
        if (rg > 0) el.style.rowGap = `${Math.max(0, rg - 1)}px`;

        // line-height: only reduce if it has extra breathing room above 1.1× font size
        const lh = parseFloat(cs.lineHeight);
        const fs = parseFloat(cs.fontSize);
        if (!isNaN(lh) && !isNaN(fs) && lh > fs * 1.1) {
          el.style.lineHeight = `${Math.max(fs, lh - 1)}px`;
        }
      });
    });

    if (!(await isOverflowing(page, heightPx))) {
      console.log(`[htmlToPdf] Fitted after ${round + 1} spacing round(s).`);
      return;
    }
  }

  console.log('[htmlToPdf] Spacing exhausted — reducing font sizes…');

  // Phase 2: reduce all font sizes by 1px per round
  for (let round = 0; round < 25; round++) {
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach(el => {
        const fs = parseFloat(window.getComputedStyle(el).fontSize);
        if (fs > 6) el.style.fontSize = `${fs - 1}px`;
      });
    });

    if (!(await isOverflowing(page, heightPx))) {
      console.log(`[htmlToPdf] Fitted after ${round + 1} font-size reduction round(s).`);
      return;
    }
  }

  console.warn('[htmlToPdf] Warning: content still overflows after all adjustment rounds.');
}

// ── Main converter ────────────────────────────────────────────────────────────

async function htmlPagesToPdf(htmlPages) {
  const b = await getBrowser();
  const pagePdfs = [];

  for (const { html, widthPx, heightPx, widthPt, heightPt } of htmlPages) {
    const page = await b.newPage();

    try {
      // Set viewport to match CSS pixel dimensions exactly
      await page.setViewport({ width: widthPx, height: heightPx, deviceScaleFactor: 1 });

      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

      await fitContentToPage(page, heightPx);

      // Puppeteer v21 supports px/in/cm/mm but NOT pt — convert points to inches (1pt = 1/72in)
      const pdfBuffer = await page.pdf({
        width: `${(widthPt / 72).toFixed(6)}in`,
        height: `${(heightPt / 72).toFixed(6)}in`,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      pagePdfs.push(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  if (pagePdfs.length === 1) return Buffer.from(pagePdfs[0]);

  // Merge all pages into a single PDF using pdf-lib
  const merged = await PDFDocument.create();

  for (const buf of pagePdfs) {
    const doc = await PDFDocument.load(buf);
    const indices = doc.getPageIndices();
    const copied = await merged.copyPages(doc, indices);
    copied.forEach((p) => merged.addPage(p));
  }

  return Buffer.from(await merged.save());
}

// Clean up browser on process exit
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

process.on('exit', () => { if (browser) browser.close(); });
process.on('SIGINT', () => closeBrowser().then(() => process.exit(0)));
process.on('SIGTERM', () => closeBrowser().then(() => process.exit(0)));

module.exports = { htmlPagesToPdf, closeBrowser };
