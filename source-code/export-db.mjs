import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

async function exportDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  console.log('🔗 Connected to database');
  
  // Get all table names
  const [tables] = await connection.query(`
    SELECT TABLE_NAME, TABLE_COMMENT 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME
  `);
  
  console.log(`📋 Found ${tables.length} tables`);
  
  const exportData = {
    _meta: {
      exportDate: new Date().toISOString(),
      description: 'نظام طي الراوي للنقل والتخليص - قاعدة البيانات الكاملة',
      version: '2.0',
      tableCount: tables.length
    },
    schema: {},
    data: {}
  };
  
  let totalRows = 0;
  
  for (const table of tables) {
    const tableName = table.TABLE_NAME;
    console.log(`\n📦 Processing: ${tableName}`);
    
    // Get column info (schema)
    const [columns] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA,
        COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);
    
    // Get indexes
    const [indexes] = await connection.query(`
      SELECT 
        INDEX_NAME,
        COLUMN_NAME,
        NON_UNIQUE,
        SEQ_IN_INDEX
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `, [tableName]);
    
    // Get foreign keys
    const [foreignKeys] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [tableName]);
    
    // Get CREATE TABLE statement
    const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createSQL = createTable[0]['Create Table'];
    
    // Store schema
    exportData.schema[tableName] = {
      comment: table.TABLE_COMMENT || '',
      columns: columns.map(c => ({
        name: c.COLUMN_NAME,
        type: c.COLUMN_TYPE,
        dataType: c.DATA_TYPE,
        nullable: c.IS_NULLABLE === 'YES',
        default: c.COLUMN_DEFAULT,
        key: c.COLUMN_KEY || null,
        extra: c.EXTRA || null,
        comment: c.COLUMN_COMMENT || null
      })),
      indexes: indexes.reduce((acc, idx) => {
        if (!acc[idx.INDEX_NAME]) {
          acc[idx.INDEX_NAME] = { unique: !idx.NON_UNIQUE, columns: [] };
        }
        acc[idx.INDEX_NAME].columns.push(idx.COLUMN_NAME);
        return acc;
      }, {}),
      foreignKeys: foreignKeys.map(fk => ({
        constraint: fk.CONSTRAINT_NAME,
        column: fk.COLUMN_NAME,
        referencedTable: fk.REFERENCED_TABLE_NAME,
        referencedColumn: fk.REFERENCED_COLUMN_NAME
      })),
      createSQL: createSQL
    };
    
    // Get all data
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    exportData.data[tableName] = rows;
    
    totalRows += rows.length;
    console.log(`   ✅ Schema: ${columns.length} columns, ${Object.keys(exportData.schema[tableName].indexes).length} indexes`);
    console.log(`   ✅ Data: ${rows.length} rows`);
  }
  
  exportData._meta.totalRows = totalRows;
  
  // Write to file
  const outputPath = '/home/ubuntu/alrawi-database-export.json';
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf8');
  
  const fileSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Export complete!`);
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Tables: ${tables.length}`);
  console.log(`📝 Total rows: ${totalRows}`);
  console.log(`💾 File size: ${fileSizeMB} MB`);
  console.log('='.repeat(50));
  
  await connection.end();
}

exportDatabase().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
