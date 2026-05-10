(() => {
  /* ── App translations ── */
  const APP_T = {
    en: {
      badge:               'Powered by Gemini',
      heroTitle:           'Translate any PDF,<br/>preserve every detail',
      heroSub:             'Layout, fonts, and structure are kept intact — only the language changes.',
      step1Label:          '1 — Upload your PDF',
      dropMain:            'Drag & drop your PDF here',
      dropOr:              'or',
      dropBrowse:          'browse files',
      step2Label:          '2 — Choose target language',
      translateBtn:        'Translate PDF',
      stepExtracting:      'Extracting',
      stepTranslating:     'Translating',
      stepConverting:      'Converting',
      starting:            'Starting…',
      translationComplete: 'Translation complete',
      downloadBtn:         'Download Translated PDF',
      newTranslation:      'Translate another file',
      footerLegal:         '© 2026 PDF Translator. Powered by Google Gemini.',
      errInvalidFile:      'Please select a valid PDF file.',
      errConnLost:         'Connection lost. Please try again.',
    },
    ro: {
      badge:               'Alimentat de Gemini',
      heroTitle:           'Traduce orice PDF,<br/>păstrează fiecare detaliu',
      heroSub:             'Aspectul, fonturile și structura rămân intacte — doar limba se schimbă.',
      step1Label:          '1 — Încarcă PDF-ul tău',
      dropMain:            'Trage și plasează PDF-ul tău aici',
      dropOr:              'sau',
      dropBrowse:          'navighează fișiere',
      step2Label:          '2 — Alege limba țintă',
      translateBtn:        'Traduce PDF',
      stepExtracting:      'Extragere',
      stepTranslating:     'Traducere',
      stepConverting:      'Conversie',
      starting:            'Se pornește…',
      translationComplete: 'Traducere completă',
      downloadBtn:         'Descarcă PDF tradus',
      newTranslation:      'Traduce alt fișier',
      footerLegal:         '© 2026 PDF Translator. Alimentat de Google Gemini.',
      errInvalidFile:      'Te rugăm să selectezi un fișier PDF valid.',
      errConnLost:         'Conexiune pierdută. Te rugăm să încerci din nou.',
    },
    ru: {
      badge:               'На базе Gemini',
      heroTitle:           'Переводите любой PDF,<br/>сохраняя каждую деталь',
      heroSub:             'Макет, шрифты и структура сохраняются — меняется только язык.',
      step1Label:          '1 — Загрузите ваш PDF',
      dropMain:            'Перетащите PDF сюда',
      dropOr:              'или',
      dropBrowse:          'выберите файл',
      step2Label:          '2 — Выберите целевой язык',
      translateBtn:        'Перевести PDF',
      stepExtracting:      'Извлечение',
      stepTranslating:     'Перевод',
      stepConverting:      'Конвертация',
      starting:            'Запуск…',
      translationComplete: 'Перевод завершён',
      downloadBtn:         'Скачать переведённый PDF',
      newTranslation:      'Перевести другой файл',
      footerLegal:         '© 2026 PDF Translator. На базе Google Gemini.',
      errInvalidFile:      'Пожалуйста, выберите корректный PDF-файл.',
      errConnLost:         'Соединение потеряно. Пожалуйста, попробуйте снова.',
    },
  };

  const LANG_KEY = 'pdf_translator_lang';
  let currentLang = localStorage.getItem(LANG_KEY) || 'en';
  let dict = APP_T[currentLang] || APP_T.en;

  /* ── DOM refs ── */
  const dropZone     = document.getElementById('dropZone');
  const fileInput    = document.getElementById('fileInput');
  const browseBtn    = document.getElementById('browseBtn');
  const dropContent  = document.getElementById('dropContent');
  const fileSelected = document.getElementById('fileSelected');
  const fileNameEl   = document.getElementById('fileName');
  const fileSizeEl   = document.getElementById('fileSize');
  const removeBtn    = document.getElementById('removeBtn');
  const langSelect   = document.getElementById('langSelect');
  const translateBtn = document.getElementById('translateBtn');

  const progressSection = document.getElementById('progressSection');
  const progressFill    = document.getElementById('progressFill');
  const progressPct     = document.getElementById('progressPct');
  const progressMsg     = document.getElementById('progressMsg');

  const errorSection = document.getElementById('errorSection');
  const errorMsg     = document.getElementById('errorMsg');

  const downloadSection    = document.getElementById('downloadSection');
  const downloadBtn        = document.getElementById('downloadBtn');
  const newTranslationBtn  = document.getElementById('newTranslationBtn');

  let selectedFile = null;
  let currentEventSource = null;

  /* ── i18n ── */
  function applyLang(lang) {
    currentLang = lang;
    dict = APP_T[lang] || APP_T.en;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.dataset.i18nHtml;
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });

    /* update app lang switcher buttons */
    const sw = document.getElementById('appLangSw');
    if (sw) {
      sw.querySelectorAll('[data-lang]').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === lang);
      });
    }

    /* keep progressMsg in sync if visible */
    if (!progressSection.hidden && progressMsg.dataset.i18nLive) {
      progressMsg.textContent = dict[progressMsg.dataset.i18nLive] || progressMsg.textContent;
    }
  }

  /* Init language */
  applyLang(currentLang);

  const appSw = document.getElementById('appLangSw');
  if (appSw) {
    appSw.addEventListener('click', e => {
      const btn = e.target.closest('[data-lang]');
      if (btn) applyLang(btn.dataset.lang);
    });
  }

  /* ── Step indicators ── */
  const STEPS = ['extracting', 'translating', 'converting'];

  function setStep(active) {
    STEPS.forEach((id, idx) => {
      const el = document.getElementById(`step-${id}`);
      const line = el?.nextElementSibling;
      const activeIdx = STEPS.indexOf(active);
      el.classList.toggle('active', id === active);
      el.classList.toggle('done', idx < activeIdx);
      if (line && line.classList.contains('step-line')) {
        line.classList.toggle('done', idx < activeIdx);
      }
    });
  }

  function markAllDone() {
    STEPS.forEach((id) => {
      const el = document.getElementById(`step-${id}`);
      el.classList.remove('active');
      el.classList.add('done');
    });
    document.querySelectorAll('.step-line').forEach(l => l.classList.add('done'));
  }

  /* ── File helpers ── */
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function setFile(file) {
    if (!file || file.type !== 'application/pdf') {
      showError(dict.errInvalidFile);
      return;
    }
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatSize(file.size);
    dropContent.hidden = true;
    fileSelected.hidden = false;
    translateBtn.disabled = false;
    hideError();
  }

  function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    dropContent.hidden = false;
    fileSelected.hidden = true;
    translateBtn.disabled = true;
    hideError();
  }

  /* ── Error helpers ── */
  function showError(msg) {
    errorMsg.textContent = msg;
    errorSection.hidden = false;
  }
  function hideError() { errorSection.hidden = true; }

  /* ── Reset to initial state ── */
  function resetUI() {
    if (currentEventSource) { currentEventSource.close(); currentEventSource = null; }
    progressSection.hidden = true;
    downloadSection.hidden = true;
    hideError();
    clearFile();
    progressFill.style.width = '0%';
    progressPct.textContent = '0%';
    progressMsg.textContent = dict.starting;
    STEPS.forEach(id => {
      const el = document.getElementById(`step-${id}`);
      el.classList.remove('active', 'done');
    });
    document.querySelectorAll('.step-line').forEach(l => l.classList.remove('done'));
  }

  /* ── Drop zone interactions ── */
  browseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (!fileSelected.hidden) return;
    if (e.target !== removeBtn && !removeBtn.contains(e.target)) fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });
  removeBtn.addEventListener('click', (e) => { e.stopPropagation(); clearFile(); });

  dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  /* ── Translation ── */
  translateBtn.addEventListener('click', startTranslation);

  async function startTranslation() {
    if (!selectedFile) return;

    translateBtn.disabled = true;
    hideError();
    downloadSection.hidden = true;
    progressSection.hidden = false;
    setStep('extracting');
    setProgress(5, dict.starting);

    const formData = new FormData();
    formData.append('pdf', selectedFile);
    formData.append('targetLanguage', langSelect.value);

    let jobId;
    try {
      const res = await fetch('/api/translate', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${res.status}`);
      }
      const data = await res.json();
      jobId = data.jobId;
    } catch (err) {
      showError(err.message);
      translateBtn.disabled = false;
      progressSection.hidden = true;
      return;
    }

    listenToProgress(jobId);
  }

  function listenToProgress(jobId) {
    if (currentEventSource) currentEventSource.close();
    const es = new EventSource(`/api/progress/${jobId}`);
    currentEventSource = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      handleProgressUpdate(data, jobId);
    };
    es.onerror = () => {
      es.close();
      currentEventSource = null;
      showError(dict.errConnLost);
      translateBtn.disabled = false;
    };
  }

  function handleProgressUpdate(data, jobId) {
    const { status, message, progress } = data;

    if (status === 'done') {
      markAllDone();
      setProgress(100, message);
      currentEventSource?.close();
      currentEventSource = null;
      showDownload(jobId);
      return;
    }
    if (status === 'error') {
      currentEventSource?.close();
      currentEventSource = null;
      progressSection.hidden = true;
      showError(message);
      translateBtn.disabled = false;
      return;
    }

    if (status === 'extracting') setStep('extracting');
    else if (status === 'translating') setStep('translating');
    else if (status === 'converting') setStep('converting');

    setProgress(progress, message);
  }

  function setProgress(pct, msg) {
    progressFill.style.width = `${pct}%`;
    progressPct.textContent  = `${pct}%`;
    progressMsg.textContent  = msg;
  }

  function showDownload(jobId) {
    downloadBtn.href     = `/api/download/${jobId}`;
    downloadBtn.download = `translated_${langSelect.value.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    downloadSection.hidden  = false;
    progressSection.hidden  = true;
  }

  /* ── New translation ── */
  newTranslationBtn.addEventListener('click', resetUI);

})();
