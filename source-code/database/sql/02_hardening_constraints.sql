-- Safe hardening batch for the current Al-Rawi schema
-- Adds missing support tables, indexes, and foreign keys without changing app behavior.

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

CREATE TABLE IF NOT EXISTS `entity_aliases` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NOT NULL,
  `alias_name` VARCHAR(255) NOT NULL,
  `source_system` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entity_alias` (`entity_type`, `alias_name`),
  KEY `idx_entity_alias_lookup` (`entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `account_defaults` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `account_id` INT NOT NULL,
  `section_key` VARCHAR(100) NOT NULL,
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
  KEY `idx_account_defaults_section` (`section_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `route_defaults` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `section_key` VARCHAR(100) NOT NULL,
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

ALTER TABLE `transactions`
  ADD KEY `idx_account_id` (`account_id`),
  ADD KEY `idx_driver_id` (`driver_id`),
  ADD KEY `idx_vehicle_id` (`vehicle_id`),
  ADD KEY `idx_good_type_id` (`good_type_id`),
  ADD KEY `idx_gov_id` (`gov_id`),
  ADD KEY `idx_carrier_id` (`carrier_id`);

ALTER TABLE `custom_field_values`
  ADD KEY `idx_custom_field_id` (`custom_field_id`);

ALTER TABLE `account_defaults`
  ADD KEY `idx_account_id` (`account_id`),
  ADD KEY `idx_default_driver_id` (`default_driver_id`),
  ADD KEY `idx_default_vehicle_id` (`default_vehicle_id`),
  ADD KEY `idx_default_good_type_id` (`default_good_type_id`),
  ADD KEY `idx_default_gov_id` (`default_gov_id`),
  ADD KEY `idx_default_company_id` (`default_company_id`),
  ADD KEY `idx_default_carrier_id` (`default_carrier_id`);

ALTER TABLE `route_defaults`
  ADD KEY `idx_gov_id` (`gov_id`);

ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_transactions_account_id`
    FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transactions_driver_id`
    FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transactions_vehicle_id`
    FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transactions_good_type_id`
    FOREIGN KEY (`good_type_id`) REFERENCES `goods_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transactions_gov_id`
    FOREIGN KEY (`gov_id`) REFERENCES `governorates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transactions_company_id`
    FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transactions_carrier_id`
    FOREIGN KEY (`carrier_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `payment_matching`
  ADD CONSTRAINT `fk_payment_matching_invoice`
    FOREIGN KEY (`invoiceId`) REFERENCES `transactions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_matching_payment`
    FOREIGN KEY (`paymentId`) REFERENCES `transactions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `custom_field_values`
  ADD CONSTRAINT `fk_custom_field_values_custom_field_id`
    FOREIGN KEY (`custom_field_id`) REFERENCES `custom_fields` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `account_defaults`
  ADD CONSTRAINT `fk_account_defaults_account_id`
    FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_defaults_default_driver_id`
    FOREIGN KEY (`default_driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_defaults_default_vehicle_id`
    FOREIGN KEY (`default_vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_defaults_default_good_type_id`
    FOREIGN KEY (`default_good_type_id`) REFERENCES `goods_types` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_defaults_default_gov_id`
    FOREIGN KEY (`default_gov_id`) REFERENCES `governorates` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_defaults_default_company_id`
    FOREIGN KEY (`default_company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_account_defaults_default_carrier_id`
    FOREIGN KEY (`default_carrier_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `route_defaults`
  ADD CONSTRAINT `fk_route_defaults_gov_id`
    FOREIGN KEY (`gov_id`) REFERENCES `governorates` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
