/* ==========================================================================
   Ahmad Alshehri — career hub renderer
   Reads /data/*.json and builds the page. No content is hard-coded here.
   Paths are relative, so this works under any GitHub Pages base path.
   ========================================================================== */
(function () {
  'use strict';

  var FILES = ['profile', 'settings', 'experience', 'progression', 'achievements',
    'skills', 'certifications', 'education', 'languages', 'projects', 'training', 'documents'];

  var D = {};                       // loaded data
  var LANG = 'en';
  var html = document.documentElement;

  /* ---------------------------------------------------------------- utils */
  function t(v) {                   // bilingual value -> current language string
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return v[LANG] || v.en || v.ar || '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function bi(v) {                  // bilingual value -> both spans (SEO: both in DOM)
    if (v == null) return '';
    if (typeof v === 'string') return esc(v);
    return '<span class="en">' + esc(v.en || '') + '</span><span class="ar">' + esc(v.ar || '') + '</span>';
  }
  function el(id) { return document.getElementById(id); }
  function visible(list) {
    return (list || []).filter(function (x) { return x.visible !== false; })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  function get(path, obj) {
    return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  /* ------------------------------------------------------- derived metrics */
  function metrics() {
    var exp = visible(D.experience.items);
    var certs = visible(D.certifications.items);
    var startYear = (D.settings.metrics && D.settings.metrics.experienceStartYear) || 2020;
    var companies = {};
    exp.forEach(function (e) { if (e.company) companies[e.company] = 1; });
    return {
      years: Math.max(1, new Date().getFullYear() - startYear),
      roles: exp.length,
      companies: Object.keys(companies).length,
      certifications: certs.length,
      trainingHours: certs.reduce(function (s, c) { return s + (Number(c.hours) || 0); }, 0),
      projects: visible(D.projects.items).length,
      trainingPrograms: visible(D.training.items).length
    };
  }

  /* ------------------------------------------------------------- sections */
  function renderBindings() {
    document.querySelectorAll('[data-bind]').forEach(function (node) {
      node.innerHTML = bi(get(node.getAttribute('data-bind'), D));
    });
    var cv = D.profile.cvUrl || '#';
    ['cvNav', 'cvHero', 'cvContact'].forEach(function (id) {
      var a = el(id); if (a) a.href = cv;
    });
    var mono = el('monogram');
    if (D.profile.photo) {
      el('photoSlot').outerHTML =
        '<img class="profile-photo" src="' + esc(D.profile.photo) + '" alt="' + esc(t(D.profile.name)) +
        '" width="1026" height="1305" loading="eager" fetchpriority="high">';
    } else if (mono) {
      mono.textContent = D.profile.monogram || 'AA';
    }
  }

  function renderNav() {
    var s = D.settings.sections || {};
    var items = [
      ['profile', { en: 'Profile', ar: 'الملف المهني' }],
      ['experience', { en: 'Experience', ar: 'الخبرات' }],
      ['projects', { en: 'Projects', ar: 'المشاريع' }],
      ['training', { en: 'Training', ar: 'التدريب' }],
      ['competencies', { en: 'Competencies', ar: 'الكفاءات' }],
      ['certifications', { en: 'Certifications', ar: 'الشهادات' }],
      ['education', { en: 'Education', ar: 'التعليم' }],
      ['contact', { en: 'Contact', ar: 'تواصل' }]
    ];
    el('nav').innerHTML = items.filter(function (i) {
      if (s[i[0]] === false) return false;
      if (i[0] === 'projects') return visible(D.projects.items).length > 0;
      if (i[0] === 'training') return visible(D.training.items).length > 0;
      return true;
    }).map(function (i) {
      return '<a href="#' + i[0] + '">' + bi(i[1]) + '</a>';
    }).join('');
  }

  function renderHero() {
    var m = metrics();
    var cur = visible(D.experience.items).filter(function (e) { return e.current; })[0];
    var bits = [];
    if (cur) {
      bits.push({
        en: 'Currently ' + t2(cur.title, 'en') + ', ' + cur.company,
        ar: 'حالياً ' + t2(cur.title, 'ar') + ' في ' + cur.company
      });
    }
    bits.push({ en: 'National scope, KSA', ar: 'نطاق وطني في المملكة' });
    el('heroMeta').innerHTML = bits.map(function (b) {
      return '<span><i class="dot"></i>' + bi(b) + '</span>';
    }).join('');

    el('facts').innerHTML = (D.profile.atAGlance || []).map(function (f) {
      return '<li><span class="f-k">' + bi(f.label) + '</span><span class="f-v">' +
        '<span class="en">' + esc(f.value.en) + '<small>' + esc(f.note.en) + '</small></span>' +
        '<span class="ar">' + esc(f.value.ar) + '<small>' + esc(f.note.ar) + '</small></span>' +
        '</span></li>';
    }).join('');

    el('summary').innerHTML =
      '<div class="en">' + (D.profile.summary.en || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>' +
      '<div class="ar">' + (D.profile.summary.ar || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div>';

    el('expNote').innerHTML = bi({
      en: m.roles + ' positions across ' + m.companies + ' global technology brands, with responsibility widening from a single store to regional teams to national operations.',
      ar: m.roles + ' وظائف عبر ' + m.companies + ' علامات تقنية عالمية، مع اتساع المسؤولية من متجر واحد إلى فرق إقليمية ثم عمليات على مستوى المملكة.'
    });
  }
  function t2(v, l) { return (v && (v[l] || v.en)) || ''; }

  function renderAchievements() {
    var m = metrics();
    var map = { years: m.years, roles: m.roles, trainingHours: m.trainingHours,
      companies: m.companies, certifications: m.certifications,
      projects: m.projects, trainingPrograms: m.trainingPrograms };
    var auto = D.settings.metrics && D.settings.metrics.autoCalculate !== false;
    el('hlGrid').innerHTML = visible(D.achievements.items)
      .filter(function (a) { return a.featured !== false; })
      .map(function (a) {
        var val = (auto && map[a.auto] != null) ? map[a.auto] : a.value;
        return '<div class="hl"><p class="hl-fig">' +
          '<span class="en">' + esc(val) + '<span class="u">' + esc(a.unit.en) + '</span></span>' +
          '<span class="ar">' + esc(val) + '<span class="u">' + esc(a.unit.ar) + '</span></span>' +
          '</p><p class="hl-lab">' + bi(a.title) + '</p></div>';
      }).join('');
  }

  function renderExperience() {
    el('rail').innerHTML = visible(D.progression.items).map(function (s) {
      return '<li class="rail-step" data-tier="' + esc(s.tier) + '">' +
        '<p class="rail-yr">' + bi(s.year) + '</p>' +
        '<p class="rail-co">' + esc(s.company) + '</p>' +
        '<p class="rail-ttl">' + bi(s.title) + '</p></li>';
    }).join('');

    var SCOPE = {
      store: [{ en: 'Scope — Store', ar: 'النطاق — متجر' }, 1],
      regional: [{ en: 'Scope — Regional', ar: 'النطاق — إقليمي' }, 2],
      national: [{ en: 'Scope — National', ar: 'النطاق — وطني' }, 3],
      international: [{ en: 'Scope — International', ar: 'النطاق — دولي' }, 3]
    };

    el('roles').innerHTML = visible(D.experience.items).map(function (r) {
      var sc = SCOPE[r.scope] || SCOPE.store;
      var meter = '';
      for (var i = 1; i <= 3; i++) meter += '<i class="' + (i <= sc[1] ? 'on' : '') + '"></i>';
      var lists = ['en', 'ar'].map(function (l) {
        var items = (r.responsibilities && r.responsibilities[l]) || [];
        return items.length ? '<ul class="' + l + '">' + items.map(function (x) {
          return '<li>' + esc(x) + '</li>';
        }).join('') + '</ul>' : '';
      }).join('');
      var extras = '';
      var linked = relatedProjects(r.id);
      if (linked.length) {
        extras = '<div class="linkrow">' + linked.map(function (p) {
          return '<button class="dlink" data-project="' + esc(p.id) + '">' + bi(p.title) + ' ↗</button>';
        }).join('') + '</div>';
      }
      return '<li class="role"><div class="role-when">' +
        '<p class="role-period">' + bi(r.period) + '</p>' +
        '<p class="role-co">' + esc(r.company) + ' — ' + bi(r.location) + '</p>' +
        '<p class="scope"><span class="scope-lab">' + bi(sc[0]) + '</span>' +
        '<span class="meter" role="img" aria-label="Scope"> ' + meter + '</span></p>' +
        '</div><div><h3 class="role-title">' + bi(r.title) + '</h3>' + lists + extras + '</div></li>';
    }).join('');
  }

  function relatedProjects(expId) {
    return visible(D.projects.items).filter(function (p) {
      return (p.experience || []).indexOf(expId) > -1;
    });
  }

  function renderProjects() {
    var items = visible(D.projects.items);
    var sec = el('projects');
    if (!items.length || D.settings.sections.projects === false) { sec.classList.add('is-empty'); return; }
    sec.classList.remove('is-empty');
    el('projectGrid').innerHTML = items.map(function (p) {
      var kpis = (p.kpis || []).slice(0, 3).map(function (k) {
        return '<span class="kpi">' + esc(t(k)) + '</span>';
      }).join('');
      return '<button class="pcard" data-project="' + esc(p.id) + '" type="button">' +
        (p.featured ? '<span class="flag">' + bi({ en: 'Featured', ar: 'مميّز' }) + '</span>' : '') +
        '<span class="pcard-top"><span class="pcard-yr">' + esc(p.year || '') + '</span>' +
        '<span class="pcard-co">' + esc(p.company || '') + '</span></span>' +
        '<h3>' + bi(p.title) + '</h3>' +
        '<p>' + bi(p.challenge) + '</p>' +
        (kpis ? '<span class="kpi-row">' + kpis + '</span>' : '') +
        '<span class="pcard-foot">' + bi({ en: 'Read case study →', ar: 'اقرأ دراسة الحالة →' }) + '</span>' +
        '</button>';
    }).join('');
  }

  function renderTraining() {
    var items = visible(D.training.items);
    var sec = el('training');
    if (!items.length || D.settings.sections.training === false) { sec.classList.add('is-empty'); return; }
    sec.classList.remove('is-empty');
    var m = metrics();
    var people = items.reduce(function (s, x) { return s + (Number(x.participants) || 0); }, 0);
    el('trainNote').innerHTML = bi({
      en: m.trainingPrograms + ' programmes delivered' + (people ? ' to ' + people + ' participants' : '') + '.',
      ar: m.trainingPrograms + ' برنامجاً تدريبياً' + (people ? ' لـ ' + people + ' مشاركاً' : '') + '.'
    });
    el('trainList').innerHTML = items.map(function (x) {
      return '<li class="titem" data-training="' + esc(x.id) + '" tabindex="0" role="button">' +
        '<span class="t-when">' + esc(x.date || '') + '<small>' + esc(x.company || '') + '</small></span>' +
        '<span><h3>' + bi(x.title) + '</h3><p>' + bi(x.audience) + '</p></span>' +
        '<span class="t-num">' + (x.participants ? esc(x.participants) + ' ' + t({ en: 'participants', ar: 'مشارك' }) : esc(x.duration || '')) + '</span>' +
        '</li>';
    }).join('');
  }

  function renderSkills() {
    var items = visible(D.skills.items), groups = {}, order = [];
    items.forEach(function (s) {
      var k = s.categoryKey || t(s.category);
      if (!groups[k]) { groups[k] = { cat: s.category, note: s.categoryNote, list: [] }; order.push(k); }
      groups[k].list.push(s);
    });
    el('compGrid').innerHTML = order.map(function (k, i) {
      var g = groups[k];
      var tags = ['en', 'ar'].map(function (l) {
        return '<ul class="tags ' + l + '">' + g.list.map(function (s) {
          return '<li>' + esc(s.name[l] || s.name.en) + '</li>';
        }).join('') + '</ul>';
      }).join('');
      var wide = (i === order.length - 1 && order.length % 2 === 1) ? ' style="grid-column:1/-1"' : '';
      return '<div class="comp"' + wide + '><h3>' + bi(g.cat) + '</h3><p>' + bi(g.note) + '</p>' + tags + '</div>';
    }).join('');
  }

  function renderCerts() {
    var items = visible(D.certifications.items), groups = {}, order = [];
    items.forEach(function (c) {
      var k = c.categoryKey || t(c.category);
      if (!groups[k]) { groups[k] = { cat: c.category, list: [] }; order.push(k); }
      groups[k].list.push(c);
    });
    var m = metrics();
    el('certTotal').innerHTML = bi({ en: m.trainingHours + ' hours total', ar: m.trainingHours + ' ساعة إجمالاً' });
    el('certNote').innerHTML = bi({
      en: m.certifications + ' completed programmes in training delivery, management, quality, and customer experience.',
      ar: m.certifications + ' برامج مكتملة في تنفيذ التدريب والإدارة والجودة وتجربة العميل.'
    });
    el('certGroups').innerHTML = order.map(function (k) {
      var g = groups[k];
      return '<div class="cert-group"><h3>' + bi(g.cat) + '</h3><ul class="certs">' +
        g.list.map(function (c) {
          var inner =
            '<span class="en">' + esc(c.name.en) + '<small>' + esc(c.provider.en) + '</small></span>' +
            '<span class="ar">' + esc(c.name.ar) + '<small>' + esc(c.provider.ar) + '</small></span>';
          var name = c.credentialUrl
            ? '<a class="cert-link" href="' + esc(c.credentialUrl) + '" target="_blank" rel="noopener" aria-label="View certificate">' +
              inner + '<span class="cert-go" aria-hidden="true">↗</span></a>'
            : inner;
          return '<li class="cert"><p class="cert-name">' + name + '</p>' +
            '<span class="cert-hrs">' + bi({ en: c.hours + ' hrs', ar: c.hours + ' ساعة' }) + '</span>' +
            '<span class="cert-date">' + bi(c.dateLabel) + '</span></li>';
        }).join('') + '</ul></div>';
    }).join('');
    el('accred').innerHTML = bi(D.settings.notes.accreditation);
  }

  function renderEducation() {
    el('eduList').innerHTML = visible(D.education.items).map(function (e) {
      return '<div class="edu-card"><h3>' + bi(e.program) + '</h3>' +
        '<p>' + bi(e.institution) + '</p><p>' + bi(e.location) + '</p>' +
        (t(e.status) ? '<span class="status">' + bi(e.status) + '</span>' : '') + '</div>';
    }).join('');
    el('langList').innerHTML = visible(D.languages.items).map(function (l) {
      return '<li><span class="lang-n">' + bi(l.name) + '</span><span class="lang-l">' + bi(l.level) + '</span></li>';
    }).join('');
  }

  function renderContact() {
    var c = D.profile.contact, career = D.settings.career || {};
    el('ctaHead').innerHTML = bi(career.ctaHeadline);
    el('ctaBody').innerHTML = bi(career.ctaBody);
    el('emailBtn').href = 'mailto:' + c.email + '?subject=' + encodeURIComponent('Opportunity for ' + t(D.profile.name));

    el('statusStrip').innerHTML = career.openToOpportunities
      ? '<div class="status-strip"><span class="status-dot"></span>' +
        '<b>' + bi({ en: 'Open to opportunities', ar: 'منفتح على الفرص' }) + '</b>' +
        '<span>' + bi(career.availability) + ' · ' + bi(career.preferredLocation) + '</span>' +
        (career.targetRoles && career.targetRoles.length
          ? '<ul class="role-chips">' + career.targetRoles.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>'
          : '') + '</div>'
      : '';

    var rows = [
      [{ en: 'Email', ar: 'البريد الإلكتروني' }, '<a href="mailto:' + esc(c.email) + '" class="ltr">' + esc(c.email) + '</a>'],
      [{ en: 'Phone', ar: 'الهاتف' }, '<a href="tel:' + esc(c.phone.replace(/[^\d+]/g, '')) + '" class="ltr">' + esc(c.phone) + '</a>'],
      [{ en: 'Location', ar: 'الموقع' }, '<span class="f-v">' + bi(c.location) + '</span>']
    ];
    if (c.linkedin) {
      rows.push([{ en: 'LinkedIn', ar: 'لينكدإن' },
        '<a href="' + esc(c.linkedin) + '" target="_blank" rel="noopener" class="ltr">' +
        esc(c.linkedin.replace(/^https?:\/\/(www\.)?/, '')) + '</a>']);
    }
    el('clist').innerHTML = rows.map(function (r) {
      return '<li><span class="f-k">' + bi(r[0]) + '</span>' + r[1] + '</li>';
    }).join('');
  }

  /* ---------------------------------------------------------------- drawer */
  function block(label, body) {
    return body ? '<div class="dblock"><h4>' + bi(label) + '</h4>' + body + '</div>' : '';
  }
  function list(arr) {
    var a = (arr || []).map(function (x) { return t(x); }).filter(Boolean);
    return a.length ? '<ul>' + a.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '';
  }
  function para(v) { return t(v) ? '<p>' + esc(t(v)) + '</p>' : ''; }
  function links(arr) {
    var a = (arr || []).filter(function (x) { return x && x.url; });
    return a.length ? '<div class="dlinks">' + a.map(function (x) {
      return '<a class="dlink" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(t(x.title) || 'Document') + ' ↗</a>';
    }).join('') + '</div>' : '';
  }

  function openDrawer(kind, id) {
    var item = (kind === 'project' ? D.projects.items : D.training.items)
      .filter(function (x) { return x.id === id; })[0];
    if (!item) return;
    var body;
    if (kind === 'project') {
      body = '<h2>' + bi(item.title) + '</h2><p class="meta">' +
        esc([item.company, item.year, t(item.role)].filter(Boolean).join(' · ')) + '</p>' +
        block({ en: 'Challenge', ar: 'التحدي' }, para(item.challenge)) +
        block({ en: 'Objective', ar: 'الهدف' }, para(item.objective)) +
        block({ en: 'Actions', ar: 'الإجراءات' }, list(item.actions)) +
        block({ en: 'Result', ar: 'النتيجة' }, para(item.result)) +
        block({ en: 'Measurable impact', ar: 'الأثر القابل للقياس' },
          (item.kpis || []).length ? '<div class="kpi-row">' + item.kpis.map(function (k) {
            return '<span class="kpi">' + esc(t(k)) + '</span>';
          }).join('') + '</div>' : '') +
        block({ en: 'Retail partners', ar: 'شركاء التجزئة' }, list(item.partners)) +
        block({ en: 'Skills demonstrated', ar: 'المهارات المستخدمة' }, list(item.skills)) +
        block({ en: 'Documents', ar: 'المستندات' }, links(item.documents));
    } else {
      body = '<h2>' + bi(item.title) + '</h2><p class="meta">' +
        esc([item.company, item.date, item.location].filter(Boolean).join(' · ')) + '</p>' +
        block({ en: 'Objective', ar: 'الهدف' }, para(item.objective)) +
        block({ en: 'Audience', ar: 'الفئة المستهدفة' }, para(item.audience)) +
        block({ en: 'Topics', ar: 'المحاور' }, list(item.topics)) +
        block({ en: 'Method', ar: 'أسلوب التدريب' }, para(item.method)) +
        block({ en: 'Assessment', ar: 'أسلوب التقييم' }, para(item.assessment)) +
        block({ en: 'Result', ar: 'النتيجة' }, para(item.result)) +
        block({ en: 'Materials', ar: 'المواد التدريبية' }, links(item.documents));
    }
    el('drawerBody').innerHTML = body;
    el('drawer').classList.add('open');
    el('drawerBg').classList.add('open');
    el('drawerClose').focus();
  }
  function closeDrawer() {
    el('drawer').classList.remove('open');
    el('drawerBg').classList.remove('open');
  }

  /* ------------------------------------------------------------- language */
  function setLang(l) {
    LANG = l;
    html.setAttribute('lang', l);
    html.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
    document.title = t(D.settings.site.baseTitle);
    var d = document.querySelector('meta[name="description"]');
    if (d) d.setAttribute('content', t(D.settings.site.description));
  }

  function jsonld() {
    var m = metrics();
    var exp = visible(D.experience.items);
    var cur = exp.filter(function (e) { return e.current; })[0] || exp[0];
    var data = {
      '@context': 'https://schema.org', '@type': 'Person',
      name: D.profile.name.en, alternateName: D.profile.fullName.ar,
      jobTitle: cur ? cur.title.en : '',
      email: 'mailto:' + D.profile.contact.email,
      telephone: D.profile.contact.phone.replace(/\s/g, ''),
      url: D.settings.site.url,
      nationality: 'Saudi Arabian',
      description: D.settings.site.description.en,
      address: { '@type': 'PostalAddress', addressLocality: 'Riyadh', addressCountry: 'SA' },
      worksFor: cur ? { '@type': 'Organization', name: cur.company } : undefined,
      alumniOf: visible(D.education.items).map(function (e) {
        return { '@type': 'CollegeOrUniversity', name: e.institution.en };
      }),
      knowsLanguage: visible(D.languages.items).map(function (l) {
        return { '@type': 'Language', name: l.name.en };
      }),
      knowsAbout: visible(D.skills.items).slice(0, 20).map(function (s) { return s.name.en; }),
      hasCredential: visible(D.certifications.items).map(function (c) {
        return { '@type': 'EducationalOccupationalCredential', name: c.name.en,
          credentialCategory: 'course', url: c.credentialUrl || undefined,
          recognizedBy: { '@type': 'Organization', name: c.provider.en } };
      })
    };
    if (D.profile.contact.linkedin) data.sameAs = [D.profile.contact.linkedin];
    el('jsonld').textContent = JSON.stringify(data);
  }

  /* ------------------------------------------------------------------ boot */
  function draft() {
    try {
      if (new URLSearchParams(location.search).get('preview') !== '1') return null;
      var raw = sessionStorage.getItem('aa_preview');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function boot(data) {
    D = data;
    renderBindings(); renderNav(); renderHero(); renderAchievements();
    renderExperience(); renderProjects(); renderTraining();
    renderSkills(); renderCerts(); renderEducation(); renderContact(); jsonld();
    setLang(D.settings.site.defaultLang || 'en');

    el('langBtn').addEventListener('click', function () {
      setLang(LANG === 'ar' ? 'en' : 'ar');
    });
    document.addEventListener('click', function (e) {
      var p = e.target.closest('[data-project]');
      if (p) { openDrawer('project', p.getAttribute('data-project')); return; }
      var tr = e.target.closest('[data-training]');
      if (tr) { openDrawer('training', tr.getAttribute('data-training')); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
      if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-training')) {
        openDrawer('training', e.target.getAttribute('data-training'));
      }
    });
    el('drawerClose').addEventListener('click', closeDrawer);
    el('drawerBg').addEventListener('click', closeDrawer);

    var y = new Date().getFullYear();
    document.querySelectorAll('.yr').forEach(function (n) { n.textContent = y; });

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rv = document.querySelectorAll('.rv');
    if (reduce || !('IntersectionObserver' in window)) {
      rv.forEach(function (n) { n.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (x) {
          if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      rv.forEach(function (n) { io.observe(n); });
    }
  }

  var pre = draft();
  if (pre) { boot(pre); return; }

  Promise.all(FILES.map(function (f) {
    return fetch('data/' + f + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(f + '.json — ' + r.status);
      return r.json();
    });
  })).then(function (all) {
    var data = {};
    FILES.forEach(function (f, i) { data[f] = all[i]; });
    boot(data);
  }).catch(function (err) {
    document.getElementById('main').innerHTML =
      '<div class="wrap" style="padding:80px 24px"><h1 style="font-size:1.4rem">Content failed to load</h1>' +
      '<p class="muted">' + esc(err.message) + '</p></div>';
    console.error(err);
  });
})();
