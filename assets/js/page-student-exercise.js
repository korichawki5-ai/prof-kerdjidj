/* ══════════════════════════════════════════════════════════════════
   page-student-exercise.js · Moteur d'exercice interactif
   ─────────────────────────────────────────────────────────────────
   Correction immédiate + explication + calcul réel des XP
   (window.PKxp.computeXP) → aucune note scolaire, uniquement de la
   progression : XP, précision, maîtrise de l'axe, badges.
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";
const {$, $$, svg, t, toast, confetti, replayFx} = window.PK;
const D = window.PKdata, X = window.PKxp;
let L='ar'; const ar=()=>L==='ar'; const L_=(a,f)=>ar()?a:f;

const AXFR={grammaire:'Grammaire',conjugaison:'Conjugaison',orthographe:'Orthographe',vocabulaire:'Vocabulaire',
  comprehension:'Compréhension',expression:'Expression écrite',methodologie:'Méthodologie BEM',sujets:'Sujets corrigés'};

/* ───────── ÉTAT DE LA SESSION ───────── */
let EX = null, qi = 0, answers = [], locked = false, t0 = 0, timerId = null, timeLeft = 0, finished = false;

function getExercise(){
  const id = new URLSearchParams(location.search).get('id');
  return D.exercises.find(e=>e.id===id) || D.exercises[0];
}

/* ══════════ ÉCRAN 1 : BRIEFING ══════════ */
function renderBrief(mn){
  const gt = window.PKapp.PKgate.html();
  if(gt){ mn.innerHTML = gt; window.PKapp.PKgate.bind(mn, ()=>renderBrief(mn)); return; }
  if(!D.exercises.length){ mn.innerHTML = `<div class="empty"><div class="ico">${svg('quiz')}</div><b>${t('noExercises')}</b></div>`; syncTop(mn); return; }
  EX = getExercise();
  const lv = D.byId(D.levels, EX.level), ax = D.axes.find(a=>a.id===EX.ax)||{fr:EX.ax,ar:EX.ax};
  mn.innerHTML = `
  <div class="mn__t">
    <div>
      <div class="crumb"><a href="index.html">${t('sbDash')}</a>${svg('chev')}<a href="exercises.html">${t('sbEx')}</a>${svg('chev')}<span>${EX.id}</span></div>
      <h1 style="font-size:clamp(1.3rem,2.6vw,1.85rem)">${L_(EX.titleAr,EX.titleFr)}</h1>
      <p>${L_(EX.descAr,EX.descFr)}</p>
    </div>
    <div class="mn__a">
      <div class="lgsw"><button data-lang="ar">AR</button><button data-lang="fr">FR</button></div>
      <button class="btn btn--g btn--i" data-theme-btn>${svg('moon')}</button>
      <a href="exercises.html" class="btn btn--g btn--sm">${svg('arrow','width="16" height="16"')}${t('back')}</a>
    </div>
  </div>

  <div class="g g-main" style="align-items:start">
    <div class="qz rv">
      <div class="qz__hd">
        <div class="qz__meta">
          <span class="bd bd--wt la">${EX.level}</span>
          <span class="bd bd--wt">${L_(ax.ar,ax.fr)}</span>
          <span class="bd bd--wt">${t('ty'+EX.type.charAt(0).toUpperCase()+EX.type.slice(1))}</span>
          <span class="bd bd--wt"><span class="diff diff--${EX.diff}"><i class="on"></i><i class="${EX.diff>=2?'on':''}"></i><i class="${EX.diff>=3?'on':''}"></i></span> ${t('diff'+EX.diff)}</span>
        </div>
        <h2>${L_(EX.titleAr,EX.titleFr)}</h2>
        <p>${L_(EX.descAr,EX.descFr)}</p>
      </div>
      <div class="qz__b">
        <div class="g g3 mb5" style="gap:14px">
          <div class="cd cd--flat" style="background:var(--bg2);padding:18px;text-align:center">
            <div class="la" style="font-size:1.6rem;font-weight:800;color:var(--ac)">${EX.questions.length}</div>
            <div class="muted" style="font-size:.82rem">${t('exQ')}</div></div>
          <div class="cd cd--flat" style="background:var(--bg2);padding:18px;text-align:center">
            <div class="la" style="font-size:1.6rem;font-weight:800">${EX.min}<small style="font-size:.9rem"> min</small></div>
            <div class="muted" style="font-size:.82rem">${t('exTime')}</div></div>
          <div class="cd cd--flat" style="background:var(--bg2);padding:18px;text-align:center">
            <div class="la" style="font-size:1.6rem;font-weight:800;color:var(--wn)">≤ ${EX.xpMax}</div>
            <div class="muted" style="font-size:.82rem">XP</div></div>
        </div>
        <div class="cd cd--flat" style="background:var(--ac-tint);border-color:var(--ac-tint2);padding:18px">
          <div class="flex gap3 items-c">
            <span class="ico ico--sm">${svg('info')}</span>
            <p style="font-size:.9rem;line-height:1.8">${t('qbNote')}</p>
          </div>
        </div>
        <ul class="mt5 g gap3" style="font-size:.92rem">
          <li class="flex gap3 items-c">${svg('checkc','width="18" height="18" style="color:var(--ok)"')}<span>${L_('تصحيح فوري مع شرح كل إجابة','Correction immédiate avec explication de chaque réponse')}</span></li>
          <li class="flex gap3 items-c">${svg('bolt','width="18" height="18" style="color:var(--ac)"')}<span>${L_('XP حسب الصعوبة والسرعة والدقّة','XP selon la difficulté, la vitesse et la précision')}</span></li>
          <li class="flex gap3 items-c">${svg('flame','width="18" height="18" style="color:var(--wn)"')}<span>${L_('مضاعف السلسلة مفعّل: ×','Multiplicateur de série actif : ×')+X.streakMult(D.me.streak).toFixed(2)}</span></li>
          <li class="flex gap3 items-c">${svg('refresh','width="18" height="18" style="color:var(--pu)"')}<span>${L_('محاولات متاحة: ','Tentatives disponibles : ')+EX.tries}</span></li>
        </ul>
      </div>
      <div class="qz__ft">
        <span class="muted" style="font-size:.85rem">${svg('user','width="15" height="15" style="display:inline;vertical-align:-2px"')} ${L_(D.me.ar,D.me.fr)} · ${EX.level}</span>
        <button class="btn btn--p btn--lg" id="btnStart">${svg('play','width="19" height="19"')}${t('exStart')}</button>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:18px">
      <div class="cd rv" style="--d:80ms">
        <div class="cd__t mb4" style="font-size:.98rem">${t('sbProg')}</div>
        <div class="flex items-c gap4 mb4">
          <span class="ico ico--sm">${svg(X.rankOf(D.me.xp).icon)}</span>
          <div><b>${L_(X.rankOf(D.me.xp).ar,X.rankOf(D.me.xp).fr)}</b>
            <div class="muted la" style="font-size:.8rem">${D.me.xp.toLocaleString('fr-FR')} XP</div></div>
        </div>
        <div class="prg"><i data-w="${X.rankProgress(D.me.xp).pct}%" style="width:${X.rankProgress(D.me.xp).pct}%"></i></div>
        <div class="flex just-b mt3" style="font-size:.8rem"><span class="muted">${t('streak')}</span>
          <b class="la" style="color:var(--wn)">${svg('flame','width="13" height="13" fill="currentColor" stroke="none" style="display:inline;vertical-align:-2px"')} ${D.me.streak}</b></div>
      </div>
      <div class="cd rv" style="--d:140ms">
        <div class="cd__t mb4" style="font-size:.98rem">${t('myProg')}</div>
        <div class="g gap4">
          ${Object.entries(D.me.mastery).slice(0,4).map(([k,v])=>`
            <div><div class="flex just-b" style="font-size:.82rem;margin-block-end:5px">
              <b class="la">${AXFR[k]||k}</b><span class="muted la">${v}%</span></div>
              <div class="prg prg--sm ${v>=85?'prg--ok':v>=40?'':'prg--er'}"><i data-w="${v}%" style="width:${v}%"></i></div></div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
  $('#btnStart').addEventListener('click', ()=> startQuiz(mn));
  syncTop(mn);
  replayFx(mn);
}

/* ══════════ ÉCRAN 2 : QUESTIONS ══════════ */
function startQuiz(mn){
  qi = 0; answers = []; locked = false; finished = false;
  timeLeft = EX.min * 60; t0 = Date.now();
  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
  renderQuestion(mn);
}
function tick(){
  timeLeft--;
  const el = $('#qTimer');
  if(el){
    const m = String(Math.floor(Math.max(0,timeLeft)/60)).padStart(2,'0');
    const s = String(Math.max(0,timeLeft)%60).padStart(2,'0');
    el.innerHTML = svg('timer','width="17" height="17"')+`<span class="la">${m}:${s}</span>`;
    el.classList.toggle('warn', timeLeft <= 60);
  }
  if(timeLeft <= 0) finish($('#mn'));
}
function renderQuestion(mn){
  const q = EX.questions[qi];
  const total = EX.questions.length;
  locked = false;
  const opts = q.tf !== undefined
    ? [[0,L_('صحيح','Vrai')],[1,L_('خطأ','Faux')]]
    : (Array.isArray(q.o) ? q.o.map((o,i)=>[i,o]) : null);
  const correctIdx = q.tf !== undefined ? (q.tf?0:1) : q.a;

  mn.innerHTML = `
  <div class="qz rv" style="max-width:900px;margin-inline:auto">
    <div class="qz__bar">
      <span class="bd bd--lv lv-4am">${EX.level}</span>
      <span class="bd bd--gy la">${t('exQuestion')} ${qi+1}/${total}</span>
      <div class="qz__pr">
        <div class="prg prg--sm"><i style="width:${(qi)/total*100}%;transition:width .4s"></i></div>
        <div class="qdots mt3">${EX.questions.map((_,i)=>`<i class="${i<qi?(answers[i]?'ok':'no'):''}${i===qi?' cur':''}"></i>`).join('')}</div>
      </div>
      <span class="qz__tm" id="qTimer">${svg('timer','width="17" height="17"')}<span class="la">${String(Math.floor(timeLeft/60)).padStart(2,'0')}:${String(timeLeft%60).padStart(2,'0')}</span></span>
    </div>
    <div class="qz__b">
      <div class="qn">
        <div class="qn__h">
          <span class="qn__n la">${qi+1}</span>
          <div>
            <div class="qn__t" dir="ltr" style="text-align:start">${q.t}</div>
            <div class="flex gap2 mt3 wrap-f">
              <span class="qtype qtype--${q.tf!==undefined?'tf':'mcq'}">${q.tf!==undefined?t('tyTf'):t('tyMcq')}</span>
              <span class="diff diff--${q.d||1}"><i class="on"></i><i class="${(q.d||1)>=2?'on':''}"></i><i class="${(q.d||1)>=3?'on':''}"></i></span>
              <span class="bd bd--gy la">+${Math.round(X.CFG.xpBase*(X.CFG.multDiff[q.d||1]||1))} XP</span>
            </div>
          </div>
        </div>
        ${opts
          ? `<div class="qn__x" ${opts.length<=2?'':''}>
               ${opts.map(([i,label])=>`<button class="qo" data-i="${i}"><i>${'ABCD'[i]}</i><span dir="ltr">${label}</span></button>`).join('')}
             </div>`
          : `<div class="fld"><label>${L_('اكتب الإجابة','Écrivez la réponse')}</label>
               <input class="inp" id="fillIn" dir="ltr" autocomplete="off" spellcheck="false" placeholder="…">
               <button class="btn btn--p mt3" id="fillBtn">${svg('check','width="17" height="17"')}${t('submit')}</button>
             </div>`}
        <div id="qFb"></div>
      </div>
    </div>
    <div class="qz__ft">
      <span class="muted" style="font-size:.85rem">${svg('bolt','width="15" height="15" style="display:inline;vertical-align:-2px;color:var(--ac)"')}
        <span class="la" id="qXp">0</span> XP · ${svg('check','width="15" height="15" style="display:inline;vertical-align:-2px;color:var(--ok)"')}
        <span class="la" id="qOk">0</span>/${total}</span>
      <button class="btn btn--p" id="qNext" disabled>${qi+1<total?t('exNext'):t('exFinish')}${svg('arrow','width="17" height="17"')}</button>
    </div>
  </div>`;

  const pick = (idx)=>{
    if(locked) return; locked = true;
    const ok = idx === correctIdx;
    $$('.qo').forEach((b,j)=>{
      b.classList.add('dis');
      if(j===correctIdx) b.classList.add('ok');
      else if(j===idx) b.classList.add('no');
    });
    feedback(ok, q);
  };
  $$('.qo').forEach(b=> b.addEventListener('click', ()=> pick(+b.dataset.i)));
  const fi = $('#fillIn');
  if(fi){
    fi.focus();
    const submit = ()=>{
      if(locked) return;
      const v = (fi.value||'').trim().toLowerCase();
      const ok = v === String(q.a).trim().toLowerCase();
      locked = true; fi.disabled = true; $('#fillBtn').disabled = true;
      fi.style.borderColor = ok ? 'var(--ok)' : 'var(--er)';
      if(!ok) fi.insertAdjacentHTML('afterend',
        `<div class="help la" style="color:var(--ok);margin-block-start:6px">${L_('الإجابة الصحيحة','Réponse correcte')} : <b>${q.a}</b></div>`);
      feedback(ok, q);
    };
    $('#fillBtn').addEventListener('click', submit);
    fi.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); submit(); } });
  }
  $('#qNext').addEventListener('click', ()=>{
    if(qi+1 < EX.questions.length){ qi++; renderQuestion(mn); }
    else finish(mn);
  });
  updateCounters();
}
function feedback(ok, q){
  const r = X.computeXP({correct: ok?1:0, total:1, diff:q.d||1, streak:D.me.streak, isQuiz:false, todayXp:0});
  answers[qi] = ok;
  const fb = $('#qFb');
  fb.innerHTML = `<div class="expl ${ok?'':'expl--no'}">
      <b>${svg(ok?'checkc':'x','width="16" height="16"')}${ok?t('exCorrect'):t('exWrong')}
        ${ok?`· <span class="la">+${r.xp} XP</span>`:''}</b>
      <div>${L_(q.eAr,q.eFr)}</div>
    </div>`;
  fb.firstChild.classList.add('anim-fu');
  $('#qNext').disabled = false;
  updateCounters();
  if(ok){
    const xpEl = $('#qXp');
    xpEl.textContent = (+xpEl.textContent) + r.xp;
    xpEl.animate?.([{transform:'scale(1.4)',color:'#0FA97C'},{transform:'scale(1)'}],{duration:420,easing:'ease-out'});
  }
}
function updateCounters(){
  const ok = answers.filter(Boolean).length;
  const e = $('#qOk'); if(e) e.textContent = ok;
}

/* ══════════ ÉCRAN 3 : RÉSULTAT ══════════ */
function finish(mn){
  if(finished) return; finished = true;
  clearInterval(timerId);
  const total = EX.questions.length;
  const correct = answers.filter(Boolean).length;
  const pct = Math.round(correct/total*100);
  const used = Math.round((Date.now()-t0)/1000);
  const r = X.computeXP({correct, total, diff:EX.diff, streak:D.me.streak,
                         timeUsed:used, timeLimit:EX.min*60, isQuiz:true, todayXp:0});
  const dash = Math.round(502 * pct/100);
  const msg = pct>=90 ? t('exPerfect') : pct>=60 ? t('exGood') : t('exKeep');
  const col = pct>=80?'var(--ok)':pct>=50?'var(--wn)':'var(--er)';

  // progression de maîtrise simulée pour la démo
  const before = D.me.mastery[EX.ax] || 0;
  const after  = Math.min(100, Math.round(before + (pct-before)*0.12));

  mn.innerHTML = `
  <div class="qz rv-s" style="max-width:820px;margin-inline:auto">
    <div class="res">
      <span class="bd mb4">${svg('checkc','width="12" height="12"')}${L_('تمرين تدريبي — لا يحتسب كنقطة مدرسية','Exercice d’entraînement — aucune note scolaire')}</span>
      <div class="res__rg" style="--dash:${dash}">
        <svg viewBox="0 0 180 180"><circle class="bg" cx="90" cy="90" r="80"/>
          <circle class="fg" cx="90" cy="90" r="80" style="stroke:${col}"/></svg>
        <div class="res__n" style="color:${col}">${pct}<small>%</small></div>
      </div>
      <h2 style="margin-block-end:10px">${msg}</h2>
      <div class="res__xp">${svg('bolt','width="22" height="22" fill="currentColor" stroke="none"')}<span class="la">+${r.xp}</span> XP</div>

      <div class="res__st">
        <div><b class="la" style="color:var(--ok)">${correct}</b><small>${t('exCorrect')}</small></div>
        <div><b class="la" style="color:var(--er)">${total-correct}</b><small>${t('exWrong')}</small></div>
        <div><b class="la">${Math.floor(used/60)}:${String(used%60).padStart(2,'0')}</b><small>${t('exTimeUsed')}</small></div>
        <div><b class="la" style="color:var(--wn)">×${r.mult.toFixed(2)}</b><small>${t('streakMult')||'مضاعف'}</small></div>
      </div>

      <div class="cd cd--flat mt6" style="background:var(--bg2);text-align:start">
        <div class="cd__t mb4" style="font-size:.95rem">${t('exGain')}</div>
        ${r.detail.map(d=>`<div class="flex just-b" style="font-size:.88rem;padding:7px 0;border-block-end:1px dashed var(--line)">
            <span class="muted">${L_(d.ar,d.fr)}</span>
            <b class="la" style="color:${d.xp>=0?'var(--ok)':'var(--er)'}">${d.xp>=0?'+':''}${d.xp} XP</b>
          </div>`).join('')}
        <div class="flex just-b" style="font-size:.95rem;padding-block-start:12px">
          <b>${t('xpEarned')}</b><b class="la" style="color:var(--ac)">+${r.xp} XP</b></div>
        <div class="mt4">
          <div class="flex just-b" style="font-size:.85rem;margin-block-end:6px">
            <span class="muted">${AXFR[EX.ax]||EX.ax} — ${t('mastery')}</span>
            <b class="la">${before}% → <span style="color:var(--ok)">${after}%</span></b></div>
          <div class="prg"><i data-w="${after}%" style="width:${before}%;background:linear-gradient(90deg,var(--ac),var(--ok))"></i></div>
        </div>
      </div>

      <div class="flex gap3 mt6 wrap-f" style="justify-content:center">
        <button class="btn btn--g" id="btnReview">${svg('eye','width="17" height="17"')}${t('exReview')}</button>
        <button class="btn btn--s" id="btnRetry">${svg('refresh','width="17" height="17"')}${t('retry')}</button>
        <a class="btn btn--p" href="index.html">${svg('grid','width="17" height="17"')}${t('sbDash')}</a>
      </div>
    </div>
  </div>

  <div class="cd mt5 rv" style="max-width:820px;margin-inline:auto" id="reviewBox"></div>`;

  // enregistre (démo : console + Firestore si configuré)
  window.PKdb.saveSubmission({
    exerciseId:EX.id, studentId:D.me.id, level:EX.level, ax:EX.ax,
    correct, total, pct, xp:r.xp, durationSec:used, attempts:1,
    answers: EX.questions.map((q,i)=>({q:i, given:answers[i], ok:!!answers[i]}))
  });
  if(pct>=80) confetti(pct>=95?110:70);
  toast(`${t('exGain')} : +${r.xp} XP · ${pct}%`, pct>=80?'ok':'wn', 4200);

  $('#btnRetry').addEventListener('click', ()=>{ EX=getExercise(); startQuiz(mn); });
  $('#btnReview').addEventListener('click', ()=> renderReview());
  replayFx(mn);
  setTimeout(()=>{ const p=$('.res__st .prg i, .cd .prg i'); },50);
}
function renderReview(){
  const box = $('#reviewBox'); if(!box) return;
  box.innerHTML = `<div class="cd__h cd__h--b"><div class="cd__t">${t('exReview')}</div>
      <span class="bd bd--gy la">${EX.questions.length} ${t('exQ')}</span></div>
    ${EX.questions.map((q,i)=>{
      const ok = answers[i];
      const opts = q.tf!==undefined ? [[0,L_('صحيح','Vrai')],[1,L_('خطأ','Faux')]] : (q.o?q.o.map((o,j)=>[j,o]):null);
      const ci = q.tf!==undefined ? (q.tf?0:1) : q.a;
      return `<div class="qn">
        <div class="qn__h">
          <span class="qn__n la" style="background:${ok?'var(--ok-t)':'var(--er-t)'};color:${ok?'var(--ok)':'var(--er)'}">${i+1}</span>
          <div><div class="qn__t" dir="ltr" style="text-align:start">${q.t}</div>
            <span class="bd ${ok?'bd--ok':'bd--er'} mt3">${svg(ok?'check':'x','width="12" height="12"')}${ok?t('exCorrect'):t('exWrong')}</span></div>
        </div>
        ${opts?`<div class="qn__x">${opts.map(([j,lb])=>`<div class="qo dis ${j===ci?'ok':''}" style="cursor:default"><i>${'ABCD'[j]}</i><span dir="ltr">${lb}</span></div>`).join('')}</div>`
              :`<div class="bd bd--ok la">${L_('الإجابة','Réponse')} : <b>${q.a}</b></div>`}
        <div class="expl ${ok?'':'expl--no'}"><b>${svg('info','width="16" height="16"')}${t('expl')}</b><div>${L_(q.eAr,q.eFr)}</div></div>
      </div>`;}).join('')}`;
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ── synchronise AR/FR + thème ── */
function syncTop(mn){
  $$('.lgsw button', mn).forEach(b=> b.classList.toggle('on', b.dataset.lang===L));
  const tb = $('[data-theme-btn]', mn);
  if(tb) tb.innerHTML = svg(document.documentElement.dataset.theme==='dark'?'sun':'moon');
}

/* ── amorçage ── */
window.PKapp.bootApp('student','exercises.html',{top:false}, (mn)=>{
  L = window.PKi18n.current();
  renderBrief(mn);
});
})();
