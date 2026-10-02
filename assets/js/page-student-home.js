/* ══════════════════════════════════════════════════════════════════
   page-student-home.js · Tableau de bord élève
   ⚡ Progression (XP · rang · série · maîtrise · badges) — PAS de notes
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, svg, t, toast, confetti, replayFx} = window.PK;
const D = window.PKdata, X = window.PKxp;
let L='ar'; const ar=()=>L==='ar'; const L_=(a,f)=>ar()?a:f;

const DAYS = {sat:['السبت','Samedi'],sun:['الأحد','Dimanche'],mon:['الاثنين','Lundi'],
              tue:['الثلاثاء','Mardi'],wed:['الأربعاء','Mercredi'],thu:['الخميس','Jeudi']};
const AXFR = {grammaire:'Grammaire',conjugaison:'Conjugaison',orthographe:'Orthographe',
              vocabulaire:'Vocabulaire',comprehension:'Compréhension',expression:'Expression écrite',
              oral:'Expression orale',methodologie:'Méthodologie BEM',sujets:'Sujets corrigés'};
const AXAR = {grammaire:'القواعد',conjugaison:'تصريف الأفعال',orthographe:'الإملاء',vocabulaire:'المفردات',
              comprehension:'فهم النص',expression:'التعبير الكتابي',oral:'التعبير الشفوي',
              methodology:'منهجية BEM',sujets:'مواضيع محلولة'};

/* ── affichage sûr : une donnée absente ne doit JAMAIS écrire « undefined » ── */
const nun = (v, d) => (typeof v === 'number' && !isNaN(v)) ? v : (d === undefined ? '—' : d);
const exQn = x => (typeof x.q === 'number') ? x.q
                 : (Array.isArray(x.questions) ? x.questions.length : '—');
/* ── échappement + lecture des annonces réelles (aucune donnée inventée) ── */
const esc = v => (window.PK && window.PK.esc) ? window.PK.esc(v) : String(v==null?'':v);
function annTitle(a){ const c=(a.i18n&&typeof a.i18n==='object')?a.i18n:null;
  return L_(c&&c.ar,c&&c.fr)||L_(a.titleAr,a.titleFr)||L_('إعلان','Annonce'); }
function annBody(a){ const c=(a.i18n&&typeof a.i18n==='object')?a.i18n:null;
  return L_(c&&c.bodyAr,c&&c.bodyFr)||L_(c&&c.arBody,c&&c.frBody)||L_(a.bodyAr,a.bodyFr)||L_(a.arBody,a.frBody)||''; }

/* ══════════ RENDU ══════════ */
function render(mn){
  L = window.PKi18n.current();
  const gt = window.PKapp.PKgate.html();
  if(gt){ mn.innerHTML = gt; window.PKapp.PKgate.bind(mn, ()=>render(mn)); return; }
  const s = D.me, sum = X.summarize(s);
  const grp = D.groupOf(s.group) || {};

  /* — KPI — */
  /* Aucune variation inventée : on n'affiche que les valeurs RÉELLES.
     (Avant : « +340 », « +4 % », « +3 h »… étaient écrits en dur.) */
  const kpis = [
    {n:sum.xp.toLocaleString('fr-FR'), l:t('k1'), ic:'bolt', cls:'', d:'', dc:''},
    {n:sum.streak, l:t('k2'), ic:'flame', cls:'ico--wn', d:'×'+X.streakMult(sum.streak).toFixed(2), dc:'var(--wn)'},
    {n:sum.globalMastery+'<small>%</small>', l:t('k3'), ic:'target', cls:'ico--ok', d:'', dc:''},
    {n:sum.lessonsDone, l:t('k4'), ic:'book', cls:'ico--pu', d:'', dc:''},
    {n:sum.exDone, l:t('k5'), ic:'quiz', cls:'ico--cy', d:'', dc:''},
    {n:sum.accuracy+'<small>%</small>', l:t('k7'), ic:'checkc', cls:'ico--ok', d:'', dc:''},
    {n:sum.badges.length, l:t('k6'), ic:'trophy', cls:'ico--wn', d:'', dc:''},
    {n:Math.round(sum.minutes/60)+'<small>h</small>', l:t('k8'), ic:'timer', cls:'', d:'', dc:''}
  ];

  /* — badge de rang — */
  const rp = sum.rankProgress;
  const rankIc = sum.rank.icon;

  /* — prochaine séance — (peut être vide : élève pas encore rattaché) */
  const next = D.groups.find(g=>g.id===s.group) || null;
  const nextLv = next ? D.byId(D.levels, next.level) : null;

  /* — exercices suggérés — */
  const lv = s.role==='admin' ? null : s.level;
  const sugg = (lv? D.exercises.filter(e=>e.level===lv):D.exercises).slice(0,3);

  /* — annonce épinglée (réelle) — */
  const pin = [...(D.announcements||[])].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0))[0] || null;

  /* — dernières leçons — */
  const ls = (lv? D.lessons.filter(l=>l.level===lv):D.lessons).slice(0,4);

  /* — prénom affiché (sûr : le nom vient du compte Google) — */
  const first = String(ar() ? (s.ar||s.fr||'') : (s.fr||s.ar||'')).split(' ')[0];

  mn.innerHTML = `
  <div class="mn__t">
    <div>
      <h1>${t('stHello')} ${esc(first)} 👋</h1>
      <p data-i18n="stSub">${t('stSub')}</p>
    </div>
    <div class="mn__a">
      <span class="bd bd--lv lv-4am">${s.level} · ${grp.name||''}</span>
      <span class="bd bd--gy">${svg(rankIc,'width="12" height="12"')}${L_(sum.rank.ar,sum.rank.fr)}</span>
      <button class="btn btn--g btn--i" id="stSearch" title="Ctrl+K">${svg('search')}</button>
      <div class="lgsw"><button data-lang="ar">AR</button><button data-lang="fr">FR</button></div>
      <button class="btn btn--g btn--i" data-theme-btn title="Theme">${svg('moon')}</button>
      <a href="exercises.html" class="btn btn--p btn--sm">${svg('quiz','width="16" height="16"')}<span data-i18n="exStart">${t('exStart')}</span></a>
    </div>
  </div>

  <!-- ── KPI ── -->
  <div class="kpis cas">
    ${kpis.map(k=>`
      <div class="kpi${k.cls===''&&k.ic==='bolt'?' kpi--xp':''} rv">
        <div class="kpi__t">
          <span class="ico ico--sm ${k.cls}">${svg(k.ic)}</span>
          ${k.d?`<span class="kpi__d" style="color:${k.dc}">▲ ${k.d}</span>`:''}
        </div>
        <div class="kpi__n la">${k.n}</div>
        <div class="kpi__l">${k.l}</div>
      </div>`).join('')}
  </div>

  <!-- ── XP + SÉRIE ── -->
  <div class="g g2 mb5 adm-2-1">
    <div class="xpbar rv">
      <div class="xpbar__h">
        <div class="xpbar__lv">
          <div class="xpbar__ic">${svg(rankIc)}</div>
          <div>
            <b>${L_(sum.rank.ar,sum.rank.fr)} <span class="la" style="color:var(--tx3);font-size:.85rem">· rang ${sum.rank.id}/6</span></b>
            <small><span class="la">${sum.xp.toLocaleString('fr-FR')}</span> ${t('xpTotal')}</small>
          </div>
        </div>
        ${rp.next?`<div class="bd">${svg('arrow','width="12" height="12"')}<span class="la">${rp.need.toLocaleString('fr-FR')}</span> XP → ${L_(rp.next.ar,rp.next.fr)}</div>`
                 :`<span class="bd bd--ok">${svg('crown','width="12" height="12"')}${t('rank6')}</span>`}
      </div>
      <div class="xpbar__p">
        <div class="xpbar__r"><span>${t('lvlNext')}</span><b class="la">${rp.pct}%</b></div>
        <div class="xpbar__t"><i data-w="${rp.pct}%" style="width:${rp.pct}%"></i></div>
        <div class="mile">${X.RANKS.map(r=>`<span>${r.min>=1000?(r.min/1000)+'k':r.min}</span>`).join('')}</div>
      </div>
    </div>

    <div class="cd rv" style="--d:80ms">
      <div class="stk">
        <div class="stk__f">${svg('flame','fill="currentColor" stroke="none"')}</div>
        <div><div class="stk__n la">${sum.streak}</div><div class="stk__l">${t('daysInRow')}</div></div>
        <div class="stk__w">
          ${[6,5,4,3,2,1,0].map((back)=>{
            const dt = new Date(Date.now() - back*864e5);
            const key = ['sun','mon','tue','wed','thu','fri','sat'][dt.getDay()];
            const nm = DAYS[key] || ['—','—'];
            const on = (sum.streak||0) > back;    /* série réelle, pas de faux jours */
            return `<span class="stk__d${on?' on':''}${back===0?' now':''}">${svg(on?'check':'clock','width="13" height="13"')}<span>${L_(nm[0],nm[1]).slice(0,3)}</span></span>`;
          }).join('')}
        </div>
      </div>
      <div class="mt4 flex just-b" style="font-size:.85rem">
        <span class="muted">${t('bestStreak')}</span><b class="la">${sum.bestStreak} ${t('daysInRow')}</b>
      </div>
      <div class="flex just-b mt3" style="font-size:.85rem">
        <span class="muted">${t('streakMult')||'مضاعف XP'}</span><b class="la" style="color:var(--wn)">×${X.streakMult(sum.streak).toFixed(2)}</b>
      </div>
    </div>
  </div>

  <!-- ── CORPS ── -->
  <div class="g g-main adm-split" style="--adm-side:340px">
    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">

      <!-- exercices suggérés -->
      <div class="cd rv">
        <div class="cd__h cd__h--b">
          <div><div class="cd__t" data-i18n="upEx">${t('upEx')}</div>
            <div class="cd__s">${L_('مخصّصة لمستواك','Adaptés à ton niveau')} · ${s.level}</div></div>
          <a href="exercises.html" class="btn btn--s btn--sm" data-i18n="seeAll">${t('seeAll')}</a>
        </div>
        <div class="g gap3">
          ${sugg.map(x=>{
            const ax=D.axes.find(a=>a.id===x.ax)||{fr:x.ax,ar:x.ax};
            return `<div class="itm itm--new">
              <span class="ico">${svg('quiz')}</span>
              <div class="itm__b">
                <b>${L_(x.titleAr,x.titleFr)}</b>
                <small><span class="la">${exQn(x)} ${t('exQ')}</span> · <span class="la">${nun(x.min)} min</span> · ${L_(ax.ar,ax.fr)}
                  · <span class="diff diff--${nun(x.diff,1)}"><i class="on"></i><i class="${(x.diff||1)>=2?'on':''}"></i><i class="${(x.diff||1)>=3?'on':''}"></i></span></small>
              </div>
              <div class="itm__s">
                <span class="pill-xp">${svg('bolt','width="13" height="13"')}≤${nun(x.xpMax,0)}</span>
                <a class="btn btn--p btn--sm" href="exercise.html?id=${x.id}">${t('exStart')}</a>
              </div>
            </div>`;}).join('')}
        </div>
      </div>

      <!-- dernières leçons -->
      <div class="cd rv">
        <div class="cd__h cd__h--b">
          <div><div class="cd__t" data-i18n="newLs">${t('newLs')}</div><div class="cd__s">${s.level}</div></div>
          <a href="lessons.html" class="btn btn--s btn--sm" data-i18n="lsAll">${t('lsAll')}</a>
        </div>
        <div class="g gap3">
          ${ls.map(x=>{
            const ax=D.axes.find(a=>a.id===x.ax)||{fr:x.ax,ar:x.ar||x.ax,icon:'book'};
            return `<div class="itm ${x.done?'itm--done':''}">
              <span class="ico ico--sm ${x.done?'ico--ok':''}">${svg(x.done?'check':(x.icon||ax.icon))}</span>
              <div class="itm__b"><b>${L_(x.ar,x.fr)}</b>
                <small>${svg('clock','width="13" height="13"')}<span class="la">${nun(x.min)} ${t('lsMin')}</span> · ${ax.fr}
                  ${x.files?` · ${svg('file','width="13" height="13"')}<span class="la">${x.files}</span>`:''}</small></div>
              <div class="itm__s">
                <span class="pill-xp">${svg('bolt','width="13" height="13"')}+${nun(x.xp,0)}</span>
                <a class="btn btn--g btn--sm" href="lesson.html?id=${x.id}">${x.done?t('exReview'):t('lsStart')}</a>
              </div>
            </div>`;}).join('')}
        </div>
      </div>

      <!-- activité -->
      <div class="cd rv">
        <div class="cd__h"><div class="cd__t" data-i18n="activity">${t('activity')}</div>
          <span class="bd bd--gy la">${t('st2')||''}</span></div>
        <div class="hm" id="hm"></div>
        <div class="hm-lg"><span data-i18n="exLess" >${L_('أقل','Moins')}</span>
          <i></i><i data-l="1"></i><i data-l="2"></i><i data-l="3"></i><i data-l="4"></i>
          <span>${L_('أكثر','Plus')}</span>
          <span style="margin-inline-start:auto" class="la">${L_('آخر 18 أسبوعاً','18 dernières semaines')}</span></div>
      </div>
    </div>

    <!-- colonne latérale -->
    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
      <!-- prochaine séance -->
      <div class="cd rv" style="background:linear-gradient(140deg,var(--ac-dd),var(--ac) 62%,var(--ac-2));border:0;color:#fff;padding:24px">
        <div class="flex items-c gap2" style="font-size:.78rem;font-weight:800;opacity:.85;margin-block-end:14px">
          ${svg('clock','width="15" height="15"')}<span data-i18n="nextSes">${t('nextSes')}</span></div>
        ${next ? `
        <div class="la" style="font-size:1.8rem;font-weight:800;line-height:1.1">${esc(L_(DAYS[next.day]?DAYS[next.day][0]:'', DAYS[next.day]?DAYS[next.day][1]:''))}</div>
        <div class="la" style="font-size:1.1rem;opacity:.9;margin-block-start:4px">${esc(next.start||'')} – ${esc(next.end||'')}</div>
        <div style="margin-block-start:16px;padding-block-start:14px;border-block-start:1px solid rgba(255,255,255,.24);font-size:.88rem">
          <b>${esc(next.name||'')}</b>${nextLv?` · ${esc(L_(nextLv.ar,nextLv.fr))}`:''}
        </div>
        <div style="font-size:.83rem;opacity:.86;margin-block-start:5px;display:flex;align-items:center;gap:7px">
          ${svg('school','width="14" height="14"')}${esc(L_(next.schoolAr,next.schoolFr)||'')}</div>
        <div style="font-size:.83rem;opacity:.86;margin-block-start:4px;display:flex;align-items:center;gap:7px">
          ${svg('user','width="14" height="14"')}${esc(next.teacher||'')} · ${t(next.mode==='onsite'?'onsite':'online')}</div>
        <div class="mt4" id="cdNext"></div>`
        : `<div style="font-size:.95rem;line-height:1.9;opacity:.94">${t('pendingTitle')}</div>
           <div style="font-size:.85rem;opacity:.85;margin-block-start:8px;line-height:1.8">${t('pendingSub')}</div>`}
      </div>

      <!-- maîtrise par axe -->
      <div class="cd rv" style="--d:80ms">
        <div class="cd__h" style="margin-block-end:16px"><div class="cd__t" data-i18n="myProg">${t('myProg')}</div>
          <span class="bd bd--ok la">${sum.globalMastery}%</span></div>
        <div class="g gap4">
          ${Object.keys(s.mastery).slice(0,6).map(k=>{
            const v=s.mastery[k], m=X.masteryLabel(v,L);
            const cls = v>=85?'prg--ok':v>=65?'':v>=40?'prg--wn':'prg--er';
            return `<div>
              <div class="flex just-b" style="font-size:.84rem;margin-block-end:6px">
                <b class="la">${AXFR[k]||k}</b><span class="muted la">${v}% · ${m.text}</span></div>
              <div class="prg prg--sm ${cls}"><i data-w="${v}%" style="width:${v}%"></i></div>
            </div>`;}).join('')}
        </div>
        <a href="progress.html" class="btn btn--g btn--sm btn--blk mt4">${t('sbProg')} ${svg('arrow','width="15" height="15"')}</a>
      </div>

      <!-- badges -->
      <div class="cd rv" style="--d:140ms">
        <div class="cd__h" style="margin-block-end:16px"><div class="cd__t" data-i18n="badges">${t('badges')}</div>
          <span class="bd la">${sum.badges.length}/16</span></div>
        <div class="g g3" style="gap:12px" id="miniBadges"></div>
        <a href="progress.html" class="btn btn--g btn--sm btn--blk mt4">${t('seeAll')}</a>
      </div>

      <!-- annonce épinglée RÉELLE (masquée s'il n'y en a aucune) -->
      ${pin ? `<div class="cd rv" style="--d:200ms;border-color:var(--wn);background:var(--wn-t)">
        <div class="flex items-c gap2" style="color:var(--wn);font-weight:800;font-size:.9rem;margin-block-end:11px">
          ${svg('bell','width="17" height="17"')}<span>${pin.pinned?t('annPinned'):t('sbAnn')}</span></div>
        <p style="font-size:.9rem;line-height:1.8">${esc(annBody(pin))}</p>
        <div class="la faint mt3" style="font-size:.76rem">${esc(pin.date||'')} · ${esc((D.settings.teacherNameFr)||'Prof. Kerdjidj')}</div>
      </div>` : ''}
    </div>
  </div>`;

  renderHeatmap(s);
  renderMiniBadges(sum);
  startCountdown(next);
  replayFx(mn);
  // reflète la langue et le thème courants
  $$('.lgsw button', mn).forEach(b=> b.classList.toggle('on', b.dataset.lang===L));
  const tb = $('[data-theme-btn]', mn);
  if(tb) tb.innerHTML = svg(document.documentElement.dataset.theme==='dark' ? 'sun' : 'moon');
  const sb = $('#stSearch', mn);
  if(sb) sb.addEventListener('click', ()=> window.PK.openPalette());
}

/* ── heatmap d'activité ── */
function renderHeatmap(s){
  /* كل مربّع هنا = يوم نشاط حقيقي: إما من سجلّ الأيام الفعلي (تلميذ
     مسجَّل على جهازه) أو من السلسلة الحالية. لا توليد بالهاش ولا بيانات وهمية. */
  const host = $('#hm'); if(!host) return;
  const log = Array.isArray(s.log) && s.log.length ? new Set(s.log) : null;
  const streak = Math.max(0, Math.min(126, s.streak||0));
  let out='';
  for(let w=17; w>=0; w--){
    for(let d=0; d<7; d++){
      const back = w*7 + (6-d);
      const date = new Date(Date.now() - back*864e5);
      const key = date.toISOString().slice(0,10);
      const on = log ? log.has(key) : (back < streak);
      out += `<i data-l="${on?3:0}" title="${key}${on?' ✓':''}"></i>`;
    }
  }
  host.innerHTML = out;
}

/* ── mini badges ── */
function renderMiniBadges(sum){
  const host = $('#miniBadges'); if(!host) return;
  const all = X.evalBadges(sum, sum.badges);
  host.innerHTML = all.slice(0,6).map(b=>`
    <div class="bdg ${b.unlocked?'bdg--'+(b.style||''):'bdg--lock'}" style="padding:12px 8px">
      <div class="bdg__i" style="width:44px;height:44px;border-radius:14px">${svg(b.icon,'width="22" height="22"')}</div>
      <b style="font-size:.74rem;line-height:1.35">${t(b.i18n)}</b>
    </div>`).join('');
}

/* ── compte à rebours vers la prochaine séance ── */
let _cdTimer = null;
function startCountdown(g){
  const host = $('#cdNext'); if(!host || !g || !g.day) return;
  if(_cdTimer){ clearInterval(_cdTimer); _cdTimer = null; }   /* pas d'intervalles empilés */
  const order = ['sun','mon','tue','wed','thu','fri','sat'];
  const target = order.indexOf(g.day);
  const [hh,mm] = String(g.start||'00:00').split(':').map(Number);
  function tick(){
    const now = new Date();
    const d = new Date(now);
    let delta = (target - now.getDay() + 7) % 7;
    d.setDate(now.getDate() + delta); d.setHours(hh, mm||0, 0, 0);
    if(d < now) d.setDate(d.getDate() + 7);
    const ms = d - now;
    const dd = Math.floor(ms/864e5), hh2 = Math.floor(ms%864e5/36e5), mm2 = Math.floor(ms%36e5/6e4), ss = Math.floor(ms%6e4/1000);
    host.innerHTML = `<div style="display:flex;gap:8px">
      ${[[dd,'j'],[hh2,'h'],[mm2,'m'],[ss,'s']].map(([v,u])=>`
        <div style="flex:1;background:rgba(255,255,255,.16);border-radius:11px;padding:8px 4px;text-align:center;backdrop-filter:blur(4px)">
          <div class="la" style="font-size:1.22rem;font-weight:800;line-height:1">${String(v).padStart(2,'0')}</div>
          <div style="font-size:.66rem;opacity:.8" class="la">${u}</div>
        </div>`).join('')}
    </div>`;
  }
  tick();
  _cdTimer = setInterval(tick, 1000);
}

/* ── amorçage ── */
window.PKapp.bootApp('student','index.html',{top:false}, render);
})();
