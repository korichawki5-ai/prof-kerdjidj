/* ══════════════════════════════════════════════════════════════════
   page-public.js · Pages publiques : niveaux, cours, exercices,
   emploi du temps, la professeure, FAQ, contact.
   Un seul moteur : le rendu dépend de <html data-page="…">.
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, svg, logo, t, toast, boot, replayFx, initReveal, initCounters, initProgress} = window.PK;
const D = window.PKdata, X = window.PKxp, S = D.settings;
let L = 'ar'; const ar=()=>L==='ar'; const L_=(a,f)=>ar()?a:f;

const DAYS={sat:['السبت','Samedi','Sam'],sun:['الأحد','Dimanche','Dim'],mon:['الاثنين','Lundi','Lun'],
            tue:['الثلاثاء','Mardi','Mar'],wed:['الأربعاء','Mercredi','Mer'],thu:['الخميس','Jeudi','Jeu']};
const ini=n=>String(n).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

/* ───────── En-tête de page interne ───────── */
function pageHead(o){
  return `<section class="sec" style="padding-block:clamp(46px,7vw,84px) clamp(24px,4vw,40px)">
    <div class="ct">
      <nav class="crumb rv">${o.crumbs||''}</nav>
      <div class="g pub-hd" style="gap:34px;align-items:end">
        <div>
          ${o.badge?`<span class="bd bd--wt rv">${svg(o.badgeIcon||'spark','width="13" height="13"')}<span data-i18n="${o.badgeKey||''}">${o.badge}</span></span>`:''}
          <h1 class="hd__t rv" style="font-size:clamp(1.85rem,4.4vw,3.05rem);margin-block:14px 12px">${o.title}</h1>
          <p class="hd__i rv" style="--d:60ms;max-width:64ch">${o.sub}</p>
        </div>
        ${o.side||''}
      </div>
    </div>
  </section>`;
}
const crumb=(href,label)=>`<a href="${href}">${label}</a>${svg('chev','width="13" height="13"')}`;

/* ══════════════════ 1. NIVEAUX ══════════════════ */
function levels(){
  return pageHead({
    crumbs: crumb('index.html',t('navHome'))+'<span>'+t('navLevels')+'</span>',
    badge:true, badgeKey:'lvBadge', badge:t('lvBadge'), badgeIcon:'school',
    title:t('lvTitle'), sub:t('lvSub'),
    side:`<div class="g g2 rv" style="gap:12px;min-width:250px">
      ${[[D.levels.length,t('navLevels'),'school'],[D.lessons.length,t('lsList'),'book'],[D.exercises.length,t('sbEx'),'quiz']]
        .map(([n,l,ic])=>`<div class="cd cd--flat" style="background:var(--surface);padding:16px;text-align:center">
          <div class="st__n la" style="font-size:1.7rem">${n}</div><div class="st__l" style="font-size:.8rem;margin:0">${l}</div>
          <span class="st__i" style="width:36px;height:36px;border-radius:11px;margin:8px auto 0">${svg(ic,'width="17" height="17"')}</span></div>`).join('')}
    </div>`
  }) + `
  <section class="sec" style="padding-block:0">
    <div class="ct">
      <div class="lvs cas">${D.levels.map(l=>`
        <article class="lv ${l.cls} rv">
          ${l.hot?`<span class="ribbon" data-i18n="lvHot">${t('lvHot')}</span>`:''}
          <div class="lv__b la">${l.id}</div>
          <div><div class="lv__n">${L_(l.ar,l.fr)}</div><div class="lv__f">${l.fr}</div></div>
          <p class="lv__d">${L_(l.descAr,l.descFr)}</p>
          <ul class="lv__t">${l.topics.map(x=>`<li>${svg('check','width="15" height="15"')}<span>${L_(x[1],x[0])}</span></li>`).join('')}</ul>
          <div class="lv__m">
            <span class="bd bd--gy la">${D.lessons.filter(x=>x.level===l.id).length} ${t('lvLessons')}</span>
            <span class="bd bd--gy la">${D.exercises.filter(x=>x.level===l.id).length} ${t('lvEx')}</span>
            <span class="bd bd--lv la">${D.lessons.filter(x=>x.level===l.id).reduce((a,x)=>a+(x.min||0),0)} ${t('lvMin')}</span>
          </div>
          <div class="flex gap2 mt5">
            <a class="btn btn--p btn--sm" href="lessons.html?lv=${l.id}">${svg('book','width="16" height="16"')}${t('lsAll')}</a>
            <a class="btn btn--g btn--sm" href="exercises.html?lv=${l.id}">${svg('quiz','width="16" height="16"')}${t('sbEx')}</a>
          </div>
        </article>`).join('')}</div>
    </div>
  </section>

  <section class="sec">
    <div class="ct">
      <div class="hd" style="text-align:center"><span class="bd bd--wt rv">${svg('target','width="13" height="13"')}${t('lvTopics')}</span>
        <h2 class="hd__t rv" data-i18n="axTitle">${L_('تسعة محاور تغطّي البرنامج كاملاً','Neuf axes couvrant tout le programme')}</h2>
        <p class="hd__i rv" style="--d:60ms;margin-inline:auto">${L_('كل درس وكل تمرين مرتبط بمحور محدّد — وهذا ما يجعل نسبة الإتقان دقيقة وقابلة للقياس.',
          'Chaque cours et chaque exercice est rattaché à un axe précis — c’est ce qui rend le taux de maîtrise fiable et mesurable.')}</p></div>
      <div class="axs cas">${D.axes.map(a=>`
        <a href="lessons.html?ax=${a.id}" class="ax rv">
          <span class="ico">${svg(a.icon)}</span>
          <span class="ax__t">${a.fr}<small>${a.ar}</small></span>
          <span class="bd bd--gy la" style="margin-inline-start:auto">${a.count}</span>
        </a>`).join('')}</div>
    </div>
  </section>

  ${ctaBand()}`;
}

/* ══════════════════ 2. COURS ══════════════════ */
let lsFilter={lv:'',ax:'',q:''};
function lessons(){
  const qs=new URLSearchParams(location.search);
  if(qs.get('lv')) lsFilter.lv=qs.get('lv');
  if(qs.get('ax')) lsFilter.ax=qs.get('ax');
  return pageHead({
    crumbs: crumb('index.html',t('navHome'))+'<span>'+t('navLessons')+'</span>',
    badge:true, badgeKey:'lsBadge', badge:t('lsBadge'), badgeIcon:'book',
    title:t('lsTitle'), sub:t('lsSub')
  }) + `
  <section class="sec" style="padding-block:0">
    <div class="ct">
      <div class="cd rv" style="padding:16px 18px;margin-block-end:26px">
        <div class="flex gap3 wrap-f items-c">
          <div class="srch" style="flex:1;min-width:220px">${svg('search')}
            <input class="inp" id="lsQ" data-i18n-ph="lsSearch" placeholder="${t('lsSearch')}"></div>
          <div class="lsw" id="lsLv" style="gap:8px">
            <button class="${!lsFilter.lv?'on':''}" data-lv="">${t('allLevels')}</button>
            ${D.levels.map(l=>`<button class="${lsFilter.lv===l.id?'on':''}" data-lv="${l.id}">${l.id}</button>`).join('')}
          </div>
        </div>
        <div class="chips mt4" id="lsAx">
          <button class="chip ${!lsFilter.ax?'on':''}" data-ax="">${t('all')} <span class="n la">${D.lessons.length}</span></button>
          ${D.axes.map(a=>`<button class="chip ${lsFilter.ax===a.id?'on':''}" data-ax="${a.id}">${L_(a.ar,a.fr)}
            <span class="n la">${D.lessons.filter(l=>l.ax===a.id).length}</span></button>`).join('')}
        </div>
      </div>
      <div class="lsg" id="lsGrid"></div>
      <div class="empty" id="lsEmpty" style="display:none"><div class="ico">${svg('book')}</div><b>${D.lessons.length?t('stuNoRes'):t('noLessons')}</b></div>
    </div>
  </section>

  <section class="sec">
    <div class="ct"><div class="g g2 cas" style="align-items:start">
      <div class="cd rv"><div class="cd__t mb4" data-i18n="lsEdS2">${L_('كيف تستعمل الدرس؟','Comment exploiter un cours ?')}</div>
        ${[[1,t('stp1t')||'اقرأ الملخّص',t('stp1d')||'ملخّص مركّز في صفحة واحدة.'],
           [2,t('stp2t')||'شاهد المثال',t('stp2d')||'أمثلة محلولة من المنهاز الجزائري.'],
           [3,t('stp3t')||'تدرّب فوراً',t('stp3d')||'تمرين مرتبط بتصحيح فوري وشرح.'],
           [4,t('stp4t')||'اكسب XP',t('stp4d')||'كل درس مكتمل = +25 XP وتقدّم في الإتقان.']]
          .map(([n,h,d])=>`<div class="stp"><span class="stp__n la">${n}</span>
            <div class="stp__b"><h3>${h}</h3><p>${d}</p></div></div>`).join('')}
      </div>
      <div class="cd rv" style="--d:80ms"><div class="cd__t mb4">${L_('ماذا يحتوي كل درس؟','Que contient chaque cours ?')}</div>
        ${[['file',t('lsPdf'),'PDF'],[ 'play',t('lsVideo'),'—'],['quiz',t('lsEx'),'×9'],['clock',t('lsMin'),'25'],
           ['bolt','XP','+25'],['users',L_('مستوى','Niveau'),'1AM–4AM']]
          .map(([ic,l,v])=>`<div class="flex just-b items-c" style="padding:12px 0;border-block-end:1px dashed var(--line)">
            <span class="flex items-c gap3" style="font-size:.9rem">${svg(ic,'width="17" height="17" style="color:var(--ac)"')}${l}</span>
            <b class="la">${v}</b></div>`).join('')}
        <a class="btn btn--p btn--blk mt5" href="student/index.html">${svg('users','width="17" height="17"')}${t('navLogin')}</a>
      </div>
    </div></div>
  </section>
  ${ctaBand()}`;
}
function renderLessonGrid(){
  const g=$('#lsGrid'); if(!g) return;
  const list=D.lessons.filter(l=>{
    if(lsFilter.lv && l.level!==lsFilter.lv) return false;
    if(lsFilter.ax && l.ax!==lsFilter.ax) return false;
    if(lsFilter.q){ const s=(l.ar+' '+l.fr+' '+l.sumAr+' '+l.sumFr).toLowerCase();
      if(!s.includes(lsFilter.q.toLowerCase())) return false; }
    return true;
  });
  const em=$('#lsEmpty'); if(em) em.style.display = list.length?'none':'grid';
  g.innerHTML = list.map(x=>{
    const ax=D.axes.find(a=>a.id===x.ax)||{fr:x.ax,ar:x.ax,icon:'book'};
    const lv=D.byId(D.levels,x.level);
    return `<article class="ls rv">
      <div class="ls__th">${svg(x.icon||ax.icon)}</div>
      <div class="flex gap2 wrap-f">
        <span class="bd bd--lv ${lv.cls}">${x.level}</span>
        <span class="bd bd--gy">${L_(ax.ar,ax.fr)}</span>
        ${x.isNew?`<span class="bd bd--ac">${svg('spark','width="11" height="11"')}${t('lsNew')}</span>`:''}
      </div>
      <h3 class="ls__t" dir="ltr">${L_(x.ar,x.fr)}</h3>
      <p class="muted" style="font-size:.88rem;line-height:1.75;flex:1">${L_(x.sumAr,x.sumFr)}</p>
      <div class="ls__m">
        <span class="bd bd--gy la">${svg('clock','width="12" height="12"')}${x.min} ${t('lsMin')}</span>
        <span class="bd bd--gy la">${svg('file','width="12" height="12"')}${x.files||0} PDF</span>
        ${x.video?`<span class="bd bd--pu la">${svg('play','width="12" height="12"')}${t('lsVideo')}</span>`:''}
        <span class="bd bd--wn la">${svg('bolt','width="12" height="12"')}+${x.xp||25} XP</span>
      </div>
      <a class="btn btn--s btn--blk mt4" href="student/lesson.html?id=${x.id}">${svg('book','width="16" height="16"')}${t('lsStart')}</a>
    </article>`;}).join('');
  initReveal(g); replayFx(g);
}
function bindLessons(){
  const q=$('#lsQ'); if(q) q.addEventListener('input',()=>{ lsFilter.q=q.value; renderLessonGrid(); });
  $$('#lsLv button').forEach(b=> b.addEventListener('click',()=>{
    $$('#lsLv button').forEach(x=>x.classList.toggle('on',x===b)); lsFilter.lv=b.dataset.lv; renderLessonGrid(); }));
  $$('#lsAx .chip').forEach(b=> b.addEventListener('click',()=>{
    $$('#lsAx .chip').forEach(x=>x.classList.toggle('on',x===b)); lsFilter.ax=b.dataset.ax; renderLessonGrid(); }));
  renderLessonGrid();
}

/* ══════════════════ 3. EXERCICES ══════════════════ */
let exFilter={lv:'',ty:''};
function exercises(){
  const qs=new URLSearchParams(location.search);
  if(qs.get('lv')) exFilter.lv=qs.get('lv');
  return pageHead({
    crumbs: crumb('index.html',t('navHome'))+'<span>'+t('navEx')+'</span>',
    badge:true, badgeKey:'exBadge', badge:t('exBadge'), badgeIcon:'quiz',
    title:t('exTitle'), sub:t('exSub'),
    side:`<div class="cd rv" style="min-width:240px;background:var(--surface)">
      <div class="cd__t mb3" style="font-size:.95rem">${t('exTypes')}</div>
      ${[['mcq',t('tyMcq')],['tf',t('tyTf')],['fill',t('qbAddFill')],['mixed',L_('مختلط','Mixte')]]
        .map(([k,l])=>`<div class="flex just-b items-c" style="padding:9px 0;border-block-end:1px dashed var(--line);font-size:.86rem">
          <span class="qtype qtype--${k==='mixed'?'mcq':k}">${l}</span>
          <b class="la">${D.exercises.filter(e=>e.type===k).length}</b></div>`).join('')}
    </div>`
  }) + `
  <section class="sec" style="padding-block:0">
    <div class="ct">
      <div class="cd rv" style="padding:16px 18px;margin-block-end:26px">
        <div class="flex gap3 wrap-f items-c">
          <div class="lsw" id="exLv" style="gap:8px">
            <button class="${!exFilter.lv?'on':''}" data-lv="">${t('allLevels')}</button>
            ${D.levels.map(l=>`<button class="${exFilter.lv===l.id?'on':''}" data-lv="${l.id}">${l.id}</button>`).join('')}
          </div>
          <div class="chips" id="exTy" style="margin-inline-start:auto">
            <button class="chip ${!exFilter.ty?'on':''}" data-ty="">${t('all')}</button>
            ${['mcq','tf','fill','mixed'].map(k=>`<button class="chip ${exFilter.ty===k?'on':''}" data-ty="${k}">${t('ty'+k.charAt(0).toUpperCase()+k.slice(1))}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="g g3 cas" id="exGrid"></div>
      <div class="empty" id="exEmpty" style="display:none"><div class="ico">${svg('quiz')}</div><b>${D.exercises.length?t('stuNoRes'):t('noExercises')}</b></div>
    </div>
  </section>
  ${ctaBand()}`;
}
function renderExGrid(){
  const g=$('#exGrid'); if(!g) return;
  const list=D.exercises.filter(e=>(!exFilter.lv||e.level===exFilter.lv)&&(!exFilter.ty||e.type===exFilter.ty));
  const em=$('#exEmpty'); if(em) em.style.display=list.length?'none':'grid';
  g.innerHTML=list.map(x=>{
    const lv=D.byId(D.levels,x.level); const ax=D.axes.find(a=>a.id===x.ax)||{fr:x.ax};
    return `<div class="cd cd--h rv">
      <div class="flex gap2 wrap-f mb4">
        <span class="bd bd--lv ${lv.cls}">${x.level}</span>
        <span class="bd bd--gy">${ax.fr}</span>
        <span class="qtype qtype--${x.type==='mixed'?'mcq':x.type}">${t('ty'+x.type.charAt(0).toUpperCase()+x.type.slice(1))}</span>
        <span class="diff diff--${x.diff}" title="${t('diff'+x.diff)}" style="margin-inline-start:auto"><i class="on"></i><i class="${x.diff>=2?'on':''}"></i><i class="${x.diff>=3?'on':''}"></i></span>
      </div>
      <h3 style="font-size:1.05rem;font-family:var(--ffl)">${L_(x.titleAr,x.titleFr)}</h3>
      <p class="muted mt3" style="font-size:.9rem;line-height:1.8;flex:1">${L_(x.descAr,x.descFr)}</p>
      <div class="cd__f">
        <span class="bd bd--gy la">${svg('quiz','width="12" height="12"')}${x.q} ${t('exQ')}</span>
        <span class="bd bd--gy la">${svg('clock','width="12" height="12"')}${x.min} min</span>
        <span class="bd bd--wn la">${svg('bolt','width="12" height="12"')}≤ ${x.xpMax} XP</span>
        <a class="btn btn--p btn--sm" style="margin-inline-start:auto" href="student/exercise.html?id=${x.id}">${svg('play','width="15" height="15"')}${t('exStart')}</a>
      </div>
    </div>`;}).join('');
  initReveal(g); replayFx(g);
}
function bindExercises(){
  $$('#exLv button').forEach(b=> b.addEventListener('click',()=>{
    $$('#exLv button').forEach(x=>x.classList.toggle('on',x===b)); exFilter.lv=b.dataset.lv; renderExGrid(); }));
  $$('#exTy .chip').forEach(b=> b.addEventListener('click',()=>{
    $$('#exTy .chip').forEach(x=>x.classList.toggle('on',x===b)); exFilter.ty=b.dataset.ty; renderExGrid(); }));
  renderExGrid();
}

/* ══════════════════ 4. EMPLOI DU TEMPS ══════════════════ */
function todayKey(){
  const m=['sun','mon','tue','wed','thu','fri','sat']; const k=m[new Date().getDay()];
  return DAYS[k] ? k : 'sat';
}
function timetable(){
  if(!D.groups.length) return `<div class="empty"><div class="ico">${svg('cal')}</div><b>${t('noGroups')}</b></div>`;
  const tk=todayKey();
  let grid=`<div class="hd la">${t('ttTime')}</div>`;
  D.days.forEach(d=> grid+=`<div class="hd ${d===tk?'today':''}">${DAYS[d][ar()?0:1]}<small class="la" style="display:block;font-size:.7rem;opacity:.7">${DAYS[d][2]}</small></div>`);
  D.slots.forEach(slot=>{
    grid+=`<div class="hr la">${slot}</div>`;
    D.days.forEach(d=>{
      const g=D.slotAt(d,slot);
      grid += g
        ? `<div class="sl"><div class="blk ${g.cls}"><b>${g.name}</b><small>${L_(g.schoolAr,g.schoolFr)}</small><i class="la">${g.start}–${g.end}</i></div></div>`
        : `<div class="sl"></div>`;
    });
  });
  const dayGroups=d=>D.groups.filter(g=>g.day===d);
  return pageHead({
    crumbs: crumb('index.html',t('navHome'))+'<span>'+t('navTimetable')+'</span>',
    badge:true, badge:t('ttBadge'), badgeKey:'ttBadge', badgeIcon:'cal',
    title:t('ttTitle'), sub:t('ttSub'),
    side:`<div class="rv" style="display:flex;flex-direction:column;gap:10px;min-width:230px">
      <button class="btn btn--g btn--blk" onclick="window.print()">${svg('up','width="17" height="17"')}${t('ttPrint')}</button>
      <a class="btn btn--p btn--blk" href="contact.html">${svg('send','width="17" height="17"')}${t('ttNew')}</a>
      <span class="bd bd--ok" style="justify-content:center">${svg('checkc','width="13" height="13"')}${L_('محدّث اليوم','Mis à jour aujourd’hui')}</span>
    </div>`
  }) + `
  <section class="sec" style="padding-block:0">
    <div class="ct">
      <div class="tte rv"><div class="tte__s"><div class="tteg">${grid}</div></div></div>
      <p class="muted mt4" style="font-size:.84rem;display:flex;align-items:center;gap:9px">
        ${svg('info','width="16" height="16" style="color:var(--ac)"')}<span data-i18n="ttNote">${t('ttNote')}</span></p>
    </div>
  </section>

  <section class="sec">
    <div class="ct">
      <div class="hd"><span class="bd bd--wt rv">${svg('cal','width="13" height="13"')}${t('ttToday')}</span>
        <h2 class="hd__t rv" data-i18n="ttByDay">${L_('الحصص يوماً بيوم','Les séances, jour par jour')}</h2></div>
      <div class="g g3 cas">
        ${D.days.map(d=>{
          const gs=dayGroups(d);
          return `<div class="cd rv ${d===tk?'cd--acc':''}">
            <div class="cd__h"><div class="cd__t">${DAYS[d][ar()?0:1]}</div>
              ${d===tk?`<span class="bd bd--ok">${svg('check','width="12" height="12"')}${t('ttToday')}</span>`:`<span class="bd bd--gy la">${gs.length}</span>`}</div>
            ${gs.length?gs.map(g=>`<div class="mini-row"><span class="dot-st dot-st--on"></span>
              <div style="min-width:0"><b class="la">${g.name}</b>
                <div class="muted" style="font-size:.78rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${L_(g.schoolAr,g.schoolFr)}</div></div>
              <span class="bd bd--gy la" style="margin-inline-start:auto">${g.start}</span></div>`).join('')
              :`<p class="muted" style="font-size:.86rem">${t('ttEmpty')}</p>`}
          </div>`;}).join('')}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="ct"><div class="g g2 cas" style="align-items:start">
      <div class="cd rv">
        <div class="cd__t mb4" data-i18n="ttSeats">${t('ttSeats')}</div>
        ${D.levels.map(l=>{
          const gs=D.groups.filter(g=>g.level===l.id);
          const cap=gs.reduce((a,g)=>a+g.capacity,0), ins=gs.reduce((a,g)=>a+g.enrolled,0);
          const pct=cap?Math.round(ins/cap*100):0;
          return `<div class="mb4"><div class="flex just-b" style="font-size:.88rem;margin-block-end:6px">
              <b>${l.id} · ${L_(l.ar,l.fr)}</b><span class="muted la">${ins}/${cap} (${pct}%)</span></div>
            <div class="prg"><i data-w="${pct}%" style="width:${pct}%"></i></div></div>`;}).join('')}
        <div class="cd cd--flat mt5" style="background:var(--ok-t);border-color:transparent;padding:14px">
          <b style="color:var(--ok-d)">${svg('checkc','width="15" height="15" style="display:inline;vertical-align:-2px"')}
            ${D.groups.reduce((a,g)=>a+(g.capacity-g.enrolled),0)} ${t('grFree')}</b></div>
      </div>
      <div class="cd rv" style="--d:80ms">
        <div class="cd__t mb4" data-i18n="ttMode">${L_('كيف تُنظَّم الحصص؟','Comment s’organisent les séances ?')}</div>
        ${[[1,L_('حصة أسبوعية لكل فوج','Une séance hebdomadaire par groupe'),L_('90 دقيقة: مراجعة + تدريب + تصحيح فوري.','90 minutes : révision, entraînement et correction immédiate.')],
           [2,L_('أفواج صغيرة','Groupes restreints'),L_('من 6 إلى 26 تلميذاً حسب المستوى — متابعة فردية حقيقية.','De 6 à 26 élèves selon le niveau — un suivi individuel réel.')],
           [3,L_('دروس خصوصية','Cours particuliers'),L_('حصص مسائية بموعد مسبق للتلاميذ الذين يحتاجون تركيزاً أكبر.','Séances en soirée sur rendez-vous pour les élèves qui ont besoin d’un ciblage particulier.')],
           [4,L_('عن بُعد قريباً','Bientôt en ligne'),L_('البنية جاهزة لإضافة حصص مباشرة ومسجّلة في فضاء التلميذ.','L’architecture est prête pour ajouter des séances en direct et enregistrées.')]]
          .map(([n,h,d])=>`<div class="stp"><span class="stp__n la">${n}</span><div class="stp__b"><h3>${h}</h3><p>${d}</p></div></div>`).join('')}
      </div>
    </div></div>
  </section>
  ${ctaBand()}`;
}

/* ══════════════════ 5. LA PROFESSEURE ══════════════════ */
function about(){
  return pageHead({
    crumbs: crumb('index.html',t('navHome'))+'<span>'+t('navAbout')+'</span>',
    badge:true, badge:L_('الأستاذة','La professeure'), badgeIcon:'user',
    title:L_('الأستاذة كرجيج','Prof. Kerdjidj'),
    sub:L_('أستاذة اللغة الفرنسية للطور المتوسط — خميس مليانة، ولاية عين الدفلى. أكثر من 12 سنة في تدريس الفرنسية لتلاميذ 1AM إلى 4AM وتحضيرهم لشهادة التعليم المتوسط (BEM).',
           'Professeure de français au cycle moyen — Khemis Miliana, wilaya d’Aïn Defla. Plus de 12 ans d’enseignement du français, de la 1AM à la 4AM, et de préparation au BEM.')
  }) + `
  <section class="sec" style="padding-block:0">
    <div class="ct"><div class="g g-main adm-split adm-split--rev" style="--adm-side:340px">
      <div class="tch__c rv">
        <div class="tch__ph">${svg('user')}</div>
        <div class="cd mt4" style="padding:16px">
          <div class="cd__t" style="font-size:.95rem">${L_(S.teacherNameAr,S.teacherNameFr)}</div>
          <div class="cd__s mb4">${L_('أستاذة اللغة الفرنسية','Professeure de français')}</div>
          ${[['pin',S.city+' — '+S.wilaya],['school',L_('الطور المتوسط','Cycle moyen (1AM–4AM)')],['cal',L_('12+ سنة خبرة','12+ ans d’expérience')],['phone',S.phone]]
            .map(([ic,v])=>`<div class="flex items-c gap3" style="padding:9px 0;border-block-end:1px dashed var(--line);font-size:.85rem">
              ${svg(ic,'width="16" height="16" style="color:var(--ac)"')}<span>${v}</span></div>`).join('')}
          <div class="flex gap2 mt4">${['fb','ig','yt','tg','wa'].map(k=>S[k]?`<a class="btn btn--g btn--i" href="${S[k]}" target="_blank" rel="noopener">${svg(k)}</a>`:'').join('')}</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:22px;min-width:0">
        <div class="cd rv">
          <div class="tch__q">${svg('quote','width="26" height="26" style="color:var(--ac);opacity:.35"')}
            ${L_('« اللغة الفرنسية لا تُحفظ، بل تُمارَس. دوري أن أجعل كل تلميذ يتدرّب كل يوم، ويفهم خطأه في اللحظة نفسها، ويشعر بتقدّمه بعينه. »',
                 '« Le français ne s’apprend pas par cœur, il se pratique. Mon rôle : faire en sorte que chaque élève s’entraîne chaque jour, comprenne son erreur sur-le-champ et voie ses progrès de ses propres yeux. »')}</div>
          <div class="g g3 cas mt5">${[[S.stats?S.stats.years:'12','+',t('st1'),'seedling'],[S.stats?S.stats.students:'240','+',t('st2'),'users'],
              [S.stats?S.stats.lessons:'180','+',t('st3'),'book'],[S.stats?S.stats.exercises:'950','+',t('st4'),'quiz']]
            .map(([n,s2,l,ic])=>`<div class="cd cd--flat" style="background:var(--bg2);padding:18px;text-align:center">
              <span class="st__i">${svg(ic)}</span>
              <div class="st__n la">${n}<span>${s2}</span></div><div class="st__l">${l}</div></div>`).join('')}</div>
        </div>
        <div class="cd rv" style="--d:60ms">
          <div class="cd__t mb4">${L_('الطريقة البيداغوجية','La méthode pédagogique')}</div>
          ${[[1,L_('التشخيص قبل الدرس','Un diagnostic avant le cours'),L_('اختبار قصير يحدّد مستوى كل تلميذ في كل محور، فتُبنى الخطة على الواقع لا على التخمين.','Un court test situe chaque élève axe par axe : le plan se construit sur le réel, pas sur des suppositions.')],
             [2,L_('شرح مختصر + تطبيق طويل','Explication courte, pratique longue'),L_('القاعدة تُفهم في دقائق، ثم تُثبَّت بعشرات التمارين المتدرّجة الصعوبة.','La règle se comprend en quelques minutes, puis se fixe par des dizaines d’exercices à difficulté graduée.')],
             [3,L_('التصحيح الفوري المصحوب بالشرح','Correction immédiate et expliquée'),L_('لا ينتظر التلميذ أسبوعاً ليعرف خطأه: يعرفه فوراً مع السبب — وهذا أسرع طريق للفهم.','L’élève n’attend pas une semaine pour connaître son erreur : il la voit aussitôt, avec la raison — le chemin le plus court vers la compréhension.')],
             [4,L_('التحفيز بدل التنقيط','La motivation plutôt que la notation'),L_('هذه المنصة مستقلة عن المدرسة: لا نقاط ولا كشوف. XP وسلاسل وأوسمة تجعل المراجعة عادة يومية.','Cette plateforme est indépendante de l’école : ni notes ni bulletins. XP, séries et badges transforment la révision en habitude quotidienne.')],
             [5,L_('تحضير BEM بمنهجية','Une préparation méthodique au BEM'),L_('ملخّصات شاملة، مواضيع سابقة محلولة، واختبارات بيضاء موقوتة بنفس شكل الشهادة.','Fiches complètes, sujets corrigés et examens blancs chronométrés au format réel de l’examen.')]]
            .map(([n,h,d])=>`<div class="stp"><span class="stp__n la">${n}</span><div class="stp__b"><h3>${h}</h3><p>${d}</p></div></div>`).join('')}
        </div>
        <div class="cd rv" style="--d:120ms">
          <div class="cd__t mb4">${L_('الشهادات والكفاءات','Parcours et compétences')}</div>
          <div class="g g2 cas" style="gap:14px">
            ${[[L_('شهادة في تعليم اللغة الفرنسية','Diplôme d’enseignement du français'),L_('تكوين أكاديمي متخصّص في ديدكتيك اللغات.','Formation académique spécialisée en didactique des langues.')],
               [L_('خبرة في الطور المتوسط','Expérience du cycle moyen'),L_('1AM · 2AM · 3AM · 4AM وتحضير شهادة BEM.','1AM · 2AM · 3AM · 4AM et préparation au BEM.')],
               [L_('بناء المحتوى الرقمي','Conception de contenu numérique'),L_('دروس وملخّصات وتمارين تفاعلية مصمّمة محلياً.','Cours, fiches et exercices interactifs conçus localement.')],
               [L_('المتابعة الفردية','Suivi individualisé'),L_('تتبّع دقيق لتقدّم كل تلميذ محوراً محوراً.','Un suivi précis, axe par axe, pour chaque élève.')]]
              .map(([h,d])=>`<div class="cred"><span class="cred__i">${svg('checkc')}</span><div><b>${h}</b><p>${d}</p></div></div>`).join('')}
          </div>
        </div>
      </div>
    </div></div>
  </section>
  ${ctaBand()}`;
}

/* ══════════════════ 6. FAQ ══════════════════ */
const FAQ=[
 ['faqQ1','faqA1'],['faqQ2','faqA2'],['faqQ3','faqA3'],['faqQ4','faqA4'],['faqQ5','faqA5'],
 ['faqQ6','faqA6'],['faqQ7','faqA7'],['faqQ8','faqA8'],['faqQ9','faqA9'],['faqQ10','faqA10']
];
function faq(){
  const items=FAQ.filter(([q])=>String(t(q))!==q);
  return pageHead({
    crumbs: crumb('index.html',t('navHome'))+'<span>'+t('navFaq')+'</span>',
    badge:true, badge:t('navFaq'), badgeIcon:'chat',
    title:L_('الأسئلة الشائعة','Questions fréquentes'),
    sub:L_('كل ما يحتاج التلميذ ووليّه معرفته قبل البدء — وبدون أي غموض بشأن النقاط المدرسية.',
           'Tout ce que l’élève et son parent doivent savoir avant de commencer — sans aucune ambiguïté sur les notes scolaires.')
  }) + `
  <section class="sec" style="padding-block:0">
    <div class="ct"><div class="g g-main adm-split" style="--adm-side:320px">
      <div class="cd rv" style="padding:6px 22px">
        ${items.map(([q,a],i)=>`<details class="acc"${i===1?' open':''}>
          <summary>${t(q)}</summary><div class="acc__b">${t(a)}</div></details>`).join('')}
      </div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="cd rv" style="background:linear-gradient(140deg,var(--ac-dd),var(--ac));border:0;color:#fff">
          <div class="cd__t" style="color:#fff;font-size:1rem">${L_('لم تجد جوابك؟','Vous ne trouvez pas votre réponse ?')}</div>
          <p style="font-size:.88rem;opacity:.9;line-height:1.8;margin-block:10px 16px">
            ${L_('اكتب لنا مباشرة وسنرد في أقرب وقت.','Écrivez-nous directement, nous répondrons au plus vite.')}</p>
          <a class="btn btn--w btn--blk" href="contact.html">${svg('send','width="17" height="17"')}${t('navContact')}</a>
          ${S.whatsapp?`<a class="btn btn--o btn--blk mt3" href="${S.whatsappLink||S.whatsapp}" target="_blank" rel="noopener">${svg('wa','width="17" height="17"')}WhatsApp</a>`:''}
        </div>
        <div class="cd rv" style="--d:80ms">
          <div class="cd__t mb4">${L_('الأكثر سؤالاً','Les plus posées')}</div>
          ${items.slice(0,5).map(([q],i)=>`<a href="#" class="mini-row" data-faq="${i}">
            <span class="bd bd--gy la" style="min-width:26px;text-align:center">${i+1}</span>
            <span style="font-size:.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t(q)}</span></a>`).join('')}
        </div>
      </div>
    </div></div>
  </section>`;
}
function bindFaq(){
  $$('[data-faq]').forEach(a=> a.addEventListener('click',e=>{
    e.preventDefault(); const d=$$('.acc')[+a.dataset.faq];
    if(d){ d.open=true; d.scrollIntoView({behavior:'smooth',block:'center'}); }
  }));
}

/* ══════════════════ 7. CONTACT ══════════════════ */
function contact(){
  return pageHead({
    crumbs: crumb('index.html',t('navHome'))+'<span>'+t('navContact')+'</span>',
    badge:true, badge:t('navContact'), badgeIcon:'send',
    title:L_('تواصل معنا','Nous contacter'),
    sub:L_('للاستفسار عن مقعد، أو تسجيل، أو درس خصوصي، أو أي سؤال بيداغوجي — خميس مليانة، ولاية عين الدفلى.',
           'Pour une place, une inscription, un cours particulier ou toute question pédagogique — Khemis Miliana, wilaya d’Aïn Defla.')
  }) + `
  <section class="sec" style="padding-block:0">
    <div class="ct"><div class="g g-main adm-split" style="--adm-side:380px">
      <div class="cd rv">
        <div class="cd__h"><div><div class="cd__t" data-i18n="ctForm">${L_('أرسل رسالة','Envoyer un message')}</div>
          <div class="cd__s">${L_('كل الحقول المطلوبة معلّمة بـ *','Les champs obligatoires sont marqués d’un *')}</div></div></div>
        <form id="ctForm" novalidate>
          <div class="g g2" style="gap:16px">
            <div class="fld req"><label>${L_('الاسم واللقب *','Nom et prénom *')}</label>
              <input class="inp" name="name" required placeholder="${L_('الاسم واللقب','Nom et prénom')}"></div>
            <div class="fld req"><label>${L_('الهاتف أو البريد *','Téléphone ou e-mail *')}</label>
              <input class="inp" name="contact" dir="ltr" required placeholder="0555… / nom@mail.com"></div>
            <div class="fld"><label>${L_('المستوى','Niveau')}</label>
              <select class="sel" name="level"><option value="">${L_('اختر…','Choisir…')}</option>
                ${D.levels.map(l=>`<option>${l.id}</option>`).join('')}
                <option>${L_('وليّ تلميذ','Parent d’élève')}</option></select></div>
            <div class="fld"><label>${L_('الموضوع','Objet')}</label>
              <select class="sel" name="subject">
                ${[L_('تسجيل في فوج','Inscription à un groupe'),L_('درس خصوصي','Cours particulier'),L_('سؤال بيداغوجي','Question pédagogique'),L_('مشكل تقني','Problème technique'),L_('أخرى','Autre')]
                  .map(v=>`<option>${v}</option>`).join('')}</select></div>
          </div>
          <div class="fld req mt4"><label>${L_('الرسالة *','Message *')}</label>
            <textarea class="inp txa" name="msg" rows="6" required placeholder="${L_('اكتب رسالتك هنا…','Écrivez votre message ici…')}"></textarea>
            <span class="help">${L_('سنرد خلال 24 ساعة في أيام العمل.','Réponse sous 24 h les jours ouvrables.')}</span></div>
          <div class="flex gap3 mt5 wrap-f items-c">
            <button class="btn btn--p btn--lg" type="submit">${svg('send','width="18" height="18"')}${t('ctSend')||L_('إرسال الرسالة','Envoyer le message')}</button>
            ${S.whatsapp?`<a class="btn btn--ok" href="${S.whatsappLink||S.whatsapp}" target="_blank" rel="noopener">${svg('wa','width="18" height="18"')}WhatsApp</a>`:''}
            <span class="muted" style="font-size:.82rem">${svg('lock','width="14" height="14" style="display:inline;vertical-align:-2px"')}
              ${L_('بياناتك تُستعمل للرد عليك فقط.','Vos données servent uniquement à vous répondre.')}</span>
          </div>
        </form>
      </div>
      <div style="display:flex;flex-direction:column;gap:18px">
        <div class="cd rv" style="--d:60ms">
          <div class="cd__t mb4" data-i18n="ctCoords">${L_('المعلومات','Coordonnées')}</div>
          ${[['pin',L_('العنوان','Adresse'),L_(S.address,S.addressFr)],['school',L_('المدينة','Ville'),S.city+' — '+S.wilaya+', '+S.country],
             ['phone',L_('الهاتف','Téléphone'),S.phone],['wa','WhatsApp',S.whatsapp],['mail',L_('البريد','E-mail'),S.email],
             ['clock',L_('الأوقات','Horaires'),S.hours]]
            .filter(([,l,v])=>v).map(([ic,l,v])=>`<div class="cinfo">
              <span class="cred__i">${svg(ic)}</span><div><b>${l}</b><p dir="${/[a-zA-Z]/.test(v)&&!/[\u0600-\u06FF]/.test(v)?'ltr':'rtl'}">${v}</p></div></div>`).join('')}
          <div class="flex gap2 mt4 wrap-f">${['fb','ig','yt','tg'].map(k=>S[k]?`<a class="btn btn--g btn--i" href="${S[k]}" target="_blank" rel="noopener" title="${k.toUpperCase()}">${svg(k)}</a>`:'').join('')}</div>
        </div>
        <div class="cd rv" style="--d:120ms;padding:0;overflow:hidden">
          <div class="map">${svg('pin')}<div><b>${S.city}</b><small>${S.wilaya} · ${S.country}</small></div></div>
          <div style="padding:16px 18px">
            <div class="cd__t mb3" style="font-size:.95rem">${L_('أين نجدك؟','Où nous trouver ?')}</div>
            <p class="muted" style="font-size:.86rem;line-height:1.8">${L_('الخميس مليانة، ولاية عين الدفلى — وسط المدينة. الحصص حضورية، والعنوان الدقيق يُرسل عند تأكيد التسجيل.',
              'Khemis Miliana, wilaya d’Aïn Defla — centre-ville. Les séances sont en présentiel ; l’adresse exacte est communiquée à la confirmation de l’inscription.')}</p>
          </div>
        </div>
      </div>
    </div></div>
  </section>`;
}
function bindContact(){
  const f=$('#ctForm'); if(!f) return;
  /* Avant : la promesse d'écriture n'était jamais surveillée → le visiteur
     voyait « message envoyé » même si Firestore refusait (règle, réseau). */
  f.addEventListener('submit', async e=>{
    e.preventDefault();
    const need=['name','contact','msg']; let ok=true;
    need.forEach(n=>{ const el=f.elements[n]; const bad=!el.value.trim();
      el.classList.toggle('err-msg',bad); if(bad) ok=false; });
    if(!ok){ toast(L_('أكمل الحقول المطلوبة *','Complétez les champs obligatoires *'),'er',2600); return; }
    const btn=f.querySelector('button[type="submit"]');
    const label=btn?btn.innerHTML:'';
    if(btn){ btn.disabled=true; btn.innerHTML=t('sending'); }
    try{
      await window.PKdb.add('messages',{from:f.elements.name.value.trim().slice(0,120),
        contact:f.elements.contact.value.trim().slice(0,160),
        level:f.elements.level?f.elements.level.value:'',
        subject:f.elements.subject?f.elements.subject.value:'',
        body:f.elements.msg.value.trim().slice(0,3000), role:'contact'});
      f.reset();
      toast(L_('أُرسلت رسالتك ✓ سنرد قريباً.','Votre message est envoyé ✓ Nous répondrons bientôt.'),'ok',3600);
    }catch(err){
      toast(t('sendErrContact'),'er',5200);
      if(window.console) console.warn('[PK] contact :', (err&&err.code)||err);
    }finally{
      if(btn){ btn.disabled=false; btn.innerHTML=label; }
    }
  });
}

/* ══════════════════ Bandeau CTA partagé ══════════════════ */
function ctaBand(){
  return `<section class="sec">
    <div class="ct"><div class="cta rv">
      <div class="cta__b">
        <span class="bd bd--wt">${svg('spark','width="13" height="13"')}${L_('ابدأ اليوم','Commencez aujourd’hui')}</span>
        <h2 class="hd__t" style="margin-block:14px 10px">${L_('فضاؤك جاهز — سجّل الدخول وابدأ التدريب','Votre espace est prêt — connectez-vous et entraînez-vous')}</h2>
        <p class="hd__i">${L_('دروس منظّمة، تمارين بتصحيح فوري، XP وأوسمة، وجدول حصص واضح. كل شيء مجاني ودون أي اشتراك.',
          'Cours structurés, exercices à correction immédiate, XP et badges, emploi du temps clair. Tout est gratuit, sans aucun abonnement.')}</p>
        <div class="flex gap3 mt5 wrap-f">
          <a class="btn btn--p btn--lg" href="student/index.html">${svg('users','width="18" height="18"')}${t('navLogin')}</a>
          <a class="btn btn--o btn--lg" href="exercises.html">${svg('quiz','width="18" height="18"')}${t('exStart')}</a>
        </div>
      </div>
      <div class="aur" aria-hidden="true"></div>
    </div></div>
  </section>`;
}

/* ══════════════════ AMORÇAGE ══════════════════ */
const RENDERS={levels, lessons, exercises, timetable, about, faq, contact};
function mount(){
  L = window.PKi18n.current();
  const page = (document.documentElement.dataset.page||'').replace(/^student-/,'');
  const host = $('#pub') || $('main');
  if(!host) return;
  const fn = RENDERS[page] || levels;
  host.innerHTML = fn();
  if(page==='lessons') bindLessons();
  if(page==='exercises') bindExercises();
  if(page==='faq') bindFaq();
  if(page==='contact') bindContact();
}

document.addEventListener('DOMContentLoaded', ()=>{
  /* rendu APRÈS hydratation : le contenu publié en ligne s'affiche vraiment */
  const go=()=>{ mount();
    boot((document.documentElement.dataset.page||'index')+'.html');
    initCounters(); initProgress(); replayFx(document); };
  window.PKdb.init().then(go, go);
  document.addEventListener('pk:lang', ()=>{ mount(); initReveal(); initProgress(); replayFx(document); });
  window.PK.setPalette([
    {label:t('navHome'),     href:'index.html',     icon:'grid',  group:t('ftNav')},
    {label:t('navLevels'),   href:'levels.html',    icon:'school',group:t('ftNav')},
    {label:t('navLessons'),  href:'lessons.html',   icon:'book',  group:t('ftNav')},
    {label:t('navEx'),       href:'exercises.html', icon:'quiz',  group:t('ftNav')},
    {label:t('navTimetable'),href:'timetable.html', icon:'cal',   group:t('ftNav')},
    {label:t('navAbout'),    href:'about.html',     icon:'user',  group:t('ftNav')},
    {label:t('navFaq'),      href:'faq.html',       icon:'chat',  group:t('ftNav')},
    {label:t('navContact'),  href:'contact.html',   icon:'send',  group:t('ftNav')},
    {label:t('navLogin'),    href:'student/index.html', icon:'users', group:t('ftSpace')},
    {label:t('navAdmin'),    href:'admin/index.html',   icon:'set',   group:t('ftSpace')},
    {label:t('darkMode'), run:()=>window.PK.toggleTheme(), icon:'moon', keys:'theme dark'}
  ]);
});
})();
