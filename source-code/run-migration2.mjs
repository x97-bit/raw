import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('No DATABASE_URL'); process.exit(1); }

async function run() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  const alterStatements = [
    // Add syr_cus column
    `ALTER TABLE transactions ADD COLUMN syr_cus DECIMAL(15,2) DEFAULT 0`,
    // Add carrier_id column
    `ALTER TABLE transactions ADD COLUMN carrier_id INT NULL`,
    // Drop amount_iqd2 column (user said delete)
    `ALTER TABLE transactions DROP COLUMN amount_iqd2`,
    // Drop meal_no column (user said skip)
    `ALTER TABLE transactions DROP COLUMN meal_no`,
  ];

  for (const sql of alterStatements) {
    try {
      await conn.execute(sql);
      console.log('✅', sql.substring(0, 80));
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('⏭️  Column already exists:', sql.substring(0, 80));
      } else if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY' || e.message.includes("check that column/key exists")) {
        console.log('⏭️  Column does not exist:', sql.substring(0, 80));
      } else {
        console.error('❌', e.message, '→', sql.substring(0, 80));
      }
    }
  }

  await conn.end();
  console.log('\nMigration complete!');
}

run().catch(e => { console.error(e); process.exit(1); });
