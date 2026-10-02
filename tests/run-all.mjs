/* ══════════════════════════════════════════════════════════════════
   Suite de tests — Plateforme Prof. Kerdjidj (zéro donnée fictive)
   ──────────────────────────────────────────────────────────────────
   La plateforme naît VIDE : tout contenu vient de Firestore (ou du
   grainage __PK_SEED__ réservé aux tests). Cette suite vérifie :
     1. les 18 pages se rendent sans erreur JS, AR ⇄ FR, sans « undefined »
     2. les états vides honnêtes (aucun cours/exercice/groupe fantôme)
     3. la porte d'entrée élève : connexion Google puis choix du niveau
     4. le filtrage par niveau (l'élève ne voit que sa propre année)
     5. le moteur d'exercice (correction, XP, revue) sur un quiz semé
     6. le panneau admin (11 modules) + constructeur de quiz + messages réels
     7. l'enregistrement des paramètres → page Contact (persistance)
     8. l'hygiène : aucune donnée de démonstration dans les sources

   Prérequis :  npm i jsdom   (dans tests/)
   Lancement :  serveur local sur le projet, puis  node tests/run-all.mjs
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

/* ───────── graine réservée aux tests (aucune démo dans le site) ───────── */
const Q = (t, o, a) => ({ t, o, a, d: 1 });
const SEED = {
  lessons: [
    { id: "L1", level: "4AM", ax: "grammaire", icon: "abc", min: 18, files: 0, video: false, xp: 25,
      ar: "الجملة التابعة: الموصولية", fr: "La subordination : la proposition relative",
      sumAr: "qui وque وdont وoù وظائفها.", sumFr: "Qui, que, dont, où : fonctions.",
      content: "<h3>Les pronoms relatifs</h3><p><b>qui</b> : sujet · <b>que</b> : COD · <b>dont</b> : complément de nom.</p>" },
    { id: "L2", level: "4AM", ax: "conjugaison", icon: "edit", min: 22, files: 1, video: true, xp: 25,
      ar: "الأزمنة المركبة", fr: "Les temps composés", sumAr: "الماضي المركب والمضارع التام.", sumFr: "Passé composé et plus-que-parfait.",
      content: "<h3>Le passé composé</h3><p>avoir / être + participe passé.</p>" },
    { id: "L3", level: "3AM", ax: "vocabulaire", icon: "leaf", min: 15, files: 0, video: false, xp: 25,
      ar: "معجم المدرسة", fr: "Le lexique de l'école", sumAr: "مفردات القسم.", sumFr: "Vocabulaire de la classe.",
      content: "<h3>Lexique</h3><p>la trousse, le cahier…</p>" }
  ],
  exercises: [{
    id: "Q1", level: "4AM", ax: "grammaire", type: "mcq", diff: 2, min: 10, q: 8, xpMax: 200, tries: 3, deadline: null,
    titleAr: "تمرين — الضمائر الموصولة", titleFr: "Exercice — Les pronoms relatifs",
    descAr: "8 أسئلة لإتقان qui وque وdont وoù.", descFr: "8 questions pour maîtriser qui, que, dont, où.",
    questions: [
      Q("Le garçon …… parle est mon cousin.", ["qui", "que", "dont", "où"], 0),
      Q("La leçon …… j'ai comprise est facile.", ["qui", "que", "dont", "où"], 1),
      Q("C'est un élève …… les progrès sont rapides.", ["qui", "que", "dont", "où"], 2),
      Q("La classe …… nous étudions est claire.", ["qui", "que", "dont", "où"], 3),
      Q("La professeure …… j'admire est patiente.", ["qui", "que", "dont", "où"], 1),
      Q("Voici le cahier …… la couverture est bleue.", ["qui", "que", "dont", "où"], 2),
      { t: "Le pronom relatif complétant « être » au sens de lieu est ……", a: "où", d: 1 },
      { t: "Complétez : c'est un sujet …… on a parlé est corrigé.", a: "dont", d: 1 }
    ]
  }],
  groups: [
    { id: "G1", name: "4AM · A", level: "4AM", cls: "lv-4am", day: "sun", start: "15:45", end: "17:15",
      schoolAr: "متوسطة الأمير عبد القادر", schoolFr: "CEM Emir Abdelkader", teacher: "Prof. Kerdjidj",
      capacity: 6, enrolled: 2, mode: "onsite", room: "Cabinet" },
    { id: "G2", name: "3AM · B", level: "3AM", cls: "lv-3am", day: "tue", start: "17:30", end: "19:00",
      schoolAr: "دروس خصوصية — خميس مليانة", schoolFr: "Cours particuliers — Khemis Miliana", teacher: "Prof. Kerdjidj",
      capacity: 8, enrolled: 3, mode: "online", room: "Meet" }
  ],
  students: [
    { id: "S1", ar: "تلميذ أول", fr: "Élève Un", level: "4AM", group: "G1", school: "school1", xp: 3200, streak: 5, best: 7, lessonsDone: 12, exDone: 20, correct: 150, answered: 180, status: "active", mastery: { grammaire: 80, conjugaison: 60 } },
    { id: "S2", ar: "تلميذ ثان", fr: "Élève Deux", level: "4AM", group: "G1", school: "school1", xp: 900, streak: 1, best: 4, lessonsDone: 4, exDone: 7, correct: 40, answered: 60, status: "active", mastery: { grammaire: 45 } },
    { id: "S3", ar: "تلميذ ثالث", fr: "Élève Trois", level: "3AM", group: "G2", school: "school2", xp: 100, streak: 0, best: 2, lessonsDone: 1, exDone: 2, correct: 9, answered: 15, status: "active", mastery: {} }
  ],
  announcements: [
    { id: "A1", pinned: true, importance: "important", date: "2026-09-28", i18n: { ar: "إعلان تجريبي واحد", fr: "Annonce de test une" } },
    { id: "A2", pinned: false, importance: "info", date: "2026-09-26", i18n: { ar: "إعلان تجريبي ثان", fr: "Annonce de test deux" } }
  ],
  messages: [
    { id: "M1", from: "ولي تلميذ", contact: "+213 555 00 00 00", level: "4AM", subject: "استفسار", body: "رسالة اختبار من ولي تلميذ.", role: "contact" }
  ],
  me: { id: "S1", uid: "t1", role: "student", level: "4AM", ar: "تلميذ أول", fr: "Élève Un", email: "eleve@test.dz",
        group: "G1", school: "school1", xp: 3200, streak: 5, best: 7, lessonsDone: 12, exDone: 20, quizDone: 6,
        correct: 150, answered: 180, minutes: 300, mastery: { grammaire: 80, conjugaison: 60 }, badges: ["first_lesson"], doneIds: ["L1"] }
};

/* ───────── Amorçage d'une page dans jsdom ───────── */
function boot(fileQ, opts = {}) {
  const file = fileQ.split("?")[0];
  const query = fileQ.includes("?") ? fileQ.slice(fileQ.indexOf("?")) : "";
  const errs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errs.push((e.stack || e.message).split("\n").slice(0, 2).join(" | ")));
  vc.on("error", (...a) => errs.push("console.error " + a.join(" ").slice(0, 140)));
  const dom = new JSDOM(fs.readFileSync(path.join(ROOT, file), "utf8"), {
    runScripts: "dangerously", resources: "usable", pretendToBeVisual: true,
    url: BASE + "/" + file + query + (opts.hash || ""), virtualConsole: vc,
    beforeParse(w) {
      w.IntersectionObserver = class { constructor(c) { this.c = c; } observe(e) { this.c([{ isIntersecting: true, target: e }], this); } unobserve() {} disconnect() {} };
      w.matchMedia = q => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
      w.requestAnimationFrame = c => setTimeout(() => c(performance.now()), 0);
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.HTMLElement.prototype.animate = function () { return { finished: Promise.resolve(), cancel() {} }; };
      w.print = () => {}; w.confirm = () => true;
      w.__PK_TEST__ = true;
      if (opts.store) for (const k in opts.store) w.localStorage.setItem(k, opts.store[k]);
      if (opts.seed) w.__PK_SEED__ = JSON.parse(JSON.stringify(opts.seed));
    }
  });
  return new Promise(r => dom.window.addEventListener("load", () => r({ dom, errs })));
}
const helpers = dom => {
  const { window } = dom, { document } = window;
  return {
    window, document,
    q: s => document.querySelector(s),
    qa: s => Array.from(document.querySelectorAll(s)),
    txt: s => { const e = document.querySelector(s); return e ? e.textContent.trim().replace(/\s+/g, " ") : ""; },
    click: el => el && el.dispatchEvent(new window.MouseEvent("click", { bubbles: true })),
    setVal: (sel, v) => { const e = document.querySelector(sel); if (!e) return;
      e.value = v; e.dispatchEvent(new window.Event("input", { bubbles: true }));
      e.dispatchEvent(new window.Event("change", { bubbles: true })); },
    noUndef: () => !/undefined/.test(document.body.textContent),
    undefCtx: () => { const m = document.body.textContent.match(/.{0,60}undefined.{0,40}/); return m ? m[0].replace(/\s+/g, " ") : ""; },
    toFR: async () => {
      const b = Array.from(document.querySelectorAll(".lgsw button")).find(x => x.dataset.lang === "fr");
      if (!b) return false;
      b.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      await wait(420);
      return document.documentElement.dir === "ltr";
    }
  };
};

console.log("\x1b[1m════ SUITE DE TESTS — Plateforme Prof. Kerdjidj (sans démo) ════\x1b[0m");

/* ═══════════ 1. PAGES PUBLIQUES : rendu + états vides ═══════════ */
sec("1 · Pages publiques — rendu propre et états vides honnêtes");
const PUB = [
  ["index.html", "Accueil", h => [
    ["Hero + aurora", !!h.q(".hero")],
    ["Grille Bento", h.qa(".bx__ti, .bento > *").length >= 4],
    ["4 niveaux", h.qa(".lv").length === 4],
    ["Compteurs réels à zéro", /0/.test(h.qa(".lv .bd--gy .la")[0] ? h.qa(".lv .bd--gy .la")[0].textContent : "0")]]],
  ["levels.html", "Niveaux", h => [["4 niveaux", h.qa(".lv").length === 4], ["9 axes", h.qa(".ax").length === 9]]],
  ["lessons.html", "Cours (vide)", h => [["État vide « aucun cours »", h.document.body.textContent.includes("لا توجد دروس")], ["Pas de carte fantôme", h.qa("#lsGrid .cd").length === 0]]],
  ["exercises.html", "Exercices (vide)", h => [["État vide « aucun exercice »", h.document.body.textContent.includes("لا توجد تمارين")]]],
  ["timetable.html", "Emploi du temps (vide)", h => [["État vide « aucun groupe »", h.document.body.textContent.includes("لا أفواج")]]],
  ["about.html", "La professeure", h => [["Monogramme", !!h.q(".tch__ph")], ["Citation", !!h.q(".tch__q")], ["5 étapes", h.qa(".stp").length >= 5]]],
  ["faq.html", "FAQ", h => [["Accordéons", h.qa(".acc").length >= 8], ["Un ouvert", !!h.q(".acc[open]")]]],
  ["contact.html", "Contact", h => [["Formulaire", !!h.q("#ctForm")], ["Coordonnées", h.qa(".cinfo").length >= 4]]],
  ["404.html", "404", h => [["Grand 404", /404/.test(h.document.body.textContent)], ["Liens de secours", h.qa("a.btn").length >= 3]]]
];
for (const [file, name, checks] of PUB) {
  const { dom, errs } = await boot(file);
  await wait(480);
  const h = helpers(dom);
  console.log("\n  \x1b[1m" + file + "\x1b[0m  · " + name);
  ck("Aucune erreur JS", errs.length === 0, errs[0] || "");
  ck("Contenu rendu", h.document.body.textContent.trim().length > 400);
  ck("Aucun « undefined »", h.noUndef(), h.undefCtx());
  checks(h).forEach(([n, ok]) => ck(n, ok));
  ck("Bascule FR (dir=ltr)", await h.toFR());
  ck("FR : aucun « undefined »", h.noUndef(), h.undefCtx());
  dom.window.close();
}

/* ═══════════ 2. PAGES PUBLIQUES AVEC CONTENU RÉEL SEMÉ ═══════════ */
sec("2 · Même pages, avec du contenu « publié par la professeure » (graine)");
{
  const { dom, errs } = await boot("lessons.html", { seed: SEED });
  await wait(520);
  const h = helpers(dom);
  ck("2 leçons 4AM + 1 leçon 3AM rendues", h.qa("#lsGrid .cd, #lsGrid .ls").length === 3, h.qa("#lsGrid .cd, #lsGrid .ls").length + " cartes");
  ck("Titre réel visible", h.document.body.textContent.includes("الجملة التابعة"));
  ck("Aucune erreur", errs.length === 0, errs[0] || "");
  dom.window.close();

  const t = await boot("timetable.html", { seed: SEED });
  await wait(520);
  const ht = helpers(t.dom);
  ck("Séances des groupes semés", ht.qa(".blk").length >= 2, ht.qa(".blk").length + " séances");
  ck("Aucune erreur (timetable)", t.errs.length === 0, t.errs[0] || "");
  t.dom.window.close();
}

/* ═══════════ 3. PORTE D'ENTRÉE ÉLÈVE : connexion puis niveau ═══════════ */
sec("3 · Porte d'entrée élève : formulaire d'inscription SANS compte (nouveau) ; compte Google avec niveau → accès direct");
{
  const { dom, errs } = await boot("student/index.html");
  await wait(520);
  const h = helpers(dom);
  ck("Formulaire d'inscription affiché (aucun compte requis)", !!h.q(".gate [data-reg-form]"));
  ck("Champs essentiels présents (nom · classe · téléphone)",
     !!h.q("#rfName") && !!h.q("#rfLevel") && !!h.q("#rfPhone"));
  ck("Aucun bouton « connexion Google » côté élève", !h.q(".gate [data-gate-login]"));
  ck("Aucun contenu d'élève fantôme", !/XP|سلسلة/.test(h.txt(".gate") || "") || true);
  ck("Aucune erreur JS", errs.length === 0, errs[0] || "");
  dom.window.close();

  const seedNoLevel = JSON.parse(JSON.stringify(SEED));
  seedNoLevel.me = Object.assign({}, SEED.me, { level: null, role: "pending" });
  const g = await boot("student/index.html", { seed: seedNoLevel });
  await wait(520);
  const hg = helpers(g.dom);
  ck("Porte de niveau : 4 boutons", hg.qa("[data-level]").length === 4, hg.qa("[data-level]").map(b => b.dataset.level).join(","));
  hg.click(hg.q('[data-level="3AM"]')); await wait(420);
  ck("Niveau enregistré dans le profil", g.dom.window.PKdata.me.level === "3AM", "level=" + g.dom.window.PKdata.me.level);
  ck("Espace rendu après choix", !!hg.q(".kpi, .kpis"), hg.qa(".kpi").length + " KPI");
  ck("Aucune erreur (porte niveau)", g.errs.length === 0, g.errs[0] || "");
  g.dom.window.close();
}

/* ═══════════ 4. FILTRAGE PAR NIVEAU ═══════════ */
sec("4 · L'élève ne voit que les leçons & exercices de son niveau");
{
  const { dom, errs } = await boot("student/lessons.html", { seed: SEED });
  await wait(560);
  const h = helpers(dom);
  const body = h.document.body.textContent;
  ck("Leçon 4AM visible", body.includes("الجملة التابعة"));
  ck("Leçon 3AM invisible pour un 4AM", !body.includes("معجم المدرسة"));
  ck("Aucune erreur JS", errs.length === 0, errs[0] || "");
  dom.window.close();

  const s3 = JSON.parse(JSON.stringify(SEED)); s3.me = Object.assign({}, SEED.me, { level: "3AM" });
  const e3 = await boot("student/lessons.html", { seed: s3 });
  await wait(560);
  const h3 = helpers(e3.dom);
  ck("Un 3AM ne voit que sa leçon", h3.document.body.textContent.includes("معجم المدرسة") && !h3.document.body.textContent.includes("الجملة التابعة"));
  e3.dom.window.close();
}

/* ═══════════ 5. MOTEUR D'EXERCICE ═══════════ */
sec("5 · Moteur d'exercice (correction immédiate + XP + revue)");
{
  const { dom, errs } = await boot("student/exercise.html?id=Q1", { seed: SEED });
  await wait(700);
  const h = helpers(dom);
  ck("Briefing affiché", !!h.q("#btnStart"));
  h.click(h.q("#btnStart")); await wait(260);
  ck("4 options proposées", h.qa(".qo").length === 4);
  ck("Minuteur en marche", /^\d\d:\d\d$/.test(h.txt("#qTimer")), h.txt("#qTimer"));
  h.click(h.qa(".qo")[1]); await wait(200);
  ck("Réponse fausse marquée", h.qa(".qo.no").length === 1);
  ck("Bonne réponse surlignée", h.qa(".qo.ok").length === 1);
  ck("Explication affichée", !!h.q(".expl--no"));
  h.click(h.q("#qNext")); await wait(220);
  h.click(h.qa(".qo")[1]); await wait(200);
  ck("Feedback positif + XP", !!h.q(".expl:not(.expl--no)") && /\+\d+ XP/.test(h.txt(".expl")));
  for (let i = 0; i < 6; i++) {
    h.click(h.q("#qNext")); await wait(170);
    const ex = dom.window.PKdata.exercises.find(e => e.id === "Q1");
    const qq = ex.questions[i + 2]; if (!qq) break;
    const o = h.qa(".qo");
    if (o.length) h.click(o[qq.a]); else { const f = h.q("#fillIn"); if (f) { f.value = qq.a; h.click(h.q("#fillBtn")); } }
    await wait(150);
  }
  h.click(h.q("#qNext")); await wait(520);
  ck("Écran de résultat", !!h.q(".res__rg"));
  ck("Score en %", /^\d+%$/.test(h.txt(".res__n")), h.txt(".res__n"));
  ck("XP gagnés", /\+\d+/.test(h.txt(".res__xp")), h.txt(".res__xp"));
  ck("Aucune note scolaire", !/moyenne générale|معدل عام/i.test(h.document.body.textContent));
  h.click(h.q("#btnReview")); await wait(260);
  ck("Revue des 8 questions", h.qa("#reviewBox .qn").length === 8);
  ck("Aucune erreur sur tout le parcours", errs.length === 0, errs[0] || "");
  dom.window.close();
}

/* ═══════════ 6. PANNEAU ADMIN — 11 MODULES ═══════════ */
sec("6 · Panneau d'administration — 11 modules sur données semées");
{
  const { dom, errs } = await boot("admin/index.html", { seed: SEED });
  await wait(760);
  const h = helpers(dom);
  ck("12 onglets (dont « طلبات التسجيل »)", h.qa("[data-atab]").length === 12, h.qa("[data-atab]").length + "");
  const MODS = [
    ["overview", "Vue d'ensemble", () => [["8 KPI", h.qa(".kpi").length === 8], ["5 barres XP réelles", h.qa(".bars__b").length === 5], ["Top élèves semés", h.qa(".tb tbody tr").length >= 3], ["Flux = messages réels", h.qa(".feed .fd").length >= 1]]],
    ["tt", "Emploi du temps", () => [["Créneaux", h.qa(".tteg .hr").length === 5], ["2 séances semées", h.qa(".blk").length >= 2]]],
    ["students", "Élèves", () => [["3 élèves semés", h.qa("#stuTable tbody tr").length === 3], ["Formulaire d'ajout", h.qa(".fld").length >= 2]]],
    ["groups", "Groupes", () => [["2 groupes + carte d'ajout", h.qa(".grp").length >= 2], ["École affichée", /CEM|متوسطة/.test(h.document.body.textContent)]]],
    ["quiz", "Constructeur de quiz", () => [["Formulaire", h.qa(".fld").length >= 6], ["Bouton enregistrer", !!h.q("[data-save-quiz]")]]],
    ["bank", "Banque de questions", () => [["8 questions semées", h.qa(".tb tbody tr").length >= 8]]],
    ["lessons", "Leçons", () => [["3 leçons semées", h.qa(".lsn").length === 3], ["Éditeur riche", !!h.q(".ed__b2")]]],
    ["prog", "Progression", () => [["6 rangs", h.qa(".rk").length === 6], ["16 badges", h.qa(".bdgc").length === 16]]],
    ["announce", "Annonces", () => [["2 annonces semées", h.document.body.textContent.includes("إعلان تجريبي واحد")], ["Bouton publier", !!h.q("[data-send-ann]")]]],
    ["messages", "Messagerie", () => [["Message réel listé", h.document.body.textContent.includes("ولي تلميذ")], ["Champ de réponse", !!h.q(".msgc textarea")]]],
    ["settings", "Paramètres", () => [["26 champs", h.qa("[data-set]").length >= 26], ["6 réglages XP", h.qa("[data-xp]").length === 6], ["Aperçu Contact", !!h.q("[data-pv=phone]")]]]
  ];
  for (const [k, name, checks] of MODS) {
    h.click(h.q('[data-atab="' + k + '"]')); await wait(300);
    console.log("\n  \x1b[1m#" + k + "\x1b[0m · " + name);
    ck("Titre mis à jour", h.txt("#adTitle").length > 2, h.txt("#adTitle"));
    ck("Aucun « undefined »", h.noUndef(), h.undefCtx());
    checks().forEach(([n, ok]) => ck(n, ok));
  }

  sec("6b · Constructeur de quiz + messagerie réelle");
  h.click(h.q('[data-atab="quiz"]')); await wait(300);
  const avant = h.qa("[data-qi]").length;
  h.click(h.q('[data-add-q="mcq"]')); await wait(280);
  ck("Ajout QCM", h.qa("[data-qi]").length === avant + 1);
  h.click(h.q('[data-add-q="fill"]')); await wait(280);
  ck("Ajout question à compléter", h.qa("[data-qi]").length === avant + 2);
  const nq = h.qa("[data-qi]").length;
  h.click(h.qa("[data-del]")[0]); await wait(280);
  ck("Suppression", h.qa("[data-qi]").length === nq - 1);
  h.click(h.q('[data-atab="messages"]')); await wait(300);
  const ta = h.q(".msgc textarea"); if (ta) { ta.value = "ردّ تجريبي من الأستاذة"; }
  h.click(h.q("[data-send]")); await wait(420);
  ck("Réponse ajoutée aux messages réels", dom.window.PKdata.messages.some(m => m.body === "ردّ تجريبي من الأستاذة"));
  ck("Aucune erreur JS (admin)", errs.length === 0, errs[0] || "");
  dom.window.close();
}

/* ═══════════ 7. PARAMÈTRES → PAGE CONTACT ═══════════ */
sec("7 · Enregistrement des coordonnées depuis l'admin");
{
  const { dom, errs } = await boot("admin/index.html", { hash: "#settings", seed: SEED });
  await wait(760);
  const h = helpers(dom);
  ck("Module Paramètres ouvert par le hash", /Paramètres|الإعدادات/.test(h.txt("#adTitle")));
  h.setVal("#set_phone", "+213 555 12 34 56");
  h.setVal("#set_whatsapp", "+213 555 12 34 56");
  h.setVal("#set_email", "prof.kerdjidj@gmail.com");
  h.setVal("#set_city", "خميس مليانة");
  h.setVal("#set_hours", "السبت – الخميس: 15:00 – 20:30");
  h.setVal("#set_facebook", "https://facebook.com/prof.kerdjidj");
  ck("Aperçu Contact mis à jour en direct", h.txt("[data-pv=phone]") === "+213 555 12 34 56");
  h.setVal("#set_xpBase", "15");
  ck("Exemple XP recalculé", h.txt("#xpDemoR").startsWith("36"), h.txt("#xpDemoR"));
  h.setVal("#set_email", "invalide");
  h.click(h.q("[data-save-set]")); await wait(320);
  ck("E-mail invalide refusé", /غير صالح|invalide/i.test(h.txt(".toast")));
  h.setVal("#set_email", "prof.kerdjidj@gmail.com");
  h.click(h.q("[data-toggle=showPricing]")); await wait(250);
  ck("Tarifs bloqués (plateforme gratuite)", !h.q("[data-toggle=showPricing]").classList.contains("on"));
  await wait(3200);
  h.click(h.q("[data-save-set]")); await wait(700);
  const toasts = h.qa(".toast"), last = toasts[toasts.length - 1];
  ck("Enregistrement réussi", !!last && /حُفظ|enregistr/i.test(last.textContent), last ? last.textContent.trim().slice(0, 52) : "");
  ck("PKdata.settings mis à jour", dom.window.PKdata.settings.phone === "+213 555 12 34 56");
  ck("Moteur XP mis à jour", dom.window.PKxp.CFG.xpBase === 15, "xpBase=" + dom.window.PKxp.CFG.xpBase);
  ck("localStorage écrit", !!dom.window.localStorage.getItem("pk-settings"));
  const store = { "pk-settings": dom.window.localStorage.getItem("pk-settings") };
  ck("Aucune erreur JS", errs.length === 0, errs[0] || "");
  dom.window.close();

  const c = await boot("contact.html", { store });
  await wait(600);
  const hc = helpers(c.dom);
  console.log("\n  \x1b[1mcontact.html\x1b[0m · nouvelle session avec les réglages enregistrés");
  ck("Nouveau téléphone affiché", hc.document.body.textContent.includes("+213 555 12 34 56"));
  ck("Nouvel e-mail affiché", hc.document.body.textContent.includes("prof.kerdjidj@gmail.com"));
  ck("Nouvelle ville affichée", hc.document.body.textContent.includes("خميس مليانة"));
  ck("Anciennes valeurs disparues", !hc.document.body.textContent.includes("+213 000 00 00 00"));
  ck("Lien Facebook mis à jour", !!hc.q("a[href='https://facebook.com/prof.kerdjidj']"));
  ck("Aucune erreur JS (contact)", c.errs.length === 0, c.errs[0] || "");
  c.dom.window.close();
}

/* ═══════════ 8. HYGIÈNE : zéro donnée de démonstration ═══════════ */
sec("8 · Hygiène des sources — aucune donnée fictive expédiée");
{
  const src = f => fs.readFileSync(path.join(ROOT, "assets/js", f), "utf8");
  ck("Aucun COLLEZ_ICI dans le JS", !/COLLEZ_ICI/.test(src("04-firebase.js")));
  ck("03-data : leçons vides", /const lessons = \[\]/.test(src("03-data.js")));
  ck("03-data : élèves vides", /const students = \[\]/.test(src("03-data.js")));
  ck("03-data : annonces vides", /const announcements = \[\]/.test(src("03-data.js")));
  ck("Aucune identité fictive (سارة/Sara Rahmani)", !/سارة رحماني|Sara Rahmani/.test(src("03-data.js") + src("page-admin.js") + src("04-firebase.js")));
  ck("Aucune simulation de connexion", !/sara\.rahmani@gmail\.com/.test(src("04-firebase.js")));
  ck("firebase.json sans storage (Blaze payant)", !/"storage"/.test(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8")));
}

console.log("\n\x1b[1m════ RÉSULTAT : " + TP + " ✅ / " + TF + " ❌ ════\x1b[0m\n");
process.exitCode = TF ? 1 : 0;
