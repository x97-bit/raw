import { createConnection } from 'mysql2/promise';

async function fixForeignKeys() {
  const c = await createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    database: 'alrawi_db',
  });

  // Get all existing FKs
  const [fks] = await c.execute(`
    SELECT CONSTRAINT_NAME, TABLE_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
    AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    ORDER BY TABLE_NAME, CONSTRAINT_NAME
  `);
  
  const rows = fks as Array<{ CONSTRAINT_NAME: string; TABLE_NAME: string }>;
  console.log('Existing FKs:');
  rows.forEach(r => console.log(` - ${r.TABLE_NAME}.${r.CONSTRAINT_NAME}`));

  // Drop all existing FKs so ensureRuntimeSchema can recreate them cleanly 
  await c.execute(`SET FOREIGN_KEY_CHECKS=0`);
  for (const fk of rows) {
    try {
      await c.execute(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      console.log(`Dropped FK: ${fk.TABLE_NAME}.${fk.CONSTRAINT_NAME}`);
    } catch (e) {
      console.log(`Skipped: ${fk.CONSTRAINT_NAME} - ${(e as Error).message.substring(0, 60)}`);
    }
  }
  await c.execute(`SET FOREIGN_KEY_CHECKS=1`);

  await c.end();
  console.log('\nFK cleanup done — server will recreate them cleanly on next startup');
}

fixForeignKeys().catch(console.error);
