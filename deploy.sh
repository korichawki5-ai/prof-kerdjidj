#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  نشر منصة الأستاذة كرجيج على Firebase — بأمر واحد
#  الاستعمال :  bash deploy.sh
#  ⚠️ قبل التشغيل : خذ نسخة احتياطية (تنزيل الكود + تصدير Firestore)
# ══════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"
Bleu="\033[1;34m"; Vert="\033[1;32m"; Rouge="\033[1;31m"; Jaune="\033[1;33m"; Fin="\033[0m"
ok(){ echo -e "${Vert}✓${Fin} $1"; }
ko(){ echo -e "${Rouge}✗ $1${Fin}"; exit 1; }
warn(){ echo -e "${Jaune}⚠${Fin} $1"; }

echo -e "${Bleu}══ 1/6 · التحقق من المتطلبات ══${Fin}"
command -v node     >/dev/null || ko "Node.js غير مثبّت → https://nodejs.org (نسخة LTS)"
command -v firebase >/dev/null || { echo "  → تثبيت firebase-tools…"; npm install -g firebase-tools; }
ok "Node $(node -v) · Firebase CLI $(firebase --version)"

echo -e "${Bleu}══ 2/6 · التحقق من إعداد Firebase ══${Fin}"
grep -q "COLLEZ_ICI" assets/js/04-firebase.js && \
  ko "لم تضع مفاتيح مشروعك بعد في assets/js/04-firebase.js (السطر 13) — راجع SETUP-AR.md الجزء 3"
ok "المفاتيح موجودة"
[ -f .firebaserc ] && ok "المشروع مربوط: $(grep -o '\"default\"[^,}]*' .firebaserc | head -1)" \
                   || warn "لا يوجد .firebaserc — سيُطلب منك اختيار المشروع"

echo -e "${Bleu}══ 3/6 · تسجيل الدخول ══${Fin}"
firebase login --interactive 2>/dev/null || firebase login
ok "تم الدخول"

echo -e "${Bleu}══ 4/6 · ربط المشروع ══${Fin}"
if [ -f .firebaserc ]; then firebase use default 2>/dev/null || firebase use --add
else firebase use --add; fi
ok "المشروع مربوط"

echo -e "${Bleu}══ 5/6 · رفع قواعد الأمان والفهارس ══${Fin}"
firebase deploy --only firestore:rules,firestore:indexes
ok "القواعد مرفوعة"

echo -e "${Bleu}══ 6/6 · نشر الموقع ══${Fin}"
firebase deploy --only hosting
echo
echo -e "${Vert}✅ تم النشر بنجاح${Fin}"
echo -e "   الموقع : https://prof-kerdjidj.web.app"
echo -e "   اللوحة : https://prof-kerdjidj.web.app/admin/index.html"
echo -e "${Jaune}تذكير:${Fin} افتح الموقع وتأكد أن الدروس تظهر، وأن دخول الأستاذة يعمل — ثم راجع قائمة التحقق في README-NASHR.md"
