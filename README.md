# منصة الأستاذة قرجيج للغة الفرنسية
### Plateforme Prof. Kerdjidj — Français

منصّة مراجعة وتدريب في اللغة الفرنسية لتلاميذ الطور المتوسط (1AM → 4AM) — خميس مليانة، ولاية عين الدفلى، الجزائر.
Plateforme de révision et d'entraînement en français pour les collégiens (1AM → 4AM) — Khemis Miliana, Aïn Defla, Algérie.

> **مبدأ أساسي · Principe fondateur**
> المنصّة **غير مرتبطة بالمدرسة**: لا نقاط، لا معدّلات، لا كشوف. كل التمارين والفروض للتدريب والمراجعة فقط.
> 대신 يوجد **نظام تطوّر تحفيزي**: XP، رُتَب، سلاسل يومية، نسبة إتقان لكل محور، وأوسمة.
> La plateforme **n'est pas connectée à l'école** : aucune note, aucune moyenne, aucun bulletin.
> Les exercices sont uniquement de l'entraînement. À la place : un **système de progression motivant** —
> XP, rangs, séries quotidiennes, taux de maîtrise par axe et badges.
>
> ---
> ### 🆕 الإصدار 2 — إصلاحات جوهرية (2026)
> · المحتوى المنشور يظهر لكل الزوار · دخول التلميذ: **إنشاء حساب بالبريد أو Google** + اختيار السنة والاهتمام
> · **XP والتقدّم يُحفظان فعلاً** وتظهر للأستاذة · لوحة الإدارة **تحفظ** الإعلانات والدروس والتلاميذ والأفواج
> · **حصص عامة وحصص VIP** (لا تظهر إلا لأصحابها) · قفل كامل لقسم الأستاذة · تحسين شامل للهاتف
> · التفاصيل الكاملة: [`FIXES.md`](FIXES.md) · طريقة النشر: [`README-NASHR.md`](README-NASHR.md)
>
> **لا دفع ولا اشتراكات ولا خطط أسعار — المنصّة مجانية بالكامل.**
> **Aucun paiement, aucun abonnement, aucune offre tarifaire — la plateforme est entièrement gratuite.**

---

## 1 · الصفحات · Les pages (18)

| # | الصفحة | المسار | الوصف |
|---|--------|--------|-------|
| 1 | الرئيسية | `index.html` | واجهة عامة: بطل متدرّج، شبكة Bento، المستويات، المحاور، المواقيت، الدروس، اختبار حيّ |
| 2 | المستويات | `levels.html` | 1AM → 4AM + 9 محاور |
| 3 | الدروس | `lessons.html` | بحث + تصفية بالمستوى/المحور |
| 4 | التمارين | `exercises.html` | تصفية بالنوع والصعوبة |
| 5 | المواقيت | `timetable.html` | شبكة أسبوعية + حصص يوم بيوم + قابلة للطباعة |
| 6 | الأستاذة | `about.html` | السيرة، المنهجية، الشهادات |
| 7 | أسئلة شائعة | `faq.html` | 10 أسئلة |
| 8 | تواصل | `contact.html` | نموذج + المعلومات |
| 9 | **لوحة التلميذ** | `student/index.html` | 8 مؤشرات، شريط XP، سلسلة، تمارين مقترحة، خريطة نشاط |
| 10 | دروسي | `student/lessons.html` | تصفية + حالة الإكمال |
| 11 | قارئ الدرس | `student/lesson.html?id=…` | محتوى غني + «أنهيت الدرس» = +25 XP |
| 12 | تماريني | `student/exercises.html` | قائمة التمارين |
| 13 | **مشغّل التمرين** | `student/exercise.html?id=…` | تصحيح فوري + شرح + حساب XP حقيقي + مراجعة |
| 14 | تقدّمي | `student/progress.html` | رتبة، رسم XP، إتقان، سجلّ، 16 وساماً، خريطة 12 أسبوعاً |
| 15 | جدولي | `student/timetable.html` | حصص فوجي مميّزة + عدّاد |
| 16 | الإعلانات | `student/announcements.html` | إعلانات الأستاذة + تنبيهاتي |
| 17 | ملفي | `student/profile.html` | معلوماتي، Google، تفضيلاتي |
| 18 | **لوحة الإدارة** | `admin/index.html#module` | 10 وحدات (انظر §3) |

## 2 · التقنيات · Stack

- **HTML5 + CSS3 + JavaScript ES6 خام** — بلا إطار عمل ولا بناء (no framework, no build step).
- **Firebase** : Firestore (البيانات) · Authentication بحساب Google · Storage (ملفات PDF/فيديو) · Hosting.
- **PWA-ready** · دعم كامل لـ RTL/LTR · وضع داكن/فاتح · طباعة CSS · احترام `prefers-reduced-motion`.
- الرسوم البيانية مرسومة يدوياً بـ SVG (رادار، حلقات، أعمدة، خرائط حرارية) — بلا مكتبات.

## 3 · لوحة الإدارة · Panneau d'administration

| الوحدة | الرابط | الوظائف |
|--------|--------|---------|
| نظرة عامة | `admin/index.html#overview` | 8 مؤشرات، توزيع XP، إتقان المحاور، أعلى 5 تلاميذ، نشاط حديث، إجراءات سريعة |
| المواقيت | `#tt` | شبكة 5 توقيتات × 6 أيام، إضافة/تعديل حصة خاصة |
| التلاميذ | `#students` | جدول كامل، بحث، تصفية، استيراد CSV، ربط حساب Google، بطاقة تلميذ |
| الأفواج | `#groups` | بطاقة لكل فوج: **اسم المدرسة + اسم الأستاذة** + السعة + حلقة الإشغال |
| الاختبارات | `#quiz` | **بانوراما بناء اختبار**: معلومات + أسئلة (QCM / صحيح-خطأ / كتابي) + معاينة حية + سحب وإعادة ترتيب |
| بنك الأسئلة | `#bank` | كل الأسئلة قابلة لإعادة الاستعمال |
| الدروس | `#lessons` | بطاقات الدروس + **محرّر غني** + نشر |
| التقدّم | `#prog` | توزيع الرتب، الأوسمة الـ16، جدول تقدّم كل تلميذ |
| الإعلانات | `#announce` | كتابة + أهمية + جمهور + تثبيت |
| الرسائل | `#messages` | محادثات مع الأولياء والتلاميذ |
| الإعدادات | `#settings` | **تعديل معلومات التواصل وحفظها فعلياً** (هاتف، واتساب، بريد، عنوان، أوقات، شبكات التواصل) + أرقام الموقع + **ضبط نظام XP** (القيم الأساسية، مضاعفات الصعوبة، عتبات الرتب) + وضع الصيانة. معاينة حيّة لصفحة «تواصل» أثناء الكتابة، تحقّق من صحة البريد والهاتف، وزرّ إعادة القيم الأصلية |

## 4 · نظام XP · Le système de progression

```
XP = (10 × صعوبة) + مكافآت        صعوبة: 1 → ×1 · 2 → ×1.6 · 3 → ×2.4
   × مضاعف السلسلة                0→×1 · 3→×1.15 · 7→×1.3 · 14→×1.5 · 30→×1.8 · 60→×2.0
   + درس مكتمل = 25 XP            + اختبار بلا خطأ = +50 XP   + سرعة = +20 XP
   سقف يومي = 600 XP              لا يوجد XP سالب أبداً
```

**6 رُتَب · 6 rangs :** مبتدئ 0 · متمرّن 500 · متمكّن 1500 · متقدّم 3500 · خبير 7000 · أستاذ 12000 XP
**الإتقان · Maîtrise :** 6 مستويات من «يحتاج تدريباً» إلى «متقَن» لكل محور من 9 محاور.
**16 وساماً · 16 badges** (`bd1` → `bd16`).

النتيجة تُعرض دائماً بهذا الشكل: **«14/20 صحيحة · +120 XP»** — وليس كنقطة مدرسية.
Le résultat s'affiche toujours ainsi : **« 14/20 correct · +120 XP »** — jamais comme une note scolaire.

## 5 · البنية · Structure

```
prof-kerdjidj/
├─ index.html · levels.html · lessons.html · exercises.html
├─ timetable.html · about.html · faq.html · contact.html · 404.html
├─ student/  index · lessons · lesson · exercises · exercise
│            progress · timetable · announcements · profile
├─ admin/    index.html  (10 وحدات عبر #hash)
├─ assets/
│  ├─ css/   00-tokens → 07-responsive  (8 ملفات، ~1900 سطر)
│  ├─ js/    00-i18n (626 مفتاح AR/FR) · 01-progression (محرك XP)
│  │         02-ui (68 أيقونة + chrome) · 03-data (بيانات تجريبية)
│  │         04-firebase (Firestore/Auth/Storage) · 05-app-shell
│  │         page-index · page-public · page-student · page-student-home
│  │         page-student-exercise · page-admin
│  └─ img/ · data/
├─ firebase.json · .firebaserc · firestore.rules · storage.rules · firestore.indexes.json
└─ README.md · SETUP-AR.md
```

## 5bis · تعديل معلومات التواصل من لوحة الإدارة

لا تحتاج أي تعديل في الكود لتحديث رقم الهاتف أو البريد أو العنوان:

1. `admin/index.html#settings` ← بطاقة **«التواصل»**.
2. عدّل ما تشاء — **المعاينة الحيّة** على اليسار تُظهر كيف ستبدو صفحة «تواصل».
3. اضغط **«حفظ»**.

| الوضع | أين يُحفظ؟ | من يرى التعديل؟ |
|---|---|---|
| تجريبي (بلا Firebase) | `localStorage` في متصفحك | أنت، على هذا الجهاز |
| حيّ (بعد ربط Firebase) | Firestore ← المستند `settings/main` | **كل زوار الموقع فوراً** |

التعديل يسري على: صفحة **تواصل** · **تذييل كل صفحة** · صفحة **الأستاذة** · عنوان المتصفح · أزرار الشبكات الاجتماعية.
الحقل الفارغ = يُخفى العنصر من الموقع نهائياً.
وكذلك **ضبط نظام XP** من نفس الصفحة يسري على محرّك التمارين كاملاً (`window.PKxp.CFG`).

## 6 · التشغيل محلياً · Lancer en local

```bash
cd prof-kerdjidj
python3 -m http.server 4321        # ou : npx serve .
# → http://localhost:4321
```

المنصّة تعمل فوراً في **وضع تجريبي** (بيانات محلية، بلا Firebase) — كل الوظائف قابلة للتجربة:
التمارين، حساب XP، لوحة الإدارة، تبديل اللغة، الوضع الداكن.
Le site fonctionne immédiatement en **mode démo** (données locales) : exercices, calcul d'XP,
panneau d'administration, bascule de langue et thème sombre sont tous testables.

## 6bis · الاختبارات الآلية · Tests automatisés

```bash
cd tests && npm install        # مرة واحدة
python3 -m http.server 4322 --bind 0.0.0.0 --directory ..   # في نافذة أخرى
node run-all.mjs
```

**214 فحصاً** تغطّي (منها ما يطابق الكود مع قواعد Firestore): 18 صفحة (تحميل بلا أخطاء + تبديل AR ⇄ FR)، محرّك التمارين من السؤال الأول حتى مراجعة
الإجابات، وحدات لوحة الإدارة الإحدى عشرة، تفاعلات بانوراما الاختبار، ومسار **حفظ معلومات التواصل → ظهورها
في صفحة «تواصل» في جلسة جديدة**.

## 7 · النشر على Firebase · Déploiement

الخطوات الكاملة بالعربية في **`SETUP-AR.md`**.

```bash
npm i -g firebase-tools
firebase login
firebase use --add                 # اختر مشروعك
# ضع بيانات مشروعك في assets/js/04-firebase.js (انظر §2 من SETUP-AR.md)
firebase deploy --only firestore:rules,storage,hosting
```

## 8 · التطوير المستقبلي · Évolutions prévues

- **حصص مباشرة عن بُعد** — البنية جاهزة: `groups.mode` يقبل `online`، و`slots` تستوعب أي توقيت.
  Classes en ligne : l'architecture est prête (`groups.mode` accepte `online`).
- ربط Firebase Authentication فعلياً (الدالة `loginGoogle()` موجودة).
- تصدير تقارير PDF للتقدّم (بلا نقاط مدرسية).
- تطبيق PWA مثبت على الهاتف.

---

**صُمّمت وبُنيت بعناية في خميس مليانة 🇩🇿** · Conçue et développée avec soin à Khemis Miliana.

---

## ☁️ التخزين السحابي (Storage) — لماذا هو معطّل اختياريًا؟

منذ فبراير 2026 لم تعد خدمة Cloud Storage متاحة على خطة Spark المجانية إطلاقًا (تتطلب ربط بطاقة دفع بخطة Blaze).
المنصّة **لا تحتاجها**: الدروس نصوص HTML في Firestore، وكل البيانات كذلك.
**البديل المجاني غير المحدود للملفات:**
- **PDF / صور:** ارفعيها على Google Drive ← مشاركة «أي شخص لديه الرابط» ← الصقي الرابط في محتوى الدرس:
  `<a href="الرابط" target="_blank">تحميل الملخص</a>` أو تضمينًا: `<iframe src="https://drive.google.com/file/d/IDENTIFIANT/preview" style="width:100%;height:480px"></iframe>`
- **فيديو الحصص:** ارفعيه على YouTube (غير مدرج Unlisted) ← زر *Partager → Integrer* ← الصقي كود `<iframe>` في الدرس.

ملف `storage.rules` ووظيفة `upload()` باقيان في الكود احتياطًا ليوم تفعيل Blaze اختيارياً.

---

## 🧭 بوابة فضاء التلميذ (اختيار المستوى)

عند أول دخول بحساب Google يُنشأ ملف التلميذ تلقائياً ثم تظهر **بوابة اختيار المستوى**
(السنة الأولى ← الرابعة متوسط). يُحفظ الاختيار في `users/{uid}.level` ولا يتغيّر طوال
السنة الدراسية (الأستاذة وحدها تعدّله). بعدها لا يرى التلميذ **إلا دروس وتمارين مستواه**.

## 🚫 صفر بيانات افتراضية

المنصّة تُنشر **فارغة تماماً**: لا تلاميذ ولا دروس ولا تمارين ولا إعلانات وهمية.
كل ما يظهر للتلاميذ هو ما تنشره الأستاذة من لوحة الإدارة (يُحفظ في Firestore).
الحالات الفارغة صريحة: «لا توجد دروس منشورة لهذا المستوى بعد…».
حزمة الاختبارات تستعمل بذراً معزولاً (`__PK_SEED__`) لا يوجد في الموقع إطلاقاً.
