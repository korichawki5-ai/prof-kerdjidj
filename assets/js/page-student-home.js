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

/* ── somme de contrôle pour des données de démo stables ── */
function hash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return Math.abs(h); }

/* ══════════ RENDU ══════════ */
function render(mn){
  L = window.PKi18n.current();
  const gt = window.PKapp.PKgate.html();
  if(gt){ window.PKapp.gateMode(true); mn.innerHTML = gt; window.PKapp.PKgate.bind(mn, ()=>render(mn)); return; }
  window.PKapp.gateMode(false);
  const s = D.me, sum = X.summarize(s);
  const grp = D.groupOf(s.group) || {};

  /* — KPI — */
  const kpis = [
    {n:sum.xp.toLocaleString('fr-FR'), l:t('k1'), ic:'bolt', cls:'', d:'+340', dc:'var(--ok)'},
    {n:sum.streak, l:t('k2'), ic:'flame', cls:'ico--wn', d:'×'+X.streakMult(sum.streak).toFixed(2), dc:'var(--wn)'},
    {n:sum.globalMastery+'<small>%</small>', l:t('k3'), ic:'target', cls:'ico--ok', d:'+4%', dc:'var(--ok)'},
    {n:sum.lessonsDone, l:t('k4'), ic:'book', cls:'ico--pu', d:'+2', dc:'var(--pu)'},
    {n:sum.exDone, l:t('k5'), ic:'quiz', cls:'ico--cy', d:'+5', dc:'var(--cy)'},
    {n:sum.accuracy+'<small>%</small>', l:t('k7'), ic:'checkc', cls:'ico--ok', d:'', dc:''},
    {n:sum.badges.length, l:t('k6'), ic:'trophy', cls:'ico--wn', d:'+1', dc:'var(--wn)'},
    {n:Math.round(sum.minutes/60)+'<small>h</small>', l:t('k8'), ic:'timer', cls:'', d:'+3h', dc:'var(--ok)'}
  ];

  /* — badge de rang — */
  const rp = sum.rankProgress;
  const rankIc = sum.rank.icon;

  /* — prochaine séance — */
  const next = D.groups.find(g=>g.id===s.group) || {};

  /* — exercices suggérés — */
  const lv = s.role==='admin' ? null : s.level;
  const sugg = (lv? D.exercises.filter(e=>e.level===lv):D.exercises).slice(0,3);

  /* — dernières leçons — */
  const ls = (lv? D.lessons.filter(l=>l.level===lv):D.lessons).slice(0,4);

  /* — activité récente — */
  const acts = [
    {ic:'quiz', cls:'', ar:`أنهيتَ تمرين <b>الضمائر الموصولة</b> بـ 12/14 · <b>+180 XP</b>`,
                 fr:`Tu as terminé <b>Les pronoms relatifs</b> : 12/14 · <b>+180 XP</b>`, when:'2 h'},
    {ic:'book', cls:'ico--pu', ar:`أكملتَ درس <b>Le passé composé</b> · <b>+25 XP</b>`,
                 fr:`Cours <b>Le passé composé</b> terminé · <b>+25 XP</b>`, when:'5 h'},
    {ic:'trophy', cls:'ico--wn', ar:`وسام جديد: <b>خبير القواعد</b> 🏅`, fr:`Nouveau badge : <b>Expert en grammaire</b> 🏅`, when:'1 j'},
    {ic:'flame', cls:'ico--er', ar:`سلسلة <b>9 أيام</b> متتالية — مضاعف ×1.5 مفعّل 🔥`, fr:`Série de <b>9 jours</b> — multiplicateur ×1.5 actif 🔥`, when:'1 j'},
    {ic:'target', cls:'ico--ok', ar:`إتقان <b>Conjugaison</b> ارتفع إلى 88%`, fr:`Maîtrise de <b>Conjugaison</b> : 88%`, when:'2 j'}
  ];

  mn.innerHTML = `
  <div class="mn__t">
    <div>
      <h1>${t('stHello')} ${ar()?s.ar:s.fr.split(' ')[0]} 👋</h1>
      <p data-i18n="stSub">${t('stSub')}</p>
    </div>
    <div class="mn__a">
      <span class="bd bd--lv lv-4am">${s.level} · ${grp.name||''}</span>
      <span class="bd bd--gy">${svg(rankIc,'width="12" height="12"')}${L_(sum.rank.ar,sum.rank.fr)}</span>
      <button class="btn btn--g btn--i" id="stSearch" title="Ctrl+K">${svg('search')}</button>
      <div class="lgsw"><button data-lang="ar">AR</button><button data-lang="fr">FR</button></div>
      <button class="btn btn--g btn--i" data-theme-btn title="Theme">${svg('moon')}</button>
      <a href="/student/exercises.html" class="btn btn--p btn--sm">${svg('quiz','width="16" height="16"')}<span data-i18n="exStart">${t('exStart')}</span></a>
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
  <div class="g g2 mb5 g--xp">
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
          ${['sat','sun','mon','tue','wed','thu','sun'].map((d,i)=>`
            <span class="stk__d${i<6?' on':''}${i===6?' now':''}">${svg(i<6?'check':'clock','width="13" height="13"')}<span>${DAYS[d][ar()?0:1].slice(0,3)}</span></span>`).join('')}
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

  ${(()=>{ const msgs=(window.PKdata.myMessages||[]).slice(0,3);
    if(!msgs.length) return '';
    return `<div class="cd rv mb5" style="border-inline-start:3px solid var(--ac)">
      <div class="cd__h"><div><div class="cd__t">${L_('رسائل من الأستاذة','Messages de la professeure')}</div>
        <div class="cd__s">${L_('ردود وصلتك مباشرة','Réponses qui vous sont adressées')}</div></div>
        <span class="bd">${svg('msg','width="12" height="12"')}${msgs.length}</span></div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${msgs.map(m=>`<div class="bub bub--in"><p>${m.body||''}</p><time class="la">${m.d||''}</time></div>`).join('')}
      </div></div>`; })()}

  <!-- ── CORPS ── -->
  <div class="g g-main" style="align-items:start">
    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">

      <!-- exercices suggérés -->
      <div class="cd rv">
        <div class="cd__h cd__h--b">
          <div><div class="cd__t" data-i18n="upEx">${t('upEx')}</div>
            <div class="cd__s">${L_('مخصّصة لمستواك','Adaptés à ton niveau')} · ${s.level}</div></div>
          <a href="/student/exercises.html" class="btn btn--s btn--sm" data-i18n="seeAll">${t('seeAll')}</a>
        </div>
        <div class="g gap3">
          ${sugg.map(x=>{
            const ax=D.axes.find(a=>a.id===x.ax)||{fr:x.ax,ar:x.ax};
            return `<div class="itm itm--new">
              <span class="ico">${svg('quiz')}</span>
              <div class="itm__b">
                <b>${L_(x.titleAr,x.titleFr)}</b>
                <small><span class="la">${x.q} ${t('exQ')}</span> · <span class="la">${x.min} min</span> · ${L_(ax.ar,ax.fr)}
                  · <span class="diff diff--${x.diff}"><i class="on"></i><i class="${x.diff>=2?'on':''}"></i><i class="${x.diff>=3?'on':''}"></i></span></small>
              </div>
              <div class="itm__s">
                <span class="pill-xp">${svg('bolt','width="13" height="13"')}≤${x.xpMax}</span>
                <a class="btn btn--p btn--sm" href="/student/exercise.html?id=${x.id}">${t('exStart')}</a>
              </div>
            </div>`;}).join('')}
        </div>
      </div>

      <!-- dernières leçons -->
      <div class="cd rv">
        <div class="cd__h cd__h--b">
          <div><div class="cd__t" data-i18n="newLs">${t('newLs')}</div><div class="cd__s">${s.level}</div></div>
          <a href="/student/lessons.html" class="btn btn--s btn--sm" data-i18n="lsAll">${t('lsAll')}</a>
        </div>
        <div class="g gap3">
          ${ls.map(x=>{
            const ax=D.axes.find(a=>a.id===x.ax)||{fr:x.ax,ar:x.ar||x.ax,icon:'book'};
            return `<div class="itm ${x.done?'itm--done':''}">
              <span class="ico ico--sm ${x.done?'ico--ok':''}">${svg(x.done?'check':(x.icon||ax.icon))}</span>
              <div class="itm__b"><b>${L_(x.ar,x.fr)}</b>
                <small>${svg('clock','width="13" height="13"')}<span class="la">${x.min} ${t('lsMin')}</span> · ${ax.fr}
                  ${x.files?` · ${svg('file','width="13" height="13"')}<span class="la">${x.files}</span>`:''}</small></div>
              <div class="itm__s">
                <span class="pill-xp">${svg('bolt','width="13" height="13"')}+${x.xp}</span>
                <a class="btn btn--g btn--sm" href="/student/lesson.html?id=${x.id}">${x.done?t('exReview'):t('lsStart')}</a>
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
        <div class="la" style="font-size:1.8rem;font-weight:800;line-height:1.1">${DAYS[next.day||'sat'][ar()?1:1]}</div>
        <div class="la" style="font-size:1.1rem;opacity:.9;margin-block-start:4px">${next.start} – ${next.end}</div>
        <div style="margin-block-start:16px;padding-block-start:14px;border-block-start:1px solid rgba(255,255,255,.24);font-size:.88rem">
          <b>${next.name||L_('لا حصة قادمة','Aucune séance à venir')}</b> · ${L_(D.levelOf(next.level).ar, D.levelOf(next.level).fr)}
        </div>
        <div style="font-size:.83rem;opacity:.86;margin-block-start:5px;display:flex;align-items:center;gap:7px">
          ${svg('school','width="14" height="14"')}${L_(next.schoolAr,next.schoolFr)}</div>
        <div style="font-size:.83rem;opacity:.86;margin-block-start:4px;display:flex;align-items:center;gap:7px">
          ${svg('user','width="14" height="14"')}${next.teacher} · ${t(next.mode==='onsite'?'onsite':'online')}</div>
        <div class="mt4" id="cdNext"></div>
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
        <a href="/student/progress.html" class="btn btn--g btn--sm btn--blk mt4">${t('sbProg')} ${svg('arrow','width="15" height="15"')}</a>
      </div>

      <!-- badges -->
      <div class="cd rv" style="--d:140ms">
        <div class="cd__h" style="margin-block-end:16px"><div class="cd__t" data-i18n="badges">${t('badges')}</div>
          <span class="bd la">${sum.badges.length}/16</span></div>
        <div class="g g3" style="gap:12px" id="miniBadges"></div>
        <a href="/student/progress.html" class="btn btn--g btn--sm btn--blk mt4">${t('seeAll')}</a>
      </div>

      <!-- annonces -->
      <div class="cd rv" style="--d:200ms;border-color:var(--wn);background:var(--wn-t)">
        <div class="flex items-c gap2" style="color:var(--wn);font-weight:800;font-size:.9rem;margin-block-end:11px">
          ${svg('bell','width="17" height="17"')}<span data-i18n="annPinned">${t('annPinned')}</span></div>
        <p style="font-size:.9rem;line-height:1.8" data-i18n="ann1" data-i18n-html>${t('ann1')}</p>
        <div class="la faint mt3" style="font-size:.76rem">2025-09-28 · Prof. Kerdjidj</div>
      </div>
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
  const host = $('#hm'); if(!host) return;
  const h = hash(s.id);
  let out='';
  for(let w=17; w>=0; w--){
    for(let d=0; d<7; d++){
      const idx = (17-w)*7 + d;
      const v = ((h >> (idx % 20)) & 7) + (idx % 3);
      const lvl = idx>100 ? Math.min(4, Math.floor(v/2.2)) : 0;
      const date = new Date(Date.now() - (w*7 + (6-d))*864e5);
      out += `<i data-l="${lvl}" title="${date.toISOString().slice(0,10)} · ${lvl*35} XP"></i>`;
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
function startCountdown(g){
  const host = $('#cdNext'); if(!host || !g || !g.day) return;
  const order = ['sun','mon','tue','wed','thu','fri','sat'];
  const target = order.indexOf(g.day);
  const [hh,mm] = g.start.split(':').map(Number);
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
  tick(); setInterval(tick, 1000);
}

/* ── amorçage ── */
window.PKapp.bootApp('student','index.html',{top:false}, render);
})();
