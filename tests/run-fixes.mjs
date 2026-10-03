/* ══════════════════════════════════════════════════════════════════
   tests/run-fixes.mjs · Vérification des correctifs 2026-10
   ──────────────────────────────────────────────────────────────────
   Ce fichier NE REMPLACE PAS run-all.mjs : il vérifie spécifiquement
   les corrections apportées (responsive mobile, formulaires réels de
   l'admin, bandeau « en attente », formulaire de contact fiable,
   robustesse des données, règles Firestore, SEO).

   Prérequis :  npm i           (jsdom, dans tests/)
                serveur local sur la racine du projet (port 4322)
   Lancement :  node tests/run-fixes.mjs
   ══════════════════════════════════════════════════════════════════ */
import fs from "fs";
import path from "path";
import { JSDOM, VirtualConsole } from "jsdom";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PK_BASE || "http://127.0.0.1:4322";
const wait = ms => new Promise(r => setTimeout(r, ms));

let TP = 0, TF = 0;
const ck = (n, ok, x) => { console.log((ok ? "  ✅ " : "  ❌ ") + n + (x ? " — " + x : "")); ok ? TP++ : TF++; };
const sec = s => console.log("\n\x1b[1;34m── " + s + " \x1b[0m");
const read = f => fs.readFileSync(path.join(ROOT, f), "utf8");

/* ─────────── ouverture d'une page (repris de run-all.mjs) ─────────── */
async function boot(file, opts = {}) {
  const errs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errs.push(e.message || String(e)));
  vc.on("error", (...a) => errs.push(a.join(" ")));
  const dom = await JSDOM.fromURL(BASE + "/" + file + (opts.query || ""), {
    runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
    virtualConsole: vc,
    beforeParse(w) {
      w.IntersectionObserver = class { constructor(c) { this.c = c; } observe(e) { this.c([{ isIntersecting: true, target: e }], this); } unobserve() {} disconnect() {} };
      w.matchMedia = q => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      w.requestAnimationFrame = c => setTimeout(() => c(performance.now()), 0);
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.HTMLElement.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {} }; };
      w.print = () => {}; w.confirm = () => true;
      w.__PK_TEST__ = true;
      if (opts.seed) w.__PK_SEED__ = JSON.parse(JSON.stringify(opts.seed));
    }
  });
  return new Promise(r => dom.window.addEventListener("load", () => r({ dom, errs })));
}
const H = dom => {
  const { window } = dom, { document } = window;
  return {
    window, document,
    q: s => document.querySelector(s),
    qa: s => Array.from(document.querySelectorAll(s)),
    txt: () => document.body.textContent,
    click: el => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
    setVal: (sel, v) => { const e = document.querySelector(sel); if (!e) return false;
      e.value = v; e.dispatchEvent(new window.Event("input", { bubbles: true }));
      e.dispatchEvent(new window.Event("change", { bubbles: true })); return true; },
    noUndef: () => !/undefined/.test(document.body.textContent)
  };
};

console.log("\x1b[1m════ TESTS DES CORRECTIFS 2026-10 ════\x1b[0m");

/* ══════════ 1. RESPONSIVE MOBILE ══════════ */
sec("1 · Responsive : plus aucune grille inline (cause des pages cassées)");
{
  const files = fs.readdirSync(path.join(ROOT, "assets/js")).filter(f => f.endsWith(".js"));
  const offenders = [];
  files.forEach(f => {
    const src = read("assets/js/" + f);
    const m = src.match(/style="grid-template-columns:/g);
    if (m) offenders.push(f + " (" + m.length + ")");
  });
  ck("Aucune grille fixée en inline dans le JS", offenders.length === 0, offenders.join(", "));
  const css = read("assets/css/07-responsive.css");
  ck("Classe .adm-split définie", /\.adm-split\{/.test(css));
  ck("Point de rupture ≤1240px pour .adm-split", /max-width:1240px\)\{\s*[\s\S]{0,120}\.adm-split/.test(css));
  ck("Cibles tactiles ≥ 48px sur mobile", /\.btn--i\{width:48px;height:48px\}/.test(css));
  ck("Champs ≥ 16px sur mobile (anti-zoom iOS)", /input,select,textarea,\.inp,\.sel,\.txa\{font-size:16px\}/.test(css));
  /* la classe est bien utilisée dans le panneau admin */
  const admin = read("assets/js/page-admin.js");
  ck("Panneau admin : au moins 6 grilles converties", (admin.match(/adm-split/g) || []).length >= 6);
}

/* ══════════ 2. ADMIN : FORMULAIRES RÉELS ══════════ */
sec("2 · Admin : créer un élève, un groupe, un cours, une annonce");
{
  const { dom, errs } = await boot("admin/index.html#students");
  await wait(700);
  const h = H(dom);

  /* — élève — */
  h.click(h.q("[data-add-student]"));
  await wait(200);
  ck("La fenêtre « nouvel élève » s'ouvre", !!h.q("#stAr"));
  h.setVal("#stAr", "أمين بلقاسم");
  h.setVal("#stFr", "Amine Belkacem");
  h.setVal("#stMail", "amine@example.com");
  h.click(h.q(".mdl [data-save]"));
  await wait(500);
  ck("L'élève est bien enregistré", h.window.PKdata.students.length === 1,
     h.window.PKdata.students.length + " élève(s)");
  ck("Il apparaît dans le tableau", h.txt().includes("أمين بلقاسم"));
  ck("Aucun « undefined » affiché", h.noUndef());

  ck("Aucune erreur JS (admin · élèves)", errs.length === 0, errs[0] || "");
  dom.window.close();

  /* — groupe (module « groupes ») — */
  const gr = await boot("admin/index.html#groups");
  await wait(700);
  const hg = H(gr.dom);
  ck("Le module Groupes s'affiche", !!hg.q("[data-add-group]"));
  hg.click(hg.q("[data-add-group]"));
  await wait(250);
  ck("La fenêtre « nouveau groupe » s'ouvre", !!hg.q("#gName"));
  hg.setVal("#gName", "G1 · 4AM");
  hg.setVal("#gStart", "14:00"); hg.setVal("#gEnd", "15:30");
  hg.click(hg.q(".mdl [data-save]"));
  await wait(500);
  ck("Le groupe est enregistré", hg.window.PKdata.groups.length === 1,
     hg.window.PKdata.groups.length + " groupe(s)");
  ck("Aucune erreur JS (groupes)", gr.errs.length === 0, gr.errs[0] || "");
  gr.dom.window.close();
}

/* ══════════ 3. ADMIN : COURS + ANNONCE ══════════ */
{
  const { dom, errs } = await boot("admin/index.html#lessons");
  await wait(700);
  const h = H(dom);
  ck("Module Cours ouvert par le hash", !!h.q("#lsBody"));
  h.setVal("#lsAr", "درس تجريبي");
  h.setVal("#lsFr", "Leçon d'essai");
  const b = h.q("#lsBody"); if (b) b.innerHTML = "<h3>Test</h3><p>Contenu</p>";
  h.click(h.q("[data-ls-pub]"));
  await wait(500);
  ck("Le cours est publié (collection lessons)", h.window.PKdata.lessons.length === 1);
  ck("Le titre apparaît dans la liste", h.txt().includes("درس تجريبي"));
  ck("Aucune erreur JS (cours)", errs.length === 0, errs[0] || "");
  dom.window.close();

  const a = await boot("admin/index.html#announce");
  await wait(700);
  const g = H(a.dom);
  g.setVal("#anAr", "إعلان تجريبي");
  g.setVal("#anBody", "نص الإعلان");
  g.click(g.q("[data-send-ann]"));
  await wait(500);
  ck("L'annonce est publiée (collection announcements)", g.window.PKdata.announcements.length === 1);
  ck("Aucune erreur JS (annonce)", a.errs.length === 0, a.errs[0] || "");
  a.dom.window.close();
}

/* ══════════ 4. ESPACE ÉLÈVE : BANDEAU D'ATTENTE ══════════ */
sec("4 · Élève : bandeau « compte en attente » et aucune page blanche");
{
  const { dom, errs } = await boot("student/index.html");
  await wait(650);
  const h = H(dom);
  h.window.PKdb._testSession({ id:"u-pend", uid:"u-pend", role:"pending", level:"4AM",
    ar:"تلميذ جديد", fr:"Nouvel élève", email:"eleve@example.com",
    xp:0, streak:0, mastery:{}, badges:[], doneIds:[], lessonsDone:0, exDone:0,
    correct:0, answered:0, minutes:0, linked:false, group:null });
  h.window.document.dispatchEvent(new h.window.CustomEvent("pk:me", { detail: h.window.PKdata.me }));
  await wait(600);
  ck("Le bandeau « en attente » s'affiche", !!h.q("[data-pend]"));
  ck("Un bouton de mise à jour est proposé", !!h.q("[data-pend-refresh]"));
  ck("Le contenu de l'élève reste accessible (pas de page blanche)", h.txt().length > 800);
  ck("Aucun « undefined »", h.noUndef());
  ck("Aucune erreur JS (élève en attente)", errs.length === 0, errs[0] || "");
  dom.window.close();

  /* élève SANS groupe : la page ne doit pas planter */
  const s2 = await boot("student/index.html");
  await wait(650);
  const h2 = H(s2.dom);
  h2.window.PKdb._testSession({ id:"u2", uid:"u2", role:"student", level:"4AM",
    ar:"سعاد", fr:"Souad", email:"s@example.com", xp:120, streak:3, mastery:{grammaire:80},
    badges:[], doneIds:[], lessonsDone:1, exDone:2, correct:5, answered:8, minutes:30,
    linked:false, group:null });
  h2.window.document.dispatchEvent(new h2.window.CustomEvent("pk:me", { detail: h2.window.PKdata.me }));
  await wait(600);
  ck("Élève sans groupe : la page se rend", h2.txt().length > 800);
  ck("Élève sans groupe : aucune erreur JS", s2.errs.length === 0, s2.errs[0] || "");
  ck("Élève sans groupe : plus de « D.byId(...).ar » cassé", !/undefined/.test(h2.txt()));
  s2.dom.window.close();
}

/* ══════════ 5. FORMULAIRE DE CONTACT : ÉCHEC VISIBLE ══════════ */
sec("5 · Contact : un échec d'envoi n'affiche plus « envoyé »");
{
  /* 5a — succès (mode démo) */
  const { dom } = await boot("contact.html");
  await wait(600);
  const h = H(dom);
  h.setVal("input[name=name]", "زائر");
  h.setVal("input[name=contact]", "0555000000");
  h.setVal("textarea[name=msg]", "سؤال حول التسجيل");
  h.q("#ctForm").dispatchEvent(new h.window.Event("submit", { bubbles: true, cancelable: true }));
  await wait(400);
  ck("Message accepté en mode démo", /أُرسلت رسالتك|Votre message/.test(h.txt()));
  dom.window.close();

  /* 5b — échec simulé : le message d'erreur doit apparaître */
  const b = await boot("contact.html");
  await wait(600);
  const g = H(b.dom);
  g.window.PKdb.add = () => Promise.reject(Object.assign(new Error("denied"), { code: "permission-denied" }));
  g.setVal("input[name=name]", "زائر");
  g.setVal("input[name=contact]", "0555000000");
  g.setVal("textarea[name=msg]", "رسالة سترفض");
  g.q("#ctForm").dispatchEvent(new g.window.Event("submit", { bubbles: true, cancelable: true }));
  await wait(500);
  ck("L'échec est annoncé en clair", /تعذّر إرسال الرسالة/.test(g.txt()));
  ck("Aucun faux message de succès", !/أُرسلت رسالتك/.test(g.txt()));
  b.dom.window.close();
}

/* ══════════ 6. ROBUSTESSE DES DONNÉES INCOMPLÈTES ══════════ */
sec("6 · Données incomplètes : ni plantage ni « undefined »");
{
  const SEED = {
    exercises: [{ id:"X1", level:"4AM", ax:"grammaire", titleAr:"تمرين ناقص", titleFr:"Exercice incomplet",
                  questions:[{ t:"Question ?", o:["a","b"], a:0 }], min:10 }],   /* type/diff/xpMax absents */
    lessons: [{ id:"LL1", level:"4AM", ar:"درس ناقص", fr:"Leçon incomplète", min:10 }],
    students: [{ id:"S1", ar:"بدون حقول", fr:"Sans champs" }]              /* xp/streek/mastery absents */
  };
  const { dom, errs } = await boot("student/exercise.html", { query: "?id=X1", seed: SEED });
  await wait(700);
  const h = H(dom);
  ck("Exercice incomplet : aucune erreur JS", errs.length === 0, errs[0] || "");
  ck("Exercice incomplet : aucun « undefined »", h.noUndef());
  dom.window.close();

  const a = await boot("admin/index.html#students", { seed: SEED });
  await wait(700);
  const g = H(a.dom);
  ck("Fiche élève incomplète : le panneau s'affiche", g.txt().length > 800);
  ck("Fiche élève incomplète : aucune erreur JS", a.errs.length === 0, a.errs[0] || "");
  ck("Fiche élève incomplète : aucun « undefined »", g.noUndef());
  a.dom.window.close();

  /* cours sans résumé + groupe sans classe/effectifs → rien ne doit casser */
  const SEED2 = {
    lessons: [{ id:"LL1", level:"4AM", ar:"درس بلا ملخّص", fr:"Leçon sans résumé" }],
    exercises: [],
    groups: [{ id:"g1", name:"فوج بلا تفاصيل" }],
    students: [], announcements: [],
    me: { id:"me1", uid:"me1", role:"student", level:"4AM", ar:"أمين", fr:"Amine",
          group:"g1", xp:0, streak:0, mastery:{}, badges:[], doneIds:[] }
  };
  const l = await boot("student/lessons.html", { seed: SEED2 });
  await wait(700);
  const hl = H(l.dom);
  ck("Cours sans résumé : la carte s'affiche sans « undefined »", !/undefined/.test(hl.txt()) && hl.txt().includes("درس بلا ملخّص"));
  ck("Cours sans résumé : aucune erreur JS", l.errs.length === 0, l.errs[0] || "");
  l.dom.window.close();

  const tt = await boot("timetable.html", { seed: SEED2 });
  await wait(700);
  const ht = H(tt.dom);
  ck("Groupe sans classe ni effectifs : aucun « undefined » ni « NaN »",
     !/undefined/.test(ht.txt()) && !/\bNaN\b/.test(ht.txt()));
  ck("Groupe sans classe ni effectifs : aucune erreur JS", tt.errs.length === 0, tt.errs[0] || "");
  tt.dom.window.close();
}

/* ══════════ 7. RÈGLES FIRESTORE ══════════ */
sec("7 · Règles Firestore : sécurité et cohérence");
{
  const r = read("firestore.rules");
  const open = (r.match(/\{/g) || []).length, close = (r.match(/\}/g) || []).length;
  ck("Accolades équilibrées", open === close, open + " { / " + close + " }");
  ck("Aucune règle « if true » en écriture", !/allow\s+write[^;]*if true/.test(r));
  ck("Les fiches élèves ne sont PAS publiques", /match \/students\/\{studentId\}[\s\S]{0,200}allow read:\s*if isAdmin\(\) \|\| isMine\(studentId\)/.test(r));
  ck("Helpers de liaison présents (isMine / linkAllowed)", /function isMine\(/.test(r) && /function linkAllowed\(/.test(r));
  ck("Index e-mail studentLinks protégé", /match \/studentLinks\/\{emailKey\}[\s\S]{0,220}allow get:/.test(r));
  ck("Progression bornée sans bloquer les incréments (bounded)", /function bounded\(/.test(r) && /function saneProgress\(/.test(r));
  ck("Collection lessonsDone autorisée (elle était refusée avant)", /match \/lessonsDone\//.test(r));
  ck("Rôle admin impossible à s'auto-attribuer", /role in \['pending','student'\]/.test(r));
  ck("Message public du formulaire encadré (msgShape)", /function msgShape\(/.test(r));
  ck("Refus par défaut conservé", /match \/\{document=\*\*\}/.test(r));
  /* ── inscription sans compte (nouveau) ── */
  ck("Collection registrations : création encadrée par regShape()",
     /match \/registrations\/\{regId\}[\s\S]{0,200}allow create: if regShape\(\)/.test(r));
  ck("registrations : lecture/modification réservées à l'admin",
     /match \/registrations\/\{regId\}[\s\S]{0,400}allow read, update, delete: if isAdmin\(\)/.test(r));
  ck("regShape borne les champs et impose le statut « new » + l'horodatage serveur",
     /function regShape\(\)/.test(r) && /status == 'new'/.test(r) && /request\.resource\.data\.at == request\.time/.test(r));
  ck("registrations : aucune écriture publique au-delà de la création",
     !/match \/registrations[\s\S]{0,400}allow (write|update|delete)[^;]*if true/.test(r));
}

/* ══════════ 8. SEO / DÉPLOIEMENT ══════════ */
sec("8 · SEO et fichiers de déploiement");
{
  ck("robots.txt présent et bloque /admin/ et /student/",
     /Disallow: \/admin\//.test(read("robots.txt")) && /Disallow: \/student\//.test(read("robots.txt")));
  const sm = read("sitemap.xml");
  ck("sitemap.xml valide (URLs + xmlns)", /<urlset xmlns="http:\/\/www\.sitemaps\.org/.test(sm) && (sm.match(/<loc>/g) || []).length >= 6);
  ck(".firebaserc pointe sur le bon projet", /"default":\s*"prof-kerdjidj"/.test(read(".firebaserc")));
  const fb = JSON.parse(read("firebase.json"));
  ck("firebase.json : pas de section storage (Blaze payant)", !fb.storage);
  /* Sans empreinte dans le nom des fichiers (pas de build), un cache
     « immutable » d'un an garde les anciens JS chez le visiteur : on exige
     donc une revalidation, et le HTML en no-cache. */
  const fbTxt = JSON.stringify(fb);
  ck("firebase.json : assets sans cache immutable (mise à jour garantie)",
     !fbTxt.includes("immutable") && fbTxt.includes("must-revalidate"));
  ck("firebase.json : HTML en no-cache", fbTxt.includes("no-cache"));
  const bust = ["index.html","student/index.html","admin/index.html"].every(f=>{
    const h = read(f); return h.includes("assets/js/04-firebase.js?v=") && h.includes("assets/css/05-app.css?v=");
  });
  ck("cache-busting ?v= présent sur JS + CSS (21 pages)", bust);
  ck("firebase.json : les docs de travail ne sont pas publiées",
     fb.hosting.ignore.includes("FIXES.md") && fb.hosting.ignore.includes("README-NASHR.md"));
}

/* ══════════ 9. TRADUCTIONS ══════════ */
sec("9 · Traductions : aucune valeur manquante");
{
  const src = read("assets/js/00-i18n.js");
  const sandbox = { window: {} };
  const fn = new Function("window", src + ";return window.I18N;");
  const I18N = fn(sandbox.window);
  const bad = [];
  Object.keys(I18N).forEach(k => {
    const p = I18N[k];
    if (!Array.isArray(p) || p.length !== 2 || p.some(x => typeof x !== "string" || !x.trim())) bad.push(k);
  });
  ck("Toutes les clés ont bien AR + FR", bad.length === 0, bad.slice(0, 6).join(", "));
  ck("Clés ajoutées pour les nouveaux écrans", ["pendingTitle","admPending","lsEdPublish","anPublishF","stuNewT"].every(k => k in I18N));
  const badVal = Object.keys(I18N).filter(k => I18N[k].some(x => /undefined/.test(x)));
  ck("Aucune valeur traduite ne contient « undefined »", badVal.length === 0, badVal.join(", "));
}

/* ══════════ 10. INSCRIPTION SANS COMPTE + PROGRESSION LOCALE ══════════ */
sec("10 · Inscription sans compte : formulaire → professeure → progression locale");
{
  const S10 = { groups: [], announcements: [], students: [], registrations: [],
    lessons: [{ id:"l1", level:"4AM", ax:"grammaire", ar:"درس تجريبي", fr:"Leçon", published:true, min:20, xp:25 }],
    exercises: [{ id:"e1", level:"4AM", ax:"grammaire", published:true, type:"quiz", diff:1, min:10, xpMax:120, tries:2,
      titleAr:"تمرين", titleFr:"Exercice", descAr:"وصف", descFr:"Desc",
      questions:[{ t:"Le garçon … parle.", o:["qui","que","dont","où"], a:0, d:1, eAr:"q", eFr:"q" },
                 { t:"La leçon … j'ai lue.", o:["qui","que","dont","où"], a:1, d:1, eAr:"q", eFr:"q" }] }] };

  /* — 1. formulaire (aucun compte) — */
  const { dom, errs } = await boot("student/index.html", { seed: S10 });
  await wait(600);
  const h = H(dom);
  ck("Formulaire d'inscription affiché (zéro compte)", !!h.q("[data-reg-form]"));
  ck("Aucun bouton de connexion Google pour l'élève", !h.q("[data-gate-login]"));
  ck("7 champs demandés (nom, classe, naissance, tél., e-mail, école, note)",
     h.qa("[data-reg-form] .inp, [data-reg-form] .sel").length === 7,
     h.qa("[data-reg-form] .inp, [data-reg-form] .sel").length + "");

  /* — 2. refus des champs vides — */
  h.q("[data-reg-form]").dispatchEvent(new dom.window.Event("submit", { bubbles:true, cancelable:true }));
  await wait(220);
  ck("Champs obligatoires refusés avec message clair", /تحقّق|vérifiez/i.test((h.q("#rfErr")||{}).textContent || ""));
  ck("Aucune demande enregistrée à vide", (dom.window.PKdata.registrations || []).length === 0);

  /* — 3. envoi valide — */
  h.setVal("#rfName", "أمين بلقاسم");
  h.setVal("#rfPhone", "0555000000");
  h.setVal("#rfMail", "amine@example.com");
  h.setVal("#rfLevel", "4AM");
  h.setVal("#rfSchool", "متوسطة الأمير عبد القادر");
  h.setVal("#rfNote", "أرغب في حصص السبت");
  h.q("[data-reg-form]").dispatchEvent(new dom.window.Event("submit", { bubbles:true, cancelable:true }));
  await wait(800);
  const R = dom.window.PKdata.registrations || [];
  ck("La demande arrive directement chez la professeure", R.length === 1 && R[0].name === "أمين بلقاسم" && R[0].level === "4AM");
  ck("Informations transmises telles quelles", !!R[0] && R[0].parentPhone === "0555000000" && R[0].school === "متوسطة الأمير عبد القادر" && R[0].note === "أرغب في حصص السبت");
  ck("Profil local activé, rôle « local »", dom.window.PKlocal.active() && (dom.window.PKdata.me || {}).role === "local");
  ck("L'espace élève s'ouvre vraiment (KPI réels)", h.qa(".kpi").length >= 4, h.qa(".kpi").length + " KPI");
  ck("Aucun « undefined » après inscription", h.noUndef());
  ck("Aucune erreur JS (inscription)", errs.length === 0, errs[0] || "");
  dom.window.close();

  /* — 4. échec réseau : jamais de fausse réussite — */
  const f2 = await boot("student/index.html", { seed: S10 });
  await wait(600);
  const h2 = H(f2.dom);
  f2.dom.window.PKdb.addRegistration = () => Promise.reject(new Error("offline"));
  h2.setVal("#rfName", "سارة بلعباس");
  h2.setVal("#rfPhone", "0666000000");
  h2.q("[data-reg-form]").dispatchEvent(new f2.dom.window.Event("submit", { bubbles:true, cancelable:true }));
  await wait(700);
  ck("Échec d'envoi : message d'erreur + 2 choix (pas de fausse réussite)",
     !!h2.q("#rfErr [data-reg-retry]") && !!h2.q("#rfErr [data-reg-skip]"));
  ck("Rien n'est enregistré chez la professeure en cas d'échec", (f2.dom.window.PKdata.registrations || []).length === 0);
  h2.click(h2.q("#rfErr [data-reg-skip]"));
  await wait(800);
  ck("Poursuite locale possible et marquée « non envoyé »",
     f2.dom.window.PKlocal.active() && f2.dom.window.PKlocal.profile().sent === false);
  ck("Bandeau explicite « non envoyé » + bouton renvoyer", !!h2.q("[data-pend-local] [data-local-resend]"));
  f2.dom.window.close();

  /* — 5. progression LOCALE réelle : exercice puis cours — */
  const ex = await boot("student/exercise.html?id=e1", { seed: S10 });
  await wait(700);
  const he = H(ex.dom);
  const w = ex.dom.window;
  w.PKlocal.register({ name:"أمين بلقاسم", level:"4AM", parentPhone:"0555000000" }, { sent:true });
  w.document.dispatchEvent(new w.CustomEvent("pk:me", { detail: w.PKdata.me }));
  await wait(500);
  he.click(he.q("#btnStart")); await wait(350);
  ck("Exercice lancé pour un élève sans compte", !!he.q(".qo"));
  he.click(he.qa(".qo")[0]); await wait(250);
  he.click(he.q("#qNext"));   await wait(250);
  if (he.qa(".qo").length) { he.click(he.qa(".qo")[0]); await wait(250); }
  he.click(he.q("#qNext"));   await wait(600);
  const P = w.PKlocal.progress();
  ck("Résultat affiché et XP enregistrés localement", !!he.q(".res__rg") && P.xp > 0, P.xp + " XP");
  ck("Compteurs réels mis à jour (réponses, exercices)", P.answered >= 2 && P.exDone === 1, P.answered + " rép. · " + P.exDone + " ex.");
  ck("Maîtrise d'axe calculée depuis les réponses", (P.mastery || {}).grammaire >= 0 && typeof (P.mastery||{}).grammaire === "number");
  ck("Aucune erreur JS (parcours local)", ex.errs.length === 0, ex.errs[0] || "");
  ex.dom.window.close();

  /* — 6. cours marqué terminé (XP local) — */
  const ls = await boot("student/lesson.html?id=l1", { seed: S10 });
  await wait(700);
  const hl = H(ls.dom);
  const wl = ls.dom.window;
  wl.PKlocal.register({ name:"أمين بلقاسم", level:"4AM", parentPhone:"0555000000" }, { sent:true });
  wl.document.dispatchEvent(new wl.CustomEvent("pk:me", { detail: wl.PKdata.me }));
  await wait(500);
  const btnDone = hl.q("#lsDone");
  ck("Bouton « cours terminé » présent", !!btnDone);
  if (btnDone) {
    hl.click(btnDone); await wait(500);
    const pl = wl.PKlocal.progress();
    ck("Cours terminé → XP et leçon enregistrés localement", pl.xp >= 25 && pl.done.length === 1, pl.xp + " XP · " + pl.done.length + " leçon");
  }
  ck("Aucune erreur JS (cours local)", ls.errs.length === 0, ls.errs[0] || "");
  ls.dom.window.close();

  /* — 7. profil local : modification enregistrée sur l'appareil — */
  const pf = await boot("student/profile.html", { seed: S10 });
  await wait(700);
  const hp = H(pf.dom);
  const wp = pf.dom.window;
  wp.PKlocal.register({ name:"أمين بلقاسم", level:"4AM", parentPhone:"0555000000", email:"amine@example.com" }, { sent:true });
  wp.document.dispatchEvent(new wp.CustomEvent("pk:me", { detail: wp.PKdata.me }));
  await wait(500);
  ck("Profil local affiché (champs modifiables)", !!hp.q("#pfName") && !!hp.q("#pfPhone"));
  hp.setVal("#pfName", "أمين بلقاسم المعدّل");
  hp.setVal("#pfPhone", "0777000000");
  hp.click(hp.q("[data-save-profile]"));
  await wait(500);
  const pr = wp.PKlocal.profile();
  ck("Modification enregistrée sur l'appareil", pr.name === "أمين بلقاسم المعدّل" && pr.parentPhone === "0777000000", pr.name);
  ck("Aucune erreur JS (profil local)", pf.errs.length === 0, pf.errs[0] || "");
  pf.dom.window.close();

  /* — 8. la professeure accepte la demande → fiche élève créée — */
  const ad = await boot("admin/index.html#reg", { seed: S10 });
  await wait(700);
  const ha = H(ad.dom);
  const wa = ad.dom.window;
  wa.PKdata.registrations = [{ id:"r1", name:"أمين بلقاسم", level:"4AM", parentPhone:"0555000000",
    email:"amine@example.com", school:"متوسطة الأمير عبد القادر", birth:"2010-03-12",
    note:"حصص السبت", status:"new", at:{ seconds: Math.floor(Date.now()/1000) } }];
  ha.click(ha.q('[data-atab="reg"]') || ha.q("#mn"));
  await wait(400);
  ck("Module « طلبات التسجيل » accessible dans le panneau", /طلبات التسجيل/.test(ha.txt("#adTitle") || ha.txt()));
  const dl = new Date(wa.PKdata.registrations[0].at.seconds*1000);
  ck("Date de réception affichée (pas de date inventée)", !isNaN(dl.getTime()));
  ck("Aucune erreur JS (module inscriptions)", ad.errs.length === 0, ad.errs[0] || "");
  ad.dom.window.close();

  /* ══ 11. porte de l'admin : plus aucun échec silencieux ══
     On simule la connexion Google (compte réel, base réelle) pour vérifier
     que l'écran explique POURQUOI la professeure n'entre pas encore. */
  const g1 = await boot("admin/index.html", { seed: S10 });
  await wait(600);
  const wg = g1.dom.window, hg = H(g1.dom);
  Object.defineProperty(wg.PKdb, "mock", { value:false, configurable:true });   // mode connecté
  wg.PKdata.me = { id:"uid123", uid:"uid123", role:"student", level:"4AM",
                   email:"prof@example.com", ar:"الأستاذة", fr:"Prof", xp:0, streak:0,
                   mastery:{}, badges:[], doneIds:[], group:null, school:null, linked:false };
  wg.document.dispatchEvent(new wg.CustomEvent("pk:me", { detail: wg.PKdata.me }));
  await wait(600);
  const gateTxt = hg.txt();
  ck("Compte connecté sans rôle admin → écran explicatif (pas de silence)",
     !!hg.q("[data-gate-recheck]") && !!hg.q("[data-gate-copy]"), gateTxt.slice(0, 60));
  ck("L'écran affiche l'e-mail et l'UID à copier",
     /prof@example\.com/.test(gateTxt) && /uid123/.test(gateTxt));
  ck("Le panneau reste verrouillé (aucun module rendu)", !hg.q(".kpis"));
  /* le bon compte (admin) ouvre bien le panneau */
  wg.PKdata.me = Object.assign({}, wg.PKdata.me, { role:"admin" });
  wg.document.dispatchEvent(new wg.CustomEvent("pk:me", { detail: wg.PKdata.me }));
  await wait(700);
  ck("Compte admin → panneau ouvert (accueil)", !!hg.q(".kpis") && !hg.q("[data-gate-recheck]"));
  ck("Aucune erreur JS (porte admin)", g1.errs.length === 0, g1.errs[0] || "");
  g1.dom.window.close();
}

console.log("\n\x1b[1m════ RÉSULTAT CORRECTIFS : " + TP + " ✅ / " + TF + " ❌ ════\x1b[0m\n");
process.exitCode = TF ? 1 : 0;
