/* ==========================================================================
   Field schemas. Everything the admin can edit is described here, so adding a
   new field is a one-line change rather than new UI code.

   Field types: text | bitext | biarea | bilist | area | num | date | url |
                bool | select | tags | docs
   ========================================================================== */
window.SCHEMA = {

  /* -------- singletons (edited as one record, not a list) -------- */
  profile: {
    label: { en: 'Personal profile', ar: 'الملف الشخصي' },
    single: true,
    fields: [
      { k: 'name', t: 'bitext', label: 'Display name' },
      { k: 'fullName', t: 'bitext', label: 'Full legal name' },
      { k: 'eyebrow', t: 'bitext', label: 'Location line (above name)' },
      { k: 'headline', t: 'bitext', label: 'Professional headline' },
      { k: 'lede', t: 'biarea', label: 'Positioning statement' },
      { k: 'summaryTitle', t: 'bitext', label: 'Summary section heading' },
      { k: 'summary', t: 'bilist', label: 'Professional summary (one paragraph per line)' },
      { k: 'photo', t: 'url', label: 'Photo URL or path', help: 'Leave empty to show the monogram. Square image, 600px or larger.' },
      { k: 'monogram', t: 'text', label: 'Monogram initials' },
      { k: 'cvUrl', t: 'url', label: 'CV download link' },
      { k: 'contact.email', t: 'text', label: 'Email' },
      { k: 'contact.phone', t: 'text', label: 'Phone' },
      { k: 'contact.location', t: 'bitext', label: 'Location' },
      { k: 'contact.linkedin', t: 'url', label: 'LinkedIn URL', help: 'Leave empty to hide the LinkedIn row.' }
    ],
    repeat: { k: 'atAGlance', label: { en: 'At a glance card', ar: 'بطاقة نظرة سريعة' }, fields: [
      { k: 'label', t: 'bitext', label: 'Label' },
      { k: 'value', t: 'bitext', label: 'Value' },
      { k: 'note', t: 'bitext', label: 'Note' }
    ] }
  },

  settings: {
    label: { en: 'Career status & site', ar: 'حالة المسار والموقع' },
    single: true,
    fields: [
      { k: 'career.openToOpportunities', t: 'bool', label: 'Open to opportunities', help: 'Shows a live status badge in the contact section.' },
      { k: 'career.targetRoles', t: 'tags', label: 'Target roles' },
      { k: 'career.preferredLocation', t: 'bitext', label: 'Preferred location' },
      { k: 'career.availability', t: 'bitext', label: 'Availability' },
      { k: 'career.ctaHeadline', t: 'bitext', label: 'Contact headline' },
      { k: 'career.ctaBody', t: 'biarea', label: 'Contact paragraph' },
      { k: 'site.defaultLang', t: 'select', label: 'Default language', opts: [['en', 'English'], ['ar', 'العربية']] },
      { k: 'site.url', t: 'url', label: 'Site URL' },
      { k: 'site.baseTitle', t: 'bitext', label: 'Page title' },
      { k: 'site.description', t: 'biarea', label: 'Meta description' },
      { k: 'notes.accreditation', t: 'biarea', label: 'Certification footnote' },
      { k: 'metrics.autoCalculate', t: 'bool', label: 'Calculate numbers automatically', help: 'Years, roles, certificate count and training hours are derived from your content.' },
      { k: 'metrics.experienceStartYear', t: 'num', label: 'Career start year' },
      { k: 'sections.projects', t: 'bool', label: 'Show Projects section' },
      { k: 'sections.training', t: 'bool', label: 'Show Training section' },
      { k: 'sections.highlights', t: 'bool', label: 'Show Highlights band' },
      { k: 'sections.education', t: 'bool', label: 'Show Education section' }
    ]
  },

  /* -------- collections -------- */
  experience: {
    label: { en: 'Experience', ar: 'الخبرات' },
    titleField: 'title',
    fields: [
      { k: 'company', t: 'text', label: 'Company' },
      { k: 'title', t: 'bitext', label: 'Job title' },
      { k: 'period', t: 'bitext', label: 'Period shown', help: 'e.g. 2024 – Present' },
      { k: 'current', t: 'bool', label: 'Current role' },
      { k: 'location', t: 'bitext', label: 'Location' },
      { k: 'scope', t: 'select', label: 'Scope', opts: [['store', 'Store'], ['regional', 'Regional'], ['national', 'National'], ['international', 'International']] },
      { k: 'responsibilities', t: 'bilist', label: 'Responsibilities (one per line)' },
      { k: 'description', t: 'biarea', label: 'Short description' },
      { k: 'kpis', t: 'tags', label: 'KPIs' },
      { k: 'skills', t: 'ref', ref: 'skills', label: 'Skills used' },
      { k: 'logo', t: 'url', label: 'Company logo URL' }
    ]
  },

  progression: {
    label: { en: 'Career timeline', ar: 'خط التدرّج' },
    titleField: 'title',
    fields: [
      { k: 'year', t: 'bitext', label: 'Year label' },
      { k: 'company', t: 'text', label: 'Company' },
      { k: 'title', t: 'bitext', label: 'Role' },
      { k: 'tier', t: 'select', label: 'Scope tier', opts: [['1', 'Store'], ['2', 'Regional'], ['3', 'National']] }
    ]
  },

  projects: {
    label: { en: 'Projects & case studies', ar: 'المشاريع ودراسات الحالة' },
    titleField: 'title',
    fields: [
      { k: 'title', t: 'bitext', label: 'Project title' },
      { k: 'company', t: 'text', label: 'Company' },
      { k: 'year', t: 'text', label: 'Year' },
      { k: 'role', t: 'bitext', label: 'My role' },
      { k: 'scope', t: 'select', label: 'Scope', opts: [['store', 'Store'], ['regional', 'Regional'], ['national', 'National'], ['international', 'International']] },
      { k: 'challenge', t: 'biarea', label: 'Challenge' },
      { k: 'objective', t: 'biarea', label: 'Objective' },
      { k: 'actions', t: 'bilist', label: 'Actions taken (one per line)' },
      { k: 'result', t: 'biarea', label: 'Result' },
      { k: 'kpis', t: 'tags', label: 'Measurable impact' },
      { k: 'partners', t: 'tags', label: 'Retail partners' },
      { k: 'skills', t: 'ref', ref: 'skills', label: 'Skills demonstrated' },
      { k: 'experience', t: 'ref', ref: 'experience', label: 'Related roles' },
      { k: 'featured', t: 'bool', label: 'Featured project' },
      { k: 'documents', t: 'docs', label: 'Documents & links' }
    ]
  },

  training: {
    label: { en: 'Training portfolio', ar: 'ملف التدريب' },
    titleField: 'title',
    fields: [
      { k: 'title', t: 'bitext', label: 'Training title' },
      { k: 'category', t: 'bitext', label: 'Category' },
      { k: 'company', t: 'text', label: 'Company' },
      { k: 'program', t: 'bitext', label: 'Product / programme' },
      { k: 'audience', t: 'bitext', label: 'Audience' },
      { k: 'participants', t: 'num', label: 'Number of participants' },
      { k: 'location', t: 'text', label: 'Location' },
      { k: 'date', t: 'text', label: 'Date' },
      { k: 'duration', t: 'text', label: 'Duration' },
      { k: 'objective', t: 'biarea', label: 'Objective' },
      { k: 'topics', t: 'bilist', label: 'Topics (one per line)' },
      { k: 'method', t: 'bitext', label: 'Training method' },
      { k: 'assessment', t: 'bitext', label: 'Assessment method' },
      { k: 'result', t: 'biarea', label: 'Result' },
      { k: 'featured', t: 'bool', label: 'Featured' },
      { k: 'documents', t: 'docs', label: 'Materials & photos' }
    ]
  },

  achievements: {
    label: { en: 'Key achievements', ar: 'الإنجازات' },
    titleField: 'title',
    fields: [
      { k: 'value', t: 'text', label: 'Number / metric' },
      { k: 'unit', t: 'bitext', label: 'Unit shown after the number' },
      { k: 'auto', t: 'select', label: 'Calculate automatically from', opts: [['manual', 'Do not calculate — use the number above'], ['years', 'Years of experience'], ['roles', 'Number of roles'], ['companies', 'Number of companies'], ['certifications', 'Number of certificates'], ['trainingHours', 'Total training hours'], ['projects', 'Number of projects'], ['trainingPrograms', 'Number of training programmes']] },
      { k: 'title', t: 'biarea', label: 'Caption' },
      { k: 'description', t: 'biarea', label: 'Full description' },
      { k: 'year', t: 'text', label: 'Year' },
      { k: 'company', t: 'text', label: 'Company' },
      { k: 'category', t: 'text', label: 'Category' },
      { k: 'evidence', t: 'url', label: 'Evidence link' },
      { k: 'featured', t: 'bool', label: 'Show on homepage' }
    ]
  },

  skills: {
    label: { en: 'Skills & competencies', ar: 'المهارات والكفاءات' },
    titleField: 'name',
    fields: [
      { k: 'name', t: 'bitext', label: 'Skill name' },
      { k: 'category', t: 'bitext', label: 'Category heading' },
      { k: 'categoryNote', t: 'bitext', label: 'Category subtitle' },
      { k: 'categoryKey', t: 'text', label: 'Category group key', help: 'Skills sharing a key appear in the same card. Keep it identical across the group.' },
      { k: 'level', t: 'text', label: 'Level / years' },
      { k: 'companies', t: 'tags', label: 'Companies where used' },
      { k: 'evidence', t: 'biarea', label: 'Evidence / example' }
    ]
  },

  certifications: {
    label: { en: 'Certifications', ar: 'الشهادات' },
    titleField: 'name',
    fields: [
      { k: 'name', t: 'bitext', label: 'Certificate name' },
      { k: 'provider', t: 'bitext', label: 'Provider' },
      { k: 'dateLabel', t: 'bitext', label: 'Date shown' },
      { k: 'date', t: 'text', label: 'Date (YYYY-MM)', help: 'Used for sorting and structured data.' },
      { k: 'hours', t: 'num', label: 'Training hours', help: 'Counts toward the total hours figure on the homepage.' },
      { k: 'category', t: 'bitext', label: 'Category heading' },
      { k: 'categoryKey', t: 'text', label: 'Category group key' },
      { k: 'credentialUrl', t: 'url', label: 'Certificate link' },
      { k: 'credentialId', t: 'text', label: 'Credential ID' },
      { k: 'skills', t: 'ref', ref: 'skills', label: 'Related skills' }
    ]
  },

  education: {
    label: { en: 'Education', ar: 'التعليم' },
    titleField: 'program',
    fields: [
      { k: 'program', t: 'bitext', label: 'Programme / degree' },
      { k: 'institution', t: 'bitext', label: 'Institution' },
      { k: 'location', t: 'bitext', label: 'Location' },
      { k: 'status', t: 'bitext', label: 'Status badge' },
      { k: 'start', t: 'text', label: 'Start year' },
      { k: 'end', t: 'text', label: 'End year' },
      { k: 'documents', t: 'docs', label: 'Documents' }
    ]
  },

  languages: {
    label: { en: 'Languages', ar: 'اللغات' },
    titleField: 'name',
    fields: [
      { k: 'name', t: 'bitext', label: 'Language' },
      { k: 'level', t: 'bitext', label: 'Proficiency' }
    ]
  },

  documents: {
    label: { en: 'Document library', ar: 'مكتبة المستندات' },
    titleField: 'title',
    fields: [
      { k: 'title', t: 'bitext', label: 'Document title' },
      { k: 'type', t: 'select', label: 'Type', opts: [['pdf', 'PDF'], ['image', 'Image'], ['slides', 'Presentation'], ['drive', 'Google Drive'], ['link', 'External link']] },
      { k: 'url', t: 'url', label: 'URL' },
      { k: 'note', t: 'bitext', label: 'Note' }
    ]
  }
};

window.COLLECTION_ORDER = ['profile', 'settings', 'experience', 'progression', 'achievements',
  'projects', 'training', 'skills', 'certifications', 'education', 'languages', 'documents'];
