import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
await mkdir('downloads', { recursive: true });
try {
  for (const lang of ['en', 'ar']) for (const ats of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
    await page.goto(`${base}/cv.html?lang=${lang}${ats ? '&format=ats' : ''}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__TAILORED_READY__ || window.__TAILORED_ERROR__);
    const error = await page.evaluate(() => window.__TAILORED_ERROR__);
    if (error) throw new Error(error);
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });
    // Fit only the content block, then verify it instead of dropping extra pages.
    const fit = await page.evaluate(() => {
      const page = document.querySelector('.page');
      const content = page.querySelector('.ats-content') || page.querySelector('.grid');
      const bottom = page.getBoundingClientRect().top + (297 - 12) * 96 / 25.4;
      const actualBottom = () => Math.max(...Array.from(content.querySelectorAll('.section')).map(el => el.getBoundingClientRect().bottom));
      let scale = 1;
      while (actualBottom() > bottom + 0.5 && scale > 0.80) {
        scale = Math.round((scale - 0.01) * 100) / 100;
        content.style.zoom = String(scale);
      }
      return { scale, contentBottom: actualBottom(), limit: bottom, overflow: actualBottom() > bottom + 0.5, jobs: page.querySelectorAll('.job').length };
    });
    if (fit.overflow || fit.jobs !== 6) throw new Error(`Invalid CV layout ${lang}/${ats}: ${JSON.stringify(fit)}`);
    const lastSection = await page.evaluate(() => Array.from(document.querySelectorAll('.page .section')).at(-1).innerText);
    if (!lastSection) throw new Error('Missing final section');
    const stem = `Ahmad-Alshehri-CV-${ats ? 'ATS-' : ''}${lang}`;
    await page.pdf({path:`downloads/${stem}.pdf`,format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false,tagged:true,outline:true,margin:{top:'0',right:'0',bottom:'0',left:'0'}});
    console.log(stem, JSON.stringify(fit));
    await page.close();
  }
} finally { await browser.close(); }
