(() => {
  // ── DOM refs ──
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

  // ── Step indicators ──
  const STEPS = ['extracting', 'translating', 'converting'];

  function setStep(active) {
    STEPS.forEach((id, idx) => {
      const el = document.getElementById(`step-${id}`);
      const line = el?.nextElementSibling; // the step-line after each step (except last)

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

  // ── File helpers ──
  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function setFile(file) {
    if (!file || file.type !== 'application/pdf') {
      showError('Please select a valid PDF file.');
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

  // ── Error helpers ──
  function showError(msg) {
    errorMsg.textContent = msg;
    errorSection.hidden = false;
  }
  function hideError() { errorSection.hidden = true; }

  // ── Reset to initial state ──
  function resetUI() {
    if (currentEventSource) { currentEventSource.close(); currentEventSource = null; }
    progressSection.hidden = true;
    downloadSection.hidden = true;
    hideError();
    clearFile();
    progressFill.style.width = '0%';
    progressPct.textContent = '0%';
    progressMsg.textContent = 'Starting…';
    STEPS.forEach(id => {
      const el = document.getElementById(`step-${id}`);
      el.classList.remove('active', 'done');
    });
    document.querySelectorAll('.step-line').forEach(l => l.classList.remove('done'));
  }

  // ── Drop zone interactions ──
  browseBtn.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('click', (e) => {
    if (!fileSelected.hidden) return; // don't re-open if file already shown
    if (e.target !== removeBtn && !removeBtn.contains(e.target)) fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setFile(fileInput.files[0]);
  });
  removeBtn.addEventListener('click', (e) => { e.stopPropagation(); clearFile(); });

  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  });

  // ── Translation ──
  translateBtn.addEventListener('click', startTranslation);

  async function startTranslation() {
    if (!selectedFile) return;

    // Lock UI
    translateBtn.disabled = true;
    hideError();
    downloadSection.hidden = true;
    progressSection.hidden = false;
    setStep('extracting');
    setProgress(5, 'Uploading PDF…');

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

    // Subscribe to SSE progress
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
      showError('Connection lost. Please try again.');
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

    // Map status to step
    if (status === 'extracting') setStep('extracting');
    else if (status === 'translating') setStep('translating');
    else if (status === 'converting') setStep('converting');

    setProgress(progress, message);
  }

  function setProgress(pct, msg) {
    progressFill.style.width = `${pct}%`;
    progressPct.textContent = `${pct}%`;
    progressMsg.textContent = msg;
  }

  function showDownload(jobId) {
    downloadBtn.href = `/api/download/${jobId}`;
    downloadBtn.download = `translated_${langSelect.value.toLowerCase()}.pdf`;
    downloadSection.hidden = false;
    progressSection.hidden = true;
  }

  // ── New translation ──
  newTranslationBtn.addEventListener('click', resetUI);

})();
