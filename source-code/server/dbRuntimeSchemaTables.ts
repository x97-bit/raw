import { ensureColumn, type RuntimeSchemaConnection } from "./dbRuntimeSchemaHelpers";

export async function ensureRuntimeSupportTables(connection: RuntimeSchemaConnection) {
  await ensureColumn(connection, "field_config", "display_label", "`display_label` VARCHAR(255) NULL AFTER `sort_order`");
  await ensureColumn(connection, "app_users", "profile_image", "`profile_image` LONGTEXT NULL AFTER `name`");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_companies_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS entity_aliases (
      id INT NOT NULL AUTO_INCREMENT,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT NOT NULL,
      alias_name VARCHAR(255) NOT NULL,
      source_system VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_entity_alias (entity_type, alias_name),
      KEY idx_entity_alias_lookup (entity_type, entity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS account_defaults (
      id INT NOT NULL AUTO_INCREMENT,
      account_id INT NOT NULL,
      section_key VARCHAR(100) NOT NULL,
      default_currency VARCHAR(10) DEFAULT NULL,
      default_driver_id INT DEFAULT NULL,
      default_vehicle_id INT DEFAULT NULL,
      default_good_type_id INT DEFAULT NULL,
      default_gov_id INT DEFAULT NULL,
      default_company_id INT DEFAULT NULL,
      default_carrier_id INT DEFAULT NULL,
      default_fee_usd DECIMAL(15,2) DEFAULT NULL,
      default_syr_cus DECIMAL(15,2) DEFAULT NULL,
      default_car_qty INT DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_account_defaults (account_id, section_key),
      KEY idx_account_defaults_section (section_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS route_defaults (
      id INT NOT NULL AUTO_INCREMENT,
      section_key VARCHAR(100) NOT NULL,
      gov_id INT NOT NULL,
      currency VARCHAR(10) NOT NULL DEFAULT 'IQD',
      default_trans_price DECIMAL(15,2) DEFAULT NULL,
      default_fee_usd DECIMAL(15,2) DEFAULT NULL,
      default_cost_usd DECIMAL(15,2) DEFAULT NULL,
      default_amount_usd DECIMAL(15,2) DEFAULT NULL,
      default_cost_iqd DECIMAL(15,0) DEFAULT NULL,
      default_amount_iqd DECIMAL(15,0) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_route_defaults (section_key, gov_id, currency),
      KEY idx_route_defaults_gov (gov_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT NOT NULL AUTO_INCREMENT,
      entity_type VARCHAR(100) NOT NULL,
      entity_id INT DEFAULT NULL,
      action VARCHAR(20) NOT NULL,
      summary VARCHAR(255) NOT NULL,
      before_data JSON DEFAULT NULL,
      after_data JSON DEFAULT NULL,
      changes JSON DEFAULT NULL,
      metadata JSON DEFAULT NULL,
      user_id INT DEFAULT NULL,
      username VARCHAR(255) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_entity_type (entity_type),
      KEY idx_entity_id (entity_id),
      KEY idx_action (action),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await ensureColumn(connection, "transactions", "company_id", "`company_id` INT NULL AFTER `company_name`");
}
