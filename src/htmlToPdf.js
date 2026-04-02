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

async function htmlPagesToPdf(htmlPages) {
  const b = await getBrowser();
  const pagePdfs = [];

  for (const { html, widthPx, heightPx, widthPt, heightPt } of htmlPages) {
    const page = await b.newPage();

    try {
      // Set viewport to match CSS pixel dimensions exactly
      await page.setViewport({ width: widthPx, height: heightPx, deviceScaleFactor: 1 });

      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });

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
