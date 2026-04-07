import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);

  const tables = [
    `CREATE TABLE IF NOT EXISTS field_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      section_key VARCHAR(100) NOT NULL,
      field_key VARCHAR(100) NOT NULL,
      visible INT NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      UNIQUE KEY uq_section_field (section_key, field_key)
    )`,
    `CREATE TABLE IF NOT EXISTS custom_fields (
      id INT AUTO_INCREMENT PRIMARY KEY,
      field_key VARCHAR(100) NOT NULL UNIQUE,
      label VARCHAR(255) NOT NULL,
      field_type VARCHAR(50) NOT NULL,
      options JSON,
      default_value VARCHAR(255),
      placement VARCHAR(50) DEFAULT 'transaction',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS custom_field_values (
      id INT AUTO_INCREMENT PRIMARY KEY,
      custom_field_id INT NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT NOT NULL,
      value TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_field (custom_field_id)
    )`
  ];

  for (const sql of tables) {
    await conn.execute(sql);
    console.log("✓ Table created/verified");
  }

  // Seed default field configs for all sections
  const sections = [
    'port-1', 'port-2', 'port-3',  // السعودية, المنذرية, القائم
    'transport-1', 'transport-2', 'transport-3',
    'partnership-1', 'partnership-2', 'partnership-3'
  ];

  const defaultFields = [
    { key: 'ref_no', order: 1 },
    { key: 'direction', order: 2 },
    { key: 'trans_date', order: 3 },
    { key: 'account_name', order: 4 },
    { key: 'currency', order: 5 },
    { key: 'driver_name', order: 6 },
    { key: 'vehicle_plate', order: 7 },
    { key: 'good_type', order: 8 },
    { key: 'weight', order: 9 },
    { key: 'meters', order: 10 },
    { key: 'cost_usd', order: 11 },
    { key: 'amount_usd', order: 12 },
    { key: 'cost_iqd', order: 13 },
    { key: 'amount_iqd', order: 14 },
    { key: 'fee_usd', order: 15 },
    { key: 'gov_name', order: 16 },
    { key: 'notes', order: 17 },
  ];

  for (const section of sections) {
    for (const field of defaultFields) {
      // fee_usd only visible for port-1 (السعودية) by default
      const visible = (field.key === 'fee_usd' && section !== 'port-1') ? 0 : 1;
      await conn.execute(
        `INSERT IGNORE INTO field_config (section_key, field_key, visible, sort_order) VALUES (?, ?, ?, ?)`,
        [section, field.key, visible, field.order]
      );
    }
  }
  console.log("✓ Default field configs seeded for all sections");

  await conn.end();
  console.log("✓ Migration complete!");
}

run().catch(e => { console.error(e); process.exit(1); });
