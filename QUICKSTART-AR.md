# 🚀 النشر السريع — 15 دقيقة

> الشرح الكامل المفصّل في **`SETUP-AR.md`**. هذا ملخّص للطريق المختصر.

## ما تحتاجه
- حساب Google (بريد الأستاذة)
- **Node.js LTS** → <https://nodejs.org> (ثبّته ثم أعد تشغيل الجهاز)

---

## ① أنشئ مشروع Firebase
1. <https://console.firebase.google.com> → **Add project**
2. الاسم: `prof-kerdjidj` → Analytics اختياري → **Create**
3. من القائمة: **Firestore Database → Create database** → الموقع **eur3** → **Production mode**
4. **Authentication → Get started → Google → Enable** → احفظ
5. **Storage → Get started** → **Done**
6. في الصفحة الرئيسية اضغط أيقونة **`</>`** (Web) → اسم التطبيق `Plateforme Prof. Kerdjidj` → **Register app** → **انسخ كتلة `firebaseConfig`**

## ② الصق المفاتيح
افتح `assets/js/04-firebase.js` — **السطر 13** — واستبدل القيم الست:
```js
const firebaseConfig = {
  apiKey:            "AIza…",              ← من Firebase
  authDomain:        "prof-kerdjidj.firebaseapp.com",
  projectId:         "prof-kerdjidj",
  storageBucket:     "prof-kerdjidj.appspot.com",
  messagingSenderId: "000000000000",
  appId:             "1:000000000000:web:0000…"
};
```
واحفظ. **هذا كل ما يلزم لتحويل الموقع من تجريبي إلى حيّ** — لا تعديل في أي ملف آخر.

## ③ انشر
| ويندوز | ماك / لينكس |
|--------|-------------|
| نقر مزدوج على **`deploy.bat`** | `bash deploy.sh` |

السكربت يتكفّل بكل شيء: تثبيت Firebase CLI، الدخول، ربط المشروع، رفع قواعد الأمان، ثم النشر.
في نهاية التشغيل يظهر رابطك: `https://prof-kerdjidj.web.app` 🎉

### أو يدوياً (4 أوامر)
```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes,storage,hosting
```

## ④ خطوة إلزامية أخيرة — صلاحيات الأستاذة
بدون هذه الخطوة تفتح لوحة الإدارة لكن **لا تُقبل أي كتابة**.

1. **Authentication → Users** → افتح حساب الأستاذة → انسخ الـ **UID**
2. **Firestore Database → Start collection** باسم `users`
3. **Document ID** = الصق الـ UID
4. أضف الحقول:

| Field | Type | Value |
|-------|------|-------|
| `role` | string | `admin` |
| `name` | string | `Prof. Kerdjidj` |
| `email` | string | بريد الأستاذة |

5. **Save**

---

## ✅ تحقّق في دقيقتين
| جرّب | المتوقّع |
|------|----------|
| افتح رابطك | الموقع العام يعمل |
| `admin/index.html` → الإعدادات | «متصل بـ Firestore» بدل «وضع تجريبي» |
| أضف تمريناً واحفظ | يُحفظ ويظهر بعد إعادة التحميل |
| ادخل بحساب تلميذ ثم افتح `admin/` | **مرفوض** — القواعد تعمل |
| بدّل AR ⇄ FR و`Ctrl+K` | كل شيء يستجيب |

## 🌍 ربط نطاق خاص (اختياري)
**Hosting → Add custom domain** → أضف سجلَّي DNS كما يطلب منك → انتظر تفعيل SSL (15 دقيقة – 24 ساعة).

---

## ❓ إن تعطّل شيء
| العَرَض | الحلّ |
|---------|-------|
| «firebase ليس أمراً معروفاً» | أغلق موجه الأوامر وافتحه من جديد بعد تثبيت Node.js |
| ما زال «وضع تجريبي» | `apiKey` ما زال فيه `COLLEZ` — أو لم تحفظ الملف، أو `Ctrl+F5` |
| الكتابة مرفوضة | الخطوة ④ لم تُنفَّذ (`role: "admin"`) |
| الدروس لا تظهر | `firebase deploy --only firestore:rules` لم يُنفَّذ |
| الدخول بـ Google يفشل | **Authentication → Settings → Authorized domains** → أضف نطاقك |

المزيد في `SETUP-AR.md` (الجزء 8).
