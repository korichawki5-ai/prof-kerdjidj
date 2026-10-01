/* ══════════════════════════════════════════════════════════════════
   05-app-shell.js · Coquille des espaces connectés (élève + admin)
   Barre latérale, en-tête d'app, garde de rôle
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, svg, logo, t, boot, toast, replayFx, initReveal} = window.PK;

/* ───────── BARRES LATÉRALES ───────── */
const STUDENT_NAV = [
  {g:'sbMain', items:[
    {k:'sbDash',    href:'index.html',         icon:'grid'},
    {k:'sbLessons', href:'lessons.html',       icon:'book',   cnt:3},
    {k:'sbEx',      href:'exercises.html',     icon:'quiz',   cnt:2},
  ]},
  {g:'sbTrack', items:[
    {k:'sbProg',    href:'progress.html',      icon:'trend'},
    {k:'sbTt',      href:'timetable.html',     icon:'cal'},
    {k:'sbAnn',     href:'announcements.html', icon:'bell', cnt:2},
    {k:'sbProfile', href:'profile.html',       icon:'user'},
  ]}
];
/* Le panneau d'administration est UNE page à modules : chaque entrée pointe
   vers index.html#module (aucun lien mort, chargement instantané). */
const ADMIN_NAV = [
  {g:'adMain', items:[ {k:'adDash', href:'index.html#overview', icon:'grid'} ]},
  {g:'adTeach', items:[
    {k:'adLessons', href:'index.html#lessons',  icon:'book'},
    {k:'adQuiz',    href:'index.html#quiz',     icon:'quiz',  cnt:5},
    {k:'adQbank',   href:'index.html#bank',     icon:'layers'},
    {k:'adEx',      href:'index.html#lessons',  icon:'write', cnt:12},
  ]},
  {g:'adPpl', items:[
    {k:'adStudents',href:'index.html#students', icon:'users'},
    {k:'adGroups',  href:'index.html#groups',   icon:'school'},
    {k:'adTt',      href:'index.html#tt',       icon:'cal'},
    {k:'adProg',    href:'index.html#prog',     icon:'trend'},
  ]},
  {g:'adSite', items:[
    {k:'adAnn',     href:'index.html#announce', icon:'bell'},
    {k:'adMsg',     href:'index.html#messages', icon:'msg',   cnt:3},
    {k:'adSet',     href:'index.html#settings', icon:'set'},
  ]}
];

/** Lien actif : même fichier + même module (#hash) si présent. */
function isOn(href, active){
  const [f,h] = href.split('#'), [af,ah] = String(active).split('#');
  if(f !== af) return false;
  if(!h) return !ah;
  return h === (ah || String(location.hash).replace('#',''));
}

function sidebar(role, active){
  const nav = role==='admin' ? ADMIN_NAV : STUDENT_NAV;
  const isAdm = role==='admin';
  const brandTxt = isAdm
    ? `<span class="ar">لوحة الإدارة</span><span class="fr">Administration</span>`
    : `<span class="ar">فضاء التلميذ</span><span class="fr">Espace Élève</span>`;
  const me = isAdm
    ? {ini:'PK', ar:'الأستاذة كرجيج', fr:'Prof. Kerdjidj', sub:'Administratrice', col:'linear-gradient(140deg,#1E4FD8,#0B2470)'}
    : (function(){ const s=window.PKdata.me;
        if(!s) return {ini:'··', ar:'', fr:'', sub:'', col:'linear-gradient(140deg,#8a93a6,#5b6472)'};
        const ini=((s.fr||s.ar||'--').split(' ').map(w=>w[0]).join('')).slice(0,2).toUpperCase();
        return {ini, ar:s.ar||'', fr:s.fr||'', sub:(s.level||'')+' · '+((window.PKdata.groupOf(s.group)||{}).name||''), col:s.color||'linear-gradient(140deg,#1E4FD8,#0B2470)'}; })();

  return `<aside class="sb">
    <a class="br" href="${isAdm?'index.html':'../index.html'}">
      <span class="br__m" style="width:42px;height:42px;border-radius:13px">${logo(42)}</span>
      <span class="br__t"><span class="br__n" style="font-size:.93rem">${brandTxt}</span>
        <span class="br__sb">Prof. Kerdjidj</span></span>
    </a>
    ${nav.map(sec=>`
      <div class="sb__lb" data-i18n="${sec.g}">${t(sec.g)}</div>
      ${sec.items.map(i=>`
        <a class="sb__l${isOn(i.href,active)?' on':''}" href="${i.href}">
          ${svg(i.icon)}<span data-i18n="${i.k}">${t(i.k)}</span>
          ${i.cnt?`<span class="cnt la">${i.cnt}</span>`:''}
        </a>`).join('')}
    `).join('')}
    <div class="sb__ft">
      <div class="sb__u">
        <span class="av" style="background:${me.col}">${me.ini}</span>
        <div style="min-width:0"><b><span class="ar">${me.ar}</span><span class="fr">${me.fr}</span></b><small>${me.sub}</small></div>
      </div>
      <a class="sb__l mt3" href="${isAdm?'../index.html':'../index.html'}" style="color:var(--er)">
        ${svg('logout')}<span data-i18n="sbOut">${t('sbOut')}</span>
      </a>
    </div>
  </aside>`;
}

/* ───────── BARRE SUPÉRIEURE D'APP ───────── */
function appTop(opts){
  opts = opts||{};
  return `<div class="mn__t">
    <div>
      ${opts.crumb?`<div class="crumb">${opts.crumb}</div>`:''}
      <h1>${opts.title||''}</h1>
      ${opts.sub?`<p>${opts.sub}</p>`:''}
    </div>
    <div class="mn__a">
      ${opts.search!==false?`<div class="srch" style="max-width:280px">${svg('search')}
        <input class="inp inp--sm" id="appSearch" data-i18n-ph="stuSearch" placeholder="${t('stuSearch')||'بحث…'}"></div>`:''}
      <div class="lgsw"><button data-lang="ar">AR</button><button data-lang="fr">FR</button></div>
      <button class="btn btn--g btn--i" data-theme-btn title="Theme">${svg('moon')}</button>
      ${opts.actions||''}
    </div>
  </div>`;
}

/* ───────── ÉCOUTEURS DÉLÉGUÉS (installés une seule fois) ───────── */
let _bound = false;
function bindDelegated(){
  if(_bound) return; _bound = true;
  document.addEventListener('click', e=>{
    const lang = e.target.closest('.lgsw button[data-lang]');
    if(lang){ window.PK.setLang(lang.dataset.lang); return; }
    if(e.target.closest('[data-theme-btn]')){ window.PK.toggleTheme(); return; }
    const tab = e.target.closest('[data-atab]');
    if(tab){
      const scope = tab.closest('.tabs');
      if(scope) Array.from(scope.querySelectorAll('[data-atab]')).forEach(b=>b.classList.toggle('on', b===tab));
      Array.from(document.querySelectorAll('.atab')).forEach(pn=> pn.classList.toggle('hide', pn.dataset.panel !== tab.dataset.atab));
      const pn = document.querySelector('.atab[data-panel="'+tab.dataset.atab+'"]');
      if(pn){ pn.classList.remove('lpn'); void pn.offsetWidth; pn.classList.add('lpn'); window.PK.replayFx(pn); window.PK.initReveal(pn); }
    }
  });
}

/* ───────── MONTAGE ───────── */
function mountApp(role, active, opts){
  const host = $('#app');
  if(!host) return;
  host.className = 'app' + (role==='admin' ? ' admin-shell' : '');
  host.innerHTML = sidebar(role, active) + `<main class="mn" id="mn"></main>`;
  const mn = $('#mn');
  if(opts && opts.top !== false) mn.insertAdjacentHTML('afterbegin', appTop(opts));
  bindDelegated();
  return mn;
}

/* ───────── بوابة فضاء التلميذ: اتصال Google ثم اختيار المستوى ─────────
   لا محتوى افتراضي: بدون دخول ← بطاقة اتصال؛ بدخول بلا مستوى ← بوابة
   اختيار السنة (1AM→4AM) تُحفظ في users/{uid} وتبقى طوال السنة.        */
const PKgate = {
  html(){
    const D = window.PKdata, m = D.me, t = window.PKi18n.t, svg = window.PK.svg;
    if(!m){
      return `<section class="gate"><div class="gate__c">${svg('lock','width="36" height="36"')}
        <h2>${t('loginNeeded')}</h2>
        <button class="btn btn--p btn--lg" data-gate-login>${t('navLogin')} · Google</button>
        <p class="gate__s">${t('notConnected')}</p></div></section>`;
    }
    if(!m.level && m.role !== 'admin'){
      return `<section class="gate"><div class="gate__c">${svg('school','width="36" height="36"')}
        <h2>${t('chooseLevelTitle')}</h2>
        <p class="gate__s">${t('chooseLevelSub')}</p>
        <div class="gate__lv">${D.levels.map(l=>`<button class="gate__b ${l.cls}" data-level="${l.id}"><b>${window.PKi18n.current()==='ar'?l.ar:l.fr}</b></button>`).join('')}</div>
        </div></section>`;
    }
    return '';
  },
  bind(mn, after){
    const lg = mn.querySelector('[data-gate-login]');
    if(lg) lg.addEventListener('click', ()=>{ window.PKdb.loginGoogle().catch(()=>{}); });
    mn.querySelectorAll('[data-level]').forEach(b=> b.addEventListener('click', async ()=>{
      const r = await window.PKdb.chooseLevel(b.dataset.level);
      if(r && r.ok){ window.PK.toast(window.PKi18n.t('levelSaved'),'ok',2600); if(after) after(); }
    }));
  }
};

/* ───────── AMORÇAGE D'UNE PAGE D'APP ───────── */
function bootApp(role, active, opts, render){
  document.addEventListener('DOMContentLoaded', ()=>{
    boot(null);                       // injecte sprite + palette + raccourcis
    const mn = mountApp(role, active, opts);
    const doRender = (m)=>{ if(render) render(m||mn); replayFx(m||mn); initReveal(m||mn); };
    document.addEventListener('pk:lang', ()=>{
      // reconstruit la coquille puis le contenu dans la nouvelle langue
      const host = $('#app');
      host.innerHTML = sidebar(role, active) + `<main class="mn" id="mn"></main>`;
      const mn2 = $('#mn');
      if(opts && opts.top !== false) mn2.insertAdjacentHTML('afterbegin', appTop(opts));
      bindDelegated();
      window.PKi18n.translateDom(window.PKi18n.current());
      doRender(mn2);
    });
    /* rendu initial APRÈS hydratation Firestore : jamais de données fantômes */
    window.PKdb.init().then(()=>{ doRender(); });
    document.addEventListener('pk:me', ()=>{
      const host=$('#app');
      if(host && role==='student'){ host.innerHTML = sidebar(role, active) + `<main class="mn" id="mn"></main>`; bindDelegated(); }
      const m=$('#mn'); if(m) doRender(m);
    });
  });
}

window.PKapp = {sidebar, appTop, mountApp, bootApp, bindDelegated, isOn, STUDENT_NAV, ADMIN_NAV, PKgate};
})();
