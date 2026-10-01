/* ══════════════════════════════════════════════════════════════════
   03-data.js · DONNÉES DE DÉMONSTRATION
   ⚠️ Contenu fictif mais réaliste. En production, tout vient de Firestore
      (voir 04-firebase.js) et se pilote depuis admin/settings.html
   ══════════════════════════════════════════════════════════════════ */
window.PKdata = (function(){

/* ───────── PARAMÈTRES DU SITE ───────── */
const settings = {
  siteNameAr:"منصة الأستاذة كرجيج للغة الفرنسية",
  siteNameFr:"Plateforme Prof. Kerdjidj — Français",
  teacherNameAr:"الأستاذة كرجيج", teacherNameFr:"Prof. Kerdjidj",
  sloganAr:"الفرنسية بإتقان… من المتوسط إلى شهادة BEM",
  sloganFr:"Le français maîtrisé, du collège au BEM",
  city:"Khemis Miliana", wilaya:"Aïn Defla", country:"Algérie",
  phone:"+213 000 00 00 00", whatsapp:"+213 000 00 00 00", whatsappLink:"#",
  email:"contact@prof-kerdjidj.dz",
  address:"خميس مليانة — ولاية عين الدفلى، الجزائر",
  addressFr:"Khemis Miliana — Wilaya d'Aïn Defla, Algérie",
  hours:"السبت – الخميس: 14:00 – 20:00",
  facebook:"#", instagram:"#", youtube:"#", telegram:"#",
  stats:{years:12, students:240, lessons:180, exercises:950},
  accent:"#1E4FD8", maintenance:false, showPricing:false
};
/* Les réglages enregistrés depuis la page d'administration (localStorage) sont
   appliqués dès le chargement — ainsi contact/pied de page/à propos affichent
   les vraies coordonnées, même avant que Firestore ne réponde. */
(function applyStored(){
  try{
    const raw = localStorage.getItem('pk-settings');
    if(!raw) return;
    const saved = JSON.parse(raw);
    Object.keys(saved).forEach(k=>{
      if(saved[k] && typeof saved[k]==='object' && !Array.isArray(saved[k]) && settings[k] && typeof settings[k]==='object')
        Object.assign(settings[k], saved[k]);
      else settings[k] = saved[k];
    });
    // réglages XP → appliqués au moteur dès que 01-progression.js est chargé
    if(settings.xp){
      const go = ()=>{
        if(!window.PKxp || !window.PKxp.CFG) return setTimeout(go, 30);
        const CFG = window.PKxp.CFG;
        Object.keys(settings.xp).forEach(k=>{
          if(k === 'multDiff') Object.keys(settings.xp.multDiff).forEach(d=>{ CFG.multDiff[d] = +settings.xp.multDiff[d]; });
          else if(k === 'rankMin') window.PKxp.RANKS.forEach((r,i)=>{ if(typeof settings.xp.rankMin[i]==='number' && i>0) r.min = settings.xp.rankMin[i]; });
          else if(k in CFG) CFG[k] = settings.xp[k];
        });
      };
      go();
    }
  }catch(e){}
})();

/* ───────── NIVEAUX ───────── */
const levels = [
  {id:"1AM", cls:"lv-1am", ar:"السنة الأولى متوسط", fr:"1ère Année Moyenne",
   descAr:"بناء الأساسيات: الحروف والأصوات، الجملة البسيطة، والرصيد اللغوي الأولي.",
   descFr:"Construire les bases : lettres et sons, phrase simple et premier capital lexical.",
   topics:[["L'alphabet et la phonétique","الحروف والأصوات"],["La phrase simple","الجملة البسيطة"],["Le présent de l'indicatif","المضارع"]]},
  {id:"2AM", cls:"lv-2am", ar:"السنة الثانية متوسط", fr:"2ème Année Moyenne",
   descAr:"توسيع الجملة، إثراء المفردات، وبداية التعبير الكتابي المنظّم.",
   descFr:"Élargir la phrase, enrichir le vocabulaire et débuter l'expression écrite structurée.",
   topics:[["Les types de phrases","أنواع الجمل"],["Le champ lexical","الحقل المعجمي"],["L'expression écrite","التعبير الكتابي"]]},
  {id:"3AM", cls:"lv-3am", ar:"السنة الثالثة متوسط", fr:"3ème Année Moyenne",
   descAr:"إتقان الأزمنة المركّبة، فهم النصوص الطويلة، ومنهجية التحليل.",
   descFr:"Maîtriser les temps composés, comprendre les textes longs et la méthodologie d'analyse.",
   topics:[["Les temps composés","الأزمنة المركّبة"],["La compréhension de texte","فهم النص"],["La production écrite","الإنتاج الكتابي"]]},
  {id:"4AM", cls:"lv-4am", ar:"الرابعة متوسط — تحضير BEM", fr:"4AM — Préparation au BEM", hot:true,
   descAr:"مراجعة مكثّفة للشهادة: ملخّصات شاملة، مواضيع سابقة، واختبارات بيضاء موقوتة بتصحيح فوري.",
   descFr:"Révision intensive du brevet : fiches complètes, sujets officiels et quiz blancs chronométrés à correction instantanée.",
   topics:[["Révisions complètes","مراجعات شاملة"],["Sujets de BEM corrigés","مواضيع BEM محلولة"],["BEM blancs chronométrés","اختبارات بيضاء موقوتة"]]}
];

/* ───────── AXES DE LA MATIÈRE ───────── */
const axes = [
  {id:"grammaire",    fr:"Grammaire",              ar:"القواعد",            icon:"abc",     count:48},
  {id:"conjugaison",  fr:"Conjugaison",            ar:"تصريف الأفعال",      icon:"clock",   count:42},
  {id:"orthographe",  fr:"Orthographe",            ar:"الإملاء",            icon:"write",   count:26},
  {id:"vocabulaire",  fr:"Vocabulaire",            ar:"المفردات",           icon:"book",    count:38},
  {id:"comprehension",fr:"Compréhension de texte", ar:"فهم النص",           icon:"file",    count:22},
  {id:"expression",   fr:"Expression écrite",      ar:"التعبير الكتابي",    icon:"chat",    count:24},
  {id:"oral",         fr:"Expression orale",       ar:"التعبير الشفوي",     icon:"layers",  count:12},
  {id:"methodologie", fr:"Méthodologie BEM",       ar:"منهجية BEM",         icon:"target",  count:18},
  {id:"sujets",       fr:"Sujets corrigés",        ar:"مواضيع محلولة",      icon:"trophy",  count:30}
];

/* ───────── LEÇONS ───────── */
const lessons = [];   /* rempli depuis Firestore (hydrate) */

/* ───────── EXERCICES / QUIZ (avec vraies questions interactives) ───────── */
const exercises = []; /* rempli depuis Firestore (hydrate) */

/* ───────── GROUPES (الأفواج) ───────── */
const groups = [];    /* rempli depuis Firestore (hydrate) */

/* ───────── EMPLOI DU TEMPS ───────── */
const slots = ["12:30","14:00","15:45","17:30","19:15"];
const days  = ["sat","sun","mon","tue","wed","thu"];

/* ───────── ÉLÈVES (avec progression, PAS de notes scolaires) ───────── */
const students = [];  /* admin uniquement, depuis Firestore */

/* ───────── COMPTES (users) ET PROGRESSION (progress) ─────────
   L'XP vit dans progress/{uid} : la fiche élève reste administrative.
   Ces deux listes ne sont remplies qu'en mode connecté (admin).      */
const users = [];     /* comptes Google / e-mail liés aux fiches élèves */
const progress = [];  /* progression réelle de chaque compte */

/* ───────── PROFIL DE DÉMONSTRATION (élève connecté) ───────── */
const me = null;  /* profil réel : users/{uid} + progress (hydrateMe) */

/* ───────── ANNONCES ───────── */
const announcements = []; /* rempli depuis Firestore (hydrate) */
const messages = [];      /* messages réels : page Contact + espace élève */
const myMessages = [];    /* réponses de la professeure adressées à l'élève connecté */

/* ───────── AIDES ───────── */
const byId = (arr,id)=> arr.find(x=>x.id===id);
const groupOf = sid => byId(window.PKdata.groups, sid);
const slotAt  = (day,slot)=> window.PKdata.groups.find(g=>g.day===day && g.start===slot);
const lessonsOf = lv => window.PKdata.lessons.filter(l=>l.level===lv);
const exercisesOf = lv => window.PKdata.exercises.filter(e=>e.level===lv);
const schoolName = (k,lang)=> (window.PKi18n ? window.PKi18n.t(k,lang) : k);

return {settings, levels, axes, lessons, exercises, groups, slots, days, students, me, announcements, messages,
        users, progress, myMessages,
        byId, groupOf, slotAt, lessonsOf, exercisesOf, schoolName};
})();
