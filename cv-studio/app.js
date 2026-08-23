(function () {
  'use strict';

  var FILES = ['profile', 'settings', 'experience', 'skills', 'certifications', 'education', 'languages', 'achievements'];
  var D = {};
  var RESULT = null;
  var LANG = 'en';
  var READY_PDF = null;
  var READY_PDF_URL = '';
  var $ = function (id) { return document.getElementById(id); };

  var THEMES = {
    sales: { en: ['sales','selling','commercial','revenue','target','targets','quota','closing','business development','sales performance','sales operations'], ar: ['مبيعات','البيع','تجاري','تجارية','الإيرادات','المستهدف','المستهدفات','إقفال','اغلاق','أداء المبيعات','عمليات المبيعات'], label: { en: 'Sales Operations & Performance', ar: 'عمليات المبيعات وإدارة الأداء' }, scope: { en: 'Sales Performance & KPIs', ar: 'أداء المبيعات ومؤشرات الأداء' } },
    field: { en: ['field force','field team','promoter','promoters','territory','area manager','regional','field execution','store execution'], ar: ['القوى الميدانية','الفريق الميداني','المروجين','المروجون','المنطقة','مدير منطقة','إقليمي','التنفيذ الميداني','تنفيذ المتاجر'], label: { en: 'Field Force & Retail Execution', ar: 'القوى الميدانية وتنفيذ التجزئة' }, scope: { en: 'Field Force Leadership', ar: 'قيادة القوى الميدانية' } },
    training: { en: ['training','trainer','learning','capability','capabilities','coaching','coach','development','facilitation','workshop','onboarding'], ar: ['تدريب','مدرب','التعلم','القدرات','تطوير القدرات','توجيه','تطوير','ورش','ورشة','تهيئة','تأهيل'], label: { en: 'Training & Capability Development', ar: 'التدريب وتطوير القدرات' }, scope: { en: 'Training & Capability', ar: 'التدريب وتطوير القدرات' } },
    retail: { en: ['retail','store','stores','channel','dealer','distributor','merchandising','point of sale','in-store'], ar: ['التجزئة','متجر','المتاجر','القنوات','موزع','موزعين','نقاط البيع','داخل المتجر'], label: { en: 'Retail & Channel Operations', ar: 'عمليات التجزئة والقنوات' }, scope: { en: 'National Retail Operations', ar: 'عمليات التجزئة الوطنية' } },
    leadership: { en: ['leadership','lead','leader','manage','manager','management','team management','people management','supervise','supervision'], ar: ['قيادة','قائد','إدارة','مدير','إدارة الفريق','إدارة الفرق','إشراف','الاشراف'], label: { en: 'Team Leadership & Performance', ar: 'قيادة الفرق وإدارة الأداء' }, scope: { en: 'Team Leadership', ar: 'قيادة الفرق' } },
    kpi: { en: ['kpi','kpis','metrics','performance management','productivity','achievement','forecast','forecasting','reporting','dashboard'], ar: ['مؤشرات الأداء','المؤشرات','الأداء','الإنتاجية','تحقيق','التوقعات','التنبؤ','تقارير','لوحة مؤشرات'], label: { en: 'KPI & Performance Management', ar: 'إدارة مؤشرات الأداء' }, scope: { en: 'KPI & Performance Management', ar: 'إدارة مؤشرات الأداء' } },
    analytics: { en: ['analysis','analytics','data','insight','insights','trend','trends','market analysis','competitor analysis','root cause'], ar: ['تحليل','تحليلات','بيانات','رؤى','اتجاهات','تحليل السوق','تحليل المنافسين','سبب جذري'], label: { en: 'Performance & Market Analytics', ar: 'تحليل الأداء والسوق' }, scope: { en: 'Performance Analytics', ar: 'تحليل الأداء' } },
    stakeholder: { en: ['stakeholder','stakeholders','partner','partners','cross-functional','collaboration','retail partner','relationship management'], ar: ['أصحاب المصلحة','شركاء','الشركاء','تعاون','متعدد الوظائف','شركاء التجزئة','إدارة العلاقات'], label: { en: 'Stakeholder & Partner Management', ar: 'إدارة أصحاب المصلحة والشركاء' }, scope: { en: 'Stakeholder Management', ar: 'إدارة أصحاب المصلحة' } },
    launch: { en: ['launch','launches','go-to-market','gtm','product launch','activation','campaign execution'], ar: ['إطلاق','إطلاقات','إطلاق المنتجات','دخول السوق','تفعيل','تنفيذ الحملات'], label: { en: 'Product Launch & GTM Execution', ar: 'إطلاق المنتجات وتنفيذ دخول السوق' }, scope: { en: 'Product Launches', ar: 'إطلاق المنتجات' } },
    customer: { en: ['customer','customer experience','consultative selling','needs discovery','objection','negotiation','closing','service'], ar: ['العميل','تجربة العميل','البيع الاستشاري','اكتشاف الاحتياج','الاعتراضات','التفاوض','إتمام البيع','الخدمة'], label: { en: 'Customer Experience & Consultative Selling', ar: 'تجربة العميل والبيع الاستشاري' }, scope: { en: 'Customer & Consultative Selling', ar: 'العميل والبيع الاستشاري' } }
  };

  var STOP_EN = new Set(('the a an and or to of in for on with by from as at is are be been being this that these those you your we our they their will would can could should must have has had job role position work working experience experienced required requirements preferred ability skills skill strong excellent good including within across about into using use responsible responsibilities support supporting deliver delivering manage managing management team teams business company candidate candidates saudi arabia ksa years year').split(/\s+/));
  var STOP_AR = new Set(('في من على إلى الى عن مع أو و او أن ان هذا هذه ذلك التي الذي يكون تكون لدى يجب خبرة خبرات العمل وظيفة الدور المطلوب المطلوبة المرشح المرشحة القدرة مهارات مهارة فريق فرق شركة داخل عبر السعودية المملكة سنوات سنة بشكل جيد قوي ممتاز'.split(/\s+/)));

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function t(v, l) { l = l || LANG; if (v == null) return ''; if (typeof v === 'string') return v; return v[l] || v.en || v.ar || ''; }
  function vis(a) { return (a || []).filter(function (x) { return x.visible !== false; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); }); }
  function normalize(s) { return String(s || '').toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^a-z0-9\u0600-\u06ff%+\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function words(s) { return normalize(s).split(/\s+/).filter(function (w) { if (!w || w.length < 3) return false; return !STOP_EN.has(w) && !STOP_AR.has(w); }); }
  function countMap(arr) { var m = {}; arr.forEach(function (w) { m[w] = (m[w] || 0) + 1; }); return m; }
  function occurrences(hay, needle) { var n = normalize(needle), h = normalize(hay), c = 0, p = 0; if (!n) return 0; while ((p = h.indexOf(n, p)) !== -1) { c++; p += n.length; } return c; }
  function detectThemes(jd) { var scores = {}; Object.keys(THEMES).forEach(function (key) { var th = THEMES[key], s = 0; th.en.concat(th.ar).forEach(function (k) { var c = occurrences(jd, k); if (c) s += c * (k.indexOf(' ') > -1 ? 4 : 2); }); scores[key] = s; }); return Object.keys(scores).sort(function (a, b) { return scores[b] - scores[a]; }).map(function (k) { return { key: k, score: scores[k] }; }); }
  function themeAffinity(text, themes) { var s = 0, n = normalize(text); themes.slice(0, 5).forEach(function (x, idx) { if (!x.score) return; THEMES[x.key].en.concat(THEMES[x.key].ar).forEach(function (k) { if (n.indexOf(normalize(k)) > -1) s += Math.max(1, 6 - idx); }); }); return s; }
  function overlapScore(text, jdCount, themes) { var ws = words(text), seen = {}, s = 0; ws.forEach(function (w) { if (seen[w]) return; seen[w] = 1; if (jdCount[w]) s += Math.min(5, 1 + jdCount[w]); }); s += themeAffinity(text, themes); if (/\d|%|٪/.test(text)) s += 2; if (/lead|manage|deliver|achiev|launch|coach|analy|قياد|إدار|تدريب|تحليل|تحقيق|إطلاق/i.test(text)) s += 1; return s; }
  function corpusText() { var out = []; out.push(JSON.stringify(D.profile || {})); vis(D.experience.items).forEach(function (x) { out.push(JSON.stringify(x)); }); vis(D.skills.items).forEach(function (x) { out.push(JSON.stringify(x)); }); vis(D.certifications.items).forEach(function (x) { out.push(JSON.stringify(x)); }); return normalize(out.join(' ')); }
  function topKeywords(jd) { var freq = countMap(words(jd)), corpus = corpusText(); return Object.keys(freq).map(function (w) { return { word: w, count: freq[w], found: corpus.indexOf(w) > -1 }; }).sort(function (a, b) { if (a.found !== b.found) return a.found ? -1 : 1; return (b.count - a.count) || (b.word.length - a.word.length); }).slice(0, 18); }
  function inferTitle(jd) { var lines = String(jd || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean), first = lines[0] || ''; if (first.length >= 4 && first.length <= 80 && !/[.!?]$/.test(first)) return first.replace(/^(job title|position|role)\s*[:\-]\s*/i, ''); return ''; }
  function safeSlug(s) { return String(s || 'Tailored-Role').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 45) || 'Tailored-Role'; }
  function yearsExperience() { var start = D.settings && D.settings.metrics && +D.settings.metrics.experienceStartYear || 2020; return Math.max(1, new Date().getFullYear() - start); }
  function makeSummary(themes) { var top = themes.filter(function (x) { return x.score > 0; }).slice(0, 3), enParts = top.map(function (x) { return THEMES[x.key].label.en.toLowerCase(); }), arParts = top.map(function (x) { return THEMES[x.key].label.ar; }), y = yearsExperience(); return { en: 'Sales operations and training professional with ' + y + '+ years in Saudi Arabia’s consumer technology sector. Experience spans ' + (enParts.length ? enParts.join(', ') : 'sales execution, field-force management, and capability development') + ', backed by hands-on responsibility for targets, KPIs, team development, and in-store execution from frontline to national scope.', ar: 'مختص في عمليات المبيعات والتدريب بخبرة تتجاوز ' + y + ' سنوات في قطاع التقنية الاستهلاكية بالمملكة. تشمل الخبرة ' + (arParts.length ? arParts.join('، ') : 'تنفيذ المبيعات وإدارة القوى الميدانية وتطوير القدرات') + '، مع مسؤولية عملية عن المستهدفات ومؤشرات الأداء وتطوير الفرق والتنفيذ داخل نقاط البيع من الخطوط الأمامية حتى النطاق الوطني.' }; }
  function selectSkills(jdCount, themes) { var all = vis(D.skills.items).map(function (x) { var text = [t(x.name, 'en'), t(x.name, 'ar'), t(x.category, 'en'), t(x.category, 'ar'), x.evidence || ''].join(' '); return { item: x, score: overlapScore(text, jdCount, themes) }; }); function pick(re) { return all.filter(function (x) { return re.test(x.item.categoryKey || ''); }).sort(function (a, b) { return b.score - a.score || (a.item.order || 0) - (b.item.order || 0); }).slice(0, 4).map(function (x) { return x.item.id; }); } return { commercial: pick(/cat-[12]/), leadership: pick(/cat-[34]/) }; }
  function selectCerts(jdCount, themes) { return vis(D.certifications.items).map(function (x) { var text = [t(x.name, 'en'), t(x.name, 'ar'), t(x.provider, 'en'), t(x.provider, 'ar')].join(' '); return { item: x, score: overlapScore(text, jdCount, themes) }; }).sort(function (a, b) { return b.score - a.score || String(b.item.date || '').localeCompare(String(a.item.date || '')); }).slice(0, 2).map(function (x) { return x.item.id; }); }
  function selectBullets(jdCount, themes) { var out = {}; vis(D.experience.items).forEach(function (r, roleIndex) { var en = (r.responsibilities && r.responsibilities.en) || [], ar = (r.responsibilities && r.responsibilities.ar) || [], max = roleIndex < 4 ? 2 : 1; var ranked = en.map(function (text, i) { return { i: i, score: overlapScore(text + ' ' + (ar[i] || ''), jdCount, themes) + Math.max(0, 3 - roleIndex) * 0.15 }; }).sort(function (a, b) { return b.score - a.score || a.i - b.i; }); out[r.id] = ranked.slice(0, max).map(function (x) { return x.i; }); }); return out; }
  function makeScope(themes) { var selected = themes.filter(function (x) { return x.score > 0; }).slice(0, 6), fallback = ['sales', 'field', 'kpi', 'training', 'launch', 'stakeholder']; fallback.forEach(function (k) { if (selected.length < 6 && !selected.some(function (x) { return x.key === k; })) selected.push({ key: k, score: 0 }); }); return { en: selected.slice(0, 6).map(function (x) { return THEMES[x.key].scope.en; }), ar: selected.slice(0, 6).map(function (x) { return THEMES[x.key].scope.ar; }) }; }
  function makeHeadline(themes) { var top = themes.filter(function (x) { return x.score > 0; }).slice(0, 2); if (!top.length) top = [{ key: 'sales' }, { key: 'training' }]; if (top.length === 1) top.push({ key: top[0].key === 'sales' ? 'field' : 'sales' }); return { en: top.map(function (x) { return THEMES[x.key].label.en; }), ar: top.map(function (x) { return THEMES[x.key].label.ar; }) }; }
  function relevanceScore(keywords, themes) { var core = keywords.slice(0, 14), found = core.filter(function (x) { return x.found; }).length, wordCoverage = core.length ? found / core.length : 0.5, activeThemes = themes.filter(function (x) { return x.score > 0; }).slice(0, 6), c = corpusText(), themeCoverage = activeThemes.length ? activeThemes.filter(function (x) { var th = THEMES[x.key]; return th.en.concat(th.ar).some(function (k) { return c.indexOf(normalize(k)) > -1; }); }).length / activeThemes.length : 0.65; return Math.max(45, Math.min(96, Math.round((wordCoverage * 0.72 + themeCoverage * 0.28) * 100))); }

  function analyze() {
    var jd = $('jd').value.trim();
    if (jd.length < 80) { showMsg(LANG === 'ar' ? 'ألصق وصفاً وظيفياً أكثر تفصيلاً للحصول على تخصيص أدق.' : 'Paste a more complete job description for an accurate match.', true); return; }
    var jdCount = countMap(words(jd)), themes = detectThemes(jd), keywords = topKeywords(jd), enteredTitle = $('jobTitle').value.trim(), title = enteredTitle || inferTitle(jd) || (LANG === 'ar' ? 'وظيفة مستهدفة' : 'Target Role');
    if (!enteredTitle && title) $('jobTitle').value = title;
    var requestId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7), slug = safeSlug(title), headline = makeHeadline(themes), summary = makeSummary(themes), scope = makeScope(themes), skills = selectSkills(jdCount, themes), certIds = selectCerts(jdCount, themes), bulletSelection = selectBullets(jdCount, themes), score = relevanceScore(keywords, themes), missing = keywords.filter(function (x) { return !x.found; }).slice(0, 6).map(function (x) { return x.word; });
    RESULT = { active: true, requestId: requestId, createdAt: new Date().toISOString(), lang: LANG, jobTitle: title, slug: slug, matchScore: score, keywords: keywords.filter(function (x) { return x.found; }).slice(0, 12).map(function (x) { return x.word; }), missingKeywords: missing, themes: themes.filter(function (x) { return x.score > 0; }).slice(0, 6).map(function (x) { return x.key; }), headline: headline, summary: summary, scope: scope, commercialSkillIds: skills.commercial, leadershipSkillIds: skills.leadership, certIds: certIds, bulletSelection: bulletSelection };
    RESULT.outputPath = 'downloads/tailored/Ahmad-Alshehri-CV-' + slug + '-' + LANG + '-' + requestId + '.pdf'; renderResult(); showMsg('');
  }

  function itemById(list, id) { return (list || []).filter(function (x) { return x.id === id; })[0]; }
  function renderResult() {
    if (!RESULT) return;
    $('emptyState').hidden = true; $('results').hidden = false; $('matchScore').textContent = RESULT.matchScore + '%'; $('scoreRing').style.setProperty('--score', RESULT.matchScore); $('matchLabel').textContent = LANG === 'ar' ? 'توافق المحتوى' : 'Content relevance'; $('resultTitle').textContent = RESULT.jobTitle; $('resultHeadline').innerHTML = RESULT.headline[LANG].map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(''); $('keywordChips').innerHTML = RESULT.keywords.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join(''); $('missingRow').hidden = !RESULT.missingKeywords.length; $('missingChips').innerHTML = RESULT.missingKeywords.map(function (x) { return '<span class="chip chip-muted">' + esc(x) + '</span>'; }).join('');
    var ids = RESULT.commercialSkillIds.concat(RESULT.leadershipSkillIds); $('skillChips').innerHTML = ids.map(function (id) { var x = itemById(D.skills.items, id); return x ? '<span class="chip">' + esc(t(x.name)) + '</span>' : ''; }).join(''); $('certList').innerHTML = RESULT.certIds.map(function (id) { var x = itemById(D.certifications.items, id); return x ? '<li><b>' + esc(t(x.name)) + '</b><span>' + esc(t(x.provider)) + '</span></li>' : ''; }).join(''); var themeLabels = RESULT.themes.map(function (k) { return THEMES[k].label[LANG]; }); $('priorityList').innerHTML = themeLabels.slice(0, 5).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); $('generateBtn').disabled = false; $('generateBtn').textContent = LANG === 'ar' ? 'إنشاء وتحميل PDF المخصص' : 'Generate & download tailored PDF'; $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showMsg(msg, bad) { var el = $('formMsg'); el.textContent = msg || ''; el.className = 'form-msg' + (bad ? ' bad' : ''); }
  function setStatus(step, text, bad) { $('exportStatus').hidden = false; $('exportStatus').className = 'export-status' + (bad ? ' bad' : ''); $('exportStep').textContent = step || ''; $('exportText').textContent = text || ''; }
  function tokenState() {
    var state = $('connectionState');
    if (!state) return;
    state.className = 'connection ok';
    state.innerHTML = '<span class="dot"></span><span class="en">Direct PDF download ready</span><span class="ar">تحميل PDF المباشر جاهز</span>';
  }
  function pause(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function bytesToBase64(buffer) {
    var bytes = new Uint8Array(buffer), chunks = [];
    for (var i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)));
    return btoa(chunks.join(''));
  }
  async function prepareFrame() {
    window.__AA_TAILORED_RESULT__ = JSON.parse(JSON.stringify(RESULT));
    var frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-12000px;top:0;width:1050px;height:1400px;border:0;opacity:0;pointer-events:none;';
    frame.src = '../tailored-cv-render.html?local=1&request=' + encodeURIComponent(RESULT.requestId) + '&lang=' + encodeURIComponent(LANG);
    document.body.appendChild(frame);
    await new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error(LANG === 'ar' ? 'استغرق تجهيز قالب السيرة وقتًا أطول من المتوقع.' : 'The CV template took too long to load.')); }, 20000);
      frame.addEventListener('load', function () {
        (async function () {
          try {
            for (var attempt = 0; attempt < 200 && !frame.contentWindow.__TAILORED_READY__; attempt++) await pause(75);
            if (frame.contentWindow.__TAILORED_ERROR__) throw new Error(frame.contentWindow.__TAILORED_ERROR__);
            if (!frame.contentWindow.__TAILORED_READY__) throw new Error('CV template did not finish loading.');
            frame.contentDocument.documentElement.classList.add('cv-export-a4');
            if (frame.contentDocument.fonts && frame.contentDocument.fonts.ready) await frame.contentDocument.fonts.ready;
            var images = Array.prototype.slice.call(frame.contentDocument.images);
            await Promise.all(images.map(function (img) {
              if (img.complete) return Promise.resolve();
              return new Promise(function (done) { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); setTimeout(done, 3500); });
            }));
            clearTimeout(timer); resolve();
          } catch (error) { clearTimeout(timer); reject(error); }
        })();
      }, { once: true });
      frame.addEventListener('error', function () { clearTimeout(timer); reject(new Error('Could not open the CV template.')); }, { once: true });
    });
    return frame;
  }
  async function loadFrameGenerator(frame) {
    if (typeof frame.contentWindow.html2pdf === 'function') return frame.contentWindow.html2pdf;
    await new Promise(function (resolve, reject) {
      var script = frame.contentDocument.createElement('script');
      script.src = new URL('../assets/vendor/html2pdf.bundle.min.js?v=0.10.2', window.location.href).href;
      script.onload = resolve;
      script.onerror = function () { reject(new Error(LANG === 'ar' ? 'تعذر تحميل أداة تصدير السيرة.' : 'Could not load the CV export engine.')); };
      frame.contentDocument.head.appendChild(script);
    });
    if (typeof frame.contentWindow.html2pdf !== 'function') throw new Error('The CV export engine is unavailable.');
    return frame.contentWindow.html2pdf;
  }
  async function addSearchableText(pdf, page) {
    var response = await fetch('../assets/fonts/cv-studio-ats.ttf', { cache: 'force-cache' });
    if (!response.ok) throw new Error('ATS font failed to load.');
    pdf.addFileToVFS('CVStudioATS.ttf', bytesToBase64(await response.arrayBuffer()));
    pdf.addFont('CVStudioATS.ttf', 'CVStudioATS', 'normal');
    pdf.setFont('CVStudioATS', 'normal');
    pdf.setFontSize(0.65);
    var text = page.innerText || page.textContent || '';
    var lines = text.split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    lines.forEach(function (line, index) {
      var y = 2 + index * 0.7;
      if (y < 293) pdf.text(line, LANG === 'ar' ? 207 : 3, y, { renderingMode: 'invisible', align: LANG === 'ar' ? 'right' : 'left', maxWidth: 202 });
    });
  }
  async function shareReadyPdf() {
    if (!READY_PDF) return;
    var file = new File([READY_PDF.blob], READY_PDF.filename, { type: 'application/pdf' });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      try { await navigator.share({ files: [file], title: READY_PDF.filename }); return; }
      catch (error) { if (error.name === 'AbortError') return; }
    }
    $('downloadLink').click();
  }
  async function generatePdf() {
    if (!RESULT) { analyze(); if (!RESULT) return; }
    var button = $('generateBtn'), frame = null;
    button.disabled = true;
    if ($('retryBtn')) $('retryBtn').hidden = true;
    if ($('downloadLink')) $('downloadLink').hidden = true;
    if ($('sharePdfBtn')) $('sharePdfBtn').hidden = true;
    try {
      if (typeof window.html2pdf !== 'function') throw new Error(LANG === 'ar' ? 'تعذر تحميل أداة إنشاء PDF. حدّث الصفحة وحاول مرة أخرى.' : 'The PDF generator did not load. Refresh the page and try again.');
      setStatus('1/3', LANG === 'ar' ? 'جارٍ تجهيز السيرة المخصصة داخل المتصفح…' : 'Preparing your tailored CV in this browser…');
      frame = await prepareFrame();
      var page = frame.contentDocument.querySelector('.page');
      if (!page) throw new Error('The CV page could not be rendered.');
      page.style.margin = '0';
      page.style.boxShadow = 'none';
      page.style.width = '210mm';
      page.style.height = '296.8mm';
      page.style.minHeight = '296.8mm';
      page.style.maxHeight = '296.8mm';
      frame.contentDocument.body.style.background = '#ffffff';
      var pageWidth = Math.ceil(page.getBoundingClientRect().width);
      var pageHeight = Math.ceil(page.getBoundingClientRect().height);
      setStatus('2/3', LANG === 'ar' ? 'جارٍ إنشاء ملف PDF من صفحة واحدة مع نص قابل للقراءة…' : 'Generating a one-page PDF with searchable text…');
      var filename = 'Ahmad-Alshehri-CV-' + RESULT.slug + '-' + LANG + '.pdf';
      var frameGenerator = await loadFrameGenerator(frame);
      var worker = frameGenerator().set({
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff', logging: false, scrollX: 0, scrollY: 0, width: pageWidth, height: pageHeight, windowWidth: pageWidth, windowHeight: pageHeight, onclone: function (cloned) { cloned.documentElement.classList.add('cv-export-a4'); cloned.documentElement.style.width = '210mm'; cloned.body.style.width = '210mm'; cloned.body.style.margin = '0'; var container = cloned.querySelector('.html2pdf__container'); if (container) { container.style.width = '210mm'; container.style.maxWidth = '210mm'; container.style.left = '0'; container.style.right = 'auto'; container.style.margin = '0'; container.style.transform = 'none'; } var clonedPage = cloned.querySelector('.html2pdf__container .page') || cloned.querySelector('.page'); if (clonedPage) { clonedPage.style.width = '210mm'; clonedPage.style.height = '296.8mm'; clonedPage.style.margin = '0'; clonedPage.style.transform = 'none'; } } },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      }).from(page).toPdf();
      var pdf = await worker.get('pdf');
      while (pdf.getNumberOfPages() > 1) pdf.deletePage(pdf.getNumberOfPages());
      await addSearchableText(pdf, page);
      var blob = pdf.output('blob');
      if (!blob || !blob.size) throw new Error(LANG === 'ar' ? 'تعذر تجهيز ملف PDF.' : 'The PDF file could not be generated.');
      if (READY_PDF_URL) URL.revokeObjectURL(READY_PDF_URL);
      READY_PDF = { blob: blob, filename: filename };
      READY_PDF_URL = URL.createObjectURL(blob);
      var link = $('downloadLink');
      link.href = READY_PDF_URL;
      link.download = filename;
      link.hidden = false;
      if ($('sharePdfBtn') && navigator.share) $('sharePdfBtn').hidden = false;
      setStatus('3/3', LANG === 'ar' ? 'الملف جاهز. اضغط «تحميل ملف PDF الجاهز» أو «حفظ أو مشاركة PDF».' : 'PDF ready. Tap “Download ready PDF” or “Save or share PDF”.');
      try { link.click(); } catch (error) { /* A visible user-activated download link remains available. */ }

    } catch (error) {
      setStatus('!', error.message || String(error), true);
      if ($('retryBtn')) $('retryBtn').hidden = false;
    } finally {
      button.disabled = false;
      if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
      try { delete window.__AA_TAILORED_RESULT__; } catch (error) { window.__AA_TAILORED_RESULT__ = null; }
    }
  }
  function checkAgain() { return generatePdf(); }
  function setLang(l) { LANG = l === 'ar' ? 'ar' : 'en'; document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr'; document.body.dir = LANG === 'ar' ? 'rtl' : 'ltr'; $('outLang').value = LANG; try { localStorage.setItem('aa_lang', LANG); } catch (e) {} if (RESULT) { RESULT.lang = LANG; RESULT.outputPath = 'downloads/tailored/Ahmad-Alshehri-CV-' + RESULT.slug + '-' + LANG + '-' + RESULT.requestId + '.pdf'; renderResult(); } }
  function bind() { $('analyzeBtn').addEventListener('click', analyze); $('generateBtn').addEventListener('click', generatePdf); $('retryBtn').addEventListener('click', checkAgain); $('sharePdfBtn').addEventListener('click', shareReadyPdf); $('outLang').addEventListener('change', function () { setLang(this.value); }); $('langBtn').addEventListener('click', function () { setLang(LANG === 'ar' ? 'en' : 'ar'); }); }
  function boot() { var saved = 'en'; try { saved = localStorage.getItem('aa_lang') || 'en'; } catch (e) {} setLang(saved); bind(); tokenState(); Promise.all(FILES.map(function (f) { return fetch('../data/' + f + '.json?v=20260823-tailor1', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(f + '.json — ' + r.status); return r.json(); }); })).then(function (all) { FILES.forEach(function (f, i) { D[f] = all[i]; }); $('analyzeBtn').disabled = false; $('loadState').hidden = true; }).catch(function (e) { showMsg((LANG === 'ar' ? 'تعذر تحميل بيانات السيرة: ' : 'Could not load CV data: ') + e.message, true); }); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
