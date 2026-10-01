/* ══════════════════════════════════════════════════════════════════
   04-firebase.js · Couche données (Firestore + Auth Google / e-mail)
   ─────────────────────────────────────────────────────────────────
   MODE DÉMO : PK.mock = true → toutes les lectures viennent de 03-data.js
   MODE LIVE : firebaseConfig rempli → Firestore + Firebase Auth.
   Le reste du site ne change PAS : il appelle toujours PKdb.*
   ─────────────────────────────────────────────────────────────────
   RÈGLE D'OR (corrigée) : les écritures personnelles (progression,
   résultats, leçons terminées) utilisent TOUJOURS l'uid du compte
   connecté — jamais l'identifiant de la fiche élève. La fiche
   (students/{cardId}) reste réservée à la professeure ; elle est
   reliée au compte via users/{uid}.linkedStudentId.
   ─────────────────────────────────────────────────────────────────
   Collections :
     users/{uid}        profil : rôle, niveau, intérêts, carte liée
     students/{cardId}  fiches élèves (écrites par la professeure)
     progress/{uid}     XP, série, maîtrise, leçons terminées
     submissions/{id}   résultats d'exercices (créés par l'élève)
     lessonsDone/{uid_lessonId}
     groups/{id}        séances : vis='public' | 'vip' (+ vipUids)
   ══════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

/* ───────── 1. CONFIGURATION (voir SETUP-AR.md) ───────── */
const firebaseConfig = {
  apiKey:            "AIzaSyDav36ZCo_HUtIqmA0WiWlAGBJyj5dVilo",
  authDomain:        "prof-kerdjidj.firebaseapp.com",
  projectId:         "prof-kerdjidj",
  storageBucket:     "prof-kerdjidj.firebasestorage.app",
  messagingSenderId: "398873490016",
  appId:             "1:398873490016:web:f05b6c57eb31a7527e0905"
};
let MOCK = !firebaseConfig.apiKey || firebaseConfig.apiKey.indexOf('COLLEZ') !== -1;
let initError = null;               // config présente mais SDK/Firestore indisponible
let booted = false;                 // garde : init() ne s'exécute qu'une fois

let app=null, auth=null, db=null, storage=null, FB=null;

/* ───────── 1bis. MESSAGES D'ERREUR CLAIRS (AR / FR) ───────── */
const ERR = {
  'auth/invalid-email':          ['البريد الإلكتروني غير صحيح.','Adresse e-mail invalide.'],
  'auth/missing-password':       ['أدخل كلمة المرور.','Saisissez le mot de passe.'],
  'auth/user-not-found':         ['لا يوجد حساب بهذا البريد — أنشئ حساباً جديداً.','Aucun compte avec cet e-mail — créez un compte.'],
  'auth/wrong-password':         ['كلمة المرور غير صحيحة.','Mot de passe incorrect.'],
  'auth/invalid-credential':     ['البريد أو كلمة المرور غير صحيحة.','E-mail ou mot de passe incorrect.'],
  'auth/invalid-login-credentials':['البريد أو كلمة المرور غير صحيحة.','E-mail ou mot de passe incorrect.'],
  'auth/email-already-in-use':   ['هذا البريد مستعمل بالفعل — سجّل الدخول بدلاً من إنشاء حساب.','Cet e-mail est déjà utilisé — connectez-vous.'],
  'auth/weak-password':          ['كلمة المرور قصيرة: 6 أحرف على الأقل.','Mot de passe trop court : 6 caractères minimum.'],
  'auth/too-many-requests':      ['محاولات كثيرة — انتظر بضع دقائق ثم أعد المحاولة.','Trop de tentatives — réessayez dans quelques minutes.'],
  'auth/popup-closed-by-user':   ['أُغلقت نافذة الدخول قبل الإتمام.','Fenêtre de connexion fermée avant la fin.'],
  'auth/popup-blocked':          ['المتصفح منع نافذة الدخول — اسمح بالنوافذ المنبثقة ثم أعد المحاولة.','Le navigateur a bloqué la fenêtre — autorisez les pop-ups puis réessayez.'],
  'auth/cancelled-popup-request':['أُلغيت نافذة الدخول — أعد المحاولة.','Connexion annulée — réessayez.'],
  'auth/operation-not-allowed':  ['طريقة الدخول غير مُفعّلة في Firebase — فعّل Google و E-mail/Password.','Méthode désactivée dans Firebase — activez Google et E-mail/Password.'],
  'auth/network-request-failed': ['لا يوجد اتصال بالإنترنت — تحقّق ثم أعد المحاولة.','Pas de connexion Internet — vérifiez puis réessayez.'],
  'auth/unauthorized-domain':    ['هذا النطاق غير مصرّح به في Firebase — أضفه إلى Authorized domains.','Domaine non autorisé dans Firebase — ajoutez-le aux Authorized domains.'],
  'auth/requires-recent-login':  ['أعد تسجيل الدخول لإتمام هذه العملية.','Reconnectez-vous pour terminer cette opération.'],
  'permission-denied':           ['قواعد Firestore رفضت هذه العملية — تحقّق من نشر firestore.rules.','Règles Firestore : opération refusée — vérifiez le déploiement.'],
  'unavailable':                 ['تعذّر الاتصال بالخادم — تحقّق من الإنترنت ثم أعد المحاولة.','Serveur injoignable — vérifiez la connexion puis réessayez.'],
  'failed-precondition':         ['فهرس Firestore ناقص — انشر firestore.indexes.json.','Index Firestore manquant — déployez firestore.indexes.json.'],
  'not-found':                   ['العنصر المطلوب غير موجود.','Élément introuvable.'],
  'resource-exhausted':          ['تجاوزت الحد المسموح — حاول لاحقاً.','Quota atteint — réessayez plus tard.']
};
/** Traduit une erreur Firebase en phrase claire (AR par défaut, FR si langue=fr). */
function friendlyError(e){
  const raw = (e && (e.code || e.message)) || '';
  const key = Object.keys(ERR).find(k => String(raw).indexOf(k) !== -1);
  const lang = (window.PKi18n && window.PKi18n.current && window.PKi18n.current()) || 'ar';
  if(key) return lang === 'ar' ? ERR[key][0] : ERR[key][1];
  return (e && e.message) ? String(e.message) : (lang === 'ar' ? 'حدث خطأ غير متوقّع.' : 'Erreur inattendue.');
}
/** Repli garanti : si une opération réseau ne répond pas, on n'attend pas
    indéfiniment — l'interface s'affiche avec ce qu'on a (jamais d'écran blanc). */
function withTimeout(p, ms, fallback){
  return Promise.race([
    Promise.resolve(p).catch(()=> fallback),
    new Promise(res => setTimeout(()=>{ console.warn('[PK] delai depasse ('+ms+' ms) — repli'); res(fallback); }, ms))
  ]);
}

/** Signale une erreur : console + message visible, sans jamais casser l'interface. */
function reportError(e, extra){
  console.error('[PK]', e);
  const message = friendlyError(e);
  try{ if(window.PK && window.PK.toast) window.PK.toast(message, 'er', 5200); }catch(_){}
  try{ document.dispatchEvent(new CustomEvent('pk:error', {detail:{error:e, message, toasted:true}})); }catch(_){}
  return Object.assign({ok:false, error:e, message}, extra||{});
}

/* ───────── 2. CHARGEMENT DYNAMIQUE DU SDK (mode live) ───────── */
async function init(){
  if(booted) return {mock:MOCK, app, auth, db, storage};
  booted = true;
  /* mode tests automatisés : hors-ligne forcé + graine optionnelle */
  if(window.__PK_TEST__){
    MOCK = true;
    seed();
    loadSettings();
    return {mock:true};
  }
  if(MOCK){
    console.info('%c[PK] Mode non connecté — aucune donnée fictive. Publiez la plateforme pour activer Firestore.',
      'color:#1E4FD8;font-weight:bold');
    seed();
    loadSettings();
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
      if(!u){
        window.PKdata.me = null;
        document.dispatchEvent(new CustomEvent('pk:me', {detail:null}));
        authOnce(null);
        return;
      }
      /* chaîne d'amorçage : profil → contenu → données personnelles → écran.
         Chaque étape est isolée : l'échec de l'une ne bloque pas les autres. */
      (async ()=>{
        let errors = [];
        try{ await syncProfile(u); }catch(e){ errors.push(e); console.warn('[PK] profil:', e && e.code); }
        try{ await hydrate(roleOf()); }catch(e){ errors.push(e); console.warn('[PK] hydrate:', e && e.code); }
        try{ await hydrateMe(u); }catch(e){ errors.push(e); console.warn('[PK] hydrateMe:', e && e.code); }
        /* rôle connu maintenant : recharger les séances (publiques + VIP de l'élève/prof) */
        try{ await hydrateGroups((window.PKdata.me && window.PKdata.me.role) || 'anon'); }
        catch(e){ console.warn('[PK] groupes:', e && e.code); }
        document.dispatchEvent(new CustomEvent('pk:me', {detail:window.PKdata.me}));
        if(errors.length) document.dispatchEvent(new CustomEvent('pk:error', {detail:{error:errors[0], message:friendlyError(errors[0])}}));
        authOnce(u);
      })();
    });
    await loadSettings();                // paramètres publics (settings/main)
    const u = await withTimeout(firstAuth, 9000, 'timeout');  // jamais d'attente infinie
    if(u === 'timeout'){                 // réseau lent : l'interface s'affiche déjà
      console.warn('[PK] authentification lente — affichage immediat');
      return {mock:false, auth, db, storage, user:null, pending:true};
    }
    if(!u) await hydrate('anon');        // visiteur : contenu public uniquement
    return {mock:false, auth, db, storage, user:u};
  }catch(err){
    console.error('[PK] Échec d’initialisation Firebase :', err);
    MOCK = true;              // repli hors-ligne : aucune donnée fantôme, états vides honnêtes
    initError = err;
    hydrate('anon').catch(()=>{});
    return {mock:true, error:err};
  }
}
/** Applique la graine de test (tests/run-all.mjs) au cache PKdata. */
function seed(){
  if(!window.__PK_SEED__) return;
  const D = window.PKdata;
  Object.keys(window.__PK_SEED__).forEach(k=>{ D[k] = window.__PK_SEED__[k]; });
}
/** Rôle connu du cache local (avant la fin de l'amorçage). */
function roleOf(){
  const m = window.PKdata.me;
  return (m && m.role) || 'anon';
}

/* ───────── 3. AUTHENTIFICATION (Google + e-mail / mot de passe) ───────── */
function authOff(){
  if(window.PK && window.PKi18n) window.PK.toast(window.PKi18n.t('notConnected'), 'wn', 3200);
  return null;
}
async function loginGoogle(){
  if(MOCK) return authOff();
  const p = new FB.fu.GoogleAuthProvider();
  p.setCustomParameters({prompt:'select_account'});
  try{
    const cred = await FB.fu.signInWithPopup(auth, p);
    return cred.user;
  }catch(e){ reportError(e); return null; }
}
async function loginEmail(email, password){
  if(MOCK) return authOff();
  try{
    const cred = await FB.fu.signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  }catch(e){ reportError(e); return null; }
}
async function registerEmail(name, email, password){
  if(MOCK) return authOff();
  try{
    const cred = await FB.fu.createUserWithEmailAndPassword(auth, email, password);
    if(name) await FB.fu.updateProfile(cred.user, {displayName:name});
    /* le nom est aussi écrit dans users/{uid} (règle : création de son propre doc) */
    if(name) await FB.ff.setDoc(FB.ff.doc(db,'users',cred.user.uid), {name}, {merge:true}).catch(()=>{});
    return cred.user;
  }catch(e){ reportError(e); return null; }
}
async function resetPassword(email){
  if(MOCK) return authOff();
  try{
    await FB.fu.sendPasswordResetEmail(auth, email);
    if(window.PK && window.PKi18n) window.PK.toast(window.PKi18n.t('resetSent'), 'ok', 4600);
    return {ok:true};
  }catch(e){ return reportError(e); }
}
async function logout(){
  window.PKdata.me = null;
  if(MOCK){ try{sessionStorage.removeItem('pk-user');}catch(e){} }
  else if(FB){ try{ await FB.fu.signOut(auth); }catch(e){ console.warn('[PK] signOut:', e && e.code); } }
  document.dispatchEvent(new CustomEvent('pk:auth',{detail:{user:null}}));
  document.dispatchEvent(new CustomEvent('pk:me',{detail:null}));
  return {ok:true};
}
function currentUser(){
  if(MOCK){ try{ const s=sessionStorage.getItem('pk-user'); return s?JSON.parse(s):null; }catch(e){ return null; } }
  return (FB && FB.fu.getAuth(auth).currentUser) || null;
}

/* ───────── 4. PROFIL : users/{uid} (source de vérité du compte) ─────────
   La fiche élève (students/{cardId}) n'est PAS lisible par l'élève : c'est
   la professeure qui la crée et qui la relie au compte. Aucune recherche
   par e-mail côté élève → plus de boucle « connexion impossible ». */
async function syncProfile(user){
  if(!user || MOCK) return null;
  const {ff} = FB;
  const ref = ff.doc(db, 'users', user.uid);
  const snap = await ff.getDoc(ref);
  if(!snap.exists()){
    const base = {
      uid:user.uid, email:user.email||'', name:user.displayName||'',
      photoURL:user.photoURL||null, role:'pending', level:null,
      interests:[], onboarded:false, linkedStudentId:null,
      createdAt: ff.serverTimestamp(), lastLoginAt: ff.serverTimestamp()
    };
    await ff.setDoc(ref, base);
    return base;
  }
  const data = snap.data() || {};
  ff.updateDoc(ref, {
    lastLoginAt: ff.serverTimestamp(),
    email: user.email || data.email || '',
    photoURL: user.photoURL || data.photoURL || null
  }).catch(e=>console.warn('[PK] lastLoginAt:', e && e.code));
  return data;
}

/* ───────── 4bis. HYDRATATION : Firestore → cache PKdata (zéro démo) ─────────
   Chaque collection est chargée indépendamment (Promise.allSettled) :
   un refus de permission sur une collection ne vide plus tout le site.  */
async function hydrate(role){
  if(MOCK || !db) return;
  const {ff} = FB, D = window.PKdata;
  const publicCols = ['lessons','exercises','announcements'];
  const tasks = publicCols.map(n => withTimeout(ff.getDocs(ff.collection(db,n)), 12000, null));
  const settled = await Promise.allSettled(tasks);
  settled.forEach((r,i)=>{
    const name = publicCols[i];
    if(r.status === 'fulfilled' && r.value)
      D[name] = r.value.docs.map(d=>({id:d.id, ...d.data()}));
    else { console.warn('[PK] hydrate '+name+':', (r.value===null) ? 'delai depasse' : (r.reason && r.reason.code)); D[name] = D[name] || []; }
  });
  await hydrateGroups(role || roleOf());
}
/** Groupes : vis='public' → tout le monde · vis='vip' → uniquement les élèves
    inscrits (vipUids) et la professeure. Les documents créés avant la mise à
    jour (sans champ vis) sont considérés publics et migrés par l'admin. */
async function hydrateGroups(role){
  if(MOCK || !db) return;
  const {ff} = FB, D = window.PKdata;
  const map = new Map();
  const push = list => list.forEach(g=>map.set(g.id, {id:g.id, ...g}));
  try{
    if(role === 'admin'){
      const all = await withTimeout(ff.getDocs(ff.collection(db,'groups')), 12000, null);
      if(all) push(all.docs.map(d=>d.data()));
    }else{
      const pub = await withTimeout(ff.getDocs(ff.query(ff.collection(db,'groups'), ff.where('vis','==','public'))), 12000, null);
      if(pub) push(pub.docs.map(d=>d.data()));
      const u = auth && auth.currentUser;
      if(u){
        const vip = await withTimeout(ff.getDocs(ff.query(ff.collection(db,'groups'), ff.where('vipUids','array-contains',u.uid))), 12000, null);
        if(vip) push(vip.docs.map(d=>d.data()));
      }
    }
  }catch(e){ console.warn('[PK] hydrate groupes:', e && e.code); }
  D.groups = Array.from(map.values());
}
/** Migration douce : les séances sans champ `vis` deviennent `vis:'public'`. */
async function migrateGroups(){
  if(MOCK || !db || !window.PKdata.me || window.PKdata.me.role !== 'admin') return {ok:true, migrated:0};
  const {ff} = FB;
  try{
    const all = await ff.getDocs(ff.collection(db,'groups'));
    const todo = all.docs.filter(d=>typeof (d.data()||{}).vis !== 'string');
    await Promise.all(todo.map(d=>ff.updateDoc(ff.doc(db,'groups',d.id), {vis:'public'})));
    return {ok:true, migrated:todo.length};
  }catch(e){ console.warn('[PK] migration groupes:', e && e.code); return {ok:false, error:e}; }
}

/** Fiche élève → objet sûr (aucun champ manquant ne casse l'affichage). */
function normalizeStudent(s){
  s = s || {};
  return Object.assign({
    ar:'', fr:'', level:null, group:null, school:null, parent:null, color:'#1E4FD8',
    xp:0, streak:0, best:0, lessonsDone:0, exDone:0, quizDone:0, correct:0, answered:0,
    mastery:{}, badges:[], status:'active', linked:false, accountEmail:null, interests:[]
  }, s, {
    mastery: (s.mastery && typeof s.mastery === 'object') ? s.mastery : {},
    badges: Array.isArray(s.badges) ? s.badges : [],
    interests: Array.isArray(s.interests) ? s.interests : []
  });
}
/** Fusionne fiches élèves + comptes + progression (l'XP vit dans progress/{uid}). */
function mergeProgress(students, users, progress){
  const byUid = new Map((users||[]).map(u=>[u.id, u]));
  const prByUid = new Map((progress||[]).map(p=>[p.id, p]));
  const prByCard = new Map();
  (progress||[]).forEach(p=>{ if(p && p.studentId) prByCard.set(p.studentId, p); });
  return (students||[]).map(card=>{
    const cardId = card.id;
    const linkedUser = (users||[]).find(u=>u && u.linkedStudentId === cardId) || null;
    const pr = (linkedUser && prByUid.get(linkedUser.id)) || prByCard.get(cardId) || null;
    const s = normalizeStudent(card);
    if(linkedUser){
      s.linked = true;
      s.accountEmail = linkedUser.email || null;
      s.accountName = linkedUser.name || null;
      s.interests = Array.isArray(linkedUser.interests) ? linkedUser.interests : [];
      s.level = s.level || linkedUser.level || null;
    } else if(s.uid && byUid.has(s.uid)){
      const u = byUid.get(s.uid); s.linked = true; s.accountEmail = u.email || null;
      s.interests = Array.isArray(u.interests) ? u.interests : [];
    }
    if(pr){
      s.xp = num(pr.xp); s.streak = num(pr.streakCurrent); s.best = num(pr.best);
      s.lessonsDone = num(pr.lessonsDone); s.exDone = num(pr.exDone); s.quizDone = num(pr.quizDone);
      s.correct = num(pr.correctTotal); s.answered = num(pr.answeredTotal); s.minutes = num(pr.minutes);
      if(pr.mastery && typeof pr.mastery === 'object') s.mastery = pr.mastery;
      if(Array.isArray(pr.badges) && pr.badges.length) s.badges = pr.badges;
      s.progressId = pr.id || null;
    }
    return s;
  });
}
const num = v => (typeof v === 'number' && !isNaN(v)) ? v : 0;

async function hydrateMe(user){
  const D = window.PKdata;
  if(MOCK || !user){ D.me = null; return null; }
  const {ff} = FB;
  try{
    const u = await ff.getDoc(ff.doc(db,'users',user.uid));
    const prof = u.exists() ? u.data() : null;
    if(!prof){ D.me = null; return null; }
    /* fiche élève liée : lisible car la professeure a écrit linkedStudentId */
    const cardId = prof.linkedStudentId || null;
    let student = null;
    if(cardId){
      try{
        const s = await ff.getDoc(ff.doc(db,'students',cardId));
        if(s.exists()) student = {id:s.id, ...s.data()};
      }catch(e){ console.warn('[PK] fiche élève:', e && e.code); }
    }
    /* progression personnelle : clé = uid (règle identique côté Firestore) */
    let pr = {};
    try{
      const pg = await ff.getDoc(ff.doc(db,'progress',user.uid));
      if(pg.exists()) pr = pg.data() || {};
    }catch(e){ console.warn('[PK] progression:', e && e.code); }
    const doneIds = Array.isArray(pr.doneLessons) ? pr.doneLessons : [];
    const me = {
      id:user.uid, uid:user.uid, cardId,
      role: prof.role || 'pending', level: prof.level || null,
      interests: Array.isArray(prof.interests) ? prof.interests : [],
      onboarded: prof.onboarded === true || !!prof.level,
      ar:prof.name||user.displayName||'', fr:prof.name||user.displayName||'',
      email:prof.email||user.email||'', photoURL:prof.photoURL||user.photoURL||null,
      group: student ? student.group : null, school: student ? student.school : null,
      linked: !!student, color: student && student.color ? student.color : '#1E4FD8',
      xp:num(pr.xp), streak:num(pr.streakCurrent), best:num(pr.best),
      lessonsDone:num(pr.lessonsDone), exDone:num(pr.exDone), quizDone:num(pr.quizDone),
      correct:num(pr.correctTotal), answered:num(pr.answeredTotal), minutes:num(pr.minutes),
      mastery: (pr.mastery && typeof pr.mastery==='object') ? pr.mastery : {},
      badges: Array.isArray(pr.badges) ? pr.badges : [], doneIds
    };
    D.me = me;
    D.lessons.forEach(l=>{ l.done = doneIds.includes(l.id); });
    D.groups.forEach(g=>{ if(g && g.level && !g.cls) g.cls = 'lv-'+(String(g.level).toLowerCase()); });
    /* messages de la professeure adressés à cet élève (destinataire = uid) */
    try{
      const mq = ff.query(ff.collection(db,'messages'), ff.where('to','==',user.uid));
      const ms = await ff.getDocs(mq);
      D.myMessages = ms.docs.map(d=>normalizeMsg({id:d.id, ...d.data()}));
    }catch(e){ console.warn('[PK] messages perso:', e && e.code); D.myMessages = D.myMessages || []; }

    /* la professeure voit l'ensemble : élèves, comptes, progression, messages */
    if(prof.role === 'admin'){
      let students = [], users = [], progress = [], messages = [];
      try{ const st = await withTimeout(ff.getDocs(ff.collection(db,'students')), 15000, null); if(st) students = st.docs.map(d=>({id:d.id, ...d.data()})); }catch(e){ console.warn('[PK] students:', e && e.code); }
      try{ const us = await withTimeout(ff.getDocs(ff.collection(db,'users')), 15000, null);    if(us) users    = us.docs.map(d=>({id:d.id, ...d.data()})); }catch(e){ console.warn('[PK] users:', e && e.code); }
      try{ const pg = await withTimeout(ff.getDocs(ff.collection(db,'progress')), 15000, null); if(pg) progress = pg.docs.map(d=>({id:d.id, ...d.data()})); }catch(e){ console.warn('[PK] progress:', e && e.code); }
      try{ const ms = await withTimeout(ff.getDocs(ff.collection(db,'messages')), 15000, null); if(ms) messages = ms.docs.map(d=>({id:d.id, ...normalizeMsg(d.data())})); }catch(e){ console.warn('[PK] messages:', e && e.code); }
      D.students = mergeProgress(students, users, progress);
      D.users = users;
      D.progress = progress;
      D.messages = messages;
    }
    return me;
  }catch(e){ console.warn('[PK] hydrateMe:', e && e.code); D.me = null; return null; }
}

/* ───────── 4ter. INSCRIPTION : niveau + intérêts (1re connexion) ───────── */
async function completeOnboarding(data){
  data = data || {};
  const level = data.level || null;
  const interests = Array.isArray(data.interests) ? data.interests : [];
  const name = (data.name || '').trim();
  if(!level) return {ok:false, message:window.PKi18n ? window.PKi18n.t('chooseLevelTitle') : 'اختر مستواك'};
  const D = window.PKdata;
  if(MOCK){
    D.me = Object.assign({}, D.me || {}, {name:name||(D.me&&D.me.ar)||'', ar:name||(D.me&&D.me.ar)||'', fr:name||(D.me&&D.me.fr)||'',
      level, interests, onboarded:true, role:(D.me&&D.me.role==='admin')?'admin':'student'});
    try{ sessionStorage.setItem('pk-user', JSON.stringify(D.me)); }catch(e){}
    document.dispatchEvent(new CustomEvent('pk:me',{detail:D.me}));
    return {ok:true, mock:true};
  }
  const u = currentUser();
  if(!u) return {ok:false, message:friendlyError({code:'permission-denied'})};
  const {ff} = FB;
  const patch = {
    level, interests, onboarded:true, onboardedAt:ff.serverTimestamp(),
    name: name || (D.me && D.me.ar) || u.displayName || ''
  };
  /* la promotion pending → student est la seule transition autorisée */
  if(!(D.me && D.me.role === 'admin')) patch.role = 'student';
  try{
    await ff.updateDoc(ff.doc(db,'users',u.uid), patch);
    await hydrateMe(u);
    document.dispatchEvent(new CustomEvent('pk:me',{detail:D.me}));
    return {ok:true};
  }catch(e){ return reportError(e); }
}
/** Conservé pour compatibilité : choix du niveau seul. */
async function chooseLevel(lv){
  const r = await completeOnboarding(Object.assign({}, (window.PKdata.me||{}), {level:lv}));
  return r;
}

/* ───────── 5. LECTURES ───────── */
function col(name){
  if(MOCK){
    const map = {
      settings:[window.PKdata.settings], levels:window.PKdata.levels, axes:window.PKdata.axes,
      lessons:window.PKdata.lessons, exercises:window.PKdata.exercises, quizzes:window.PKdata.exercises,
      groups:window.PKdata.groups, students:window.PKdata.students, users:window.PKdata.users,
      announcements:window.PKdata.announcements, submissions:[], progress:window.PKdata.progress,
      messages:window.PKdata.messages
    };
    return Promise.resolve(map[name] || []);
  }
  const {ff} = FB;
  return ff.getDocs(ff.collection(db,name)).then(s=>s.docs.map(d=>({...d.data(), id:d.id})));
}
function docGet(name,id){
  if(MOCK){
    const all = {lessons:window.PKdata.lessons, exercises:window.PKdata.exercises,
      groups:window.PKdata.groups, students:window.PKdata.students, users:window.PKdata.users,
      announcements:window.PKdata.announcements};
    return Promise.resolve((all[name]||[]).find(x=>x.id===id) || null);
  }
  const {ff} = FB;
  return ff.getDoc(ff.doc(db,name,id)).then(s=> s.exists() ? {...s.data(), id:s.id} : null);
}
function settings(){
  if(MOCK) return Promise.resolve(window.PKdata.settings);
  return docGet('settings','main');
}

/* ───────── 6. ÉCRITURES (admin) ───────── */
function guard(){
  if(MOCK){ window.PK.toast(window.PKi18n.t('mockTag'),'wn'); return false; }
  return true;
}
/* En mode démo, les écritures aboutissent silencieusement au lieu de rejeter. */
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
function set(name,id,data){
  if(!guard()) return mockWrite('set',name,id,data);
  const {ff}=FB;
  return ff.setDoc(ff.doc(db,name,id), data, {merge:true})
    .then(r=>{ cacheSync('set',name,id,data); return {ok:true, id, res:r}; })
    .catch(e=> reportError(e));
}
function add(name,data){
  if(!guard()) return mockWrite('add',name,null,data);
  const {ff}=FB;
  return ff.addDoc(ff.collection(db,name), {...data, createdAt:ff.serverTimestamp()})
    .then(r=>{ cacheSync('add',name,r.id,data); return {ok:true, id:r.id, res:r}; })
    .catch(e=> reportError(e));
}
function remove(name,id){
  if(!guard()) return mockWrite('remove',name,id);
  const {ff}=FB;
  return ff.deleteDoc(ff.doc(db,name,id))
    .then(r=>{ cacheSync('remove',name,id); return {ok:true, id, res:r}; })
    .catch(e=> reportError(e));
}
/** Relie un compte (users/{uid}) à une fiche élève (students/{cardId}). */
async function linkStudent(cardId, uid){
  if(MOCK){ window.PK.toast(window.PKi18n.t('mockTag'),'wn'); return {ok:true, mock:true}; }
  const {ff}=FB;
  const user = (window.PKdata.users||[]).find(u=>u.id===uid);
  try{
    if(user && user.linkedStudentId && user.linkedStudentId !== cardId){
      await ff.updateDoc(ff.doc(db,'students',user.linkedStudentId), {uid:ff.deleteField(), linked:false}).catch(()=>{});
    }
    await ff.updateDoc(ff.doc(db,'users',uid), {linkedStudentId:cardId, role:'student'});
    await ff.setDoc(ff.doc(db,'students',cardId),
      {uid, linked:true, googleEmail:(user && user.email) || null}, {merge:true});
    const i = (window.PKdata.users||[]).findIndex(u=>u.id===uid);
    if(i>=0) window.PKdata.users[i] = Object.assign({}, window.PKdata.users[i], {linkedStudentId:cardId, role:'student'});
    return {ok:true};
  }catch(e){ return reportError(e); }
}
/** Détache un compte de sa fiche élève. */
async function unlinkStudent(cardId, uid){
  if(MOCK){ window.PK.toast(window.PKi18n.t('mockTag'),'wn'); return {ok:true, mock:true}; }
  const {ff}=FB;
  try{
    await ff.updateDoc(ff.doc(db,'users',uid), {linkedStudentId:null});
    await ff.setDoc(ff.doc(db,'students',cardId), {uid:ff.deleteField(), linked:false, googleEmail:ff.deleteField()}, {merge:true});
    const i = (window.PKdata.users||[]).findIndex(u=>u.id===uid);
    if(i>=0) window.PKdata.users[i] = Object.assign({}, window.PKdata.users[i], {linkedStudentId:null});
    return {ok:true};
  }catch(e){ return reportError(e); }
}

/* ───────── 6bis. PARAMÈTRES DU SITE (modifiables depuis l'admin) ───────── */
const SET_KEY = 'pk-settings';

function applySettings(patch){
  if(!patch || typeof patch !== 'object') return window.PKdata.settings;
  const S = window.PKdata.settings;
  Object.keys(patch).forEach(k=>{
    if(patch[k] && typeof patch[k]==='object' && !Array.isArray(patch[k]) && S[k] && typeof S[k]==='object')
      Object.assign(S[k], patch[k]);
    else S[k] = patch[k];
  });
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

function loadSettings(){
  try{
    const raw = localStorage.getItem(SET_KEY);
    if(raw) applySettings(JSON.parse(raw));
  }catch(e){}
  if(MOCK) return Promise.resolve(window.PKdata.settings);
  return withTimeout(docGet('settings','main'), 8000, null)
    .then(doc=>{ if(doc) applySettings(doc); return window.PKdata.settings; })
    .catch(()=> window.PKdata.settings);
}

function saveSettings(patch){
  applySettings(patch);
  try{
    const S = window.PKdata.settings;
    localStorage.setItem(SET_KEY, JSON.stringify(S));
  }catch(e){}
  if(MOCK) return Promise.resolve({ok:true, mock:true, settings:window.PKdata.settings});
  const {ff} = FB;
  return ff.setDoc(ff.doc(db,'settings','main'), patch, {merge:true})
    .then(()=>({ok:true, settings:window.PKdata.settings}))
    .catch(e=> reportError(e));
}

function resetSettings(){
  try{ localStorage.removeItem(SET_KEY); }catch(e){}
  if(MOCK){ location.reload(); return Promise.resolve({ok:true}); }
  const {ff} = FB;
  return ff.deleteDoc(ff.doc(db,'settings','main'))
    .then(()=>location.reload())
    .catch(e=> reportError(e));
}

/* ───────── 7. PROGRESSION (XP) — clé : uid du compte connecté ───────── */
async function saveSubmission(sub){
  if(MOCK){ console.info('[PK][démo] submission', sub); return {ok:true, mock:true}; }
  const u = currentUser();
  if(!u) return reportError({code:'permission-denied'});
  const {ff}=FB, D = window.PKdata;
  const cardId = (D.me && D.me.cardId) || null;
  const payload = Object.assign({}, sub, {
    studentId: u.uid, cardId, type: sub.type || 'exercise', at: ff.serverTimestamp()
  });
  try{
    await ff.addDoc(ff.collection(db,'submissions'), payload);
    const ref = ff.doc(db,'progress',u.uid);
    await ff.setDoc(ref, {
      studentId:u.uid, cardId,
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
    if((sub.correct||0) > num(cur.best)) upd.best = sub.correct;
    if(sub.ax && typeof sub.pct==='number'){
      const m = Object.assign({}, cur.mastery||{});
      m[sub.ax] = Math.max(m[sub.ax]||0, sub.pct);
      upd.mastery = m;
    }
    Object.assign(upd, bumpStreak(cur)||{});
    if(Object.keys(upd).length) await ff.setDoc(ref, upd, {merge:true});
    return {ok:true};
  }catch(e){ return reportError(e); }
}
/* Série quotidienne : +1 si hier était actif, sinon repart à 1 (jamais négatif) */
function bumpStreak(cur){
  const today = new Date().toISOString().slice(0,10);
  const last = cur.lastDay||'';
  if(last === today) return null;
  const yesterday = new Date(Date.now()-864e5).toISOString().slice(0,10);
  return {streakCurrent: (last===yesterday ? (cur.streakCurrent||0)+1 : 1), lastDay:today};
}
/** Marque une leçon terminée : idempotent (jamais deux fois le même XP). */
async function markLessonDone(lessonId, studentId, xp){
  if(MOCK){
    const D=window.PKdata;
    const l=(D.lessons||[]).find(x=>x.id===lessonId); if(l) l.done=true;
    if(D.me){ D.me.xp=(D.me.xp||0)+(xp||25); D.me.lessonsDone=(D.me.lessonsDone||0)+1;
      D.me.doneIds = D.me.doneIds||[]; if(!D.me.doneIds.includes(lessonId)) D.me.doneIds.push(lessonId); }
    return {ok:true,mock:true};
  }
  const u = currentUser();
  if(!u) return reportError({code:'permission-denied'});
  const {ff}=FB, D = window.PKdata;
  const cardId = (D.me && D.me.cardId) || null;
  const ref = ff.doc(db,'progress', u.uid);
  try{
    const snap = await ff.getDoc(ref);
    const cur = snap.exists()? snap.data():{};
    const done = Array.isArray(cur.doneLessons) ? cur.doneLessons : [];
    if(done.includes(lessonId)){                 // déjà validée : aucun XP en double
      const l=(D.lessons||[]).find(x=>x.id===lessonId); if(l) l.done=true;
      return {ok:true, already:true};
    }
    await ff.setDoc(ff.doc(db,'lessonsDone', u.uid+'_'+lessonId),
      {studentId:u.uid, cardId, lessonId, at:ff.serverTimestamp()});
    await ff.setDoc(ref,
      {studentId:u.uid, cardId,
       lessonsDone: ff.increment(1), xp: ff.increment(xp||25),
       doneLessons: ff.arrayUnion(lessonId), lastActivity:ff.serverTimestamp()}, {merge:true});
    const st = bumpStreak(cur);
    if(st) await ff.setDoc(ref, st, {merge:true});
    return {ok:true};
  }catch(e){ return reportError(e); }
}

/* ───────── 7bis. DATES ───────── */
/** Convertit un Timestamp Firestore / Date / chaîne en texte lisible. */
function when(ts, withTime){
  try{
    let d = null;
    if(ts && typeof ts.toDate === 'function') d = ts.toDate();
    else if(ts instanceof Date) d = ts;
    else if(typeof ts === 'number' || (typeof ts === 'string' && ts)) d = new Date(ts);
    if(!d || isNaN(d.getTime())) return '';
    const lang = (window.PKi18n && window.PKi18n.current && window.PKi18n.current()) || 'ar';
    const opts = {year:'numeric', month:'2-digit', day:'2-digit'};
    if(withTime){ opts.hour='2-digit'; opts.minute='2-digit'; }
    return new Intl.DateTimeFormat(lang==='ar' ? 'ar-DZ' : 'fr-FR', opts).format(d);
  }catch(e){ return ''; }
}
/** Message → champs d'affichage (date lisible, jamais « undefined »). */
function normalizeMsg(m){
  m = m || {};
  const d = when(m.at, true) || m.when || m.date || '';
  return Object.assign({}, m, {d, body: m.body || '', from: m.from || ''});
}
const today = () => new Date().toISOString().slice(0,10);

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

/* ───────── 9. TESTS AUTOMATISÉS (invisible dans l'interface) ───────── */
function _testSession(u){
  if(!MOCK) return null;
  window.PKdata.me = u;
  try{ sessionStorage.setItem('pk-user', JSON.stringify(u)); }catch(e){}
  document.dispatchEvent(new CustomEvent('pk:me',{detail:u}));
  return u;
}

/* ───────── 10. EXPORT ───────── */
window.PKdb = {
  init, get MOCK(){return MOCK;}, get mock(){return MOCK;}, get failed(){return !!initError;},
  loginGoogle, loginEmail, registerEmail, resetPassword, logout, currentUser, syncProfile,
  col, docGet, settings, set, add, remove, linkStudent, unlinkStudent,
  loadSettings, saveSettings, applySettings, resetSettings,
  saveSubmission, markLessonDone, upload,
  hydrate, hydrateGroups, hydrateMe, completeOnboarding, chooseLevel, _testSession,
  migrateGroups, normalizeStudent, mergeProgress, when, normalizeMsg, today, friendlyError, reportError,
  get fb(){return {app,auth,db,storage,FB};}
};
})();
