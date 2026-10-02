/* ══════════════════════════════════════════════════════════════════
   06-student-local.js · الملف الشخصي والتقدّم المحلي للتلميذ
   ──────────────────────────────────────────────────────────────────
   التلميذ لم يعد بحاجة إلى حساب Google:
     · يكتب معلوماته في استمارة → تُرسل إلى الأستاذة (registrations)
     · يبقى ملفه وتقدّمه على جهازه هو (localStorage) — بياناته الحقيقية
       فقط: كل نقطة XP هنا نتجت عن تمرين أنجزه فعلاً على هذا الجهاز.
   لا بيانات وهمية ولا أرقام مُختلقة: الحقول تُقرأ كما كتبها، والتقدّم
   يُحتسب من إجاباته.
   ══════════════════════════════════════════════════════════════════ */
window.PKlocal = (function(){
"use strict";

const KS = 'pk-student';      /* معلومات التلميذ */
const KP = 'pk-progress';     /* تقدّمه (XP، السلسلة، الإتقان…) */
const V  = 1;

const lsGet = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
const lsSet = (k,v) => { try{ localStorage.setItem(k,v); }catch(e){} };
const lsDel = k => { try{ localStorage.removeItem(k); }catch(e){} };
const read  = k => { try{ const r = lsGet(k); return r ? JSON.parse(r) : null; }catch(e){ return null; } };

let _p = null, _g = null;   /* cache mémoire (évite les lectures répétées) */

/* ───────── 1. FORMES DE DONNÉES ───────── */
const emptyProgress = () => ({
  v:V, xp:0, correct:0, answered:0, exDone:0, quizDone:0, minutes:0,
  best:0, bestStreak:0, perfect:0, fast:0,
  done:[],            /* معرّفات الدروس المكتملة */
  log:[],             /* أيام النشاط الفعلية YYYY-MM-DD */
  mastery:{},         /* نسبة الإتقان المحسوبة من الإجابات: {axe: pct} */
  badges:[]           /* الأوسمة المكتسبة فعلاً */
});

function profile(){
  if(_p === null) _p = read(KS) || null;
  return _p;
}
function progress(){
  if(!_g){
    const raw = read(KP) || {};
    _g = Object.assign(emptyProgress(), raw);
    _g.mastery = Object.assign({}, raw.mastery || {});
    _g.done = Array.isArray(raw.done) ? raw.done.slice() : [];
    _g.log  = Array.isArray(raw.log)  ? raw.log.slice()  : [];
    _g.badges = Array.isArray(raw.badges) ? raw.badges.slice() : [];
  }
  return _g;
}
function saveProfile(){
  if(_p) lsSet(KS, JSON.stringify(_p));
  return _p;
}
function saveProgress(){
  if(_g) lsSet(KP, JSON.stringify(_g));
  return _g;
}

/* ───────── 2. التسجيل المحلي ───────── */
/** يتحقّق من الحقول الإلزامية ويعيد قائمة الأخطاء (مفاتيح ترجمة). */
function validate(d){
  const errs = [];
  const name = String((d && d.name) || '').trim();
  const level = String((d && d.level) || '').trim();
  const phone = String((d && d.parentPhone) || '').trim();
  const mail  = String((d && d.email) || '').trim();
  if(name.length < 3) errs.push('regErrName');
  if(!level) errs.push('regErrLevel');
  if(phone.replace(/\D/g,'').length < 9) errs.push('regErrPhone');
  if(mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) errs.push('regErrMail');
  return errs;
}
/** يفتح الملف المحلي (بعد نجاح الإرسال أو بموافقة التلميذ عند الفشل). */
function register(d, opts){
  opts = opts || {};
  const clean = {
    name: String(d.name||'').trim(),
    level: String(d.level||'').trim(),
    birth: String(d.birth||'').trim(),
    parentPhone: String(d.parentPhone||'').trim(),
    email: String(d.email||'').trim().toLowerCase(),
    school: String(d.school||'').trim(),
    note: String(d.note||'').trim(),
    sent: !!opts.sent,
    at: d.at || new Date().toISOString()
  };
  _p = clean; _g = null;
  saveProfile(); progress(); saveProgress();
  return _p;
}
/** تعديل معلوماته من صفحة «ملفي». */
function update(patch){
  const p = profile(); if(!p) return null;
  Object.keys(patch||{}).forEach(k=>{
    if(['name','level','birth','parentPhone','email','school','note'].includes(k))
      p[k] = String(patch[k]||'').trim();
  });
  saveProfile();
  return p;
}
/** يُعلَّم أن التسجيل لم يصل الأستاذة (انقطاع شبكة مثلاً) — بلا كذب. */
function markUnsent(){ const p = profile(); if(p){ p.sent = false; saveProfile(); } return p; }
function markSent(at){ const p = profile(); if(p){ p.sent = true; if(at) p.at = at; saveProfile(); } return p; }
/** حذف كل شيء من هذا الجهاز (خروج التلميذ). */
function clear(){ _p = null; _g = null; lsDel(KS); lsDel(KP); }

/* ───────── 3. حساب التقدّم الحقيقي ───────── */
const todayKey = () => new Date().toISOString().slice(0,10);
function markToday(){ const g = progress(); const d = todayKey(); if(!g.log.includes(d)) g.log.push(d); }
function streakOf(log){
  if(!window.PKxp) return {current:0, best:0};
  const u = window.PKxp.updateStreak(log || []);
  return {current:u.current||0, best:u.best||0};
}
function stats(){
  const g = progress();
  const st = streakOf(g.log);
  return {
    xp:g.xp, lessonsDone:g.done.length, exDone:g.exDone, quizDone:g.quizDone,
    correct:g.correct, answered:g.answered, minutes:g.minutes,
    perfectCount:g.perfect, fastCount:g.fast, comebackCount:0,
    bestStreak:Math.max(st.best, g.bestStreak||0), streak:st.current,
    mastery:g.mastery, typesTried:Array.isArray(g.types)?g.types.length:0
  };
}
function refreshBadges(){
  const g = progress();
  if(!window.PKxp) return g.badges;
  const all = window.PKxp.evalBadges(stats(), g.badges) || [];
  g.badges = all.filter(b=>b.unlocked).map(b=>b.id);
  return g.badges;
}

/* ───────── 4. النشاطات (حقيقية فقط) ───────── */
/** نتيجة تمرين أنجزه التلميذ فعلاً على هذا الجهاز. */
function logSubmission(sub){
  const g = progress();
  sub = sub || {};
  g.xp += Math.max(0, +sub.xp || 0);
  g.correct += Math.max(0, +sub.correct || 0);
  g.answered += Math.max(0, +sub.total || 0);
  g.exDone += 1;
  if(sub.isQuiz) g.quizDone += 1;
  g.minutes += Math.max(0, +sub.durationSec || 0) / 60;
  if((+sub.correct || 0) > g.best) g.best = +sub.correct;
  if(sub.axis) g.mastery[sub.axis] = Math.max(+g.mastery[sub.axis] || 0, +sub.pct || 0);
  if((+sub.pct || 0) >= 100) g.perfect += 1;
  if(sub.timeLimit && sub.durationSec && sub.durationSec < sub.timeLimit * 0.6) g.fast += 1;
  if(sub.type && !Array.isArray(g.types)) g.types = [];
  if(sub.type && !g.types.includes(sub.type)) g.types.push(sub.type);
  markToday();
  const st = streakOf(g.log);
  g.bestStreak = Math.max(st.best, g.bestStreak || 0);
  g.lastDay = todayKey();
  refreshBadges();
  saveProgress();
  return g;
}
/** إلغاء وضع «مكتمل» عن درس (تراجع التلميذ) — تُخصم نقاطه أيضاً. */
function unmarkLesson(lessonId, xp){
  const g = progress();
  const i = g.done.indexOf(String(lessonId||''));
  if(i >= 0){
    g.done.splice(i,1);
    g.xp = Math.max(0, g.xp - Math.max(0, +xp || 0));
  }
  refreshBadges();
  saveProgress();
  return {ok:true};
}
/** درس أكمله فعلاً (القراءة حتى النهاية). */
function logLesson(lessonId, xp){
  const g = progress();
  lessonId = String(lessonId||'');
  if(!lessonId) return {ok:false, already:false};
  const already = g.done.includes(lessonId);
  if(!already){
    g.done.push(lessonId);
    g.xp += Math.max(0, +xp || 0);
  }
  markToday();
  const st = streakOf(g.log);
  g.bestStreak = Math.max(st.best, g.bestStreak || 0);
  g.lastDay = todayKey();
  refreshBadges();
  saveProgress();
  return {ok:true, already};
}

/* ───────── 5. الكائن الذي تقرؤه الصفحات (شكل me نفسه) ───────── */
function me(){
  const p = profile(); if(!p) return null;
  const g = progress(); const st = stats();
  return {
    id:'local', uid:null, role:'local', local:true,
    ar:p.name, fr:p.name, name:p.name,
    level:p.level || null,
    birth:p.birth || '', email:p.email || '',
    parent:p.parentPhone || '', school:p.school || '', note:p.note || '',
    sent:!!p.sent, at:p.at || '',
    group:null, linked:false, color:'#1E4FD8',
    xp:g.xp, streak:st.streak, best:st.bestStreak, lessonsDone:g.done.length,
    exDone:g.exDone, quizDone:g.quizDone, correct:g.correct, answered:g.answered,
    minutes:Math.round(g.minutes), mastery:Object.assign({}, g.mastery),
    badges:g.badges.slice(), doneIds:g.done.slice(), log:g.log.slice()
  };
}

/* ───────── 6. الواجهة ───────── */
function active(){ return !!profile(); }
/** نشِط ومسجَّل عند الأستاذة (أُرسل بنجاح) — يُستعمل للّافتات. */
function delivered(){ const p = profile(); return !!(p && p.sent); }

const API = {
  /* قراءة */
  profile, progress, me, stats, active, delivered,
  activity(){ return progress().log.slice(); },
  /* كتابة */
  register, update, clear, markSent, markUnsent,
  logSubmission, logLesson, unmarkLesson, refreshBadges,
  /* للاختبارات */
  _keys:{KS, KP}, _validate:validate
};
return API;
})();
