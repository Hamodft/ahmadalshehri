import fs from 'node:fs/promises';

const OUT = new URL('../cv-studio/jobs.json', import.meta.url);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36';
const roles = [
  'Area Sales Manager',
  'Regional Sales Manager',
  'Retail Operations Manager',
  'Training Manager',
  'Retail Manager',
  'Sales Operations Manager'
];
const naukriLists = [
  'https://www.naukrigulf.com/sales-manager-jobs-in-riyadh',
  'https://www.naukrigulf.com/retail-manager-jobs-in-saudi-arabia',
  'https://www.naukrigulf.com/training-manager-jobs-in-riyadh'
];

const sleep = ms => new Promise(r => setTimeout(r, ms));
function decode(s='') {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function canonical(raw='') {
  try {
    const u = new URL(raw.replace(/&amp;/g,'&'));
    u.hash = ''; u.search = '';
    return u.toString().replace(/\/$/, '');
  } catch { return raw; }
}
function relevant(text='') {
  const t = text.toLowerCase();
  const role = /(sales|retail|training|field force|operations|learning|development|commercial|store manager|مبيعات|تدريب|عمليات|تجزئة)/i.test(t);
  const place = /(saudi|riyadh|jeddah|dammam|khobar|ksa|السعود|الرياض|جدة|الدمام|الخبر)/i.test(t);
  return role && place;
}
function isoDate(raw) {
  const d = Date.parse(raw || '');
  return Number.isFinite(d) ? new Date(d).toISOString() : new Date().toISOString();
}
function labelDate(raw) {
  const d = Date.parse(raw || '');
  return Number.isFinite(d) ? new Date(d).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : 'Recently posted';
}
async function get(url, accept='text/html,*/*') {
  const r = await fetch(url, {headers:{'user-agent':UA,'accept':accept,'accept-language':'en-US,en;q=0.9'}});
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function blocks(html, needle) {
  const out=[];
  for (const m of html.matchAll(/<li\b[\s\S]*?<\/li>/gi)) if (m[0].includes(needle)) out.push(m[0]);
  return out;
}
function clsText(block, classPart) {
  const re = new RegExp(`<[^>]+class=["'][^"']*${classPart}[^"']*["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i');
  const m = block.match(re); return m ? decode(m[1]) : '';
}

async function collectLinkedIn() {
  const found=[];
  for (const role of roles) {
    const url='https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords='+encodeURIComponent(role)+'&location='+encodeURIComponent('Saudi Arabia')+'&start=0';
    try {
      const html=await get(url);
      for (const b of blocks(html,'/jobs/view/')) {
        const hm=b.match(/href=["'](https?:\/\/[^"']*linkedin\.com\/jobs\/view\/[^"'?&]+[^"']*)["']/i);
        if(!hm) continue;
        const jobUrl=canonical(hm[1]);
        const title=clsText(b,'base-search-card__title');
        const company=clsText(b,'base-search-card__subtitle');
        const location=clsText(b,'job-search-card__location') || 'Saudi Arabia';
        const tm=b.match(/<time[^>]*datetime=["']([^"']+)["']/i);
        const date=isoDate(tm?.[1]);
        if(!title || !relevant(`${title} ${company} ${location}`)) continue;
        found.push({
          id:`linkedin:${jobUrl.match(/-(\d+)$/)?.[1]||jobUrl}`,
          source:'linkedin', title, company, location,
          description:`${title} opportunity at ${company || 'an employer'} in ${location}. Open the original LinkedIn posting for the full responsibilities and requirements.`,
          url:jobUrl, date, dateLabel:labelDate(date)
        });
      }
    } catch(e) { console.warn(`LinkedIn ${role}: ${e.message}`); }
    await sleep(450);
  }
  return found;
}

function findJobPosting(value) {
  if (!value) return null;
  if (Array.isArray(value)) { for (const x of value){ const r=findJobPosting(x); if(r)return r; } return null; }
  if (typeof value === 'object') {
    const type=value['@type'];
    if(type==='JobPosting' || (Array.isArray(type)&&type.includes('JobPosting'))) return value;
    for(const x of Object.values(value)){ const r=findJobPosting(x); if(r)return r; }
  }
  return null;
}
function jobJsonLd(html) {
  for(const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { const r=findJobPosting(JSON.parse(m[1].trim())); if(r)return r; } catch {}
  }
  return null;
}
function locationFromJob(j) {
  const loc=Array.isArray(j?.jobLocation)?j.jobLocation[0]:j?.jobLocation;
  const a=loc?.address||{};
  return [a.addressLocality,a.addressRegion,a.addressCountry?.name||a.addressCountry].filter(Boolean).join(', ') || 'Saudi Arabia';
}
function naukriLinks(html,listUrl) {
  const links=new Set();
  const normalized=html.replace(/\\u002F/gi,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&');
  for(const m of normalized.matchAll(/https?:\/\/(?:www\.|mobile\.)?naukrigulf\.com\/[^"'<>\s\\]+jid-[^"'<>\s\\]*/gi)) links.add(canonical(m[0]));
  for(const m of normalized.matchAll(/(?:href=["'])?(\/[^"'<>\s\\]+jobs-in-[^"'<>\s\\]+jid-[^"'<>\s\\]*)/gi)) {
    try { links.add(canonical(new URL(m[1],listUrl).toString())); } catch {}
  }
  return links;
}
async function collectNaukrigulf() {
  const links=new Set();
  for(const listUrl of naukriLists) {
    try {
      const html=await get(listUrl);
      for(const x of naukriLinks(html,listUrl)) links.add(x);
    } catch(e){ console.warn(`Naukrigulf list: ${e.message}`); }
    await sleep(450);
  }
  console.log(`Naukrigulf candidate links: ${links.size}`);
  const found=[];
  for(const url of [...links].slice(0,30)) {
    try {
      const html=await get(url);
      const j=jobJsonLd(html);
      let title=decode(j?.title||'');
      let company=decode(j?.hiringOrganization?.name||'');
      let location=locationFromJob(j);
      let description=decode(j?.description||'').slice(0,700);
      let date=isoDate(j?.datePosted);
      if(!title) title=decode(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');
      if(!company) company=decode(html.match(/(?:company|employer)[^>]*>[\s\S]{0,300}?<[^>]+>([\s\S]*?)<\//i)?.[1]||'');
      if(!description) description=`${title} opportunity in ${location}. Open the original Naukrigulf posting for full details.`;
      if(!title || !relevant(`${title} ${company} ${location} ${description}`)) continue;
      found.push({id:`naukrigulf:${url}`,source:'naukrigulf',title,company,location,description,url,date,dateLabel:labelDate(date)});
    } catch(e){ console.warn(`Naukrigulf detail: ${e.message}`); }
    await sleep(260);
  }
  return found;
}

async function collect() {
  const [linkedin,naukrigulf]=await Promise.all([collectLinkedIn(),collectNaukrigulf()]);
  console.log(`Direct sources: LinkedIn ${linkedin.length}, Naukrigulf ${naukrigulf.length}`);
  return [...linkedin,...naukrigulf];
}

let previous={updatedAt:null,jobs:[]};
try { previous=JSON.parse(await fs.readFile(OUT,'utf8')); } catch {}
const fresh=await collect();
const map=new Map();
for(const j of [...fresh,...(previous.jobs||[])]) {
  if(!j?.url||!j?.title) continue;
  const key=canonical(j.url);
  if(!map.has(key)) map.set(key,j);
}
const cutoff=Date.now()-45*86400000;
const jobs=[...map.values()]
  .filter(j=>{const t=Date.parse(j.date||''); return !Number.isFinite(t)||t>=cutoff;})
  .sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0))
  .slice(0,140);
await fs.writeFile(OUT,JSON.stringify({updatedAt:new Date().toISOString(),jobs},null,2)+'\n','utf8');
console.log(`Job Radar: ${fresh.length} fresh results, ${jobs.length} total.`);
