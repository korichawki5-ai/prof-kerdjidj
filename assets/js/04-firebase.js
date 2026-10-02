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
    /* retour d'une connexion par redirection (mobile) : on remonte l'erreur
       éventuelle pour que l'interface l'affiche en clair */
    fu.getRedirectResult(auth).catch(err=>{
      if(err && err.code && err.code !== 'auth/no-auth-event')
        document.dispatchEvent(new CustomEvent('pk:auth-error',{detail:friendly(err)}));
    });
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
    if(currentUser()) await hydrate();   // relecture après connexion (groupes…)
    return {mock:false, auth, db, storage};
  }catch(err){
    console.error('[PK] Échec d’initialisation Firebase :', err);
    MOCK = true;   // repli hors-ligne : aucune donnée fantôme, états vides honnêtes
    return {mock:true, error:err};
  }
}

/* ───────── 3. AUTHENTIFICATION GOOGLE ───────── */
/* Erreurs Firebase → phrase claire (AR ⇄ FR). Aucun échec silencieux. */
const ERR = {
  'permission-denied':   ['ليست لديك صلاحية لهذا الإجراء — تأكّدي من تسجيل الدخول بحساب الأستاذة، ومن نشر قواعد Firestore الجديدة.',
                          'Action non autorisée — connectez-vous avec le compte admin et vérifiez les règles Firestore.'],
  'unavailable':         ['تعذّر الاتصال بالخادم — تحقّقي من اتصال الإنترنت ثم أعيدي المحاولة.',
                          'Serveur injoignable — vérifiez votre connexion puis réessayez.'],
  'unauthenticated':     ['انتهت الجلسة — أعيدي تسجيل الدخول.', 'Session expirée — reconnectez-vous.'],
  'failed-precondition': ['العملية مرفوضة من قاعدة البيانات (شرط غير محقّق أو فهرس ناقص).',
                          'Opération refusée par la base (index manquant ou condition non remplie).'],
  'resource-exhausted':  ['تم تجاوز الحصة المجانية مؤقتاً — أعيدي المحاولة بعد قليل.',
                          'Quota momentanément dépassé — réessayez dans un instant.'],
  'not-found':           ['العنصر المطلوب غير موجود.', 'Élément introuvable.'],
  'invalid-argument':    ['بيانات غير صالحة — تحقّقي من الحقول المدخلة.', 'Données invalides — vérifiez les champs.'],
  'auth/popup-blocked':  ['المتصفح منع نافذة الدخول — سنعيد المحاولة بصفحة كاملة…',
                          'Le navigateur a bloqué la fenêtre — nouvelle tentative en pleine page…'],
  'auth/popup-closed-by-user': ['أُغلقت نافذة الدخول قبل إتمامه — أعيدي المحاولة.',
                          'Fenêtre fermée avant la fin — réessayez.'],
  'auth/cancelled-popup-request': ['نافذة دخول واحدة في كل مرة — أعيدي المحاولة.',
                          'Une seule fenêtre à la fois — réessayez.'],
  'auth/unauthorized-domain': ['هذا النطاق غير مصرّح به في Firebase → Authentication → Authorized domains. أضيفي نطاق الموقع (prof-kerdjidj.web.app و prof-kerdjidj.firebaseapp.com) ثم أعيدي المحاولة.',
                          'Domaine non autorisé dans Firebase → Authentication → Authorized domains. Ajoutez prof-kerdjidj.web.app puis réessayez.'],
  'auth/operation-not-allowed': ['تسجيل الدخول بـ Google غير مفعّل — فعّليه من Firebase Console → Authentication → Sign-in method.',
                          'Connexion Google désactivée — activez-la dans Firebase Console → Authentication → Sign-in method.'],
  'auth/network-request-failed': ['تعذّر الوصول إلى خدمة الدخول — تحقّقي من الإنترنت.',
                          'Service de connexion injoignable — vérifiez la connexion.'],
  'auth/internal-error': ['خطأ داخلي في خدمة الدخول — أعيدي المحاولة.', 'Erreur interne du service de connexion — réessayez.'],
  'auth/account-exists-with-different-credential': ['هذا البريد مسجَّل بطريقة دخول أخرى.', 'Cet e-mail utilise un autre mode de connexion.'],
  'auth/web-storage-unsupported': ['المتصفح يمنع تخزين الجلسة — افتحي الموقع في نافذة عادية (لا وضع خاص).',
                          'Le navigateur bloque le stockage — ouvrez le site dans une fenêtre normale.'],
  'storage-off':         ['رفع الملفات غير متاح (خدمة التخزين صارت مدفوعة) — الصقي رابط Google Drive أو YouTube.',
                          'Envoi de fichiers indisponible (stockage payant) — collez un lien Google Drive ou YouTube.'],
  'pk/reg-name':         ['الاسم واللقب غير مكتمل — اكتب الاسم واللقب كاملين (3 أحرف على الأقل).',
                          'Nom et prénom incomplets (3 caractères minimum).'],
  'pk/reg-level':        ['لم يتم اختيار القسم/المستوى — اختر قسمك من القائمة.',
                          'Niveau non sélectionné — choisissez votre niveau.'],
  'pk/reg-phone':        ['رقم هاتف الولي غير صحيح — اكتب 10 أرقام (مثال: 0555000000).',
                          'Téléphone du parent invalide — 10 chiffres (ex. : 0555000000).'],
  'pk/reg-mail':         ['البريد الإلكتروني غير صالح — تحقّق من الكتابة (مثال: nom@gmail.com).',
                          'Adresse e-mail invalide (ex. : nom@gmail.com).']
};
function friendly(err){
  const code = (err && (err.code || err.name)) || '';
  const pair = ERR[code];
  const ar = window.PKi18n ? window.PKi18n.current() === 'ar' : true;
  const msg = pair ? (ar ? pair[0] : pair[1])
            : (ar ? 'حدث خطأ غير متوقّع — أعيدي المحاولة.' : 'Une erreur inattendue est survenue — réessayez.');
  if(window.console && console.warn) console.warn('[PK] erreur :', code || err, err);
  const e = new Error(msg); e.code = code; e.friendly = msg; e.raw = err;
  return e;
}
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
  try{
    const cred = await FB.fu.signInWithPopup(auth, p);
    return cred.user;
  }catch(err){
    const code = (err && err.code) || '';
    /* Sur mobile — et dans les navigateurs intégrés (Facebook/Instagram) —
       la fenêtre surgissante est presque toujours bloquée : on bascule
       automatiquement sur la connexion en pleine page, qui marche partout. */
    if(code === 'auth/popup-blocked'
    || code === 'auth/operation-not-supported-in-this-environment'
    || code === 'auth/cancelled-popup-request'
    || code === 'auth/web-storage-unsupported'){
      try{ await FB.fu.signInWithRedirect(auth, p); return null; }
      catch(err2){ throw friendly(err2); }
    }
    throw friendly(err);
  }
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

/* ───────── 4. PROFIL : liaison compte Google ↔ fiche élève ─────────
   · la professeure crée la fiche élève AVEC l'e-mail Google ;
   · au premier login, on retrouve la fiche par l'index studentLinks/{email}
     (l'élève ne peut pas lister la collection students) → role « student » ;
   · sans fiche → role « pending » : l'espace élève reste accessible
     (contenu de révision) mais l'élève voit « en attente de confirmation ». */
async function findMyFiche(user){
  const {ff} = FB;
  const mail = String((user && user.email) || '').toLowerCase();
  if(!mail) return null;
  /* 1) index fiable : studentLinks/{email} → studentId */
  try{
    const link = await ff.getDoc(ff.doc(db,'studentLinks',mail));
    if(link.exists() && link.data().studentId){
      const s = await ff.getDoc(ff.doc(db,'students',link.data().studentId));
      if(s.exists()) return {id:s.id, ...s.data()};
    }
  }catch(e){ /* index absent ou non autorisé → on tente la requête */ }
  /* 2) repli : fiche portant googleEmail == mon e-mail (règle list ciblée) */
  try{
    const q = ff.query(ff.collection(db,'students'), ff.where('googleEmail','==',mail));
    const qs = await ff.getDocs(q);
    if(!qs.empty) return {id:qs.docs[0].id, ...qs.docs[0].data()};
  }catch(e){}
  return null;
}
async function syncProfile(user){
  if(!user || MOCK) return null;
  const {ff} = FB;
  const ref = ff.doc(db, 'users', user.uid);
  const snap = await ff.getDoc(ref);
  if(snap.exists()){
    const data = snap.data();
    const patch = {lastLoginAt: ff.serverTimestamp(),
      email: user.email || data.email || '',
      photoURL: user.photoURL || data.photoURL || null};
    /* Élève pas encore relié à sa fiche : on retente la liaison à chaque
       connexion (la professeure a pu créer la fiche entre-temps).
       Jamais de rétrogradation d'un compte admin. */
    if(!data.linkedStudentId && data.role !== 'admin'){
      const st = await findMyFiche(user);
      if(st){
        patch.linkedStudentId = st.id;
        patch.role = 'student';
        if(st.level && !data.level) patch.level = st.level;
      }
    }
    try{ await ff.updateDoc(ref, patch); }
    catch(e){ console.warn('[PK] mise à jour du profil refusée :', (e && e.code) || e); }
    return Object.assign({}, data, patch, {lastLoginAt: data.lastLoginAt});
  }
  /* premier passage : on cherche la fiche créée par la professeure */
  const student = await findMyFiche(user);
  const prof = {
    uid:user.uid, email:user.email, name:user.displayName || user.email,
    photoURL:user.photoURL || null,
    role: student ? 'student' : 'pending',
    linkedStudentId: student ? student.id : null,
    level: (student && student.level) ? student.level : null,
    createdAt: ff.serverTimestamp(), lastLoginAt: ff.serverTimestamp()
  };
  await ff.setDoc(ref, prof);   // si la règle refuse : l'erreur remonte à l'appelant
  return prof;
}
/* Enregistre les informations modifiables par l'élève lui-même. */
async function saveMyProfile(patch){
  if(MOCK){ const D=window.PKdata; if(D.me) Object.assign(D.me, patch); return {ok:true, mock:true}; }
  const u = currentUser();
  if(!u) return {ok:false, error:'not-signed', msg:friendly({code:'unauthenticated'}).friendly};
  const allowed = ['name','photoURL'];
  const clean = {};
  allowed.forEach(k=>{ if(typeof patch[k] === 'string' && patch[k].trim()) clean[k] = patch[k].trim().slice(0,80); });
  if(!Object.keys(clean).length) return {ok:false, error:'empty'};
  const {ff} = FB;
  try{
    await ff.setDoc(ff.doc(db,'users',u.uid), clean, {merge:true});
    if(window.PKdata.me) Object.assign(window.PKdata.me, clean, {ar:clean.name||window.PKdata.me.ar, fr:clean.name||window.PKdata.me.fr});
    document.dispatchEvent(new CustomEvent('pk:me',{detail:window.PKdata.me}));
    return {ok:true};
  }catch(err){ const e = friendly(err); return {ok:false, error:e.code, msg:e.friendly}; }
}
/* ── Admin : index e-mail → fiche (créé/écrit uniquement par la professeure) ── */
async function linkStudent(email, studentId){
  if(MOCK) return {ok:true, mock:true};
  const mail = String(email||'').trim().toLowerCase();
  if(!mail || !studentId) return {ok:false, error:'invalid'};
  const {ff} = FB;
  try{
    await ff.setDoc(ff.doc(db,'studentLinks',mail), {studentId, email:mail, at:ff.serverTimestamp()});
    await ff.setDoc(ff.doc(db,'students',studentId), {googleEmail:mail, linked:true}, {merge:true});
    return {ok:true};
  }catch(err){ const e = friendly(err); return {ok:false, error:e.code, msg:e.friendly}; }
}
/* Recrée l'index studentLinks à partir des fiches ayant déjà un googleEmail
   (migration douce : aucune donnée supprimée ni modifiée, uniquement l'index). */
async function backfillLinks(){
  if(MOCK) return {ok:true, added:0, mock:true};
  const {ff} = FB;
  try{
    const snap = await ff.getDocs(ff.collection(db,'students'));
    let added = 0;
    for(const d of snap.docs){
      const mail = String(d.data().googleEmail||'').trim().toLowerCase();
      if(!mail) continue;
      await ff.setDoc(ff.doc(db,'studentLinks',mail), {studentId:d.id, email:mail, at:ff.serverTimestamp()});
      added++;
    }
    return {ok:true, added};
  }catch(err){ const e = friendly(err); return {ok:false, error:e.code, msg:e.friendly}; }
}
/* ── Admin : demandes en attente (comptes sans fiche reliée) ── */
async function pendingUsers(){
  if(MOCK) return [];
  const {ff} = FB;
  try{
    const q = ff.query(ff.collection(db,'users'), ff.where('role','==','pending'));
    const s = await ff.getDocs(q);
    return s.docs.map(d=>({id:d.id, ...d.data()}));
  }catch(err){ const e = friendly(err); if(window.console) console.warn('[PK] pending :', e.code); return []; }
}
/* ── Admin : confirmer un compte en attente (rôle + fiche reliée) ── */
async function approveUser(userId, studentId){
  if(MOCK) return {ok:true, mock:true};
  const {ff} = FB;
  try{
    const patch = {role:'student'};
    if(studentId) patch.linkedStudentId = studentId;
    await ff.setDoc(ff.doc(db,'users',userId), patch, {merge:true});
    return {ok:true};
  }catch(err){ const e = friendly(err); return {ok:false, error:e.code, msg:e.friendly}; }
}

/* ───────── 4ter. طلبات التسجيل (استمارة التلميذ بلا حساب) ─────────
   التلميذ يكتب معلوماته → تُحفظ في مجموعة registrations (سطر واحد لكل
   طلب، بلا قراءة ولا تعديل من الزوّار) → تظهر للأستاذة في لوحتها.
   القواعد تتحقّق من شكل الطلب ومن توقيته، فلا يستطيع أحد التلاعب.      */
const REG_MAX = {name:80, level:10, birth:10, parentPhone:20, email:120, school:120, note:600};
async function addRegistration(d){
  d = d || {};
  const clean = {status:'new'};
  Object.keys(REG_MAX).forEach(k=>{ clean[k] = String(d[k]==null?'':d[k]).trim().slice(0, REG_MAX[k]); });
  clean.email = clean.email.toLowerCase();
  if(clean.name.length < 3)      throw friendly({code:'pk/reg-name'});
  if(!clean.level)               throw friendly({code:'pk/reg-level'});
  if(clean.parentPhone.replace(/\D/g,'').length < 9) throw friendly({code:'pk/reg-phone'});
  if(clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) throw friendly({code:'pk/reg-mail'});
  if(MOCK){
    const id = 'local_'+Date.now().toString(36);
    const doc = Object.assign({}, clean, {id, at:new Date().toISOString()});
    if(Array.isArray(window.PKdata.registrations)) window.PKdata.registrations.unshift(doc);
    return {ok:true, mock:true, id};
  }
  if(!db) throw friendly({code:'unavailable'});
  const {ff} = FB;
  const r = await ff.addDoc(ff.collection(db,'registrations'), Object.assign({}, clean, {at: ff.serverTimestamp()}));
  return {ok:true, id:r.id};
}
/** الأستاذة فقط: كل الطلبات، الأحدث أولاً. */
async function listRegistrations(){
  if(MOCK) return (window.PKdata.registrations||[]).slice();
  const {ff} = FB;
  const snap = await ff.getDocs(ff.collection(db,'registrations'));
  const out = snap.docs.map(d=>({id:d.id, ...d.data()}));
  out.sort((a,b)=>{
    const ta = (a.at && a.at.seconds) || 0, tb = (b.at && b.at.seconds) || 0;
    return tb - ta;
  });
  return out;
}
async function setRegistration(id, patch){
  if(MOCK){
    const list = window.PKdata.registrations||[];
    const i = list.findIndex(r=>r.id===id);
    if(i>=0) Object.assign(list[i], patch);
    return {ok:true, mock:true};
  }
  const {ff} = FB;
  await ff.updateDoc(ff.doc(db,'registrations',id), patch);
  return {ok:true};
}
async function delRegistration(id){
  if(MOCK){
    window.PKdata.registrations = (window.PKdata.registrations||[]).filter(r=>r.id!==id);
    return {ok:true, mock:true};
  }
  const {ff} = FB;
  await ff.deleteDoc(ff.doc(db,'registrations',id));
  return {ok:true};
}

/* ───────── 4bis. HYDRATATION : Firestore → cache PKdata (zéro démo) ─────────
   Tout le contenu visible vient de la base : ce que la professeure publie.
   hydrate()      : collections publiques (leçons, exercices, annonces, groupes)
   hydrateMe(user): profil réel = users/{uid} + progress + fiche élève liée   */
async function hydrate(){
  if(MOCK || !db) return;
  const {ff} = FB, D = window.PKdata;
  /* allSettled : si UNE collection est refusée (règles, réseau), les autres
     sont quand même chargées — avant, tout le site restait vide. */
  const jobs = [
    ['lessons',       ()=>ff.getDocs(ff.collection(db,'lessons'))],
    ['exercises',     ()=>ff.getDocs(ff.collection(db,'exercises'))],
    ['announcements', ()=>ff.getDocs(ff.collection(db,'announcements'))],
    ['groups',        ()=>ff.getDocs(ff.collection(db,'groups'))]
  ];
  const res = await Promise.allSettled(jobs.map(j=>j[1]()));
  res.forEach((r,i)=>{
    const key = jobs[i][0];
    if(r.status === 'fulfilled') D[key] = r.value.docs.map(d=>({id:d.id, ...d.data()}));
    else if(window.console) console.warn('[PK] lecture « '+key+' » refusée :', (r.reason && r.reason.code) || r.reason);
  });
}
async function hydrateMe(user){
  const D = window.PKdata;
  if(MOCK || !user){ D.me = null; return null; }
  const {ff} = FB;
  try{
    const u = await ff.getDoc(ff.doc(db,'users',user.uid));
    let prof = u.exists() ? u.data() : null;
    if(!prof){
      /* profil manquant : on tente de le (re)créer une fois — puis, en dernier
         recours, on affiche un profil minimal « pending » plutôt que de
         renvoyer l'élève vers un écran de connexion sans fin. */
      try{ prof = await syncProfile(user); }catch(e){ console.warn('[PK] création du profil refusée :', (e&&e.code)||e); }
      if(!prof){
        D.me = {id:user.uid, uid:user.uid, role:'pending', level:null,
                ar:user.displayName||'', fr:user.displayName||'', email:user.email||'',
                photoURL:user.photoURL||null, group:null, school:null, linked:false,
                xp:0, streak:0, best:0, lessonsDone:0, exDone:0, quizDone:0,
                correct:0, answered:0, minutes:0, mastery:{}, badges:[], doneIds:[]};
        return D.me;
      }
    }
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
      }catch(e){ console.warn('[PK] lecture « students » refusée :', (e&&e.code)||e); }
      try{
        const ms = await ff.getDocs(ff.collection(db,'messages'));
        D.messages = ms.docs.map(d=>({id:d.id, ...d.data()}));
      }catch(e){ console.warn('[PK] lecture « messages » refusée :', (e&&e.code)||e); }
      try{ D.pending = await pendingUsers(); }
      catch(e){ D.pending = []; }
      try{ D.registrations = await listRegistrations(); }
      catch(e){ console.warn('[PK] lecture « registrations » refusée :', (e&&e.code)||e); D.registrations = []; }
    }
    return me;
  }catch(e){ console.warn('[PK] hydrateMe:', (e&&e.code)||e, e); D.me = null; return null; }
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
  const u = currentUser();
  if(!u){
    const e = friendly({code:'unauthenticated'});
    return {ok:false, error:e.code, msg:e.friendly};
  }
  const {ff} = FB;
  const ref = ff.doc(db,'users',u.uid);
  try{
    let role = 'student';
    try{
      const cur = await ff.getDoc(ref);
      if(cur.exists() && cur.data().role === 'admin') role = 'admin';
    }catch(e){ /* document illisible : on écrit le minimum utile */ }
    /* setDoc + merge : crée le document s'il manque, sinon le complète.
       On n'écrit JAMAIS le rôle admin depuis le client. */
    await ff.setDoc(ref, {level:lv, role}, {merge:true});
  }catch(err){
    const e = friendly(err);
    return {ok:false, error:e.code, msg:e.friendly};
  }
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
  loginGoogle, logout, currentUser, syncProfile, saveMyProfile,
  findMyFiche, linkStudent, backfillLinks, pendingUsers, approveUser,
  addRegistration, listRegistrations, setRegistration, delRegistration,
  col, docGet, settings, set, add, remove,
  loadSettings, saveSettings, applySettings, resetSettings,
  saveSubmission, markLessonDone, upload,
  hydrate, hydrateMe, chooseLevel, _testSession,
  friendly, errMsg: (e)=>friendly(e).friendly,
  get fb(){return {app,auth,db,storage,FB};}
};
})();
