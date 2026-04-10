-- ============================================================
-- نظام الراوي للنقل والتخليص - هيكل قاعدة البيانات الكامل
-- Al-Rawi Transport & Clearance System - Full Database Schema
-- ============================================================
-- MySQL / MariaDB
-- Character Set: utf8mb4 (supports Arabic text)
-- ============================================================

-- إنشاء قاعدة البيانات
CREATE DATABASE IF NOT EXISTS alrawi_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE alrawi_db;

-- ============================================================
-- 1. جدول المستخدمين (تسجيل الدخول المحلي)
-- APP USERS - Local username/password authentication
-- ============================================================
CREATE TABLE IF NOT EXISTS `app_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `profile_image` LONGTEXT DEFAULT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `permissions` JSON DEFAULT ('[]'),
  `active` INT NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. جدول الحسابات (التجار / العملاء / الناقلين / الصرافة)
-- ACCOUNTS - Traders, Customers, Carriers, FX
-- ============================================================
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `accountType` VARCHAR(50) NOT NULL,
  `portId` VARCHAR(50) DEFAULT NULL,
  `currency` VARCHAR(10) DEFAULT NULL COMMENT 'العملة الافتراضية',
  `merchantReport` VARCHAR(255) DEFAULT NULL COMMENT 'تقرير التاجر (خاص بالقائم)',
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_accountType` (`accountType`),
  KEY `idx_portId` (`portId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. جدول السائقين
-- DRIVERS
-- ============================================================
CREATE TABLE IF NOT EXISTS `drivers` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. جدول المركبات
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plateNumber` VARCHAR(100) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. جدول المعاملات (موحد - فواتير ودفعات)
-- TRANSACTIONS - Unified (invoices & payments)
-- ============================================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ref_no` VARCHAR(50) DEFAULT NULL COMMENT 'رقم المرجع',
  `direction` VARCHAR(5) NOT NULL COMMENT 'IN=فاتورة, OUT=دفعة',
  `trans_date` DATE NOT NULL COMMENT 'تاريخ المعاملة',
  `account_id` INT NOT NULL COMMENT 'معرف الحساب/التاجر',
  `currency` VARCHAR(10) DEFAULT 'BOTH' COMMENT 'العملة: USD, IQD, BOTH',
  `driver_id` INT DEFAULT NULL,
  `vehicle_id` INT DEFAULT NULL,
  `good_type_id` INT DEFAULT NULL,
  `weight` DECIMAL(15,2) DEFAULT NULL COMMENT 'الوزن',
  `meters` DECIMAL(15,2) DEFAULT NULL COMMENT 'الأمتار',
  `qty` INT DEFAULT NULL COMMENT 'الكمية',
  `cost_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'التكلفة بالدولار',
  `amount_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'المبلغ بالدولار',
  `cost_iqd` DECIMAL(15,0) DEFAULT '0' COMMENT 'التكلفة بالدينار',
  `amount_iqd` DECIMAL(15,0) DEFAULT '0' COMMENT 'المبلغ بالدينار',
  `fee_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'الرسوم بالدولار',
  `syr_cus` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'الجمارك السورية',
  `car_qty` INT DEFAULT NULL COMMENT 'عدد السيارات',
  `trans_price` DECIMAL(15,0) DEFAULT NULL COMMENT 'سعر النقل',
  `carrier_id` INT DEFAULT NULL COMMENT 'معرف الناقل',
  `company_name` VARCHAR(255) DEFAULT NULL COMMENT 'اسم الشركة',
  `gov_id` INT DEFAULT NULL COMMENT 'معرف المحافظة',
  `notes` TEXT DEFAULT NULL COMMENT 'ملاحظات',
  `trader_note` TEXT DEFAULT NULL COMMENT 'ملاحظة التاجر',
  `record_type` VARCHAR(20) DEFAULT 'shipment' COMMENT 'نوع السجل: shipment, payment',
  `port_id` VARCHAR(50) NOT NULL COMMENT 'معرف المنفذ',
  `account_type` VARCHAR(50) NOT NULL COMMENT 'نوع الحساب',
  `created_by` INT DEFAULT NULL COMMENT 'المستخدم المنشئ',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transactions_ref_no` (`ref_no`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_port_id` (`port_id`),
  KEY `idx_account_type` (`account_type`),
  KEY `idx_trans_date` (`trans_date`),
  KEY `idx_direction` (`direction`),
  KEY `idx_record_type` (`record_type`),
  KEY `idx_driver_id` (`driver_id`),
  KEY `idx_vehicle_id` (`vehicle_id`),
  KEY `idx_carrier_id` (`carrier_id`),
  KEY `idx_gov_id` (`gov_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. جدول الديون
-- DEBTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `debts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `debtorName` VARCHAR(255) NOT NULL COMMENT 'اسم المدين',
  `amountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'المبلغ بالدولار',
  `amountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'المبلغ بالدينار',
  `feeUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'الرسوم بالدولار',
  `feeIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'الرسوم بالدينار',
  `transType` VARCHAR(100) DEFAULT NULL COMMENT 'نوع المعاملة',
  `fxRate` DECIMAL(15,2) DEFAULT NULL COMMENT 'سعر الصرف',
  `driverName` VARCHAR(255) DEFAULT NULL COMMENT 'اسم السائق',
  `carNumber` VARCHAR(100) DEFAULT NULL COMMENT 'رقم السيارة',
  `goodType` VARCHAR(255) DEFAULT NULL COMMENT 'نوع البضاعة',
  `weight` DECIMAL(15,2) DEFAULT NULL COMMENT 'الوزن',
  `meters` DECIMAL(15,2) DEFAULT NULL COMMENT 'الأمتار',
  `description` TEXT DEFAULT NULL COMMENT 'الوصف',
  `date` DATE DEFAULT NULL COMMENT 'التاريخ',
  `status` ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending' COMMENT 'الحالة',
  `paidAmountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'المبلغ المدفوع بالدولار',
  `paidAmountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'المبلغ المدفوع بالدينار',
  `state` VARCHAR(100) DEFAULT NULL COMMENT 'المحافظة',
  `fxNote` VARCHAR(255) DEFAULT NULL COMMENT 'ملاحظة الصرف',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. جدول المصروفات
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `expense_date` DATE NOT NULL COMMENT 'تاريخ المصروف',
  `amount_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'المبلغ بالدولار',
  `amount_iqd` DECIMAL(15,0) DEFAULT '0' COMMENT 'المبلغ بالدينار',
  `description` TEXT DEFAULT NULL COMMENT 'الوصف',
  `port_id` VARCHAR(50) NOT NULL COMMENT 'معرف المنفذ',
  `created_by` INT DEFAULT NULL COMMENT 'المستخدم المنشئ',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_port_id` (`port_id`),
  KEY `idx_expense_date` (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. جدول حالة الصندوق
-- CASH STATE
-- ============================================================
CREATE TABLE IF NOT EXISTS `cash_state` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `state` VARCHAR(255) NOT NULL COMMENT 'حالة الصندوق',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. جدول أنواع البضائع
-- GOODS TYPES (Lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `goods_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. جدول المحافظات
-- GOVERNORATES (Lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `governorates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `trance_price` DECIMAL(15,0) DEFAULT NULL COMMENT 'سعر النقل',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. جدول المنافذ
-- PORTS (Lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `ports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `portId` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `section` VARCHAR(50) NOT NULL COMMENT 'القسم: ports, transport, partnership, fx',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_portId` (`portId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. جدول أنواع الحسابات
-- ACCOUNT TYPES (Lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `account_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `typeId` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_typeId` (`typeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. جدول مطابقة الدفعات
-- PAYMENT MATCHING
-- ============================================================
CREATE TABLE IF NOT EXISTS `payment_matching` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `invoiceId` INT NOT NULL COMMENT 'معرف الفاتورة',
  `paymentId` INT NOT NULL COMMENT 'معرف الدفعة',
  `amountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'المبلغ المطابق بالدولار',
  `amountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'المبلغ المطابق بالدينار',
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_payment_matching_invoice_payment` (`invoiceId`, `paymentId`),
  KEY `idx_invoiceId` (`invoiceId`),
  KEY `idx_paymentId` (`paymentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. جدول إعدادات الحقول
-- FIELD CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS `field_config` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `section_key` VARCHAR(100) NOT NULL COMMENT 'مفتاح القسم',
  `field_key` VARCHAR(100) NOT NULL COMMENT 'مفتاح الحقل',
  `visible` INT NOT NULL DEFAULT 1 COMMENT '1=مرئي, 0=مخفي',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT 'ترتيب العرض',
  `display_label` VARCHAR(255) NULL COMMENT 'اسم العرض المخصص للحقل داخل هذه الشاشة',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_section_key` (`section_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. جدول الحقول المخصصة
-- CUSTOM FIELDS
-- ============================================================
CREATE TABLE IF NOT EXISTS `custom_fields` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `field_key` VARCHAR(100) NOT NULL COMMENT 'مفتاح الحقل الفريد',
  `label` VARCHAR(255) NOT NULL COMMENT 'عنوان الحقل',
  `field_type` VARCHAR(50) NOT NULL COMMENT 'نوع الحقل: text, number, select, date',
  `options` JSON DEFAULT NULL COMMENT 'خيارات (للحقول من نوع select)',
  `default_value` VARCHAR(255) DEFAULT NULL COMMENT 'القيمة الافتراضية',
  `formula` JSON DEFAULT NULL COMMENT 'صيغة حسابية',
  `placement` VARCHAR(50) DEFAULT 'transaction' COMMENT 'مكان الحقل',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_field_key` (`field_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. جدول قيم الحقول المخصصة
-- CUSTOM FIELD VALUES
-- ============================================================
CREATE TABLE IF NOT EXISTS `custom_field_values` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `custom_field_id` INT NOT NULL COMMENT 'معرف الحقل المخصص',
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'نوع الكيان: transaction, account',
  `entity_id` INT NOT NULL COMMENT 'معرف الكيان',
  `value` TEXT DEFAULT NULL COMMENT 'القيمة',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_custom_field_id` (`custom_field_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. جدول الحسابات الخاصة
-- SPECIAL ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `special_accounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(50) NOT NULL COMMENT 'النوع: haider, other',
  `name` VARCHAR(255) NOT NULL COMMENT 'الاسم',
  `traderName` VARCHAR(255) DEFAULT NULL COMMENT 'اسم التاجر',
  `driverName` VARCHAR(255) DEFAULT NULL COMMENT 'اسم السائق',
  `vehiclePlate` VARCHAR(100) DEFAULT NULL COMMENT 'رقم السيارة',
  `goodType` VARCHAR(255) DEFAULT NULL COMMENT 'نوع البضاعة',
  `govName` VARCHAR(255) DEFAULT NULL COMMENT 'المحافظة / الجهة الحكومية',
  `portName` VARCHAR(255) DEFAULT NULL COMMENT 'المنفذ',
  `companyName` VARCHAR(255) DEFAULT NULL COMMENT 'الشركة',
  `batchName` VARCHAR(255) DEFAULT NULL COMMENT 'الوجبة / الدفعة',
  `destination` VARCHAR(255) DEFAULT NULL COMMENT 'الوجهة',
  `amountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'المبلغ بالدولار',
  `amountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'المبلغ بالدينار',
  `costUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'الكلفة بالدولار',
  `costIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'الكلفة بالدينار',
  `amountUSDPartner` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'مبلغ الشريك بالدولار',
  `differenceIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'الفرق بالدينار',
  `clr` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'التخليص',
  `tx` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'TX',
  `taxiWater` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'تكسي + ماء',
  `weight` DECIMAL(15,2) DEFAULT NULL COMMENT 'الوزن',
  `meters` DECIMAL(15,2) DEFAULT NULL COMMENT 'الأمتار',
  `qty` INT DEFAULT NULL COMMENT 'العدد',
  `description` TEXT DEFAULT NULL COMMENT 'الوصف',
  `notes` TEXT DEFAULT NULL COMMENT 'ملاحظات',
  `date` DATE DEFAULT NULL COMMENT 'التاريخ',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. سجل العمليات
-- AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(100) NOT NULL COMMENT 'نوع الكيان: transaction, debt, expense, special_account',
  `entity_id` INT DEFAULT NULL COMMENT 'معرف السجل المرتبط',
  `action` VARCHAR(20) NOT NULL COMMENT 'نوع العملية: create, update, delete',
  `summary` VARCHAR(255) NOT NULL COMMENT 'وصف مختصر للعملية',
  `before_data` JSON DEFAULT NULL COMMENT 'البيانات قبل التعديل',
  `after_data` JSON DEFAULT NULL COMMENT 'البيانات بعد التعديل',
  `changes` JSON DEFAULT NULL COMMENT 'الحقول التي تغيرت فقط',
  `metadata` JSON DEFAULT NULL COMMENT 'بيانات إضافية مساعدة',
  `user_id` INT DEFAULT NULL COMMENT 'معرف المستخدم الذي نفذ العملية',
  `username` VARCHAR(255) DEFAULT NULL COMMENT 'اسم المستخدم الذي نفذ العملية',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_entity_type` (`entity_type`),
  KEY `idx_entity_id` (`entity_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. جدول المستخدمين (قالب Manus - غير مستخدم في التطبيق)
-- USERS (Template/Manus OAuth - NOT used by the app)
-- يمكن تجاهل هذا الجدول - موجود فقط للتوافق مع القالب
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `openId` VARCHAR(64) NOT NULL,
  `name` TEXT DEFAULT NULL,
  `email` VARCHAR(320) DEFAULT NULL,
  `loginMethod` VARCHAR(64) DEFAULT NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openId` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

