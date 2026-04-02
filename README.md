# PDF Translator

A Node.js application that translates PDF documents while preserving their original layout and formatting using Google Gemini 2.5 Pro AI.

## How It Works

The translation pipeline has three stages:

1. **Extract** — `pdfjs-dist` parses each PDF page, extracting text elements with their exact positions and dimensions. `@napi-rs/canvas` renders a screenshot of each page.
2. **Translate** — The page screenshot + JSON of text positions are sent to Gemini 2.5 Pro, which returns a full reconstructed HTML page with translated text placed at the original coordinates.
3. **Rebuild** — Puppeteer renders the HTML back to a PDF page. `pdf-lib` merges all pages into the final translated document.

## Project Structure

```
PDF-Translator/
├── server.js               # Express server, SSE-based progress, job queue
├── src/
│   ├── pdfExtractor.js     # PDF parsing — pdfjs-dist v3 + @napi-rs/canvas
│   ├── geminiService.js    # Gemini 2.5 Pro API integration
│   ├── htmlToPdf.js        # Puppeteer HTML→PDF + pdf-lib page merging
│   ├── canvas-shim.js      # DOMMatrix + Path2D polyfills for pdfjs-dist v3
│   └── app.js              # Frontend JS logic
├── public/
│   ├── index.html          # Web UI
│   └── style.css           # Styles
├── uploads/                # Temporary file storage (input/output PDFs)
├── .env.example            # Environment variable template
└── package.json
```

## Tech Stack

| Package | Purpose |
|---|---|
| `express` | HTTP server & API routes |
| `pdfjs-dist` v3.11 | PDF parsing and rendering |
| `@napi-rs/canvas` | Canvas implementation for pdfjs in Node.js |
| `@google/generative-ai` | Gemini 2.5 Pro API client |
| `puppeteer` | Headless Chrome for HTML→PDF conversion |
| `pdf-lib` | Merging individual page PDFs into one document |
| `multer` | File upload handling |
| `dotenv` | Environment variable management |

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open `http://localhost:3000` in your browser

For development with auto-reload:
```bash
npm run dev
```

## Technical Notes

- **Coordinate system:** PDF positions are in points (72 DPI). These are converted to CSS pixels (96 DPI) using the factor `PT_TO_PX = 96/72` consistently across all source files.
- **pdfjs polyfills:** pdfjs-dist v3 requires `DOMMatrix` and `Path2D` globals — provided by `canvas-shim.js` before pdfjs loads.
- **Page dimensions:** Puppeteer viewport uses CSS pixels; PDF output dimensions use the original pt values to ensure correct page size.
- **Progress streaming:** Translation progress is streamed to the client via Server-Sent Events (SSE).

---

## License & Copyright

© 2026 Onea Alexei. All rights reserved.

This repository is public for viewing purposes only. You are **NOT** allowed to use, copy, modify, distribute, or claim ownership of this code.
