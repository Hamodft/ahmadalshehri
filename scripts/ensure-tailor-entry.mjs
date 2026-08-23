import { readFile, writeFile } from 'node:fs/promises';

const path = 'index.html';
let html = await readFile(path, 'utf8');
const original = html;

html = html
  .replace(/<section class="cv-tailor-cta" id="customize-cv">[\s\S]*?<\/section>\n?/g, '')
  .replace(/\n?\.cv-tailor-cta\{[^\n]*\n@media\(max-width:700px\)\{\.cv-tailor-cta[^\n]*\n?/g, '\n');

if (!html.includes('href="cv-studio/"')) {
  const adminLink = '<a class="to-top" href="admin/">';
  if (!html.includes(adminLink)) throw new Error('Could not find the footer insertion point.');
  html = html.replace(
    adminLink,
    '<a class="to-top" href="cv-studio/" rel="nofollow" style="font-size:.72rem;opacity:.62">CV Studio</a>' + adminLink
  );
}

if (html !== original) {
  await writeFile(path, html, 'utf8');
  console.log('Discreet CV Studio footer link ensured.');
} else {
  console.log('CV Studio entry already correct.');
}
