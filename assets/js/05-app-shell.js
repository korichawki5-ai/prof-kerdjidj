/* ══════════════════════════════════════════════════════════════════
   05-app-shell.js · Coquille des espaces connectés (élève + admin)
   Barre latérale, en-tête d'app, porte d'entrée (connexion / inscription)
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, svg, logo, t, boot, toast, replayFx, initReveal} = window.PK;

/* ───────── BARRES LATÉRALES ───────── */
const STUDENT_NAV = [
  {g:'sbMain', items:[
    {k:'sbDash',    href:'/student/index.html',         icon:'grid'},
    {k:'sbLessons', href:'/student/lessons.html',       icon:'book',   cnt:3},
    {k:'sbEx',      href:'/student/exercises.html',     icon:'quiz',   cnt:2},
  ]},
  {g:'sbTrack', items:[
    {k:'sbProg',    href:'/student/progress.html',      icon:'trend'},
    {k:'sbTt',      href:'/student/timetable.html',     icon:'cal'},
    {k:'sbAnn',     href:'/student/announcements.html', icon:'bell',   cnt:2},
    {k:'sbProfile', href:'/student/profile.html',       icon:'user'},
  ]}
];
/* Le panneau d'administration est UNE page à modules : chaque entrée pointe
   vers index.html#module (aucun lien mort, chargement instantané). */
const ADMIN_NAV = [
  {g:'adMain', items:[ {k:'adDash', href:'/admin/index.html#overview', icon:'grid'} ]},
  {g:'adTeach', items:[
    {k:'adLessons', href:'/admin/index.html#lessons',  icon:'book'},
    {k:'adQuiz',    href:'/admin/index.html#quiz',     icon:'quiz',  cnt:5},
    {k:'adQbank',   href:'/admin/index.html#bank',     icon:'layers'},
    {k:'adEx',      href:'/admin/index.html#lessons',  icon:'write', cnt:12},
  ]},
  {g:'adPpl', items:[
    {k:'adStudents',href:'/admin/index.html#students', icon:'users'},
    {k:'adGroups',  href:'/admin/index.html#groups',   icon:'school'},
    {k:'adTt',      href:'/admin/index.html#tt',       icon:'cal'},
    {k:'adProg',    href:'/admin/index.html#prog',     icon:'trend'},
  ]},
  {g:'adSite', items:[
    {k:'adAnn',     href:'/admin/index.html#announce', icon:'bell'},
    {k:'adMsg',     href:'/admin/index.html#messages', icon:'msg',   cnt:3},
    {k:'adSet',     href:'/admin/index.html#settings', icon:'set'},
  ]}
];

/** Lien actif : même fichier + même module (#hash) si présent. */
function isOn(href, active){
  const [f,h] = String(href).split('#'), [af,ah] = String(active).split('#');
  const base = p => String(p).replace(/^.*\//,'');
  if(base(f) !== base(af)) return false;
  if(!h) return !ah;
  const cur = ah || String(location.hash).replace('#','');
  return h === cur || (h === 'overview' && !cur);
}

function sidebar(role, active){
  const nav = role==='admin' ? ADMIN_NAV : STUDENT_NAV;
  const isAdm = role==='admin';
  const brandTxt = isAdm
    ? `<span class="ar">لوحة الإدارة</span><span class="fr">Administration</span>`
    : `<span class="ar">فضاء التلميذ</span><span class="fr">Espace Élève</span>`;
  const me = isAdm
    ? {ini:'PK', ar:'الأستاذة قرجيج', fr:'Prof. Kerdjidj', sub:'Administratrice', col:'linear-gradient(140deg,#1E4FD8,#0B2470)'}
    : (function(){ const s=window.PKdata.me;
        if(!s) return {ini:'··', ar:'', fr:'', sub:'', col:'linear-gradient(140deg,#8a93a6,#5b6472)'};
        const ini=((s.fr||s.ar||'--').split(' ').map(w=>w[0]).join('')).slice(0,2).toUpperCase();
        return {ini, ar:s.ar||'', fr:s.fr||'', sub:(s.level||'')+' · '+((window.PKdata.groupOf(s.group)||{}).name||''), col:s.color||'linear-gradient(140deg,#1E4FD8,#0B2470)'}; })();

  return `<aside class="sb">
    <a class="br" href="${isAdm?'/admin/index.html':'/index.html'}">
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
      <button type="button" class="sb__l sb__out" data-logout>
        ${svg('logout')}<span data-i18n="sbOut">${t('sbOut')}</span>
      </button>
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
    const out = e.target.closest('[data-logout]');
    if(out){ e.preventDefault(); doLogout(); return; }
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
/** Déconnexion réelle puis retour à l'accueil public. */
async function doLogout(){
  try{ await window.PKdb.logout(); }catch(e){}
  toast(window.PKi18n.t('sbOut')+' ✓','info',1600);
  setTimeout(()=>{ location.href = '/index.html'; }, 500);
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

/* ══════════════════════════════════════════════════════════════════
   PORTE D'ENTRÉE · deux usages :
     · élève  → création de compte / connexion, puis niveau + intérêts
     · admin  → une seule chose à l'écran : la connexion de la professeure
   Aucun contenu de l'espace n'est monté tant que l'identité n'est pas
   vérifiée (le rôle admin est confirmé côté Firestore).
   ══════════════════════════════════════════════════════════════════ */
function notice(){
  /* affiche l'avertissement « non connecté » uniquement en mode démo */
  const off = !window.PKdb || window.PKdb.mock || window.PKdb.failed;
  return off ? `<p class="gate__s" data-i18n="notConnected">${t('notConnected')}</p>` : '';
}
function authErrorBox(){
  return `<p class="gate__err hide" id="gateErr" role="alert"></p>`;
}
/** Écran de connexion / création de compte. */
function loginScreen(role){
  const isAdm = role === 'admin';
  const title = isAdm ? t('adminLoginTitle') : t('authTitle');
  const sub   = isAdm ? t('adminLoginSub')   : t('authSub');
  return `<section class="gate"><div class="gate__c gate__c--wide">
    <span class="gate__ic">${svg(isAdm?'lock':'user','width="34" height="34"')}</span>
    <h2>${title}</h2>
    <p class="gate__s">${sub}</p>
    ${isAdm ? '' : `<div class="tabs gate__tabs">
      <button type="button" class="on" data-auth-tab="signin" data-gate-login>${t('authSigninTab')}</button>
      <button type="button" data-auth-tab="signup">${t('authSignupTab')}</button>
    </div>`}
    <form class="gate__form" id="authSigninForm" novalidate>
      <div class="fld"><label>${t('authEmail')}</label>
        <input class="inp" type="email" name="email" dir="ltr" autocomplete="email" required></div>
      <div class="fld"><label>${t('authPass')}</label>
        <input class="inp" type="password" name="password" dir="ltr" autocomplete="current-password" required></div>
      <button class="btn btn--p btn--blk btn--lg" type="submit">${t('authSubmit')}</button>
      <button type="button" class="gate__lnk" data-gate-forgot>${t('authForgot')}</button>
    </form>
    ${isAdm ? '' : `<form class="gate__form hide" id="authSignupForm" novalidate>
      <div class="fld"><label>${t('authName')}</label>
        <input class="inp" type="text" name="name" autocomplete="name" placeholder="${t('authNamePh')}"></div>
      <div class="fld"><label>${t('authEmail')}</label>
        <input class="inp" type="email" name="email" dir="ltr" autocomplete="email" required></div>
      <div class="fld"><label>${t('authPass')}</label>
        <input class="inp" type="password" name="password" dir="ltr" autocomplete="new-password" required placeholder="${t('authPassPh')}"></div>
      <button class="btn btn--p btn--blk btn--lg" type="submit">${t('authStart')}</button>
    </form>`}
    ${authErrorBox()}
    <div class="gate__or"><i></i><span>${t('authOr')}</span><i></i></div>
    <button type="button" class="btn btn--g btn--blk btn--lg" data-gate-google>${svg('users','width="18" height="18"')}${t('authGoogle')}</button>
    ${notice()}
    <a class="gate__lnk" href="/index.html">${svg('arrow','width="14" height="14"')} ${t('viewPublic')}</a>
  </div></section>`;
}
/** Écran « première fois » : nom + niveau + centres d'intérêt. */
function onboardScreen(){
  const D = window.PKdata, m = D.me || {};
  const name = m.ar || m.fr || '';
  return `<section class="gate"><div class="gate__c gate__c--wide">
    <span class="gate__ic">${svg('spark','width="34" height="34"')}</span>
    <h2>${t('onboardTitle')}</h2>
    <p class="gate__s">${t('onboardSub')}</p>
    <form class="gate__onboard" id="onboardForm" novalidate>
      <div class="fld"><label for="onboardName">${t('authName')}</label>
        <input class="inp" id="onboardName" name="name" type="text" autocomplete="name" value="${name.replace(/"/g,'&quot;')}" placeholder="${t('authNamePh')}"></div>
      <div class="fld mt4"><label>${t('chooseLevelTitle')}</label>
        <div class="gate__lv">${D.levels.map(l=>`<button type="button" class="gate__b ${l.cls}" data-level="${l.id}"><b>${window.PKi18n.current()==='ar'?l.ar:l.fr}</b></button>`).join('')}</div>
        <span class="help">${t('chooseLevelSub')}</span></div>
      <div class="fld mt4"><label>${t('authInterests')}</label>
        <div class="gate__chk">
          ${[['group','intGroup'],['private','intPrivate'],['self','intSelf']].map(([v,k])=>`
            <label class="chk"><input type="checkbox" data-interest="${v}"><span>${t(k)}</span></label>`).join('')}
        </div></div>
      ${authErrorBox()}
      <p class="gate__s hide" id="onboardStatus" role="status" aria-live="polite"></p>
      <button type="submit" class="btn btn--p btn--blk btn--lg mt5" data-onboard-submit aria-describedby="gateErr onboardStatus">${t('onboardGo')}</button>
    </form>
    <button type="button" class="gate__lnk" data-logout>${t('sbOut')}</button>
    <a class="gate__lnk" href="/index.html">${svg('arrow','width="14" height="14"')} ${t('viewPublic')}</a>
  </div></section>`;
}
/** Écran « compte non autorisé » (panneau admin seulement). */
function deniedScreen(){
  const m = window.PKdata.me || {};
  return `<section class="gate"><div class="gate__c">
    <span class="gate__ic">${svg('lock','width="34" height="34"')}</span>
    <h2>${t('notAuthorized')}</h2>
    <p class="gate__s">${t('authSignedAs')||''} <b dir="ltr">${m.email||''}</b></p>
    <button type="button" class="btn btn--g btn--blk" data-logout>${t('sbOut')}</button>
  </div></section>`;
}

const PKgate = {
  html(opts){
    opts = opts || {};
    const D = window.PKdata, m = D.me;
    if(!m) return loginScreen(opts.role);
    if(opts.role === 'admin' && m.role !== 'admin') return deniedScreen();
    /* un profil avec un niveau connu est considéré comme déjà inscrit */
    const done = m.onboarded === true || !!m.level;
    if(opts.role !== 'admin' && !done && m.role !== 'admin') return onboardScreen();
    return '';
  },
  bind(mn, after, opts){
    opts = opts || {};
    const after_ = ()=> { if(after) after(); };
    bindDelegated();
    /* onglets connexion / création */
    $$('[data-auth-tab]', mn).forEach(b=> b.addEventListener('click', ()=>{
      $$('[data-auth-tab]', mn).forEach(x=> x.classList.toggle('on', x===b));
      const signin = $('#authSigninForm', mn), signup = $('#authSignupForm', mn);
      if(signin && signup){
        signin.classList.toggle('hide', b.dataset.authTab!=='signin');
        signup.classList.toggle('hide', b.dataset.authTab!=='signup');
      }
    }));
    const liveEl = selector=>{
      const current = mn && mn.isConnected ? $(selector, mn) : null;
      return current || document.querySelector(selector);
    };
    const setOnboardStatus = msg=>{
      const box = liveEl('#onboardStatus');
      if(box){ box.textContent = msg || ''; box.classList.toggle('hide', !msg); }
    };
    const err = (msg)=>{
      const box = liveEl('#gateErr');
      if(box){ box.textContent = msg || ''; box.classList.toggle('hide', !msg); }
      if(msg){ setOnboardStatus(''); toast(msg, 'er', 5000); }
    };
    /* connexion e-mail */
    const f1 = $('#authSigninForm', mn);
    if(f1) f1.addEventListener('submit', async e=>{
      e.preventDefault();
      const email = (f1.elements.email.value||'').trim(), pass = f1.elements.password.value||'';
      if(!email || pass.length < 6){ err(t('requiredFields')); return; }
      const b = f1.querySelector('button[type=submit]'); if(b) b.disabled = true;
      const u = await window.PKdb.loginEmail(email, pass);
      if(b) b.disabled = false;
      if(u) after_();
    });
    /* création de compte */
    const f2 = $('#authSignupForm', mn);
    if(f2) f2.addEventListener('submit', async e=>{
      e.preventDefault();
      const name = (f2.elements.name.value||'').trim();
      const email = (f2.elements.email.value||'').trim(), pass = f2.elements.password.value||'';
      if(!name){ err(t('authErrorName')); return; }
      if(!email || pass.length < 6){ err(t('requiredFields')); return; }
      const b = f2.querySelector('button[type=submit]'); if(b) b.disabled = true;
      const u = await window.PKdb.registerEmail(name, email, pass);
      if(b) b.disabled = false;
      if(u) after_();
    });
    /* Google */
    const g = $('[data-gate-google]', mn);
    if(g) g.addEventListener('click', async ()=>{ const u = await window.PKdb.loginGoogle(); if(u) after_(); });
    /* mot de passe oublié */
    const fg = $('[data-gate-forgot]', mn);
    if(fg) fg.addEventListener('click', async ()=>{
      const f = $('#authSigninForm', mn);
      const email = f ? (f.elements.email.value||'').trim() : '';
      if(!email){ err(t('requiredFields')); return; }
      await window.PKdb.resetPassword(email);
    });
    /* inscription : niveau + intérêts + nom */
    let level = (window.PKdata.me && window.PKdata.me.level) || null;
    $$('[data-level]', mn).forEach(b=> b.addEventListener('click', ()=>{
      level = b.dataset.level;
      $$('[data-level]', mn).forEach(x=> x.classList.toggle('on', x===b));
    }));
    const form = $('#onboardForm', mn);
    const sub = form && $('[data-onboard-submit]', form);
    if(form && sub) form.addEventListener('submit', async e=>{
      e.preventDefault();
      if(sub.disabled) return;
      const name = ($('#onboardName', form) || {}).value || '';
      const interests = $$('[data-interest]', form).filter(i=>i.checked).map(i=>i.dataset.interest);
      err('');
      if(!name.trim()){ err(t('authErrorName')); $('#onboardName', form)?.focus(); return; }
      if(!level){ err(t('chooseLevelTitle')); return; }
      sub.disabled = true;
      sub.setAttribute('aria-busy','true');
      setOnboardStatus(t('onboardSaving'));
      try{
        const api = window.PKdb && window.PKdb.completeOnboarding;
        if(typeof api !== 'function') throw new Error(t('onboardFailed'));
        const r = await api.call(window.PKdb, {name, level, interests});
        if(r && r.ok){
          setOnboardStatus('');
          toast(t('onboardDone'), 'ok', 3200);
          after_();
        }else{
          err((r && r.message) || t('onboardFailed'));
        }
      }catch(e){
        console.warn('[PK] حفظ معلومات التلميذ:', e);
        let message = '';
        try{ if(window.PKdb && typeof window.PKdb.friendlyError === 'function') message = window.PKdb.friendlyError(e); }catch(_){}
        err(message || (e && e.message) || t('onboardFailed'));
      }finally{
        if(sub.isConnected){
          sub.disabled = false;
          sub.removeAttribute('aria-busy');
        }
        setOnboardStatus('');
      }
    });
  }
};

/** Bascule le chrome en mode « porte » : la barre latérale disparaît
    (elle n'a aucun sens avant connexion et poussait le formulaire hors écran). */
function gateMode(on){
  const host = document.getElementById('app');
  if(host) host.classList.toggle('app--gate', !!on);
}
/* ───────── AMORÇAGE D'UNE PAGE D'APP ───────── */
function bootApp(role, active, opts, render){
  document.addEventListener('DOMContentLoaded', ()=>{
    boot(null);                       // injecte sprite + palette + raccourcis
    const mn = mountApp(role, active, opts);
    /* Filet de sécurité : si le rendu d'une page échoue, on AFFICHE l'erreur
       (avec un bouton « recharger ») au lieu de laisser un écran blanc. */
    const renderFallback = (box, e)=>{
      if(!box) return;
      const msg = (e && (e.message || e.toString())) || 'Erreur inconnue';
      box.innerHTML = `<section class="gate"><div class="gate__c">
        <span class="gate__ic">${svg('x','width="30" height="30"')}</span>
        <h2>${t('errTitle')||'حدث خطأ'}</h2>
        <p class="gate__s">${t('errSub')||''}</p>
        <p class="gate__err" dir="ltr" style="text-align:start">${msg}</p>
        <button type="button" class="btn btn--p btn--blk btn--lg mt4" data-retry>${t('errReload')||'إعادة المحاولة'}</button>
        <a class="gate__lnk" href="/index.html">${t('viewPublic')}</a>
      </div></section>`;
      const b = box.querySelector('[data-retry]');
      if(b) b.addEventListener('click', ()=> location.reload());
    };
    /* Normalisation défensive : quelle que soit la façon dont D.me a été
       rempli (inscription, connexion, cache, mode démo), les pages peuvent
       compter sur ces champs. Sans cela une page restait blanche. */
    const normalizeMe = ()=>{
      const D = window.PKdata;
      if(!D || !D.me) return;
      const m = D.me;
      if(!m.mastery || typeof m.mastery !== 'object' || Array.isArray(m.mastery)) m.mastery = {};
      if(!Array.isArray(m.badges))    m.badges = [];
      if(!Array.isArray(m.doneIds))   m.doneIds = [];
      if(!Array.isArray(m.interests)) m.interests = [];
      if(typeof m.xp !== 'number')        m.xp = 0;
      if(typeof m.streak !== 'number')    m.streak = 0;
      if(typeof m.best !== 'number')      m.best = 0;
      if(typeof m.lessonsDone !== 'number') m.lessonsDone = 0;
      if(typeof m.exDone !== 'number')    m.exDone = 0;
      if(typeof m.quizDone !== 'number')  m.quizDone = 0;
      if(typeof m.correct !== 'number')   m.correct = 0;
      if(typeof m.answered !== 'number')  m.answered = 0;
      if(typeof m.minutes !== 'number')   m.minutes = 0;
    };
    const doRender = (m)=> {
      const box = m||mn;
      normalizeMe();
      try{
        if(render) render(box);
        replayFx(box); initReveal(box);
      }catch(err){
        console.error('[PK] rendu impossible :', err);
        renderFallback(box, err);
      }
    };
    document.addEventListener('pk:lang', ()=>{
      const host = $('#app');
      host.innerHTML = sidebar(role, active) + `<main class="mn" id="mn"></main>`;
      const mn2 = $('#mn');
      if(opts && opts.top !== false) mn2.insertAdjacentHTML('afterbegin', appTop(opts));
      bindDelegated();
      window.PKi18n.translateDom(window.PKi18n.current());
      doRender(mn2);
    });
    /* rendu initial IMMÉDIAT : la page ne reste jamais blanche, même si Firestore
       ou le CDN Firebase tarde (ou échoue) — puis rendu enrichi après hydratation. */
    doRender();
    window.PKdb.init().then(()=>{ doRender(); }, ()=>{ doRender(); });
    /* erreurs asynchrones : jamais de silence total */
    window.addEventListener('error', ev=>{
      const box = document.getElementById('mn');
      if(!box || box.innerHTML.trim()) return;
      renderFallback(box, ev.error || ev.message);
    }, {once:true});
    document.addEventListener('pk:me', ()=>{
      const host=$('#app');
      if(host && role==='student'){ host.innerHTML = sidebar(role, active) + `<main class="mn" id="mn"></main>`; bindDelegated(); }
      const m=$('#mn'); if(m) doRender(m);
    });
  });
}

window.PKapp = {sidebar, appTop, mountApp, bootApp, bindDelegated, isOn, gateMode, STUDENT_NAV, ADMIN_NAV, PKgate, doLogout, loginScreen, onboardScreen, deniedScreen};
})();
