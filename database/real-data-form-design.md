# تصميم قاعدة البيانات لإدخال النماذج ببيانات حقيقية

## الهدف
إكمال النظام السابق بطريقة إنتاجية وآمنة، بحيث تعتمد النماذج على بيانات حقيقية منظّمة بدل النصوص الحرة كلما كان ذلك ممكنًا، من غير كسر السلوك الحالي أو تغيير الجداول التشغيلية التي يعتمد عليها التطبيق الآن.

هذا التصميم **Additive**:
- لا يحذف جداول حالية
- لا يغيّر أسماء الحقول الحالية
- لا يكسر الـ API الحالي
- يضيف فقط طبقة `master data + defaults + aliases` فوق النظام الموجود

## ما وجدته في قاعدة البيانات الحالية
اعتمادًا على التصدير الحالي `alrawi-database-export.json`:

- `transactions`: 1622 حركة
- `accounts`: 84 حساب
- `drivers`: 513 سائق
- `vehicles`: 590 سيارة
- `goods_types`: 63 نوع بضاعة
- `governorates`: 12 محافظة
- `special_accounts`: 256 سجل
- `company_name` داخل الحركات يحتوي حاليًا على `7` أسماء شركات فعلية مميزة

## ما الذي يعمل جيدًا الآن
الجداول التالية موجودة أصلًا وتغطي نسبة كبيرة من احتياج النماذج:

- `accounts`: التاجر / الحساب / الناقل / بعض الكيانات المالية
- `drivers`: السائقين
- `vehicles`: السيارات
- `goods_types`: أنواع البضائع
- `governorates`: المحافظات
- `ports`: المنافذ والأقسام
- `account_types`: أنواع الحسابات
- `transactions`: الفواتير والتسديدات بشكل موحد
- `field_config`, `custom_fields`, `custom_field_values`: تخصيص الحقول

هذا يعني أن الأساس موجود، والمطلوب ليس إعادة بناء كاملة، بل **تنظيم البيانات المرجعية التي ما زالت ناقصة أو حرة**.

## الفجوات الحقيقية التي تمنع إكمال النظام بشكل نظيف
### 1. `company_name` ما زال نصًا حرًا
في منفذ القائم وبعض المسارات، الشركة مخزنة كنص داخل `transactions.company_name`، وهذا يسبب:
- تكرار كتابة نفس الشركة بأشكال مختلفة
- صعوبة عمل autocomplete موحد
- صعوبة الربط المستقبلي مع تقارير أو إعدادات افتراضية

### 2. لا يوجد نظام aliases لتطبيع أسماء النظام السابق
إذا كانت بيانات النظام القديم أو الإكسل تحتوي:
- اسم تاجر بصيغة مختلفة
- اسم سائق مع اختلاف بسيط
- رقم سيارة بصياغة غير موحدة

فالنظام الحالي لا يملك جدولًا عامًا لتطبيع هذه القيم وربطها بكيان أساسي.

### 3. لا توجد defaults ذكية لكل حساب/قسم
كثير من النماذج في الواقع العملي تتكرر بصيغ متشابهة:
- نفس التاجر غالبًا له نفس المنفذ أو العملة
- أحيانًا نفس السائق أو السيارة أو المحافظة أو الشركة
- في النقل قد تكون هناك قيم متكررة للناقل أو المحافظة أو عدد السيارات

الاحتفاظ بهذه القيم كـ defaults يجعل الإدخال أسرع ويقلل الخطأ.

### 4. `governorates.trance_price` غير كافٍ كطبقة تسعير
السعر على المحافظة فقط مفيد كبداية، لكنه ليس مرنًا بما يكفي إذا أردنا لاحقًا:
- سعر مختلف حسب القسم
- سعر مختلف حسب المنفذ
- سعر مختلف حسب العملة

## التصميم المقترح
التصميم المقترح يعتمد على أربع إضافات فقط:

### 1. جدول `companies`
الغرض:
- تحويل اسم الشركة من نص حر إلى lookup منظم
- الإبقاء على `transactions.company_name` للتوافق الخلفي

الحقول الأساسية:
- `id`
- `name`
- `active`
- `notes`
- `created_at`
- `updated_at`

إضافة مكملة:
- `transactions.company_id` كحقل اختياري

### 2. جدول `entity_aliases`
الغرض:
- ربط أسماء النظام السابق أو الإكسل بالأسماء الأساسية الحالية
- دعم التطبيع أثناء الاستيراد أو autocomplete أو المطابقة

الكيانات المدعومة:
- `account`
- `driver`
- `vehicle`
- `good_type`
- `company`
- `governorate`

أمثلة:
- `عبدالكريم الشمري` -> نفس كيان `عبد الكريم الشمري`
- `لؤي2` -> `لؤي 2`
- `23 ب 4567` -> نفس السيارة بصياغة مختلفة

### 3. جدول `account_defaults`
الغرض:
- إعطاء قيم افتراضية لكل حساب داخل قسم محدد

أمثلة عملية:
- تاجر في `port-1` يفتح افتراضيًا على `USD`
- تاجر معين له سائق/سيارة/نوع بضاعة متكرر
- حساب نقل له ناقل أو محافظة متكررة

الحقول المقترحة:
- `account_id`
- `section_key`
- `default_currency`
- `default_driver_id`
- `default_vehicle_id`
- `default_good_type_id`
- `default_gov_id`
- `default_company_id`
- `default_carrier_id`
- `default_fee_usd`
- `default_syr_cus`
- `default_car_qty`

### 4. جدول `route_defaults`
الغرض:
- تخزين defaults مرتبطة بالمسار/القسم + المحافظة
- وهو بديل مرن عن الاعتماد على `governorates.trance_price` فقط

أمثلة:
- `transport-1 + بغداد` => `default_trans_price`
- لاحقًا يمكن استعماله أيضًا لـ:
  - `default_fee_usd`
  - `default_cost_usd`
  - `default_amount_iqd`

## خريطة تعبئة النماذج من قاعدة البيانات

| الحقل في النموذج | المصدر الحالي | المصدر المقترح النهائي |
|---|---|---|
| اسم التاجر | `accounts` | `accounts` |
| اسم السائق | `drivers` | `drivers` + `entity_aliases` |
| رقم السيارة | `vehicles` | `vehicles` + `entity_aliases` |
| نوع البضاعة | `goods_types` | `goods_types` + `entity_aliases` |
| المحافظة | `governorates` | `governorates` + `route_defaults` |
| اسم الناقل | `accounts` | `accounts` |
| الشركة | `transactions.company_name` | `companies` + `transactions.company_id` + fallback `company_name` |
| العملة | نص داخل النموذج/المعاملة | `transactions.currency` + `account_defaults.default_currency` |
| النقل السعودي $ | `transactions.fee_usd` | `account_defaults.default_fee_usd` أو `route_defaults.default_fee_usd` |
| الكمرك السوري | `transactions.syr_cus` | `account_defaults.default_syr_cus` |
| عدد السيارات | `transactions.car_qty` | `account_defaults.default_car_qty` |

## لماذا هذا التصميم أفضل وأأمن
### لا يكسر النظام الحالي
- كل الجداول الحالية تبقى كما هي
- كل الـ endpoints الحالية تبقى كما هي
- كل النماذج الحالية تظل تعمل حتى قبل استهلاك الجداول الجديدة

### يسمح بالتطوير على مراحل
#### المرحلة 1
- إنشاء الجداول الجديدة
- Backfill للشركات من `transactions.company_name`
- إنشاء aliases أولية من البيانات الحالية

#### المرحلة 2
- إضافة endpoints جديدة:
  - `/lookups/companies`
  - `/defaults/account`
  - `/defaults/routes`

#### المرحلة 3
- ربط النماذج لتقرأ defaults تلقائيًا عند اختيار:
  - التاجر
  - المحافظة
  - القسم

#### المرحلة 4
- استيراد alias maps من النظام السابق/Access/Excel
- تنظيف البيانات القديمة تدريجيًا

## ما الذي يجب أن يبقى untouched
- `transactions` كجدول الحركات الموحد
- `accounts`, `drivers`, `vehicles`, `goods_types`, `governorates`
- القيم الحالية مثل `port_id`, `account_type`, `direction`
- الحقول الحرة الحالية مثل `company_name` تبقى مؤقتًا للتوافق الخلفي

## الملف التنفيذي الجاهز
تم إنشاء ملف SQL جاهز:

- [`05_real_data_form_extension.sql`](c:\Users\lenovo\OneDrive\Desktop\rawi\v4\alrawi-full-export\alrawi-full-export\database\05_real_data_form_extension.sql)

هذا الملف:
- ينشئ `companies`
- يضيف `transactions.company_id` بشكل آمن إذا لم يكن موجودًا
- يملأ الشركات من الداتا الحقيقية الحالية
- ينشئ `entity_aliases`
- ينشئ `account_defaults`
- ينشئ `route_defaults`
- يعمل backfill أولي من `governorates.trance_price` لمسار النقل

## الخلاصة التنفيذية
إذا هدفنا هو إنهاء النظام السابق ببيانات حقيقية، فالتصميم الصحيح ليس إعادة بناء قاعدة البيانات من الصفر، بل:

1. الإبقاء على الجداول التشغيلية الحالية
2. إضافة طبقة master data للشركات
3. إضافة aliases لتطبيع بيانات النظام السابق
4. إضافة defaults ذكية للحسابات والمسارات
5. ربط النماذج تدريجيًا بهذه الجداول

بهذا الشكل نربح:
- إدخال أسرع
- بيانات أنظف
- تقارير أدق
- استيراد أسهل من النظام القديم
- أقل خطر regression على النظام الحالي
