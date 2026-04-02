require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { EventEmitter } = require('events');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const { extractPdfData } = require('./src/pdfExtractor');
const { generateTranslatedHtml } = require('./src/geminiService');
const { htmlPagesToPdf } = require('./src/htmlToPdf');

const app = express();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Job store & event emitter ---
const jobEmitter = new EventEmitter();
jobEmitter.setMaxListeners(200);

const jobs = new Map(); // jobId → { status, result, error }

function emitProgress(jobId, status, message, progress = 0) {
  const job = jobs.get(jobId);
  if (job) job.status = status;
  jobEmitter.emit(jobId, { status, message, progress });
}

// --- Routes ---

// POST /api/translate — start a translation job
app.post('/api/translate', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No PDF file provided' });

  const targetLanguage = req.body.targetLanguage || 'English';
  const originalName = req.file.originalname.replace(/\.pdf$/i, '');
  const jobId = randomUUID();

  jobs.set(jobId, { status: 'queued', result: null, error: null });

  res.json({ jobId });

  // Run async, don't await here
  processTranslation(jobId, req.file.path, targetLanguage, originalName);
});

// GET /api/progress/:jobId — SSE stream with live progress updates
app.get('/api/progress/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // If already finished when client connects
  if (job.status === 'done') {
    send({ status: 'done', message: 'Translation complete!', progress: 100 });
    return res.end();
  }
  if (job.status === 'error') {
    send({ status: 'error', message: job.error, progress: 0 });
    return res.end();
  }

  const listener = (data) => {
    send(data);
    if (data.status === 'done' || data.status === 'error') {
      jobEmitter.removeListener(jobId, listener);
      res.end();
    }
  };

  jobEmitter.on(jobId, listener);
  req.on('close', () => jobEmitter.removeListener(jobId, listener));
});

// GET /api/download/:jobId — download the translated PDF
app.get('/api/download/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);

  if (!job || job.status !== 'done' || !job.result) {
    return res.status(404).json({ error: 'Result not ready or not found' });
  }

  const filename = encodeURIComponent(`translated_${job.originalName || 'document'}.pdf`);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${filename}`);
  res.send(job.result);

  // Clean up job after download
  setTimeout(() => jobs.delete(req.params.jobId), 60_000);
});

// GET /api/health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- Translation pipeline ---

async function processTranslation(jobId, pdfPath, targetLanguage, originalName) {
  const job = jobs.get(jobId);
  job.originalName = originalName;

  try {
    // Step 1 — Extract PDF
    emitProgress(jobId, 'extracting', 'Extracting PDF content…', 5);
    const pages = await extractPdfData(pdfPath);
    const total = pages.length;

    // Step 2 — Translate each page via Gemini
    const htmlPages = [];
    for (let i = 0; i < total; i++) {
      const pct = Math.round(10 + (i / total) * 75);
      emitProgress(
        jobId,
        'translating',
        `Translating page ${i + 1} of ${total}…`,
        pct
      );

      const html = await generateTranslatedHtml(pages[i], targetLanguage);
      htmlPages.push({
        html,
        widthPx: pages[i].width,
        heightPx: pages[i].height,
        widthPt: pages[i].widthPt,
        heightPt: pages[i].heightPt,
      });
    }

    // Step 3 — HTML → PDF
    emitProgress(jobId, 'converting', 'Converting to PDF…', 88);
    const pdfBuffer = await htmlPagesToPdf(htmlPages);

    job.result = pdfBuffer;
    job.status = 'done';
    emitProgress(jobId, 'done', 'Translation complete!', 100);
  } catch (err) {
    console.error(`[job ${jobId}] Error:`, err);
    job.status = 'error';
    job.error = err.message || 'Unknown error';
    emitProgress(jobId, 'error', job.error, 0);
  } finally {
    fs.unlink(pdfPath, () => {});
  }
}

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PDF Translator running → http://localhost:${PORT}`);
});
