-- ============================================================
-- نظام الراوي - بيانات تجريبية (اختياري)
-- Al-Rawi System - Sample Data (Optional)
-- ============================================================
-- ⚠️ هذا الملف اختياري - يحتوي على بيانات تجريبية للاختبار
-- ⚠️ This file is OPTIONAL - contains sample data for testing
-- ============================================================

USE alrawi_db;

-- ============================================================
-- حسابات تجريبية
-- Sample Accounts
-- ============================================================
INSERT INTO `accounts` (`name`, `phone`, `accountType`, `portId`, `currency`, `notes`) VALUES
  ('أحمد التاجر', '07701234567', 'port-1', 'port-1', 'BOTH', 'تاجر رئيسي - منفذ السعودية'),
  ('محمد الناقل', '07709876543', 'transport', 'transport-1', 'USD', 'ناقل بضائع'),
  ('علي الصراف', '07705551234', 'fx', 'fx-1', 'BOTH', 'صراف عملات'),
  ('حسين التاجر', '07703334444', 'port-2', 'port-2', 'BOTH', 'تاجر - منفذ المنذرية'),
  ('كريم التاجر', '07702225555', 'port-3', 'port-3', 'IQD', 'تاجر - منفذ القائم');

-- ============================================================
-- سائقين تجريبيين
-- Sample Drivers
-- ============================================================
INSERT INTO `drivers` (`name`, `phone`) VALUES
  ('عباس السائق', '07706667777'),
  ('حيدر السائق', '07708889999'),
  ('مصطفى السائق', '07701112222');

-- ============================================================
-- مركبات تجريبية
-- Sample Vehicles
-- ============================================================
INSERT INTO `vehicles` (`plateNumber`) VALUES
  ('12345 بغداد'),
  ('67890 البصرة'),
  ('11111 أربيل');

-- ============================================================
-- معاملات تجريبية (فواتير ودفعات)
-- Sample Transactions (Invoices & Payments)
-- ============================================================

-- فاتورة 1: شحنة مواد غذائية
INSERT INTO `transactions` 
  (`ref_no`, `direction`, `trans_date`, `account_id`, `currency`, `driver_id`, `vehicle_id`, 
   `good_type_id`, `weight`, `qty`, `cost_usd`, `amount_usd`, `cost_iqd`, `amount_iqd`, 
   `fee_usd`, `record_type`, `port_id`, `account_type`, `notes`)
VALUES
  ('INV-001', 'IN', '2026-01-15', 1, 'BOTH', 1, 1, 1, 25.50, 100,
   1200.00, 1500.00, 1800000, 2250000, 50.00,
   'shipment', 'port-1', 'port-1', 'شحنة مواد غذائية من السعودية');

-- فاتورة 2: شحنة مواد بناء
INSERT INTO `transactions` 
  (`ref_no`, `direction`, `trans_date`, `account_id`, `currency`, `driver_id`, `vehicle_id`, 
   `good_type_id`, `weight`, `qty`, `cost_usd`, `amount_usd`, `cost_iqd`, `amount_iqd`, 
   `fee_usd`, `record_type`, `port_id`, `account_type`, `notes`)
VALUES
  ('INV-002', 'IN', '2026-01-20', 1, 'BOTH', 2, 2, 2, 50.00, 200,
   3000.00, 3800.00, 4500000, 5700000, 100.00,
   'shipment', 'port-1', 'port-1', 'شحنة مواد بناء');

-- دفعة 1: دفعة من أحمد التاجر
INSERT INTO `transactions` 
  (`ref_no`, `direction`, `trans_date`, `account_id`, `currency`,
   `amount_usd`, `amount_iqd`, `record_type`, `port_id`, `account_type`, `notes`)
VALUES
  ('PAY-001', 'OUT', '2026-02-01', 1, 'BOTH',
   2000.00, 3000000, 'payment', 'port-1', 'port-1', 'دفعة نقدية');

-- فاتورة 3: شحنة للمنذرية
INSERT INTO `transactions` 
  (`ref_no`, `direction`, `trans_date`, `account_id`, `currency`, `driver_id`, `vehicle_id`, 
   `good_type_id`, `weight`, `cost_usd`, `amount_usd`, `cost_iqd`, `amount_iqd`, 
   `record_type`, `port_id`, `account_type`, `notes`)
VALUES
  ('INV-003', 'IN', '2026-02-10', 4, 'BOTH', 3, 3, 4, 15.00,
   800.00, 1000.00, 1200000, 1500000,
   'shipment', 'port-2', 'port-2', 'شحنة قطع غيار');

-- فاتورة 4: شحنة نقل
INSERT INTO `transactions` 
  (`ref_no`, `direction`, `trans_date`, `account_id`, `currency`,
   `cost_usd`, `amount_usd`, `car_qty`, `trans_price`, `carrier_id`,
   `record_type`, `port_id`, `account_type`, `notes`)
VALUES
  ('INV-004', 'IN', '2026-02-15', 2, 'USD',
   500.00, 700.00, 3, 250000, 2,
   'shipment', 'transport-1', 'transport', 'نقل بضائع إلى بغداد');

-- ============================================================
-- مصروفات تجريبية
-- Sample Expenses
-- ============================================================
INSERT INTO `expenses` (`expense_date`, `amount_usd`, `amount_iqd`, `description`, `port_id`) VALUES
  ('2026-01-10', 150.00, 0, 'إيجار مكتب المنفذ', 'port-1'),
  ('2026-01-15', 0, 500000, 'مصاريف وقود', 'port-1'),
  ('2026-02-01', 200.00, 300000, 'صيانة معدات', 'port-2');

-- ============================================================
-- ديون تجريبية
-- Sample Debts
-- ============================================================
INSERT INTO `debts` (`debtorName`, `amountUSD`, `amountIQD`, `transType`, `description`, `date`, `status`, `state`) VALUES
  ('سعد المقاول', 5000.00, 0, 'مواد بناء', 'دين مقابل شحنة مواد بناء', '2026-01-20', 'pending', 'بغداد'),
  ('فاضل التاجر', 0, 3000000, 'مواد غذائية', 'دين مقابل بضاعة', '2026-02-05', 'partial', 'البصرة');

-- تحديث المبلغ المدفوع للدين الثاني
UPDATE `debts` SET `paidAmountIQD` = 1000000 WHERE `debtorName` = 'فاضل التاجر';

-- ============================================================
SELECT '✅ تم إدراج البيانات التجريبية بنجاح - Sample data inserted' AS status;
SELECT CONCAT(COUNT(*), ' حساب') AS accounts_count FROM `accounts`;
SELECT CONCAT(COUNT(*), ' معاملة') AS transactions_count FROM `transactions`;
SELECT CONCAT(COUNT(*), ' مصروف') AS expenses_count FROM `expenses`;
SELECT CONCAT(COUNT(*), ' دين') AS debts_count FROM `debts`;
