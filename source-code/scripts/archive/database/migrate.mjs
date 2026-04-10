import mysql from 'mysql2/promise';
import { buildMySqlConnectionOptions } from '../../shared/scriptMysqlConfig.mjs';

async function migrate() {
  const conn = await mysql.createConnection(buildMySqlConnectionOptions(process.env.DATABASE_URL));
  
  const tables = [
    `CREATE TABLE IF NOT EXISTS app_users (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      username varchar(100) NOT NULL UNIQUE,
      password varchar(255) NOT NULL,
      name varchar(255) NOT NULL,
      profile_image longtext,
      role enum('admin','user') NOT NULL DEFAULT 'user',
      permissions json,
      active int NOT NULL DEFAULT 1,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS debts (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      debtorName varchar(255) NOT NULL,
      amountUSD decimal(15,2) DEFAULT 0,
      amountIQD decimal(15,0) DEFAULT 0,
      description text,
      date varchar(20),
      status enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
      paidAmountUSD decimal(15,2) DEFAULT 0,
      paidAmountIQD decimal(15,0) DEFAULT 0,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS goods_types (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      name varchar(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS governorates (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      name varchar(255) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS ports (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      portId varchar(50) NOT NULL UNIQUE,
      name varchar(255) NOT NULL,
      section varchar(50) NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      type int NOT NULL,
      accountId int NOT NULL,
      accountName varchar(255),
      portId varchar(50) NOT NULL,
      accountType varchar(50) NOT NULL,
      date varchar(20) NOT NULL,
      amountUSD decimal(15,2) DEFAULT 0,
      amountIQD decimal(15,0) DEFAULT 0,
      description text,
      goodsType varchar(255),
      truckNumber varchar(100),
      driverName varchar(255),
      manifestNumber varchar(100),
      containerNumber varchar(100),
      governorate varchar(100),
      notes text,
      receiptNumber varchar(100),
      createdBy int,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS payment_matching (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      invoiceId int NOT NULL,
      paymentId int NOT NULL,
      amountUSD decimal(15,2) DEFAULT 0,
      amountIQD decimal(15,0) DEFAULT 0,
      notes text,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS special_accounts (
      id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
      type varchar(50) NOT NULL,
      name varchar(255) NOT NULL,
      amountUSD decimal(15,2) DEFAULT 0,
      amountIQD decimal(15,0) DEFAULT 0,
      description text,
      date varchar(20),
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of tables) {
    try {
      await conn.query(sql);
      const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
      console.log(`✓ ${match ? match[1] : 'table'} created`);
    } catch (e) {
      console.error(`✗ Error:`, e.message);
    }
  }

  const [rows] = await conn.query('SHOW TABLES');
  console.log('\nAll tables:', rows.map(r => Object.values(r)[0]).join(', '));
  await conn.end();
}

migrate().catch(e => console.error(e));
