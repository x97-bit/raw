/**
 * نظام طي الراوي - سكربت استيراد البيانات الإنتاجية
 * يستورد البيانات من ملفات JSON المستخرجة من Access
 * ومن ملفات Excel الخاصة بالتجار
 */
import mysql2 from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { buildMySqlConnectionOptions } from '../../shared/scriptMysqlConfig.mjs';

dotenv.config();

const ACCESS_DATA = '/home/ubuntu/access_data';

function loadJson(filename) {
  const filepath = path.join(ACCESS_DATA, filename);
  if (!fs.existsSync(filepath)) {
    console.log(`  ⚠ File not found: ${filename}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function cleanStr(s) {
  if (!s) return null;
  return String(s).replace(/\r\n/g, '').replace(/\r/g, '').trim() || null;
}

function parseDate(d) {
  if (!d) return '1900-01-01'; // Default for null dates
  const s = String(d);
  // Handle "2026-01-01T00:00" or "2026-01-01 00:00:00"
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // Handle "2025/05/24"
  const m2 = s.match(/(\d{4})\/(\d{2})\/(\d{2})/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return '1900-01-01';
}

function num(v) {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function currencyStr(currencyId) {
  switch (currencyId) {
    case 1: return 'USD';
    case 2: return 'IQD';
    case 3: return 'BOTH';
    default: return 'USD';
  }
}

function directionFromType(tranTypeId) {
  // 1 = فاتورة (invoice) = IN, 2 = سند (voucher) = OUT
  return tranTypeId === 1 ? 'IN' : 'OUT';
}

async function main() {
  console.log('🔗 Connecting to database...');
  const conn = await mysql2.createConnection(buildMySqlConnectionOptions(process.env.DATABASE_URL));
  
  try {
    // ============================================================
    // STEP 0: Clean existing test data
    // ============================================================
    console.log('\n🧹 Cleaning existing test data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('DELETE FROM payment_matching');
    await conn.query('DELETE FROM custom_field_values');
    await conn.query('DELETE FROM transactions');
    await conn.query('DELETE FROM debts');
    await conn.query('DELETE FROM expenses');
    await conn.query('DELETE FROM special_accounts');
    await conn.query('DELETE FROM accounts');
    await conn.query('DELETE FROM drivers');
    await conn.query('DELETE FROM vehicles');
    await conn.query('DELETE FROM goods_types');
    await conn.query('DELETE FROM governorates');
    await conn.query('DELETE FROM cash_state');
    // Reset auto-increment
    await conn.query('ALTER TABLE accounts AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE transactions AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE debts AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE drivers AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE vehicles AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE goods_types AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE governorates AUTO_INCREMENT = 1');
    await conn.query('ALTER TABLE special_accounts AUTO_INCREMENT = 1');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('  ✅ Cleaned');

    // ============================================================
    // STEP 1: Import Goods Types (merged from all ports)
    // ============================================================
    console.log('\n📦 Importing goods types...');
    const goodsKSA = loadJson('Tbl_Goods_Type.json');
    const goodsMNZ = loadJson('Tbl_Goods_Type_MNZ.json');
    const goodsQAIM = loadJson('Tbl_Goods_Type_QAIM.json');
    
    // Merge all unique goods
    const allGoods = new Map();
    for (const g of goodsKSA) {
      if (g.Good_Type) allGoods.set(g.Good_Type.trim(), true);
    }
    for (const g of goodsMNZ) {
      if (g.Good_Type_MZN) allGoods.set(g.Good_Type_MZN.trim(), true);
    }
    for (const g of goodsQAIM) {
      if (g.Good_Type_QAIM) allGoods.set(g.Good_Type_QAIM.trim(), true);
    }
    
    const goodsNameToId = {};
    let goodId = 1;
    for (const name of allGoods.keys()) {
      await conn.query('INSERT INTO goods_types (id, name) VALUES (?, ?)', [goodId, name]);
      goodsNameToId[name] = goodId;
      goodId++;
    }
    console.log(`  ✅ ${allGoods.size} goods types imported`);

    // ============================================================
    // STEP 2: Import Governorates with transport prices
    // ============================================================
    console.log('\n🏛️ Importing governorates...');
    const govs = loadJson('Tbl_Tran_Goverments.json');
    const govNameToId = {};
    
    for (const g of govs) {
      const name = cleanStr(g.Tran_Goverment_Name);
      if (!name) continue;
      const [result] = await conn.query(
        'INSERT INTO governorates (id, name, trance_price) VALUES (?, ?, ?)',
        [g.Tran_Goverment_ID, name, num(g.Trance_Prce) || null]
      );
      govNameToId[name] = g.Tran_Goverment_ID;
    }
    console.log(`  ✅ ${govs.length} governorates imported`);

    // ============================================================
    // STEP 3: Import Cash State
    // ============================================================
    console.log('\n💰 Importing cash states...');
    const cashStates = loadJson('Cash_State.json');
    for (const c of cashStates) {
      await conn.query('INSERT INTO cash_state (id, state) VALUES (?, ?)', [c.Cash_ID, c.Cash_State]);
    }
    console.log(`  ✅ ${cashStates.length} cash states imported`);

    // ============================================================
    // STEP 4: Import Accounts (Traders from all ports)
    // ============================================================
    console.log('\n👥 Importing accounts...');
    const accountIdMap = {}; // Maps "PORT-ORIGINAL_ID" -> new DB id
    let accountAutoId = 1;

    // --- KSA Traders ---
    const ksaTraders = loadJson('Tbl_KSA_Triders.json');
    for (const t of ksaTraders) {
      const [result] = await conn.query(
        'INSERT INTO accounts (id, name, accountType, portId, currency) VALUES (?, ?, ?, ?, ?)',
        [accountAutoId, cleanStr(t.KSA_Trider_Name), 'تاجر', 'port-1', currencyStr(t.Currency)]
      );
      accountIdMap[`KSA-${t.KSA_Trider_ID}`] = accountAutoId;
      accountAutoId++;
    }
    console.log(`  ✅ ${ksaTraders.length} KSA traders`);

    // --- MNZ Traders ---
    const mnzTraders = loadJson('Tbl_MNZ_Triders.json');
    for (const t of mnzTraders) {
      const [result] = await conn.query(
        'INSERT INTO accounts (id, name, accountType, portId, currency) VALUES (?, ?, ?, ?, ?)',
        [accountAutoId, cleanStr(t.MNZ_Trider_Name), 'تاجر', 'port-2', currencyStr(t.Currency)]
      );
      accountIdMap[`MNZ-${t.MNZ_Trider_ID}`] = accountAutoId;
      accountAutoId++;
    }
    console.log(`  ✅ ${mnzTraders.length} MNZ traders`);

    // --- QAIM Traders ---
    const qaimTraders = loadJson('Tbl_QAIM_Triders.json');
    for (const t of qaimTraders) {
      const [result] = await conn.query(
        'INSERT INTO accounts (id, name, accountType, portId, currency, merchantReport) VALUES (?, ?, ?, ?, ?, ?)',
        [accountAutoId, cleanStr(t.QAIM_Trider_Name), 'تاجر', 'port-3', currencyStr(t.Currency), cleanStr(t.Merchant_Report)]
      );
      accountIdMap[`QAIM-${t.QAIM_Trider_ID}`] = accountAutoId;
      accountAutoId++;
    }
    console.log(`  ✅ ${qaimTraders.length} QAIM traders`);

    // --- Transport Carriers ---
    const carriers = loadJson('Tbl_TRANS_Carriers.json');
    for (const t of carriers) {
      const [result] = await conn.query(
        'INSERT INTO accounts (id, name, accountType, portId, currency) VALUES (?, ?, ?, ?, ?)',
        [accountAutoId, cleanStr(t.TRANS_Carrier_Name), 'نقل', 'transport-1', currencyStr(t.Currency)]
      );
      accountIdMap[`TRANS-${t.TRANS_Carrier_ID}`] = accountAutoId;
      accountAutoId++;
    }
    console.log(`  ✅ ${carriers.length} transport carriers`);

    // --- Partnership Accounts ---
    const shrAccounts = loadJson('Tbl_SHR_Accounts.json');
    for (const t of shrAccounts) {
      const [result] = await conn.query(
        'INSERT INTO accounts (id, name, accountType, portId, currency) VALUES (?, ?, ?, ?, ?)',
        [accountAutoId, cleanStr(t.SHR_Account_Name), 'شراكة', 'partnership-1', currencyStr(t.Currency)]
      );
      accountIdMap[`SHR-${t.SHR_ID}`] = accountAutoId;
      accountAutoId++;
    }
    console.log(`  ✅ ${shrAccounts.length} partnership accounts`);

    // ============================================================
    // STEP 5: Import Drivers and Vehicles from transactions
    // ============================================================
    console.log('\n🚗 Extracting drivers and vehicles...');
    const driverNameToId = {};
    const vehicleToId = {};
    let driverAutoId = 1;
    let vehicleAutoId = 1;

    async function getOrCreateDriver(name) {
      const n = cleanStr(name);
      if (!n) return null;
      if (driverNameToId[n]) return driverNameToId[n];
      await conn.query('INSERT INTO drivers (id, name) VALUES (?, ?)', [driverAutoId, n]);
      driverNameToId[n] = driverAutoId;
      return driverAutoId++;
    }

    async function getOrCreateVehicle(plate) {
      const p = cleanStr(plate);
      if (!p) return null;
      if (vehicleToId[p]) return vehicleToId[p];
      await conn.query('INSERT INTO vehicles (id, plateNumber) VALUES (?, ?)', [vehicleAutoId, p]);
      vehicleToId[p] = vehicleAutoId;
      return vehicleAutoId++;
    }

    // Find the goods type ID by name (fuzzy match)
    function findGoodsId(goodName) {
      if (!goodName) return null;
      const name = String(goodName).trim();
      if (goodsNameToId[name]) return goodsNameToId[name];
      // Try partial match
      for (const [key, id] of Object.entries(goodsNameToId)) {
        if (key.includes(name) || name.includes(key)) return id;
      }
      return null;
    }

    // Find governorate ID by name (fuzzy match)
    function findGovId(govName) {
      if (!govName) return null;
      const name = String(govName).trim();
      if (govNameToId[name]) return govNameToId[name];
      for (const [key, id] of Object.entries(govNameToId)) {
        if (key.includes(name) || name.includes(key)) return id;
      }
      return null;
    }

    // ============================================================
    // STEP 6: Import KSA Transactions
    // ============================================================
    console.log('\n📋 Importing KSA transactions...');
    const ksaTrans = loadJson('Tbl_KSA_Trans.json');
    let ksaCount = 0;
    for (const t of ksaTrans) {
      const accountId = accountIdMap[`KSA-${t.Trider_ID}`];
      if (!accountId) {
        console.log(`  ⚠ KSA trader not found: ID=${t.Trider_ID}, skipping`);
        continue;
      }
      const driverId = await getOrCreateDriver(t.Driver_Name);
      const vehicleId = await getOrCreateVehicle(t.Car_Number);
      const goodTypeId = findGoodsId(t.Good_Type);
      const govId = findGovId(t.Goverment);
      
      // Determine direction: type 1=فاتورة(IN), type 2=سند(OUT)
      const direction = directionFromType(t.Tran_Type_ID);
      
      await conn.query(
        `INSERT INTO transactions (ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id, 
         good_type_id, weight, meters, cost_usd, amount_usd, cost_iqd, amount_iqd, gov_id, notes, trader_note, 
         record_type, port_id, account_type, syr_cus) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanStr(t.Ref_No), direction, parseDate(t.Tran_Date), accountId,
          currencyStr(t.Currency_ID), driverId, vehicleId, goodTypeId,
          num(t.Weight) || null, num(t.Meters) || null,
          num(t.Cost_USD), num(t.Amount_USD), num(t.Cost_IQD), num(t.Amount_IQD),
          govId, cleanStr(t.Note), cleanStr(t.Trider_Note),
          t.Tran_Type_ID === 1 ? 'shipment' : 'payment',
          'port-1', 'تاجر', num(t.KSA_Trance)
        ]
      );
      ksaCount++;
    }
    console.log(`  ✅ ${ksaCount} KSA transactions imported`);

    // ============================================================
    // STEP 7: Import MNZ Transactions
    // ============================================================
    console.log('\n📋 Importing MNZ transactions...');
    const mnzTrans = loadJson('Tbl_MNZ_Trans.json');
    let mnzCount = 0;
    for (const t of mnzTrans) {
      const accountId = accountIdMap[`MNZ-${t.Trider_ID}`];
      if (!accountId) {
        console.log(`  ⚠ MNZ trader not found: ID=${t.Trider_ID}, skipping`);
        continue;
      }
      const driverId = await getOrCreateDriver(t.Driver_Name);
      const vehicleId = await getOrCreateVehicle(t.Car_Number);
      const goodTypeId = findGoodsId(t.Good_Type);
      const direction = directionFromType(t.Tran_Type_ID);
      
      await conn.query(
        `INSERT INTO transactions (ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id, 
         good_type_id, weight, cost_usd, amount_usd, cost_iqd, amount_iqd, syr_cus, notes, trader_note, 
         record_type, port_id, account_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanStr(t.Ref_No_MNZ), direction, parseDate(t.Tran_Date), accountId,
          currencyStr(t.Currency_ID), driverId, vehicleId, goodTypeId,
          num(t.Weight) || null,
          num(t.Cost_USD), num(t.Amount_USD), num(t.Cost_IQD), num(t.Amount_IQD),
          num(t.SYR_CUS), cleanStr(t.Note), cleanStr(t.Trider_Note),
          t.Tran_Type_ID === 1 ? 'shipment' : 'payment',
          'port-2', 'تاجر'
        ]
      );
      mnzCount++;
    }
    console.log(`  ✅ ${mnzCount} MNZ transactions imported`);

    // ============================================================
    // STEP 8: Import QAIM Transactions
    // ============================================================
    console.log('\n📋 Importing QAIM transactions...');
    const qaimTrans = loadJson('Tbl_QAIM_Trans.json');
    let qaimCount = 0;
    for (const t of qaimTrans) {
      const accountId = accountIdMap[`QAIM-${t.Trider_ID}`];
      if (!accountId) {
        console.log(`  ⚠ QAIM trader not found: ID=${t.Trider_ID}`);
        continue;
      }
      const driverId = await getOrCreateDriver(t.Driver_Name);
      const vehicleId = await getOrCreateVehicle(t.Car_Number);
      const goodTypeId = findGoodsId(t.Good_Type_QAIM);
      const direction = directionFromType(t.Tran_Type_ID);
      
      await conn.query(
        `INSERT INTO transactions (ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id, 
         good_type_id, weight, qty, cost_usd, amount_usd, cost_iqd, amount_iqd, company_name, notes, trader_note, 
         record_type, port_id, account_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanStr(t.Ref_No_QAIM), direction, parseDate(t.Tran_Date), accountId,
          currencyStr(t.Currency_ID), driverId, vehicleId, goodTypeId,
          num(t.Weight) || null, num(t.Qty) || null,
          num(t.Cost_USD), num(t.Amount_USD), num(t.Cost_IQD), num(t.Amount_IQD),
          cleanStr(t.Company_Name), cleanStr(t.Note), cleanStr(t.Trider_Note),
          t.Tran_Type_ID === 1 ? 'shipment' : 'payment',
          'port-3', 'تاجر'
        ]
      );
      qaimCount++;
    }
    console.log(`  ✅ ${qaimCount} QAIM transactions imported`);

    // ============================================================
    // STEP 9: Import Transport Transactions
    // ============================================================
    console.log('\n📋 Importing transport transactions...');
    const transTrans = loadJson('Tbl_TRANS_Trans.json');
    let transCount = 0;
    for (const t of transTrans) {
      const carrierId = accountIdMap[`TRANS-${t.Carrier_ID}`];
      if (!carrierId) {
        console.log(`  ⚠ Carrier not found: ID=${t.Carrier_ID}`);
        continue;
      }
      // For transport, the Trider_ID refers to the QAIM trader who owns the goods
      const traderId = accountIdMap[`QAIM-${t.Trider_ID}`];
      const goodTypeId = findGoodsId(t.Good_Type);
      const govId = findGovId(t.Goverment_Name);
      const direction = directionFromType(t.Tran_Type_ID);
      
      await conn.query(
        `INSERT INTO transactions (ref_no, direction, trans_date, account_id, currency, 
         good_type_id, amount_usd, amount_iqd, car_qty, gov_id, notes, carrier_id, trans_price,
         record_type, port_id, account_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanStr(t.Ref_No_TRANS), direction, parseDate(t.Tran_Date), carrierId,
          currencyStr(t.Currency_ID), goodTypeId,
          num(t.Amount_USD), num(t.Amount_IQD), num(t.Car_Qty) || null,
          govId, cleanStr(t.Note), traderId, num(t.Trans_Price) || null,
          t.Tran_Type_ID === 1 ? 'shipment' : 'payment',
          'transport-1', 'نقل'
        ]
      );
      transCount++;
    }
    console.log(`  ✅ ${transCount} transport transactions imported`);

    // ============================================================
    // STEP 10: Import Partnership (SHR) Transactions
    // ============================================================
    console.log('\n📋 Importing partnership transactions...');
    const shrTrans = loadJson('Tbl_SHR_Trans.json');
    let shrCount = 0;
    for (const t of shrTrans) {
      const accountId = accountIdMap[`SHR-${t.SHR_ID || 1}`];
      if (!accountId) {
        console.log(`  ⚠ SHR account not found: ID=${t.SHR_ID}`);
        continue;
      }
      const driverId = await getOrCreateDriver(t.Driver_Name);
      const vehicleId = await getOrCreateVehicle(t.Car_Number);
      const goodTypeId = findGoodsId(t.Good_Type);
      
      await conn.query(
        `INSERT INTO transactions (ref_no, direction, trans_date, account_id, currency, driver_id, vehicle_id, 
         good_type_id, weight, meters, cost_usd, amount_usd, cost_iqd, amount_iqd, notes, trader_note, 
         record_type, port_id, account_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanStr(t.Ref_No), t.Tran_Type_ID === 1 ? 'IN' : 'OUT', parseDate(t.Tran_Date), accountId,
          currencyStr(t.Currency_ID || 2), driverId, vehicleId, goodTypeId,
          num(t.Weight) || null, num(t.Meters) || null,
          num(t.Cost_USD), num(t.Amount_USD), num(t.Cost_IQD), num(t.Amount_IQD),
          cleanStr(t.Note), cleanStr(t.Trider_Note),
          'shipment', 'partnership-1', 'شراكة'
        ]
      );
      shrCount++;
    }
    console.log(`  ✅ ${shrCount} partnership transactions imported`);

    // ============================================================
    // STEP 11: Import Debts
    // ============================================================
    console.log('\n💳 Importing debts...');
    
    // Haider debts (special account with detailed shipment data)
    const haiderDebts = loadJson('Tbl_Depet_Haider.json');
    for (const d of haiderDebts) {
      await conn.query(
        `INSERT INTO debts (debtorName, amountUSD, amountIQD, driverName, carNumber, goodType, weight, meters, date, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'حيدر', num(d.Amount_USD), num(d.Amount_IQD),
          cleanStr(d.Driver_Name), cleanStr(d.Car_Number), cleanStr(d.Good_Type),
          num(d.Weight) || null, num(d.Meters) || null,
          parseDate(d.Trans_Date), cleanStr(d.Trider_Note)
        ]
      );
    }
    console.log(`  ✅ ${haiderDebts.length} Haider debts`);

    // Basim debts
    const basimDebts = loadJson('Tbl_Depet_Basim.json');
    for (const d of basimDebts) {
      await conn.query(
        `INSERT INTO debts (debtorName, amountUSD, amountIQD, feeUSD, feeIQD, transType, date, description, fxRate, state) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'باسم الجميلي', num(d.Amount_USD), num(d.Amount_IQD),
          num(d.FEE_USD), num(d.FEE_IQD), cleanStr(d.Trans_Type),
          parseDate(d.D_B_Date), cleanStr(d.Notes), num(d.FX_RATE) || null, cleanStr(d.State)
        ]
      );
    }
    console.log(`  ✅ ${basimDebts.length} Basim debts`);

    // Noman debts
    const nomanDebts = loadJson('Tbl_Depet_Noman.json');
    for (const d of nomanDebts) {
      await conn.query(
        `INSERT INTO debts (debtorName, amountUSD, amountIQD, feeUSD, feeIQD, transType, date, description, fxRate, state) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'نعمان', num(d.Amount_USD), num(d.Amount_IQD),
          num(d.FEE_USD), num(d.FEE_IQD), cleanStr(d.Trans_Type),
          parseDate(d.D_N_Date), cleanStr(d.Notes), num(d.FX_RATE) || null, cleanStr(d.State)
        ]
      );
    }
    console.log(`  ✅ ${nomanDebts.length} Noman debts`);

    // Luay2 debts
    const luayDebts = loadJson('Tbl_Depet_Luay2.json');
    for (const d of luayDebts) {
      await conn.query(
        `INSERT INTO debts (debtorName, amountUSD, amountIQD, transType, date, description, fxRate, fxNote) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'لؤي', num(d.Amount_USD), num(d.Amount_IQD),
          cleanStr(d.Trans_Type), parseDate(d.D_L2_Date), cleanStr(d.Notes),
          num(d.FX_RATE) || null, cleanStr(d.FX_NOTE)
        ]
      );
    }
    console.log(`  ✅ ${luayDebts.length} Luay debts`);

    // ============================================================
    // STEP 12: Import Special Accounts (Yaser & Adb Alkarem)
    // ============================================================
    console.log('\n⭐ Importing special accounts...');
    
    // SP_Yaser transactions
    const yaserTrans = loadJson('Tbl_SP_Yaser_Trans.json');
    for (const t of yaserTrans) {
      await conn.query(
        `INSERT INTO special_accounts (type, name, amountUSD, amountIQD, description, date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'yaser',
          cleanStr(t.Trider_Name) || 'ياسر',
          num(t.Amount_USD),
          0,
          [cleanStr(t.Note), cleanStr(t.Gov), cleanStr(t.Goog_Type), 
           t.Qty ? `كمية: ${t.Qty}` : null,
           cleanStr(t.Driver_Name) ? `سائق: ${cleanStr(t.Driver_Name)}` : null,
           cleanStr(t.Car_Number) ? `سيارة: ${cleanStr(t.Car_Number)}` : null,
           cleanStr(t.Port_Name) ? `منفذ: ${cleanStr(t.Port_Name)}` : null,
           t.CLR ? `CLR: ${t.CLR}` : null,
           t.SUP ? `SUP: ${t.SUP}` : null,
           t.Diff ? `Diff: ${t.Diff}` : null,
           t.TX ? `TX: ${t.TX}` : null,
           t.Amount_USD_Ya ? `مبلغ ياسر: ${t.Amount_USD_Ya}` : null
          ].filter(Boolean).join(' | '),
          parseDate(t.Trans_Date)
        ]
      );
    }
    console.log(`  ✅ ${yaserTrans.length} Yaser special transactions`);

    // Adb Alkarem transactions
    const abkTrans = loadJson('Tbl_Adb_Alkarem_Trans.json');
    for (const t of abkTrans) {
      await conn.query(
        `INSERT INTO special_accounts (type, name, amountUSD, amountIQD, description, date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'abd_alkarem',
          cleanStr(t.Trider_Name) || 'عبد الكريم',
          num(t.Amount_USD),
          num(t.Amount_IQD),
          [cleanStr(t.Note), cleanStr(t.Good_Type),
           cleanStr(t.Port_Name) ? `منفذ: ${cleanStr(t.Port_Name)}` : null,
           t.Qty ? `كمية: ${t.Qty}` : null,
           cleanStr(t.Driver_Name) ? `سائق: ${cleanStr(t.Driver_Name)}` : null,
           cleanStr(t.Car_Number) ? `سيارة: ${cleanStr(t.Car_Number)}` : null
          ].filter(Boolean).join(' | '),
          parseDate(t.Tran_Date)
        ]
      );
    }
    console.log(`  ✅ ${abkTrans.length} Abd Alkarem special transactions`);

    // ============================================================
    // FINAL: Summary
    // ============================================================
    console.log('\n📊 Import Summary:');
    const tables = ['accounts', 'transactions', 'debts', 'special_accounts', 'goods_types', 'governorates', 'drivers', 'vehicles', 'cash_state'];
    for (const t of tables) {
      const [rows] = await conn.query(`SELECT COUNT(*) as cnt FROM ${t}`);
      console.log(`  ${t}: ${rows[0].cnt} records`);
    }

    console.log('\n✅ Import completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    await conn.end();
  }
}

main();
