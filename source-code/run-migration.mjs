import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const statements = [
  // accounts - new columns
  "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency varchar(10) DEFAULT NULL",
  "ALTER TABLE accounts ADD COLUMN IF NOT EXISTS merchantReport varchar(255) DEFAULT NULL",
  
  // transactions - new columns
  "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS qty int DEFAULT NULL",
  "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS amount_iqd2 decimal(15,0) DEFAULT NULL",
  "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS car_qty int DEFAULT NULL",
  "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS trans_price decimal(15,0) DEFAULT NULL",
  "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS company_name varchar(255) DEFAULT NULL",
  "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS meal_no int DEFAULT NULL",
  
  // debts - new columns
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS feeUSD decimal(15,2) DEFAULT '0'",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS feeIQD decimal(15,0) DEFAULT '0'",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS transType varchar(100) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS fxRate decimal(15,2) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS driverName varchar(255) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS carNumber varchar(100) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS goodType varchar(255) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS weight decimal(15,2) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS meters decimal(15,2) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS state varchar(100) DEFAULT NULL",
  "ALTER TABLE debts ADD COLUMN IF NOT EXISTS fxNote varchar(255) DEFAULT NULL",
  
  // governorates - new column
  "ALTER TABLE governorates ADD COLUMN IF NOT EXISTS trance_price decimal(15,0) DEFAULT NULL",
  
  // expenses table
  `CREATE TABLE IF NOT EXISTS expenses (
    id int AUTO_INCREMENT PRIMARY KEY,
    expense_date varchar(20) NOT NULL,
    amount_usd decimal(15,2) DEFAULT '0',
    amount_iqd decimal(15,0) DEFAULT '0',
    description text,
    port_id varchar(50) NOT NULL,
    created_by int DEFAULT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  
  // cash_state table
  `CREATE TABLE IF NOT EXISTS cash_state (
    id int AUTO_INCREMENT PRIMARY KEY,
    state varchar(255) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL + '&ssl={"rejectUnauthorized":true}');
  
  for (const sql of statements) {
    try {
      await conn.execute(sql);
      const shortSql = sql.replace(/\s+/g, ' ').substring(0, 80);
      console.log(`✓ ${shortSql}...`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.message.includes('Duplicate column')) {
        const shortSql = sql.replace(/\s+/g, ' ').substring(0, 80);
        console.log(`⊘ Already exists: ${shortSql}...`);
      } else {
        console.error(`✗ Error: ${err.message}`);
        console.error(`  SQL: ${sql.substring(0, 100)}`);
      }
    }
  }
  
  await conn.end();
  console.log('\n✓ Migration complete!');
}

run().catch(console.error);
