import { chromium } from 'playwright';
import { mkdir, readFile, readdir, stat, unlink } from 'node:fs/promises';

const request = JSON.parse(await readFile('tailor/request.json', 'utf8'));
if (!request?.active || !request?.requestId || !request?.outputPath) {
  console.log('No active tailored CV request.');
  process.exit(0);
}

const lang = request.lang === 'ar' ? 'ar' : 'en';
const safeRequest = encodeURIComponent(request.requestId);
const outputPath = request.outputPath;
if (!/^downloads\/tailored\/Ahmad-Alshehri-CV-[A-Za-z0-9-]+-(en|ar)-[A-Za-z0-9-]+\.pdf$/.test(outputPath)) {
  throw new Error(`Unsafe output path: ${outputPath}`);
}

await mkdir('downloads/tailored', { recursive: true });
const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  await page.goto(`${base}/tailored-cv-render.html?lang=${lang}&request=${safeRequest}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__TAILORED_READY__ === true, null, { timeout: 30000 });
  const renderError = await page.evaluate(() => window.__TAILORED_ERROR__ || '');
  if (renderError) throw new Error(`Tailored CV render failed: ${renderError}`);
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await page.close();
} finally {
  await browser.close();
}

const files = (await readdir('downloads/tailored')).filter((f) => f.endsWith('.pdf'));
const ranked = await Promise.all(files.map(async (name) => ({ name, mtime: (await stat(`downloads/tailored/${name}`)).mtimeMs })));
ranked.sort((a, b) => b.mtime - a.mtime);
for (const old of ranked.slice(12)) await unlink(`downloads/tailored/${old.name}`);

console.log(`Generated ${outputPath}`);
