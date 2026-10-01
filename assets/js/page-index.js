/* ══════════════════════════════════════════════════════════════════
   page-index.js · Rendu dynamique de la page d'accueil
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$,$$,t,boot,replayFx,initReveal,toast,confetti,svg} = window.PK;
const D = window.PKdata, X = window.PKxp;
let L = 'ar';
const ar = ()=> L==='ar';
const L_ = (a,f)=> ar() ? a : f;

/* ───────── JOURS ───────── */
const DAYS = {
  sat:{ar:'السبت',   fr:'Samedi',  s:{ar:'السبت',fr:'Sam'}},
  sun:{ar:'الأحد',   fr:'Dimanche',s:{ar:'الأحد',fr:'Dim'}},
  mon:{ar:'الاثنين', fr:'Lundi',   s:{ar:'الاثنين',fr:'Lun'}},
  tue:{ar:'الثلاثاء',fr:'Mardi',   s:{ar:'الثلاثاء',fr:'Mar'}},
  wed:{ar:'الأربعاء',fr:'Mercredi',s:{ar:'الأربعاء',fr:'Mer'}},
  thu:{ar:'الخميس',  fr:'Jeudi',   s:{ar:'الخميس',fr:'Jeu'}}
};
/* jour algérien courant : dimanche=0 … samedi=6 */
function todayKey(){
  const map=['sun','mon','tue','wed','thu','fri','sat'];
  const k = map[new Date().getDay()];
  return DAYS[k] ? k : 'sat';
}

/* ══════════ 1. BANDEAU DÉFILANT ══════════ */
function renderMarquee(){
  const items = D.axes.map(a=>`<span class="mq__p">${svg(a.icon,'width="15" height="15"')}<b>${a.fr}</b> · ${a.ar}</span>`).join('');
  $('#mq').innerHTML = items + items;
}

/* ══════════ 2. STATISTIQUES ══════════ */
function renderStats(){
  const s = D.settings.stats;
  const cards = [
    {n:s.years,     sfx:'+', k:'st1', ic:'clock'},
    {n:s.students,  sfx:'+', k:'st2', ic:'users'},
    {n:s.lessons,   sfx:'+', k:'st3', ic:'book'},
    {n:s.exercises, sfx:'+', k:'st4', ic:'quiz'}
  ];
  $('#stats').innerHTML = cards.map(c=>`
    <div class="st">
      <div class="st__i">${svg(c.ic)}</div>
      <div class="st__n"><span class="cnt-up" data-to="${c.n}">0</span><span>${c.sfx}</span></div>
      <div class="st__l" data-i18n="${c.k}">${t(c.k)}</div>
    </div>`).join('');
}

/* ══════════ 3. NIVEAUX ══════════ */
function renderLevels(){
  $('#levelsGrid').innerHTML = D.levels.map(l=>`
    <article class="lv ${l.cls} rv">
      ${l.hot?`<span class="ribbon" data-i18n="lvHot">${t('lvHot')}</span>`:''}
      <div class="lv__b la">${l.id}</div>
      <div>
        <div class="lv__n">${L_(l.ar,l.fr)}</div>
        <div class="lv__f">${l.fr}</div>
      </div>
      <p class="lv__d">${L_(l.descAr,l.descFr)}</p>
      <ul class="lv__t">
        ${l.topics.map(x=>`<li>${svg('check','width="15" height="15"')}<span>${L_(x[1],x[0])}</span></li>`).join('')}
      </ul>
      <div class="lv__m">
        <span class="bd bd--gy"><span class="la">${D.lessons.filter(x=>x.level===l.id).length}</span> ${t('lvLessons')}</span>
        <span class="bd bd--gy"><span class="la">${D.exercises.filter(x=>x.level===l.id).length}</span> ${t('lvEx')}</span>
        <span class="bd bd--lv"><span class="la">${D.lessons.filter(x=>x.level===l.id).reduce((a,x)=>a+(x.min||0),0)}</span> ${t('lvMin')}</span>
      </div>
    </article>`).join('');
  // sélecteur
  $('#lvSwitch').innerHTML = D.levels.map((l,i)=>`
    <button class="${i===D.levels.length-1?'on':''}" data-lv="${l.id}" role="tab">
      ${l.id} <small>${L_(l.ar.split('—')[0],l.fr.split('—')[0])}</small>
    </button>`).join('');
  $$('#lvSwitch button').forEach(b=> b.addEventListener('click', ()=>{
    $$('#lvSwitch button').forEach(x=>x.classList.toggle('on', x===b));
    renderLevelPanel(b.dataset.lv);
  }));
  renderLevelPanel(D.levels[D.levels.length-1].id);
}
function renderLevelPanel(id){
  const l = D.byId(D.levels,id);
  const ls = D.lessonsOf(id), ex = D.exercisesOf(id);
  $('#lvPanel').innerHTML = `
    <div class="lpn g g-main" style="gap:32px">
      <div>
        <div class="flex items-c gap3 mb4 wrap-f">
          <span class="lv__b ${l.cls}" style="width:52px;height:52px;border-radius:16px;font-size:1rem;background:var(--lvt);color:var(--lvc)">${l.id}</span>
          <div><h3>${L_(l.ar,l.fr)}</h3><p class="muted" style="font-size:.9rem">${L_(l.descAr,l.descFr)}</p></div>
        </div>
        <h4 class="mb3" style="font-size:.95rem">${t('lsBadge')} <span class="bd bd--gy la">${ls.length}</span></h4>
        <div class="g gap3">
          ${ls.length ? ls.slice(0,3).map(x=>lessonRow(x)).join('') : `<div class="empty" style="padding:26px"><p>${t('empty')}</p></div>`}
        </div>
        <h4 class="mt5 mb3" style="font-size:.95rem">${t('exBadge')} <span class="bd bd--gy la">${ex.length}</span></h4>
        <div class="g gap3">
          ${ex.length ? ex.slice(0,2).map(x=>exRow(x)).join('') : `<div class="empty" style="padding:26px"><p>${t('empty')}</p></div>`}
        </div>
      </div>
      <div>
        <div class="cd cd--flat" style="background:var(--bg2)">
          <div class="cd__t mb4" style="font-size:.95rem">${t('lvTopics')}</div>
          ${l.topics.map(x=>`<div class="mini-row">${svg('check','width="15" height="15" style="color:var(--ok)')}<span>${L_(x[1],x[0])}</span></div>`).join('')}
          <div class="divider mt4 mb4"></div>
          <div class="flex just-b" style="font-size:.85rem"><span class="muted">${t('lvMin')}</span><b class="la">${D.lessons.filter(x=>x.level===l.id).reduce((a,x)=>a+(x.min||0),0)} min</b></div>
          <div class="flex just-b mt3" style="font-size:.85rem"><span class="muted">${t('lvEx')}</span><b class="la">${D.exercises.filter(x=>x.level===l.id).length}</b></div>
          <a href="exercises.html?level=${l.id}" class="btn btn--s btn--sm btn--blk mt4">${t('start')} ${svg('arrow','width="15" height="15"')}</a>
        </div>
      </div>
    </div>`;
  replayFx($('#lvPanel'));
}

/* ── lignes réutilisables ── */
function lessonRow(x){
  const ax = D.axes.find(a=>a.id===x.ax) || {fr:x.ax,ar:x.ax,icon:'book'};
  return `<div class="itm">
    <span class="ico ico--sm">${svg(x.icon||ax.icon)}</span>
    <div class="itm__b">
      <b>${L_(x.ar,x.fr)}</b>
      <small>${svg('clock','width="13" height="13"')}<span class="la">${x.min} ${t('lsMin')}</span>
        ${svg('abc','width="13" height="13"')}${ax.fr}
        ${x.files?svg('file','width="13" height="13"')+`<span class="la">${x.files}</span>`:''}</small>
    </div>
    <div class="itm__s">
      ${x.done?`<span class="bd bd--ok">${svg('check')} ${t('lsDone')}</span>`:''}
      ${x.isNew?`<span class="bd">${t('lsNew')}</span>`:''}
      <span class="pill-xp">${svg('bolt','width="13" height="13"')}+${x.xp}</span>
      <a class="btn btn--g btn--is" href="student/lesson.html?id=${x.id}" aria-label="${t('lsStart')}">${svg('arrow','width="15" height="15"')}</a>
    </div>
  </div>`;
}
function exRow(x){
  const ax = D.axes.find(a=>a.id===x.ax) || {fr:x.ax,ar:x.ax};
  return `<div class="itm">
    <span class="ico ico--sm ico--pu">${svg('quiz')}</span>
    <div class="itm__b">
      <b>${L_(x.titleAr,x.titleFr)}</b>
      <small><span class="la">${x.q} ${t('exQ')}</span> · <span class="la">${x.min} min</span> · ${ax.fr} ·
        <span class="diff diff--${x.diff}"><i class="${x.diff>=1?'on':''}"></i><i class="${x.diff>=2?'on':''}"></i><i class="${x.diff>=3?'on':''}"></i></span></small>
    </div>
    <div class="itm__s">
      <span class="bd bd--lv ${D.byId(D.levels,x.level).cls}">${x.level}</span>
      <span class="pill-xp">${svg('bolt','width="13" height="13"')}${x.xpMax} XP</span>
      <a class="btn btn--p btn--sm" href="student/exercise.html?id=${x.id}">${t('exStart')}</a>
    </div>
  </div>`;
}

/* ══════════ 4. AXES ══════════ */
function renderAxes(){
  $('#axesGrid').innerHTML = D.axes.map(a=>`
    <a href="lessons.html?ax=${a.id}" class="ax rv">
      <span class="ico">${svg(a.icon)}</span>
      <span class="ax__t">${a.fr}<small>${a.ar}</small></span>
      <span class="bd bd--gy la" style="margin-inline-start:auto">${a.count}</span>
    </a>`).join('');
}

/* ══════════ 5. EMPLOI DU TEMPS ══════════ */
let curDay = 'all';
function renderTimetable(){
  const tk = todayKey();
  // sélecteur de jour
  $('#daySel').innerHTML =
    `<button class="${curDay==='all'?'on':''}" data-d="all">${L_('الأسبوع كاملاً','Toute la semaine')}</button>` +
    D.days.map(d=>`<button class="${curDay===d?'on':''}" data-d="${d}">${DAYS[d][ar()?'ar':'fr']}<small class="la">${DAYS[d].s[ar()?'ar':'fr']}</small></button>`).join('');
  $$('#daySel button').forEach(b=> b.addEventListener('click',()=>{ curDay=b.dataset.d; renderTimetable(); }));

  // cartes des séances du jour sélectionné
  const dd = curDay==='all' ? D.days : [curDay];
  let cards = '';
  dd.forEach(d=>{
    const gs = D.groups.filter(g=>g.day===d).sort((a,b)=>a.start.localeCompare(b.start));
    gs.forEach(g=>{ cards += sessionCard(g,d); });
  });
  $('#dayCards').innerHTML = cards || `<div class="empty" style="grid-column:1/-1"><p>${t('ttEmpty')}</p></div>`;

  // tableau hebdomadaire
  let html = `<thead><tr><th>${t('ttTime')}</th>`;
  D.days.forEach(d=> html += `<th class="${d===tk?'today':''}">${DAYS[d][ar()?'ar':'fr']}</th>`);
  html += `</tr></thead><tbody>`;
  D.slots.forEach(slot=>{
    html += `<tr><th class="la">${slot}</th>`;
    D.days.forEach(d=>{
      const g = D.slotAt(d, slot);
      html += `<td>${g ? cellBlock(g) : `<span class="tt__e">—</span>`}</td>`;
    });
    html += `</tr>`;
  });
  $('#ttTable').innerHTML = html + `</tbody>`;

  // légende
  $('#ttLegend').innerHTML = D.levels.map(l=>`
    <span><i style="background:var(--lvt);border:1px solid var(--lvc);--lvc:var(--${l.cls==='lv-1am'?'cy':l.cls==='lv-2am'?'pu':l.cls==='lv-3am'?'ok':'ac'});--lvt:var(--${l.cls==='lv-1am'?'cy-t':l.cls==='lv-2am'?'pu-t':l.cls==='lv-3am'?'ok-t':'ac-tint'})"></i>${l.id} — ${L_(l.ar,l.fr)}</span>`).join('')
    + `<span style="margin-inline-start:auto">${svg('school','width="15" height="15"')} ${t('ttNote')}</span>`;
}
function cellBlock(g){
  return `<div class="tt__c ${g.cls}" style="--lvc:var(--lvc);--lvt:var(--lvt)" title="${g.name}">
    <b>${g.name}</b>
    <small>${L_(g.schoolAr,g.schoolFr)}</small>
    <i>${g.teacher} · ${g.start}–${g.end}</i>
  </div>`;
}
function sessionCard(g,d){
  const free = g.capacity - g.enrolled;
  return `<div class="ses ${g.cls} rv">
    <div class="ses__h la">${g.start}<br><span style="font-size:.75rem;opacity:.7">${g.end}</span></div>
    <div class="ses__b">
      <b>${g.name} · ${L_(D.byId(D.levels,g.level).ar, D.byId(D.levels,g.level).fr)}</b>
      <span>${svg('school')} ${L_(g.schoolAr,g.schoolFr)}</span>
      <span>${svg('user')} ${g.teacher} · ${svg('clock')} ${DAYS[d][ar()?'ar':'fr']}</span>
    </div>
    <div style="text-align:end;flex:none">
      ${free>0 ? `<span class="bd bd--ok la">${free} ${t('grFree')}</span>` : `<span class="bd bd--er">${t('grFull')}</span>`}
      <div class="bd bd--gy mt3">${svg('pin','width="12" height="12"')}${t(g.mode==='onsite'?'onsite':'online')}</div>
    </div>
  </div>`;
}

/* ══════════ 6. LEÇONS + EXERCICES ══════════ */
function renderLessons(){
  $('#lessonsGrid').innerHTML = D.lessons.slice(0,6).map(x=>{
    const ax = D.axes.find(a=>a.id===x.ax) || {fr:x.ax,ar:x.ax};
    const lv = D.byId(D.levels,x.level);
    return `<article class="ls rv">
      <div class="ls__th">${svg(x.icon||ax.icon)}</div>
      <div class="flex gap2 wrap-f">
        <span class="bd bd--lv ${lv.cls}">${x.level}</span>
        <span class="bd bd--gy">${ax.fr}</span>
        ${x.isNew?`<span class="bd">${t('lsNew')}</span>`:''}
        ${x.done?`<span class="bd bd--ok">${svg('check')} ${t('lsDone')}</span>`:''}
      </div>
      <div class="ls__t">${L_(x.ar,x.fr)}</div>
      <p class="muted" style="font-size:.89rem;line-height:1.8">${L_(x.sumAr,x.sumFr)}</p>
      <div class="ls__m">
        <span>${svg('clock')}<span class="la">${x.min} ${t('lsMin')}</span></span>
        ${x.files?`<span>${svg('file')}<span class="la">${x.files} ${t('lsPdf')}</span></span>`:''}
        ${x.video?`<span>${svg('play')}${t('lsVideo')}</span>`:''}
        <span class="pill-xp" style="margin-inline-start:auto">${svg('bolt','width="13" height="13"')}+${x.xp}</span>
      </div>
    </article>`;
  }).join('');
}
function renderExercises(){
  $('#exGrid').innerHTML = D.exercises.map(x=>{
    const lv = D.byId(D.levels,x.level);
    const ax = D.axes.find(a=>a.id===x.ax) || {fr:x.ax};
    return `<div class="cd cd--h rv">
      <div class="flex gap2 wrap-f mb4">
        <span class="bd bd--lv ${lv.cls}">${x.level}</span>
        <span class="bd bd--gy">${ax.fr}</span>
        <span class="qtype qtype--${x.type}">${t('ty'+x.type.charAt(0).toUpperCase()+x.type.slice(1))}</span>
        <span class="diff diff--${x.diff}" title="${t('diff'+x.diff)}"><i class="on"></i><i class="${x.diff>=2?'on':''}"></i><i class="${x.diff>=3?'on':''}"></i></span>
      </div>
      <h3 style="font-size:1.05rem;font-family:var(--ffl)">${L_(x.titleAr,x.titleFr)}</h3>
      <p class="muted mt3" style="font-size:.9rem;line-height:1.8">${L_(x.descAr,x.descFr)}</p>
      <div class="cd__f">
        <span class="bd bd--gy la">${svg('quiz','width="12" height="12"')}${x.q}</span>
        <span class="bd bd--gy la">${svg('clock','width="12" height="12"')}${x.min} min</span>
        <span class="bd bd--gy la">${svg('refresh','width="12" height="12"')}${x.tries}</span>
        <span class="pill-xp" style="margin-inline-start:auto">${svg('bolt','width="13" height="13"')}≤ ${x.xpMax} XP</span>
        <a href="student/exercise.html?id=${x.id}" class="btn btn--p btn--sm">${t('exStart')}</a>
      </div>
    </div>`;
  }).join('');
}

/* ══════════ 7. FAQ ══════════ */
function renderFaq(){
  let out='';
  for(let i=1;i<=8;i++){
    const q='fq'+i+'q', a='fq'+i+'a';
    if(!window.I18N[q]) break;
    out += `<details class="acc"${i===1?' open':''}><summary>${t(q)}</summary><div class="acc__b">${t(a)}</div></details>`;
  }
  $('#faqList').innerHTML = out;
}

/* ══════════ 8. MINI-QUIZ DU HÉROS (vraiment interactif) ══════════ */
const HQ = [
  {t:"« Elle …… ses devoirs chaque soir. »", o:["fait","fais","font"], a:0, d:1,
   eFr:"3ᵉ personne du singulier → <b>fait</b>.", eAr:"الفاعل مفرد غائب (Elle) → <b>fait</b>."},
  {t:"« Le livre …… je t'ai parlé est épuisé. »", o:["que","dont","qui"], a:1, d:2,
   eFr:"On dit « parler <b>de</b> » → <b>dont</b>.", eAr:"الفعل parler يتعدّى بـ <b>de</b> → <b>dont</b>."},
  {t:"« Elles sont …… hier. »", o:["parti","parties","partis"], a:1, d:2,
   eFr:"Auxiliaire <b>être</b> → accord au féminin pluriel : <b>parties</b>.", eAr:"المساعد être → اتفاق مع جمع مؤنث: <b>parties</b>."}
];
let hqI = 0, hqXp = 0, hqLocked = false;
function renderHeroQuiz(){
  const q = HQ[hqI];
  $('#hqText').textContent = q.t;
  $('#hqCount').textContent = (hqI+1) + '/' + HQ.length;
  $('#hqFb').innerHTML = '';
  $('#hqOpts').innerHTML = q.o.map((o,i)=>`<button class="opt" data-i="${i}"><i>${'ABC'[i]}</i>${o}</button>`).join('');
  hqLocked = false;
  $$('#hqOpts .opt').forEach(b=> b.addEventListener('click', ()=> answerHero(+b.dataset.i, b)));
}
function answerHero(i, el){
  if(hqLocked) return;
  hqLocked = true;
  const q = HQ[hqI], ok = i === q.a;
  $$('#hqOpts .opt').forEach((b,j)=>{
    b.classList.add('dis');
    if(j===q.a) b.classList.add('ok');
    else if(j===i) b.classList.add('no');
  });
  const fb = $('#hqFb');
  if(ok){
    const r = X.computeXP({correct:1,total:1,diff:q.d,streak:9,isQuiz:false,todayXp:0});
    hqXp += r.xp;
    fb.innerHTML = `<b style="color:#8FF5D0">✓ ${t('exCorrect')} · +${r.xp} XP</b><div style="opacity:.9">${L_(q.eAr,q.eFr)}</div>`;
  }else{
    fb.innerHTML = `<b style="color:#FFC9C9">✕ ${t('exWrong')}</b><div style="opacity:.9">${L_(q.eAr,q.eFr)}</div>`;
  }
  setTimeout(()=>{
    hqI = (hqI+1) % HQ.length;
    if(hqI===0){
      fb.innerHTML = `<b style="color:#fff">⚡ ${hqXp} XP</b> · <span style="opacity:.85">${t('exRetry')}</span>`;
      hqXp = 0;
      setTimeout(renderHeroQuiz, 1800);
    } else renderHeroQuiz();
  }, 2600);
}

/* ══════════ 9. AMORÇAGE ══════════ */
function renderAll(){
  L = window.PKi18n.current();
  renderMarquee(); renderStats(); renderLevels(); renderAxes();
  renderTimetable(); renderLessons(); renderExercises(); renderFaq();
  window.PKi18n.translateDom(L);       // traduit le DOM fraîchement injecté (sans événement)
  replayFx(); initReveal();
  window.PK.initCounters(); window.PK.initSpot();
}
document.addEventListener('DOMContentLoaded', ()=>{
  boot('index.html');
  renderHeroQuiz();
  renderAll();
  /* re-rendu APRÈS hydratation : le contenu publié apparaît aussi sur l'accueil */
  window.PKdb.init().then(()=>{ renderAll(); }, ()=>{});
  document.addEventListener('pk:lang', renderAll);
  // palette de commandes enrichie
  window.PK.setPalette([
    {label:t('navHome'),     href:'index.html',     icon:'grid',   group:t('ftNav')},
    {label:t('navLevels'),   href:'levels.html',    icon:'layers', group:t('ftNav')},
    {label:t('navLessons'),  href:'lessons.html',   icon:'book',   group:t('ftNav')},
    {label:t('navEx'),       href:'exercises.html', icon:'quiz',   group:t('ftNav')},
    {label:t('navTimetable'),href:'timetable.html', icon:'cal',    group:t('ftNav')},
    {label:t('navAbout'),    href:'about.html',     icon:'user',   group:t('ftNav')},
    {label:t('navFaq'),      href:'faq.html',       icon:'chat',   group:t('ftNav')},
    {label:t('navContact'),  href:'contact.html',   icon:'send',   group:t('ftNav')},
    {label:t('navLogin'),    href:'student/index.html', icon:'users', group:t('ftSpace')},
    {label:t('navAdmin'),    href:'admin/index.html',   icon:'set',   group:t('ftSpace')},
    {label:t('darkMode'), run:()=>window.PK.toggleTheme(), icon:'moon', keys:'theme dark'}
  ]);
});
})();
