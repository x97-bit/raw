import { createConnection } from 'mysql2/promise';

async function fix() {
  const c = await createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    database: 'alrawi_db',
  });

  // Add missing columns to transactions table
  const missingCols = [
    { name: 'carrier_id', def: 'INT DEFAULT NULL' },
    { name: 'syr_cus', def: 'DECIMAL(15,2) DEFAULT 0' },
    { name: 'car_qty', def: 'INT DEFAULT NULL' },
    { name: 'trans_price', def: 'DECIMAL(15,0) DEFAULT NULL' },
    { name: 'company_id', def: 'INT DEFAULT NULL' },
    { name: 'company_name', def: 'VARCHAR(255) DEFAULT NULL' },
    { name: 'record_type', def: "VARCHAR(20) DEFAULT 'shipment'" },
    { name: 'trader_note', def: 'TEXT' },
    { name: 'fee_usd', def: 'DECIMAL(15,2) DEFAULT 0' },
    { name: 'ref_no', def: 'VARCHAR(50) DEFAULT NULL' },
    { name: 'created_by', def: 'INT DEFAULT NULL' },
  ];

  for (const col of missingCols) {
    try {
      await c.execute(`ALTER TABLE \`transactions\` ADD COLUMN \`${col.name}\` ${col.def}`);
      console.log(`✓ Added column: ${col.name}`);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('Duplicate column')) {
        console.log(`  Already exists: ${col.name}`);
      } else {
        console.log(`  Error on ${col.name}: ${msg.substring(0, 80)}`);
      }
    }
  }

  await c.end();
  console.log('\nSchema fix done!');
}

fix().catch(console.error);
