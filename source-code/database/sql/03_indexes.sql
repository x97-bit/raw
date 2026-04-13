-- ============================================================
-- نظام الراوي - فهارس إضافية لتحسين الأداء
-- Al-Rawi System - Additional Performance Indexes
-- ============================================================

USE alrawi_db;

-- فهارس مركبة للاستعلامات الشائعة
-- Composite indexes for common queries

-- البحث عن معاملات حساب معين في منفذ معين
CREATE INDEX IF NOT EXISTS `idx_trans_account_port` 
  ON `transactions` (`account_id`, `port_id`);

-- البحث عن معاملات بتاريخ ومنفذ
CREATE INDEX IF NOT EXISTS `idx_trans_date_port` 
  ON `transactions` (`trans_date`, `port_id`);

-- دعم فهارس الحقول المرجعية وفهرس التاريخ الأساسي
CREATE INDEX IF NOT EXISTS `idx_trans_date`
  ON `transactions` (`trans_date`);

CREATE INDEX IF NOT EXISTS `idx_good_type_id`
  ON `transactions` (`good_type_id`);

CREATE INDEX IF NOT EXISTS `idx_company_id`
  ON `transactions` (`company_id`);

-- البحث عن معاملات بنوع الحساب والاتجاه
CREATE INDEX IF NOT EXISTS `idx_trans_type_direction` 
  ON `transactions` (`account_type`, `direction`);

-- البحث عن قيم الحقول المخصصة
CREATE INDEX IF NOT EXISTS `idx_cfv_entity_field` 
  ON `custom_field_values` (`entity_type`, `entity_id`, `custom_field_id`);

-- البحث عن إعدادات الحقول بالقسم
CREATE INDEX IF NOT EXISTS `idx_fc_section_field` 
  ON `field_config` (`section_key`, `field_key`);

-- البحث عن الديون حسب الحالة والتاريخ
CREATE INDEX IF NOT EXISTS `idx_debts_status_date` 
  ON `debts` (`status`, `date`);

SELECT '✅ تم إنشاء الفهارس بنجاح - Indexes created successfully' AS status;
