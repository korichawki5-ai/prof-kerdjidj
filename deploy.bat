@echo off
chcp 65001 >nul
REM ══════════════════════════════════════════════════════════
REM  نشر منصة الأستاذة كرجيج على Firebase — Windows
REM  الاستعمال : نقر مزدوج، أو  deploy.bat  في موجه الأوامر
REM ══════════════════════════════════════════════════
cd /d "%~dp0"

echo ══ 1/6 · التحقق من Node.js ══
where node >nul 2>&1 || (echo [X] Node.js غير مثبّت - حمّله من https://nodejs.org نسخة LTS & pause & exit /b 1)
node -v

echo ══ 2/6 · تثبيت Firebase CLI ══
where firebase >nul 2>&1 || (echo     جارٍ التثبيت... & call npm install -g firebase-tools)

echo ══ 3/6 · التحقق من مفاتيح Firebase ══
findstr /C:"COLLEZ_ICI" assets\js\04-firebase.js >nul 2>&1 && (
  echo [X] لم تضع مفاتيح مشروعك في assets\js\04-firebase.js ^(السطر 13^)
  echo     راجع SETUP-AR.md الجزء 3 ثم أعد التشغيل
  pause & exit /b 1
)
echo [OK] المفاتيح موجودة

echo ══ 4/6 · تسجيل الدخول ══
call firebase login

echo ══ 5/6 · ربط المشروع + رفع القواعد ══
call firebase use --add
call firebase deploy --only firestore:rules,firestore:indexes,storage

echo ══ 6/6 · نشر الموقع ══
call firebase deploy --only hosting

echo.
echo [OK] تم النشر 🎉  - الرابط ظهر أعلاه بصيغة https://XXXX.web.app
echo.
echo ⚠ تذكير إلزامي مرة واحدة:
echo    Firestore ^> users ^> مستند جديد بمعرّف uid الخاص بالأستاذة
echo    الحقل:  role = "admin"
echo.
pause
