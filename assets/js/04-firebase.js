/* ══════════════════════════════════════════════════════════════════
   04-firebase.js · Couche données (Firestore + Auth Google)
   ─────────────────────────────────────────────────────────────────
   MODE DÉMO : PK.mock = true → toutes les lectures viennent de 03-data.js
   MODE LIVE : remplir firebaseConfig puis passer PK.mock = false.
   Le reste du site ne change PAS : il appelle toujours PKdb.*
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

/* ───────── 1. CONFIGURATION À REMPLIR (voir SETUP-AR.md) ───────── */
const firebaseConfig = {
  apiKey:            "AIzaSyDav36ZCo_HUtIqmA0WiWlAGBJyj5dVilo",
  authDomain:        "prof-kerdjidj.firebaseapp.com",
  projectId:         "prof-kerdjidj",
  storageBucket:     "prof-kerdjidj.firebasestorage.app",
  messagingSenderId: "398873490016",
  appId:             "1:398873490016:web:f05b6c57eb31a7527e0905"
};
let MOCK = !firebaseConfig.apiKey || firebaseConfig.apiKey.indexOf('COLLEZ') !== -1;

let app=null, auth=null, db=null, storage=null, FB=null;

/* ───────── 2. CHARGEMENT DYNAMIQUE DU SDK (uniquement en mode live) ───────── */
async function init(){
  /* mode tests automatisés : hors-ligne forcé + graine optionnelle */
  if(window.__PK_TEST__){
    MOCK = true;
    if(window.__PK_SEED__){ const D=window.PKdata; Object.keys(window.__PK_SEED__).forEach(k=>{ D[k]=window.__PK_SEED__[k]; }); }
    loadSettings();
    return {mock:true};
  }
  if(MOCK){
    console.info('%c[PK] Mode non connecté — aucune donnée fictive. Publiez la plateforme pour activer Firestore.',
      'color:#1E4FD8;font-weight:bold');
    loadSettings();
    /* crochet de tests automatisés uniquement (tests/run-all.mjs) */
    if(window.__PK_SEED__){
      const D = window.PKdata;
      Object.keys(window.__PK_SEED__).forEach(k=>{ D[k] = window.__PK_SEED__[k]; });
    }
    return {mock:true};
  }
  try{
    const [fa, fu, ff, fs] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js")
    ]);
    app     = fa.initializeApp(firebaseConfig);
    auth    = fu.getAuth(app);
    db      = ff.getFirestore(app);
    storage = fs.getStorage(app);
    FB = {fa, fu, ff, fs};
    let authOnce = ()=>{};
    const firstAuth = new Promise(res=>{ authOnce = res; });
    fu.onAuthStateChanged(auth, u => {
      document.dispatchEvent(new CustomEvent('pk:auth', {detail:{user:u}}));
      if(u) syncProfile(u)
        .then(()=>hydrateMe(u))
        .then(()=>{ document.dispatchEvent(new CustomEvent('pk:me',{detail:window.PKdata.me})); authOnce(u); },
              ()=>authOnce(u));
      else { window.PKdata.me = null;
        document.dispatchEvent(new CustomEvent('pk:me',{detail:null})); authOnce(null); }
    });
    // paramètres enregistrés dans Firestore (settings/main) → appliqués au cache
    await loadSettings();
    await hydrate();      // leçons / exercices / annonces / groupes → PKdata
    await firstAuth;      // profil réel (users/{uid} + progress) → PKdata.me
    return {mock:false, auth, db, storage};
  }catch(err){
    console.error('[PK] Échec d’initialisation Firebase :', err);
    MOCK = true;   // repli hors-ligne : aucune donnée fantôme, états vides honnêtes
    return {mock:true, error:err};
  }
}

/* ───────── 3. AUTHENTIFICATION GOOGLE ───────── */
async function loginGoogle(){
  if(MOCK){
    /* لا هويات مزيفة: المنصة غير موصولة بعد */
    if(window.PK && window.PKi18n){
      window.PK.toast(window.PKi18n.t('notConnected'), 'wn', 3200);
    }
    return null;
  }
  const p = new FB.fu.GoogleAuthProvider();
  p.setCustomParameters({prompt:'select_account'});
  const cred = await FB.fu.signInWithPopup(auth, p);
  return cred.user;
}
async function logout(){
  if(MOCK){ try{sessionStorage.removeItem('pk-user');}catch(e){} }
  else if(FB) await FB.fu.signOut(auth);
  document.dispatchEvent(new CustomEvent('pk:auth',{detail:{user:null}}));
}
function currentUser(){
  if(MOCK){ try{ const s=sessionStorage.getItem('pk-user'); return s?JSON.parse(s):null; }catch(e){ return null; } }
  return FB ? FB.fu.getAuth().currentUser : null;
}

/* ───────── 4. PROFIL : liaison compte Google ↔ fiche élève ───────── */
async function syncProfile(user){
  if(!user || MOCK) return null;
  const {ff} = FB;
  const ref = ff.doc(db, 'users', user.uid);
  const snap = await ff.getDoc(ref);
  if(!snap.exists()){
    // cherche une fiche élève liée par e-mail (créée par la professeure)
    const q = ff.query(ff.collection(db,'students'), ff.where('googleEmail','==',user.email));
    const qs = await ff.getDocs(q);
    const student = qs.empty ? null : {...qs.docs[0].data(), id:qs.docs[0].id};
    await ff.setDoc(ref, {
      uid:user.uid, email:user.email, name:user.displayName, photoURL:user.photoURL,
      role: student ? 'student' : 'pending',
      linkedStudentId: student ? student.id : null,
      createdAt: ff.serverTimestamp(), lastLoginAt: ff.serverTimestamp()
    });
    return {role: student ? 'student' : 'pending', student};
  }
  const data = snap.data();
  await ff.updateDoc(ref, {lastLoginAt: ff.serverTimestamp()});
  return data;
}

/* ───────── 4bis. HYDRATATION : Firestore → cache PKdata (zéro démo) ─────────
   Tout le contenu visible vient de la base : ce que la professeure publie.
   hydrate()      : collections publiques (leçons, exercices, annonces, groupes)
   hydrateMe(user): profil réel = users/{uid} + progress + fiche élève liée   */
async function hydrate(){
  if(MOCK || !db) return;
  const {ff} = FB, D = window.PKdata;
  try{
    const [ls, ex, an, gr] = await Promise.all([
      ff.getDocs(ff.collection(db,'lessons')),
      ff.getDocs(ff.collection(db,'exercises')),
      ff.getDocs(ff.collection(db,'announcements')),
      ff.getDocs(ff.collection(db,'groups'))
    ]);
    D.lessons       = ls.docs.map(d=>({id:d.id, ...d.data()}));
    D.exercises     = ex.docs.map(d=>({id:d.id, ...d.data()}));
    D.announcements = an.docs.map(d=>({id:d.id, ...d.data()}));
    D.groups        = gr.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(e){ console.warn('[PK] hydrate:', e); }
}
async function hydrateMe(user){
  const D = window.PKdata;
  if(MOCK || !user){ D.me = null; return null; }
  const {ff} = FB;
  try{
    const u = await ff.getDoc(ff.doc(db,'users',user.uid));
    const prof = u.exists() ? u.data() : null;
    if(!prof){ D.me = null; return null; }
    let student = null;
    if(prof.linkedStudentId){
      const s = await ff.getDoc(ff.doc(db,'students',prof.linkedStudentId)).catch(()=>null);
      if(s && s.exists()) student = {id:s.id, ...s.data()};
    }
    const pid = prof.linkedStudentId || user.uid;
    const pg  = await ff.getDoc(ff.doc(db,'progress',pid)).catch(()=>null);
    const pr  = (pg && pg.exists()) ? pg.data() : {};
    const doneIds = pr.doneLessons || [];
    const me = {
      id:pid, uid:user.uid, role:prof.role||'pending', level:prof.level||null,
      ar:prof.name||user.displayName||'', fr:prof.name||user.displayName||'',
      email:prof.email||user.email||'', photoURL:prof.photoURL||user.photoURL||null,
      group: student ? student.group : null, school: student ? student.school : null,
      linked: !!student, color: student && student.color ? student.color : '#1E4FD8',
      xp:pr.xp||0, streak:pr.streakCurrent||0, best:pr.best||0,
      lessonsDone:pr.lessonsDone||0, exDone:pr.exDone||0, quizDone:pr.quizDone||0,
      correct:pr.correctTotal||0, answered:pr.answeredTotal||0, minutes:pr.minutes||0,
      mastery:pr.mastery||{}, badges:pr.badges||[], doneIds
    };
    D.me = me;
    D.lessons.forEach(l=>{ l.done = doneIds.includes(l.id); });
    if(prof.role === 'admin'){
      try{
        const st = await ff.getDocs(ff.collection(db,'students'));
        D.students = st.docs.map(d=>({id:d.id, ...d.data()}));
        const ms = await ff.getDocs(ff.collection(db,'messages'));
        D.messages = ms.docs.map(d=>({id:d.id, ...d.data()}));
      }catch(e){}
    }
    return me;
  }catch(e){ console.warn('[PK] hydrateMe:', e); D.me = null; return null; }
}
/** بوابة المستوى: اختيار السنة الدراسية عند أول دخول — يُحفظ في users/{uid} */
async function chooseLevel(lv){
  const D = window.PKdata;
  if(MOCK){
    try{
      const raw = sessionStorage.getItem('pk-user');
      if(raw){ const s = JSON.parse(raw); s.level = lv; sessionStorage.setItem('pk-user', JSON.stringify(s)); D.me = Object.assign(D.me||{}, s); }
      else if(D.me){ D.me.level = lv; if(D.me.role==='pending') D.me.role='student'; }
    }catch(e){}
    return {ok:true};
  }
  const u = currentUser(); if(!u) return {ok:false};
  const {ff} = FB;
  const ref = ff.doc(db,'users',u.uid);
  const cur = await ff.getDoc(ref);
  const role = (cur.exists() && cur.data().role === 'admin') ? 'admin' : 'student';
  await ff.updateDoc(ref, {level:lv, role});
  await hydrateMe(u);
  document.dispatchEvent(new CustomEvent('pk:me',{detail:D.me}));
  return {ok:true};
}

/* crochet réservé à la suite de tests automatisés (tests/run-all.mjs) :
   ouvre une session locale en mode non connecté. Invisible dans l'interface. */
function _testSession(u){
  if(!MOCK) return null;
  window.PKdata.me = u;
  try{ sessionStorage.setItem('pk-user', JSON.stringify(u)); }catch(e){}
  document.dispatchEvent(new CustomEvent('pk:me',{detail:u}));
  return u;
}

/* ───────── 5. LECTURES (démo = données locales) ───────── */
function col(name){
  if(MOCK){
    const map = {
      settings:[window.PKdata.settings], levels:window.PKdata.levels, axes:window.PKdata.axes,
      lessons:window.PKdata.lessons, exercises:window.PKdata.exercises, quizzes:window.PKdata.exercises,
      groups:window.PKdata.groups, students:window.PKdata.students,
      announcements:window.PKdata.announcements, submissions:[], progress:[], messages:[]
    };
    return Promise.resolve(map[name] || []);
  }
  const {ff} = FB;
  return ff.getDocs(ff.collection(db,name)).then(s=>s.docs.map(d=>({...d.data(), id:d.id})));
}
function docGet(name,id){
  if(MOCK){
    const all = {lessons:window.PKdata.lessons, exercises:window.PKdata.exercises,
                 groups:window.PKdata.groups, students:window.PKdata.students};
    return Promise.resolve((all[name]||[]).find(x=>x.id===id) || null);
  }
  const {ff} = FB;
  return ff.getDoc(ff.doc(db,name,id)).then(s=> s.exists() ? {...s.data(), id:s.id} : null);
}
function settings(){
  if(MOCK) return Promise.resolve(window.PKdata.settings);
  return docGet('settings','main');
}

/* ───────── 6. ÉCRITURES (admin uniquement, bloquées en démo) ───────── */
function guard(){
  if(MOCK){ window.PK.toast(window.PKi18n.t('mockTag'),'wn'); return false; }
  return true;
}
/* En mode démo (pas de configuration Firebase), les écritures aboutissent
   silencieusement au lieu de rejeter : aucune erreur dans la console. */
const mockWrite = (op,name,id,data) => {
  const nid = id || ('local_'+Date.now().toString(36));
  cacheSync(op,name,nid,data);
  return Promise.resolve({ok:true, mock:true, id:nid});
};
/* miroir local : toute écriture réussie met à jour le cache PKdata,
   ainsi l'admin voit sa liste à jour sans recharger la page. */
function cacheSync(op,name,id,data){
  const D = window.PKdata; if(!D || !Array.isArray(D[name])) return;
  if(op==='remove'){ D[name] = D[name].filter(x=>x.id!==id); return; }
  if(op==='add'){ if(id && !D[name].some(x=>x.id===id)) D[name].push(Object.assign({},data,{id})); return; }
  const i = D[name].findIndex(x=>x.id===id);
  if(i>=0) D[name][i] = Object.assign({}, D[name][i], data, {id});
  else D[name].push(Object.assign({}, data, {id}));
}
function set(name,id,data){ if(!guard()) return mockWrite('set',name,id,data);
  const {ff}=FB; return ff.setDoc(ff.doc(db,name,id), data, {merge:true})
    .then(r=>{ cacheSync('set',name,id,data); return r; }); }
function add(name,data){ if(!guard()) return mockWrite('add',name,null,data);
  const {ff}=FB; return ff.addDoc(ff.collection(db,name), {...data, createdAt:ff.serverTimestamp()})
    .then(r=>{ cacheSync('add',name,r.id,data); return r; }); }
function remove(name,id){ if(!guard()) return mockWrite('remove',name,id);
  const {ff}=FB; return ff.deleteDoc(ff.doc(db,name,id))
    .then(r=>{ cacheSync('remove',name,id); return r; }); }

/* ───────── 6bis. PARAMÈTRES DU SITE (modifiables depuis l'admin) ─────────
   Mode démo  : fusion dans window.PKdata.settings + sauvegarde localStorage
   Mode live  : écriture dans Firestore (settings/main) + cache local
   Dans les deux cas le reste du site lit window.PKdata.settings → la
   modification apparaît partout (contact, pied de page, à propos…).        */
const SET_KEY = 'pk-settings';

/** Applique un objet de paramètres au cache local (sans écriture distante). */
function applySettings(patch){
  if(!patch || typeof patch !== 'object') return window.PKdata.settings;
  const S = window.PKdata.settings;
  Object.keys(patch).forEach(k=>{
    // les objets imbriqués (stats) sont fusionnés, pas écrasés
    if(patch[k] && typeof patch[k]==='object' && !Array.isArray(patch[k]) && S[k] && typeof S[k]==='object')
      Object.assign(S[k], patch[k]);
    else S[k] = patch[k];
  });
  // répercute les réglages XP sur le moteur de progression
  if(S.xp && window.PKxp && window.PKxp.CFG){
    const CFG = window.PKxp.CFG;
    Object.keys(S.xp).forEach(k=>{
      if(k === 'multDiff' && S.xp.multDiff) Object.keys(S.xp.multDiff).forEach(d=>{ CFG.multDiff[d] = +S.xp.multDiff[d]; });
      else if(k === 'rankMin' && Array.isArray(S.xp.rankMin))
        window.PKxp.RANKS.forEach((r,i)=>{ if(typeof S.xp.rankMin[i] === 'number' && i>0) r.min = S.xp.rankMin[i]; });
      else if(k in CFG) CFG[k] = S.xp[k];
    });
  }
  try{ document.dispatchEvent(new CustomEvent('pk:settings',{detail:S})); }catch(e){}
  return S;
}

/** Charge les paramètres enregistrés (localStorage puis Firestore). */
function loadSettings(){
  // 1. sauvegarde locale immédiate (fonctionne même hors ligne)
  try{
    const raw = localStorage.getItem(SET_KEY);
    if(raw) applySettings(JSON.parse(raw));
  }catch(e){}
  if(MOCK) return Promise.resolve(window.PKdata.settings);
  // 2. version distante authoritative
  return docGet('settings','main')
    .then(doc=>{ if(doc) applySettings(doc); return window.PKdata.settings; })
    .catch(()=> window.PKdata.settings);
}

/** Enregistre un correctif de paramètres. Renvoie une promesse. */
function saveSettings(patch){
  applySettings(patch);
  try{
    const S = window.PKdata.settings;
    // ne persiste localement que les clés simples (pas les fonctions)
    localStorage.setItem(SET_KEY, JSON.stringify(S));
  }catch(e){}
  if(MOCK) return Promise.resolve({ok:true, mock:true, settings:window.PKdata.settings});
  const {ff} = FB;
  return ff.setDoc(ff.doc(db,'settings','main'), patch, {merge:true})
    .then(()=>({ok:true, settings:window.PKdata.settings}));
}

/** Réinitialise les paramètres aux valeurs d'usine (03-data.js). */
function resetSettings(){
  try{ localStorage.removeItem(SET_KEY); }catch(e){}
  if(MOCK){ location.reload(); return Promise.resolve({ok:true}); }
  const {ff} = FB;
  return ff.deleteDoc(ff.doc(db,'settings','main')).then(()=>location.reload());
}

/* ───────── 7. PROGRESSION (XP) ───────── */
async function saveSubmission(sub){
  if(MOCK){ console.info('[PK][démo] submission', sub); return {ok:true, mock:true}; }
  const {ff}=FB;
  await ff.addDoc(ff.collection(db,'submissions'), {...sub, at:ff.serverTimestamp()});
  const ref = ff.doc(db,'progress',sub.studentId);
  await ff.setDoc(ref, {
    xp: ff.increment(sub.xp||0),
    exDone: ff.increment(1),
    quizDone: ff.increment(sub.type==='quiz'?1:0),
    correctTotal: ff.increment(sub.correct||0),
    answeredTotal: ff.increment(sub.total||0),
    minutes: ff.increment(Math.round((sub.durationSec||0)/60)),
    lastActivity: ff.serverTimestamp()
  },{merge:true});
  /* record, maîtrise d'axe et série : lecture → modification → écriture */
  const snap = await ff.getDoc(ref);
  const cur = snap.exists()? snap.data():{};
  const upd = {};
  if((sub.correct||0) > (cur.best||0)) upd.best = sub.correct;
  if(sub.axis && typeof sub.pct==='number'){
    const m = Object.assign({}, cur.mastery||{});
    m[sub.axis] = Math.max(m[sub.axis]||0, sub.pct);
    upd.mastery = m;
  }
  Object.assign(upd, bumpStreak(cur)||{});
  if(Object.keys(upd).length) await ff.setDoc(ref, upd, {merge:true});
  return {ok:true};
}
/* Série quotidienne : +1 si hier était actif, sinon repart à 1 (jamais négatif) */
function bumpStreak(cur){
  const today = new Date().toISOString().slice(0,10);
  const last = cur.lastDay||'';
  if(last === today) return null;
  const yesterday = new Date(Date.now()-864e5).toISOString().slice(0,10);
  return {streakCurrent: (last===yesterday ? (cur.streakCurrent||0)+1 : 1), lastDay:today};
}
async function markLessonDone(lessonId, studentId, xp){
  if(MOCK){
    const D=window.PKdata;
    const l=(D.lessons||[]).find(x=>x.id===lessonId); if(l) l.done=true;
    if(D.me){ D.me.xp=(D.me.xp||0)+(xp||25); D.me.lessonsDone=(D.me.lessonsDone||0)+1;
      D.me.doneIds = D.me.doneIds||[]; if(!D.me.doneIds.includes(lessonId)) D.me.doneIds.push(lessonId); }
    return {ok:true,mock:true};
  }
  const {ff}=FB;
  await ff.setDoc(ff.doc(db,'lessonsDone', studentId+'_'+lessonId),
    {studentId, lessonId, at:ff.serverTimestamp()});
  const ref = ff.doc(db,'progress',studentId);
  await ff.setDoc(ref,
    {lessonsDone: ff.increment(1), xp: ff.increment(xp||25),
     doneLessons: ff.arrayUnion(lessonId), lastActivity:ff.serverTimestamp()}, {merge:true});
  const snap = await ff.getDoc(ref);
  const st = bumpStreak(snap.exists()?snap.data():{});
  if(st) await ff.setDoc(ref, st, {merge:true});
  return {ok:true};
}

/* ───────── 8. STORAGE (fichiers) ───────── */
async function upload(file, path){
  if(MOCK){ return Promise.resolve({name:file.name, url:'#', mock:true, size:file.size}); }
  /* Cloud Storage exige le plan Blaze (payant). La plateforme fonctionne sans :
     les fichiers externes (PDF/vidéos) se partagent par lien Drive/YouTube. */
  if(!storage){
    return {ok:false, error:'storage-off',
      msg:(window.L_ ? window.L_(
        'رفع الملفات غير متاح: خدمة التخزين السحابي صارت مدفوعة — الصق رابط Google Drive أو YouTube بدلاً من ذلك.',
        'Upload désactivé : Cloud Storage est devenu payant — collez plutôt un lien Google Drive ou YouTube.')
        : 'Storage unavailable')};
  }
  try{
    const {fs}=FB;
    const ref = fs.ref(storage, path+'/'+Date.now()+'_'+file.name);
    const snap = await fs.uploadBytes(ref, file);
    return {name:file.name, url: await fs.getDownloadURL(snap.ref), size:file.size, type:file.type};
  }catch(err){
    return {ok:false, error:'storage-off', msg:(window.L_ ? window.L_(
      'تعذّر رفع الملف — استخدم رابط Google Drive أو YouTube.',
      'Échec de l’upload — utilisez un lien Google Drive ou YouTube.') : 'Upload failed')};
  }
}

/* ───────── 9. EXPORT ───────── */
window.PKdb = {
  init, MOCK, get mock(){return MOCK;},
  loginGoogle, logout, currentUser, syncProfile,
  col, docGet, settings, set, add, remove,
  loadSettings, saveSettings, applySettings, resetSettings,
  saveSubmission, markLessonDone, upload,
  hydrate, hydrateMe, chooseLevel, _testSession,
  get fb(){return {app,auth,db,storage,FB};}
};
})();
