import mysql from "mysql2/promise";

export type RuntimeSchemaConnection = mysql.Connection;

export async function ensureColumn(
  connection: RuntimeSchemaConnection,
  tableName: string,
  columnName: string,
  definitionSql: string,
) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName],
  );

  if (existing.length === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${definitionSql}`);
  }
}

export async function ensureIndex(
  connection: RuntimeSchemaConnection,
  tableName: string,
  indexName: string,
  definitionSql: string,
) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT INDEX_NAME
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [tableName, indexName],
  );

  if (existing.length === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD ${definitionSql}`);
  }
}

export async function ensureForeignKey(
  connection: RuntimeSchemaConnection,
  tableName: string,
  constraintName: string,
  definitionSql: string,
) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      LIMIT 1
    `,
    [tableName, constraintName],
  );

  if (existing.length === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` ${definitionSql}`);
  }
}

export async function ensureUniqueConstraint(
  connection: RuntimeSchemaConnection,
  tableName: string,
  constraintName: string,
  definitionSql: string,
) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT CONSTRAINT_NAME
      FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND CONSTRAINT_NAME = ?
        AND CONSTRAINT_TYPE = 'UNIQUE'
      LIMIT 1
    `,
    [tableName, constraintName],
  );

  if (existing.length === 0) {
    await connection.query(`ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` ${definitionSql}`);
  }
}

export async function ensureDateColumn(
  connection: RuntimeSchemaConnection,
  tableName: string,
  columnName: string,
  { nullable }: { nullable: boolean },
) {
  const [existing] = await connection.query<mysql.RowDataPacket[]>(
    `
      SELECT DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName],
  );

  if (existing.length === 0) {
    throw new Error(`Column ${tableName}.${columnName} was not found during date hardening.`);
  }

  if (String(existing[0].DATA_TYPE).toLowerCase() === "date") {
    return;
  }

  const [invalidRows] = await connection.query<mysql.RowDataPacket[]>(`
    SELECT COUNT(*) AS c
    FROM \`${tableName}\`
    WHERE \`${columnName}\` IS NOT NULL
      AND TRIM(CAST(\`${columnName}\` AS CHAR)) <> ''
      AND STR_TO_DATE(CAST(\`${columnName}\` AS CHAR), '%Y-%m-%d') IS NULL
  `);

  const invalidCount = Number(invalidRows[0]?.c || 0);
  if (invalidCount > 0) {
    throw new Error(`Cannot convert ${tableName}.${columnName} to DATE because ${invalidCount} invalid rows were found.`);
  }

  await connection.query(`
    ALTER TABLE \`${tableName}\`
    MODIFY COLUMN \`${columnName}\` DATE ${nullable ? "NULL" : "NOT NULL"}
  `);
}
