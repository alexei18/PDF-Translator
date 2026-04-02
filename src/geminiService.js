const { GoogleGenerativeAI } = require('@google/generative-ai');

// Model priority list — first available wins.
const MODEL_FALLBACK_CHAIN = [
  process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  'gemini-3-flash-preview',
  'gemini-3-flash-preview',
];

let genAI = null;

function getGenAI() {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set in .env');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

function getModel(modelName) {
  return getGenAI().getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0.1, maxOutputTokens: 65536 },
  });
}

function extractHtml(text) {
  const fenced = text.match(/```(?:html)?\s*\n([\s\S]*?)\n```/i);
  if (fenced) return fenced[1].trim();

  const doctype = text.match(/(<!DOCTYPE\s+html[\s\S]*)/i);
  if (doctype) return doctype[1].trim();

  const html = text.match(/(<html[\s\S]*<\/html>)/i);
  if (html) return html[1].trim();

  return text.trim();
}

async function withRetry(fn, { maxAttempts = 4, baseDelayMs = 2000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err.message || '';
      const isRetryable = err.status === 503 || err.status === 429 ||
        msg.includes('503') || msg.includes('429') ||
        msg.includes('Service Unavailable') || msg.includes('Too Many Requests');

      if (!isRetryable || attempt === maxAttempts) throw err;

      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(`[Gemini] Attempt ${attempt} failed. Retrying in ${delay / 1000}s…`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function rehydrateImages(translatedHtml, images) {
  let html = translatedHtml;
  for (let i = 0; i < images.length; i++) {
    const placeholder = `IMAGE_${i}`;
    const base64 = images[i].base64;
    html = html.replace(new RegExp(placeholder, 'g'), `data:image/png;base64,${base64}`);
  }
  return html;
}

async function generateTranslatedHtml(pageData, targetLanguage) {
  const { pagePdfBase64, pageImage, rawText, images, width, height } = pageData;

  const prompt = `You are an expert PDF-to-HTML converter and translator.
I am providing you with:
1. The original PDF page file (as a document).
2. A PNG screenshot of the same page.
3. The raw extracted text (to assist with OCR).

TASK:
1. Recreate this page as a single, self-contained HTML document.
2. Translate all text into **${targetLanguage}**.
3. **LAYOUT & SPACING**: The HTML must visually match the original layout.
   Set the main container to: width: ${width}px; min-height: ${height}px; position: relative; overflow: hidden;
4. **FONT SIZES — CRITICAL**: You MUST preserve the EXACT font sizes from the original document.
   - Carefully inspect the PDF and screenshot to determine the precise font size of every text element.
   - Set an explicit \`font-size\` in CSS (in px) on every text element — headings, body paragraphs, captions, footnotes, labels, table cells, etc.
   - Do NOT rely on browser defaults, do NOT use relative units like \`em\` or \`rem\` without an explicit base, do NOT round or approximate sizes.
   - If a heading is 24px in the original, it must be 24px. If body text is 11px, it must be 11px. Precision is required.
5. **CRITICAL PREVENT OVERLAPPING**:
   - Translated text often changes length. DO NOT use strict fixed \`height\` on text containers. Use \`min-height\` or allow them to expand vertically.
   - Use CSS flexbox (\`display: flex; flex-direction: column; gap: ...\`) for blocks of text that naturally stack, so they push each other down instead of overlapping.
   - Only use strict absolute positioning (\`top\`, \`left\`) for elements that are completely independent.
   - Ensure proper \`line-height\` (e.g. 1.4 or 1.5) so lines of text don't crush each other.
6. **IMAGES**: There are ${images.length} images on this page. For each image, use an <img> tag. Set its src attribute EXACTLY to "IMAGE_X" where X is the 0-based index of the image (e.g., IMAGE_0, IMAGE_1). Match their visual positions.
7. Return ONLY the complete HTML code starting with <!DOCTYPE html>. No markdown fences, no explanations.

RAW TEXT FOR REFERENCE:
${rawText}`;

  const parts = [
    { inlineData: { mimeType: 'application/pdf', data: pagePdfBase64 } },
    { inlineData: { mimeType: 'image/png', data: pageImage } },
    { text: prompt }
  ];

  const contents = [{ role: 'user', parts }];

  let lastError;
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      console.log(`[Gemini] Requesting translation with ${modelName}...`);
      const result = await withRetry(() =>
        getModel(modelName).generateContent({ contents })
      );
      const translated = extractHtml(result.response.text());
      return rehydrateImages(translated, images);
    } catch (err) {
      console.warn(`[Gemini] Model "${modelName}" failed: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

module.exports = { generateTranslatedHtml };