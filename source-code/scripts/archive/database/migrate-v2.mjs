import mysql from 'mysql2/promise';
import { buildMySqlConnectionOptions } from '../../shared/scriptMysqlConfig.mjs';

const conn = await mysql.createConnection(buildMySqlConnectionOptions(process.env.DATABASE_URL));

const queries = [
  // Create drivers table
  `CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // Create vehicles table
  `CREATE TABLE IF NOT EXISTS vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plateNumber VARCHAR(100) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
  )`,

  // Drop old transactions table and recreate with new schema
  `DROP TABLE IF EXISTS transactions`,

  `CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ref_no VARCHAR(50),
    direction VARCHAR(5) NOT NULL,
    trans_date VARCHAR(20) NOT NULL,
    account_id INT NOT NULL,
    currency VARCHAR(10) DEFAULT 'BOTH',
    driver_id INT,
    vehicle_id INT,
    good_type_id INT,
    weight DECIMAL(15,2),
    meters DECIMAL(15,2),
    cost_usd DECIMAL(15,2) DEFAULT 0,
    amount_usd DECIMAL(15,2) DEFAULT 0,
    cost_iqd DECIMAL(15,0) DEFAULT 0,
    amount_iqd DECIMAL(15,0) DEFAULT 0,
    fee_usd DECIMAL(15,2) DEFAULT 0,
    gov_id INT,
    notes TEXT,
    trader_note TEXT,
    record_type VARCHAR(20) DEFAULT 'shipment',
    port_id VARCHAR(50) NOT NULL,
    account_type VARCHAR(50) NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
  )`,
];

for (const q of queries) {
  try {
    await conn.execute(q);
    console.log('OK:', q.substring(0, 60) + '...');
  } catch (e) {
    console.error('ERR:', e.message, '\nQuery:', q.substring(0, 80));
  }
}

await conn.end();
console.log('Migration v2 complete');
