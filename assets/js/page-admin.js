/* ══════════════════════════════════════════════════════════════════
   page-admin.js · Panneau d'administration — Prof. Kerdjidj
   7 modules : Vue d'ensemble · Emploi du temps · Élèves · Groupes
               · Constructeur de quiz · Leçons · Progression
   ⚡ Aucun système de notes scolaires : uniquement le suivi de
      progression (XP, maîtrise, séries, badges) des élèves.
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, esc, svg, t, toast, modal, replayFx, initReveal, confetti} = window.PK;
const D = window.PKdata, X = window.PKxp;
let L='ar'; const ar=()=>L==='ar'; const L_=(a,f)=>ar()?a:f;

const DAYS={sat:['السبت','Samedi','Sam'],sun:['الأحد','Dimanche','Dim'],mon:['الاثنين','Lundi','Lun'],
            tue:['الثلاثاء','Mardi','Mar'],wed:['الأربعاء','Mercredi','Mer'],thu:['الخميس','Jeudi','Jeu']};
const AXFR={grammaire:'Grammaire',conjugaison:'Conjugaison',orthographe:'Orthographe',vocabulaire:'Vocabulaire',
  comprehension:'Compréhension',expression:'Expression écrite',oral:'Expression orale',
  methodology:'Méthodologie BEM',sujets:'Sujets corrigés'};
const AV=c=>c;
const ini=n=>n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

/* ══════════════════ VUE D'ENSEMBLE ══════════════════ */
function overview(){
  const st=D.students, act=st.filter(s=>s.status==='active');
  const n=st.length||1;
  const avgXp=Math.round(st.reduce((a,s)=>a+(s.xp||0),0)/n);
  const avgM=Math.round(st.reduce((a,s)=>a+X.globalMastery(s.mastery||{}),0)/n);
  const avgStreak=(st.reduce((a,s)=>a+(s.streak||0),0)/n).toFixed(1);
  const seats=D.groups.reduce((a,g)=>a+((g.capacity||0)-(g.enrolled||0)),0);
  const top=[...st].sort((a,b)=>(b.xp||0)-(a.xp||0)).slice(0,5);
  const axesAvg={};
  Object.keys(AXFR).forEach(k=>{ axesAvg[k]=Math.round(st.reduce((a,s)=>a+((s.mastery||{})[k]||0),0)/n); });
  const bucket=(a,b)=>st.filter(s=>(s.xp||0)>=a&&(s.xp||0)<b).length;
  const kpis=[
    {n:act.length,l:t('adk1'),ic:'users',c:''},
    {n:D.lessons.length,l:t('adk2'),ic:'book',c:'ico--pu'},
    {n:D.exercises.length,l:t('adk3'),ic:'quiz',c:'ico--cy'},
    {n:avgXp.toLocaleString('fr-FR'),l:t('adk4'),ic:'bolt',c:'ico--wn'},
    {n:D.groups.length,l:t('adk5'),ic:'cal',c:''},
    {n:D.groups.length,l:t('adk6'),ic:'school',c:'ico--ok'},
    {n:seats,l:t('adk7'),ic:'target',c:'ico--er'},
    {n:(D.messages||[]).length,l:t('adk8'),ic:'msg',c:'ico--pu'}
  ];
  const bars=[['0–500',bucket(0,500),'er'],['500–1k',bucket(500,1000),'wn'],['1k–3k',bucket(1000,3000),''],['3k–5k',bucket(3000,5000),''],['5k+',bucket(5000,1e9),'ok']];
  const maxV=Math.max(...bars.map(b=>b[1]),1);
  const feed=(D.messages||[]).slice(-6).reverse().map(m=>['chat','ico--pu', L_(m.body||'', m.body||''), m.when||'']);
  if(!feed.length) feed.push(['info','ico--gy', L_('لا نشاط بعد — كل رسالة جديدة وكل نشر سيظهران هنا.','Aucune activité — chaque message et publication apparaîtront ici.'), '']);

  return `
  <div class="kpis cas">
    ${kpis.map(k=>`<div class="kpi rv">
      <div class="kpi__t"><span class="ico ico--sm ${k.c}">${svg(k.ic)}</span></div>
      <div class="kpi__n la">${k.n}</div><div class="kpi__l">${k.l}</div></div>`).join('')}
  </div>

  <div class="g g-main mt5 adm-split" style="--adm-side:360px">
    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
      <div class="chart rv">
        <div class="chart__h">
          <div><div class="cd__t">${L_('توزيع التلاميذ حسب مجموع XP','Répartition des élèves par total d’XP')}</div>
            <div class="cd__s">${L_('لا توجد نقاط مدرسية — فقط تقدم التدريب','Aucune note scolaire — uniquement la progression')}</div></div>
          <div class="btn-grp"><button class="on">${L_('الأسبوع','Semaine')}</button><button>${L_('الشهر','Mois')}</button><button>${L_('الفصل','Trimestre')}</button></div>
        </div>
        <div class="bars">
          ${bars.map(([lb,v,c])=>`<div class="bars__b">
            <div class="bars__v ${c}" data-v="${v}" data-h="${Math.round(v/maxV*100)}%" style="height:${Math.round(v/maxV*100)}%"></div>
            <span class="bars__l">${lb}</span></div>`).join('')}
        </div>
        <div class="lgd">
          <span><i style="background:var(--ac)"></i>${L_('عدد التلاميذ','Nombre d’élèves')}</span>
          <span><i style="background:var(--ok)"></i>${L_('متقدمون','Avancés')}</span>
          <span><i style="background:var(--wn)"></i>${L_('في التقدم','En progression')}</span>
          <span><i style="background:var(--er)"></i>${L_('بحاجة لتحفيز','À motiver')}</span>
        </div>
      </div>

      <div class="chart rv">
        <div class="chart__h"><div><div class="cd__t">${L_('متوسط الإتقان حسب المحور','Maîtrise moyenne par axe')}</div>
          <div class="cd__s">${L_('متوسط كل التلاميذ','Moyenne sur tous les élèves')}</div></div>
          <span class="bd bd--ok la">${avgM}%</span></div>
        <div class="g gap4">
          ${Object.entries(axesAvg).map(([k,v])=>`<div>
            <div class="flex just-b" style="font-size:.85rem;margin-block-end:6px">
              <b class="la">${AXFR[k]}</b><span class="muted la">${v}%</span></div>
            <div class="prg prg--sm ${v>=80?'prg--ok':v>=55?'':'prg--wn'}"><i data-w="${v}%" style="width:${v}%"></i></div>
          </div>`).join('')}
        </div>
      </div>

      <div class="cd rv">
        <div class="cd__h cd__h--b"><div><div class="cd__t" data-i18n="adTopXp">${t('adTopXp')}</div>
          <div class="cd__s">${L_('ترتيب تحفيزي — ليس ترتيباً مدرسياً','Classement motivant — pas un classement scolaire')}</div></div>
          <span class="bd">${svg('trophy','width="12" height="12"')}XP</span></div>
        <div class="tbw"><table class="tb">
          <thead><tr><th style="width:52px">#</th><th data-i18n="stuName">${t('stuName')}</th><th data-i18n="stuLevel">${t('stuLevel')}</th>
            <th data-i18n="stuXp">${t('stuXp')}</th><th data-i18n="stuStreak">${t('stuStreak')}</th>
            <th data-i18n="stuMastery">${t('stuMastery')}</th><th>${L_('الرتبة','Rang')}</th></tr></thead>
          <tbody>${top.map((s,i)=>{const r=X.rankOf(s.xp);return `<tr>
            <td><span class="bd ${i===0?'bd--wn':'bd--gy'} la">${i+1}</span></td>
            <td><div class="who"><span class="av" style="background:${s.color||'#1E4FD8'}">${ini(s.fr)}</span>
              <div><b>${L_(s.ar,s.fr)}</b><small>${s.group}</small></div></div></td>
            <td><span class="bd bd--lv ${D.byId(D.levels,s.level).cls}">${s.level}</span></td>
            <td><b class="la acc">${s.xp.toLocaleString('fr-FR')}</b></td>
            <td><span class="la">${svg('flame','width="13" height="13" fill="var(--wn)" stroke="none" style="display:inline;vertical-align:-2px"')} ${s.streak}</span></td>
            <td><div class="prg prg--sm" style="width:70px"><i data-w="${X.globalMastery(s.mastery)}%" style="width:${X.globalMastery(s.mastery)}%"></i></div></td>
            <td><span class="bd">${svg(r.icon,'width="12" height="12"')}${L_(r.ar,r.fr)}</span></td>
          </tr>`;}).join('')}</tbody></table></div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
      <div class="cd rv" style="background:linear-gradient(140deg,var(--ac-dd),var(--ac));border:0;color:#fff">
        <div class="flex items-c gap2" style="font-size:.8rem;font-weight:800;opacity:.85;margin-block-end:14px">
          ${svg('spark','width="15" height="15"')}${L_('إجراءات سريعة','Actions rapides')}</div>
        <div class="g gap3">
          <button class="btn btn--w btn--blk btn--sm" data-atab-jump="lessons">${svg('book','width="16" height="16"')}${t('adNewLesson')}</button>
          <button class="btn btn--o btn--blk btn--sm" data-atab-jump="quiz">${svg('quiz','width="16" height="16"')}${t('adNewQuiz')}</button>
          <button class="btn btn--o btn--blk btn--sm" data-atab-jump="students">${svg('users','width="16" height="16"')}${t('adNewStudent')}</button>
          <button class="btn btn--o btn--blk btn--sm" data-atab-jump="groups">${svg('school','width="16" height="16"')}${t('adNewGroup')}</button>
          <button class="btn btn--o btn--blk btn--sm" data-atab-jump="tt">${svg('cal','width="16" height="16"')}${t('ttNew')}</button>
        </div>
      </div>

      <div class="cd rv" style="--d:80ms">
        <div class="cd__h" style="margin-block-end:14px"><div class="cd__t" data-i18n="adRecent">${t('adRecent')}</div>
          <span class="bd bd--gy la">7</span></div>
        <div class="feed">
          ${feed.map(([ic,c,msg,w])=>`<div class="fd">
            <span class="fd__i ${c}">${svg(ic)}</span>
            <div class="fd__b"><p>${msg}</p><time class="la">${w}</time></div></div>`).join('')}
        </div>
      </div>

      <div class="cd rv" style="--d:140ms">
        <div class="cd__t mb4" style="font-size:.98rem">${L_('مؤشرات التدريب','Indicateurs d’entraînement')}</div>
        ${[[t('streak'),avgStreak,'flame','var(--wn)'],[t('mastery'),avgM+'%','target','var(--ok)'],
           [t('accuracy'),Math.round(st.reduce((a,s)=>a+s.correct/Math.max(s.answered||1,1)*100,0)/st.length)+'%','checkc','var(--ac)'],
           [t('exDone')||'تمارين محلولة',st.reduce((a,s)=>a+s.exDone,0),'quiz','var(--pu)']]
          .map(([l,v,ic,c])=>`<div class="flex just-b items-c" style="padding:11px 0;border-block-end:1px dashed var(--line)">
            <span class="flex items-c gap3" style="font-size:.88rem">${svg(ic,'width="16" height="16" style="color:'+c+'"')}${l}</span>
            <b class="la" style="color:${c}">${v}</b></div>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ══════════════════ EMPLOI DU TEMPS ══════════════════ */
function timetable(){
  const todayK=(()=>{const m=['sun','mon','tue','wed','thu','fri','sat'];const k=m[new Date().getDay()];return DAYS[k]?k:'sat';})();
  let grid=`<div class="hd">${t('ttTime')}</div>`;
  D.days.forEach(d=> grid+=`<div class="hd ${d===todayK?'today':''}">${DAYS[d][ar()?0:1]}</div>`);
  D.slots.forEach(slot=>{
    grid+=`<div class="hr la">${slot}</div>`;
    D.days.forEach(d=>{
      const g=D.slotAt(d,slot);
      grid += g
        ? `<div class="sl" data-day="${d}" data-slot="${slot}"><div class="blk ${g.cls}" draggable="true">
             <span class="blk__g">${svg('drag','width="13" height="13"')}</span>
             <b>${g.name}</b><small>${L_(g.schoolAr,g.schoolFr)}</small><i>${g.teacher} · ${g.start}–${g.end}</i>
           </div></div>`
        : `<div class="sl" data-day="${d}" data-slot="${slot}"></div>`;
    });
  });
  return `
  <div class="tte rv">
    <div class="tte__h">
      <div><div class="cd__t" data-i18n="ttEd">${t('ttEd')}</div><div class="cd__s" data-i18n="ttEdS">${t('ttEdS')}</div></div>
      <div class="flex gap2 wrap-f">
        <select class="sel sel--sm" style="width:auto"><option class="la">2025 / 2026</option><option class="la">2024 / 2025</option></select>
        <button class="btn btn--g btn--sm" data-print>${svg('up','width="16" height="16"')}PDF</button>
        <button class="btn btn--p btn--sm" data-new-session>${svg('plus','width="16" height="16"')}${t('ttNew')}</button>
      </div>
    </div>
    <div class="tte__s"><div class="tteg">${grid}</div></div>
  </div>
  <p class="muted mt4" style="font-size:.84rem;display:flex;align-items:center;gap:9px">
    ${svg('checkc','width="16" height="16" style="color:var(--ac)"')}<span data-i18n="ttNote">${t('ttNote')}</span></p>
  <div class="g g3 mt5 cas">
    ${D.levels.map(l=>{
      const gs=D.groups.filter(g=>g.level===l.id);
      return `<div class="cd rv">
        <div class="flex items-c gap3 mb4"><span class="lv__b ${l.cls}" style="width:44px;height:44px;border-radius:14px;font-size:.85rem">${l.id}</span>
          <div><b>${L_(l.ar,l.fr)}</b><div class="muted la" style="font-size:.8rem">${gs.length} ${t('adGroups')}</div></div></div>
        ${gs.map(g=>`<div class="mini-row"><span class="dot-st dot-st--on"></span><b class="la">${g.name}</b>
          <span class="muted" style="margin-inline-start:auto;font-size:.8rem">${DAYS[g.day][ar()?0:1]} ${g.start}</span></div>`).join('')}
      </div>`;}).join('')}
  </div>`;
}

/* ══════════════════ ÉLÈVES ══════════════════ */
function students(){
  const pend=regCard()+pendingCard();
  const rows=D.students.map(s=>stn(s)).map(s=>{
    const g=D.groupOf(s.group)||{}; const r=X.rankOf(s.xp); const gm=X.globalMastery(s.mastery);
    return `<tr>
      <td><div class="who"><span class="av" style="background:${s.color}">${esc(ini(s.fr||s.ar||'--'))}</span>
        <div><b>${esc(L_(s.ar,s.fr)||'—')}</b><small class="la" dir="ltr">${esc(s.fr||'')}</small></div></div></td>
      <td><span class="bd bd--lv ${lvCls(s.level)}">${esc(s.level)}</span></td>
      <td class="la">${esc(g.name||s.group||'—')}</td>
      <td style="font-size:.83rem">${(g.schoolAr||g.schoolFr)?esc(L_(g.schoolAr,g.schoolFr)):'—'}</td>
      <td class="la" dir="ltr" style="font-size:.83rem">${esc(s.parent||'—')}</td>
      <td><b class="la acc">${s.xp.toLocaleString('fr-FR')}</b></td>
      <td><span class="la">${svg('flame','width="13" height="13" fill="var(--wn)" stroke="none" style="display:inline;vertical-align:-2px"')} ${s.streak}</span></td>
      <td><div class="flex items-c gap2"><div class="prg prg--sm" style="width:56px"><i data-w="${gm}%" style="width:${gm}%"></i></div><span class="la faint" style="font-size:.78rem">${gm}%</span></div></td>
      <td>${s.linked?`<span class="bd bd--ok">${svg('check','width="12" height="12"')}${t('stuLinked')}</span>`
                     :`<span class="bd bd--wn">${t('stuNotLinked')}</span>`}</td>
      <td><span class="bd ${s.status==='active'?'bd--ok':'bd--gy'}">${s.status==='active'?t('stuActive'):t('stuInactive')}</span></td>
      <td><div class="acts"><button class="iact" data-view-student="${esc(s.id)}" title="${t('stuCard')}">${svg('eye')}</button>
        <button class="iact" data-edit-student="${esc(s.id)}" title="${t('edit')}">${svg('edit')}</button>
        <button class="iact iact--er" data-del-student="${esc(s.id)}" title="${t('del')}">${svg('trash')}</button></div></td>
    </tr>`;}).join('');

  return `${pend}
  <div class="cd cd--f rv">
    <div class="cd__h" style="padding:20px 24px;margin:0;border-block-end:1px solid var(--line)">
      <div><div class="cd__t" data-i18n="stuList">${t('stuList')}</div>
        <div class="cd__s"><span class="la">${D.students.length}</span> ${t('stuListS')}</div></div>
      <div class="flex gap2 wrap-f">
        <div class="srch">${svg('search')}<input class="inp inp--sm" id="stuFilter" data-i18n-ph="stuSearch" placeholder="${t('stuSearch')}"></div>
        <select class="sel sel--sm" id="stuLevel" style="width:auto">
          <option value="">${t('allLevels')}</option>${D.levels.map(l=>`<option>${l.id}</option>`).join('')}</select>
        <button class="btn btn--g btn--sm">${svg('up','width="16" height="16"')}CSV</button>
        <button class="btn btn--p btn--sm" data-add-student>${svg('plus','width="16" height="16"')}${t('stuAdd')}</button>
      </div>
    </div>
    <div class="chips" style="padding:14px 24px;border-block-end:1px solid var(--line2)">
      <button class="chip on" data-f="all">${t('all')} <span class="n la">${D.students.length}</span></button>
      ${D.levels.map(l=>`<button class="chip" data-f="${l.id}">${l.id} <span class="n la">${D.students.filter(s=>s.level===l.id).length}</span></button>`).join('')}
      <button class="chip" data-f="unlinked">${svg('link','width="13" height="13"')}${t('stuNotLinked')} <span class="n la">${D.students.filter(s=>!s.linked).length}</span></button>
      <button class="chip" data-f="streak">${svg('flame','width="13" height="13"')}${t('streak')} ≥ 5 <span class="n la">${D.students.filter(s=>s.streak>=5).length}</span></button>
    </div>
    <div class="tbw"><table class="tb" id="stuTable" style="min-width:1180px">
      <thead><tr>
        <th data-i18n="stuName">${t('stuName')}</th><th data-i18n="stuLevel">${t('stuLevel')}</th>
        <th data-i18n="stuGroup">${t('stuGroup')}</th><th data-i18n="stuSchool">${t('stuSchool')}</th>
        <th data-i18n="stuParent">${t('stuParent')}</th><th data-i18n="stuXp">${t('stuXp')}</th>
        <th data-i18n="stuStreak">${t('stuStreak')}</th><th data-i18n="stuMastery">${t('stuMastery')}</th>
        <th data-i18n="stuGoogle">${t('stuGoogle')}</th><th data-i18n="stuStatus">${t('stuStatus')}</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table></div>
    <div class="flex just-b items-c wrap-f gap4" style="padding:16px 24px;border-block-start:1px solid var(--line)">
      <span class="muted" style="font-size:.84rem">${t('stuShowing')} <b class="la">1–${D.students.length}</b> ${t('stuOf')} <b class="la">${D.students.length}</b></span>
      <div class="pgn"><button>‹</button><button class="on">1</button><button>2</button><button>3</button><button>›</button></div>
    </div>
  </div>

  <div class="g g2 mt5 cas">
    <div class="cd rv">
      <div class="cd__t" data-i18n="stuImp">${t('stuImp')}</div>
      <div class="cd__s mb4" data-i18n="stuImpS">${t('stuImpS')}</div>
      <div class="upl" id="dropZone">${svg('up')}<b data-i18n="stuImpD">${t('stuImpD')}</b>
        <small>CSV · XLSX · ${L_('حتى 500 تلميذ','jusqu’à 500 élèves')}</small></div>
      <button class="btn btn--g btn--sm btn--blk mt4">${svg('file','width="16" height="16"')}${t('stuImpTpl')}</button>
    </div>
    <div class="cd rv" style="--d:80ms">
      <div class="cd__t" data-i18n="stuLink">${t('stuLink')}</div>
      <div class="cd__s mb4" data-i18n="stuLinkS">${t('stuLinkS')}</div>
      <div class="g g2" style="gap:14px">
        <div class="fld"><label>${L_('اسم التلميذ','Nom de l’élève')}</label>
          <select class="sel sel--sm" id="lkStudent">${D.students.map(s=>stn(s)).map(s=>`<option value="${esc(s.id)}">${esc(L_(s.ar,s.fr)||s.id)} — ${esc(s.level)}${s.googleEmail?' ('+esc(s.googleEmail)+')':''}</option>`).join('')||`<option value="">${t('empty')}</option>`}</select></div>
        <div class="fld"><label data-i18n="stuLinkE">${t('stuLinkE')}</label>
          <input class="inp inp--sm" id="lkEmail" dir="ltr" placeholder="eleve@gmail.com"></div>
      </div>
      <button class="btn btn--p btn--blk mt4" data-link>${svg('link','width="17" height="17"')}${t('stuLinkGo')}</button>
      <button class="btn btn--g btn--sm btn--blk mt3" data-backfill>${svg('refresh','width="15" height="15"')}${t('admBackfill')}</button>
    </div>
  </div>`;
}

/* ══════════════════ GROUPES ══════════════════ */
function groups(){
  return `
  <div class="flex just-b items-c wrap-f gap4 mb5">
    <div><h2 style="font-size:1.35rem" data-i18n="grTitle">${t('grTitle')}</h2>
      <p class="muted" style="font-size:.9rem" data-i18n="grSub">${t('grSub')}</p></div>
    <button class="btn btn--p" data-add-group>${svg('plus','width="17" height="17"')}${t('grNew')||t('adNewGroup')}</button>
  </div>
  <div class="g g3 cas">
    ${D.groups.map(g=>{
      const free=g.capacity-g.enrolled, pct=Math.round(g.enrolled/g.capacity*100);
      const dash=Math.round(2*Math.PI*24*pct/100), circ=Math.round(2*Math.PI*24);
      return `<div class="grp ${g.cls} rv">
        <div class="grp__h">
          <div class="grp__b la">${g.name.replace(' · ','·')}</div>
          ${free>0?`<span class="bd bd--ok la">${free} ${t('grFree')}</span>`:`<span class="bd bd--er">${t('grFull')}</span>`}
        </div>
        <div class="grp__n">${L_(D.byId(D.levels,g.level).ar,D.byId(D.levels,g.level).fr)}</div>
        <div class="grp__f la">${g.name} · ${DAYS[g.day][2]} ${g.start}–${g.end}</div>
        <ul class="grp__l">
          <li>${svg('cal')}<span>${DAYS[g.day][ar()?0:1]} · <b class="la">${g.start} – ${g.end}</b></span></li>
          <li>${svg('school')}<span>${L_(g.schoolAr,g.schoolFr)}</span></li>
          <li>${svg('user')}<span>${g.teacher} · ${t('onsite')}</span></li>
          <li>${svg('target')}<span>${g.room} · ${t('grCap')} <b class="la">${g.capacity}</b></span></li>
        </ul>
        <div class="grp__c">
          <svg class="ring" viewBox="0 0 56 56" width="52" height="52">
            <circle class="bg" cx="28" cy="28" r="24"/><circle class="fg" cx="28" cy="28" r="24"
              stroke-dasharray="${dash} ${circ}" style="stroke:var(--lvc)"/></svg>
          <div style="flex:1">
            <div class="flex just-b" style="font-size:.82rem;margin-block-end:5px">
              <span class="muted">${t('grStudents')}</span><b class="la">${g.enrolled}/${g.capacity}</b></div>
            <div class="prg prg--sm"><i data-w="${pct}%" style="width:${pct}%;background:var(--lvc)"></i></div>
          </div>
        </div>
        <div class="cd__f">
          <button class="btn btn--s btn--sm" style="flex:1">${svg('users','width="15" height="15"')}${t('grStudents')}</button>
          <button class="iact" data-edit-group="${esc(g.id)}">${svg('edit')}</button>
          <button class="iact iact--er" data-del-group="${esc(g.id)}">${svg('trash')}</button>
        </div>
      </div>`;}).join('')}
    <div class="grp grp--add rv" data-add-group style="cursor:pointer">
      <div class="center">
        <span class="ico ico--lg mb4" style="margin-inline:auto">${svg('plus')}</span>
        <b data-i18n="grAdd">${t('grAdd')}</b>
        <p class="muted mt3" style="font-size:.85rem" data-i18n="grAddS">${t('grAddS')}</p>
      </div>
    </div>
  </div>`;
}

/* ══════════════════ CONSTRUCTEUR DE QUIZ ══════════════════ */
let QB = null;
function initQB(){
  if(QB) return;
  QB = {
    titleAr:'تمرين جديد', titleFr:'Nouvel exercice', level:'1AM', ax:'grammaire', diff:1, min:15, tries:3,
    questions:[{tf:undefined,t:'Le chat …… dort sur le tapis.',o:['qui','que','dont','où'],a:0,d:1,
                eAr:'« qui » يكون فاعلاً للفعل « dort ».',eFr:'« qui » est sujet du verbe « dort ».'}]
  };
}
function qbForm(){
  return `
  <div class="cd rv" style="--d:60ms">
    <div class="cd__h"><div class="cd__t" data-i18n="qbInfo">${t('qbInfo')}</div><span class="bd bd--gy">${svg('file','width="12" height="12"')}1/3</span></div>
    <div class="g g2" style="gap:16px">
      <div class="fld"><label>${L_('العنوان بالعربية','Titre en arabe')}</label>
        <input class="inp" id="qbTa" value="${QB.titleAr}"></div>
      <div class="fld"><label>${L_('Titre en français','العنوان بالفرنسية')}</label>
        <input class="inp" id="qbTf" dir="ltr" value="${QB.titleFr}"></div>
      <div class="fld"><label data-i18n="qbLevel">${t('qbLevel')}</label>
        <select class="sel" id="qbLv">${D.levels.map(l=>`<option ${l.id===QB.level?'selected':''}>${l.id}</option>`).join('')}</select></div>
      <div class="fld"><label data-i18n="qbAx">${t('qbAx')}</label>
        <select class="sel" id="qbAx">${Object.entries(AXFR).map(([k,v])=>`<option value="${k}" ${k===QB.ax?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="fld"><label data-i18n="qbDiff">${t('qbDiff')}</label>
        <div class="seg" id="qbDiff">${[1,2,3].map(n=>`<button data-v="${n}" class="${QB.diff===n?'on':''}">${t('diff'+n)}</button>`).join('')}</div></div>
      <div class="fld"><label>${L_('المدة (دقائق)','Durée (minutes)')}</label>
        <input class="inp la" id="qbMin" type="number" min="3" max="90" value="${QB.min}"></div>
    </div>
  </div>`;
}
function qbQuestions(){
  return `
  <div class="cd rv" style="--d:120ms">
    <div class="cd__h"><div class="cd__t" data-i18n="qbQs">${t('qbQs')}</div>
      <span class="bd la">${QB.questions.length} ${t('exQ')}</span></div>
    <div id="qbList" class="g gap4">
      ${QB.questions.map((q,i)=>`
        <div class="cd cd--flat" data-qi="${i}" draggable="true" style="background:var(--bg2)">
          <div class="flex items-c gap3 mb4">
            <span class="bd bd--ac la" style="min-width:30px;text-align:center">${i+1}</span>
            <span class="qtype qtype--${q.tf!==undefined?'tf':'mcq'}">${q.tf!==undefined?t('tyTf'):(q.o?t('tyMcq'):t('qbAddFill'))}</span>
            <span class="diff diff--${q.d||1}"><i class="on"></i><i class="${(q.d||1)>=2?'on':''}"></i><i class="${(q.d||1)>=3?'on':''}"></i></span>
            <span class="bd bd--gy la">+${Math.round(X.CFG.xpBase*(X.CFG.multDiff[q.d||1]||1))} XP</span>
            <span class="ico ico--xs" style="cursor:grab;margin-inline-start:auto;color:var(--tx2)">${svg('drag')}</span>
            <button class="iact" data-dup="${i}" title="${L_('تكرار','Dupliquer')}">${svg('copy')}</button>
            <button class="iact" data-mv="${i}" title="${L_('تحويل الصيغة','Changer de type')}">${svg('refresh')}</button>
            <button class="iact iact--er" data-del="${i}" title="${t('del')}">${svg('trash')}</button>
          </div>
          <div class="fld mb4"><label>${L_('نص السؤال','Énoncé')}</label>
            <textarea class="inp ta" dir="ltr" data-f="t" rows="2">${q.t}</textarea></div>
          ${q.tf!==undefined
            ? `<div class="seg" data-seg="tf"><button data-v="1" class="${q.tf?'on':''}">${t('tyTrue')}</button>
                 <button data-v="0" class="${!q.tf?'on':''}">${t('tyFalse')}</button></div>`
            : (q.o
              ? `<div class="g g2" style="gap:10px">${q.o.map((o,j)=>`
                 <div class="fld"><label>${L_('الخيار','Option')} ${'ABCD'[j]}</label>
                   <div class="flex gap2"><input class="inp" dir="ltr" data-o="${j}" value="${String(o).replace(/"/g,'&quot;')}">
                     <button class="btn btn--${q.a===j?'p':'g'} btn--i" data-a="${i}" data-ai="${j}" title="${L_('الإجابة الصحيحة','Bonne réponse')}">${svg('check')}</button>
                   </div></div>`).join('')}</div>`
              : `<div class="fld"><label>${L_('الإجابة الصحيحة (نص)','Bonne réponse (texte)')}</label>
                   <input class="inp" dir="ltr" data-fill-a="${i}" value="${String(q.a||'').replace(/"/g,'&quot;')}"></div>`)}
          <div class="g g2 mt4" style="gap:10px">
            <div class="fld"><label>${L_('الشرح بالعربية','Explication (AR)')}</label>
              <textarea class="inp ta" data-f="eAr" rows="2">${q.eAr||''}</textarea></div>
            <div class="fld"><label>${L_('Explication (FR)','الشرح بالفرنسية')}</label>
              <textarea class="inp ta" data-f="eFr" rows="2" dir="ltr">${q.eFr||''}</textarea></div>
          </div>
        </div>`).join('')}
    </div>
    <div class="flex gap3 mt5 wrap-f">
      <button class="btn btn--g" data-add-q="mcq">${svg('plus','width="17" height="17"')}${t('qbAddMcq')}</button>
      <button class="btn btn--g" data-add-q="tf">${svg('plus','width="17" height="17"')}${t('qbAddTf')}</button>
      <button class="btn btn--g" data-add-q="fill">${svg('plus','width="17" height="17"')}${t('qbAddFill')||L_('سؤال كتابي','Question à compléter')}</button>
      <button class="btn btn--s" data-bank>${svg('book','width="17" height="17"')}${L_('من بنك الأسئلة','Depuis la banque')}</button>
    </div>
  </div>`;
}
function qbPreview(){
  const xpMax = QB.questions.reduce((a,q)=>a+Math.round(X.CFG.xpBase*(X.CFG.multDiff[q.d||1]||1)*(QB.level==='4AM'?1.6:1.2)),0);
  return `
  <div class="cd rv" style="--d:180ms;position:sticky;top:90px">
    <div class="cd__h"><div class="cd__t" data-i18n="qbPrev">${t('qbPrev')}</div><span class="bd bd--ok">${svg('eye','width="12" height="12"')}${L_('مباشر','live')}</span></div>
    <div class="cd cd--flat" style="background:var(--bg2);padding:0;overflow:hidden">
      <div class="qz__bar" style="padding:12px">
        <span class="bd bd--lv ${D.byId(D.levels,QB.level).cls}">${QB.level}</span>
        <span class="bd bd--gy la">${QB.questions.length} ${t('exQ')}</span>
        <span class="qz__tm" style="position:static">${svg('timer','width="15" height="15"')}<span class="la">${QB.min}:00</span></span>
      </div>
      <div style="padding:16px">
        <div style="font-size:.9rem;font-weight:800;margin-block-end:8px">${L_(QB.titleAr,QB.titleFr)}</div>
        <div class="muted la" style="font-size:.82rem;margin-block-end:12px">${AXFR[QB.ax]} · ${t('diff'+QB.diff)}</div>
        ${QB.questions[0]?(()=>{const q=QB.questions[0];return `
          <div class="qn" style="padding:0">
            <div class="qn__t" dir="ltr" style="text-align:start;font-size:.88rem">${q.t}</div>
            ${q.tf!==undefined
              ? `<div class="qn__x" style="margin-block-start:10px">
                   <button class="qo dis" style="padding:8px"><i>A</i><span>${t('tyTrue')}</span></button>
                   <button class="qo dis ok" style="padding:8px"><i>B</i><span>${t('tyFalse')}</span></button></div>`
              : `<div class="qn__x" style="margin-block-start:10px">
                   ${q.o.map((o,j)=>`<button class="qo dis ${j===q.a?'ok':''}" style="padding:8px;font-size:.82rem"><i>${'ABCD'[j]}</i><span dir="ltr">${o}</span></button>`).join('')}</div>`}
          </div>`;})():`<div class="empty"><span class="ico ico--lg" style="margin-inline:auto">${svg('quiz')}</span><b>${t('qbEmpty')}</b></div>`}
      </div>
    </div>
    <div class="mt4">
      <div class="flex just-b" style="font-size:.85rem;margin-block-end:6px">
        <span class="muted">${L_('XP الأقصى','XP maximum')}</span><b class="la acc">≈ ${xpMax} XP</b></div>
      <div class="flex just-b" style="font-size:.85rem;margin-block-end:6px">
        <span class="muted">${L_('عدد الأسئلة','Questions')}</span><b class="la">${QB.questions.length}</b></div>
      <div class="flex just-b" style="font-size:.85rem">
        <span class="muted">${L_('صعوبة متوسطة','Difficulté moyenne')}</span>
        <span class="diff diff--${QB.diff}"><i class="on"></i><i class="${QB.diff>=2?'on':''}"></i><i class="${QB.diff>=3?'on':''}"></i></span></div>
    </div>
    <div class="g gap2 mt5">
      <button class="btn btn--p btn--blk" data-save-quiz>${svg('save','width="17" height="17"')}${t('qbSave')}</button>
      <div class="flex gap2">
        <button class="btn btn--g" style="flex:1" data-save-draft>${t('qbDraft')}</button>
        <button class="btn btn--g btn--i" data-reset-qb title="${L_('إفراغ','Réinitialiser')}">${svg('trash')}</button>
      </div>
    </div>
    <p class="muted mt4" style="font-size:.78rem;line-height:1.7">${svg('info','width="13" height="13" style="display:inline;vertical-align:-2px"')} ${t('qbNote')}</p>
  </div>`;
}
function quizBuilder(){
  initQB();
  return `<div class="g g-main adm-split" style="--adm-side:320px">
    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">${qbForm()}${qbQuestions()}</div>
    <div style="min-width:0">${qbPreview()}</div>
  </div>`;
}
function bindQB(panel){
  const up=(fn)=>{ fn(); const p=panel; p.innerHTML=quizBuilder(); bindQB(p); window.PKi18n.translateDom(window.PKi18n.current()); replayFx(p); };
  $$('[data-add-q]',panel).forEach(b=> b.addEventListener('click',()=>{
    const k=b.dataset.addQ;
    QB.questions.push(k==='tf'
      ? {tf:true,t:'Le participe passé « écrit » s’accorde avec « avoir ».',d:1,eAr:'مع avoir لا يتفق إلا إذا تقدم المفعول به.',eFr:'Avec « avoir », accord seulement si le COD est placé avant.'}
      : k==='fill'
      ? {a:'ont',t:'Ils …… (avoir) fini leurs devoirs.',d:2,eAr:'الفعل avoir مع ils في الحاضر: ont.',eFr:'« avoir » conjugué avec « ils » au présent : ont.'}
      : {t:'…… est la capitale de l’Algérie ?',o:['Alger','Oran','Constantine','Annaba'],a:0,d:1,eAr:'الجزائر العاصمة.',eFr:'Alger est la capitale de l’Algérie.'});
    up(()=>{}); toast(t('qbAdded')||L_('أُضيف سؤال','Question ajoutée'),'ok',1800);
  }));
  $$('[data-del]',panel).forEach(b=> b.addEventListener('click',()=> up(()=>{ QB.questions.splice(+b.dataset.del,1); })));
  $$('[data-dup]',panel).forEach(b=> b.addEventListener('click',()=> up(()=>{ QB.questions.splice(+b.dataset.dup+1,0,JSON.parse(JSON.stringify(QB.questions[+b.dataset.dup]))); })));
  $$('[data-mv]',panel).forEach(b=> b.addEventListener('click',()=> up(()=>{
    const q=QB.questions[+b.dataset.mv];
    if(q.tf!==undefined){ delete q.tf; q.o=['Vrai','Faux']; q.a=0; }
    else { q.tf=true; delete q.o; delete q.a; }
  })));
  $$('[data-a]',panel).forEach(b=> b.addEventListener('click',()=> up(()=>{ QB.questions[+b.dataset.a].a=+b.dataset.ai; })));
  $$('[data-seg] button',panel).forEach(b=> b.addEventListener('click',()=> up(()=>{
    const card=b.closest('[data-qi]'); QB.questions[+card.dataset.qi].tf = b.dataset.v==='1';
  })));
  $$('[data-f]',panel).forEach(inp=> inp.addEventListener('input',()=>{
    QB.questions[+inp.closest('[data-qi]').dataset.qi][inp.dataset.f]=inp.value;
    const pv=panel.querySelector('.cd[style*="sticky"]'); if(pv) pv.outerHTML=qbPreview(); bindQB(panel);
  }));
  $$('[data-o]',panel).forEach(inp=> inp.addEventListener('input',()=>{
    QB.questions[+inp.closest('[data-qi]').dataset.qi].o[+inp.dataset.o]=inp.value;
  }));
  $$('[data-fill-a]',panel).forEach(inp=> inp.addEventListener('input',()=>{
    QB.questions[+inp.dataset.fillA].a=inp.value;
  }));
  $$('[data-mv]',panel).forEach(b=>{});
  const bind=(id,fn)=>{ const e=$(id,panel); if(e) e.addEventListener('input',fn); if(e) e.addEventListener('change',fn); };
  bind('#qbTa',e=>{QB.titleAr=e.target.value; const h=panel.querySelector('.qz__bar + div > div'); if(h) h.textContent=QB.titleAr;});
  bind('#qbTf',e=>{QB.titleFr=e.target.value;});
  bind('#qbLv',e=>{QB.level=e.target.value;});
  bind('#qbAx',e=>{QB.ax=e.target.value;});
  bind('#qbMin',e=>{QB.min=+e.target.value||15;});
  $$('#qbDiff button',panel).forEach(b=> b.addEventListener('click',()=> up(()=>{ QB.diff=+b.dataset.v; })));
  /* Enregistrement COMPLET : on écrivait avant uniquement le NOMBRE de
     questions → l'exercice publié était vide pour les élèves. */
  const save = async (pub)=>{
    up(()=>{});
    if(!QB.questions.length){ toast(t('qbNeedQ'),'er',3200); return; }
    const lv = QB.level || '1AM';
    const doc = {
      titleAr:QB.titleAr || QB.titleFr, titleFr:QB.titleFr || QB.titleAr,
      ar:QB.titleAr || QB.titleFr, fr:QB.titleFr || QB.titleAr,
      descAr:QB.descAr || '', descFr:QB.descFr || QB.descAr || '',
      level:lv, ax:QB.ax, diff:QB.diff, min:QB.min, type:'quiz', tries:QB.tries||3,
      questions: QB.questions.map(q=>Object.assign({}, q)),
      q: QB.questions.length,
      xpMax: QB.questions.reduce((a,q)=>a+Math.round(X.CFG.xpBase*(X.CFG.multDiff[q.d||1]||1)*(lv==='4AM'?1.6:1.2)),0),
      published: !!pub
    };
    try{
      await window.PKdb.add('exercises', doc);
      if(pub) confetti(60);
      toast(pub ? t('qbSaved') : t('qbDrafted'), pub?'ok':'info',3000);
      refresh();
    }catch(e){ cardErr(e); }
  };
  const sb=$('[data-save-quiz]',panel); if(sb) sb.addEventListener('click',()=>save(true));
  const db=$('[data-save-draft]',panel); if(db) db.addEventListener('click',()=>save(false));
  const rb=$('[data-reset-qb]',panel); if(rb) rb.addEventListener('click',()=>{ QB=null; up(()=>{}); toast(L_('أُفرغ النموذج','Formulaire réinitialisé'),'wn',2000); });
  const bk=$('[data-bank]',panel); if(bk) bk.addEventListener('click',()=> toast(L_('بنك الأسئلة: 240 سؤالاً جاهزاً (تجريبي)','Banque de questions : 240 questions prêtes (démo)'),'info',3000));
}

/* ══════════════════ LEÇONS ══════════════════ */
function lessons(){
  return `
  <div class="flex just-b items-c wrap-f gap4 mb5">
    <div><h2 style="font-size:1.35rem" data-i18n="lsList">${t('lsList')}</h2>
      <p class="muted" style="font-size:.9rem"><span class="la">${D.lessons.length}</span> ${t('lsListS')}</p></div>
    <div class="flex gap2 wrap-f">
      <div class="srch">${svg('search')}<input class="inp inp--sm" placeholder="${t('lsSearch')}"></div>
      <select class="sel sel--sm" style="width:auto"><option>${t('allLevels')}</option>${D.levels.map(l=>`<option>${l.id}</option>`).join('')}</select>
      <button class="btn btn--p btn--sm" data-add-lesson>${svg('plus','width="16" height="16"')}${t('lsNew')}</button>
    </div>
  </div>
  <div class="g g3 cas">
    ${D.lessons.map(l=>{
      const ex=D.exercises.filter(e=>e.lessonId===l.id).length;
      const ax=D.axes.find(a=>a.id===l.ax);
      const pub=(l.published!==undefined ? !!l.published : !!l.done);
      return `<div class="lsn rv" data-lesson="${l.id}">
        <div class="lsn__t"><span class="lv__b ${D.byId(D.levels,l.level).cls}">${l.level}</span>
          <span class="bd bd--gy">${ax?L_(ax.ar,ax.fr):(AXFR[l.ax]||l.ax)}</span>
          ${l.isNew?`<span class="bd bd--ac">${svg('spark','width="11" height="11"')}${t('lsNew')}</span>`:''}
          <span class="bd ${pub?'bd--ok':'bd--wn'}" style="margin-inline-start:auto">${pub?t('lsPub'):t('lsDraft')}</span></div>
        <h3 class="lsn__n" dir="ltr">${L_(l.ar,l.fr)}</h3>
        <p class="lsn__d">${L_(l.sumAr,l.sumFr)}</p>
        <div class="lsn__f la">
          <span>${svg('clock','width="13" height="13"')}${l.min} min</span>
          <span>${svg('quiz','width="13" height="13"')}${ex}</span>
          <span>${svg('bolt','width="13" height="13"')}${l.xp||25} XP</span>
          <span>${svg('file','width="13" height="13"')}${l.files||0} ${t('lsPdf')}</span>
          ${l.video?`<span>${svg('play','width="13" height="13"')}${t('lsVideo')}</span>`:''}
        </div>
        <div class="cd__f"><button class="btn btn--s btn--sm" style="flex:1" data-edit-lesson="${esc(l.id)}">${svg('edit','width="15" height="15"')}${t('edit')}</button>
          <a class="btn btn--g btn--sm" href="${esc(l.level)}" onclick="return false" title="${esc(l.level)}">${svg('eye','width="15" height="15"')}</a>
          <button class="iact iact--er" data-del-lesson="${esc(l.id)}">${svg('trash')}</button></div>
      </div>`;}).join('')}
  </div>
  <div class="cd mt5 rv">
    <div class="cd__t mb4" data-i18n="lsEd">${t('lsEd')}</div>
    <div class="cd__s mb5" data-i18n="lsEdS">${t('lsEdS')}</div>
    <div class="g g2 mt4" style="gap:14px">
      <div class="fld"><label data-i18n="lsEdTitleAr">${t('lsEdTitleAr')}</label>
        <input class="inp" id="lsAr" placeholder="${L_('مثال: الضمائر الموصولة','Ex. : Les pronoms relatifs')}"></div>
      <div class="fld"><label data-i18n="lsEdTitleFr">${t('lsEdTitleFr')}</label>
        <input class="inp" id="lsFr" dir="ltr" placeholder="Ex. : Les pronoms relatifs"></div>
      <div class="fld"><label data-i18n="lsEdLv">${t('lsEdLv')}</label>
        <select class="sel" id="lsLv">${D.levels.map(l=>`<option value="${l.id}">${l.id}</option>`).join('')}</select></div>
      <div class="fld"><label data-i18n="lsEdAx">${t('lsEdAx')}</label>
        <select class="sel" id="lsAx">${Object.entries(AXFR).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="fld"><label data-i18n="lsEdSumAr">${t('lsEdSumAr')}</label>
        <input class="inp" id="lsSumAr"></div>
      <div class="fld"><label data-i18n="lsEdSumFr">${t('lsEdSumFr')}</label>
        <input class="inp" id="lsSumFr" dir="ltr"></div>
      <div class="fld"><label data-i18n="lsEdMin">${t('lsEdMin')}</label>
        <input class="inp la" id="lsMin" type="number" min="5" max="180" value="20"></div>
      <div class="fld"><label data-i18n="lsEdXp">${t('lsEdXp')}</label>
        <input class="inp la" id="lsXp" type="number" min="5" max="200" value="25"></div>
    </div>
    <input type="hidden" id="lsId">
    <div class="ed__t">
      ${[['bold','B'],['italic','I'],['underline','U'],['h','H2'],['list','•'],['quote','❝'],['link','🔗'],['code','</>']]
        .map(([k,lb])=>`<button class="ed__b" data-ed="${k}" title="${k}">${lb}</button>`).join('')}
      <span style="margin-inline-start:auto;display:flex;gap:8px">
        <button class="btn btn--g btn--sm" data-ls-save>${svg('save','width="15" height="15"')}${t('lsEdSaveDraft')}</button>
        <button class="btn btn--p btn--sm" data-ls-pub>${svg('up','width="15" height="15"')}${t('lsEdPublish')}</button></span>
    </div>
    <div class="cd__s mb3" data-i18n="lsEdContent">${t('lsEdContent')}</div>
    <div class="ed__b2" id="lsBody" contenteditable="true" dir="ltr" style="min-height:180px;padding:20px;border:1px solid var(--line);border-radius:0 0 var(--r2) var(--r2);font-size:.95rem;line-height:1.9">
      <h3 style="margin:0 0 10px">Les pronoms relatifs</h3>
      <p><b>qui</b> → sujet · <b>que</b> → COD · <b>dont</b> → complément introduit par « de » · <b>où</b> → lieu / temps</p>
      <p style="color:#55617E">Exemple : Le livre <i>dont</i> je parle est intéressant.</p>
    </div>
    <div class="g g3 mt4" style="gap:14px">
      <div class="fld"><label>${L_('المستوى','Niveau')}</label><select class="sel sel--sm">${D.levels.map(l=>`<option>${l.id}</option>`).join('')}</select></div>
      <div class="fld"><label>${L_('المحور','Axe')}</label><select class="sel sel--sm">${Object.values(AXFR).map(v=>`<option>${v}</option>`).join('')}</select></div>
      <div class="fld"><label>${L_('المدة (دقائق)','Durée (min)')}</label><input class="inp inp--sm la" type="number" value="25"></div>
    </div>
  </div>`;
}

/* ══════════════════ SUIVI DE PROGRESSION ══════════════════ */
function progression(){
  const st=D.students.map(stn);
  const ranks=X.RANKS.map((r,i)=>({r, n:st.filter(s=>X.rankOf(s.xp).ar===r.ar).length}));
  const maxR=Math.max(1,...ranks.map(x=>x.n));
  const bdgCount={};
  st.forEach(s=>(s.badges||[]).forEach(b=>{ bdgCount[b]=(bdgCount[b]||0)+1; }));
  return `
  <div class="kpis cas">
    ${[[t('stTotalXp'),st.reduce((a,s)=>a+s.xp,0).toLocaleString('fr-FR'),'bolt','ico--wn'],
       [t('stAvgXp'),Math.round(st.reduce((a,s)=>a+s.xp,0)/st.length).toLocaleString('fr-FR'),'trend',''],
       [t('stExDone'),st.reduce((a,s)=>a+s.exDone,0),'quiz','ico--cy'],
       [t('stAccuracy'),Math.round(st.reduce((a,s)=>a+s.correct/s.answered*100,0)/st.length)+'%','checkc','ico--ok']]
      .map(([l,v,ic,c])=>`<div class="kpi rv"><div class="kpi__t"><span class="ico ico--sm ${c}">${svg(ic)}</span></div>
        <div class="kpi__n la">${v}</div><div class="kpi__l">${l}</div></div>`).join('')}
  </div>
  <div class="g g2 mt5 cas adm-split adm-split--rev" style="--adm-side:380px">
    <div class="cd rv">
      <div class="cd__h"><div><div class="cd__t" data-i18n="stRanks">${t('stRanks')}</div>
        <div class="cd__s">${L_('توزيع الرتب','Répartition des rangs')}</div></div></div>
      <div class="ranks">
        ${ranks.map(({r,n})=>`<div class="rk">
          <span class="rk__i">${svg(r.icon)}</span>
          <div class="rk__b"><div class="flex just-b" style="font-size:.84rem;margin-block-end:5px">
            <b>${L_(r.ar,r.fr)}</b><span class="la muted">${n} · ${r.min.toLocaleString('fr-FR')} XP</span></div>
            <div class="prg prg--sm"><i data-w="${Math.round(n/maxR*100)}%" style="width:${Math.round(n/maxR*100)}%"></i></div></div>
        </div>`).join('')}
      </div>
    </div>
    <div class="cd rv" style="--d:80ms">
      <div class="cd__h"><div><div class="cd__t" data-i18n="stBadges">${t('stBadges')}</div>
        <div class="cd__s">${L_('الأوسمة الأكثر حصولاً عليها','Badges les plus obtenus')}</div></div>
        <span class="bd bd--wn la">${Object.keys(bdgCount).length}/${X.BADGES.length}</span></div>
      <div class="bdgrid">
        ${X.BADGES.sort((a,b)=>(bdgCount[b.id]||0)-(bdgCount[a.id]||0)).map(b=>{
          const n=bdgCount[b.id]||0;
          return `<div class="bdgc ${n?'':'off'}" title="${t(b.i18n)}">
            <span class="bdgc__i">${svg(b.icon)}</span>
            <b>${t(b.i18n)}</b><small class="la">${n?n+' '+L_('تلميذ','élèves'):L_('لم يُفتح بعد','pas encore')}</small>
          </div>`;}).join('')}
      </div>
    </div>
  </div>
  <div class="cd mt5 rv">
    <div class="cd__h cd__h--b"><div><div class="cd__t">${L_('جدول تقدم التلاميذ','Tableau de progression des élèves')}</div>
      <div class="cd__s">${L_('XP · سلسلة · إتقان — بدون أي نقطة مدرسية','XP · série · maîtrise — aucune note scolaire')}</div></div>
      <button class="btn btn--g btn--sm">${svg('up','width="16" height="16"')}CSV</button></div>
    <div class="tbw"><table class="tb" style="min-width:1000px">
      <thead><tr><th>${t('stuName')}</th><th>${t('stuLevel')}</th><th>XP</th><th>${t('rank')}</th>
        <th>${t('streak')}</th><th>${t('exDone')}</th><th>${t('accuracy')}</th><th>${t('mastery')}</th><th>${t('badges')}</th></tr></thead>
      <tbody>${st.map(s=>{const r=X.rankOf(s.xp), rp=X.rankProgress(s.xp), gm=X.globalMastery(s.mastery),
        acc=s.answered?Math.round(s.correct/s.answered*100):0; return `<tr>
        <td><div class="who"><span class="av" style="background:${s.color||'#1E4FD8'}">${ini(s.fr)}</span><div><b>${L_(s.ar,s.fr)}</b><small>${s.group}</small></div></div></td>
        <td><span class="bd bd--lv ${D.byId(D.levels,s.level).cls}">${s.level}</span></td>
        <td><b class="la acc">${s.xp.toLocaleString('fr-FR')}</b></td>
        <td><div style="min-width:110px"><div class="flex just-b" style="font-size:.78rem;margin-block-end:4px">
          <span class="muted">${L_(r.ar,r.fr)}</span><span class="la faint">${rp.pct}%</span></div>
          <div class="prg prg--sm"><i data-w="${rp.pct}%" style="width:${rp.pct}%"></i></div></div></td>
        <td><span class="la">${svg('flame','width="13" height="13" fill="var(--wn)" stroke="none" style="display:inline;vertical-align:-2px"')} ${s.streak}</span></td>
        <td class="la">${s.exDone}</td>
        <td><span class="bd ${acc>=80?'bd--ok':acc>=55?'bd--wn':'bd--er'} la">${acc}%</span></td>
        <td><b class="la">${gm}%</b></td>
        <td><div class="flex gap2">${(s.badges||[]).slice(0,4).map(id=>{const b=X.BADGES.find(x=>x.id===id);return b?`<span class="ico ico--xs" title="${t(b.i18n)}">${svg(b.icon)}</span>`:'';}).join('')}
          ${(s.badges||[]).length>4?`<span class="bd bd--gy la">+${(s.badges||[]).length-4}</span>`:''}</div></td>
      </tr>`;}).join('')}</tbody></table></div>
  </div>`;
}

/* ══════════════════ ASSEMBLAGE ══════════════════ */
const MODS={
  overview:{t:()=>t('adOverview'),  ic:'grid',   fn:overview},
  bank:    {t:()=>t('adQbank'),    ic:'layers', fn:qbank, hidden:true},
  tt:      {t:()=>t('adTT'),        ic:'cal',    fn:timetable},
  students:{t:()=>t('adStudents'),  ic:'users',  fn:students},
  reg:     {t:()=>t('adReg'),       ic:'mail',   fn:registrations, bind:bindRegs},
  groups:  {t:()=>t('adGroupsM'),   ic:'school', fn:groups},
  quiz:    {t:()=>t('adQuiz'),      ic:'quiz',   fn:quizBuilder, bind:bindQB},
  lessons: {t:()=>t('adLessons'),   ic:'book',   fn:lessons},
  prog:    {t:()=>t('adProg'),      ic:'trend',  fn:progression},
  announce:{t:()=>t('adAnn'),       ic:'bell',   fn:announce, hidden:true},
  messages:{t:()=>t('adMsg'),       ic:'msg',    fn:messages, bind:bindMessages, hidden:true},
  settings:{t:()=>t('adSet'),       ic:'set',    fn:settings, hidden:true, bind:bindSettings}
};
let cur = 'overview';
function moduleFromHash(){
  const h = String(location.hash).replace('#','');
  return MODS[h] ? h : 'overview';
}

function render(mn){
  L = window.PKi18n.current();
  /* حماية اللوحة في الوضع الحيّ : role admin فقط */
  if(!window.PKdb.mock && !(window.PKdata.me && window.PKdata.me.role==='admin')){
    /* trois cas distincts : non connecté / connecté sans rôle admin / base locale */
    mn.innerHTML = window.PKapp.PKgate.adminGate();
    window.PKapp.PKgate.bind(mn, ()=>render(mn)); return;
  }
  cur = moduleFromHash();
  const keys = Object.keys(MODS);   // la barre affiche : principaux + secondaires (sauf « bank »)
  mn.innerHTML = `
  <div class="mn__t">
    <div><div class="crumb"><a href="../index.html">${L_('الموقع','Site')}</a>${svg('chev')}<span>${t('adPanel')}</span></div>
      <h1 id="adTitle">${MODS[cur].t()}</h1>
      <p id="adSub">${L_('إدارة الدروس والتمارين والتلاميذ والأفواج والحصص — كل شيء في مكان واحد',
        'Gérer les cours, exercices, élèves, groupes et séances — tout au même endroit')}</p></div>
    <div class="mn__a">
      <button class="btn btn--g btn--i" id="adSearch" title="Ctrl+K">${svg('search')}</button>
      <div class="lgsw"><button data-lang="ar">AR</button><button data-lang="fr">FR</button></div>
      <button class="btn btn--g btn--i" data-theme-btn>${svg('moon')}</button>
      <a href="../student/index.html" class="btn btn--g btn--sm">${svg('eye','width="16" height="16"')}${L_('فضاء التلميذ','Espace élève')}</a>
      <button class="btn btn--p btn--sm" id="adPublish">${svg('up','width="16" height="16"')}${t('adPublish')}</button>
    </div>
  </div>
  <div class="tabs mb5" id="adTabs">
    ${keys.filter(k=>!MODS[k].hidden).map(k=>`<button data-atab="${k}" class="${k===cur?'on':''}">${svg(MODS[k].ic,'width="16" height="16"')}<span>${MODS[k].t()}</span></button>`).join('')}
    <span class="tabs__sp"></span>
    ${keys.filter(k=>MODS[k].hidden).map(k=>`<button data-atab="${k}" class="${k===cur?'on':''}">${svg(MODS[k].ic,'width="16" height="16"')}<span>${MODS[k].t()}</span></button>`).join('')}
  </div>
  <div id="adPanel"></div>`;

  /* palette de commandes (Ctrl+K / 🔍) : elle était vide dans l'admin.
     Chaque entrée ouvre réellement son module (aucun lien mort). */
  window.PK.setPalette(Object.keys(MODS).map(k=>({
    label: MODS[k].t(), icon: MODS[k].ic, group: t('adPanel'),
    run: ()=>{ if(moduleFromHash() === k){ cur = k; show(mn); } else location.hash = k; }
  })));
  $('#adSearch',mn).addEventListener('click',()=>window.PK.openPalette());
  $('#adPublish',mn).addEventListener('click',()=>{ confetti(70); toast(t('adPublished')||L_('تم النشر بنجاح ✓','Publication réussie ✓'),'ok',3000); });
  $$('[data-atab]',mn).forEach(b=> b.addEventListener('click',()=>{ cur=b.dataset.atab; show(mn); }));
  mn.addEventListener('click', e=>{ const j=e.target.closest('[data-atab-jump]'); if(j){ cur=j.dataset.atabJump; show(mn); } });
  show(mn);
  syncTop(mn);
}
function show(mn){
  const panel = $('#adPanel', mn) || $('#adPanel');
  const host = panel || mn;
  /* Isolation du rendu : en cas d'erreur on affiche un message honnête avec la
     cause — au lieu de laisser le panneau précédent à l'écran (l'utilisateur
     croirait alors que « cliquer sur التلاميذ » ramène à la page d'accueil). */
  let inner;
  try{
    inner = MODS[cur].fn();
  }catch(err){
    if(window.console) console.error('[PK] module « '+cur+' » :', err);
    inner = `<div class="cd" style="max-width:640px">
      <div class="cd__t">${t('modErrT')}</div>
      <p class="muted" style="font-size:.88rem;line-height:1.8">${t('modErrS')}</p>
      <pre dir="ltr" style="white-space:pre-wrap;word-break:break-word;background:var(--bg2,#f1f3f8);border-radius:10px;padding:10px 12px;font-size:.8rem">${esc(String((err && err.message) || err)).slice(0,400)}</pre>
      <button class="btn btn--p btn--sm mt3" data-mod-retry>${t('regRetry')}</button></div>`;
  }
  host.innerHTML = `<div class="atab lpn" data-panel="${cur}">${inner}</div>`;
  const p = host.firstChild;
  const rr = $('[data-mod-retry]', p); if(rr) rr.addEventListener('click', ()=>show(mn));
  if(MODS[cur].bind) MODS[cur].bind(p);
  $('#adTitle') && ($('#adTitle').textContent = MODS[cur].t());
  $$('[data-atab]').forEach(b=> b.classList.toggle('on', b.dataset.atab===cur));
  window.PKi18n.translateDom(window.PKi18n.current());
  window.PK.initReveal(p); window.PK.initProgress(p); replayFx(p);
  bindCommon(p);
}
function bindCommon(p){
  /* ══════════════════════════════════════════════════════════════
     Actions réelles (fini les boutons « démo ») :
     élève · groupe/séance · liaison e-mail · annonce · cours · impression
     ══════════════════════════════════════════════════════════════ */

  /* ── طلبات التسجيل : فتح الوحدة مباشرة ── */
  const gr=$('[data-goto-reg]',p);
  if(gr) gr.addEventListener('click', e=>{
    e.preventDefault();
    location.hash = 'reg';
    cur = 'reg';
    const mn = document.querySelector('.mn') || document;
    show(mn);
    window.scrollTo(0,0);
  });

  /* ── élèves ── */
  const as=$('[data-add-student]',p); if(as) as.addEventListener('click', ()=>openStudentForm());
  const al=$('[data-add-lesson]',p);  if(al) al.addEventListener('click', ()=>newLesson());
  $$('[data-edit-student]',p).forEach(b=> b.addEventListener('click', ()=>{
    const s=D.students.find(x=>x.id===b.dataset.editStudent); if(s) openStudentForm({student:s});
  }));
  $$('[data-del-student]',p).forEach(b=> b.addEventListener('click', async ()=>{
    if(!window.confirm(t('confirmDel'))) return;
    try{ await window.PKdb.remove('students', b.dataset.delStudent); window.PK.toast(t('studentDeleted'),'ok',2400); refresh(); }
    catch(e){ cardErr(e); }
  }));

  /* ── liaison e-mail ↔ fiche ── */
  const lk=$('[data-link]',p);
  if(lk) lk.addEventListener('click', ()=>{
    openLinkDialog({email: valOf('lkEmail'), studentId: valOf('lkStudent')});
  });
  const bf=$('[data-backfill]',p);
  if(bf) bf.addEventListener('click', async ()=>{
    bf.disabled = true;
    try{
      const r = await window.PKdb.backfillLinks();
      window.PK.toast(r && r.ok ? t('backfillOk')+' ('+(r.added||0)+')' : t('linkErr'), (r&&r.ok)?'ok':'er', 3600);
      refresh();
    }catch(e){ cardErr(e); } finally{ bf.disabled = false; }
  });

  /* ── demandes en attente : relier ou créer la fiche ── */
  $$('[data-approve-user]',p).forEach(b=> b.addEventListener('click', ()=>{
    openLinkDialog({email:b.dataset.mail, uid:b.dataset.approveUser});
  }));
  $$('[data-new-for]',p).forEach(b=> b.addEventListener('click', ()=>{
    openStudentForm({email:b.dataset.mail, name:b.dataset.name});
  }));

  /* ── groupes / séances ── */
  $$('[data-add-group]',p).forEach(b=> b.addEventListener('click', ()=>openGroupForm()));
  const ns=$('[data-new-session]',p); if(ns) ns.addEventListener('click', ()=>openGroupForm());
  $$('[data-del-group]',p).forEach(b=> b.addEventListener('click', async ()=>{
    if(!window.confirm(t('confirmDel'))) return;
    try{ await window.PKdb.remove('groups', b.dataset.delGroup); window.PK.toast(t('grpDeleted'),'ok',2400); refresh(); }
    catch(e){ cardErr(e); }
  }));
  $$('[data-edit-group]',p).forEach(b=> b.addEventListener('click', ()=>{
    const g=D.groups.find(x=>x.id===b.dataset.editGroup); if(g) openGroupForm(g);
  }));

  /* ── annonces ── */
  const sn=$('[data-send-ann]',p);
  if(sn) sn.addEventListener('click', async ()=>{
    const ar=valOf('anAr'), fr=valOf('anFr'), body=valOf('anBody');
    if(!ar && !fr && !body){ window.PK.toast(t('annNeedText'),'er',3200); return; }
    const aud=valOf('anAud');
    const doc={
      ar:ar||fr, fr:fr||ar, titleAr:ar||fr, titleFr:fr||ar,
      arBody:body, frBody:body, bodyAr:body, bodyFr:body,
      i18n:{ar:ar||fr, fr:fr||ar, arBody:body, frBody:body, bodyAr:body, bodyFr:body},
      importance:valOf('anImp')||'info',
      audienceAr:aud||'', audienceFr:aud||'',
      pinned: !!(document.getElementById('anPin') && document.getElementById('anPin').checked),
      date: new Date().toISOString().slice(0,10)
    };
    sn.disabled = true;
    try{ await window.PKdb.add('announcements', doc); window.PK.toast(t('annPublished'),'ok',3200); refresh(); }
    catch(e){ cardErr(e); } finally{ sn.disabled = false; }
  });
  $$('[data-del-ann]',p).forEach(b=> b.addEventListener('click', async ()=>{
    if(!window.confirm(t('confirmDel'))) return;
    try{ await window.PKdb.remove('announcements', b.dataset.delAnn); window.PK.toast(t('annDeleted'),'ok',2400); refresh(); }
    catch(e){ cardErr(e); }
  }));
  $$('[data-pin-ann]',p).forEach(b=> b.addEventListener('click', async ()=>{
    try{ await window.PKdb.set('announcements', b.dataset.pinAnn, {pinned: b.dataset.pin!=='1'}); refresh(); }
    catch(e){ cardErr(e); }
  }));

  /* ── cours (éditeur) ── */
  $$('[data-edit-lesson]',p).forEach(b=> b.addEventListener('click', ()=>openLessonEditor(b.dataset.editLesson)));
  $$('[data-del-lesson]',p).forEach(b=> b.addEventListener('click', async ()=>{
    if(!window.confirm(t('confirmDel'))) return;
    try{ await window.PKdb.remove('lessons', b.dataset.delLesson); window.PK.toast(t('lsDeleted'),'ok',2400); refresh(); }
    catch(e){ cardErr(e); }
  }));
  if($('#lsBody',p)) bindLessonEditor(p);

  /* ── impression (le CSS d'impression existe déjà) ── */
  $$('[data-print]',p).forEach(b=> b.addEventListener('click', ()=>{
    window.PK.toast(t('printGo'),'info',1800);
    setTimeout(()=>window.print(), 350);
  }));

  /* ── filtres / recherche du tableau des élèves (inchangés) ── */
  const f=$('#stuFilter',p);
  if(f) f.addEventListener('input',()=>{
    const v=f.value.trim().toLowerCase();
    $$('#stuTable tbody tr',p).forEach(tr=>{
      tr.style.display = (!v || tr.textContent.toLowerCase().includes(v)) ? '' : 'none';
    });
  });
  const lv=$('#stuLevel',p);
  if(lv) lv.addEventListener('change',()=>{ $$('.chip',p).forEach(c=>c.classList.toggle('on', c.dataset.f===(lv.value||'all'))); filterChips(p, lv.value||'all'); });
  $$('.chip',p).forEach(c=> c.addEventListener('click',()=>{
    $$('.chip',p).forEach(x=>x.classList.toggle('on',x===c)); filterChips(p,c.dataset.f); }));

  /* ── fiche détaillée d'un élève ── */
  $$('[data-view-student]',p).forEach(b=> b.addEventListener('click', ()=>{
    const raw=D.students.find(x=>x.id===b.dataset.viewStudent); if(!raw) return;
    const s=stn(raw);
    const r=X.rankOf(s.xp), rp=X.rankProgress(s.xp);
    const acc=s.answered?Math.round(s.correct/s.answered*100):0, mst=X.globalMastery(s.mastery);
    modal(`<div class="md">
      <div class="md__h"><div class="who"><span class="av" style="background:${s.color};width:44px;height:44px;font-size:1rem">${esc(ini(s.fr||s.ar||'--'))}</span>
        <div><b style="font-size:1.05rem">${esc(L_(s.ar,s.fr)||'—')}</b><small class="muted">${esc(s.group||'—')} · ${esc(s.level)}</small></div></div>
        <button class="iact" data-close>${svg('x')}</button></div>
      <div class="md__b">
        <div class="flex items-c gap3 mb4"><span class="ico">${svg(r.icon)}</span>
          <div><b>${L_(r.ar,r.fr)}</b><div class="muted la" style="font-size:.82rem">${s.xp.toLocaleString('fr-FR')} XP · ${rp.pct}%</div></div></div>
        <div class="prg mb5"><i style="width:${rp.pct}%"></i></div>
        <div class="g g3 mb5" style="gap:12px">
          ${[[t('streak'),s.streak],[t('accuracy'),acc+'%'],[t('mastery'),mst+'%']]
            .map(([l,v])=>`<div class="cd cd--flat" style="background:var(--bg2);padding:14px;text-align:center">
              <div class="la" style="font-size:1.3rem;font-weight:800">${v}</div><div class="muted" style="font-size:.78rem">${l}</div></div>`).join('')}
        </div>
        <div class="cd__t mb4" style="font-size:.95rem">${t('mastery')}</div>
        <div class="g gap3">${Object.entries(s.mastery).map(([k,v])=>`<div>
          <div class="flex just-b" style="font-size:.82rem;margin-block-end:5px"><b class="la">${esc(AXFR[k]||k)}</b><span class="la muted">${v}%</span></div>
          <div class="prg prg--sm"><i style="width:${v}%"></i></div></div>`).join('')}</div>
        <div class="cd__t mt5 mb3" style="font-size:.95rem">${t('badges')}</div>
        <div class="flex gap3 wrap-f">${s.badges.map(id=>{const b=X.BADGES.find(x=>x.id===id);return b?`<span class="bd">${svg(b.icon,'width="13" height="13"')}${t(b.i18n)}</span>`:'';}).join('')||`<span class="muted">${t('empty')}</span>`}</div>
      </div>
      <div class="md__f"><button class="btn btn--g" data-close>${t('close')}</button>
        <button class="btn btn--p" data-edit-student="${esc(s.id)}">${svg('edit','width="17" height="17"')}${t('edit')}</button></div>
    </div>`).el.querySelector('[data-edit-student]').addEventListener('click', ()=>{
      document.querySelectorAll('.mdl').forEach(m=>m.remove());
      openStudentForm({student:s});
    });
  }));
}
function filterChips(p,f){
  $$('#stuTable tbody tr',p).forEach(tr=>{
    const txt2=tr.textContent.toLowerCase();
    let show=true;
    if(f==='unlinked') show=txt2.includes(t('stuNotLinked').toLowerCase());
    else if(f==='streak') show=(()=>{const m=tr.children[6]?.textContent.match(/\d+/);return m&&+m[0]>=5;})();
    else if(f!=='all') show=txt2.includes(f.toLowerCase());
    tr.style.display=show?'':'none';
  });
}
function syncTop(mn){
  $$('.lgsw button',mn).forEach(b=> b.classList.toggle('on', b.dataset.lang===L));
  const tb=$('[data-theme-btn]',mn);
  if(tb) tb.innerHTML = svg(document.documentElement.dataset.theme==='dark'?'sun':'moon');
}

/* ══════════════════ BANQUE DE QUESTIONS ══════════════════ */
function qbank(){
  const qs=[]; D.exercises.forEach(e=> e.questions.forEach(q=> qs.push({e,q})));
  const byAx={}; qs.forEach(({e})=>{ byAx[e.ax]=(byAx[e.ax]||0)+1; });
  return `
  <div class="kpis cas">
    ${[[t('adQbank'),qs.length,'layers','ico--pu'],[t('qbAx'),Object.keys(byAx).length,'target','ico--cy'],
       [t('exTypes'),3,'quiz',''],[t('diff')+L_(' صعلة',' difficultés'),3,'bolt','ico--wn']]
      .map(([l,v,ic,c])=>`<div class="kpi rv"><div class="kpi__t"><span class="ico ico--sm ${c}">${svg(ic)}</span></div>
        <div class="kpi__n la">${v}</div><div class="kpi__l">${l}</div></div>`).join('')}
  </div>
  <div class="cd cd--f mt5 rv">
    <div class="cd__h" style="padding:18px 22px;margin:0;border-block-end:1px solid var(--line)">
      <div><div class="cd__t" data-i18n="adQbank">${t('adQbank')}</div>
        <div class="cd__s">${L_('كل الأسئلة المتوفرة، قابلة لإعادة الاستعمال في أي تمرين','Toutes les questions disponibles, réutilisables dans n’importe quel exercice')}</div></div>
      <div class="flex gap2 wrap-f">
        <div class="srch">${svg('search')}<input class="inp inp--sm" placeholder="${L_('ابحث في الأسئلة…','Rechercher une question…')}"></div>
        <select class="sel sel--sm" style="width:auto"><option>${t('qbAx')}</option>${Object.values(AXFR).map(v=>`<option>${v}</option>`).join('')}</select>
        <button class="btn btn--p btn--sm" data-atab-jump="quiz">${svg('plus','width="16" height="16"')}${t('qbAddMcq')}</button>
      </div>
    </div>
    <div class="tbw"><table class="tb" style="min-width:900px">
      <thead><tr><th style="width:60%">${t('qbQs')}</th><th>${t('qbAx')}</th><th>${t('qbLevel')}</th>
        <th>${t('qbDiff')}</th><th>${t('exTypes')}</th><th>XP</th><th></th></tr></thead>
      <tbody>${qs.slice(0,18).map(({e,q})=>`<tr>
        <td dir="ltr" style="text-align:start;font-size:.87rem">${q.t.length>72?q.t.slice(0,72)+'…':q.t}</td>
        <td><span class="bd bd--gy">${AXFR[e.ax]||e.ax}</span></td>
        <td><span class="bd bd--lv ${D.byId(D.levels,e.level).cls}">${e.level}</span></td>
        <td><span class="diff diff--${q.d||1}"><i class="on"></i><i class="${(q.d||1)>=2?'on':''}"></i><i class="${(q.d||1)>=3?'on':''}"></i></span></td>
        <td><span class="qtype qtype--${q.tf!==undefined?'tf':'mcq'}">${q.tf!==undefined?t('tyTf'):(q.o?t('tyMcq'):t('qbAddFill'))}</span></td>
        <td class="la acc"><b>+${Math.round(X.CFG.xpBase*(X.CFG.multDiff[q.d||1]||1))}</b></td>
        <td><div class="acts"><button class="iact" title="${t('edit')}">${svg('edit')}</button>
          <button class="iact" title="${L_('استعمال','Réutiliser')}">${svg('copy')}</button>
          <button class="iact iact--er" title="${t('del')}">${svg('trash')}</button></div></td>
      </tr>`).join('')}</tbody></table></div>
    <div class="flex just-b items-c" style="padding:14px 22px;border-block-start:1px solid var(--line)">
      <span class="muted" style="font-size:.84rem">${L_('عرض','Affichage')} <b class="la">1–18</b> ${t('stuOf')} <b class="la">${qs.length}</b></span>
      <div class="pgn"><button>‹</button><button class="on">1</button><button>2</button><button>›</button></div>
    </div>
  </div>`;
}

/* ══════════════════ ANNONCES ══════════════════ */
function announce(){
  return `
  <div class="flex just-b items-c wrap-f gap4 mb5">
    <div><h2 style="font-size:1.35rem" data-i18n="adAnn">${t('adAnn')}</h2>
      <p class="muted" style="font-size:.9rem">${L_('تصل التلاميذ فوراً في فضاءهم','Parviennent immédiatement aux élèves dans leur espace')}</p></div>
    <button class="btn btn--p" data-new-ann>${svg('plus','width="17" height="17"')}${L_('إعلان جديد','Nouvelle annonce')}</button>
  </div>
  <div class="g g-main adm-split" style="--adm-side:380px">
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      ${D.announcements.map(a=>{
        const c=a.i18n||{}; const imp=a.importance||'info';
        const col=imp==='urgent'?'var(--er)':imp==='important'?'var(--wn)':'var(--ac)';
        return `<div class="cd rv" style="border-inline-start:3px solid ${col}">
          <div class="cd__h"><div><div class="cd__t">${L_(c.ar,c.fr)||L_(a.titleAr,a.titleFr)||L_('إعلان','Annonce')}</div>
            <div class="cd__s">${svg('cal','width="12" height="12" style="display:inline;vertical-align:-2px"')} <span class="la">${a.date||''}</span>
              · ${svg('eye','width="12" height="12" style="display:inline;vertical-align:-2px"')} ${L_(a.audienceAr,a.audienceFr)||L_('كل التلاميذ','Tous les élèves')}</div></div>
            <div class="flex gap2">${a.pinned?`<span class="bd bd--wn">${svg('pin','width="12" height="12"')}${t('annPinned')}</span>`:''}
              <span class="bd" style="background:color-mix(in srgb,${col} 12%,transparent);color:${col};border-color:color-mix(in srgb,${col} 28%,transparent)">${L_(imp==='urgent'?'عاجل':imp==='important'?'مهم':'معلومة',imp==='urgent'?'Urgent':imp==='important'?'Important':'Info')}</span></div>
          </div>
          <p style="font-size:.92rem;line-height:1.85">${esc(L_(c.arBody||a.bodyAr,c.frBody||a.bodyFr)||'')}</p>
          <div class="cd__f">
            <button class="btn btn--g btn--sm" data-pin-ann="${esc(a.id)}" data-pin="${a.pinned?1:0}">${svg('pin','width="15" height="15"')}${a.pinned?L_('إلغاء التثبيت','Détacher'):L_('تثبيت','Épingler')}</button>
            <button class="iact iact--er" style="margin-inline-start:auto" data-del-ann="${esc(a.id)}">${svg('trash')}</button></div>
        </div>`;}).join('')}
    </div>
    <div class="cd rv" style="position:sticky;top:90px">
      <div class="cd__t mb4" data-i18n="adAnn">${t('adAnn')}</div>
      <div class="fld"><label data-i18n="anTitleArF">${t('anTitleArF')}</label><input class="inp" id="anAr" placeholder="${L_('مثال: حصّة تعويضية','Ex. : séance de rattrapage')}"></div>
      <div class="fld mt4"><label data-i18n="anTitleFrF">${t('anTitleFrF')}</label><input class="inp" id="anFr" dir="ltr" placeholder="Ex. : séance de rattrapage"></div>
      <div class="fld mt4"><label data-i18n="anBodyF">${t('anBodyF')}</label><textarea class="inp ta" id="anBody" rows="4" placeholder="…"></textarea></div>
      <div class="g g2 mt4" style="gap:12px">
        <div class="fld"><label data-i18n="anImpF">${t('anImpF')}</label>
          <select class="sel sel--sm" id="anImp"><option value="info">${L_('معلومة','Info')}</option><option value="important">${L_('مهم','Important')}</option><option value="urgent">${L_('عاجل','Urgent')}</option></select></div>
        <div class="fld"><label data-i18n="anAudF">${t('anAudF')}</label>
          <select class="sel sel--sm" id="anAud"><option value="">${t('anAll')}</option>${D.groups.map(g=>`<option>${esc(g.name)}</option>`).join('')}${D.levels.map(l=>`<option>${l.id}</option>`).join('')}</select></div>
      </div>
      <label class="flex items-c gap3 mt4" style="font-size:.88rem;cursor:pointer">
        <input type="checkbox" id="anPin" checked> ${L_('تثبيت في أعلى فضاء التلميذ','Épingler en haut de l’espace élève')}</label>
      <button class="btn btn--p btn--blk mt5" data-send-ann>${svg('up','width="17" height="17"')}${t('anPublishF')}</button>
      <p class="muted mt4" style="font-size:.78rem;line-height:1.7">${svg('info','width="13" height="13" style="display:inline;vertical-align:-2px"')}
        ${L_('يمكن إرسال إعلان بالبريد لاحقاً عند ربط Firebase.','Un envoi par e-mail pourra être ajouté après connexion à Firebase.')}</p>
    </div>
  </div>`;
}

/* ══════════════════ MESSAGES ══════════════════ */
let msgSel = 0;
function messages(){
  const raw=(window.PKdata.messages||[]).slice().reverse();
  if(!raw.length){
    return `<div class="empty"><div class="ico">${svg('chat')}</div><b>${t('noMessages')}</b>
      <p>${L_('كل رسالة تُرسل من صفحة «تواصل» أو من فضاء تلميذ تصل إلى هنا فوراً.','Tout message envoyé depuis la page « Contact » ou l’espace élève arrive ici immédiatement.')}</p></div>`;
  }
  const grad=['linear-gradient(140deg,#1E4FD8,#4E7CFF)','linear-gradient(140deg,#0FA97C,#0B8FA8)','linear-gradient(140deg,#E08A00,#F5B942)','linear-gradient(140deg,#B423A2,#E0487F)'];
  const msgs=raw.map((m,i)=>({raw:m, n:m.from||'—',
    s:[m.level,m.subject].filter(Boolean).join(' · ')||m.contact||'',
    c:grad[i%grad.length], d:m.when||'', ar:m.body||'', fr:m.body||'', unread:!m.read}));
  const m0=msgs[Math.min(msgSel,msgs.length-1)];
  const ini=w=>String(w).split(' ').map(x=>x[0]).join('').slice(0,2);
  return `
  <div class="g adm-split adm-split--rev" style="--adm-side:340px;gap:20px">
    <div class="cd cd--f rv" style="padding:0;overflow:hidden">
      <div style="padding:16px 18px;border-block-end:1px solid var(--line)">
        <div class="srch">${svg('search')}<input class="inp inp--sm" placeholder="${L_('ابحث في الرسائل…','Rechercher…')}"></div>
      </div>
      <div class="msgl">${msgs.map((m,i)=>`
        <button class="msg ${i===msgSel?'on':''} ${m.unread?'unread':''}" data-msg="${i}">
          <span class="av" style="background:${m.c}">${ini(m.n)}</span>
          <div class="msg__b"><div class="msg__n">${m.n}<time class="la">${m.d}</time></div>
            <div class="msg__s">${L_(m.s,m.s)}</div><div class="msg__p">${L_(m.ar,m.fr).slice(0,52)}…</div></div>
          ${m.unread?'<span class="msg__d"></span>':''}
        </button>`).join('')}</div>
    </div>
    <div class="cd rv" style="--d:80ms">
      <div class="cd__h"><div class="who"><span class="av" style="background:${m0.c}">${ini(m0.n)}</span>
        <div><b>${m0.n}</b><small class="muted">${m0.s}</small></div></div>
        <div class="flex gap2" style="margin-inline-start:auto">
          ${m0.raw.contact?`<span class="bd" dir="ltr">${m0.raw.contact}</span>`:''}
          <button class="iact" data-del-msg="${m0.raw.id}" title="${L_('حذف','Supprimer')}">${svg('trash')}</button></div>
      </div>
      <div class="msgt">
        <div class="bub bub--in"><p>${L_(m0.ar,m0.fr)}</p><time class="la">${m0.d}</time></div>
      </div>
      <div class="msgc">
        <textarea class="inp ta" rows="2" placeholder="${L_('اكتب ردّك…','Écrivez votre réponse…')}"></textarea>
        <button class="btn btn--p" data-send>${svg('send','width="17" height="17"')}${L_('إرسال','Envoyer')}</button>
      </div>
    </div>
  </div>
  <p class="muted mt4" style="font-size:.84rem;display:flex;align-items:center;gap:9px">
    ${svg('info','width="16" height="16" style="color:var(--ac)"')}
    ${L_('الرسائل تُحفظ في مجموعة <b>messages</b> في Firestore — تصل رسائل صفحة «تواصل» وفضاء التلاميذ إلى هنا.','Les messages sont stockés dans la collection <b>messages</b> de Firestore — ceux de la page « Contact » et de l’espace élève arrivent ici.')}</p>`;
}
function bindMessages(p){
  p.querySelectorAll('[data-msg]').forEach(b=> b.addEventListener('click',()=>{ msgSel=+b.dataset.msg; show(document); }));
  const sd=p.querySelector('[data-send]');
  if(sd) sd.addEventListener('click', async ()=>{
    const ta=p.querySelector('.msgc textarea'); const v=(ta&&ta.value||'').trim();
    if(!v){ window.PK.toast(L_('اكتب الردّ أولاً','Écrivez d’abord votre réponse'),'wn',2200); return; }
    const cur=(window.PKdata.messages||[]).slice().reverse()[msgSel]||{};
    await window.PKdb.add('messages',{from:'Prof. Kerdjidj', role:'reply', to:cur.contact||'', body:v});
    window.PK.toast(L_('أُرسل الرد ✓','Réponse envoyée ✓'),'ok',2400);
    show(document);
  });
  const dl=p.querySelector('[data-del-msg]');
  if(dl) dl.addEventListener('click', async ()=>{
    await window.PKdb.remove('messages', dl.dataset.delMsg);
    show(document);
  });
}

/* ══════════════════ PARAMÈTRES (enregistrement réel) ══════════════════
   Chaque champ porte [data-set="clé"] → le bouton « Enregistrer » collecte
   tout, valide, puis appelle PKdb.saveSettings() :
     · mode démo  → window.PKdata.settings + localStorage (persistant)
     · mode live  → Firestore settings/main (fusion)
   Le site entier lit window.PKdata.settings : contact, pied de page,
   à propos et titres se mettent à jour immédiatement.                     */
const SET_FIELDS = {
  site:['siteNameAr','siteNameFr','teacherNameAr','teacherNameFr','sloganAr','sloganFr'],
  contact:['phone','whatsapp','email','city','wilaya','country','address','addressFr','hours',
           'facebook','instagram','youtube','telegram','whatsappLink'],
  stats:['years','students','lessons','exercises']
};
function settings(){
  const S=D.settings;
  const f=(k,label,val,ph,dir,type)=>`<div class="fld"><label for="set_${k}">${label}</label>
    <input class="inp ${type==='number'?'la':''}" id="set_${k}" data-set="${k}" type="${type||'text'}"
      ${dir?'dir="ltr"':''} value="${String(val??'').replace(/"/g,'&quot;')}" placeholder="${ph||''}"></div>`;
  const tog=(k,label,desc,on)=>`<label class="flex items-c gap3" style="padding:13px 0;border-block-end:1px dashed var(--line);cursor:pointer">
      <span class="sw ${on?'on':''}" data-toggle="${k}" role="switch" aria-checked="${!!on}"><i></i></span>
      <span style="flex:1"><b style="font-size:.9rem">${label}</b><div class="muted la" style="font-size:.8rem">${desc}</div></span>
      <span class="bd bd--gy la">${k}</span></label>`;

  return `
  <div class="g g-main adm-split" style="--adm-side:340px">
    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">

      <div class="cd rv">
        <div class="cd__h"><div><div class="cd__t" data-i18n="setSite">${t('setSite')}</div>
          <div class="cd__s">${L_('تظهر في الترويسة والتذييل وعنوان المتصفح','Affichées dans l’en-tête, le pied de page et le titre du navigateur')}</div></div>
          <span class="bd bd--gy">${svg('globe','width="12" height="12"')}1/4</span></div>
        <div class="g g2" style="gap:16px">
          ${f('siteNameAr',L_('اسم المنصة بالعربية','Nom de la plateforme (AR)'),S.siteNameAr)}
          ${f('siteNameFr',L_('Nom de la plateforme (FR)','اسم المنصة بالفرنسية'),S.siteNameFr,'Plateforme Prof. Kerdjidj — Français',1)}
          ${f('teacherNameAr',L_('اسم الأستاذة بالعربية','Nom de la professeure (AR)'),S.teacherNameAr)}
          ${f('teacherNameFr',L_('Nom de la professeure (FR)',''),S.teacherNameFr,'Prof. Kerdjidj',1)}
          ${f('sloganAr',L_('الشعار بالعربية','Slogan (AR)'),S.sloganAr)}
          ${f('sloganFr',L_('Slogan (FR)',''),S.sloganFr,'',1)}
        </div>
      </div>

      <div class="cd rv" style="--d:60ms">
        <div class="cd__h"><div><div class="cd__t" data-i18n="setContact">${t('setContact')}</div>
          <div class="cd__s">${L_('هذه القيم تظهر في صفحة «تواصل» وفي تذييل كل صفحة','Ces valeurs apparaissent sur la page Contact et dans le pied de chaque page')}</div></div>
          <span class="bd bd--ac">${svg('phone','width="12" height="12"')}2/4</span></div>
        <div class="g g2" style="gap:16px">
          ${f('phone',L_('الهاتف *','Téléphone *'),S.phone,'+213 …',1)}
          ${f('whatsapp','WhatsApp',S.whatsapp,'+213 …',1)}
          ${f('whatsappLink',L_('رابط واتساب (wa.me)','Lien WhatsApp (wa.me)'),S.whatsappLink,'https://wa.me/213…',1)}
          ${f('email',L_('البريد الإلكتروني *','E-mail *'),S.email,'contact@…',1)}
          ${f('city',L_('المدينة','Ville'),S.city,'Khemis Miliana')}
          ${f('wilaya',L_('الولاية','Wilaya'),S.wilaya,'Aïn Defla')}
          ${f('country',L_('البلد','Pays'),S.country,'Algérie')}
          ${f('hours',L_('أوقات العمل','Horaires'),S.hours,L_('السبت – الخميس: 14:00 – 20:00','Sam – Jeu : 14h – 20h'))}
          ${f('address',L_('العنوان بالعربية','Adresse (AR)'),S.address)}
          ${f('addressFr',L_('Adresse (FR)',''),S.addressFr,'',1)}
        </div>
        <div class="cd__t mt5 mb4" style="font-size:.92rem">${L_('شبكات التواصل','Réseaux sociaux')}</div>
        <div class="g g2" style="gap:16px">
          ${f('facebook','Facebook',S.facebook,'https://facebook.com/…',1)}
          ${f('instagram','Instagram',S.instagram,'https://instagram.com/…',1)}
          ${f('youtube','YouTube',S.youtube,'https://youtube.com/@…',1)}
          ${f('telegram','Telegram',S.telegram,'https://t.me/…',1)}
        </div>
        <p class="muted mt4" style="font-size:.8rem;line-height:1.7">${svg('info','width="13" height="13" style="display:inline;vertical-align:-2px"')}
          ${L_('اترك الحقل فارغاً لإخفاء الزر أو المعلومة من الموقع نهائياً.','Laissez un champ vide pour masquer le bouton ou l’information sur le site.')}</p>
      </div>

      <div class="cd rv" style="--d:120ms">
        <div class="cd__h"><div><div class="cd__t" data-i18n="setStats">${t('setStats')}</div>
          <div class="cd__s">${L_('الأرقام الظاهرة في الصفحة الرئيسية وصفحة الأستاذة','Les chiffres affichés sur l’accueil et la page « La professeure »')}</div></div>
          <span class="bd bd--gy">${svg('trend','width="12" height="12"')}3/4</span></div>
        <div class="g g2" style="gap:16px">
          ${f('years',L_('سنوات الخبرة','Années d’expérience'),S.stats.years,'','',"number")}
          ${f('students',L_('عدد التلاميذ','Élèves entraînés'),S.stats.students,'','',"number")}
          ${f('lessons',L_('عدد الدروس','Cours et fiches'),S.stats.lessons,'','',"number")}
          ${f('exercises',L_('عدد التمارين','Exercices'),S.stats.exercises,'','',"number")}
        </div>
      </div>

      <div class="cd rv" style="--d:150ms">
        <div class="cd__h"><div><div class="cd__t" data-i18n="setXp">${t('setXp')}</div>
          <div class="cd__s">${L_('لا علاقة له بالنقاط المدرسية — تحفيز فقط. التعديل يسري على كل تمارين الموقع.',
            'Sans lien avec les notes scolaires — uniquement de la motivation. Le réglage s’applique à tous les exercices du site.')}</div></div>
          <span class="bd bd--wn">${svg('bolt','width="12" height="12"')}4/5</span></div>
        <div class="g g3" style="gap:14px">
          ${[['xpBase',t('setXpBase'),X.CFG.xpBase],['xpPerLesson',t('setXpLesson'),X.CFG.xpPerLesson],
             ['xpDaily',t('setXpDaily'),X.CFG.xpDaily],['bonusPerfect',t('setXpPerfect'),X.CFG.bonusPerfect],
             ['bonusSpeed',t('setXpSpeed'),X.CFG.bonusSpeed],['capDaily',t('setXpCap'),X.CFG.capDaily]]
            .map(([k,lb,v])=>`<div class="fld"><label for="set_${k}">${lb}</label>
              <input class="inp la" id="set_${k}" data-xp="${k}" type="number" min="0" step="${k==='xpBase'?1:5}" value="${v}"></div>`).join('')}
        </div>
        <div class="mt5">
          <div class="cd__t mb3" style="font-size:.92rem" data-i18n="setXpDiff">${t('setXpDiff')}</div>
          <div class="g g3" style="gap:14px">
            ${[1,2,3].map(d=>`<div class="fld"><label>${t('diff'+d)}</label>
              <input class="inp la" data-xpd="${d}" type="number" min="0.5" step="0.1" value="${X.CFG.multDiff[d]}"></div>`).join('')}
          </div>
        </div>
        <div class="mt5">
          <div class="cd__t mb3" style="font-size:.92rem">${L_('عتبات الرتب الست','Seuils des six rangs')}</div>
          <div class="g g3" style="gap:14px">
            ${X.RANKS.map((r,i)=>`<div class="fld"><label>${svg(r.icon,'width="13" height="13" style="display:inline;vertical-align:-2px"')} ${L_(r.ar,r.fr)}</label>
              <input class="inp la" data-xpr="${i}" type="number" min="0" step="100" value="${r.min}" ${i===0?'disabled':''}></div>`).join('')}
          </div>
        </div>
        <div class="cd cd--flat mt5" style="background:var(--ac-tint);border-color:var(--ac-tint2);padding:14px">
          <div class="flex items-c gap3" style="font-size:.86rem">
            ${svg('info','width="16" height="16" style="color:var(--ac)"')}
            <span>${L_('مثال: سؤال بصعوبة 3 = ','Exemple : une question de difficulté 3 = ')}
              <b class="la" id="xpDemo">${X.CFG.xpBase} × ${X.CFG.multDiff[3]}</b>
              = <b class="la acc" id="xpDemoR">${Math.round(X.CFG.xpBase*X.CFG.multDiff[3])} XP</b>
              ${L_(' ثم يُضرب في مضاعف السلسلة.',' puis multiplié par le multiplicateur de série.')}</span>
          </div>
        </div>
      </div>

      <div class="cd rv" style="--d:180ms">
        <div class="cd__h"><div><div class="cd__t" data-i18n="setGen">${t('setGen')}</div></div>
          <span class="bd bd--gy">${svg('set','width="12" height="12"')}5/5</span></div>
        ${tog('maintenance',t('setMaint'),L_('يعرض صفحة «صيانة» للزوار ويخفي المحتوى','Affiche une page « maintenance » aux visiteurs'),S.maintenance)}
        ${tog('showPricing',t('setPricing'),L_('معطّل دائماً — المنصة مجانية بلا أي دفع','Toujours désactivé — plateforme gratuite, sans paiement'),false)}
        ${tog('allowMessages',L_('السماح للزوار بمراسلتك','Autoriser les visiteurs à vous écrire'),L_('نموذج صفحة «تواصل» + رسائل التلاميذ','Formulaire de contact + messagerie élèves'),true)}
        <div class="g g2 mt5" style="gap:16px">
          <div class="fld"><label>${L_('اللون الأساسي','Couleur principale')}</label>
            <div class="flex gap2 items-c"><input type="color" data-set="accent" value="${S.accent||'#1E4FD8'}"
              style="width:52px;height:40px;border:1px solid var(--line);border-radius:10px;background:var(--surface);cursor:pointer">
              <input class="inp la" data-set="accentHex" value="${S.accent||'#1E4FD8'}" dir="ltr" style="flex:1"></div></div>
          <div class="fld"><label>${L_('اللغة الافتراضية للزوار','Langue par défaut des visiteurs')}</label>
            <div class="seg" data-pref="defLang"><button data-v="ar" class="${(S.defLang||'ar')==='ar'?'on':''}">العربية</button>
              <button data-v="fr" class="${S.defLang==='fr'?'on':''}">Français</button></div></div>
        </div>
      </div>

      <div class="flex gap3 wrap-f items-c" style="position:sticky;bottom:0;background:var(--bg);padding:14px 0;border-block-start:1px solid var(--line);z-index:5">
        <button class="btn btn--p btn--lg" data-save-set>${svg('save','width="18" height="18"')}${t('save')}</button>
        <button class="btn btn--g" data-reload-set>${svg('refresh','width="17" height="17"')}${L_('تراجع عن التغييرات','Annuler les modifications')}</button>
        <button class="btn btn--er" data-reset-set style="margin-inline-start:auto">${svg('trash','width="17" height="17"')}${L_('إعادة القيم الأصلية','Valeurs d’usine')}</button>
        <span class="muted" id="setHint" style="font-size:.82rem"></span>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <div class="cd rv" style="position:sticky;top:90px">
        <div class="cd__t mb4">${L_('معاينة صفحة «تواصل»','Aperçu de la page Contact')}</div>
        <div class="cinfo"><span class="cred__i">${svg('phone')}</span><div><b>${L_('الهاتف','Téléphone')}</b><p dir="ltr" data-pv="phone">${S.phone}</p></div></div>
        <div class="cinfo"><span class="cred__i">${svg('wa')}</span><div><b>WhatsApp</b><p dir="ltr" data-pv="whatsapp">${S.whatsapp}</p></div></div>
        <div class="cinfo"><span class="cred__i">${svg('mail')}</span><div><b>${L_('البريد','E-mail')}</b><p dir="ltr" data-pv="email">${S.email}</p></div></div>
        <div class="cinfo"><span class="cred__i">${svg('pin')}</span><div><b>${L_('العنوان','Adresse')}</b><p data-pv="address">${S.address}</p></div></div>
        <div class="cinfo"><span class="cred__i">${svg('clock')}</span><div><b>${L_('الأوقات','Horaires')}</b><p data-pv="hours">${S.hours}</p></div></div>
        <div class="flex gap2 mt4 wrap-f">${['fb','ig','yt','tg'].map(k=>`<span class="btn btn--g btn--i">${svg(k)}</span>`).join('')}</div>
      </div>
      <div class="cd rv" style="--d:80ms">
        <div class="cd__t mb4">${L_('حالة الحفظ','État de l’enregistrement')}</div>
        <div class="flex items-c gap3 mb4">
          <span class="dot-st ${window.PKdb.MOCK?'dot-st--wn':'dot-st--on'}"></span>
          <b style="font-size:.9rem">${window.PKdb.MOCK?L_('وضع تجريبي — يُحفظ في هذا المتصفح','Mode démo — enregistré dans ce navigateur'):L_('متصل — يُحفظ في Firestore','Connecté — enregistré dans Firestore')}</b></div>
        <p class="muted" style="font-size:.83rem;line-height:1.8">${window.PKdb.MOCK
          ? L_('التعديلات تُحفظ محلياً وتظهر في كل صفحات الموقع فوراً. بعد ربط Firebase ستُحفظ في <code>settings/main</code> وتظهر لكل الزوار.',
               'Les modifications sont enregistrées localement et apparaissent immédiatement sur tout le site. Après connexion à Firebase, elles seront stockées dans <code>settings/main</code> et visibles par tous les visiteurs.')
          : L_('كل تعديل يُكتب في المستند <code>settings/main</code> في Firestore، ويظهر فوراً في الموقع العام وفضاء التلميذ.',
               'Chaque modification est écrite dans le document <code>settings/main</code> de Firestore et apparaît aussitôt sur le site public et l’espace élève.')}</p>
        <div class="g gap3 mt5">
          ${[[L_('آخر حفظ','Dernier enregistrement'),'<span id="setLast">—</span>'],
             [L_('الحقول','Champs'),String(document.querySelectorAll?'':'')||'26'],
             [L_('المستند','Document'),'<code dir="ltr">settings/main</code>']]
            .map(([l,v])=>`<div class="flex just-b items-c" style="padding:10px 0;border-block-end:1px dashed var(--line);font-size:.85rem">
              <span class="muted">${l}</span><b class="la">${v}</b></div>`).join('')}
        </div>
        <a class="btn btn--g btn--blk mt5" href="../contact.html" target="_blank">${svg('eye','width="17" height="17"')}${L_('افتح صفحة تواصل للتحقق','Ouvrir la page Contact pour vérifier')}</a>
      </div>
    </div>
  </div>`;
}

/* ── ربط وحدة الإعدادات : معاينة حية + حفظ فعلي ── */
function bindSettings(panel){
  const hint = $('#setHint', panel);
  const last = $('#setLast', panel);
  try{ const saved = localStorage.getItem('pk-settings-savedAt');
       if(last && saved) last.textContent = new Date(+saved).toLocaleString(ar()?'ar-DZ':'fr-FR'); }catch(e){}

  const collect = ()=>{
    const patch = {};
    $$('[data-set]', panel).forEach(inp=>{
      const k = inp.dataset.set;
      if(k === 'accentHex') return;                 // doublon du sélecteur de couleur
      patch[k] = inp.type === 'number' ? (inp.value===''?0:+inp.value) : inp.value;
    });
    // stats → objet imbriqué
    const stats = {};
    SET_FIELDS.stats.forEach(k=>{ if(patch[k]!==undefined){ stats[k]=patch[k]; delete patch[k]; } });
    if(Object.keys(stats).length) patch.stats = stats;
    // système XP → objet imbriqué {xp:{…}}
    const xp = {};
    $$('[data-xp]', panel).forEach(inp=>{ xp[inp.dataset.xp] = Math.max(0, +inp.value||0); });
    const md = {};
    $$('[data-xpd]', panel).forEach(inp=>{ md[inp.dataset.xpd] = Math.max(0.1, +inp.value||1); });
    if(Object.keys(md).length) xp.multDiff = md;
    const rk = [];
    $$('[data-xpr]', panel).forEach(inp=>{ rk[+inp.dataset.xpr] = Math.max(0, +inp.value||0); });
    if(rk.length) xp.rankMin = rk;
    if(Object.keys(xp).length) patch.xp = xp;
    // commutateurs
    $$('[data-toggle]', panel).forEach(sw=>{ patch[sw.dataset.toggle] = sw.classList.contains('on'); });
    // langue par défaut
    const dl = $('[data-pref="defLang"] button.on', panel);
    if(dl) patch.defLang = dl.dataset.v;
    return patch;
  };

  // aperçu en direct du panneau Contact
  const live = ()=>{
    const p = collect();
    ['phone','whatsapp','email','address','hours'].forEach(k=>{
      const el = $(`[data-pv="${k}"]`, panel); if(el) el.textContent = p[k] || '—';
    });
    if(p.xp){
      const base = p.xp.xpBase, d3 = p.xp.multDiff ? p.xp.multDiff[3] : 1;
      const de = $('#xpDemo', panel), dr = $('#xpDemoR', panel);
      if(de) de.textContent = base + ' × ' + d3;
      if(dr) dr.textContent = Math.round(base*d3) + ' XP';
    }
    if(hint) hint.textContent = L_('تغييرات غير محفوظة…','Modifications non enregistrées…');
  };
  $$('[data-set],[data-xp],[data-xpd],[data-xpr]', panel).forEach(inp=>{
    inp.addEventListener('input', live);
    inp.addEventListener('change', live);
  });
  // couleur : les deux champs restent synchronisés
  const col = $('[data-set="accent"]', panel), hex = $('[data-set="accentHex"]', panel);
  if(col && hex){
    col.addEventListener('input', ()=>{ hex.value = col.value; live(); });
    hex.addEventListener('input', ()=>{ if(/^#[0-9a-f]{6}$/i.test(hex.value)) col.value = hex.value; live(); });
  }
  // commutateurs
  $$('[data-toggle]', panel).forEach(sw=> sw.addEventListener('click', e=>{
    e.preventDefault();
    if(sw.dataset.toggle === 'showPricing'){
      toast(L_('لا يمكن تفعيل الأسعار — المنصة مجانية بالكامل وبدون أي دفع.','Impossible d’activer les tarifs — la plateforme est entièrement gratuite et sans paiement.'),'er',3600);
      return;
    }
    sw.classList.toggle('on');
    sw.setAttribute('aria-checked', sw.classList.contains('on'));
    live();
  }));
  // langue par défaut
  $$('[data-pref="defLang"] button', panel).forEach(b=> b.addEventListener('click', ()=>{
    $$('[data-pref="defLang"] button', panel).forEach(x=>x.classList.toggle('on', x===b)); live();
  }));

  // ── ENREGISTRER ──
  const save = $('[data-save-set]', panel);
  if(save) save.addEventListener('click', ()=>{
    const p = collect();
    // validation minimale des champs marqués
    if(p.phone && !/^[+0-9 ().-]{6,}$/.test(p.phone)){
      toast(L_('رقم الهاتف غير صالح','Numéro de téléphone invalide'),'er',3000); return;
    }
    if(p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)){
      toast(L_('البريد الإلكتروني غير صالح','Adresse e-mail invalide'),'er',3000); return;
    }
    save.disabled = true;
    window.PKdb.saveSettings(p).then(res=>{
      save.disabled = false;
      try{ localStorage.setItem('pk-settings-savedAt', String(Date.now())); }catch(e){}
      const n = Object.keys(p).length;
      if(hint) hint.textContent = '';
      if(last) last.textContent = new Date().toLocaleString(ar()?'ar-DZ':'fr-FR');
      toast(res && res.mock
        ? L_(`حُفظ ${n} حقلاً في هذا المتصفح ✓ (وضع تجريبي)`, `${n} champs enregistrés dans ce navigateur ✓ (mode démo)`)
        : L_(`حُفظ ${n} حقلاً في Firestore ✓`,`${n} champs enregistrés dans Firestore ✓`), 'ok', 3600);
      // met à jour le titre/les libellés dépendants partout sur la page
      document.dispatchEvent(new CustomEvent('pk:settings-saved', {detail:D.settings}));
    }).catch(err=>{
      save.disabled = false;
      console.error(err);
      toast(L_('تعذّر الحفظ — تحقّق من الاتصال أو من صلاحيات admin.','Enregistrement impossible — vérifiez la connexion ou les droits admin.'),'er',4200);
    });
  });

  // ── ANNULER ──
  const rl = $('[data-reload-set]', panel);
  if(rl) rl.addEventListener('click', ()=>{
    const p = panel.closest('.atab') || panel;
    p.innerHTML = settings(); bindSettings(p);
    window.PKi18n.translateDom(window.PKi18n.current());
    toast(L_('تم التراجع عن التغييرات','Modifications annulées'),'info',2200);
  });

  // ── VALEURS D'USINE ──
  const rs = $('[data-reset-set]', panel);
  if(rs) rs.addEventListener('click', ()=>{
    if(!window.confirm(L_('إعادة كل الإعدادات إلى القيم الأصلية؟ لا يمكن التراجع.',
                           'Réinitialiser tous les paramètres aux valeurs d’usine ? Action irréversible.'))) return;
    Promise.resolve(window.PKdb.resetSettings()).catch(()=>{});
    toast(L_('جارٍ إعادة القيم الأصلية…','Restauration des valeurs d’usine…'),'wn',2600);
  });
}

/* ══════════════════════════════════════════════════════════════
   ACTIONS RÉELLES DU PANNEAU  (ajout 2026-10)
   Avant : « إضافة تلميذ », « فوج جديد », « ربط », « نشر الإعلان »,
   « حفظ الدرس » n'étaient que des toasts de démonstration — la
   professeure ne pouvait rien créer. Tout est maintenant branché sur
   Firestore, avec validation et messages clairs.
   ══════════════════════════════════════════════════════════════ */

/* ── normalisation : une fiche incomplète ne casse jamais l'affichage ── */
function stn(s){
  return Object.assign({xp:0, streak:0, exDone:0, quizDone:0, correct:0, answered:0,
    mastery:{}, badges:[], status:'active', level:'1AM', linked:false,
    color:'#1E4FD8', ar:'', fr:'', group:null, parent:''}, s||{});
}
function lvCls(id){ const l = D.byId(D.levels, id); return l ? l.cls : 'lv-1am'; }
/* البريد المرتبط ببطاقة التلميذ (كانت الدالة مستعملة وغير معرَّفة → خطأ عند التعديل) */
function stMail(s){ return String((s && (s.googleEmail || s.email)) || '').trim(); }

/* ── re-rendu du module courant (après une écriture réussie) ── */
function refresh(){
  const mn = document.querySelector('.mn') || document;
  show(mn);
  try{ syncTop(document); }catch(e){}
}

/* ── champ de formulaire réutilisable (modales) ── */
function fld2(id,label,val,opt){
  opt = opt || {};
  const tag = opt.area ? 'textarea' : 'input';
  const inner = opt.area
    ? `<textarea class="inp ta" id="${id}" rows="${opt.rows||3}" ${opt.dir?'dir="ltr"':''} placeholder="${opt.ph||''}">${esc(val||'')}</textarea>`
    : `<input class="inp" id="${id}" type="${opt.type||'text'}" ${opt.dir?'dir="ltr"':''} value="${esc(val||'')}" placeholder="${opt.ph||''}">`;
  return `<div class="fld ${opt.mt?'mt4':''}"><label for="${id}">${label}</label>${inner}</div>`;
}
function sel2(id,label,opts,val){
  return `<div class="fld"><label for="${id}">${label}</label><select class="sel" id="${id}">${
    opts.map(o=>`<option value="${esc(o.v)}"${String(o.v)===String(val)?' selected':''}>${esc(o.l)}</option>`).join('')
  }</select></div>`;
}
const valOf = id => { const e = document.getElementById(id); return e ? String(e.value||'').trim() : ''; };
const intOf = (id,d) => { const v = parseInt(valOf(id),10); return isFinite(v) ? v : d; };
const cardErr = (e) => window.PK.toast((e && (e.friendly || e.msg)) || t('saveErr'), 'er', 4600);

/* ══════════════════ طلبات التسجيل (استمارة التلميذ بلا حساب) ══════════════════ */
function regWhen(r){
  if(!r || !r.at) return '—';
  const sec = typeof r.at === 'number' ? r.at : r.at.seconds;
  const d = sec ? new Date(sec*1000) : new Date(r.at);
  if(isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR') + ' · ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
function regNew(){ return (D.registrations||[]).filter(r=>r.status!=='ok').length; }
function regCard(){
  const n = regNew();
  if(!n) return '';
  return `<div class="cd rv mb5" style="border-inline-start:3px solid var(--ac)">
    <div class="cd__h"><div>
      <div class="cd__t">${t('adReg')} <span class="bd bd--ac la">${n}</span></div>
      <div class="cd__s">${t('adRegS')}</div></div>
      <a class="btn btn--p btn--sm" href="#reg" data-goto-reg>${svg('mail','width="15" height="15"')}${t('adRegOpen')}</a>
    </div></div>`;
}
function registrations(){
  const list = (D.registrations||[]).slice();
  const rows = list.map(r=>{
    const done = r.status === 'ok';
    return `<tr>
      <td><div class="who"><span class="av" style="background:${done?'#1d7874':'#1E4FD8'}">${esc(ini(String(r.name||'??')))}</span>
        <div><b>${esc(r.name||'—')}</b>${r.school?`<small>${esc(r.school)}</small>`:''}</div></div></td>
      <td><span class="bd bd--lv ${lvCls(r.level)}">${esc(r.level||'—')}</span></td>
      <td class="la" dir="ltr">${esc(r.parentPhone||'—')}</td>
      <td class="la" dir="ltr" style="font-size:.83rem">${r.email?esc(r.email):'—'}</td>
      <td class="la" dir="ltr">${r.birth?esc(r.birth):'—'}</td>
      <td style="max-width:240px;font-size:.83rem">${r.note?esc(r.note):'—'}</td>
      <td class="la" style="font-size:.8rem">${esc(regWhen(r))}</td>
      <td><span class="bd ${done?'bd--ok':'bd--wn'}">${done?t('adRegDone'):t('adRegNew')}</span></td>
      <td><div class="acts">
        <button class="iact" data-reg-accept="${esc(r.id)}" title="${t('adRegAccept')}">${svg('plus')}</button>
        <button class="iact iact--er" data-reg-del="${esc(r.id)}" title="${t('del')}">${svg('trash')}</button>
      </div></td></tr>`;
  }).join('');
  return `
  <div class="cd rv mb5" style="border-inline-start:3px solid var(--ac)">
    <div class="cd__h"><div>
      <div class="cd__t">${t('adReg')}</div>
      <div class="cd__s">${t('adRegS')}</div></div>
      <div class="flex gap2 wrap-f">
        <button class="btn btn--g btn--sm" data-reg-refresh>${svg('refresh','width="15" height="15"')}${L_('تحديث','Actualiser')}</button>
      </div>
    </div>
  </div>
  ${list.length ? `<div class="cd cd--f rv">
    <div class="tbw"><table class="tb" style="min-width:1120px">
      <thead><tr>
        <th>${L_('الاسم واللقب','Nom et prénom')}</th><th>${t('stuLevel')}</th>
        <th>${L_('هاتف الولي','Téléphone')}</th><th>${L_('البريد','E-mail')}</th>
        <th>${L_('تاريخ الميلاد','Naissance')}</th><th>${L_('ملاحظة','Remarque')}</th>
        <th>${L_('وصل في','Reçu le')}</th><th>${t('stuStatus')}</th><th></th>
      </tr></thead><tbody>${rows}</tbody></table></div>
  </div>` : `<div class="empty"><div class="ico">${svg('mail')}</div><b>${t('adRegEmpty')}</b>
      <div class="muted mt3" style="font-size:.86rem">${t('adRegEmptyS')}</div></div>`}`;
}
function bindRegs(host){
  const rf = $('[data-reg-refresh]',host);
  if(rf) rf.addEventListener('click', async ()=>{
    rf.disabled = true;
    try{
      D.registrations = await window.PKdb.listRegistrations();
      toast(L_('تم التحديث','Actualisé'),'ok',2200);
    }catch(e){ cardErr(e); }
    finally{ rf.disabled = false; refresh(); }
  });
  $$('[data-reg-accept]',host).forEach(b=> b.addEventListener('click', ()=>{
    const r = (D.registrations||[]).find(x=>x.id===b.dataset.regAccept);
    if(!r) return;
    /* البطاقة تُنشأ من النموذج (يمكن للأستاذة تعديل القسم/الفوج) */
    openStudentForm({
      prefill:{ ar:r.name||'', fr:r.name||'', level:r.level||'1AM', parent:r.parentPhone||'',
                school:r.school||'', googleEmail:r.email||'' },
      after: async (id)=>{
        try{
          await window.PKdb.setRegistration(r.id, {status:'ok', studentId:id||null});
          D.registrations = await window.PKdb.listRegistrations();
        }catch(e){ cardErr(e); }
      }
    });
  }));
  $$('[data-reg-del]',host).forEach(b=> b.addEventListener('click', async ()=>{
    if(!window.confirm(L_('حذف هذا الطلب نهائياً؟','Supprimer définitivement cette demande ?'))) return;
    try{
      await window.PKdb.delRegistration(b.dataset.regDel);
      D.registrations = (D.registrations||[]).filter(r=>r.id!==b.dataset.regDel);
      toast(L_('حُذف الطلب','Demande supprimée'),'ok',2400);
      refresh();
    }catch(e){ cardErr(e); }
  }));
}

/* ── carte « demandes en attente » (comptes Google sans fiche reliée) ── */
function pendingCard(){
  const list = window.PKdata.pending || [];
  if(!list.length) return '';
  return `<div class="cd rv mb5" style="border-inline-start:3px solid var(--wn)">
    <div class="cd__h"><div>
      <div class="cd__t">${t('admPending')} <span class="bd bd--wn la">${list.length}</span></div>
      <div class="cd__s">${t('admPendingS')}</div></div>
      <button class="btn btn--g btn--sm" data-backfill>${svg('refresh','width="15" height="15"')}${t('admBackfill')}</button>
    </div>
    ${list.map(u=>`<div class="mini-row">
      <span class="av" style="background:linear-gradient(140deg,#8a93a6,#5b6472)">${esc(ini(u.name||u.email||'??'))}</span>
      <div style="min-width:0"><b>${esc(u.name||'—')}</b>
        <div class="muted la" dir="ltr" style="font-size:.8rem">${esc(u.email||'')}</div></div>
      <div class="flex gap2 wrap-f" style="margin-inline-start:auto">
        <button class="btn btn--p btn--sm" data-approve-user="${esc(u.id)}" data-mail="${esc(u.email||'')}" data-name="${esc(u.name||'')}">${svg('link','width="15" height="15"')}${t('admLink')}</button>
        <button class="btn btn--g btn--sm" data-new-for="${esc(u.id)}" data-mail="${esc(u.email||'')}" data-name="${esc(u.name||'')}">${svg('plus','width="15" height="15"')}${t('admCreate')}</button>
      </div></div>`).join('')}
  </div>`;
}

/* ── formulaire élève (création / modification) ── */
function openStudentForm(opts){
  opts = opts || {};
  const s  = opts.student ? stn(opts.student) : null;
  const pf = opts.prefill || {};            /* قيم أولية (مثلاً: طلب تسجيل) */
  const v  = (k, dflt) => s ? (s[k] == null ? dflt : s[k]) : (pf[k] == null ? dflt : pf[k]);
  const body = `
    <div class="g g2" style="gap:14px">
      ${fld2('stAr', t('stuNameAr2'), v('ar',''), {ph:L_('مثال: الاسم واللقب','Ex. : Nom et prénom')})}
      ${fld2('stFr', t('stuNameFr2'), v('fr',''), {dir:1, ph:'Ex. : Nom et prénom'})}
      ${sel2('stLv', t('stuLv')||t('lsEdLv'), D.levels.map(l=>({v:l.id,l:L_(l.ar,l.fr)})), v('level','1AM'))}
      ${sel2('stGrp', t('stuGroup'), [{v:'',l:'—'}].concat(D.groups.map(g=>({v:g.id,l:g.name}))), v('group',''))}
      ${fld2('stMail', t('stuEmailG'), s?stMail(s):(pf.googleEmail||opts.email||''), {dir:1, ph:'eleve@gmail.com'})}
      ${fld2('stPar', t('stuParent2'), v('parent',''), {dir:1, ph:'0555…'})}
    </div>
    ${fld2('stSchool', t('stuSchool2'), s?(s.school||''):(pf.school||''), {mt:1, ph:L_('اسم المؤسسة','Nom de l’établissement')})}
    <p class="muted mt4" style="font-size:.82rem;line-height:1.7">${t('stuNewS')}</p>`;
  const mo = modal(s ? t('edit') : t('stuNewT'), body,
    `<button class="btn btn--g" data-close>${t('cancel')||'إلغاء'}</button>
     <button class="btn btn--p" data-save>${svg('save','width="16" height="16"')}${t('save')}</button>`);
  mo.el.querySelector('[data-save]').addEventListener('click', async ()=>{
    const ar = valOf('stAr'), fr = valOf('stFr');
    if(!ar && !fr){ window.PK.toast(t('needFields'),'er',3000); return; }
    const mail = valOf('stMail').toLowerCase();
    if(mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)){ window.PK.toast(L_('البريد غير صالح','E-mail invalide'),'er',3000); return; }
    const doc = {
      ar:ar||fr, fr:fr||ar, level:valOf('stLv')||'1AM', group:valOf('stGrp')||null,
      parent:valOf('stPar'), school:valOf('stSchool'), googleEmail:mail||null,
      xp: s?s.xp:0, streak: s?s.streak:0, mastery: s?s.mastery:{}, badges: s?s.badges:[],
      status: s?s.status:'active', linked: !!(mail || (s&&s.linked)),
      color: s?s.color:'#1E4FD8'
    };
    try{
      let id = s ? s.id : null;
      if(s){ await window.PKdb.set('students', s.id, doc); }
      else { const r = await window.PKdb.add('students', doc); id = r && r.id; }
      if(mail && id){
        const lk = await window.PKdb.linkStudent(mail, id);
        if(!lk.ok) window.PK.toast(lk.msg||t('linkErr'),'wn',4200);
      }
      window.PK.toast(t('studentSaved'),'ok',2600);
      mo.close();
      if(opts.after){ try{ await opts.after(id, doc); }catch(e){ if(window.console) console.warn('[PK] after():', e); } }
      refresh();
    }catch(e){ cardErr(e); }
  });
}

/* ── formulaire groupe / séance ── */
function openGroupForm(g){
  const DAYS_L = Object.keys(DAYS).map(k=>({v:k, l:DAYS[k][ar()?0:1]}));
  const body = `
    <div class="g g2" style="gap:14px">
      ${fld2('gName', t('grpNameF'), g?g.name:'', {ph:'G1 · 4AM'})}
      ${sel2('gLv', t('lsEdLv'), D.levels.map(l=>({v:l.id,l:l.id+' — '+L_(l.ar,l.fr)})), g?g.level:'4AM')}
      ${sel2('gDay', t('grpDay'), DAYS_L, g?g.day:'sat')}
      ${fld2('gRoom', t('grpRoom'), g?g.room:'', {ph:'Salle 1'})}
      ${fld2('gStart', t('grpStart'), g?g.start:'14:00', {dir:1, type:'time'})}
      ${fld2('gEnd', t('grpEnd'), g?g.end:'15:30', {dir:1, type:'time'})}
      ${fld2('gCap', t('grpCap2'), g?g.capacity:18, {dir:1, type:'number'})}
      ${fld2('gTeach', t('grpTeacher'), g?g.teacher:(D.settings.teacherNameFr||'Prof. Kerdjidj'), {dir:1})}
      ${fld2('gSchool', t('grpSchool2'), g?L_(g.schoolAr,g.schoolFr):(D.settings.city||''), {mt:0})}
    </div>`;
  const mo = modal(g ? t('edit') : t('grNew'), body,
    `<button class="btn btn--g" data-close>${t('cancel')||'إلغاء'}</button>
     <button class="btn btn--p" data-save>${svg('save','width="16" height="16"')}${t('save')}</button>`);
  mo.el.querySelector('[data-save]').addEventListener('click', async ()=>{
    const name = valOf('gName'), lv = valOf('gLv') || '1AM';
    if(!name){ window.PK.toast(t('needFields'),'er',3000); return; }
    const school = valOf('gSchool');
    const doc = {
      name, level:lv, day:valOf('gDay')||'sat',
      start:valOf('gStart')||'14:00', end:valOf('gEnd')||'15:30',
      room:valOf('gRoom'), teacher:valOf('gTeach'),
      schoolAr:school, schoolFr:school,
      capacity:intOf('gCap',18), enrolled: g?(g.enrolled||0):0,
      cls:lvCls(lv)
    };
    try{
      if(g) await window.PKdb.set('groups', g.id, doc);
      else  await window.PKdb.add('groups', doc);
      window.PK.toast(t('grpSaved'),'ok',2600);
      mo.close(); refresh();
    }catch(e){ cardErr(e); }
  });
}

/* ── liaison e-mail ↔ fiche (et confirmation d'un compte en attente) ── */
function openLinkDialog(opts){
  opts = opts || {};
  const body = `
    ${fld2('lkMail', t('stuLinkE'), opts.email||'', {dir:1, ph:'eleve@gmail.com'})}
    ${sel2('lkStu', L_('البطاقة','Fiche'),
        [{v:'',l:'— '+t('empty')+' —'}].concat(D.students.map(stn).map(s=>({v:s.id,l:(L_(s.ar,s.fr)||s.id)+' — '+s.level+(stMail(s)?' ('+stMail(s)+')':'')}))),
        opts.studentId||'')}
    <p class="muted mt4" style="font-size:.82rem;line-height:1.7">${t('stuLinkS')}</p>`;
  const mo = modal(t('stuLink'), body,
    `<button class="btn btn--g" data-close>${t('cancel')||'إلغاء'}</button>
     <button class="btn btn--p" data-save>${svg('link','width="16" height="16"')}${t('stuLinkGo')}</button>`);
  mo.el.querySelector('[data-save]').addEventListener('click', async ()=>{
    const mail = valOf('lkMail').toLowerCase(), sid = valOf('lkStu');
    if(!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)){ window.PK.toast(L_('البريد غير صالح','E-mail invalide'),'er',3000); return; }
    if(!sid){ window.PK.toast(t('fillNameFirst'),'er',3000); return; }
    try{
      const r = await window.PKdb.linkStudent(mail, sid);
      if(!r.ok){ window.PK.toast(r.msg||t('linkErr'),'er',4600); return; }
      /* confirmer aussi le compte en attente, s'il existe */
      if(opts.uid){
        const a = await window.PKdb.approveUser(opts.uid, sid);
        if(!a.ok){ window.PK.toast(a.msg||t('linkErr'),'wn',4600); }
        else window.PK.toast(t('admApproved'),'ok',2600);
        window.PKdata.pending = (window.PKdata.pending||[]).filter(u=>u.id!==opts.uid);
      }
      const s = D.students.find(x=>x.id===sid); if(s){ s.googleEmail = mail; s.linked = true; }
      window.PK.toast(t('linkOk'),'ok',2600);
      mo.close(); refresh();
    }catch(e){ cardErr(e); }
  });
}

/* ── éditeur de cours : barre d'outils + enregistrement réel ── */
function bindLessonEditor(p){
  const body = p.querySelector('#lsBody');
  $$('.ed__b', p).forEach(b=> b.addEventListener('click', ()=>{
    if(!body) return;
    body.focus();
    const k = b.dataset.ed;
    try{
      if(k==='h') document.execCommand('formatBlock', false, 'H3');
      else if(k==='quote') document.execCommand('formatBlock', false, 'BLOCKQUOTE');
      else if(k==='code') document.execCommand('formatBlock', false, 'PRE');
      else if(k==='link'){ const u = prompt('https://…'); if(u) document.execCommand('createLink', false, u); }
      else if(k==='img'){ const u = prompt('https://… (image)'); if(u) document.execCommand('insertImage', false, u); }
      else document.execCommand(k);
    }catch(e){ /* navigateur sans execCommand : le HTML reste éditable à la main */ }
  }));
  const collect = (pub)=>({
    ar: valOf('lsAr'), fr: valOf('lsFr') || valOf('lsAr'),
    titleAr: valOf('lsAr'), titleFr: valOf('lsFr') || valOf('lsAr'),
    level: valOf('lsLv') || '1AM', ax: valOf('lsAx') || 'grammaire',
    sumAr: valOf('lsSumAr'), sumFr: valOf('lsSumFr'),
    min: intOf('lsMin',20), xp: intOf('lsXp',25),
    content: body ? body.innerHTML : '',
    published: !!pub, isNew: !!pub, files: 0
  });
  const save = async (pub)=>{
    const id = valOf('lsId');
    const doc = collect(pub);
    if(!doc.ar){ window.PK.toast(t('lsNeedTitle'),'er',3200); return; }
    try{
      if(id) await window.PKdb.set('lessons', id, doc);
      else   await window.PKdb.add('lessons', doc);
      window.PK.toast(pub ? t('lsPublished') : t('lsSaved'),'ok',3000);
      refresh();
    }catch(e){ cardErr(e); }
  };
  const sv=$('[data-ls-save]',p); if(sv) sv.addEventListener('click', ()=>save(false));
  const pb=$('[data-ls-pub]',p);  if(pb) pb.addEventListener('click', ()=>save(true));
  /* « درس جديد » : vide l'éditeur et remonte jusqu'à lui */
  $$('a[href^="index.html#lessons"], [data-add-lesson]',p).forEach(()=>{});
}
function openLessonEditor(id){
  const l = D.lessons.find(x=>x.id===id);
  if(!l) return;
  const setV=(k,v)=>{ const e=document.getElementById(k); if(e) e.value = v==null?'':v; };
  setV('lsId', l.id); setV('lsAr', l.ar||l.titleAr||''); setV('lsFr', l.fr||l.titleFr||'');
  setV('lsLv', l.level||'1AM'); setV('lsAx', l.ax||'grammaire');
  setV('lsSumAr', l.sumAr||''); setV('lsSumFr', l.sumFr||'');
  setV('lsMin', l.min||20); setV('lsXp', l.xp||25);
  const b = document.getElementById('lsBody'); if(b) b.innerHTML = l.content||'';
  const host = document.getElementById('lsBody');
  if(host) host.scrollIntoView({behavior:'smooth', block:'center'});
  window.PK.toast(t('lsEditLoad'),'info',2600);
}
function newLesson(){
  ['lsId','lsAr','lsFr','lsSumAr','lsSumFr'].forEach(k=>{ const e=document.getElementById(k); if(e) e.value=''; });
  const b = document.getElementById('lsBody'); if(b) b.innerHTML='';
  const h = document.getElementById('lsBody'); if(h) h.scrollIntoView({behavior:'smooth', block:'center'});
}

window.PKapp.bootApp('admin','index.html'+location.hash,{top:false},render);
window.addEventListener('hashchange', ()=>{
  const next = moduleFromHash();
  if(next !== cur){ cur = next; show(document.querySelector('.mn') || document.body); syncTop(document); }
});
})();
