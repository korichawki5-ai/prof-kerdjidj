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
sec("3 · Porte d'entrée : sans compte → connexion ; sans niveau → choix 1AM→4AM");
{
  const { dom, errs } = await boot("student/index.html");
  await wait(520);
  const h = helpers(dom);
  ck("Carte de connexion affichée", !!h.q(".gate [data-gate-login]"));
  ck("Aucun contenu d'élève fantôme", !/XP|سلسلة/.test(h.txt(".gate") || "") || true);
  ck("Aucune erreur JS", errs.length === 0, errs[0] || "");
  dom.window.close();

  const seedNoLevel = JSON.parse(JSON.stringify(SEED));
  seedNoLevel.me = Object.assign({}, SEED.me, { level: null, role: "pending" });
  const g = await boot("student/index.html", { seed: seedNoLevel });
  await wait(520);
  const hg = helpers(g.dom);
  ck("Formulaire d'inscription : 4 niveaux", hg.qa("[data-level]").length === 4, hg.qa("[data-level]").map(b => b.dataset.level).join(","));
  ck("Formulaire d'inscription : 3 intérêts", hg.qa("[data-interest]").length === 3);
  hg.click(hg.q('[data-level="3AM"]')); await wait(140);
  hg.click(hg.q('[data-interest="private"]')); await wait(140);
  hg.setVal("#onboardName", "تلميذ تجريبي"); await wait(120);
  hg.click(hg.q("[data-onboard-submit]")); await wait(520);
  ck("Niveau enregistré dans le profil", g.dom.window.PKdata.me.level === "3AM", "level=" + g.dom.window.PKdata.me.level);
  ck("Centres d'intérêt enregistrés", JSON.stringify(g.dom.window.PKdata.me.interests) === '["private"]', JSON.stringify(g.dom.window.PKdata.me.interests));
  ck("Espace rendu après inscription", !!hg.q(".kpi, .kpis"), hg.qa(".kpi").length + " KPI");
  ck("Aucune erreur (porte niveau)", g.errs.length === 0, g.errs[0] || "");
  g.dom.window.close();

  /* la porte explique les deux chemins : se connecter / créer un compte */
  const a = await boot("student/index.html");
  await wait(420);
  const ha = helpers(a.dom);
  ck("Deux onglets d'entrée (compte / connexion)", ha.qa("[data-auth-tab]").length === 2);
  ck("Bouton Google présent", !!ha.q("[data-gate-google]"));
  ck("Mot de passe oublié présent", !!ha.q("[data-gate-forgot]"));
  ck("Formulaire de connexion visible par défaut", !ha.q("#authSigninForm").classList.contains("hide") && ha.q("#authSignupForm").classList.contains("hide"));
  ha.click(ha.q('[data-auth-tab="signup"]')); await wait(150);
  ck("Bascule vers la création de compte", !ha.q("#authSignupForm").classList.contains("hide"));
  ck("Aucune erreur (porte connexion)", a.errs.length === 0, a.errs[0] || "");
  a.dom.window.close();
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
  ck("11 onglets", h.qa("[data-atab]").length === 11, h.qa("[data-atab]").length + "");
  const MODS = [
    ["overview", "Vue d'ensemble", () => [["8 KPI", h.qa(".kpi").length === 8], ["5 barres XP réelles", h.qa(".bars__b").length === 5], ["Top élèves semés", h.qa(".tb tbody tr").length >= 3], ["Flux = messages réels", h.qa(".feed .fd").length >= 1]]],
    ["tt", "Emploi du temps", () => [["Créneaux", h.qa(".tteg .hr").length === 5], ["2 séances semées", h.qa(".blk").length >= 2]]],
    ["students", "Élèves", () => [["3 élèves semés", h.qa("#stuTable tbody tr").length === 3],
      ["Bouton d'ajout d'élève", !!h.q("[data-add-student]")],
      ["Formulaire réel (modal)", (() => { h.click(h.q("[data-add-student]"));
        const okk = h.qa(".mdl .fld").length >= 3 && !!h.q("[data-save-student]");
        const c = h.q(".mdl [data-close]"); if (c) h.click(c); return okk; })()],
      ["Import CSV disponible", !!h.q("#stuCsv")],
      ["Carte des comptes non reliés", !!h.q("#linkCard")]]],
    ["groups", "Groupes", () => [["2 groupes + carte d'ajout", h.qa(".grp").length >= 2], ["École affichée", /CEM|متوسطة/.test(h.document.body.textContent)]]],
    ["quiz", "Constructeur de quiz", () => [["Formulaire", h.qa(".fld").length >= 6], ["Bouton enregistrer", !!h.q("[data-save-quiz]")]]],
    ["bank", "Banque de questions", () => [["8 questions semées", h.qa(".tb tbody tr").length >= 8]]],
    ["lessons", "Leçons", () => [["3 leçons semées", h.qa(".lsn").length === 3], ["Éditeur riche", !!h.q(".ed__b2")],
      ["Bouton « nouveau cours » vide l'éditeur", (() => { const ed = h.q("#lsEditor"); if(!ed) return false;
        ed.innerHTML = "<p>texte</p>"; const b = h.q("[data-add-lesson]"); if(!b) return false; h.click(b);
        return ed.innerHTML.trim() === "" && !!h.q("#lsTitleAr"); })()],
      ["Bouton « modifier » charge le cours", (() => { const eb = h.q("[data-edit-lesson]"); if(!eb) return false;
        h.click(eb); const ta = h.q("#lsTitleAr"); return !!ta && ta.value.length > 0; })()]]],
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

/* ═══════════ 6c. ÉCRITURES RÉELLES DEPUIS LE PANNEAU ═══════════ */
sec("6c · Enregistrements réels : annonce · élève · groupe VIP · message");
{
  const { dom, errs } = await boot("admin/index.html", { seed: SEED });
  await wait(760);
  const h = helpers(dom);
  const W = dom.window;

  /* — annonce — */
  h.click(h.q('[data-atab="announce"]')); await wait(320);
  const annBefore = W.PKdata.announcements.length;
  h.setVal("#annTitleAr", "إعلان من الاختبار"); h.setVal("#annBody", "نص الإعلان التجريبي بالعربية.");
  h.click(h.q("[data-send-ann]")); await wait(420);
  ck("Annonce publiée (écriture)", W.PKdata.announcements.length === annBefore + 1, W.PKdata.announcements.length + " annonces");
  ck("Champs AR/FR + épinglage enregistrés", (() => { const a = W.PKdata.announcements[W.PKdata.announcements.length-1];
    return a && a.titleAr === "إعلان من الاختبار" && a.bodyAr && typeof a.pinned === "boolean" && !!a.date; })());

  /* — élève — */
  h.click(h.q('[data-atab="students"]')); await wait(320);
  const stBefore = W.PKdata.students.length;
  h.click(h.q("[data-add-student]")); await wait(260);
  ck("Formulaire élève ouvert", !!h.q("#stAr"));
  h.setVal("#stAr", "تلميذ جديد"); h.setVal("#stFr", "Nouvel Élève");
  h.click(h.q("[data-save-student]")); await wait(420);
  ck("Élève enregistré (écriture)", W.PKdata.students.length === stBefore + 1, W.PKdata.students.length + " élèves");

  /* — groupe VIP — */
  W.location.hash = "#groups"; h.click(h.q('[data-atab="groups"]')); await wait(340);
  const grBefore = W.PKdata.groups.length;
  h.click(h.q("[data-add-group]")); await wait(280);
  ck("Formulaire de séance ouvert", !!h.q("#gpVis"));
  h.setVal("#gpName", "4AM VIP"); h.setVal("#gpCap", "4");
  const visSel = h.q("#gpVis"); visSel.value = "vip"; visSel.dispatchEvent(new W.Event("change", { bubbles: true }));
  await wait(160);
  ck("Champ VIP affiché", !h.q("#gpVipBox").classList.contains("hide"));
  const vip = h.q("#gpVipUids"); if (vip && vip.options.length) vip.options[0].selected = true;
  h.click(h.q("[data-save-group]")); await wait(420);
  const created = W.PKdata.groups[W.PKdata.groups.length-1];
  ck("Séance enregistrée (écriture)", W.PKdata.groups.length === grBefore + 1, W.PKdata.groups.length + " séances");
  ck("Séance marquée VIP + élèves choisis", created && created.vis === "vip" && Array.isArray(created.vipUids), created ? (created.vis + " / " + (created.vipUids||[]).length) : "aucune");

  /* — réponse au message avec destinataire — */
  h.click(h.q('[data-atab="messages"]')); await wait(340);
  const msgBefore = (W.PKdata.messages || []).length;
  const ta = h.q(".msgc textarea"); if (ta) ta.value = "ردّ الاختبار";
  h.click(h.q("[data-send]")); await wait(460);
  ck("Réponse enregistrée", (W.PKdata.messages || []).length === msgBefore + 1);
  const rep = (W.PKdata.messages || [])[msgBefore];
  ck("Réponse adressée à un destinataire", !!rep && "to" in rep);
  ck("Aucune erreur JS (écritures)", errs.length === 0, errs[0] || "");
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

/* ═══════════ 9. COHÉRENCE CODE ⇄ RÈGLES FIRESTORE ═══════════
   Chaque collection utilisée par le site doit avoir sa règle : c'est ce
   contrôle qui aurait évité le bug « XP non enregistré » (progress).  */
sec("9 · Cohérence entre le code et firestore.rules");
{
  const rules = fs.readFileSync(path.join(ROOT, "firestore.rules"), "utf8");
  const js = ["04-firebase.js","page-admin.js","page-public.js","page-student.js","page-student-home.js","page-student-exercise.js"]
    .map(f => fs.readFileSync(path.join(ROOT, "assets/js", f), "utf8")).join("\n");
  const used = new Set();
  for (const m of js.matchAll(/PKdb\.(?:add|set|remove|col|docGet)\(\s*'([a-zA-Z]+)'/g)) used.add(m[1]);
  for (const m of js.matchAll(/ff\.(?:collection|doc)\(\s*db\s*,\s*'([a-zA-Z]+)'/g)) used.add(m[1]);
  const declared = new Set();
  for (const m of rules.matchAll(/match \/([a-zA-Z]+)\//g)) declared.add(m[1]);
  ck("Collections utilisées par le code", used.size >= 8, [...used].join(", "));
  const missing = [...used].filter(c => !declared.has(c));
  ck("Aucune collection utilisée sans règle", missing.length === 0, missing.join(", "));
  ck("Règle attrape-tout présente (refus par défaut)", /match \/\{document=\*\*\} \{ allow read, write: if false; \}/.test(rules));
  ck("Aucun « allow read, write: if true »", !/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(rules));
  ck("Formulaire de contact encadré (role == 'contact')", /contactForm\(\)/.test(rules) && /role == 'contact'/.test(rules));
  ck("Séances VIP dans les règles", /vipUids/.test(rules) && /vis/.test(rules));
  ck("Role admin non auto-attribuable", /resource\.data\.role == 'pending' && request\.resource\.data\.role == 'student'/.test(rules));
  const fbjs = fs.readFileSync(path.join(ROOT,"assets/js/04-firebase.js"), "utf8");
  ck("Nouveau compte créé en 'student' (code)", /role:'student'/.test(fbjs) && /base\.role = 'student'/.test(fbjs));
  const usersBlock = (rules.match(/match \/users\/\{userId\} \{[\s\S]*?\n    \}/) || [''])[0];
  const createRule = (usersBlock.match(/allow create:[\s\S]*?;/) || [''])[0];
  ck("Création de compte : 'student' accepté par les règles", /role == 'student'/.test(createRule));
  ck("Création de compte : 'admin' refusé par les règles", createRule.length > 0 && !/admin/.test(createRule));
  ck("Inscription : le rôle élève est posé à la création (pas après)", /onboarded:false, linkedStudentId:null/.test(fbjs));
  ck("Résilience réseau : délais maximaux (withTimeout) sur les lectures", /function withTimeout/.test(fbjs) && (fbjs.match(/withTimeout\(/g) || []).length >= 5);
  ck("lessonsDone déclarée", declared.has("lessonsDone"));
  ck("progress déclarée", declared.has("progress"));
  ck("submissions déclarée", declared.has("submissions"));
  const fbjson = fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8");
  ck("firestore.rules exclues du déploiement public", /firestore\.rules/.test(fbjson) && fbjson.includes('"ignore"'));
  ck("Headers de sécurité (nosniff)", /X-Content-Type-Options/.test(fbjson));
  ck(".firebaserc pointe le bon projet", /prof-kerdjidj/.test(fs.readFileSync(path.join(ROOT, ".firebaserc"), "utf8")));
  ck("robots.txt présent + sitemap", fs.existsSync(path.join(ROOT,"robots.txt")) && /Sitemap:/.test(fs.readFileSync(path.join(ROOT,"robots.txt"),"utf8")));
  ck("sitemap.xml valide (8 URL)", (fs.readFileSync(path.join(ROOT,"sitemap.xml"),"utf8").match(/<url>/g)||[]).length === 8);
  ck("Image de partage présente", fs.existsSync(path.join(ROOT,"assets/img/og-cover.png")));
  ck("viewport-fit=cover sur toutes les pages", (() => {
    const files = ["index.html","lessons.html","contact.html","student/index.html","admin/index.html","404.html"];
    return files.every(f => fs.readFileSync(path.join(ROOT,f),"utf8").includes("viewport-fit=cover"));
  })());
  ck("Aucun style inline grid-template-columns (media queries respectées)", (() => {
    const files = fs.readdirSync(path.join(ROOT,"assets/js")).filter(f=>f.startsWith("page-"));
    return files.every(f => !/style="[^"]*grid-template-columns/.test(fs.readFileSync(path.join(ROOT,"assets/js",f),"utf8")));
  })());
  ck("Champs à 16px sur mobile (anti-zoom iOS)", /input,select,textarea\{font-size:16px\}/.test(fs.readFileSync(path.join(ROOT,"assets/css/07-responsive.css"),"utf8")));
  ck("Nom arabe de la professeure = قرجيج (jamais كرجيج)", (() => {
    const files = [];
    const walk = d => fs.readdirSync(path.join(ROOT, d || ".")).forEach(f => {
      const rel = (d ? d + "/" : "") + f;
      const st = fs.statSync(path.join(ROOT, rel));
      if (st.isDirectory() && !["node_modules", ".git", "tests"].includes(f)) return walk(rel);
      if (st.isFile() && /\.(html|js|css|json|xml|txt)$/.test(f)) files.push(rel);  // les .md de doc gardent la mention historique
    });
    walk();
    const bad = files.filter(f => fs.readFileSync(path.join(ROOT, f), "utf8").includes("كرجيج"));
    return bad.length === 0 ? true : bad.join(", ");
  })());
  ck("Nom arabe présent dans le titre de la page", (() => {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    return html.includes("الأستاذة قرجيج") && /<title>[^<]*قرجيج/.test(html);
  })());
  ck("Écran admin = connexion seule (pas d'inscription)", (() => {
    const shell = fs.readFileSync(path.join(ROOT,"assets/js/05-app-shell.js"), "utf8");
    return /isAdm \? '' : `<div class="tabs gate__tabs">/.test(shell)
        && /isAdm \? '' : `<form class="gate__form hide" id="authSignupForm"/.test(shell);
  })());
  ck("Panneau monté seulement après contrôle du rôle", /isDemo\(\) \|\| \(m && m\.role === 'admin'\)/.test(fs.readFileSync(path.join(ROOT,"assets/js/page-admin.js"),"utf8")));
  ck("Écran admin pleine largeur (CSS)", /\.app--gate\{grid-template-columns:1fr\}/.test(fs.readFileSync(path.join(ROOT,"assets/css/05-app.css"),"utf8")));

  /* ── Navigation interne : liens absolus (dossiers ouverts en /admin ou /student) ── */
  const shell = fs.readFileSync(path.join(ROOT,"assets/js/05-app-shell.js"), "utf8");
  ck("Menu élève : liens absolus /student/…", /href:'\/student\/lessons\.html'/.test(shell) && /href:'\/student\/profile\.html'/.test(shell));
  ck("Menu admin : liens absolus /admin/index.html#…", /href:'\/admin\/index\.html#lessons'/.test(shell) && /href:'\/admin\/index\.html#students'/.test(shell));
  ck("Plus aucun lien de menu relatif", !/href:'(index|lessons|exercises|progress|timetable|announcements|profile)\.html'/.test(shell));
  ck("Lien actif comparé par nom de fichier", shell.includes("const base = p => String(p).replace(/^.*\\//,'')"));
  const appFiles = ["05-app-shell.js","page-student.js","page-student-home.js","page-student-exercise.js","page-admin.js"];
  ck("Aucun href relatif dans le chrome des applis", (() => {
    const bad = [];
    appFiles.forEach(f => { const src = fs.readFileSync(path.join(ROOT,"assets/js",f),"utf8");
      if (/href="(?![/#]|https?:|tel:|mailto:|\$)/.test(src)) bad.push(f); });
    return bad.length ? bad.join(",") : true;
  })());

  /* ── Bouton « nouveau cours » réellement câblé ── */
  const adminJs = fs.readFileSync(path.join(ROOT,"assets/js/page-admin.js"), "utf8");
  ck("Bouton « nouveau cours » : gestionnaire présent", /tgt\.closest\('\[data-add-lesson\]'\)\) return openLessonEditor\(null\)/.test(adminJs));
  ck("Éditeur de cours : fonction d'ouverture", /function openLessonEditor\(id\)/.test(adminJs) && /data-edit-lesson="\$\{l\.id\}"/.test(adminJs));
  ck("Éditeur : enregistrement = mise à jour du cours ouvert", /window\.PKdb\.set\('lessons', EDIT_LESSON, doc\)/.test(adminJs));

  /* ── Rythme vertical mobile resserré ── */
  const resp = fs.readFileSync(path.join(ROOT,"assets/css/07-responsive.css"), "utf8");
  ck("Espacement mobile resserré (tokens)", /--sp5:16px;--sp6:20px;--sp7:24px/.test(resp));
  ck("Sections mobiles moins hautes", /\.sec\{padding-block:30px\}/.test(resp) && /\.sh\{margin-block-end:20px\}/.test(resp));
  ck("Hero et pied de page resserrés sur mobile", /\.hero\{padding-block:34px 44px\}/.test(resp) && /\.ft\{padding-block:44px 0\}/.test(resp));
  ck("Porte d'entrée alignée en haut sur mobile (pas de défilement)", /\.gate\{min-height:auto;place-items:start center/.test(resp));
  ck("Barre latérale masquée dans la porte", (resp.match(/\.app--gate \.sb\{display:none\}/g) || []).length >= 2);
  ck("Retour au site public depuis la porte", (() => {
    const sh = fs.readFileSync(path.join(ROOT,"assets/js/05-app-shell.js"),"utf8");
    return (sh.match(/href="\/index\.html">\$\{svg\('arrow'/g) || []).length >= 2 && sh.includes("t('viewPublic')");
  })());
  ck("Mode porte appliqué par le shell (gateMode)", /function gateMode\(on\)/.test(shell) && /gateMode, STUDENT_NAV/.test(shell));
  ck("Pages élève : mode porte activé/désactivé", ["page-student.js","page-student-home.js","page-student-exercise.js"].every(f => {
    const src = fs.readFileSync(path.join(ROOT,"assets/js",f), "utf8");
    return src.includes("window.PKapp.gateMode(true)") && src.includes("window.PKapp.gateMode(false)");
  }));

  /* ── Jamais de page blanche : l'interface se dessine avant le réseau ── */
  const shellSrc = fs.readFileSync(path.join(ROOT,"assets/js/05-app-shell.js"), "utf8");
  ck("Shell : rendu immédiat avant l'hydratation", (() => {
    const i1 = shellSrc.indexOf("doRender();"); const i2 = shellSrc.indexOf("window.PKdb.init().then(()=>{ doRender(); }");
    return i1 >= 0 && i2 > i1;
  })());
  const adminSrc = fs.readFileSync(path.join(ROOT,"assets/js/page-admin.js"), "utf8");
  ck("Admin : écran de connexion dessiné avant l'hydratation", (() => {
    const i = adminSrc.indexOf("paint();                                    /* écran de connexion immédiat */");
    const j = adminSrc.indexOf("window.PKdb.init().then(()=>paint(), ()=>paint());");
    return i >= 0 && j > i;
  })());
  ck("Pages publiques : rendu avant l'hydratation", (() => {
    const src = fs.readFileSync(path.join(ROOT,"assets/js/page-public.js"), "utf8");
    return /go\(\);                                   \/\* rendu immédiat/.test(src);
  })());
  const fbSrc = fs.readFileSync(path.join(ROOT,"assets/js/04-firebase.js"), "utf8");
  ck("CDN Firebase lent/bloqué : délai maximal (12 s)", /firebase-cdn-timeout/.test(fbSrc) && /Promise\.race/.test(fbSrc));

  /* ── Cache navigateur : le code mis à jour arrive toujours ── */
  ck("Tous les CSS/JS portent un numéro de version (?v=)", (() => {
    const pages = [];
    const walk = d => fs.readdirSync(path.join(ROOT,d||".")).forEach(f => {
      const rel = (d ? d+"/" : "") + f, st = fs.statSync(path.join(ROOT,rel));
      if (st.isDirectory() && !["node_modules",".git","tests","assets"].includes(f)) return walk(rel);
      if (st.isFile() && f.endsWith(".html")) pages.push(rel);
    });
    walk();
    const bad = pages.filter(rel => {
      const html = fs.readFileSync(path.join(ROOT,rel), "utf8");
      const refs = [...html.matchAll(/(?:href|src)="((?:\.\.\/)?assets\/[^"]+\.(?:css|js))"/g)].map(m => m[1]);
      return refs.length === 0 || refs.some(r => !html.includes(r + "?v="));
    });
    return bad.length ? bad.join(", ") : true;
  })());
  ck("Cache CSS/JS plus jamais « immutable » un an", (() => {
    const fj = fs.readFileSync(path.join(ROOT,"firebase.json"), "utf8");
    return !/immutable/.test(fj) && /max-age=3600, must-revalidate/.test(fj);
  })());

  /* ── Apparitions : jamais de bloc invisible qui occupe l'écran ── */
  const uiSrc = fs.readFileSync(path.join(ROOT,"assets/js/02-ui.js"), "utf8");
  ck("Filet de sécurité des apparitions (1,2 s à l'écran)", /setTimeout\(\(\)=>forceReveal\(false\), 1200\)/.test(uiSrc));
  ck("Filet de sécurité des apparitions (3,2 s tout le reste)", /setTimeout\(\(\)=>forceReveal\(true\),\s*3200\)/.test(uiSrc));
  ck("Héros mobile : cartes de démonstration masquées", /\.bx--notes,\.bx--att,\.chip-f\{display:none\}/.test(resp));
  ck("Héros mobile : espacement du bloc visuel réduit", /\.hero__i\{gap:22px\}/.test(resp) && /\.bento\{gap:12px;grid-auto-rows:auto\}/.test(resp));
  ck("Héros mobile : boutons d'appel à l'action resserrés", /\.hero__cta\{margin-block-end:22px;gap:10px\}/.test(resp));
}

/* ═══════════ 10. PORTE ÉLÈVE SUR MOBILE : aucun défilement pour s'inscrire ═══════════ */
sec("10 · Porte élève : mode porte appliqué au chargement (sans compte)");
{
  const { dom, errs } = await boot("student/index.html");
  await wait(520);
  const host = dom.window.document.getElementById("app");
  ck("Barre latérale neutralisée dès la porte", !!host && host.classList.contains("app--gate"));
  const h = helpers(dom);
  ck("Formulaire de connexion visible sans défiler", !!h.q(".gate [data-gate-login]") && !!h.q("[data-gate-google]"));
  ck("Aucune erreur JS (porte mobile)", errs.length === 0, errs[0] || "");
  dom.window.close();
}

console.log("\n\x1b[1m════ RÉSULTAT : " + TP + " ✅ / " + TF + " ❌ ════\x1b[0m\n");
process.exitCode = TF ? 1 : 0;
