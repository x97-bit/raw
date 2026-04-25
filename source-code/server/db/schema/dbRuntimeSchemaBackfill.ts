import { type RuntimeSchemaConnection } from "./dbRuntimeSchemaHelpers";

export async function backfillRuntimeSupportData(
  connection: RuntimeSchemaConnection
) {
  await connection.query(`
    INSERT INTO companies (name)
    SELECT DISTINCT TRIM(company_name)
    FROM transactions
    WHERE company_name IS NOT NULL AND TRIM(company_name) <> ''
    ON DUPLICATE KEY UPDATE name = VALUES(name)
  `);

  await connection.query(`
    UPDATE transactions t
    JOIN companies c ON c.name = TRIM(t.company_name)
    SET t.company_id = c.id
    WHERE t.company_name IS NOT NULL
      AND TRIM(t.company_name) <> ''
      AND (t.company_id IS NULL OR t.company_id = 0)
  `);

  await connection.query(`
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    SELECT 'account', id, name, 'current-db' FROM accounts
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
  `);

  await connection.query(`
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    SELECT 'driver', id, name, 'current-db' FROM drivers
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
  `);

  await connection.query(`
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    SELECT 'vehicle', id, plateNumber, 'current-db' FROM vehicles
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
  `);

  await connection.query(`
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    SELECT 'good_type', id, name, 'current-db' FROM goods_types
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
  `);

  await connection.query(`
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    SELECT 'governorate', id, name, 'current-db' FROM governorates
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
  `);

  await connection.query(`
    INSERT INTO entity_aliases (entity_type, entity_id, alias_name, source_system)
    SELECT 'company', id, name, 'current-db' FROM companies
    ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)
  `);

  await connection.query(`
    INSERT INTO route_defaults (section_key, gov_id, currency, default_trans_price, notes, active)
    SELECT 'transport-1', id, 'IQD', trance_price, 'Backfilled from governorates.trance_price', 1
    FROM governorates
    WHERE trance_price IS NOT NULL
    ON DUPLICATE KEY UPDATE
      default_trans_price = VALUES(default_trans_price),
      notes = VALUES(notes),
      active = VALUES(active)
  `);
}
