// Run against a local checkout only; no production writes or authenticated sessions.
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const base = process.env.QA_BASE || 'http://127.0.0.1:4173';
const label = process.env.QA_LABEL || 'after';
const baseline = label === 'before';
const out = process.env.QA_OUT || `qa-artifacts/${label}`;
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [], failures = [];
async function check(name, run) {
  try { await run(); results.push({ name, passed: true }); }
  catch (error) { failures.push({ name, error: error.message }); }
}
async function ready(page) {
  await page.waitForSelector('.role');
  await page.waitForFunction(() => document.querySelector('.role').dataset.v3 === '1');
  await page.evaluate(() => document.fonts.ready);
}
try {
  for (const lang of ['en', 'ar']) for (const width of [1440, 1280, 1024, 768, 430, 390, 375, 320]) {
    const name = `${lang}-${width}`;
    await check(name, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [], badResponses = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) badResponses.push({ url: r.url(), status: r.status() }); });
      await page.addInitScript(l => !localStorage.getItem('aa_lang') && localStorage.setItem('aa_lang', l), lang);
      await page.goto(base, { waitUntil: 'networkidle' });
      await ready(page);
      await page.screenshot({ path: `${out}/${name}-hero.png`, animations: 'disabled' });
      // Trigger the existing reveal observer naturally before full-page capture.
      for (const section of await page.locator('main > section').all()) if (await section.isVisible()) await section.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.rv')).every(e => getComputedStyle(e).display === 'none' || e.classList.contains('in')));
      await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
      await page.waitForFunction(() => scrollY === 0);
      await page.screenshot({ path: `${out}/${name}-full.png`, fullPage: true, animations: 'disabled' });
      const geometry = await page.evaluate(() => ({ viewport: innerWidth, scrollWidth: document.documentElement.scrollWidth, dir: document.documentElement.dir }));
      const data = { name, geometry, errors, badResponses };
      if (!baseline) {
        assert(geometry.scrollWidth <= width + 1, `Horizontal overflow: ${JSON.stringify(geometry)}`);
        assert.equal(geometry.dir, lang === 'ar' ? 'rtl' : 'ltr');
        assert.deepEqual(errors, []);
        assert.deepEqual(badResponses, []);
        assert((await page.locator('#cvNav').getAttribute('href')).includes(`lang=${lang}`));
        if (width <= 1000) {
          const toggle = page.locator('#navToggle');
          await toggle.click();
          assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
          assert(await page.locator('#nav').isVisible());
          await page.screenshot({ path: `${out}/${name}-menu.png`, animations: 'disabled' });
          await toggle.press('Escape');
          assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
          assert(await toggle.evaluate(e => document.activeElement === e));
          await toggle.click();
          await page.locator('#nav a[href="#experience"]').click();
          assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
          assert(await page.locator('#experience').evaluate(e => document.activeElement === e));
          await page.locator('body').press('Control+Home');
        }
        const detail = page.locator('.v3-toggle').first();
        await detail.click();
        assert.equal(await detail.getAttribute('aria-expanded'), 'true');
        await detail.click();
        assert.equal(await detail.getAttribute('aria-expanded'), 'false');
        await page.locator('#langBtn').click();
        assert.equal(await page.locator('html').getAttribute('lang'), lang === 'en' ? 'ar' : 'en');
        await page.reload(); await ready(page);
        assert.equal(await page.locator('html').getAttribute('lang'), lang === 'en' ? 'ar' : 'en');
      }
      results.push(data);
      await page.close();
    });
  }
  if (!baseline) {
    await check('admin offline bilingual editing, order, visibility, preview, and backup', async () => {
      const context = await browser.newContext({viewport:{width:390,height:900}});
      const page = await context.newPage();
      // No GitHub writes are possible during this test.
      await context.route('https://api.github.com/**', r => r.abort());
      await page.goto(`${base}/admin/`);
      await page.locator('#offline').click();
      await page.locator('[data-path="name.en"]').fill('QA English');
      await page.locator('[data-path="name.ar"]').fill('اختبار عربي');
      await page.locator('[data-go="experience"]').click();
      const firstTitle = await page.locator('.row .txt b').first().innerText();
      await page.locator('.row').first().dragTo(page.locator('.row').nth(1));
      assert.notEqual(await page.locator('.row .txt b').first().innerText(), firstTitle);
      await page.locator('[data-vis="0"]').click();
      assert(await page.locator('.row').first().evaluate(e=>e.classList.contains('hidden-row')));
      await page.locator('[data-go="settings"]').click();
      await page.locator('[data-path="sections.education"]').uncheck();
      assert(await page.locator('#btnPublish').isDisabled());
      const popupPromise = context.waitForEvent('page');
      await page.locator('#btnPreview').click();
      const preview = await popupPromise;
      await ready(preview);
      assert((await preview.locator('h1').innerText()).includes('QA English'));
      assert(await preview.locator('#education').evaluate(e=>getComputedStyle(e).display==='none'));
      assert.equal(await preview.locator('.role').count(),5);
      await preview.locator('#langBtn').click();
      assert((await preview.locator('h1').innerText()).includes('اختبار عربي'));
      const downloadPromise=page.waitForEvent('download');
      await page.locator('#btnExport').click();
      const download=await downloadPromise;
      const backup=JSON.parse(await (await import('node:fs/promises')).readFile(await download.path(),'utf8'));
      assert.equal(backup.data.profile.name.en,'QA English');
      assert.equal(backup.data.profile.name.ar,'اختبار عربي');
      assert.equal(backup.data.settings.sections.education,false);
      assert.equal(backup.data.experience.items.length,6);
      assert.equal(backup.data.experience.items[0].visible,false);
      assert.equal(backup.data.experience.items[0].order,0);
      await context.close();
    });
    await check('configured monogram still works when no portrait is selected', async () => {
      const page = await browser.newPage();
      await page.route('**/data/profile.json*', async route => {
        const response = await route.fetch();
        const profile = await response.json();
        profile.photo = '';
        profile.monogram = 'QA';
        await route.fulfill({json:profile});
      });
      await page.goto(base); await ready(page);
      assert.equal(await page.locator('#monogram').innerText(),'QA');
      await page.close();
    });
    await check('optional data failure preserves profile and navigation', async () => {
      const page = await browser.newPage();
      await page.route('**/data/certifications.json*', r => r.fulfill({status:503, body:'Unavailable'}));
      await page.goto(base); await ready(page);
      assert(await page.locator('.load-notice').isVisible());
      assert.equal(await page.locator('#nav a[href="#certifications"]').count(), 0);
      assert(await page.locator('#certifications').evaluate(e => getComputedStyle(e).display === 'none'));
      await page.close();
    });
    await check('required data failure has friendly error without technical leak', async () => {
      const page = await browser.newPage();
      await page.route('**/data/profile.json*', r => r.fulfill({status:503, body:'Unavailable'}));
      await page.goto(base);
      await page.locator('[role="alert"]').waitFor();
      const text = await page.locator('main').innerText();
      assert(!text.includes('503') && !text.includes('.json'));
      await page.close();
    });
    await check('drawer keyboard, focus restoration, and background isolation', async () => {
      const page = await browser.newPage();
      // Exercise the dormant drawer with local-only preview data, preserving source JSON.
      const training = {items:[{id:'qa-training', title:{en:'QA session',ar:'جلسة اختبار'}, audience:{en:'QA audience',ar:'فئة الاختبار'},visible:true}]};
      await page.route('**/data/training.json*', r => r.fulfill({json:training}));
      await page.goto(base); await ready(page);
      const trigger = page.locator('[data-training]');
      await trigger.press('Space');
      assert.equal(await page.locator('#drawer').getAttribute('aria-hidden'), 'false');
      assert(await page.locator('#main').evaluate(e => e.inert));
      await page.locator('#drawerClose').press('Tab');
      assert(await page.locator('#drawerClose').evaluate(e => document.activeElement === e));
      await page.locator('#drawerClose').press('Escape');
      assert(await trigger.evaluate(e => document.activeElement === e));
      assert.equal(await page.locator('#drawer').getAttribute('aria-hidden'), 'true');
      await page.close();
    });
    for (const path of ['cv.html?lang=en','cv.html?lang=ar','cv.html?lang=en&format=ats','cv.html?lang=ar&format=ats','cv-studio/','cv-studio/jobs.html','tailor-cv/','admin/']) {
      await check(`page smoke ${path}`, async () => {
        const page = await browser.newPage({viewport:{width:390,height:900}});
        const errors=[]; page.on('pageerror',e=>errors.push(e.message));
        await page.goto(`${base}/${path}`,{waitUntil:'networkidle'});
        if(path.startsWith('cv.html')) {
          await page.waitForFunction(()=>window.__TAILORED_READY__);
          assert.equal(await page.evaluate(()=>window.__TAILORED_ERROR__),undefined);
          assert.equal(await page.locator('.job').count(),6);
          assert.equal(await page.locator('.more-info').count(), path.includes('format=ats') ? 0 : 1);
          const download = await page.locator('#download').getAttribute('href');
          assert.equal((await page.request.get(`${base}/${download}`)).status(),200);
        }
        await page.screenshot({path:`${out}/page-${path.replace(/[^a-z0-9]/gi,'-')}.png`,fullPage:true});
        assert.deepEqual(errors,[]);
        await page.close();
      });
    }
    await check('CV Studio bilingual PDF export and stale-download reset', async()=>{
      const page=await browser.newPage({viewport:{width:1280,height:900}});
      await page.goto(`${base}/cv-studio/`);
      await page.locator('#analyzeBtn').waitFor({state:'visible'});
      await page.waitForFunction(()=>!document.getElementById('analyzeBtn').disabled);
      await page.locator('#jobTitle').fill('Area Sales Manager');
      await page.locator('#jd').fill('Lead regional retail sales teams, allocate sales targets, track KPIs and field team productivity, manage store execution and coach team members.');
      for(const lang of ['ar','en']){
        await page.locator('#outLang').selectOption(lang);
        assert(await page.locator('#downloadLink').isHidden());
        await page.locator('#analyzeBtn').click();
        const pending=page.waitForEvent('download');
        await page.locator('#generateBtn').click();
        const pdf=await pending;
        await pdf.saveAs(`${out}/tailored-${lang}.pdf`);
        await page.waitForFunction(()=>!document.getElementById('generateBtn').disabled);
        assert(await page.locator('#downloadLink').isVisible());
      }
      await page.locator('#analyzeBtn').click();
      assert(await page.locator('#downloadLink').isHidden());
      await page.locator('#jobTitle').fill('Regional Sales Manager');
      assert(await page.locator('#results').isHidden());
      await page.close();
    });
    await check('accessibility audit both languages', async()=>{
      const page=await browser.newPage({viewport:{width:390,height:900}});
      for(const lang of ['en','ar']){
        await page.goto(base);await ready(page);
        if(await page.locator('html').getAttribute('lang')!==lang)await page.locator('#langBtn').click();
        await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
        const audit=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
        await writeFile(`${out}/axe-${lang}.json`,JSON.stringify(audit,null,2));
        results.push({name:`axe-${lang}`,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length}))});
        assert.equal(audit.violations.filter(v=>['critical','serious'].includes(v.impact)).length,0,'Serious accessibility violations remain');
      }
      await page.close();
    });
  }
} finally {
  await browser.close();
  await writeFile(`${out}/results.json`,JSON.stringify({base,label,results,failures},null,2));
}
if (failures.length) { console.error(JSON.stringify(failures,null,2)); process.exitCode=1; }
else console.log(`${label}: checks completed (${results.length} records)`);
