import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
await mkdir('downloads', { recursive: true });

for (const lang of ['en', 'ar']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1600 } });
  await page.goto(`${base}/cv.html?lang=${lang}`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: `downloads/Ahmad-Alshehri-CV-${lang}.pdf`,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: false,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });
  await page.close();
}

await browser.close();
