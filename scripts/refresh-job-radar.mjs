import fs from 'node:fs/promises';

const OUT = new URL('../cv-studio/jobs.json', import.meta.url);
const roles = [
  'Area Sales Manager',
  'Regional Sales Manager',
  'Retail Operations Manager',
  'Sales Operations Manager',
  'Training Manager',
  'Field Force Manager',
  'Retail Excellence Manager',
  'Learning and Development Manager'
];

const sources = [
  { id: 'linkedin', domain: 'linkedin.com/jobs/view' },
  { id: 'naukrigulf', domain: 'naukrigulf.com/jobs' }
];

function decode(s='') {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return m ? decode(m[1]) : '';
}

function canonical(raw='') {
  try {
    const u = new URL(raw);
    u.hash = '';
    u.search = '';
    return u.toString().replace(/\/$/, '');
  } catch { return raw; }
}

function parseTitle(raw, source) {
  let title = raw.replace(/\s*[|–—-]\s*LinkedIn.*$/i, '').replace(/\s*[|–—-]\s*Naukrigulf.*$/i, '').trim();
  let company = '';
  let location = '';
  const parts = title.split(/\s+[–—]\s+|\s+\|\s+/).map(x => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    title = parts[0];
    company = parts[1] || '';
    location = parts.slice(2).join(' · ');
  }
  if (!company && source === 'linkedin') {
    const dash = title.split(/\s+-\s+/);
    if (dash.length > 1) { title = dash.shift(); company = dash.join(' - '); }
  }
  return { title: title.trim(), company: company.trim(), location: location.trim() };
}

function relevant(text='') {
  const t = text.toLowerCase();
  return /(sales|retail|training|field force|operations|learning|development|area manager|regional manager|commercial|مبيعات|تدريب|عمليات|تجزئة)/i.test(t)
    && /(saudi|riyadh|jeddah|dammam|khobar|ksa|السعود|الرياض|جدة|الدمام)/i.test(t);
}

async function bingRss(query) {
  const url = `https://www.bing.com/search?format=rss&count=30&q=${encodeURIComponent(query)}`;
  const r = await fetch(url, {headers:{'user-agent':'Mozilla/5.0 JobRadar/1.0','accept':'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8'}});
  if (!r.ok) throw new Error(`Bing ${r.status}`);
  const xml = await r.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(m => m[1]);
}

async function collect() {
  const found = [];
  for (const source of sources) {
    for (const role of roles) {
      const q = `site:${source.domain} "${role}" ("Saudi Arabia" OR Riyadh OR Jeddah OR Dammam)`;
      try {
        const items = await bingRss(q);
        for (const item of items) {
          const rawTitle = tag(item, 'title');
          const rawLink = tag(item, 'link');
          const description = tag(item, 'description');
          const pubDate = tag(item, 'pubDate');
          if (!rawLink || !rawTitle) continue;
          let host = '';
          try { host = new URL(rawLink).hostname.toLowerCase(); } catch { continue; }
          if (source.id === 'linkedin' && !host.endsWith('linkedin.com')) continue;
          if (source.id === 'naukrigulf' && !host.endsWith('naukrigulf.com')) continue;
          const path = (()=>{try{return new URL(rawLink).pathname}catch{return ''}})();
          if (source.id === 'linkedin' && !/\/jobs\/view\//i.test(path)) continue;
          const joined = `${rawTitle} ${description}`;
          if (!relevant(joined)) continue;
          const p = parseTitle(rawTitle, source.id);
          found.push({
            id: `${source.id}:${canonical(rawLink)}`,
            source: source.id,
            title: p.title || rawTitle,
            company: p.company,
            location: p.location || (/riyadh/i.test(joined)?'Riyadh, Saudi Arabia':/jeddah/i.test(joined)?'Jeddah, Saudi Arabia':/dammam/i.test(joined)?'Dammam, Saudi Arabia':'Saudi Arabia'),
            description: description.slice(0, 900),
            url: canonical(rawLink),
            date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            dateLabel: pubDate ? new Date(pubDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'Recently indexed'
          });
        }
      } catch (e) {
        console.warn(`${source.id} / ${role}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 350));
    }
  }
  return found;
}

let previous = { updatedAt: null, jobs: [] };
try { previous = JSON.parse(await fs.readFile(OUT, 'utf8')); } catch {}
const fresh = await collect();
const map = new Map();
for (const j of [...fresh, ...(previous.jobs || [])]) {
  if (!j?.url || !j?.title) continue;
  const key = canonical(j.url);
  if (!map.has(key)) map.set(key, j);
}
const cutoff = Date.now() - 45 * 86400000;
const jobs = [...map.values()]
  .filter(j => {
    const t = Date.parse(j.date || '');
    return !Number.isFinite(t) || t >= cutoff;
  })
  .sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0))
  .slice(0, 140);

const payload = { updatedAt: new Date().toISOString(), jobs };
await fs.writeFile(OUT, JSON.stringify(payload, null, 2) + '\n', 'utf8');
console.log(`Job Radar: ${fresh.length} fresh results, ${jobs.length} total.`);
