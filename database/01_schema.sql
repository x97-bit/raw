-- ============================================================
-- ظ†ط¸ط§ظ… ط§ظ„ط±ط§ظˆظٹ ظ„ظ„ظ†ظ‚ظ„ ظˆط§ظ„طھط®ظ„ظٹطµ - ظ‡ظٹظƒظ„ ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظƒط§ظ…ظ„
-- Al-Rawi Transport & Clearance System - Full Database Schema
-- ============================================================
-- MySQL / MariaDB
-- Character Set: utf8mb4 (supports Arabic text)
-- ============================================================

-- ط¥ظ†ط´ط§ط، ظ‚ط§ط¹ط¯ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ
CREATE DATABASE IF NOT EXISTS alrawi_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE alrawi_db;

-- ============================================================
-- 1. ط¬ط¯ظˆظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† (طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„ ط§ظ„ظ…ط­ظ„ظٹ)
-- APP USERS - Local username/password authentication
-- ============================================================
CREATE TABLE IF NOT EXISTS `app_users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `permissions` JSON DEFAULT ('[]'),
  `active` INT NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. ط¬ط¯ظˆظ„ ط§ظ„ط­ط³ط§ط¨ط§طھ (ط§ظ„طھط¬ط§ط± / ط§ظ„ط¹ظ…ظ„ط§ط، / ط§ظ„ظ†ط§ظ‚ظ„ظٹظ† / ط§ظ„طµط±ط§ظپط©)
-- ACCOUNTS - Traders, Customers, Carriers, FX
-- ============================================================
CREATE TABLE IF NOT EXISTS `accounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `accountType` VARCHAR(50) NOT NULL,
  `portId` VARCHAR(50) DEFAULT NULL,
  `currency` VARCHAR(10) DEFAULT NULL COMMENT 'ط§ظ„ط¹ظ…ظ„ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©',
  `merchantReport` VARCHAR(255) DEFAULT NULL COMMENT 'طھظ‚ط±ظٹط± ط§ظ„طھط§ط¬ط± (ط®ط§طµ ط¨ط§ظ„ظ‚ط§ط¦ظ…)',
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_accountType` (`accountType`),
  KEY `idx_portId` (`portId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. ط¬ط¯ظˆظ„ ط§ظ„ط³ط§ط¦ظ‚ظٹظ†
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
-- 4. ط¬ط¯ظˆظ„ ط§ظ„ظ…ط±ظƒط¨ط§طھ
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plateNumber` VARCHAR(100) NOT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. ط¬ط¯ظˆظ„ ط§ظ„ظ…ط¹ط§ظ…ظ„ط§طھ (ظ…ظˆط­ط¯ - ظپظˆط§طھظٹط± ظˆط¯ظپط¹ط§طھ)
-- TRANSACTIONS - Unified (invoices & payments)
-- ============================================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ref_no` VARCHAR(50) DEFAULT NULL COMMENT 'ط±ظ‚ظ… ط§ظ„ظ…ط±ط¬ط¹',
  `direction` VARCHAR(5) NOT NULL COMMENT 'IN=ظپط§طھظˆط±ط©, OUT=ط¯ظپط¹ط©',
  `trans_date` VARCHAR(20) NOT NULL COMMENT 'طھط§ط±ظٹط® ط§ظ„ظ…ط¹ط§ظ…ظ„ط©',
  `account_id` INT NOT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ط­ط³ط§ط¨/ط§ظ„طھط§ط¬ط±',
  `currency` VARCHAR(10) DEFAULT 'BOTH' COMMENT 'ط§ظ„ط¹ظ…ظ„ط©: USD, IQD, BOTH',
  `driver_id` INT DEFAULT NULL,
  `vehicle_id` INT DEFAULT NULL,
  `good_type_id` INT DEFAULT NULL,
  `weight` DECIMAL(15,2) DEFAULT NULL COMMENT 'ط§ظ„ظˆط²ظ†',
  `meters` DECIMAL(15,2) DEFAULT NULL COMMENT 'ط§ظ„ط£ظ…طھط§ط±',
  `qty` INT DEFAULT NULL COMMENT 'ط§ظ„ظƒظ…ظٹط©',
  `cost_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„طھظƒظ„ظپط© ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `amount_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `cost_iqd` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„طھظƒظ„ظپط© ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `amount_iqd` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `fee_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ط±ط³ظˆظ… ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `syr_cus` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ط¬ظ…ط§ط±ظƒ ط§ظ„ط³ظˆط±ظٹط©',
  `car_qty` INT DEFAULT NULL COMMENT 'ط¹ط¯ط¯ ط§ظ„ط³ظٹط§ط±ط§طھ',
  `trans_price` DECIMAL(15,0) DEFAULT NULL COMMENT 'ط³ط¹ط± ط§ظ„ظ†ظ‚ظ„',
  `carrier_id` INT DEFAULT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ظ†ط§ظ‚ظ„',
  `company_name` VARCHAR(255) DEFAULT NULL COMMENT 'ط§ط³ظ… ط§ظ„ط´ط±ظƒط©',
  `gov_id` INT DEFAULT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ظ…ط­ط§ظپط¸ط©',
  `notes` TEXT DEFAULT NULL COMMENT 'ظ…ظ„ط§ط­ط¸ط§طھ',
  `trader_note` TEXT DEFAULT NULL COMMENT 'ظ…ظ„ط§ط­ط¸ط© ط§ظ„طھط§ط¬ط±',
  `record_type` VARCHAR(20) DEFAULT 'shipment' COMMENT 'ظ†ظˆط¹ ط§ظ„ط³ط¬ظ„: shipment, payment',
  `port_id` VARCHAR(50) NOT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ظ…ظ†ظپط°',
  `account_type` VARCHAR(50) NOT NULL COMMENT 'ظ†ظˆط¹ ط§ظ„ط­ط³ط§ط¨',
  `created_by` INT DEFAULT NULL COMMENT 'ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظ…ظ†ط´ط¦',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
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
-- 6. ط¬ط¯ظˆظ„ ط§ظ„ط¯ظٹظˆظ†
-- DEBTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `debts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `debtorName` VARCHAR(255) NOT NULL COMMENT 'ط§ط³ظ… ط§ظ„ظ…ط¯ظٹظ†',
  `amountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `amountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `feeUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ط±ط³ظˆظ… ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `feeIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„ط±ط³ظˆظ… ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `transType` VARCHAR(100) DEFAULT NULL COMMENT 'ظ†ظˆط¹ ط§ظ„ظ…ط¹ط§ظ…ظ„ط©',
  `fxRate` DECIMAL(15,2) DEFAULT NULL COMMENT 'ط³ط¹ط± ط§ظ„طµط±ظپ',
  `driverName` VARCHAR(255) DEFAULT NULL COMMENT 'ط§ط³ظ… ط§ظ„ط³ط§ط¦ظ‚',
  `carNumber` VARCHAR(100) DEFAULT NULL COMMENT 'ط±ظ‚ظ… ط§ظ„ط³ظٹط§ط±ط©',
  `goodType` VARCHAR(255) DEFAULT NULL COMMENT 'ظ†ظˆط¹ ط§ظ„ط¨ط¶ط§ط¹ط©',
  `weight` DECIMAL(15,2) DEFAULT NULL COMMENT 'ط§ظ„ظˆط²ظ†',
  `meters` DECIMAL(15,2) DEFAULT NULL COMMENT 'ط§ظ„ط£ظ…طھط§ط±',
  `description` TEXT DEFAULT NULL COMMENT 'ط§ظ„ظˆطµظپ',
  `date` VARCHAR(20) DEFAULT NULL COMMENT 'ط§ظ„طھط§ط±ظٹط®',
  `status` ENUM('pending', 'partial', 'paid') NOT NULL DEFAULT 'pending' COMMENT 'ط§ظ„ط­ط§ظ„ط©',
  `paidAmountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¯ظپظˆط¹ ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `paidAmountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط¯ظپظˆط¹ ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `state` VARCHAR(100) DEFAULT NULL COMMENT 'ط§ظ„ظ…ط­ط§ظپط¸ط©',
  `fxNote` VARCHAR(255) DEFAULT NULL COMMENT 'ظ…ظ„ط§ط­ط¸ط© ط§ظ„طµط±ظپ',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. ط¬ط¯ظˆظ„ ط§ظ„ظ…طµط±ظˆظپط§طھ
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `expense_date` VARCHAR(20) NOT NULL COMMENT 'طھط§ط±ظٹط® ط§ظ„ظ…طµط±ظˆظپ',
  `amount_usd` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `amount_iqd` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `description` TEXT DEFAULT NULL COMMENT 'ط§ظ„ظˆطµظپ',
  `port_id` VARCHAR(50) NOT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ظ…ظ†ظپط°',
  `created_by` INT DEFAULT NULL COMMENT 'ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ظ…ظ†ط´ط¦',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_port_id` (`port_id`),
  KEY `idx_expense_date` (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. ط¬ط¯ظˆظ„ ط­ط§ظ„ط© ط§ظ„طµظ†ط¯ظˆظ‚
-- CASH STATE
-- ============================================================
CREATE TABLE IF NOT EXISTS `cash_state` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `state` VARCHAR(255) NOT NULL COMMENT 'ط­ط§ظ„ط© ط§ظ„طµظ†ط¯ظˆظ‚',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. ط¬ط¯ظˆظ„ ط£ظ†ظˆط§ط¹ ط§ظ„ط¨ط¶ط§ط¦ط¹
-- GOODS TYPES (Lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `goods_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. ط¬ط¯ظˆظ„ ط§ظ„ظ…ط­ط§ظپط¸ط§طھ
-- GOVERNORATES (Lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `governorates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `trance_price` DECIMAL(15,0) DEFAULT NULL COMMENT 'ط³ط¹ط± ط§ظ„ظ†ظ‚ظ„',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. ط¬ط¯ظˆظ„ ط§ظ„ظ…ظ†ط§ظپط°
-- PORTS (Lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `ports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `portId` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `section` VARCHAR(50) NOT NULL COMMENT 'ط§ظ„ظ‚ط³ظ…: ports, transport, partnership, fx',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_portId` (`portId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. ط¬ط¯ظˆظ„ ط£ظ†ظˆط§ط¹ ط§ظ„ط­ط³ط§ط¨ط§طھ
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
-- 13. ط¬ط¯ظˆظ„ ظ…ط·ط§ط¨ظ‚ط© ط§ظ„ط¯ظپط¹ط§طھ
-- PAYMENT MATCHING
-- ============================================================
CREATE TABLE IF NOT EXISTS `payment_matching` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `invoiceId` INT NOT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ظپط§طھظˆط±ط©',
  `paymentId` INT NOT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ط¯ظپط¹ط©',
  `amountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط·ط§ط¨ظ‚ ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `amountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط§ظ„ظ…ط·ط§ط¨ظ‚ ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `notes` TEXT DEFAULT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_invoiceId` (`invoiceId`),
  KEY `idx_paymentId` (`paymentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. ط¬ط¯ظˆظ„ ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط­ظ‚ظˆظ„
-- FIELD CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS `field_config` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `section_key` VARCHAR(100) NOT NULL COMMENT 'ظ…ظپطھط§ط­ ط§ظ„ظ‚ط³ظ…',
  `field_key` VARCHAR(100) NOT NULL COMMENT 'ظ…ظپطھط§ط­ ط§ظ„ط­ظ‚ظ„',
  `visible` INT NOT NULL DEFAULT 1 COMMENT '1=ظ…ط±ط¦ظٹ, 0=ظ…ط®ظپظٹ',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT 'طھط±طھظٹط¨ ط§ظ„ط¹ط±ط¶',
  `display_label` VARCHAR(255) NULL COMMENT 'اسم العرض المخصص للحقل داخل هذه الشاشة',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_section_key` (`section_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. ط¬ط¯ظˆظ„ ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط®طµطµط©
-- CUSTOM FIELDS
-- ============================================================
CREATE TABLE IF NOT EXISTS `custom_fields` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `field_key` VARCHAR(100) NOT NULL COMMENT 'ظ…ظپطھط§ط­ ط§ظ„ط­ظ‚ظ„ ط§ظ„ظپط±ظٹط¯',
  `label` VARCHAR(255) NOT NULL COMMENT 'ط¹ظ†ظˆط§ظ† ط§ظ„ط­ظ‚ظ„',
  `field_type` VARCHAR(50) NOT NULL COMMENT 'ظ†ظˆط¹ ط§ظ„ط­ظ‚ظ„: text, number, select, date',
  `options` JSON DEFAULT NULL COMMENT 'ط®ظٹط§ط±ط§طھ (ظ„ظ„ط­ظ‚ظˆظ„ ظ…ظ† ظ†ظˆط¹ select)',
  `default_value` VARCHAR(255) DEFAULT NULL COMMENT 'ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ط§ظپطھط±ط§ط¶ظٹط©',
  `formula` JSON DEFAULT NULL COMMENT 'طµظٹط؛ط© ط­ط³ط§ط¨ظٹط©',
  `placement` VARCHAR(50) DEFAULT 'transaction' COMMENT 'ظ…ظƒط§ظ† ط§ظ„ط­ظ‚ظ„',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_field_key` (`field_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. ط¬ط¯ظˆظ„ ظ‚ظٹظ… ط§ظ„ط­ظ‚ظˆظ„ ط§ظ„ظ…ط®طµطµط©
-- CUSTOM FIELD VALUES
-- ============================================================
CREATE TABLE IF NOT EXISTS `custom_field_values` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `custom_field_id` INT NOT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ط­ظ‚ظ„ ط§ظ„ظ…ط®طµطµ',
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'ظ†ظˆط¹ ط§ظ„ظƒظٹط§ظ†: transaction, account',
  `entity_id` INT NOT NULL COMMENT 'ظ…ط¹ط±ظپ ط§ظ„ظƒظٹط§ظ†',
  `value` TEXT DEFAULT NULL COMMENT 'ط§ظ„ظ‚ظٹظ…ط©',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_custom_field_id` (`custom_field_id`),
  KEY `idx_entity` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. ط¬ط¯ظˆظ„ ط§ظ„ط­ط³ط§ط¨ط§طھ ط§ظ„ط®ط§طµط©
-- SPECIAL ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS `special_accounts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(50) NOT NULL COMMENT 'ط§ظ„ظ†ظˆط¹: haider, other',
  `name` VARCHAR(255) NOT NULL COMMENT 'ط§ظ„ط§ط³ظ…',
  `amountUSD` DECIMAL(15,2) DEFAULT '0.00' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظˆظ„ط§ط±',
  `amountIQD` DECIMAL(15,0) DEFAULT '0' COMMENT 'ط§ظ„ظ…ط¨ظ„ط؛ ط¨ط§ظ„ط¯ظٹظ†ط§ط±',
  `description` TEXT DEFAULT NULL COMMENT 'ط§ظ„ظˆطµظپ',
  `date` VARCHAR(20) DEFAULT NULL COMMENT 'ط§ظ„طھط§ط±ظٹط®',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. ط¬ط¯ظˆظ„ ط§ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† (ظ‚ط§ظ„ط¨ Manus - ط؛ظٹط± ظ…ط³طھط®ط¯ظ… ظپظٹ ط§ظ„طھط·ط¨ظٹظ‚)
-- USERS (Template/Manus OAuth - NOT used by the app)
-- ظٹظ…ظƒظ† طھط¬ط§ظ‡ظ„ ظ‡ط°ط§ ط§ظ„ط¬ط¯ظˆظ„ - ظ…ظˆط¬ظˆط¯ ظپظ‚ط· ظ„ظ„طھظˆط§ظپظ‚ ظ…ط¹ ط§ظ„ظ‚ط§ظ„ط¨
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

