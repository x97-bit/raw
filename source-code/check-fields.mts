import { createConnection } from 'mysql2/promise';

async function check() {
  const c = await createConnection({ host: '127.0.0.1', port: 3306, user: 'root', database: 'alrawi_db' });

  // Check field_config for cost fields
  const [rows] = await c.execute(
    `SELECT section_key, field_key, visible FROM field_config WHERE field_key IN ('cost_usd','cost_iqd') ORDER BY section_key`
  );
  console.log('=== Cost field_config visibility ===');
  (rows as any[]).forEach((r: any) => console.log(`  ${r.section_key} | ${r.field_key} | visible=${r.visible}`));

  // Check special accounts field config
  const [allRows] = await c.execute(
    `SELECT section_key, field_key, visible FROM field_config WHERE section_key LIKE 'special%' AND field_key IN ('cost_usd','cost_iqd')`
  );
  console.log('\n=== Special account cost field_config ===');
  (allRows as any[]).forEach((r: any) => console.log(`  ${r.section_key} | ${r.field_key} | visible=${r.visible}`));

  // Show all section keys
  const [sections] = await c.execute(`SELECT DISTINCT section_key FROM field_config ORDER BY section_key`);
  console.log('\n=== All section keys in field_config ===');
  (sections as any[]).forEach((r: any) => console.log(`  ${r.section_key}`));

  await c.end();
}

check().catch(console.error);
