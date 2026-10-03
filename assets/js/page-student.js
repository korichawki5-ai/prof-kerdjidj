/* ══════════════════════════════════════════════════════════════════
   page-student.js · Espace élève : cours, lecteur de cours,
   exercices, progression, emploi du temps, annonces, profil.
   Rendu piloté par <html data-page="student-…">.
   ⚡ Progression par XP uniquement — aucune note scolaire.
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, svg, t, toast, replayFx, initReveal, initProgress, confetti} = window.PK;
const D = window.PKdata, X = window.PKxp, S = D.settings;
let L='ar'; const ar=()=>L==='ar'; const L_=(a,f)=>ar()?a:f;

const DAYS={sat:['السبت','Samedi','Sam'],sun:['الأحد','Dimanche','Dim'],mon:['الاثنين','Lundi','Lun'],
            tue:['الثلاثاء','Mardi','Mar'],wed:['الأربعاء','Mercredi','Mer'],thu:['الخميس','Jeudi','Jeu']};
const AXFR={grammaire:'Grammaire',conjugaison:'Conjugaison',orthographe:'Orthographe',vocabulaire:'Vocabulaire',
  comprehension:'Compréhension',expression:'Expression écrite',oral:'Expression orale',
  methodology:'Méthodologie BEM',methodologie:'Méthodologie BEM',sujets:'Sujets corrigés'};
const axName=id=>{ const a=D.axes.find(x=>x.id===id); const v=a?L_(a.ar,a.fr):(AXFR[id]||''); return v||''; };
/* شارة المحور: تُخفى إن لم يكن المحور محدّداً (لا « undefined ») */
const axBadge=id=>{ const n=axName(id); return n?`<span class="bd bd--gy">${escH(n)}</span>`:''; };
const ini=n=>String(n).split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
const me=()=>D.me;
const myLv=()=>{const m=D.me; if(!m) return null; return m.role==='admin'?'ALL':(m.level||null);};
const myLessons=()=>{const lv=myLv(); return lv==='ALL'?D.lessons:D.lessons.filter(l=>l.level===lv);};
const myExercises=()=>{const lv=myLv(); return lv==='ALL'?D.exercises:D.exercises.filter(e=>e.level===lv);};
const annTitle=a=>{const c=(a.i18n&&typeof a.i18n==='object')?a.i18n:null;
  return L_(c&&c.ar,c&&c.fr)||L_(a.titleAr,a.titleFr)||L_('إعلان','Annonce');};
const annBody=a=>{const c=(a.i18n&&typeof a.i18n==='object')?a.i18n:null;
  return L_(c&&c.bodyAr,c&&c.bodyFr)||L_(c&&c.arBody,c&&c.frBody)||L_(a.bodyAr,a.bodyFr)||L_(a.arBody,a.frBody)||(typeof a.i18n==='string'?t(a.i18n):'')||'';};
const emptyCard=(k,i)=>`<div class="empty"><div class="ico">${svg(i||'book')}</div><b>${t(k)}</b></div>`;
const lvCls=id=>{ const l=D.byId(D.levels,id); return l?l.cls:'lv-1am'; };
/* أرقام آمنة: لا نعرض « undefined » إن كان الحقل ناقصاً في قاعدة البيانات */
const nun=(v,d)=>(typeof v==='number'&&!isNaN(v))?v:(d===undefined?'—':d);
/* ملخّص الدرس: يُخفى إن لم تكتبه الأستاذة (لا كلمة undefined) */
const sumOf=l=>{ const v=L_(l&&l.sumAr,l&&l.sumFr); return (v==null||v==='')?'':String(v); };
const exQn=x=>(typeof x.q==='number')?x.q:(Array.isArray(x.questions)?x.questions.length:'—');
const escH=v=> (window.PK && window.PK.esc) ? window.PK.esc(v) : String(v==null?'':v);

/* ───────── En-tête de page (barre de titre de l'app) ───────── */
function head(o){
  return `<div class="mn__t">
    <div>${o.crumb?`<div class="crumb">${o.crumb}</div>`:''}
      <h1 style="font-size:clamp(1.3rem,2.6vw,1.85rem)">${o.title}</h1>
      <p>${o.sub||''}</p></div>
    <div class="mn__a">
      <button class="btn btn--g btn--i" data-search title="Ctrl+K">${svg('search')}</button>
      <div class="lgsw"><button data-lang="ar">AR</button><button data-lang="fr">FR</button></div>
      <button class="btn btn--g btn--i" data-theme-btn>${svg('moon')}</button>
      ${o.actions||''}
    </div>
  </div>`;
}
const crumb=(href,label)=>`<a href="${href}">${label}</a>${svg('chev','width="13" height="13"')}`;

/* ══════════════════ 1. MES COURS ══════════════════ */
let lsF={lv:'',ax:'',q:'',done:''};
function lessons(){
  const m=me(), sum=X.summarize(m);
  if(!myLessons().length) return emptyCard('noLessons','book');
  const done=myLessons().filter(l=>l.done).length;
  return head({crumb:crumb('index.html',t('sbDash'))+'<span>'+t('sbLessons')+'</span>',
    title:t('sbLessons'),
    sub:L_(`${myLessons().length} درساً · أكملت ${done} · كل درس مكتمل = +${X.CFG.xpPerLesson} XP`,
           `${myLessons().length} cours · ${done} terminés · chaque cours terminé = +${X.CFG.xpPerLesson} XP`),
    actions:`<a href="exercises.html" class="btn btn--p btn--sm">${svg('quiz','width="16" height="16"')}${t('sbEx')}</a>`}) + `
  <div class="kpis cas">
    ${[[t('k4'),done,'book','ico--pu'],[t('lsAll'),myLessons().length,'layers',''],
       [t('xpTotal'),sum.xp.toLocaleString('fr-FR'),'bolt','ico--wn'],[t('mastery'),sum.globalMastery+'%','target','ico--ok']]
      .map(([l,v,ic,c])=>`<div class="kpi rv"><div class="kpi__t"><span class="ico ico--sm ${c}">${svg(ic)}</span></div>
        <div class="kpi__n la">${v}</div><div class="kpi__l">${l}</div></div>`).join('')}
  </div>
  <div class="cd rv mt5" style="padding:16px 18px">
    <div class="flex gap3 wrap-f items-c">
      <div class="srch" style="flex:1;min-width:200px">${svg('search')}
        <input class="inp" id="sLsQ" placeholder="${t('lsSearch')}"></div>
      <div class="lsw" id="sLsLv" style="gap:8px">
        <button class="${!lsF.lv?'on':''}" data-lv="">${t('allLevels')}</button>
        ${D.levels.map(l=>`<button class="${lsF.lv===l.id?'on':''}" data-lv="${l.id}">${l.id}</button>`).join('')}
      </div>
      <div class="seg" id="sLsDone">
        <button class="${!lsF.done?'on':''}" data-d="">${t('all')}</button>
        <button class="${lsF.done==='1'?'on':''}" data-d="1">${t('lsDone')}</button>
        <button class="${lsF.done==='0'?'on':''}" data-d="0">${L_('غير مكتمل','À faire')}</button>
      </div>
    </div>
    <div class="chips mt4" id="sLsAx">
      <button class="chip ${!lsF.ax?'on':''}" data-ax="">${t('all')} <span class="n la">${myLessons().length}</span></button>
      ${D.axes.map(a=>`<button class="chip ${lsF.ax===a.id?'on':''}" data-ax="${a.id}">${L_(a.ar,a.fr)}
        <span class="n la">${myLessons().filter(l=>l.ax===a.id).length}</span></button>`).join('')}
    </div>
  </div>
  <div class="lsg mt5" id="sLsGrid"></div>
  <div class="empty" id="sLsEmpty" style="display:none">${svg('search')}<b>${t('stuNoRes')}</b></div>`;
}
function renderLsGrid(host){
  const g=$('#sLsGrid',host)||$('#sLsGrid'); if(!g) return;
  if(!myLessons().length){ g.innerHTML=emptyCard('noLessons','book'); return; }
  const list=myLessons().filter(l=>{
    if(lsF.lv&&l.level!==lsF.lv) return false;
    if(lsF.ax&&l.ax!==lsF.ax) return false;
    if(lsF.done==='1'&&!l.done) return false;
    if(lsF.done==='0'&&l.done) return false;
    if(lsF.q&&!(l.ar+' '+l.fr+' '+l.sumAr+' '+l.sumFr).toLowerCase().includes(lsF.q.toLowerCase())) return false;
    return true;});
  const em=$('#sLsEmpty'); if(em) em.style.display=list.length?'none':'grid';
  g.innerHTML=list.map(x=>`<article class="ls rv">
    <div class="ls__th">${svg(x.icon||(D.axes.find(a=>a.id===x.ax)||{icon:'book'}).icon)}</div>
    <div class="flex gap2 wrap-f">
      <span class="bd bd--lv ${lvCls(x.level)}">${escH(x.level||'')}</span>
      ${axBadge(x.ax)}
      ${x.done?`<span class="bd bd--ok">${svg('checkc','width="11" height="11"')}${t('lsDone')}</span>`:''}
      ${x.isNew?`<span class="bd bd--ac">${svg('spark','width="11" height="11"')}${t('lsNew')}</span>`:''}
    </div>
    <h3 class="ls__t" dir="ltr">${L_(x.ar,x.fr)}</h3>
    ${sumOf(x) ? `<p class="muted" style="font-size:.87rem;line-height:1.75;flex:1">${escH(sumOf(x))}</p>` : ''}
    <div class="ls__m">
      <span class="bd bd--gy la">${svg('clock','width="12" height="12"')}${nun(x.min)} ${t('lsMin')}</span>
      <span class="bd bd--gy la">${svg('file','width="12" height="12"')}${x.files||0}</span>
      <span class="bd bd--wn la">${svg('bolt','width="12" height="12"')}+${x.xp||X.CFG.xpPerLesson} XP</span>
    </div>
    <a class="btn btn--${x.done?'g':'p'} btn--blk mt4" href="lesson.html?id=${x.id}">
      ${svg(x.done?'checkc':'book','width="16" height="16"')}${x.done?t('exCont'):t('lsStart')}</a>
  </article>`).join('');
  initReveal(g); replayFx(g);
}
function bindLessons(host){
  const q=$('#sLsQ',host); if(q) q.addEventListener('input',()=>{lsF.q=q.value;renderLsGrid(host);});
  $$('#sLsLv button',host).forEach(b=>b.addEventListener('click',()=>{
    $$('#sLsLv button',host).forEach(x=>x.classList.toggle('on',x===b)); lsF.lv=b.dataset.lv; renderLsGrid(host);}));
  $$('#sLsAx .chip',host).forEach(b=>b.addEventListener('click',()=>{
    $$('#sLsAx .chip',host).forEach(x=>x.classList.toggle('on',x===b)); lsF.ax=b.dataset.ax; renderLsGrid(host);}));
  $$('#sLsDone button',host).forEach(b=>b.addEventListener('click',()=>{
    $$('#sLsDone button',host).forEach(x=>x.classList.toggle('on',x===b)); lsF.done=b.dataset.d; renderLsGrid(host);}));
  renderLsGrid(host);
}

/* ══════════════════ 2. LECTEUR DE COURS ══════════════════ */
function lessonPage(){
  const id=new URLSearchParams(location.search).get('id');
  const idx=myLessons().findIndex(l=>l.id===id);
  const l=myLessons()[idx>=0?idx:0];
  const ax=D.axes.find(a=>a.id===l.ax)||{icon:'book'};
  const ex=myExercises().filter(e=>e.lessonId===l.id||e.ax===l.ax&&e.level===l.level);
  const prev=myLessons()[idx-1], next=myLessons()[idx+1];
  return head({crumb:crumb('index.html',t('sbDash'))+crumb('lessons.html',t('sbLessons'))+'<span>'+l.id+'</span>',
    title:L_(l.ar,l.fr),
    sub:`${l.level} · ${axName(l.ax)} · ${nun(l.min)} ${t('lsMin')} · +${l.xp||X.CFG.xpPerLesson} XP`,
    actions:`${prev?`<a class="btn btn--g btn--i" href="lesson.html?id=${prev.id}" title="${L_('السابق','Précédent')}">${svg('arrow')}</a>`:''}
      ${next?`<a class="btn btn--g btn--i" href="lesson.html?id=${next.id}" title="${L_('التالي','Suivant')}">${svg('chev')}</a>`:''}`}) + `
  <div class="g g-main adm-split" style="--adm-side:320px">
    <div style="min-width:0;display:flex;flex-direction:column;gap:20px">
      <div class="cd rv">
        <div class="flex gap2 wrap-f mb4">
          <span class="bd bd--lv ${lvCls(l.level)}">${escH(l.level||'')}</span>
          <span class="bd bd--gy">${svg(ax.icon,'width="12" height="12"')}${axName(l.ax)}</span>
          <span class="bd bd--gy la">${svg('clock','width="12" height="12"')}${nun(l.min)} min</span>
          ${l.done?`<span class="bd bd--ok">${svg('checkc','width="12" height="12"')}${t('lsDone')}</span>`:''}
        </div>
        <h2 style="font-size:clamp(1.15rem,2.4vw,1.6rem);margin-block-end:6px" dir="ltr">${L_(l.ar,l.fr)}</h2>
        ${sumOf(l) ? `<p class="muted" style="font-size:.92rem;line-height:1.8;margin-block-end:18px">${escH(sumOf(l))}</p>` : ''}
        <div class="rich" dir="ltr">${l.content||''}</div>
        <div class="flex gap3 mt6 wrap-f" style="padding-block-start:18px;border-block-start:1px dashed var(--line)">
          <button class="btn btn--${l.done?'g':'p'}" id="lsDone">${svg(l.done?'refresh':'checkc','width="17" height="17"')}
            ${l.done?t('exCont'):t('lsMark')}</button>
          <a class="btn btn--g" href="#" data-dl>${svg('up','width="17" height="17"')}${t('lsDownload')}</a>
          ${l.video?`<a class="btn btn--g" href="#" data-video>${svg('play','width="17" height="17"')}${t('lsVideo')}</a>`:''}
          <span class="muted" style="font-size:.84rem;display:flex;align-items:center;gap:8px;margin-inline-start:auto">
            ${svg('info','width="15" height="15"')}${L_('درس للمراجعة — لا نقطة مدرسية','Cours de révision — aucune note scolaire')}</span>
        </div>
      </div>
      ${ex.length?`<div class="cd rv">
        <div class="cd__h cd__h--b"><div><div class="cd__t">${t('lsRelated')}</div>
          <div class="cd__s">${L_('درّب نفسك مباشرة بعد القراءة','Entraînez-vous juste après la lecture')}</div></div>
          <span class="bd la">${ex.length}</span></div>
        ${ex.slice(0,4).map(e=>`<div class="mini-row">
          <span class="ico ico--sm">${svg('quiz')}</span>
          <div style="min-width:0"><b>${L_(e.titleAr,e.titleFr)}</b>
            <div class="muted la" style="font-size:.78rem">${exQn(e)} ${t('exQ')} · ${nun(e.min)} min · ≤ ${nun(e.xpMax,0)} XP</div></div>
          <a class="btn btn--s btn--sm" style="margin-inline-start:auto" href="exercise.html?id=${e.id}">${svg('play','width="14" height="14"')}${t('exStart')}</a>
        </div>`).join('')}
      </div>`:''}
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <div class="cd rv">
        <div class="cd__t mb4" style="font-size:.95rem">${L_('محتوى الدرس','Contenu du cours')}</div>
        <div class="g gap3">
          ${[['file',t('lsPdf'),(l.files||0)+' PDF'],['play',t('lsVideo'),l.video?'1':'—'],
             ['quiz',t('lsEx'),String(ex.length)],['bolt','XP','+'+(l.xp||X.CFG.xpPerLesson)]]
            .map(([ic,lb,v])=>`<div class="flex just-b items-c" style="padding:10px 0;border-block-end:1px dashed var(--line);font-size:.86rem">
              <span class="flex items-c gap3">${svg(ic,'width="16" height="16" style="color:var(--ac)"')}${lb}</span><b class="la">${v}</b></div>`).join('')}
        </div>
      </div>
      <div class="cd rv" style="--d:60ms">
        <div class="cd__t mb4" style="font-size:.95rem">${L_('تقدّمك في هذا المحور','Votre progression sur cet axe')}</div>
        ${(()=>{const v=(me().mastery[l.ax]||0);return `
          <div class="flex just-b items-c mb3"><b>${axName(l.ax)}</b><span class="bd la">${v}%</span></div>
          <div class="prg prg--lg"><i data-w="${v}%" style="width:${v}%"></i></div>
          <p class="muted mt4" style="font-size:.82rem;line-height:1.75">${L_('تتحسّن النسبة مع كل تمرين مُنجَز في هذا المحور.','Le taux progresse à chaque exercice réussi dans cet axe.')}</p>`;})()}
      </div>
      <div class="cd rv" style="--d:120ms">
        <div class="cd__t mb4" style="font-size:.95rem">${L_('الدروس المجاورة','Cours voisins')}</div>
        <div class="g gap3">
          ${myLessons().filter(x=>x.level===l.level&&x.id!==l.id).slice(0,4).map(x=>`
            <a href="lesson.html?id=${x.id}" class="mini-row"><span class="bd bd--gy la">${x.id}</span>
              <span style="font-size:.83rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" dir="ltr">${L_(x.ar,x.fr)}</span></a>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}
function bindLesson(host){
  const b=$('#lsDone',host); if(!b) return;
  b.addEventListener('click',()=>{
    const id=new URLSearchParams(location.search).get('id')||(myLessons()[0]||{}).id;
    const l=myLessons().find(x=>x.id===id); if(!l) return emptyCard('noLessons','book');
    const was = !!l.done;
    l.done = !was;
    const xp = X.CFG.xpPerLesson;
    if(l.done){
      /* محلياً: التلميذ بلا حساب — تقدّمه محفوظ على جهازه */
      if(window.PKlocal && window.PKlocal.active()){
        const r = window.PKlocal.logLesson(l.id, xp);
        if(r && !r.already) confetti(60);
        toast(`${t('lsMark')} · +${xp} XP`,'ok',3200);
      } else {
        window.PKdb.markLessonDone(me().id, l.id, xp);
        confetti(60); toast(`${t('lsMark')} · +${xp} XP`,'ok',3200);
      }
    } else {
      if(window.PKlocal && window.PKlocal.active()) window.PKlocal.unmarkLesson(l.id, xp);
      toast(L_('أُلغي وضع الإكمال','Cours marqué comme non terminé'),'wn',2200);
    }
    b.className='btn btn--'+(l.done?'g':'p');
    b.innerHTML=svg(l.done?'refresh':'checkc','width="17" height="17"')+(l.done?t('exCont'):t('lsMark'));
  });
  const dl=$('[data-dl]',host); if(dl) dl.addEventListener('click',e=>{e.preventDefault();
    toast(L_('الملخّص سيكون متاحاً بعد ربط Firebase Storage.','La fiche sera disponible après connexion à Firebase Storage.'),'info',3000);});
  const vd=$('[data-video]',host); if(vd) vd.addEventListener('click',e=>{e.preventDefault();
    toast(L_('الفيديو سيُضاف مع الحصص المسجّلة قريباً.','La vidéo sera ajoutée avec les séances enregistrées.'),'info',3000);});
}

/* ══════════════════ 3. MES EXERCICES ══════════════════ */
let exF={lv:'',ty:''};
function exercises(){
  const m=me(), sum=X.summarize(m);
  if(!myExercises().length) return emptyCard('noExercises','quiz');
  return head({crumb:crumb('index.html',t('sbDash'))+'<span>'+t('sbEx')+'</span>',
    title:t('sbEx'),
    sub:L_(`${myExercises().length} تمريناً · أنجزت ${sum.exDone} · دقّتك ${sum.accuracy}%`,
           `${myExercises().length} exercices · ${sum.exDone} résolus · précision ${sum.accuracy}%`),
    actions:`<a href="lessons.html" class="btn btn--g btn--sm">${svg('book','width="16" height="16"')}${t('sbLessons')}</a>`}) + `
  <div class="kpis cas">
    ${[[t('k5'),sum.exDone,'quiz','ico--cy'],[t('accuracy'),sum.accuracy+'%','checkc','ico--ok'],
       [t('bestStreak'),sum.bestStreak,'flame','ico--wn'],[t('xpTotal'),sum.xp.toLocaleString('fr-FR'),'bolt','']]
      .map(([l,v,ic,c])=>`<div class="kpi rv"><div class="kpi__t"><span class="ico ico--sm ${c}">${svg(ic)}</span></div>
        <div class="kpi__n la">${v}</div><div class="kpi__l">${l}</div></div>`).join('')}
  </div>
  <div class="cd rv mt5" style="padding:16px 18px">
    <div class="flex gap3 wrap-f items-c">
      <div class="lsw" id="sExLv" style="gap:8px">
        <button class="${!exF.lv?'on':''}" data-lv="">${t('allLevels')}</button>
        ${D.levels.map(l=>`<button class="${exF.lv===l.id?'on':''}" data-lv="${l.id}">${l.id}</button>`).join('')}
      </div>
      <div class="chips" id="sExTy" style="margin-inline-start:auto">
        <button class="chip ${!exF.ty?'on':''}" data-ty="">${t('all')}</button>
        ${['mcq','tf','fill','mixed'].map(k=>`<button class="chip ${exF.ty===k?'on':''}" data-ty="${k}">${t('ty'+k.charAt(0).toUpperCase()+k.slice(1))}</button>`).join('')}
      </div>
    </div>
  </div>
  <div class="g g3 cas mt5" id="sExGrid"></div>
  <div class="empty" id="sExEmpty" style="display:none">${svg('search')}<b>${t('stuNoRes')}</b></div>`;
}
function renderExGrid(host){
  const g=$('#sExGrid',host)||$('#sExGrid'); if(!g) return;
  const list=myExercises().filter(e=>(!exF.lv||e.level===exF.lv)&&(!exF.ty||e.type===exF.ty));
  const em=$('#sExEmpty'); if(em) em.style.display=list.length?'none':'grid';
  const m=me();
  g.innerHTML=list.map(x=>{
    const best=X.bestOf?X.bestOf(m,x.id):null;
    return `<div class="cd cd--h rv">
      <div class="flex gap2 wrap-f mb4">
        <span class="bd bd--lv ${lvCls(x.level)}">${x.level}</span>
        ${axBadge(x.ax)}
        <span class="qtype qtype--${(x.type==='mixed'?'mcq':(x.type||'quiz'))}">${t('ty'+(x.type||'quiz').charAt(0).toUpperCase()+(x.type||'quiz').slice(1))}</span>
        <span class="diff diff--${x.diff}" style="margin-inline-start:auto"><i class="on"></i><i class="${x.diff>=2?'on':''}"></i><i class="${x.diff>=3?'on':''}"></i></span>
      </div>
      <h3 style="font-size:1.02rem;font-family:var(--ffl)">${L_(x.titleAr,x.titleFr)}</h3>
      <p class="muted mt3" style="font-size:.88rem;line-height:1.8;flex:1">${L_(x.descAr,x.descFr)}</p>
      ${best?`<div class="flex just-b items-c mt3" style="font-size:.82rem">
        <span class="muted">${t('exBest')}</span><b class="la" style="color:var(--ok)">${best}%</b></div>`:''}
      <div class="cd__f">
        <span class="bd bd--gy la">${svg('quiz','width="12" height="12"')}${exQn(x)}</span>
        <span class="bd bd--gy la">${svg('clock','width="12" height="12"')}${x.min}</span>
        <span class="bd bd--wn la">${svg('bolt','width="12" height="12"')}≤ ${nun(x.xpMax,0)}</span>
        <a class="btn btn--p btn--sm" style="margin-inline-start:auto" href="exercise.html?id=${x.id}">${svg('play','width="15" height="15"')}${t('exStart')}</a>
      </div>
    </div>`;}).join('');
  initReveal(g); replayFx(g);
}
function bindExercises(host){
  $$('#sExLv button',host).forEach(b=>b.addEventListener('click',()=>{
    $$('#sExLv button',host).forEach(x=>x.classList.toggle('on',x===b)); exF.lv=b.dataset.lv; renderExGrid(host);}));
  $$('#sExTy .chip',host).forEach(b=>b.addEventListener('click',()=>{
    $$('#sExTy .chip',host).forEach(x=>x.classList.toggle('on',x===b)); exF.ty=b.dataset.ty; renderExGrid(host);}));
  renderExGrid(host);
}

/* ══════════════════ 4. MA PROGRESSION ══════════════════ */
function progressPage(){
  const m=me(), sum=X.summarize(m), rp=sum.rankProgress, nxt=rp.next;
  const weeks=[[320,410,380,520,610,480,700],[450,520,610,580,720,690,810]];
  const flat=weeks.flat(); const mx=Math.max(...flat);
  const hist=[
    {d:'2025-09-30',ex:'Les pronoms relatifs',lv:'4AM',c:7,t:8,xp:212,ok:true},
    {d:'2025-09-29',ex:'Conjugaison : passé composé',lv:'4AM',c:14,t:15,xp:340,ok:true},
    {d:'2025-09-28',ex:'Orthographe : accords',lv:'4AM',c:9,t:12,xp:150,ok:false},
    {d:'2025-09-27',ex:'Compréhension de texte',lv:'4AM',c:6,t:6,xp:260,ok:true},
    {d:'2025-09-25',ex:'Vocabulaire : sentiments',lv:'4AM',c:11,t:14,xp:180,ok:false}
  ];
  return head({crumb:crumb('index.html',t('sbDash'))+'<span>'+t('sbProg')+'</span>',
    title:t('sbProg'),
    sub:L_('XP · رتبة · سلسلة · إتقان لكل محور · أوسمة — بدون أي نقطة مدرسية',
           'XP · rang · série · maîtrise par axe · badges — aucune note scolaire'),
    actions:`<a href="exercises.html" class="btn btn--p btn--sm">${svg('play','width="16" height="16"')}${t('exStart')}</a>`}) + `
  <div class="g g-main adm-split" style="--adm-side:340px">
    <div style="min-width:0;display:flex;flex-direction:column;gap:20px">
      <div class="cd rv" style="background:linear-gradient(140deg,var(--ac-dd),var(--ac) 60%,var(--ac-2));border:0;color:#fff">
        <div class="flex items-c gap4 wrap-f">
          <span class="ico" style="background:rgba(255,255,255,.16);color:#fff;width:58px;height:58px;border-radius:18px">${svg(sum.rank.icon,'width="28" height="28"')}</span>
          <div style="flex:1;min-width:200px">
            <div style="font-size:.8rem;font-weight:800;opacity:.82">${L_('رتبتك الحالية','Votre rang actuel')}</div>
            <div style="font-size:1.5rem;font-weight:800;margin-block:2px 6px">${L_(sum.rank.ar,sum.rank.fr)}
              <span class="la" style="font-size:.85rem;opacity:.8">· ${sum.rank.id}/${X.RANKS.length}</span></div>
            <div class="xpbar" style="background:rgba(255,255,255,.22)"><i style="width:${rp.pct}%;background:#fff"></i></div>
            <div class="flex just-b la mt3" style="font-size:.8rem;opacity:.9">
              <span>${sum.xp.toLocaleString('fr-FR')} XP</span>
              <span>${nxt?`${L_(nxt.ar,nxt.fr)} · ${rp.need.toLocaleString('fr-FR')} XP`:L_('أعلى رتبة ✓','Rang maximum ✓')}</span></div>
          </div>
        </div>
      </div>

      <div class="kpis cas">
        ${[[t('xpTotal'),sum.xp.toLocaleString('fr-FR'),'bolt','ico--wn'],[t('streak'),sum.streak,'flame','ico--er'],
           [t('accuracy'),sum.accuracy+'%','checkc','ico--ok'],[t('mastery'),sum.globalMastery+'%','target','ico--pu']]
          .map(([l,v,ic,c])=>`<div class="kpi rv"><div class="kpi__t"><span class="ico ico--sm ${c}">${svg(ic)}</span></div>
            <div class="kpi__n la">${v}</div><div class="kpi__l">${l}</div></div>`).join('')}
      </div>

      <div class="chart rv">
        <div class="chart__h"><div><div class="cd__t">${L_('XP المكتسبة خلال الأسبوعين الأخيرين','XP gagnés sur les deux dernières semaines')}</div>
          <div class="cd__s">${L_('كل عمود = يوم تدريب','Chaque barre = un jour d’entraînement')}</div></div>
          <span class="bd bd--ok la">+${flat.reduce((a,b)=>a+b,0).toLocaleString('fr-FR')} XP</span></div>
        <div class="bars">${flat.map((v,i)=>`<div class="bars__b">
          <div class="bars__v ${v>=mx*.8?'ok':v>=mx*.5?'':'wn'}" data-v="${v}" data-h="${Math.round(v/mx*100)}%" style="height:${Math.round(v/mx*100)}%"></div>
          <span class="bars__l">${i+1}</span></div>`).join('')}</div>
        <div class="lgd"><span><i style="background:var(--ac)"></i>${L_('يوم عادي','Journée normale')}</span>
          <span><i style="background:var(--ok)"></i>${L_('يوم قوي','Grosse journée')}</span>
          <span><i style="background:var(--wn)"></i>${L_('يوم خفيف','Petite journée')}</span></div>
      </div>

      <div class="cd rv">
        <div class="cd__h cd__h--b"><div><div class="cd__t">${L_('محاور الإتقان','Maîtrise par axe')}</div>
          <div class="cd__s">${L_('تُحسب من نتائج تمارينك — لا من نقاط المدرسة','Calculée à partir de vos exercices — pas des notes scolaires')}</div></div>
          <span class="bd bd--ok la">${sum.globalMastery}%</span></div>
        <div class="g gap4">${Object.entries(m.mastery).map(([k,v])=>`<div>
          <div class="flex just-b" style="font-size:.87rem;margin-block-end:6px">
            <b class="la">${AXFR[k]||axName(k)}</b>
            <span class="muted la">${v}% · ${X.masteryLabel(v,L)}</span></div>
          <div class="prg ${v>=85?'prg--ok':v>=65?'':v>=40?'prg--wn':'prg--er'}"><i data-w="${v}%" style="width:${v}%"></i></div>
        </div>`).join('')}</div>
      </div>

      <div class="cd rv">
        <div class="cd__h cd__h--b"><div><div class="cd__t">${L_('سجلّ التمارين','Historique des exercices')}</div>
          <div class="cd__s">${L_('آخر محاولاتهم مع XP المكتسبة','Vos dernières tentatives avec les XP gagnés')}</div></div></div>
        <div class="tbw"><table class="tb">
          <thead><tr><th>${L_('التاريخ','Date')}</th><th>${t('sbEx')}</th><th>${t('stuLevel')}</th>
            <th>${L_('النتيجة','Résultat')}</th><th>XP</th><th></th></tr></thead>
          <tbody>${hist.map(h=>{const p=Math.round(h.c/h.t*100);return `<tr>
            <td class="la muted" style="font-size:.82rem">${h.d}</td>
            <td><b style="font-size:.88rem">${h.ex}</b></td>
            <td><span class="bd bd--lv lv-4am">${h.lv}</span></td>
            <td><span class="bd ${p>=80?'bd--ok':p>=55?'bd--wn':'bd--er'} la">${h.c}/${h.t} · ${p}%</span></td>
            <td><b class="la acc">+${h.xp}</b></td>
            <td><span class="bd ${h.ok?'bd--ok':'bd--wn'}">${h.ok?t('exCorrect'):t('exRetry')}</span></td>
          </tr>`;}).join('')}</tbody></table></div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <div class="cd rv">
        <div class="cd__h"><div class="cd__t" style="font-size:.98rem">${t('streak')}</div>
          <span class="bd bd--wn la">${svg('flame','width="12" height="12"')}×${sum.streakMult.toFixed(2)}</span></div>
        <div class="stk"><div class="stk__n la">${sum.streak}</div><div class="stk__l">${t('daysInRow')}</div></div>
        <div class="flex gap2 mt4" style="justify-content:center">
          ${['sat','sun','mon','tue','wed','thu','fri'].map((d,i)=>`<span class="sk ${i<sum.streak%7||sum.streak>=7?'on':''}" title="${DAYS[d]?DAYS[d][ar()?0:1]:d}">${DAYS[d]?DAYS[d][2]:d.slice(0,2)}</span>`).join('')}
        </div>
        <div class="flex just-b mt4" style="font-size:.84rem">
          <span class="muted">${t('bestStreak')}</span><b class="la">${sum.bestStreak} ${t('daysInRow')}</b></div>
      </div>
      <div class="cd rv" style="--d:60ms">
        <div class="cd__h"><div class="cd__t" style="font-size:.98rem">${t('stBadges')}</div>
          <span class="bd la">${sum.badges.length}/${X.BADGES.length}</span></div>
        <div class="bdgrid bdgrid--3" style="gap:10px">
          ${X.BADGES.map(b=>{const has=sum.badges.includes(b.id);
            return `<div class="bdgc ${has?'':'off'}" title="${t(b.i18n)}">
              <span class="bdgc__i">${svg(b.icon)}</span><b>${t(b.i18n)}</b></div>`;}).join('')}
        </div>
      </div>
      <div class="cd rv" style="--d:120ms">
        <div class="cd__t mb4" style="font-size:.98rem">${L_('نشاط 12 أسبوعاً','Activité sur 12 semaines')}</div>
        <div class="hm" id="sHm"></div>
        <div class="flex just-b mt4" style="font-size:.78rem"><span class="muted">${L_('أقل','Moins')}</span>
          <span class="flex gap2">${[0,1,2,3,4].map(i=>`<i class="hm__c" data-l="${i}" style="width:11px;height:11px;border-radius:3px;display:inline-block"></i>`).join('')}</span>
          <span class="muted">${L_('أكثر','Plus')}</span></div>
      </div>
    </div>
  </div>`;
}
function bindProgress(host){
  const hm=$('#sHm',host); if(!hm) return;
  const m=me(); let html='';
  for(let w=0; w<12; w++){
    html+='<div class="hm__w">';
    for(let d=0; d<7; d++){
      const v=Math.max(0,Math.round(Math.sin((w*7+d)/3.1)*40+ (d<5?55:20) + ((w*7+d)%5)*8));
      const lvl=v>85?4:v>65?3:v>40?2:v>15?1:0;
      html+=`<i data-l="${lvl}" title="${v} XP"></i>`;
    }
    html+='</div>';
  }
  hm.innerHTML=html;
}

/* ══════════════════ 5. MON EMPLOI DU TEMPS ══════════════════ */
function studentTimetable(){
  if(!D.groups.length) return emptyCard('noGroups','cal');
  const m=me(), g=D.groupOf(m.group)||{};
  const mine=D.groups.filter(x=>x.name===g.name||x.level===m.level);
  const todayK=(()=>{const k=['sun','mon','tue','wed','thu','fri','sat'][new Date().getDay()];return DAYS[k]?k:'sat';})();
  const next=(()=>{
    const order=D.days; const i=order.indexOf(todayK);
    for(let k=0;k<order.length;k++){ const d=order[(i+k)%order.length];
      const f=mine.filter(x=>x.day===d); if(f.length) return {d,g:f[0],today:k===0}; }
    return null;
  })();
  let grid=`<div class="hd la">${t('ttTime')}</div>`;
  D.days.forEach(d=>grid+=`<div class="hd ${d===todayK?'today':''}">${DAYS[d][ar()?0:1]}</div>`);
  D.slots.forEach(slot=>{
    grid+=`<div class="hr la">${slot}</div>`;
    D.days.forEach(d=>{
      const s=D.slotAt(d,slot);
      const mineHere=s&&mine.some(x=>x.name===s.name);
      grid += s ? `<div class="sl"><div class="blk ${s.cls||lvCls(s.level)} ${mineHere?'mine':''}"><b>${escH(s.name||'')}</b>
          <small>${L_(s.schoolAr,s.schoolFr)}</small><i class="la">${s.start}–${s.end}</i></div></div>`
        : `<div class="sl"></div>`;
    });
  });
  return head({crumb:crumb('index.html',t('sbDash'))+'<span>'+t('sbTt')+'</span>',
    title:t('sbTt'),
    sub:L_(`فوجك: ${g.name||m.group} · ${DAYS[g.day]?DAYS[g.day][ar()?0:1]:''} ${g.start||''} — ${L_(g.schoolAr,g.schoolFr)||''}`,
           `Votre groupe : ${g.name||m.group} · ${DAYS[g.day]?DAYS[g.day][ar()?0:1]:''} ${g.start||''} — ${g.schoolFr||''}`),
    actions:`<button class="btn btn--g btn--sm" onclick="window.print()">${svg('up','width="16" height="16"')}${t('ttPrint')}</button>`}) + `
  ${next?`<div class="cd rv mb5" style="border-inline-start:3px solid var(--ac)">
    <div class="flex items-c gap4 wrap-f">
      <span class="ico ico--lg">${svg('cal')}</span>
      <div style="flex:1;min-width:200px">
        <div class="cd__s">${next.today?t('ttToday'):L_('حصتك القادمة','Votre prochaine séance')}</div>
        <div class="cd__t" style="font-size:1.12rem">${DAYS[next.d][ar()?0:1]} · <span class="la">${next.g.start} – ${next.g.end}</span></div>
        <div class="muted" style="font-size:.86rem;margin-block-start:4px">${next.g.name} · ${L_(next.g.schoolAr,next.g.schoolFr)} · ${next.g.teacher} · ${next.g.room}</div>
      </div>
      <div class="flex gap3 la" style="text-align:center">
        ${[['h','00'],['m','00'],['s','00']].map(([k,v])=>`<div class="cd cd--flat" style="background:var(--bg2);padding:12px 16px;min-width:64px">
          <div style="font-size:1.5rem;font-weight:800;color:var(--ac)" id="cd${k.toUpperCase()}">${v}</div>
          <div class="muted" style="font-size:.72rem">${k==='h'?L_('ساعة','heures'):k==='m'?L_('دقيقة','min'):L_('ثانية','sec')}</div></div>`).join('')}
      </div>
    </div></div>`:''}
  <div class="tte rv"><div class="tte__s"><div class="tteg">${grid}</div></div></div>
  <p class="muted mt4" style="font-size:.84rem;display:flex;align-items:center;gap:9px">
    ${svg('info','width="16" height="16" style="color:var(--ac)"')}
    ${L_('الخانات المميّزة بالأزرق هي حصص فوجك. أي تغيير في التوقيت يظهر لك في الإعلانات.',
         'Les cases surlignées en bleu sont les séances de votre groupe. Tout changement d’horaire apparaît dans les annonces.')}</p>
  <div class="g g3 cas mt5">
    ${mine.map(x=>`<div class="cd rv">
      <div class="cd__h"><div class="cd__t">${x.name}</div>
        <span class="bd bd--lv ${x.cls||lvCls(x.level)}">${escH(x.level||'')}</span></div>
      <div class="g gap3">
        ${[['cal',DAYS[x.day][ar()?0:1]+' · '+x.start+'–'+x.end],['school',L_(x.schoolAr,x.schoolFr)],
           ['user',x.teacher],['pin',x.room+' · '+t('onsite')],
           ['target', (typeof x.enrolled==='number' && typeof x.capacity==='number')
                        ? `${x.enrolled}/${x.capacity} ${t('grStudents')}` : null]]
          .map(([ic,v])=>`<div class="flex items-c gap3" style="font-size:.86rem;padding:8px 0;border-block-end:1px dashed var(--line)">
            ${svg(ic,'width="16" height="16" style="color:var(--ac)"')}<span>${v}</span></div>`).join('')}
      </div></div>`).join('')}
  </div>`;
}
function bindTimetable(host){
  const h=$('#cdH',host); if(!h) return;
  const tick=()=>{
    const now=new Date(); const end=new Date(now); end.setHours(23,59,59,999);
    const s=Math.floor((end-now)/1000);
    const eH=$('#cdH',host), eM=$('#cdM',host), eS=$('#cdS',host);
    if(eH) eH.textContent=String(Math.floor(s/3600)).padStart(2,'0');
    if(eM) eM.textContent=String(Math.floor(s/60)%60).padStart(2,'0');
    if(eS) eS.textContent=String(s%60).padStart(2,'0');
  };
  tick(); setInterval(tick,1000);
}

/* ══════════════════ 6. ANNONCES ══════════════════ */
function announcements(){
  const list=[...D.announcements].sort((a,b)=>(b.pinned?1:0)-(a.pinned?1:0));
  if(!list.length) return emptyCard('noAnnounces','bell');
  return head({crumb:crumb('index.html',t('sbDash'))+'<span>'+t('sbAnn')+'</span>',
    title:t('sbAnn'),
    sub:L_('كل ما تنشره الأستاذة يصلك هنا فوراً','Tout ce que publie la professeure arrive ici immédiatement')}) + `
  <div class="g g-main adm-split" style="--adm-side:320px">
    <div style="display:flex;flex-direction:column;gap:16px;min-width:0">
      ${list.map(a=>{
        const imp=a.importance||'info';
        const col=imp==='urgent'?'var(--er)':imp==='important'?'var(--wn)':'var(--ac)';
        return `<div class="cd rv" style="border-inline-start:3px solid ${col}">
          <div class="cd__h"><div><div class="cd__t">${annTitle(a)}</div>
            <div class="cd__s">${svg('cal','width="12" height="12" style="display:inline;vertical-align:-2px"')} <span class="la">${a.date}</span></div></div>
            <div class="flex gap2">${a.pinned?`<span class="bd bd--wn">${svg('pin','width="12" height="12"')}${t('annPinned')}</span>`:''}
              <span class="bd" style="background:color-mix(in srgb,${col} 12%,transparent);color:${col};border-color:color-mix(in srgb,${col} 30%,transparent)">
                ${L_(imp==='urgent'?'عاجل':imp==='important'?'مهم':'معلومة', imp==='urgent'?'Urgent':imp==='important'?'Important':'Info')}</span></div>
          </div>
          <div style="font-size:.93rem;line-height:1.9">${annBody(a)}</div>
        </div>`;}).join('')}
      <div class="cd rv" style="border-style:dashed;text-align:center;padding:30px">
        <span class="ico ico--lg" style="margin-inline:auto">${svg('bell')}</span>
        <b class="mt4" style="display:block">${L_('لا إعلانات أخرى','Aucune autre annonce')}</b>
        <p class="muted mt3" style="font-size:.86rem">${L_('ستظهر هنا كل الإعلانات الجديدة: تغيير توقيت، تمارين جديدة، حصص تعويضية.',
          'Toutes les nouvelles annonces apparaîtront ici : changement d’horaire, nouveaux exercices, séances de rattrapage.')}</p>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <div class="cd rv">
        <div class="cd__t mb4" style="font-size:.95rem">${L_('تنبيهاتك','Vos alertes')}</div>
        ${[[L_('إعلانات الفوج','Annonces du groupe'),true],[L_('تغيير التوقيت','Changement d’horaire'),true],
           [L_('تمارين جديدة','Nouveaux exercices'),true],[L_('تذكير السلسلة','Rappel de série'),false]]
          .map(([l,on])=>`<label class="flex items-c gap3" style="padding:11px 0;border-block-end:1px dashed var(--line);cursor:pointer">
            <span class="sw ${on?'on':''}"><i></i></span><span style="font-size:.88rem">${l}</span></label>`).join('')}
        <p class="muted mt4" style="font-size:.78rem;line-height:1.7">${svg('info','width="13" height="13" style="display:inline;vertical-align:-2px"')}
          ${L_('التنبيهات تُحفظ في ملفك وتُفعَّل بعد ربط Firebase.','Les alertes sont enregistrées dans votre profil et activées après connexion à Firebase.')}</p>
      </div>
      <div class="cd rv" style="--d:60ms">
        <div class="cd__t mb4" style="font-size:.95rem">${t('adMsg')}</div>
        <p class="muted" style="font-size:.86rem;line-height:1.8">${L_('تحتاج توضيحاً؟ راسل الأستاذة مباشرة من فضاءك.','Besoin d’une précision ? Écrivez à la professeure depuis votre espace.')}</p>
        <a class="btn btn--p btn--blk mt4" href="../contact.html">${svg('send','width="17" height="17"')}${t('navContact')}</a>
      </div>
    </div>
  </div>`;
}
function bindAnnouncements(host){
  $$('.sw',host).forEach(sw=> sw.addEventListener('click',()=>{
    sw.classList.toggle('on');
    toast(sw.classList.contains('on')?L_('التنبيه مفعّل ✓','Alerte activée ✓'):L_('التنبيه معطّل','Alerte désactivée'),'info',1800);
  }));
}

/* ══════════════════ 7. MON PROFIL ══════════════════ */
/* تلميذ بلا حساب: كل حقوله قابلة للتعديل، وبياناته على جهازه. */
function localInfoCards(m){
  const st = m.sent
    ? L_('أُرسل إلى الأستاذة ✓','Envoyé à la professeure ✓')
    : L_('لم يُرسل بعد — اضغط «إعادة الإرسال»','Pas encore envoyé — cliquez sur « Renvoyer »');
  return `
      <div class="cd rv">
        <div class="cd__h"><div><div class="cd__t">${L_('معلوماتي','Mes informations')}</div>
          <div class="cd__s">${L_('عدّل معلوماتك — تُحفظ على هذا الجهاز، وترسلها إلى الأستاذة بزر واحد','Modifiez vos informations — elles restent sur cet appareil et partent vers la professeure en un clic')}</div></div>
          <span class="bd ${m.sent?'bd--ok':'bd--wn'}">${st}</span></div>
        <div class="g g2" style="gap:16px">
          <div class="fld"><label>${L_('الاسم واللقب','Nom et prénom')}</label><input class="inp" id="pfName" value="${escH(m.ar)}"></div>
          <div class="fld"><label data-i18n="stuLevel">${t('stuLevel')}</label>
            <select class="sel" id="pfLevel">${D.levels.map(l=>`<option value="${escH(l.id)}"${l.id===m.level?' selected':''}>${escH(l.id)} — ${escH(L_(l.ar,l.fr))}</option>`).join('')}</select></div>
          <div class="fld"><label>${L_('تاريخ الميلاد','Date de naissance')}</label><input class="inp" id="pfBirth" type="date" dir="ltr" value="${escH(m.birth||'')}"></div>
          <div class="fld"><label data-i18n="stuParent">${t('stuParent')}</label><input class="inp" id="pfPhone" dir="ltr" inputmode="tel" value="${escH(m.parent||'')}"></div>
          <div class="fld"><label>${L_('البريد الإلكتروني','E-mail')}</label><input class="inp" id="pfMail" type="email" dir="ltr" value="${escH(m.email||'')}"></div>
          <div class="fld"><label data-i18n="stuSchool">${t('stuSchool')}</label><input class="inp" id="pfSchool" value="${escH(m.school||'')}"></div>
        </div>
        <div class="fld mt4"><label>${L_('ملاحظة للأستاذة','Message à la professeure')}</label>
          <textarea class="inp ta" id="pfNote" rows="2">${escH(m.note||'')}</textarea></div>
        <div class="flex gap3 mt5 wrap-f items-c">
          <button class="btn btn--p" data-save-profile>${svg('save','width="17" height="17"')}${t('save')}</button>
          <button class="btn btn--g" data-send-teacher>${svg('mail','width="17" height="17"')}${L_('إرسال إلى الأستاذة','Envoyer à la professeure')}</button>
          <span class="muted" style="font-size:.82rem;display:flex;align-items:center;gap:8px">
            ${svg('info','width="14" height="14"')}${L_('تقدّمك محفوظ على هذا الجهاز','Votre progression est enregistrée sur cet appareil')}</span>
        </div>
      </div>
      <div class="cd rv" style="--d:60ms">
        <div class="cd__h"><div><div class="cd__t">${L_('كيف يعمل حسابي؟','Comment fonctionne mon espace ?')}</div>
          <div class="cd__s">${L_('بلا حساب وبلا كلمة سر: اكتب معلوماتك، وتابع دروسك. الأستاذة ترى معلوماتك في لوحتها.','Sans compte ni mot de passe : remplissez vos informations et suivez vos cours. La professeure les reçoit dans son panneau.')}</div></div></div>
        <div class="flex gap3 wrap-f items-c">
          <span class="bd">${svg('user','width="12" height="12"')}${escH(m.ar||'')}</span>
          <span class="bd bd--lv ${lvCls(m.level)}">${escH(m.level||'')}</span>
          ${m.email?`<span class="bd la" dir="ltr">${escH(m.email)}</span>`:''}
        </div>
      </div>`;
}
/* حساب Google قديم (سابق) — يبقى كما كان */
function remoteInfoCards(m, g){
  return `
      <div class="cd rv">
        <div class="cd__h"><div><div class="cd__t">${L_('معلوماتي','Mes informations')}</div>
          <div class="cd__s">${L_('الاسم الظاهر يمكنك تعديله — الفوج والمؤسسة تُعدَّلان من طرف الأستاذة','Votre nom affiché est modifiable — le groupe et l’établissement sont gérés par la professeure')}</div></div></div>
        <div class="g g2" style="gap:16px">
          <div class="fld"><label>${L_('الاسم بالعربية','Nom (AR)')}</label><input class="inp" id="pfAr" value="${escH(m.ar)}"></div>
          <div class="fld"><label>${L_('Nom (FR)','الاسم بالفرنسية')}</label><input class="inp" id="pfFr" dir="ltr" value="${escH(m.fr)}"></div>
          <div class="fld"><label data-i18n="stuLevel">${t('stuLevel')}</label><input class="inp la" value="${escH(m.level)}" disabled></div>
          <div class="fld"><label data-i18n="stuGroup">${t('stuGroup')}</label><input class="inp" value="${escH(g.name||m.group||'')}" disabled></div>
          <div class="fld"><label data-i18n="stuSchool">${t('stuSchool')}</label><input class="inp" value="${escH(L_(g.schoolAr||m.school,g.schoolFr||m.school)||'')}" disabled></div>
          <div class="fld"><label data-i18n="stuParent">${t('stuParent')}</label><input class="inp" dir="ltr" value="${escH(m.parent||'')}" disabled></div>
        </div>
        <div class="flex gap3 mt5 wrap-f">
          <button class="btn btn--p" data-save-profile>${svg('save','width="17" height="17"')}${t('save')}</button>
          <span class="muted" style="font-size:.82rem;display:flex;align-items:center;gap:8px">
            ${svg('lock','width="14" height="14"')}${L_('الحقول المقفلة تُعدَّل من لوحة الإدارة','Les champs verrouillés se modifient depuis le panneau d’administration')}</span>
        </div>
      </div>
      <div class="cd rv" style="--d:60ms">
        <div class="cd__h"><div><div class="cd__t">${t('stuGoogle')}</div>
          <div class="cd__s">${L_('حساب قديم مرتبط بالمنصة','Ancien compte lié à la plateforme')}</div></div>
          <span class="bd ${m.linked?'bd--ok':'bd--wn'}">${m.linked?t('stuLinked'):t('stuNotLinked')}</span></div>
        <div class="flex gap3 wrap-f items-c">
          <span class="muted" style="font-size:.84rem">${L_('البريد المرتبط','Compte associé')} : <b class="la" dir="ltr">${escH(m.email||'—')}</b></span>
        </div>
      </div>`;
}
function profile(){
  const m=me(), sum=X.summarize(m), g=D.groupOf(m.group)||{};
  return head({crumb:crumb('index.html',t('sbDash'))+'<span>'+t('sbProfile')+'</span>',
    title:t('sbProfile'),
    sub:L_('معلوماتك، رتبتك، وتفضيلاتك','Vos informations, votre rang et vos préférences')}) + `
  <div class="g g-main adm-split adm-split--rev" style="--adm-side:340px">
    <div style="display:flex;flex-direction:column;gap:18px;min-width:0">
      <div class="cd rv" style="text-align:center">
        <span class="av av--lg" style="background:${m.color};width:92px;height:92px;border-radius:28px;font-size:1.7rem;margin-inline:auto">${ini(m.fr)}</span>
        <div class="cd__t mt4" style="font-size:1.1rem">${escH(L_(m.ar,m.fr)||'')}</div>
        <div class="cd__s la" dir="ltr">${escH(m.fr||'')}</div>
        <div class="flex gap2 mt4" style="justify-content:center;flex-wrap:wrap">
          <span class="bd bd--lv ${lvCls(m.level)}">${escH(m.level||'')}</span>
          <span class="bd">${svg('school','width="12" height="12"')}${escH(g.name||m.group||'')}</span>
          <span class="bd ${m.linked?'bd--ok':'bd--wn'}">${m.linked?t('stuLinked'):t('stuNotLinked')}</span>
        </div>
        <div class="cd cd--flat mt5" style="background:var(--bg2);padding:14px">
          <div class="flex items-c gap3" style="justify-content:center">
            <span class="ico ico--sm">${svg(sum.rank.icon)}</span>
            <b>${L_(sum.rank.ar,sum.rank.fr)}</b><span class="la muted" style="font-size:.82rem">${sum.xp.toLocaleString('fr-FR')} XP</span></div>
          <div class="prg mt4"><i data-w="${sum.rankProgress.pct}%" style="width:${sum.rankProgress.pct}%"></i></div>
        </div>
      </div>
      <div class="kpis cas kpis--2" style="gap:12px">
        ${[[t('streak'),sum.streak,'flame'],[t('k4'),sum.lessonsDone,'book'],
           [t('k5'),sum.exDone,'quiz'],[t('badges'),sum.badges.length,'trophy']]
          .map(([l,v,ic])=>`<div class="kpi rv"><div class="kpi__t"><span class="ico ico--sm">${svg(ic)}</span></div>
            <div class="kpi__n la" style="font-size:1.35rem">${v}</div><div class="kpi__l" style="font-size:.78rem">${l}</div></div>`).join('')}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:20px;min-width:0">
      ${m.local ? localInfoCards(m) : remoteInfoCards(m, g)}
      <div class="cd rv" style="--d:120ms">
        <div class="cd__h"><div><div class="cd__t">${L_('تفضيلاتي','Mes préférences')}</div></div></div>
        <div class="g g2" style="gap:16px">
          <div class="fld"><label>${L_('اللغة','Langue')}</label>
            <div class="seg" data-pref="lang"><button data-v="ar" class="${L==='ar'?'on':''}">العربية</button>
              <button data-v="fr" class="${L==='fr'?'on':''}">Français</button></div></div>
          <div class="fld"><label>${L_('السمة','Thème')}</label>
            <div class="seg" data-pref="theme"><button data-v="light" class="${document.documentElement.dataset.theme!=='dark'?'on':''}">${svg('sun','width="14" height="14"')}${L_('فاتح','Clair')}</button>
              <button data-v="dark" class="${document.documentElement.dataset.theme==='dark'?'on':''}">${svg('moon','width="14" height="14"')}${L_('داكن','Sombre')}</button></div></div>
        </div>
        ${[[L_('إظهار الأوسمة في ملفي','Afficher les badges sur mon profil'),true],
           [L_('تذكير يومي بالمراجعة','Rappel quotidien de révision'),true],
           [L_('إظهار ترتيبي في الفوج','Afficher mon classement dans le groupe'),false]]
          .map(([l,on])=>`<label class="flex items-c gap3" style="padding:12px 0;border-block-end:1px dashed var(--line);cursor:pointer">
            <span class="sw ${on?'on':''}"><i></i></span><span style="font-size:.88rem">${l}</span></label>`).join('')}
      </div>
      <div class="flex gap3 wrap-f">
        <a class="btn btn--g" href="../index.html">${svg('globe','width="17" height="17"')}${t('viewPublic')}</a>
        <a class="btn btn--g" href="../admin/index.html">${svg('set','width="17" height="17"')}${t('viewAdmin')}</a>
        <button class="btn btn--er" style="margin-inline-start:auto" data-logout>${svg('logout','width="17" height="17"')}${t('sbOut')}</button>
      </div>
    </div>
  </div>`;
}
/* إعادة رسم الصفحة بعد أي تعديل محلي */
function rerender(){
  const mn = $('#mn') || document.querySelector('.mn');
  if(!mn) return;
  if(window.PKlocal && window.PKlocal.active()) D.me = window.PKlocal.me();
  render(mn);
}
const fv = (id, host) => { const e = $('#'+id, host); return e ? String(e.value||'').trim() : ''; };

function bindProfile(host){
  const m = me() || {};
  const sv = $('[data-save-profile]',host);
  if(sv) sv.addEventListener('click', async ()=>{
    /* ── تلميذ بلا حساب: كل شيء يُحفظ على جهازه، بلا إنترنت وبلا انتظار ── */
    if(m.local && window.PKlocal){
      const patch = {
        name: fv('pfName',host) || m.ar || '',
        level: fv('pfLevel',host) || m.level || '',
        birth: fv('pfBirth',host),
        parentPhone: fv('pfPhone',host),
        email: fv('pfMail',host),
        school: fv('pfSchool',host),
        note: fv('pfNote',host)
      };
      const errs = window.PKlocal._validate(patch);
      if(errs.length){ toast(errs.map(k=>t(k)).join(' · '),'er',4600); return; }
      window.PKlocal.update(patch);
      toast(L_('حُفظت معلوماتك ✓','Informations enregistrées ✓'),'ok',2600);
      rerender();
      return;
    }
    /* ── حساب قديم (Google) ── */
    const a=$('#pfAr',host), b=$('#pfFr',host);
    const val=((b&&b.value.trim()) || (a&&a.value.trim()) || m.fr || m.ar || '');
    if(!val){ toast(L_('اكتب اسمك أولاً','Saisissez votre nom'),'wn',2600); return; }
    sv.disabled = true;
    const r = await window.PKdb.saveMyProfile({name:val});
    sv.disabled = false;
    if(r && r.ok) toast(L_('حُفظ ملفك ✓','Profil enregistré ✓'),'ok',2600);
    else toast((r && r.msg) || L_('تعذّر الحفظ','Enregistrement impossible'),'er',4200);
  });
  /* إرسال (أو إعادة إرسال) المعلومات إلى الأستاذة */
  const sd = $('[data-send-teacher]',host);
  if(sd) sd.addEventListener('click', async ()=>{
    if(sd.dataset.busy) return;
    sd.dataset.busy='1'; sd.disabled = true;
    const p = window.PKlocal.profile() || {};
    try{
      await window.PKdb.addRegistration(p);
      window.PKlocal.markSent(new Date().toISOString());
      toast(L_('أُرسلت معلوماتك إلى الأستاذة ✓','Informations envoyées à la professeure ✓'),'ok',3200);
      rerender();
    }catch(err){
      toast((window.PK && window.PK.err) ? window.PK.err(err) : L_('تعذّر الإرسال','Envoi impossible'),'er',5200);
    }finally{ sd.disabled = false; delete sd.dataset.busy; }
  });
  const gg=$('[data-google]',host); if(gg) gg.addEventListener('click',()=>{
    window.PKdb.loginGoogle().then(()=>toast(L_('تم الدخول بحساب Google ✓','Connexion Google réussie ✓'),'ok',2600))
      .catch(err=>toast((err&&(err.friendly||err.message))||L_('تعذّر الدخول','Connexion impossible'),'er',5200));});
  const lo=$('[data-logout]',host); if(lo) lo.addEventListener('click',()=>{
    if(m.local && window.PKlocal){
      if(window.confirm(t('regClearQ'))){
        window.PKlocal.clear();
        toast(L_('إلى اللقاء 👋','À bientôt 👋'),'info',1800);
        setTimeout(()=>location.href='../index.html',700);
      }
      return;
    }
    window.PKdb.logout(); toast(L_('إلى اللقاء 👋','À bientôt 👋'),'info',2200); setTimeout(()=>location.href='../index.html',900);});
  $$('[data-pref] button',host).forEach(b=> b.addEventListener('click',()=>{
    $$('[data-pref="'+b.closest('[data-pref]').dataset.pref+'"] button',host).forEach(x=>x.classList.toggle('on',x===b));
    const kind=b.closest('[data-pref]').dataset.pref;
    if(kind==='lang') window.PK.setLang(b.dataset.v);
    else { document.documentElement.dataset.theme=b.dataset.v; window.PK.applyTheme(b.dataset.v); }
  }));
  $$('.sw',host).forEach(sw=> sw.addEventListener('click',()=>sw.classList.toggle('on')));
}

/* ══════════════════ AMORÇAGE ══════════════════ */
const PAGES={
  'student-lessons':      {nav:'lessons.html',      fn:lessons,        bind:bindLessons},
  'student-lesson':       {nav:'lessons.html',      fn:lessonPage,     bind:bindLesson},
  'student-exercises':    {nav:'exercises.html',    fn:exercises,      bind:bindExercises},
  'student-progress':     {nav:'progress.html',     fn:progressPage,   bind:bindProgress},
  'student-timetable':    {nav:'timetable.html',    fn:studentTimetable, bind:bindTimetable},
  'student-announcements':{nav:'announcements.html',fn:announcements,  bind:bindAnnouncements},
  'student-profile':      {nav:'profile.html',      fn:profile,        bind:bindProfile}
};
function render(mn){
  L = window.PKi18n.current();
  const page = document.documentElement.dataset.page || 'student-lessons';
  const cfg = PAGES[page] || PAGES['student-lessons'];
  const gt = window.PKapp.PKgate.html();
  if(gt){ mn.innerHTML = gt; window.PKapp.PKgate.bind(mn, ()=>render(mn)); return; }
  mn.innerHTML = cfg.fn();
  if(cfg.bind) cfg.bind(mn);
  // chrome de la barre de titre
  $$('.lgsw button',mn).forEach(b=> b.classList.toggle('on', b.dataset.lang===L));
  const tb=$('[data-theme-btn]',mn);
  if(tb) tb.innerHTML = svg(document.documentElement.dataset.theme==='dark'?'sun':'moon');
  const sb=$('[data-search]',mn);
  if(sb) sb.addEventListener('click',()=>window.PK.openPalette());
  initReveal(mn); initProgress(mn); replayFx(mn);
}
const page = document.documentElement.dataset.page || 'student-lessons';
const cfg = PAGES[page] || PAGES['student-lessons'];
window.PKapp.bootApp('student', cfg.nav, {top:false}, render);
})();
