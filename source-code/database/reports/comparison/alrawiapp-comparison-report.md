# مقارنة بين `AlrawiApp` ومشروع `Al-Rawi` الحالي

## الحكم السريع

- الملفان `AlrawiApp_schema.sql` و`AlrawiApp_migration.sql` ليسا نفس مشروعنا الحالي.
- هما يمثلان نظامًا أقدم أو موازيًا لنفس المجال التجاري.
- مشروعنا الحالي أفضل كنظام تطبيق وتشغيل.
- `AlrawiApp` أفضل جزئيًا من ناحية انضباط قاعدة البيانات التقليدي.

## النتيجة النهائية

### `AlrawiApp` أفضل في:

- وجود `foreign keys` فعلية بين الجداول
- استخدام `DATETIME` بدل `VARCHAR` في كثير من التواريخ
- وجود `UNIQUE` و`INDEXES` أكثر على الجداول التشغيلية

### مشروعنا الحالي أفضل في:

- توحيد البيانات داخل جداول أقل وأكثر مرونة
- دعم `field_config`
- دعم `custom_fields`
- دعم `custom_field_values`
- دعم `payment_matching`
- دعم `special_accounts`
- دعم `audit_logs`
- قابلية أعلى لتخصيص الواجهات والنماذج

## مقارنة البنية

### النظام القديم `AlrawiApp`

يعتمد على جداول منفصلة لكل منفذ/قسم:

- `Tbl_KSA_Trans`
- `Tbl_MNZ_Trans`
- `Tbl_QAIM_Trans`
- `Tbl_TRANS_Trans`
- `Tbl_SHR_Trans`
- `Tbl_SP_Yaser_Trans`
- `Tbl_Depet_*`
- `Tbl_Expenses_*`

هذا يجعله قريبًا من بنية Access التقليدية: كل قسم له جدوله الخاص.

### نظامنا الحالي

يعتمد على جداول موحدة أكثر:

- `transactions`
- `accounts`
- `goods_types`
- `governorates`
- `expenses`
- `debts`
- `special_accounts`

ثم يضيف طبقة حديثة للتخصيص:

- `field_config`
- `custom_fields`
- `custom_field_values`
- `payment_matching`
- `audit_logs`

## مقارنة جدول بجدول

### الحركات والمعاملات

| `AlrawiApp` | مشروعنا الحالي | الملاحظة |
|---|---|---|
| `Tbl_KSA_Trans` | `transactions` | السعودية |
| `Tbl_MNZ_Trans` | `transactions` | المنذرية |
| `Tbl_QAIM_Trans` | `transactions` | القائم |
| `Tbl_TRANS_Trans` | `transactions` | النقل |
| `Tbl_SHR_Trans` | `transactions` أو `special_accounts` | الشراكة/الخاص |
| `Tbl_SP_Yaser_Trans` | `special_accounts` | ياسر عادل |
| `Tbl_Adb_Alkarem_Trans` | `special_accounts` أو `debts` | حسب منطق العرض الحالي |

### الحسابات/التجار

| `AlrawiApp` | مشروعنا الحالي | الملاحظة |
|---|---|---|
| `Tbl_KSA_Triders` | `accounts` | تجار السعودية |
| `Tbl_MNZ_Triders` | `accounts` | تجار المنذرية |
| `Tbl_QAIM_Triders` | `accounts` | تجار القائم |
| `Tbl_SHR_Accounts` | `accounts` أو `special_accounts` | حسابات خاصة/شراكة |
| `Tbl_FX_Accounts` | لا يوجد مقابل واضح حاليًا | يحتاج قرار تصميمي |

### الديون

| `AlrawiApp` | مشروعنا الحالي | الملاحظة |
|---|---|---|
| `Tbl_Depet_Basim` | `debts` | دين باسم |
| `Tbl_Depet_Haider` | `debts` أو `special_accounts` | حسب طريقة العمل |
| `Tbl_Depet_Luay` | `debts` | دين لؤي |
| `Tbl_Depet_Luay2` | `debts` | فرع دين إضافي |
| `Tbl_Depet_Noman` | `debts` | دين نومان |

### المصاريف

| `AlrawiApp` | مشروعنا الحالي | الملاحظة |
|---|---|---|
| `Tbl_Expenses` | `expenses` | مصاريف عامة |
| `Tbl_Expenses_MNZ` | `expenses` | مصاريف المنذرية |
| `Tbl_Expenses_Qaim` | `expenses` | مصاريف القائم |

### القواميس Lookup

| `AlrawiApp` | مشروعنا الحالي | الملاحظة |
|---|---|---|
| `Tbl_Goods_Type` | `goods_types` | السعودية/عام |
| `Tbl_Goods_Type_MNZ` | `goods_types` | المنذرية |
| `Tbl_Goods_Type_QAIM` | `goods_types` | القائم |
| `Tbl_SHR_Goods_Type` | `goods_types` | خاص/شراكة |
| `Tbl_Tran_Goverments` | `governorates` و`route_defaults` | المحافظات والمسارات |
| `Tbl_Port` | `ports` | المنافذ |
| `Tbl_Account_Type` | `account_types` | أنواع الحسابات |
| `Cash_State` | `cash_state` | حالة النقد |
| `Tbl_Tran_Types` | منطق `direction`/`record_type` | لم يعد جدولًا مستقلًا |
| `Tbl_Currency` | منطق `currency` النصي | لم يعد جدولًا مستقلًا |

### عناصر ليس لها مقابل 1:1

| `AlrawiApp` | الوضع في مشروعنا |
|---|---|
| `Tbl_Reports` | لا يوجد مقابل جدولي مباشر؛ التقارير مبنية من الواجهة/المنطق |
| `Paste Errors` | لا يوجد مقابل مباشر |
| `Tbl_SP_Yaser_Setting` | لا يوجد مقابل جدولي مباشر |
| `Tbl_FX_Trans` | لا يوجد مسار مكتمل مقابل له حاليًا |

## أيهما أفضل من ناحية قاعدة البيانات فقط؟

### القديم أفضل في الانضباط الكلاسيكي

- عنده `foreign keys` فعلية
- عنده `unique indexes` أكثر على جداول الحركات
- عنده تواريخ `datetime`

### الحالي أضعف في هذه النقاط

- لا توجد `foreign keys` في `database/sql/01_schema.sql`
- `transactions.trans_date` ما زال `VARCHAR(20)`
- بعض العلاقات تعتمد على منطق التطبيق أكثر من اعتمادها على قاعدة البيانات

## أيهما أفضل كنظام فعلي للتطوير والتشغيل؟

### الحالي أفضل بوضوح

لأن مشروعنا يحتوي على طبقات غير موجودة في `AlrawiApp`:

- `field_config`
- `custom_fields`
- `custom_field_values`
- `payment_matching`
- `audit_logs`
- نظام مستخدمين حديث
- واجهات React حديثة
- تخصيص للشاشات والنماذج

هذا يجعله أفضل كنظام قابل للتطوير، حتى لو كانت قاعدة البيانات القديمة أقوى قليلًا من ناحية العلاقات التقليدية.

## ماذا يستحق أن ننقله من `AlrawiApp` إلى مشروعنا؟

### يستحق النقل فورًا

1. `foreign keys` المهمة
2. تحويل التواريخ الرئيسية من `VARCHAR` إلى `DATE/DATETIME`
3. `unique indexes` على أرقام المراجع عند الحاجة
4. بعض `indexes` التشغيلية على:
   - `trans_date`
   - `account`
   - `port`
   - `direction`

### لا أنصح بنقله كما هو

1. تقسيم الجداول حسب كل منفذ
2. إعادة إنشاء جداول منفصلة لكل نوع حركة
3. إعادة النظام إلى بنية Access القديمة

## التوصية النهائية

### لا نستبدل مشروعنا بـ `AlrawiApp`

بل نفعل الآتي:

1. نحتفظ بمشروعنا الحالي كنظام أساسي
2. نعتبر `AlrawiApp` مرجعًا لتحسين قاعدة البيانات
3. ننقل منه فقط:
   - العلاقات
   - أنواع البيانات الأفضل
   - بعض الـ indexes والـ constraints

## قرار عملي مقترح

### المرحلة التالية المنطقية

نعمل hardening لقاعدة مشروعنا الحالي في 3 خطوات:

1. إضافة `foreign keys` الآمنة
2. تحويل `transactions.trans_date` والحقول المشابهة إلى `DATE/DATETIME`
3. إضافة `indexes` و`unique constraints` المهمة

هذا يعطينا أفضل ما في النظامين:

- مرونة مشروعنا الحالي
- وانضباط قاعدة البيانات الموجود في `AlrawiApp`
