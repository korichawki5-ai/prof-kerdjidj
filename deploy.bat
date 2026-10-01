@echo off
chcp 65001 >nul
REM ══════════════════════════════════════════════════════════════
REM  نشر منصة الأستاذة كرجيج على Firebase — Windows
REM  الاستعمال : نقر مزدوج على الملف، أو  deploy.bat  في موجه الأوامر
REM  ⚠️ قبل التشغيل : خذ نسخة احتياطية (تنزيل الكود + تصدير Firestore)
REM ══════════════════════════════════════════════════════════════
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

echo ══ 5/6 · ربط المشروع + رفع القواعد والفهارس ══
if exist .firebaserc (call firebase use default) else (call firebase use --add)
call firebase deploy --only firestore:rules,firestore:indexes

echo ══ 6/6 · نشر الموقع ══
call firebase deploy --only hosting

echo.
echo ✅ تم النشر بنجاح
echo    الموقع : https://prof-kerdjidj.web.app
echo    اللوحة : https://prof-kerdjidj.web.app/admin/index.html
echo.
echo تذكير: افتح الموقع وتأكد أن الدروس تظهر، وأن دخول الأستاذة يعمل
echo         ثم راجع قائمة التحقق في README-NASHR.md
pause
