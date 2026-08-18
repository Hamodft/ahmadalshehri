/* Progressive enhancement layer: brand journey, role logos, counters, active nav, subtle tilt */
(function(){
  'use strict';
  var LOGOS={
    'TECNO Mobile':'assets/logos/tecno.svg','TECNO':'assets/logos/tecno.svg',
    'HONOR':'assets/logos/honor.svg','HUAWEI':'assets/logos/huawei.svg'
  };
  function $all(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));}
  function companyLogo(name){return LOGOS[name]||'';}
  function addProgress(){
    var bar=document.createElement('div');bar.className='scroll-progress';document.body.appendChild(bar);
    function draw(){var h=document.documentElement.scrollHeight-innerHeight;bar.style.width=(h>0?(scrollY/h)*100:0)+'%';}
    addEventListener('scroll',draw,{passive:true});draw();
  }
  function addBrandJourney(){
    if(document.querySelector('.brand-journey'))return;
    var highlights=document.getElementById('highlights');if(!highlights)return;
    var sec=document.createElement('section');sec.className='brand-journey';
    sec.innerHTML='<div class="wrap brand-journey-in"><div class="brand-journey-label"><strong><span class="en">Career across leading technology brands</span><span class="ar">مسيرة عبر علامات تقنية رائدة</span></strong><span class="en">From frontline retail to national capability leadership</span><span class="ar">من البيع المباشر إلى قيادة القدرات على المستوى الوطني</span></div><div class="brand-list">'+
      [['HUAWEI','assets/logos/huawei.svg'],['HONOR','assets/logos/honor.svg'],['TECNO','assets/logos/tecno.svg']].map(function(x){return '<button type="button" class="brand-card" data-brand="'+x[0]+'" aria-label="'+x[0]+'"><img src="'+x[1]+'" alt="'+x[0]+' logo"></button>';}).join('')+
      '</div></div>';
    highlights.parentNode.insertBefore(sec,highlights);
    $all('.brand-card',sec).forEach(function(b){b.addEventListener('click',function(){var brand=b.getAttribute('data-brand'), roles=$all('.role');var target=roles.find(function(r){return (r.textContent||'').toUpperCase().indexOf(brand.toUpperCase())>-1;});if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.animate([{backgroundColor:'rgba(159,117,38,.15)'},{backgroundColor:'transparent'}],{duration:1100});}});});
  }
  function decorateRoles(){
    $all('.role').forEach(function(role){if(role.dataset.enhanced)return;role.dataset.enhanced='1';
      var when=role.querySelector('.role-when'), co=role.querySelector('.role-co'), title=role.querySelector('.role-title');
      var txt=(co?co.textContent:'').trim();var company=['TECNO Mobile','HONOR','HUAWEI'].find(function(n){return txt.indexOf(n)>-1;});
      if(company&&title){var logo=companyLogo(company);var holder=document.createElement('div');holder.className='role-brand';holder.innerHTML='<span class="role-logo"><img src="'+logo+'" alt="'+company+' logo"></span><span class="role-company-name">'+company+'</span>';title.parentNode.insertBefore(holder,title);}
      var lists=$all('ul',role);if(lists.length){var wrap=document.createElement('div');wrap.className='role-detail-wrap';lists[0].parentNode.insertBefore(wrap,lists[0]);lists.forEach(function(l){wrap.appendChild(l);});role.classList.add('is-collapsed');var btn=document.createElement('button');btn.type='button';btn.className='role-toggle';btn.innerHTML='<span class="en">Show details +</span><span class="ar">عرض التفاصيل +</span>';btn.addEventListener('click',function(){var collapsed=role.classList.toggle('is-collapsed');btn.innerHTML=collapsed?'<span class="en">Show details +</span><span class="ar">عرض التفاصيل +</span>':'<span class="en">Hide details −</span><span class="ar">إخفاء التفاصيل −</span>';});wrap.parentNode.insertBefore(btn,wrap.nextSibling);}
    });
  }
  function decorateRail(){
    $all('.rail-step').forEach(function(step){if(step.dataset.enhanced)return;step.dataset.enhanced='1';var co=step.querySelector('.rail-co');if(!co)return;var name=(co.textContent||'').trim();var logo=companyLogo(name);if(logo){var img=document.createElement('img');img.src=logo;img.alt='';img.className='rail-mini-logo';co.prepend(img);}});
  }
  function counters(){
    var grid=document.getElementById('hlGrid');if(!grid||grid.dataset.counted)return;grid.dataset.counted='1';
    var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(!e.isIntersecting)return;$all('.hl-fig',grid).forEach(function(node){var span=node.querySelector('.en')||node;var raw=span.textContent.trim();var m=raw.match(/^([0-9]+)(.*)$/);if(!m)return;var end=Number(m[1]),suffix=m[2];var start=performance.now(),dur=850;node.dataset.counting='1';function tick(now){var p=Math.min(1,(now-start)/dur);var eased=1-Math.pow(1-p,3);var val=Math.round(end*eased);$all('.en,.ar',node).forEach(function(s){var own=s.textContent.trim();var mm=own.match(/^([0-9]+)(.*)$/);if(mm)s.firstChild.nodeValue=val;});if(p<1)requestAnimationFrame(tick);else node.dataset.counting='0';}requestAnimationFrame(tick);});io.disconnect();});},{threshold:.35});io.observe(grid);
  }
  function activeNav(){
    var links=$all('.nav a[href^="#"]');if(!links.length)return;var map={};links.forEach(function(a){map[a.getAttribute('href').slice(1)]=a;});var sections=Object.keys(map).map(function(id){return document.getElementById(id);}).filter(Boolean);
    var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.classList.remove('is-active');});if(map[e.target.id])map[e.target.id].classList.add('is-active');}});},{rootMargin:'-35% 0px -55% 0px',threshold:0});sections.forEach(function(s){io.observe(s);});
  }
  function tilt(){
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||innerWidth<821)return;var card=document.querySelector('.aside-card');if(!card)return;
    card.addEventListener('mousemove',function(e){var r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform='perspective(900px) rotateY('+(x*4)+'deg) rotateX('+(-y*4)+'deg) translateY(-2px)';});card.addEventListener('mouseleave',function(){card.style.transform='';});
  }
  function improvePhoto(){var img=document.querySelector('.aside-card>img');if(img){img.loading='eager';img.fetchPriority='high';}}
  function initWhenReady(){var tries=0;var timer=setInterval(function(){tries++;if(document.querySelector('.role')&&document.querySelector('.hl')){clearInterval(timer);addBrandJourney();decorateRoles();decorateRail();counters();activeNav();tilt();improvePhoto();}else if(tries>80)clearInterval(timer);},100);}
  addProgress();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initWhenReady);else initWhenReady();
})();
