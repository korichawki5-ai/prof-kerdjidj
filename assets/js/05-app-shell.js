/* ══════════════════════════════════════════════════════════════════
   05-app-shell.js · Coquille des espaces connectés (élève + admin)
   Barre latérale, en-tête d'app, garde de rôle
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, svg, logo, t, boot, toast, replayFx, initReveal} = window.PK;
const escH = v => (window.PK && window.PK.esc) ? window.PK.esc(v) : String(v==null?'':v);
const L_ = (a,f) => (window.PKi18n.current()==='fr' ? f : a);

/* ───────── BARRES LATÉRALES ───────── */
const STUDENT_NAV = [
  {g:'sbMain', items:[
    {k:'sbDash',    href:'index.html',         icon:'grid'},
    {k:'sbLessons', href:'lessons.html',       icon:'book'},
    {k:'sbEx',      href:'exercises.html',     icon:'quiz'},
  ]},
  {g:'sbTrack', items:[
    {k:'sbProg',    href:'progress.html',      icon:'trend'},
    {k:'sbTt',      href:'timetable.html',     icon:'cal'},
    {k:'sbAnn',     href:'announcements.html', icon:'bell'},
    {k:'sbProfile', href:'profile.html',       icon:'user'},
  ]}
];
/* Le panneau d'administration est UNE page à modules : chaque entrée pointe
   vers index.html#module (aucun lien mort, chargement instantané). */
const ADMIN_NAV = [
  {g:'adMain', items:[ {k:'adDash', href:'index.html#overview', icon:'grid'} ]},
  {g:'adTeach', items:[
    {k:'adLessons', href:'index.html#lessons',  icon:'book'},
    {k:'adQuiz',    href:'index.html#quiz',     icon:'quiz'},
    {k:'adQbank',   href:'index.html#bank',     icon:'layers'},
    {k:'adEx',      href:'index.html#lessons',  icon:'write'},
  ]},
  {g:'adPpl', items:[
    {k:'adStudents',href:'index.html#students', icon:'users'},
    {k:'adReg',     href:'index.html#reg',      icon:'mail'},
    {k:'adGroups',  href:'index.html#groups',   icon:'school'},
    {k:'adTt',      href:'index.html#tt',       icon:'cal'},
    {k:'adProg',    href:'index.html#prog',     icon:'trend'},
  ]},
  {g:'adSite', items:[
    {k:'adAnn',     href:'index.html#announce', icon:'bell'},
    {k:'adMsg',     href:'index.html#messages', icon:'msg'},
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
        const grp = s.local ? (window.PKi18n.current()==='ar'?'على هذا الجهاز':'Sur cet appareil')
                            : ((window.PKdata.groupOf(s.group)||{}).name||'');
        return {ini, ar:s.ar||'', fr:s.fr||'', sub:((s.level||'')+(grp?' · '+grp:'')), col:s.color||'linear-gradient(140deg,#1E4FD8,#0B2470)'}; })();

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
        <div style="min-width:0"><b><span class="ar">${escH(me.ar)}</span><span class="fr">${escH(me.fr)}</span></b><small>${escH(me.sub)}</small></div>
      </div>
      ${isAdm
        ? `<a class="sb__l mt3" href="../index.html" style="color:var(--er)">${svg('logout')}<span data-i18n="sbOut">${t('sbOut')}</span></a>`
        : `<a class="sb__l mt3" href="#" data-local-out style="color:var(--er)">${svg('logout')}<span>${L_('تسجيل الخروج','Se déconnecter')}</span></a>`}
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
    const pend = e.target.closest('[data-pend-refresh]');
    if(pend){ refreshPending(pend); return; }
    /* خروج التلميذ: يمسح ملفه المحلي من هذا الجهاز (بعد تأكيد) */
    const lo = e.target.closest('[data-local-out]');
    if(lo){
      e.preventDefault();
      if(!window.PKlocal || !window.PKlocal.active()){ location.href = '../index.html'; return; }
      if(window.confirm(window.PKi18n.t('regClearQ'))){
        window.PKlocal.clear();
        location.reload();
      }
      return;
    }
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

/* ───────── « MISE À JOUR DE L'ÉTAT » (compte en attente) ───────── */
async function refreshPending(btn){
  const t = window.PKi18n.t;
  if(btn && btn.dataset.busy) return;
  if(btn){ btn.dataset.busy='1'; btn.disabled = true; }
  try{
    const u = window.PKdb.currentUser();
    if(!u){ location.reload(); return; }
    await window.PKdb.syncProfile(u);
    await window.PKdb.hydrateMe(u);
    document.dispatchEvent(new CustomEvent('pk:me',{detail:window.PKdata.me}));
    const still = window.PKdata.me && window.PKdata.me.role === 'pending';
    window.PK.toast(still ? t('pendingRefresh')+' — '+t('refreshNo') : t('refreshOk'), still ? 'wn' : 'ok', 3200);
  }catch(err){
    window.PK.toast(window.PK.err(err), 'er', 4600);
  }finally{
    if(btn){ btn.disabled = false; delete btn.dataset.busy; }
  }
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

/* ───────── بوابة فضاء التلميذ: بلا حساب وبلا كلمة سر ─────────
   التلميذ يكتب معلوماته في استمارة قصيرة، فتُرسل مباشرة إلى الأستاذة
   (مجموعة registrations) ويُفتح له فضاؤه. ملفه وتقدّمه يبقيان على جهازه
   هو (localStorage) — لا حساب Google ولا بيانات وهمية.
   الأستاذة وحدها تدخل بحسابها: بطاقة الدخول تبقى للوحة الإدارة.        */
/* حالة الاتصال الحقيقية: لا رسالة ثابتة مضلّلة.
   PKdb.mock === true يعني أن المنصة تعمل محلياً (Firebase غير محمَّل/انقطع). */
function dbReady(){ return !!(window.PKdb && window.PKdb.mock === false); }
function dbStatusLine(){
  const t = window.PKi18n.t, svg = window.PK.svg;
  return dbReady()
    ? `<p class="gate__s">${svg('check','width="14" height="14"')}<span> ${t('dbReady')}</span></p>`
    : `<p class="gate__s">${svg('info','width="14" height="14"')}<span> ${t('notConnected')}</span></p>`;
}
/* رابط لوحة الأستاذة: يعمل من الجذر (index.html) ومن مجلد student/ */
function adminHref(){
  return (location.pathname.indexOf('/student/') !== -1) ? '../admin/index.html' : 'admin/index.html';
}
function loginCard(){
  const t = window.PKi18n.t, svg = window.PK.svg;
  return `<section class="gate"><div class="gate__c">
    <span class="ico ico--sm" style="margin-block-end:6px">${svg('lock')}</span>
    <h2>${t('adminLoginTitle')}</h2>
    <p class="gate__s">${t('adminLoginHint')}</p>
    <button class="btn btn--p btn--lg" data-gate-login>${svg('lock','width="18" height="18"')}${t('adminLoginGo')} · Google</button>
    ${dbStatusLine()}
    <p class="gate__s"><a href="../index.html">${t('backToSite')}</a></p>
    </div></section>`;
}
/* بوابة الإدارة: ثلاثة حالات مختلفة بدل رسالة واحدة غامضة
   (أ) حساب Google مسجَّل لكن بلا صلاحية admin → تشخيص واضح + UID + خطوات؛
   (ب) لا أحد مسجَّل → بطاقة دخول + حالة الاتصال الحقيقية. */
function adminGate(){
  const t = window.PKi18n.t, svg = window.PK.svg, m = window.PKdata.me;
  if(m && m.role !== 'admin'){
    const uid = String(m.uid || m.id || '');
    return `<section class="gate"><div class="gate__c gate__c--f">
      <span class="ico ico--sm ico--wn">${svg('info')}</span>
      <h2>${t('adminRoleTitle')}</h2>
      <p class="gate__s">${t('adminRoleSub')}</p>
      <div class="cd" style="text-align:start;padding:16px 18px;margin-block:10px;max-width:560px">
        <div style="font-size:.9rem"><b>${t('adminRoleAcc')}:</b> <span dir="ltr">${escH(m.email || '—')}</span></div>
        <div style="font-size:.9rem;margin-block-start:8px"><b>${t('adminRoleUid')}:</b>
          <code dir="ltr" style="display:inline-block;padding:3px 8px;border-radius:8px;background:var(--bg2,#f1f3f8);font-size:.85rem">${escH(uid)}</code>
          <button class="btn btn--g btn--sm" type="button" data-gate-copy>${t('adminRoleCopy')}</button></div>
      </div>
      <p class="gate__s" style="max-width:620px">${t('adminRoleSteps')}</p>
      <div class="flex gap2 wrap-f" style="justify-content:center;margin-block-start:6px">
        <button class="btn btn--p btn--lg" data-gate-recheck>${svg('refresh','width="17" height="17"')}${t('adminRoleRecheck')}</button>
        <button class="btn btn--g" data-gate-login>${t('navAdminLogin')} · Google</button>
      </div>
      <p class="gate__s"><a href="#" data-gate-out>${t('sbOut')}</a> · <a href="../index.html">${t('backToSite')}</a></p>
    </div></section>`;
  }
  return loginCard();
}
function levelCard(){
  const D = window.PKdata, t = window.PKi18n.t, svg = window.PK.svg;
  return `<section class="gate"><div class="gate__c">${svg('school','width="36" height="36"')}
    <h2>${t('chooseLevelTitle')}</h2>
    <p class="gate__s">${t('chooseLevelSub')}</p>
    <div class="gate__lv">${D.levels.map(l=>`<button class="gate__b ${escH(l.cls)}" data-level="${escH(l.id)}"><b>${escH(L_(l.ar,l.fr))}</b></button>`).join('')}</div>
    <p class="gate__s"><a href="#" data-gate-out>${t('sbOut')}</a></p>
    </div></section>`;
}
/* استمارة التسجيل: كل الحقول التي تحتاجها الأستاذة، بلا حساب */
function regForm(){
  const t = window.PKi18n.t, svg = window.PK.svg, D = window.PKdata;
  const LV = D.levels.map(l=>`<option value="${escH(l.id)}">${escH(l.id)} — ${escH(L_(l.ar,l.fr))}</option>`).join('');
  return `<section class="gate"><div class="gate__c gate__c--f rv">
    ${svg('user','width="36" height="36"')}
    <h2>${t('regTitle')}</h2>
    <p class="gate__s">${t('regSub')}</p>
    <form class="regf" data-reg-form novalidate>
      <div class="fld"><label for="rfName">${t('regName')} <b class="req">*</b></label>
        <input class="inp" id="rfName" autocomplete="name" placeholder="${t('regNamePh')}"></div>
      <div class="g g2" style="gap:12px">
        <div class="fld"><label for="rfLevel">${t('regLevel')} <b class="req">*</b></label>
          <select class="sel" id="rfLevel">${LV}</select></div>
        <div class="fld"><label for="rfBirth">${t('regBirth')}</label>
          <input class="inp" id="rfBirth" type="date" dir="ltr"></div>
      </div>
      <div class="g g2" style="gap:12px">
        <div class="fld"><label for="rfPhone">${t('regPhone')} <b class="req">*</b></label>
          <input class="inp" id="rfPhone" type="tel" inputmode="tel" dir="ltr" placeholder="0555 00 00 00"></div>
        <div class="fld"><label for="rfMail">${t('regEmail')}</label>
          <input class="inp" id="rfMail" type="email" dir="ltr" placeholder="exemple@gmail.com"></div>
      </div>
      <div class="fld"><label for="rfSchool">${t('regSchool')}</label>
        <input class="inp" id="rfSchool" placeholder="${t('regSchoolPh')}"></div>
      <div class="fld"><label for="rfNote">${t('regNote')}</label>
        <textarea class="inp ta" id="rfNote" rows="2" placeholder="${t('regNotePh')}"></textarea></div>
      <input class="regf__trap" type="text" id="rfTrap" tabindex="-1" autocomplete="off" aria-hidden="true">
      <div class="regf__err hide" id="rfErr" role="alert"></div>
      <button class="btn btn--p btn--lg btn--blk mt4" type="submit" data-reg-submit>
        ${svg('check','width="17" height="17"')}${t('regSubmit')}</button>
      <p class="regf__note">${svg('info','width="14" height="14"')} <span>${t('regLocalNote')}</span></p>
      <p class="gate__s" style="margin-block-start:10px">
        ${t('adminOrTeacher')} <a href="${adminHref()}">${svg('lock','width="13" height="13"')} ${t('adminLink')}</a>
      </p>
    </form>
  </div></section>`;
}

const PKgate = {
  adminGate,
  html(role){
    role = role || 'student';
    const D = window.PKdata, m = D.me, t = window.PKi18n.t;
    /* لوحة الإدارة: تبقى بحساب Google الخاص بالأستاذة (كما كانت) */
    if(role === 'admin'){
      /* toujours exiger le rôle admin (même si Firebase est indisponible) */
      if(!m || m.role !== 'admin') return adminGate();
      return '';
    }
    /* فضاء التلميذ: مسجَّل على هذا الجهاز ← يدخل مباشرة بلا أي حساب.
       نضبط PKdata.me هنا حتى تقرأ كل الصفحات الملف المحلي مباشرة. */
    if(window.PKlocal && window.PKlocal.active()){
      window.PKdata.me = window.PKlocal.me();
      return '';
    }
    /* حساب قديم (Google) بلا مستوى: تُعرض بطاقة اختيار المستوى */
    if(m){
      if(!m.level && m.role !== 'admin') return levelCard();
      return '';
    }
    return regForm();
  },
  bind(mn, after){
    const t = window.PKi18n.t;
    /* إعادة الرسم: يفضّل الرسم الكامل للتطبيق (يُظهر لافتة «لم يُرسل» مثلاً) */
    const refreshAll = () => {
      if(window.PKapp && window.PKapp.rerender) window.PKapp.rerender();
      else if(after) after();
    };

    /* ── استمارة التسجيل (بلا حساب) ── */
    const f = mn.querySelector('[data-reg-form]');
    if(f){
      const errBox = f.querySelector('#rfErr');
      const btn    = f.querySelector('[data-reg-submit]');
      const btnHTML = btn ? btn.innerHTML : '';
      const show = html => { if(!errBox) return; errBox.innerHTML = html; errBox.classList.remove('hide'); };
      const clear = () => { if(!errBox) return; errBox.innerHTML = ''; errBox.classList.add('hide'); };
      let last = null;
      const collect = () => ({
        name:        (f.querySelector('#rfName')   || {}).value || '',
        level:       (f.querySelector('#rfLevel')  || {}).value || '',
        birth:       (f.querySelector('#rfBirth')  || {}).value || '',
        parentPhone: (f.querySelector('#rfPhone')  || {}).value || '',
        email:       (f.querySelector('#rfMail')   || {}).value || '',
        school:      (f.querySelector('#rfSchool') || {}).value || '',
        note:        (f.querySelector('#rfNote')   || {}).value || ''
      });
      const done = sent => {
        toast(sent ? t('regOk') : t('regOkLocal'), sent ? 'ok' : 'wn', 4600);
        refreshAll();
      };
      const send = async data => {
        clear();
        if(btn){ btn.disabled = true; btn.innerHTML = t('regBusy'); }
        try{
          await window.PKdb.addRegistration(data);
          window.PKlocal.register(data, {sent:true});
          done(true);
        }catch(err){
          const msg = (window.PK && window.PK.err) ? window.PK.err(err) : t('regErr');
          show(`<b>${escH(msg)}</b>
            <div style="font-size:.85rem;line-height:1.8;margin-top:6px">${t('regFailS')}</div>
            <div class="flex gap2 wrap-f mt3">
              <button type="button" class="btn btn--p btn--sm" data-reg-retry>${t('regRetry')}</button>
              <button type="button" class="btn btn--g btn--sm" data-reg-skip>${t('regSkip')}</button>
            </div>`);
          const rt = errBox && errBox.querySelector('[data-reg-retry]');
          if(rt) rt.addEventListener('click', () => send(last || collect()));
          const sk = errBox && errBox.querySelector('[data-reg-skip]');
          if(sk) sk.addEventListener('click', () => {
            window.PKlocal.register(last || collect(), {sent:false});
            done(false);
          });
        }finally{
          if(btn){ btn.disabled = false; btn.innerHTML = btnHTML; }
        }
      };
      f.addEventListener('submit', e => {
        e.preventDefault();
        const trap = f.querySelector('#rfTrap');
        if(trap && trap.value){ show(`<b>${t('regErr')}</b>`); return; }   /* فخّ الروبوتات */
        last = collect();
        const errs = window.PKlocal._validate(last);
        if(errs.length){
          show(`<b>${t('regErr')}</b><div style="font-size:.86rem;margin-top:6px">${errs.map(k=>t(k)).join(' · ')}</div>`);
          return;
        }
        send(last);
      });
    }

    /* ── إعادة إرسال تسجيل محفوظ محلياً ولم يصل ── */
    const re = mn.querySelector('[data-local-resend]');
    if(re) re.addEventListener('click', async () => {
      if(re.dataset.busy) return;
      re.dataset.busy = '1'; re.disabled = true;
      const p = window.PKlocal.profile() || {};
      try{
        await window.PKdb.addRegistration(p);
        window.PKlocal.markSent(new Date().toISOString());
        toast(t('regOk'),'ok',3800);
        refreshAll();
      }catch(err){
        toast((window.PK && window.PK.err) ? window.PK.err(err) : t('regErr'), 'er', 5200);
      }finally{ re.disabled = false; delete re.dataset.busy; }
    });

    /* ── نسخ معرّف الحساب (UID) لتسهيل خطوة Firebase ── */
    const cp = mn.querySelector('[data-gate-copy]');
    if(cp) cp.addEventListener('click', async ()=>{
      const uid = String((window.PKdata.me && (window.PKdata.me.uid || window.PKdata.me.id)) || '');
      if(!uid) return;
      try{
        if(navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(uid);
        else { const ta=document.createElement('textarea'); ta.value=uid; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
        toast(t('adminRoleCopied'), 'ok', 2400);
      }catch(e){ toast(uid, 'info', 6000); }
    });

    /* ── «أعيد التحقق»: بعد إضافة role = admin في Firebase ── */
    const rc = mn.querySelector('[data-gate-recheck]');
    if(rc) rc.addEventListener('click', async ()=>{
      if(rc.dataset.busy) return;
      rc.dataset.busy = '1'; rc.disabled = true;
      try{
        const u = window.PKdb.currentUser();
        if(!u){ toast(t('notConnected'), 'wn', 3600); return; }
        await window.PKdb.syncProfile(u);
        await window.PKdb.hydrateMe(u);
        document.dispatchEvent(new CustomEvent('pk:me', {detail:window.PKdata.me}));
        const ok = window.PKdata.me && window.PKdata.me.role === 'admin';
        toast(ok ? t('adminRoleOk') : t('adminRoleStill'), ok ? 'ok' : 'wn', ok ? 3600 : 6000);
      }catch(err){
        toast((window.PK && window.PK.err) ? window.PK.err(err) : t('saveErr'), 'er', 5200);
      }finally{ rc.disabled = false; delete rc.dataset.busy; }
    });

    /* ── connexion Google : لوحة الإدارة والحسابات القديمة ── */
    const lg = mn.querySelector('[data-gate-login]');
    if(lg) lg.addEventListener('click', async ()=>{
      if(lg.dataset.busy) return;
      lg.dataset.busy = '1';
      const html0 = lg.innerHTML;
      lg.disabled = true;
      lg.innerHTML = t('loginBusy');
      try{
        const u = await window.PKdb.loginGoogle();
        /* succès : pk:me va reconstruire l'espace ; en cas de redirection
           (mobile) la page se recharge d'elle-même. */
        if(u) toast(t('loginOk') || t('adminRoleTitle'), 'ok', 2600);
      }catch(err){
        lg.disabled = false; lg.innerHTML = html0; delete lg.dataset.busy;
        toast((err && (err.friendly||err.message)) || t('saveErr'), 'er', 5600);
      }
    });
    /* ── erreur remontée par une connexion par redirection ── */
    document.addEventListener('pk:auth-error', e=>{
      const m = e && e.detail;
      if(m) toast(m.friendly || m.message || String(m), 'er', 5600);
    });
    /* ── choix du niveau (comptes Google existants) ── */
    mn.querySelectorAll('[data-level]').forEach(b=> b.addEventListener('click', async ()=>{
      b.disabled = true;
      const r = await window.PKdb.chooseLevel(b.dataset.level);
      b.disabled = false;
      if(r && r.ok){ toast(t('levelSaved'),'ok',2600); if(after) after(); }
      else toast((r && r.msg) || t('saveErr'), 'er', 5200);
    }));
    const out = mn.querySelector('[data-gate-out]');
    if(out) out.addEventListener('click', e=>{ e.preventDefault(); window.PKdb.logout().then(()=>location.reload()); });
  }
};

/* ───────── BANDEAU « COMPTE EN ATTENTE DE CONFIRMATION » ─────────
   Affiché dans l'espace élève tant que la professeure n'a pas relié
   l'élève à sa fiche : l'accès aux cours reste ouvert. */
function pendingBanner(){
  const m = window.PKdata.me;
  if(!m) return '';
  const t = window.PKi18n.t, svg = window.PK.svg;
  /* تلميذ مسجَّل على جهازه ولم يصل تسجيله إلى الأستاذة: تنبيه صريح + إعادة إرسال */
  if(m.local && !m.sent){
    return `<div class="pend pend--er rv" data-pend data-pend-local>
      <span class="ico ico--sm ico--er">${svg('info')}</span>
      <div style="flex:1;min-width:0">
        <b>${t('regUnsentT')}</b>
        <div class="muted" style="font-size:.85rem;line-height:1.7;margin-block-start:3px">${t('regUnsentS')}</div>
      </div>
      <button class="btn btn--g btn--sm" data-local-resend>${svg('refresh','width="15" height="15"')}${t('regResend')}</button>
    </div>`;
  }
  if(m.role !== 'pending' || m.level == null) return '';
  return `<div class="pend rv" data-pend>
    <span class="ico ico--sm ico--wn">${svg('info')}</span>
    <div style="flex:1;min-width:0">
      <b>${t('pendingTitle')}</b>
      <div class="muted" style="font-size:.85rem;line-height:1.7;margin-block-start:3px">${t('pendingSub')}</div>
    </div>
    <button class="btn btn--g btn--sm" data-pend-refresh>${svg('refresh','width="15" height="15"')}${t('pendingRefresh')}</button>
  </div>`;
}

/* ───────── AMORÇAGE D'UNE PAGE D'APP ───────── */
function bootApp(role, active, opts, render){
  document.addEventListener('DOMContentLoaded', ()=>{
    boot(null);                       // injecte sprite + palette + raccourcis
    const mn = mountApp(role, active, opts);
    /* كلما تغيّرت هوية صاحب الفضاء (زائر ← تلميذ مسجَّل) تُعاد بناء القائمة
       الجانبية، وإلا بقيت تعرض مكاناً فارغاً بلا اسم. */
    let shellSig = (role === 'admin') ? 'admin' : '';
    const shellId = ()=> role === 'admin' ? 'admin'
      : String((window.PKdata.me && (window.PKdata.me.id || window.PKdata.me.uid)) || '');
    const useLocal = ()=>{
      /* فضاء التلميذ: الملف المحلي أولاً — لا حساب ولا انتظار لـ Firestore */
      if(role === 'student' && window.PKlocal && window.PKlocal.active())
        window.PKdata.me = window.PKlocal.me();
    };
    const doRender = (m)=>{
      useLocal();
      let host = (m && document.body.contains(m)) ? m : (document.getElementById('mn') || mn);
      const sig = shellId();
      if(sig !== shellSig){
        shellSig = sig;
        const app = document.getElementById('app');
        if(app){
          app.innerHTML = sidebar(role, active) + '<main class="mn" id="mn"></main>';
          const nm = document.getElementById('mn');
          if(opts && opts.top !== false) nm.insertAdjacentHTML('afterbegin', appTop(opts));
          bindDelegated();
          host = nm;
        }
      }
      if(render) render(host);
      /* bandeau « compte en attente de confirmation » (espace élève) */
      if(role === 'student' && !host.querySelector('[data-pend]')){
        const tmp = document.createElement('div');
        tmp.innerHTML = pendingBanner();
        if(tmp.firstChild) host.insertBefore(tmp.firstChild, host.firstChild);
      }
      replayFx(host); initReveal(host);
    };
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
    /* permettent aux formulaires (inscription, renvoi…) de redessiner la page */
    if(window.PKapp) window.PKapp.rerender = ()=> doRender();
    document.addEventListener('pk:me', ()=>{
      const host=$('#app');
      if(host && role==='student'){ host.innerHTML = sidebar(role, active) + `<main class="mn" id="mn"></main>`; bindDelegated(); }
      const m=$('#mn'); if(m) doRender(m);
    });
  });
}

window.PKapp = {sidebar, appTop, mountApp, bootApp, bindDelegated, isOn, STUDENT_NAV, ADMIN_NAV, PKgate, adminGate, dbReady, pendingBanner, refreshPending};
})();
