# نظام الراوي للنقل والتخليص - قاعدة البيانات

## Al-Rawi Transport & Clearance System - Database Package

---

## محتويات الحزمة

| الملف                       | الوصف                                                               |
| --------------------------- | ------------------------------------------------------------------- |
| `../sql/01_schema.sql`      | هيكل جميع الجداول (17 جدول)                                         |
| `../sql/02_seed_data.sql`   | البيانات الأساسية (مستخدم admin، أنواع البضائع، المحافظات، المنافذ) |
| `../sql/03_indexes.sql`     | فهارس إضافية لتحسين الأداء                                          |
| `../sql/04_sample_data.sql` | بيانات تجريبية للاختبار (اختياري)                                   |
| `../setup.sh`               | سكربت الإعداد التلقائي (Linux/macOS)                                |
| `../setup.bat`              | سكربت الإعداد التلقائي (Windows)                                    |
| `erd.md`                    | مخطط العلاقات بين الجداول                                           |

---

## المتطلبات

- **MySQL 8.0+** أو **MariaDB 10.5+**
- صلاحيات إنشاء قواعد بيانات وجداول

---

## طريقة الإعداد

### الطريقة 1: سكربت تلقائي (مُوصى به)

**Linux / macOS:**

```bash
chmod +x database/setup.sh
./database/setup.sh
```

**Windows:**

```cmd
database\setup.bat
```

### الطريقة 2: يدوياً

```bash
# الاتصال بـ MySQL
mysql -u root -p

# تنفيذ الملفات بالترتيب
source database/sql/01_schema.sql;
source database/sql/02_seed_data.sql;
source database/sql/03_indexes.sql;

# اختياري: بيانات تجريبية
source database/sql/04_sample_data.sql;
```

### الطريقة 3: سطر الأوامر

```bash
mysql -u root -p < database/sql/01_schema.sql
mysql -u root -p < database/sql/02_seed_data.sql
mysql -u root -p < database/sql/03_indexes.sql
# اختياري
mysql -u root -p < database/sql/04_sample_data.sql
```

---

## بيانات تسجيل الدخول

| الحقل        | القيمة       |
| ------------ | ------------ |
| اسم المستخدم | `admin`      |
| كلمة المرور  | `admin`      |
| الدور        | مدير (admin) |

---

## هيكل الجداول (17 جدول)

### الجداول الرئيسية

| #   | الجدول             | الوصف                        | الحقول الرئيسية                                                   |
| --- | ------------------ | ---------------------------- | ----------------------------------------------------------------- |
| 1   | `app_users`        | المستخدمين                   | username, password, role, permissions                             |
| 2   | `accounts`         | الحسابات (تجار/ناقلين/صرافة) | name, accountType, portId, currency                               |
| 3   | `transactions`     | المعاملات (فواتير/دفعات)     | direction, account_id, cost_usd, amount_usd, cost_iqd, amount_iqd |
| 4   | `debts`            | الديون                       | debtorName, amountUSD, amountIQD, status                          |
| 5   | `expenses`         | المصروفات                    | expense_date, amount_usd, amount_iqd                              |
| 6   | `payment_matching` | مطابقة الدفعات               | invoiceId, paymentId, amountUSD, amountIQD                        |
| 7   | `special_accounts` | الحسابات الخاصة              | type, name, amountUSD, amountIQD                                  |

### جداول البحث (Lookups)

| #   | الجدول          | الوصف                          |
| --- | --------------- | ------------------------------ |
| 8   | `goods_types`   | أنواع البضائع (15 نوع)         |
| 9   | `governorates`  | المحافظات العراقية (18 محافظة) |
| 10  | `ports`         | المنافذ والأقسام (6 منافذ)     |
| 11  | `account_types` | أنواع الحسابات (6 أنواع)       |
| 12  | `drivers`       | السائقين                       |
| 13  | `vehicles`      | المركبات                       |
| 14  | `cash_state`    | حالة الصندوق                   |

### جداول الإعدادات

| #   | الجدول                | الوصف               |
| --- | --------------------- | ------------------- |
| 15  | `field_config`        | إعدادات ظهور الحقول |
| 16  | `custom_fields`       | الحقول المخصصة      |
| 17  | `custom_field_values` | قيم الحقول المخصصة  |

---

## العملات المدعومة

النظام يدعم عملتين بشكل منفصل:

| العملة           | الرمز     | الحقول                              |
| ---------------- | --------- | ----------------------------------- |
| الدولار الأمريكي | USD / $   | `cost_usd`, `amount_usd`, `fee_usd` |
| الدينار العراقي  | IQD / د.ع | `cost_iqd`, `amount_iqd`            |

---

## منطق المعاملات

- **`direction = 'IN'`**: فاتورة (مدين) - بضاعة واردة
- **`direction = 'OUT'`**: دفعة (دائن) - مبلغ مدفوع
- **الربح**: `amount - cost` (لكل عملة على حدة)
- **الرصيد**: مجموع الفواتير - مجموع الدفعات

---

## رابط الاتصال (DATABASE_URL)

```
mysql://root:password@localhost:3306/alrawi_db
```

استبدل `root` و `password` ببيانات MySQL الخاصة بك.

---

## ملاحظات مهمة

1. كلمة مرور المستخدم `admin` مشفرة بـ **bcrypt** - لا يمكن تغييرها مباشرة في SQL
2. لتغيير كلمة المرور، استخدم واجهة النظام أو أنشئ hash جديد:
   ```bash
   node -e "require('bcryptjs').hash('NEW_PASSWORD', 10).then(h => console.log(h))"
   ```
3. جميع الجداول تستخدم **InnoDB** لدعم المعاملات (transactions)
4. ترميز **utf8mb4** يدعم جميع الأحرف العربية والرموز التعبيرية
