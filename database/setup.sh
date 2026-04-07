#!/bin/bash
# ============================================================
# نظام الراوي للنقل والتخليص - سكربت الإعداد
# Al-Rawi Transport & Clearance System - Setup Script
# ============================================================

echo "============================================"
echo "  نظام الراوي - إعداد قاعدة البيانات"
echo "  Al-Rawi Database Setup"
echo "============================================"
echo ""

# التحقق من وجود MySQL
if ! command -v mysql &> /dev/null; then
    echo "❌ خطأ: MySQL/MariaDB غير مثبت"
    echo "   يرجى تثبيت MySQL أو MariaDB أولاً"
    echo ""
    echo "   Ubuntu/Debian: sudo apt install mysql-server"
    echo "   CentOS/RHEL:   sudo yum install mysql-server"
    echo "   macOS:         brew install mysql"
    echo "   Windows:       https://dev.mysql.com/downloads/"
    exit 1
fi

# طلب بيانات الاتصال
read -p "🔗 MySQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "🔗 MySQL Port (default: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

read -p "👤 MySQL Username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "🔑 MySQL Password: " DB_PASS
echo ""

# بناء أمر الاتصال
MYSQL_CMD="mysql -h $DB_HOST -P $DB_PORT -u $DB_USER"
if [ -n "$DB_PASS" ]; then
    MYSQL_CMD="$MYSQL_CMD -p$DB_PASS"
fi

echo ""
echo "📋 جاري التحقق من الاتصال..."

# التحقق من الاتصال
if ! $MYSQL_CMD -e "SELECT 1" &> /dev/null; then
    echo "❌ فشل الاتصال بقاعدة البيانات"
    echo "   يرجى التحقق من بيانات الاتصال"
    exit 1
fi

echo "✅ تم الاتصال بنجاح"
echo ""

# تنفيذ ملفات SQL
echo "📦 [1/3] جاري إنشاء الجداول..."
$MYSQL_CMD < 01_schema.sql
if [ $? -ne 0 ]; then
    echo "❌ فشل إنشاء الجداول"
    exit 1
fi
echo "✅ تم إنشاء الجداول بنجاح"

echo "🌱 [2/3] جاري بذر البيانات الأساسية..."
$MYSQL_CMD < 02_seed_data.sql
if [ $? -ne 0 ]; then
    echo "❌ فشل بذر البيانات"
    exit 1
fi
echo "✅ تم بذر البيانات بنجاح"

echo "📊 [3/3] جاري إنشاء الفهارس..."
$MYSQL_CMD < 03_indexes.sql
if [ $? -ne 0 ]; then
    echo "❌ فشل إنشاء الفهارس"
    exit 1
fi
echo "✅ تم إنشاء الفهارس بنجاح"

echo ""

# سؤال عن البيانات التجريبية
read -p "❓ هل تريد إدراج بيانات تجريبية؟ (y/N): " LOAD_SAMPLE
if [[ "$LOAD_SAMPLE" =~ ^[Yy]$ ]]; then
    echo "📝 جاري إدراج البيانات التجريبية..."
    $MYSQL_CMD < 04_sample_data.sql
    if [ $? -ne 0 ]; then
        echo "❌ فشل إدراج البيانات التجريبية"
    else
        echo "✅ تم إدراج البيانات التجريبية بنجاح"
    fi
fi

echo ""
echo "============================================"
echo "  ✅ تم إعداد قاعدة البيانات بنجاح!"
echo "============================================"
echo ""
echo "📌 معلومات الاتصال:"
echo "   Database: alrawi_db"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""
echo "👤 بيانات تسجيل الدخول:"
echo "   اسم المستخدم: admin"
echo "   كلمة المرور: admin"
echo ""
echo "🔗 رابط الاتصال (DATABASE_URL):"
echo "   mysql://$DB_USER:****@$DB_HOST:$DB_PORT/alrawi_db"
echo ""
echo "============================================"
