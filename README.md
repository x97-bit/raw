# نظام الراوي للنقل والتخليص - Full Export

## محتويات الملف

### 📁 source-code/
كود المصدر الكامل للتطبيق (React + Express + tRPC + MySQL)

**للتشغيل محلياً:**
```bash
cd source-code
pnpm install
# أنشئ ملف .env بالمتغيرات المطلوبة (انظر أدناه)
pnpm db:push
pnpm dev
```

**المتغيرات المطلوبة (.env):**
```
DATABASE_URL=mysql://user:password@localhost:3306/alrawi_db
JWT_SECRET=your-secret-key-here
```

### 📁 database/
قاعدة البيانات الكاملة (الهيكل + البيانات)

| ملف | الوصف |
|-----|-------|
| `alrawi-database-export.json` | تصدير كامل (19 جدول، 3,429 سجل) - JSON |
| `01_schema.sql` | هيكل جميع الجداول |
| `02_seed_data.sql` | البيانات الأساسية (مستخدم admin، بضائع، محافظات) |
| `03_indexes.sql` | فهارس إضافية للأداء |
| `04_sample_data.sql` | بيانات تجريبية اختيارية |
| `setup.sh` | سكربت إعداد تلقائي (Linux/macOS) |
| `setup.bat` | سكربت إعداد تلقائي (Windows) |
| `database-README.md` | توثيق تفصيلي لقاعدة البيانات |

## إحصائيات البيانات

| الجدول | عدد السجلات |
|--------|-------------|
| المعاملات (transactions) | 1,622 |
| المركبات (vehicles) | 590 |
| السائقين (drivers) | 513 |
| الحسابات الخاصة (special_accounts) | 256 |
| الديون (debts) | 117 |
| الحسابات (accounts) | 84 |
| أنواع البضائع (goods_types) | 63 |
| المحافظات (governorates) | 12 |
| المنافذ (ports) | 6 |

## تسجيل الدخول
- **اسم المستخدم:** admin
- **كلمة المرور:** admin

## التقنيات المستخدمة
- **Frontend:** React 19 + Tailwind CSS 4 + Vite
- **Backend:** Express 4 + tRPC 11
- **Database:** MySQL (TiDB compatible)
- **ORM:** Drizzle ORM
- **Auth:** JWT (local username/password)

## تاريخ التصدير
April 6, 2026
