import fs from 'node:fs/promises';

const path = new URL('../cv-studio/jobs.html', import.meta.url);
let s = await fs.readFile(path, 'utf8');

const start = s.indexOf('function score(j){');
const end = s.indexOf('\nfunction dateValue', start);
if (start < 0 || end < 0) throw new Error('score function not found');

const score = `function score(j){
  var title=clean(j.title),description=clean(j.description||''),company=clean(j.company||'');
  var n=42,reasons=[];

  // Primary signal: job-description responsibilities and requirements.
  var descriptionSignals=[
    ['field force',8],['retail operations',8],['sales operations',8],['training',7],['learning and development',7],['learning development',7],
    ['sales',6],['retail',6],['operations',5],['commercial',5],['business development',5],['channel',5],['dealer',5],['promoter',5],['territory',5],
    ['kpi',5],['target',4],['team',4],['leadership',4],['coach',4],['performance',4],['stakeholder',3],['customer',3],
    ['launch',3],['onboarding',4],['capability',4],['multi store',4],['multi-store',4],['regional',3],['area',3]
  ];
  descriptionSignals.forEach(function(x){
    if(description.indexOf(x[0])>-1){
      n+=x[1];
      if(reasons.indexOf(x[0])<0&&reasons.length<4)reasons.push(x[0]);
    }
  });

  // Secondary signal: job-title alignment. It supports, but does not dominate, the score.
  var titleSignals=[
    [/field force manager|field operations manager/,10,'field force'],
    [/training manager|retail training manager|sales training manager/,10,'training'],
    [/retail operations manager/,10,'retail operations'],
    [/sales operations manager/,10,'sales operations'],
    [/area sales manager/,10,'area sales'],
    [/regional sales manager/,9,'regional sales'],
    [/retail excellence manager/,9,'retail excellence'],
    [/learning.*development manager|talent development manager|learning design.*manager/,8,'learning & development'],
    [/retail manager/,8,'retail'],
    [/commercial manager/,7,'commercial'],
    [/sales manager/,7,'sales'],
    [/store manager/,5,'store management']
  ];
  for(var i=0;i<titleSignals.length;i++){
    if(titleSignals[i][0].test(title)){
      n+=titleSignals[i][1];
      if(reasons.indexOf(titleSignals[i][2])<0&&reasons.length<4)reasons.push(titleSignals[i][2]);
      break;
    }
  }

  if(/manager|lead|head|supervisor|مدير|رئيس|مشرف/.test(title))n+=2;
  if(/saudi|riyadh|jeddah|dammam|khobar|ksa|السعود/.test(description+' '+company))n+=1;
  if(/finance|accounting|engineering|quality assurance|legal|procurement/.test(title) && !/sales|retail|training|operations|field force/.test(description))n-=20;

  return{value:Math.max(40,Math.min(98,n)),reasons:Array.from(new Set(reasons)).slice(0,4)}
}`;

s = s.slice(0, start) + score + s.slice(end);
await fs.writeFile(path, s, 'utf8');
console.log('Updated Job Radar scoring: description first, title second.');
