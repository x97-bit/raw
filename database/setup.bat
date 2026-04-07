@echo off
chcp 65001 >nul
REM ============================================================
REM نظام الراوي للنقل والتخليص - سكربت الإعداد (Windows)
REM Al-Rawi Transport & Clearance System - Setup Script (Windows)
REM ============================================================

echo ============================================
echo   نظام الراوي - إعداد قاعدة البيانات
echo   Al-Rawi Database Setup
echo ============================================
echo.

REM التحقق من وجود MySQL
where mysql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ خطأ: MySQL غير مثبت أو غير موجود في PATH
    echo    يرجى تثبيت MySQL أولاً من:
    echo    https://dev.mysql.com/downloads/
    echo.
    echo    أو أضف مسار MySQL إلى متغير PATH
    echo    مثال: C:\Program Files\MySQL\MySQL Server 8.0\bin
    pause
    exit /b 1
)

set /p DB_HOST="🔗 MySQL Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="🔗 MySQL Port (default: 3306): "
if "%DB_PORT%"=="" set DB_PORT=3306

set /p DB_USER="👤 MySQL Username (default: root): "
if "%DB_USER%"=="" set DB_USER=root

set /p DB_PASS="🔑 MySQL Password: "

echo.
echo 📋 جاري التحقق من الاتصال...

mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% -e "SELECT 1" >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ فشل الاتصال بقاعدة البيانات
    echo    يرجى التحقق من بيانات الاتصال
    pause
    exit /b 1
)

echo ✅ تم الاتصال بنجاح
echo.

echo 📦 [1/3] جاري إنشاء الجداول...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% < 01_schema.sql
if %ERRORLEVEL% neq 0 (
    echo ❌ فشل إنشاء الجداول
    pause
    exit /b 1
)
echo ✅ تم إنشاء الجداول بنجاح

echo 🌱 [2/3] جاري بذر البيانات الأساسية...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% < 02_seed_data.sql
if %ERRORLEVEL% neq 0 (
    echo ❌ فشل بذر البيانات
    pause
    exit /b 1
)
echo ✅ تم بذر البيانات بنجاح

echo 📊 [3/3] جاري إنشاء الفهارس...
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% < 03_indexes.sql
if %ERRORLEVEL% neq 0 (
    echo ❌ فشل إنشاء الفهارس
    pause
    exit /b 1
)
echo ✅ تم إنشاء الفهارس بنجاح

echo.
set /p LOAD_SAMPLE="❓ هل تريد إدراج بيانات تجريبية؟ (y/N): "
if /i "%LOAD_SAMPLE%"=="y" (
    echo 📝 جاري إدراج البيانات التجريبية...
    mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% < 04_sample_data.sql
    echo ✅ تم إدراج البيانات التجريبية بنجاح
)

echo.
echo ============================================
echo   ✅ تم إعداد قاعدة البيانات بنجاح!
echo ============================================
echo.
echo 📌 معلومات الاتصال:
echo    Database: alrawi_db
echo    Host: %DB_HOST%
echo    Port: %DB_PORT%
echo.
echo 👤 بيانات تسجيل الدخول:
echo    اسم المستخدم: admin
echo    كلمة المرور: admin
echo.
echo 🔗 رابط الاتصال (DATABASE_URL):
echo    mysql://%DB_USER%:****@%DB_HOST%:%DB_PORT%/alrawi_db
echo.
echo ============================================
pause
