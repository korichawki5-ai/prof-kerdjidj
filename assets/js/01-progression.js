/* ══════════════════════════════════════════════════════════════════
   01-progression.js · SYSTÈME DE PROGRESSION
   ⚡ XP · Rangs · Séries (Streak) · Maîtrise par axe · Badges
   ⚠️  AUCUNE note scolaire : la plateforme n'est pas liée à l'école.
       Tout ici est de l'entraînement et de la motivation.
   ══════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";

  /* ───────── 1. PARAMÈTRES (modifiables depuis admin/settings) ───────── */
  const CFG = {
    xpBase      : 10,                 // XP de base par bonne réponse
    xpPerLesson : 25,                 // XP pour la complétion d'un cours
    xpDaily     : 15,                 // bonus de première activité du jour
    multDiff    : {1:1, 2:1.6, 3:2.4},// multiplicateur selon difficulté
    multStreak  : [[0,1],[3,1.15],[7,1.3],[14,1.5],[30,1.8],[60,2.0]],
    bonusPerfect: 50,                 // bonus quiz à 100 %
    bonusSpeed  : 20,                 // bonus si < 60 % du temps imparti
    penalMiss   : 0,                  // jamais de XP négatif : on encourage
    capDaily    : 600                 // plafond quotidien (anti-abus)
  };

  /* ───────── 2. RANGS ───────── */
  const RANKS = [
    {id:1, ar:"مبتدئ",   fr:"Débutant",  min:0,     icon:"seedling"},
    {id:2, ar:"متمرّن",  fr:"Initié",    min:500,   icon:"leaf"},
    {id:3, ar:"متمكّن",  fr:"Confirmé",  min:1500,  icon:"flame"},
    {id:4, ar:"متقدّم",  fr:"Avancé",    min:3500,  icon:"bolt"},
    {id:5, ar:"خبير",    fr:"Expert",    min:7000,  icon:"star"},
    {id:6, ar:"أستاذ",   fr:"Maître",    min:12000, icon:"crown"}
  ];
  function rankOf(xp){
    let r = RANKS[0];
    for(const k of RANKS) if(xp >= k.min) r = k;
    return r;
  }
  function rankProgress(xp){
    const cur = rankOf(xp);
    const i = RANKS.indexOf(cur);
    const next = RANKS[i+1] || null;
    if(!next) return {cur, next:null, pct:100, need:0, floor:cur.min, ceil:cur.min};
    const span = next.min - cur.min;
    const done = xp - cur.min;
    return {cur, next, pct: Math.min(100, Math.round(done/span*100)), need: next.min - xp, floor:cur.min, ceil:next.min};
  }
  function rankLabel(xp, lang){ const r = rankOf(xp); return lang === 'fr' ? r.fr : r.ar; }

  /* ───────── 3. NIVEAUX DE MAÎTRISE PAR AXE ───────── */
  const MASTERY = [
    {min:0,  ar:"لم يبدأ", fr:"Non commencé", cls:""},
    {min:20, ar:"مبتدئ",   fr:"Débutant",     cls:"er"},
    {min:40, ar:"في تقدّم",fr:"En progrès",   cls:"wn"},
    {min:65, ar:"متمكّن",  fr:"Confirmé",     cls:""},
    {min:85, ar:"متقن",    fr:"Maîtrisé",     cls:"ok"},
    {min:95, ar:"خبير",    fr:"Expert",       cls:"ok"}
  ];
  function masteryLabel(pct, lang){
    let m = MASTERY[0];
    for(const k of MASTERY) if(pct >= k.min) m = k;
    return {text: lang === 'fr' ? m.fr : m.ar, cls:m.cls};
  }

  /* ───────── 4. CALCUL DES XP ───────── */
  /**
   * @param {Object} o
   *  o.correct   {number} bonnes réponses
   *  o.total     {number} questions
   *  o.diff      {1|2|3} difficulté dominante
   *  o.streak    {number} jours consécutifs actuels
   *  o.timeUsed  {number} secondes
   *  o.timeLimit {number} secondes accordées
   *  o.isQuiz    {boolean} quiz complet (déclenche les bonus)
   *  o.todayXp   {number} XP déjà gagnés aujourd'hui (plafond)
   */
  function computeXP(o){
    const correct   = +o.correct || 0;
    const total     = Math.max(1, +o.total || 1);
    const diff      = +o.diff || 1;
    const streak    = +o.streak || 0;
    const accuracy  = correct / total;

    let mult = CFG.multDiff[diff] || 1;
    for(const [d,m] of CFG.multStreak) if(streak >= d) mult *= m;

    let base   = correct * CFG.xpBase * mult;
    let detail = [{ar:"إجابات صحيحة", fr:"Bonnes réponses", xp: Math.round(correct * CFG.xpBase)}];

    if(o.isQuiz){
      if(accuracy >= 1){ base += CFG.bonusPerfect; detail.push({ar:"مكافأة الإكمال بلا خطأ", fr:"Bonus sans faute", xp:CFG.bonusPerfect}); }
      else if(accuracy >= .8){ const b = 25; base += b; detail.push({ar:"مكافأة الدقّة العالية", fr:"Bonus de précision", xp:b}); }
      if(o.timeLimit && o.timeUsed && o.timeUsed < o.timeLimit * .6){
        base += CFG.bonusSpeed; detail.push({ar:"مكافأة السرعة", fr:"Bonus de rapidité", xp:CFG.bonusSpeed});
      }
    }
    if(streak >= 3){
      const sm = CFG.multStreak.filter(x => streak >= x[0]).pop();
      if(sm && sm[1] > 1){
        const extra = Math.round(correct * CFG.xpBase * (sm[1]-1));
        detail.push({ar:"مضاعف السلسلة (×"+sm[1]+")", fr:"Multiplicateur de série (×"+sm[1]+")", xp:extra});
      }
    }

    let xp = Math.max(0, Math.round(base));
    // plafond quotidien
    const todayXp = +o.todayXp || 0;
    if(todayXp + xp > CFG.capDaily){
      const capped = Math.max(0, CFG.capDaily - todayXp);
      if(capped < xp) detail.push({ar:"تم بلوغ السقف اليومي", fr:"Plafond quotidien atteint", xp: -(xp - capped)});
      xp = capped;
    }
    return {xp, accuracy, detail, mult:+mult.toFixed(2), capped: xp === 0 && todayXp >= CFG.capDaily};
  }

  /* ───────── 5. SÉRIE (STREAK) ───────── */
  function dayKey(d){ const x = d || new Date(); return x.toISOString().slice(0,10); }
  function updateStreak(log){
    // log : tableau de "YYYY-MM-DD" où l'élève a été actif
    const set = new Set(log || []);
    const today = dayKey();
    const yest  = dayKey(new Date(Date.now() - 864e5));
    if(!set.has(today) && !set.has(yest)) return {current:0, best:bestOf(log), frozen:true};
    let n = 0, d = new Date(set.has(today) ? Date.now() : Date.now() - 864e5);
    while(set.has(dayKey(d))){ n++; d = new Date(d.getTime() - 864e5); }
    return {current:n, best: Math.max(n, bestOf(log)), frozen:false};
  }
  function bestOf(log){
    if(!log || !log.length) return 0;
    const s = [...new Set(log)].sort();
    let best = 1, run = 1;
    for(let i=1;i<s.length;i++){
      const a = new Date(s[i-1]), b = new Date(s[i]);
      if((b - a) === 864e5){ run++; best = Math.max(best, run); } else run = 1;
    }
    return best;
  }
  function streakMult(n){ let m = 1; for(const [d,x] of CFG.multStreak) if(n >= d) m = x; return m; }

  /* ───────── 6. BADGES ───────── */
  const BADGES = [
    {id:"first_lesson", icon:"book",      style:"",       i18n:"bd1",  goal:s=>1,            prog:s=>Math.min(1,s.lessonsDone||0)},
    {id:"ex_10",        icon:"target",    style:"",       i18n:"bd2",  goal:s=>10,           prog:s=>s.exDone||0},
    {id:"ex_50",        icon:"layers",    style:"purple", i18n:"bd3",  goal:s=>50,           prog:s=>s.exDone||0},
    {id:"perfect",      icon:"check",     style:"green",  i18n:"bd4",  goal:s=>1,            prog:s=>s.perfectCount||0},
    {id:"streak_7",     icon:"flame",     style:"gold",   i18n:"bd5",  goal:s=>7,            prog:s=>s.bestStreak||0},
    {id:"streak_30",    icon:"flame",     style:"red",    i18n:"bd6",  goal:s=>30,           prog:s=>s.bestStreak||0},
    {id:"gram_90",      icon:"abc",       style:"green",  i18n:"bd7",  goal:s=>90,           prog:s=>(s.mastery&&s.mastery.grammaire)||0},
    {id:"conj_90",      icon:"clock",     style:"purple", i18n:"bd8",  goal:s=>90,           prog:s=>(s.mastery&&s.mastery.conjugaison)||0},
    {id:"xp_1000",      icon:"bolt",      style:"",       i18n:"bd9",  goal:s=>1000,         prog:s=>s.xp||0},
    {id:"xp_5000",      icon:"bolt",      style:"gold",   i18n:"bd10", goal:s=>5000,         prog:s=>s.xp||0},
    {id:"lessons_20",   icon:"book",      style:"",       i18n:"bd11", goal:s=>20,           prog:s=>s.lessonsDone||0},
    {id:"comeback",     icon:"refresh",   style:"",       i18n:"bd12", goal:s=>1,            prog:s=>s.comebackCount||0},
    {id:"fast",         icon:"timer",     style:"purple", i18n:"bd13", goal:s=>1,            prog:s=>s.fastCount||0},
    {id:"master",       icon:"crown",     style:"gold",   i18n:"bd14", goal:s=>6,            prog:s=>rankOf(s.xp||0).id},
    {id:"polyvalent",   icon:"grid",      style:"green",  i18n:"bd15", goal:s=>5,            prog:s=>Object.values(s.mastery||{}).filter(v=>v>=70).length},
    {id:"explorer",     icon:"compass",   style:"",       i18n:"bd16", goal:s=>5,            prog:s=>s.typesTried||0}
  ];
  function evalBadges(stats, earned){
    const have = new Set(earned || []);
    const out = [];
    for(const b of BADGES){
      const p = b.prog(stats) || 0, g = b.goal(stats);
      const done = p >= g;
      if(done && !have.has(b.id)) have.add(b.id);
      out.push({...b, progress:Math.min(p,g), goalVal:g, pct: Math.min(100, Math.round(p/g*100)),
                unlocked: done, newlyUnlocked: done && !(earned||[]).includes(b.id)});
    }
    return out;
  }

  /* ───────── 7. MAÎTRISE PAR AXE (moyenne pondérée des exercices) ───────── */
  /**
   * @param {Array} results [{topic:'grammaire', correct:8, total:10, weight:1}]
   */
  function computeMastery(results){
    const agg = {};
    for(const r of results||[]){
      const t = (r.topic||'autre').toLowerCase();
      agg[t] = agg[t] || {correct:0,total:0};
      const w = r.weight || 1;
      agg[t].correct += (r.correct||0) * w;
      agg[t].total   += (r.total||0)   * w;
    }
    const out = {};
    for(const t in agg) out[t] = agg[t].total ? Math.round(agg[t].correct / agg[t].total * 100) : 0;
    return out;
  }
  function globalMastery(masteryObj){
    const v = Object.values(masteryObj||{});
    return v.length ? Math.round(v.reduce((a,b)=>a+b,0)/v.length) : 0;
  }

  /* ───────── 8. STATISTIQUES GLOBALES D'UN ÉLÈVE ───────── */
  /** Construit un résumé de progression.
   *  Tolère les DEUX formes de données :
   *   · profil de démonstration  → streak / best / correct / answered
   *   · document Firestore       → streakCurrent / streakBest / correctTotal / answeredTotal
   *  Ainsi le même code fonctionne en démo et une fois Firebase branché. */
  function summarize(p){
    p = p || {};
    const num = (...v) => { for(const x of v){ if(typeof x === 'number' && !isNaN(x)) return x; } return 0; };
    const xp        = num(p.xp);
    const streak    = num(p.streak, p.streakCurrent);
    const best      = num(p.best, p.streakBest, streak);
    const correct   = num(p.correct, p.correctTotal);
    const answered  = num(p.answered, p.answeredTotal);
    const rank      = rankOf(xp);
    const rp        = rankProgress(xp);
    return {
      xp, rank, rankProgress: rp,
      streak, bestStreak: best, streakMult: streakMult(streak),
      lessonsDone: num(p.lessonsDone), exDone: num(p.exDone), quizDone: num(p.quizDone),
      correct, answered,
      accuracy: answered ? Math.round(correct/answered*100) : 0,
      mastery: p.mastery||{}, globalMastery: globalMastery(p.mastery||{}),
      badges: Array.isArray(p.badges) ? p.badges : [], minutes: num(p.minutes)
    };
  }

  /* ───────── 9. API ───────── */
  window.PKxp = {
    CFG, RANKS, MASTERY, BADGES,
    rankOf, rankProgress, rankLabel, masteryLabel,
    computeXP, updateStreak, bestOf, streakMult,
    evalBadges, computeMastery, globalMastery, summarize, dayKey
  };
})();
