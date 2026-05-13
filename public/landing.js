/* ============================================================
   PDF Translator — Landing Page JS
   - Scroll progress bar
   - Nav scroll effect
   - Scroll reveal (Intersection Observer)
   - Stat counter animation
   - Language switcher (EN / RO / RU)
============================================================ */

'use strict';

/* ── Translations ─────────────────────────────────────────── */
const T = {
  en: {
    navHow: 'How it works', navFeatures: 'Features', navLangs: 'Languages',
    navTech: 'Technology', navCta: 'Try Free',
    heroBadge: 'Powered by Gemini',
    heroTitle: 'Translate any PDF,',
    heroTitle2: 'preserve every detail',
    heroDesc: "AI-powered translation that keeps your document's exact layout, fonts, and structure intact. Upload once, download perfectly.",
    heroCta: 'Start Translating', heroCta2: 'How it works',
    scrollHint: 'Scroll',
    statLang: 'Languages Supported', statLayout: 'Layout Fidelity',
    statSteps: 'Processing Steps',   statSize: 'Max File Size',
    howTag: 'Process',
    howTitle: 'Three steps to a perfect translation',
    howSub: 'From upload to download in minutes, with full layout fidelity guaranteed',
    s1Title: 'Upload your PDF',
    s1Desc: 'Drag and drop or browse for your PDF document. Supports all standard PDF formats up to 500MB. Multiple pages, complex layouts — all handled automatically.',
    s2Title: 'Choose target language',
    s2Desc: 'Select from 20+ languages including Spanish, French, German, Russian, Japanese, Arabic, and more. Our AI understands document context for accurate, nuanced translation.',
    s3Title: 'Download translated PDF',
    s3Desc: 'Receive your translated PDF with the original layout fully preserved — same columns, same tables, same visual hierarchy. Ready to share or print immediately.',
    featTag: 'Features',
    featTitle: "Everything you need, nothing you don't",
    featSub: 'Designed for precision, built for speed, optimized for quality',
    f1Title: 'Perfect Layout Preservation',
    f1Desc: "Our system performs a detailed visual analysis of each page, understanding the complete document structure — tables, columns, headers, footers, and complex multi-column arrangements. The translated PDF looks exactly like the original.",
    f2Title: '20+ Languages Supported',
    f2Desc: 'Translate between all major world languages: English, Spanish, French, German, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Hindi, and more. New languages added regularly.',
    f3Title: 'Gemini Intelligence',
    f3Desc: "Powered by Google's advanced AI engine. It understands your document like a human reader — grasping context, domain-specific terminology, abbreviations, and nuanced phrasing to produce translations that feel completely natural.",
    f4Title: 'Vision-Based Understanding',
    f4Desc: "Unlike basic document translators, our proprietary system performs a full visual analysis of every page, enabling precise spatial understanding of each element and ensuring faithful layout reconstruction.",
    f5Title: 'No Account Required',
    f5Desc: 'Zero friction. Simply upload your PDF and start translating immediately. No registration, no subscriptions, no email required. Files are processed securely and not stored permanently.',
    f6Title: 'Large File Support',
    f6Desc: 'Handle documents up to 500MB with full multi-page support. Academic papers, legal contracts, technical manuals, financial reports — all processed with the same care and quality regardless of complexity.',
    langTag: 'Coverage',
    langTitle: 'Translate to any language',
    langSub: 'Support for 20+ major world languages with more being added',
    techTag: 'Core Technology',
    techTitle: 'Built on proprietary AI technology',
    techSub: 'A purpose-built technology suite that understands documents at a visual and structural level',
    t1Name: 'Google Gemini AI', t1Role: 'Intelligent Translation Core',
    t1Desc: "Our AI core delivers advanced visual and semantic understanding of document content, enabling context-aware, nuanced translations with exceptional precision and natural flow.",
    t2Name: 'Document Intelligence Layer', t2Role: 'Document Analyzer',
    t2Desc: "A high-precision document analysis component that decodes structural elements, spatial positioning, and content organization from any PDF — providing the foundation for accurate layout reconstruction.",
    t3Name: 'Precision Layout Mapper', t3Role: 'Layout Engine',
    t3Desc: "Our proprietary layout mapping technology captures the exact spatial data of every document element and encodes it in a structured internal format, preserving perfect positional fidelity throughout the entire translation process.",
    t4Name: 'Document Synthesis Engine', t4Role: 'PDF Renderer',
    t4Desc: "A high-fidelity document generation pipeline that transforms the translated layout data back into a polished, print-ready PDF document — visually identical to the original in every detail.",
    ctaTitle: 'Ready to translate your',
    ctaSub: 'Upload your document and experience AI-powered translation that truly preserves your layout. No account needed.',
    ctaBtn: 'Start Translating Now',
    ctaNote: 'No account required · Free to use · Secure processing',
    footerTagline: 'AI-powered PDF translation with perfect layout preservation.',
    footerTech: 'Powered by advanced AI and proprietary document processing technology',
    footerNavTitle: 'Navigation', footerNavApp: 'Open App',
    footerNavHow: 'How it works', footerNavFeat: 'Features',
    footerNavLang: 'Languages',   footerNavTech: 'Technology',
    footerLegal: '© 2026 PDF Translator. Powered by Google Gemini.',
  },

  ro: {
    navHow: 'Cum funcționează', navFeatures: 'Funcții', navLangs: 'Limbi',
    navTech: 'Tehnologie', navCta: 'Încearcă',
    heroBadge: 'Alimentat de Gemini',
    heroTitle: 'Traduce orice PDF,',
    heroTitle2: 'păstrează fiecare detaliu',
    heroDesc: 'Traducere PDF bazată pe AI care menține aspectul exact, fonturile și structura documentului intact. Încarcă o dată, descarcă perfect.',
    heroCta: 'Începe traducerea', heroCta2: 'Cum funcționează',
    scrollHint: 'Derulează',
    statLang: 'Limbi suportate', statLayout: 'Fidelitate aspect',
    statSteps: 'Etape procesare',  statSize: 'Dimensiune maximă',
    howTag: 'Proces',
    howTitle: 'Trei pași pentru o traducere perfectă',
    howSub: 'De la încărcare la descărcare în minute, cu fidelitate completă a aspectului garantată',
    s1Title: 'Încarcă PDF-ul tău',
    s1Desc: 'Trage și plasează sau navighează la documentul PDF. Suportă toate formatele PDF standard până la 500MB. Mai multe pagini, machete complexe — totul gestionat automat.',
    s2Title: 'Alege limba țintă',
    s2Desc: 'Selectează din peste 20 de limbi inclusiv spaniolă, franceză, germană, rusă, japoneză, arabă și altele. AI-ul nostru înțelege contextul documentului pentru traduceri precise și nuanțate.',
    s3Title: 'Descarcă PDF-ul tradus',
    s3Desc: 'Primești PDF-ul tradus cu aspectul original complet păstrat — aceleași coloane, aceleași tabele, aceeași ierarhie vizuală. Gata de partajat sau tipărit imediat.',
    featTag: 'Funcții',
    featTitle: 'Tot ce ai nevoie, nimic în plus',
    featSub: 'Proiectat pentru precizie, construit pentru viteză, optimizat pentru calitate',
    f1Title: 'Preservare perfectă a aspectului',
    f1Desc: 'Sistemul nostru efectuează o analiză vizuală detaliată a fiecărei pagini, înțelegând structura completă a documentului — tabele, coloane, anteturi, subsoluri și aranjamente complexe pe mai multe coloane. PDF-ul tradus arată exact ca originalul.',
    f2Title: 'Peste 20 de limbi suportate',
    f2Desc: 'Traduce între toate limbile principale ale lumii: engleză, spaniolă, franceză, germană, portugheză, rusă, chineză, japoneză, coreeană, arabă, hindi și altele. Limbi noi adăugate regulat.',
    f3Title: 'Inteligență Gemini',
    f3Desc: 'Alimentat de motorul AI avansat al Google. Înțelege documentul tău ca un cititor uman — asimilând contextul, terminologia specifică domeniului, abrevierile și formulările nuanțate pentru traduceri complet naturale.',
    f4Title: 'Înțelegere bazată pe viziune',
    f4Desc: 'Spre deosebire de traducătorii de bază pentru documente, sistemul nostru proprietar efectuează o analiză vizuală completă a fiecărei pagini, permițând o înțelegere spațială precisă a fiecărui element și asigurând o reconstrucție fidelă a structurii.',
    f5Title: 'Nu necesită cont',
    f5Desc: 'Zero frecare. Pur și simplu încarcă PDF-ul tău și începe imediat traducerea. Fără înregistrare, fără abonamente, fără email necesar. Fișierele sunt procesate în siguranță și nu sunt stocate permanent.',
    f6Title: 'Suport pentru fișiere mari',
    f6Desc: 'Gestionează documente de până la 500MB cu suport complet pe mai multe pagini. Lucrări academice, contracte juridice, manuale tehnice, rapoarte financiare — toate procesate cu aceeași grijă și calitate.',
    langTag: 'Acoperire',
    langTitle: 'Traduce în orice limbă',
    langSub: 'Suport pentru peste 20 de limbi principale, cu altele în curs de adăugare',
    techTag: 'Tehnologie de bază',
    techTitle: 'Construit pe tehnologie AI proprietară',
    techSub: 'O suită tehnologică dedicată care înțelege documentele la nivel vizual și structural',
    t1Name: 'Google Gemini AI', t1Role: 'Nucleu inteligent de traducere',
    t1Desc: 'Nucleul nostru AI oferă înțelegere vizuală și semantică avansată a conținutului documentelor, permițând traduceri contextuale și nuanțate cu precizie excepțională și un flux natural.',
    t2Name: 'Strat de analiză a documentelor', t2Role: 'Analizator de documente',
    t2Desc: 'O componentă de analiză a documentelor de înaltă precizie care decodifică elementele structurale, poziționarea spațială și organizarea conținutului din orice PDF — furnizând baza pentru o reconstrucție fidelă a structurii.',
    t3Name: 'Sistem proprietar de mapare a structurii', t3Role: 'Motor de aspect',
    t3Desc: 'Tehnologia noastră proprietară de mapare captează datele spațiale exacte ale fiecărui element al documentului și le codifică într-un format intern structurat, păstrând fidelitatea pozițională perfectă pe tot parcursul procesului de traducere.',
    t4Name: 'Motor de sinteză a documentelor', t4Role: 'Randare PDF',
    t4Desc: 'Un circuit de generare a documentelor de înaltă fidelitate care transformă datele de structură traduse înapoi într-un document PDF rafinat, gata de tipărire — identic vizual cu originalul în fiecare detaliu.',
    ctaTitle: 'Gata să îți traduci',
    ctaSub: 'Încarcă documentul acum și experimentează traducerea bazată pe AI care păstrează cu adevărat aspectul tău. Nu e necesar cont.',
    ctaBtn: 'Începe traducerea acum',
    ctaNote: 'Fără cont necesar · Gratuit · Procesare securizată',
    footerTagline: 'Traducere PDF bazată pe AI cu preservare perfectă a aspectului.',
    footerTech: 'Alimentat de AI avansat și tehnologie proprietară de procesare a documentelor',
    footerNavTitle: 'Navigare', footerNavApp: 'Deschide App',
    footerNavHow: 'Cum funcționează', footerNavFeat: 'Funcții',
    footerNavLang: 'Limbi',          footerNavTech: 'Tehnologie',
    footerLegal: '© 2026 PDF Translator. Alimentat de Google Gemini.',
  },

  ru: {
    navHow: 'Как работает', navFeatures: 'Функции', navLangs: 'Языки',
    navTech: 'Технологии', navCta: 'Попробовать',
    heroBadge: 'На базе Gemini',
    heroTitle: 'Переводите любой PDF,',
    heroTitle2: 'сохраняя каждую деталь',
    heroDesc: 'ИИ-перевод PDF, сохраняющий точный макет, шрифты и структуру документа. Загрузите один раз, скачайте идеально.',
    heroCta: 'Начать перевод', heroCta2: 'Как это работает',
    scrollHint: 'Листайте',
    statLang: 'Языков поддержано', statLayout: 'Точность макета',
    statSteps: 'Этапов обработки',  statSize: 'Максимальный размер',
    howTag: 'Процесс',
    howTitle: 'Три шага к идеальному переводу',
    howSub: 'От загрузки до скачивания за минуты, с гарантированной точностью макета',
    s1Title: 'Загрузите ваш PDF',
    s1Desc: 'Перетащите или выберите PDF-документ. Поддерживаются все стандартные форматы PDF до 500МБ. Несколько страниц, сложные макеты — всё обрабатывается автоматически.',
    s2Title: 'Выберите целевой язык',
    s2Desc: 'Выбирайте из 20+ языков: испанский, французский, немецкий, русский, японский, арабский и другие. Наш ИИ понимает контекст документа для точного и нюансированного перевода.',
    s3Title: 'Скачайте переведённый PDF',
    s3Desc: 'Получите переведённый PDF с полностью сохранённым оригинальным макетом — те же колонки, те же таблицы, та же визуальная иерархия. Готов к публикации или печати немедленно.',
    featTag: 'Функции',
    featTitle: 'Всё, что нужно, ничего лишнего',
    featSub: 'Разработан для точности, создан для скорости, оптимизирован для качества',
    f1Title: 'Идеальное сохранение макета',
    f1Desc: 'Наша система выполняет детальный визуальный анализ каждой страницы, понимая полную структуру документа — таблицы, колонки, заголовки, нижние колонтитулы и сложные многоколонные компоновки. Переведённый PDF выглядит точно как оригинал.',
    f2Title: 'Поддержка 20+ языков',
    f2Desc: 'Переводите между всеми основными мировыми языками: английским, испанским, французским, немецким, португальским, русским, китайским, японским, корейским, арабским, хинди и другими.',
    f3Title: 'Интеллект Gemini',
    f3Desc: 'На базе продвинутого движка ИИ Google. Понимает документ как человек-читатель — улавливая контекст, специализированную терминологию, аббревиатуры и нюансированные формулировки для получения полностью естественных переводов.',
    f4Title: 'Визуальное понимание',
    f4Desc: 'В отличие от базовых переводчиков документов, наша проприетарная система выполняет полный визуальный анализ каждой страницы, обеспечивая точное пространственное понимание каждого элемента и достоверное восстановление структуры.',
    f5Title: 'Аккаунт не нужен',
    f5Desc: 'Ноль трений. Просто загрузите PDF и начните перевод немедленно. Без регистрации, без подписок, без email. Ваши файлы обрабатываются безопасно и не хранятся постоянно.',
    f6Title: 'Поддержка больших файлов',
    f6Desc: 'Обрабатывайте документы до 500МБ с полной поддержкой нескольких страниц. Академические работы, юридические договоры, технические руководства — всё с одинаковым качеством.',
    langTag: 'Охват',
    langTitle: 'Перевод на любой язык',
    langSub: 'Поддержка 20+ основных мировых языков с постоянным добавлением новых',
    techTag: 'Ключевые технологии',
    techTitle: 'Построен на проприетарных технологиях ИИ',
    techSub: 'Специализированный технологический комплекс, понимающий документы на визуальном и структурном уровне',
    t1Name: 'Google Gemini AI', t1Role: 'Интеллектуальное ядро перевода',
    t1Desc: 'Наше ядро ИИ обеспечивает продвинутое визуальное и семантическое понимание содержимого документов, обеспечивая контекстно-зависимые, нюансированные переводы с исключительной точностью и естественным звучанием.',
    t2Name: 'Слой интеллектуального анализа', t2Role: 'Анализатор документов',
    t2Desc: 'Высокоточный компонент анализа документов, который декодирует структурные элементы, пространственное расположение и организацию содержимого любого PDF — обеспечивая основу для точного восстановления структуры.',
    t3Name: 'Проприетарная система картирования структуры', t3Role: 'Движок макета',
    t3Desc: 'Наша проприетарная технология картирования фиксирует точные пространственные данные каждого элемента документа и кодирует их во внутреннем структурированном формате, сохраняя идеальную позиционную точность на протяжении всего процесса перевода.',
    t4Name: 'Движок синтеза документов', t4Role: 'Рендеринг PDF',
    t4Desc: 'Высокоточный конвейер генерации документов, преобразующий переведённые данные структуры обратно в отполированный, готовый к печати PDF-документ — визуально идентичный оригиналу в каждой детали.',
    ctaTitle: 'Готовы перевести ваш',
    ctaSub: 'Загрузите документ сейчас и оцените перевод на основе ИИ, который действительно сохраняет ваш макет. Аккаунт не нужен.',
    ctaBtn: 'Начать перевод сейчас',
    ctaNote: 'Аккаунт не нужен · Бесплатно · Безопасная обработка',
    footerTagline: 'Перевод PDF на основе ИИ с идеальным сохранением макета.',
    footerTech: 'На базе продвинутого ИИ и проприетарной технологии обработки документов',
    footerNavTitle: 'Навигация', footerNavApp: 'Открыть приложение',
    footerNavHow: 'Как работает',  footerNavFeat: 'Функции',
    footerNavLang: 'Языки',        footerNavTech: 'Технологии',
    footerLegal: '© 2026 PDF Translator. На базе Google Gemini.',
  },
};

/* ── Language persistence key ─────────────────────────────── */
const LANG_KEY = 'pdf_translator_lang';

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initNavScroll();
  initReveal();
  initLangSwitcher();
  initCounters();
});

/* ── Scroll progress bar ─────────────────────────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  }, { passive: true });
}

/* ── Nav: add .scrolled class on scroll ─────────────────── */
function initNavScroll() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ── Scroll reveal via IntersectionObserver ──────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
}

/* ── Stat counters (count-up on first reveal) ─────────────── */
function initCounters() {
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.count, 10);
      animateCount(el, target);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  nums.forEach(n => observer.observe(n));
}

function animateCount(el, target) {
  const duration = 1400;
  const start = performance.now();
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(ease(progress) * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  requestAnimationFrame(step);
}

/* ── Language switcher ────────────────────────────────────── */
function initLangSwitcher() {
  const sw = document.getElementById('langSw');
  if (!sw) return;

  const saved = localStorage.getItem(LANG_KEY) || 'en';
  applyLang(saved, sw);

  sw.addEventListener('click', e => {
    const btn = e.target.closest('[data-lang]');
    if (!btn) return;
    const lang = btn.dataset.lang;
    localStorage.setItem(LANG_KEY, lang);
    applyLang(lang, sw);
  });
}

function applyLang(lang, sw) {
  const dict = T[lang] || T.en;

  /* update buttons */
  sw.querySelectorAll('[data-lang]').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  /* update html[lang] */
  document.documentElement.lang = lang;

  /* update all data-i18n elements */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  /* CTA title has a hard-coded " PDF?" suffix — restore it */
  const ctaTitleEl = document.querySelector('.cta-title');
  if (ctaTitleEl) {
    const firstSpan = ctaTitleEl.querySelector('span[data-i18n="ctaTitle"]');
    if (firstSpan) firstSpan.textContent = dict.ctaTitle;
  }
}
