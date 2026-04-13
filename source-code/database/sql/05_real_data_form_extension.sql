-- ============================================================
-- Al-Rawi Transport & Clearance System
-- Real Data Form Extension (Additive / Backward-Compatible)
-- ============================================================
-- Purpose:
-- 1. Keep current operational tables working exactly as they are.
-- 2. Add master-data tables needed to drive forms with real lookup data.
-- 3. Prepare a clean path for importing/finalizing data from the previous system.
-- ============================================================

USE `alrawi_db`;

-- ============================================================
-- 1) COMPANIES
-- Normalize `transactions.company_name` into a master lookup without
-- removing the legacy text column. Old behavior stays valid.
-- ============================================================
CREATE TABLE IF NOT EXISTS `companies` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_companies_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add nullable company_id to transactions only if it does not already exist.
SET @company_id_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'transactions'
    AND COLUMN_NAME = 'company_id'
);

SET @company_id_sql := IF(
  @company_id_exists = 0,
  'ALTER TABLE `transactions` ADD COLUMN `company_id` INT NULL AFTER `company_name`, ADD KEY `idx_company_id` (`company_id`)',
  'SELECT 1'
);

PREPARE stmt_company_id FROM @company_id_sql;
EXECUTE stmt_company_id;
DEALLOCATE PREPARE stmt_company_id;

INSERT INTO `companies` (`name`)
SELECT DISTINCT TRIM(`company_name`)
FROM `transactions`
WHERE `company_name` IS NOT NULL
  AND TRIM(`company_name`) <> ''
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

UPDATE `transactions` t
JOIN `companies` c ON c.`name` = TRIM(t.`company_name`)
SET t.`company_id` = c.`id`
WHERE t.`company_name` IS NOT NULL
  AND TRIM(t.`company_name`) <> ''
  AND (t.`company_id` IS NULL OR t.`company_id` = 0);

-- ============================================================
-- 2) ENTITY ALIASES
-- Supports dirty/legacy names from Access/Excel/old system and maps them
-- to canonical master records during import or autocomplete resolution.
-- ============================================================
CREATE TABLE IF NOT EXISTS `entity_aliases` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'account, driver, vehicle, good_type, company, governorate',
  `entity_id` INT NOT NULL,
  `alias_name` VARCHAR(255) NOT NULL,
  `source_system` VARCHAR(100) DEFAULT NULL COMMENT 'access, excel, previous-system, current-db',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entity_alias` (`entity_type`, `alias_name`),
  KEY `idx_entity_alias_lookup` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `entity_aliases` (`entity_type`, `entity_id`, `alias_name`, `source_system`)
SELECT 'account', `id`, `name`, 'current-db'
FROM `accounts`
ON DUPLICATE KEY UPDATE `entity_id` = VALUES(`entity_id`);

INSERT INTO `entity_aliases` (`entity_type`, `entity_id`, `alias_name`, `source_system`)
SELECT 'driver', `id`, `name`, 'current-db'
FROM `drivers`
ON DUPLICATE KEY UPDATE `entity_id` = VALUES(`entity_id`);

INSERT INTO `entity_aliases` (`entity_type`, `entity_id`, `alias_name`, `source_system`)
SELECT 'vehicle', `id`, `plateNumber`, 'current-db'
FROM `vehicles`
ON DUPLICATE KEY UPDATE `entity_id` = VALUES(`entity_id`);

INSERT INTO `entity_aliases` (`entity_type`, `entity_id`, `alias_name`, `source_system`)
SELECT 'good_type', `id`, `name`, 'current-db'
FROM `goods_types`
ON DUPLICATE KEY UPDATE `entity_id` = VALUES(`entity_id`);

INSERT INTO `entity_aliases` (`entity_type`, `entity_id`, `alias_name`, `source_system`)
SELECT 'governorate', `id`, `name`, 'current-db'
FROM `governorates`
ON DUPLICATE KEY UPDATE `entity_id` = VALUES(`entity_id`);

INSERT INTO `entity_aliases` (`entity_type`, `entity_id`, `alias_name`, `source_system`)
SELECT 'company', `id`, `name`, 'current-db'
FROM `companies`
ON DUPLICATE KEY UPDATE `entity_id` = VALUES(`entity_id`);

-- ============================================================
-- 3) ACCOUNT DEFAULTS
-- Real-data form autofill per account + section.
-- Example:
-- - Trader A in Saudi port opens with default driver/vehicle/currency
-- - Transport account opens with default governorate/carrier/price hints
-- ============================================================
CREATE TABLE IF NOT EXISTS `account_defaults` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `account_id` INT NOT NULL,
  `section_key` VARCHAR(100) NOT NULL COMMENT 'port-1, port-2, port-3, transport-1, partnership-1, ...',
  `default_currency` VARCHAR(10) DEFAULT NULL,
  `default_driver_id` INT DEFAULT NULL,
  `default_vehicle_id` INT DEFAULT NULL,
  `default_good_type_id` INT DEFAULT NULL,
  `default_gov_id` INT DEFAULT NULL,
  `default_company_id` INT DEFAULT NULL,
  `default_carrier_id` INT DEFAULT NULL,
  `default_fee_usd` DECIMAL(15,2) DEFAULT NULL,
  `default_syr_cus` DECIMAL(15,2) DEFAULT NULL,
  `default_car_qty` INT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_account_defaults` (`account_id`, `section_key`),
  KEY `idx_account_defaults_section` (`section_key`),
  KEY `idx_account_id` (`account_id`),
  KEY `idx_default_driver_id` (`default_driver_id`),
  KEY `idx_default_vehicle_id` (`default_vehicle_id`),
  KEY `idx_default_good_type_id` (`default_good_type_id`),
  KEY `idx_default_gov_id` (`default_gov_id`),
  KEY `idx_default_company_id` (`default_company_id`),
  KEY `idx_default_carrier_id` (`default_carrier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4) ROUTE DEFAULTS
-- Stores governorate/route-based defaults used by forms.
-- This is more flexible than a single global `governorates.trance_price`.
-- ============================================================
CREATE TABLE IF NOT EXISTS `route_defaults` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `section_key` VARCHAR(100) NOT NULL COMMENT 'transport-1, port-1, port-2, port-3, ...',
  `gov_id` INT NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'IQD',
  `default_trans_price` DECIMAL(15,2) DEFAULT NULL,
  `default_fee_usd` DECIMAL(15,2) DEFAULT NULL,
  `default_cost_usd` DECIMAL(15,2) DEFAULT NULL,
  `default_amount_usd` DECIMAL(15,2) DEFAULT NULL,
  `default_cost_iqd` DECIMAL(15,0) DEFAULT NULL,
  `default_amount_iqd` DECIMAL(15,0) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_route_defaults` (`section_key`, `gov_id`, `currency`),
  KEY `idx_route_defaults_gov` (`gov_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Backfill current transport prices from governorates into transport defaults.
INSERT INTO `route_defaults` (
  `section_key`,
  `gov_id`,
  `currency`,
  `default_trans_price`,
  `notes`,
  `active`
)
SELECT
  'transport-1',
  g.`id`,
  'IQD',
  g.`trance_price`,
  'Backfilled from governorates.trance_price',
  1
FROM `governorates` g
WHERE g.`trance_price` IS NOT NULL
ON DUPLICATE KEY UPDATE
  `default_trans_price` = VALUES(`default_trans_price`),
  `notes` = VALUES(`notes`),
  `active` = VALUES(`active`);

-- ============================================================
-- Notes
-- 1. This script is additive and does not remove or rename old columns.
-- 2. Existing app behavior continues to work even before the app starts
--    reading these new tables.
-- 3. The next implementation step in code is to expose:
--    - /lookups/companies
--    - account defaults by section
--    - route defaults by section + governorate
-- ============================================================
