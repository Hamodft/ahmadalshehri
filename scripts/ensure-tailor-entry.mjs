import { readFile, writeFile } from 'node:fs/promises';

const path = 'index.html';
let html = await readFile(path, 'utf8');

const css = `
.cv-tailor-cta{position:relative;overflow:hidden;background:#f7f4ee;padding:54px 0;border-top:1px solid #e4ddd1}.cv-tailor-cta:after{content:"";position:absolute;width:300px;height:300px;border:1px solid rgba(213,170,90,.18);border-radius:50%;right:-120px;top:-130px}.cv-tailor-box{position:relative;z-index:1;display:grid;grid-template-columns:1fr auto;gap:28px;align-items:center;padding:30px 34px;border:1px solid #d9c9aa;border-radius:18px;background:linear-gradient(135deg,#fff,#faf5eb);box-shadow:0 18px 45px rgba(12,27,42,.06)}.cv-tailor-box h2{margin:0 0 8px;font:700 clamp(1.4rem,2.6vw,2rem) var(--display);letter-spacing:-.02em}.cv-tailor-box p{margin:0;color:#68717a;max-width:70ch}.cv-tailor-box .eyebrow{color:#a97924;margin-bottom:8px}.cv-tailor-box .btn{white-space:nowrap}.cv-tailor-note{display:block;margin-top:8px;color:#8b8f94;font-size:.72rem}
@media(max-width:700px){.cv-tailor-cta{padding:38px 0}.cv-tailor-box{grid-template-columns:1fr;padding:24px}.cv-tailor-box .btn{width:100%}}
`;

const section = `<section class="cv-tailor-cta" id="customize-cv"><div class="wrap"><div class="cv-tailor-box"><div><p class="eyebrow"><span class="en">Job-specific CV</span><span class="ar">سيرة مخصصة للوظيفة</span></p><h2><span class="en">Need a CV tailored to a specific role?</span><span class="ar">تحتاج سيرة مخصصة لوظيفة معينة؟</span></h2><p><span class="en">Paste the job requirements and generate a one-page ATS CV that prioritizes the most relevant verified experience, skills and professional development — without changing the master design.</span><span class="ar">ألصق متطلبات الوظيفة وأنشئ سيرة ATS من صفحة واحدة تعطي الأولوية للخبرات والمهارات والتطوير المهني الأكثر صلة — بدون تغيير التصميم الأساسي.</span></p><span class="cv-tailor-note"><span class="en">The job description is analyzed locally and is not stored.</span><span class="ar">يتم تحليل الوصف الوظيفي داخل المتصفح ولا يتم حفظه.</span></span></div><a class="btn btn-gold" href="tailor-cv/"><span class="en">Customize CV →</span><span class="ar">تخصيص السيرة ←</span></a></div></div></section>`;

if (!html.includes('.cv-tailor-cta{')) {
  const marker = '@media(prefers-reduced-motion:reduce)';
  if (!html.includes(marker)) throw new Error('Could not find portfolio style insertion point.');
  html = html.replace(marker, css + marker);
}

if (!html.includes('id="customize-cv"')) {
  const marker = '</main>';
  if (!html.includes(marker)) throw new Error('Could not find portfolio CTA insertion point.');
  html = html.replace(marker, section + '\n' + marker);
}

await writeFile(path, html, 'utf8');
console.log('Tailored CV entry point ensured in index.html');
