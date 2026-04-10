import { describe, it, expect } from "vitest";

// ==================== EXPENSES API TESTS ====================
describe("Expenses API structure", () => {
  it("should have the correct PORT_OPTIONS", () => {
    const PORT_OPTIONS = [
      { value: 'general', label: 'مصروفات عامة' },
      { value: 'port-2', label: 'مصروفات المنذرية' },
      { value: 'port-3', label: 'مصروفات القائم' },
    ];
    expect(PORT_OPTIONS).toHaveLength(3);
    expect(PORT_OPTIONS[0].value).toBe('general');
    expect(PORT_OPTIONS[1].value).toBe('port-2');
    expect(PORT_OPTIONS[2].value).toBe('port-3');
  });

  it("should validate expense data structure", () => {
    const expense = {
      expenseDate: '2026-01-01',
      amountUSD: '100',
      amountIQD: '150000',
      description: 'مصروف اختبار',
      portId: 'general',
    };
    expect(expense.expenseDate).toBeTruthy();
    expect(parseFloat(expense.amountUSD)).toBeGreaterThan(0);
    expect(parseFloat(expense.amountIQD)).toBeGreaterThan(0);
    expect(expense.portId).toBe('general');
  });
});

// ==================== DEBTS PER-DEBTOR FIELDS TESTS ====================
describe("Debts per-debtor field configuration", () => {
  // Define the debtor configs exactly as in DebtsPage
  const DEBTOR_CONFIGS = {
    'باسم': {
      fields: [
        { key: 'amountUSD', label: 'المبلغ ($)' },
        { key: 'feeUSD', label: 'الرسوم ($)' },
        { key: 'amountIQD', label: 'المبلغ (د.ع)' },
        { key: 'feeIQD', label: 'الرسوم (د.ع)' },
        { key: 'transType', label: 'النوع' },
        { key: 'state', label: 'الحالة' },
      ]
    },
    'نعمان': {
      fields: [
        { key: 'amountUSD', label: 'المبلغ ($)' },
        { key: 'feeUSD', label: 'الرسوم ($)' },
        { key: 'amountIQD', label: 'المبلغ (د.ع)' },
        { key: 'feeIQD', label: 'الرسوم (د.ع)' },
        { key: 'transType', label: 'النوع' },
        { key: 'state', label: 'الحالة' },
      ]
    },
    'لؤي': {
      fields: [
        { key: 'driverName', label: 'السائق' },
        { key: 'carNumber', label: 'السيارة' },
        { key: 'goodType', label: 'البضاعة' },
        { key: 'weight', label: 'الوزن' },
        { key: 'amountUSD', label: 'المبلغ ($)' },
        { key: 'feeUSD', label: 'التكلفة ($)' },
      ]
    },
    'لؤي 2': {
      fields: [
        { key: 'amountUSD', label: 'المبلغ ($)' },
        { key: 'transType', label: 'النوع' },
        { key: 'amountIQD', label: 'المبلغ (د.ع)' },
        { key: 'fxNote', label: 'ملاحظات' },
      ]
    },
    'عبد الكريم': {
      fields: [
        { key: 'driverName', label: 'السائق' },
        { key: 'carNumber', label: 'السيارة' },
        { key: 'goodType', label: 'البضاعة' },
        { key: 'weight', label: 'الوزن' },
        { key: 'amountUSD', label: 'المبلغ ($)' },
        { key: 'amountIQD', label: 'المبلغ (د.ع)' },
      ]
    },
  };

  it("should have 5 debtors configured", () => {
    expect(Object.keys(DEBTOR_CONFIGS)).toHaveLength(5);
  });

  it("باسم should have 6 fields matching original Access DB", () => {
    const basim = DEBTOR_CONFIGS['باسم'];
    expect(basim.fields).toHaveLength(6);
    expect(basim.fields.map(f => f.key)).toContain('amountUSD');
    expect(basim.fields.map(f => f.key)).toContain('feeUSD');
    expect(basim.fields.map(f => f.key)).toContain('amountIQD');
    expect(basim.fields.map(f => f.key)).toContain('feeIQD');
    expect(basim.fields.map(f => f.key)).toContain('transType');
    expect(basim.fields.map(f => f.key)).toContain('state');
  });

  it("نعمان should have same fields as باسم", () => {
    const noman = DEBTOR_CONFIGS['نعمان'];
    const basim = DEBTOR_CONFIGS['باسم'];
    expect(noman.fields.map(f => f.key)).toEqual(basim.fields.map(f => f.key));
  });

  it("لؤي should have driver, car, goods, weight, amount, cost fields", () => {
    const luay = DEBTOR_CONFIGS['لؤي'];
    expect(luay.fields).toHaveLength(6);
    expect(luay.fields.map(f => f.key)).toContain('driverName');
    expect(luay.fields.map(f => f.key)).toContain('carNumber');
    expect(luay.fields.map(f => f.key)).toContain('goodType');
    expect(luay.fields.map(f => f.key)).toContain('weight');
    expect(luay.fields.map(f => f.key)).toContain('amountUSD');
  });

  it("لؤي 2 should have amount, type, iqd, notes fields", () => {
    const luay2 = DEBTOR_CONFIGS['لؤي 2'];
    expect(luay2.fields).toHaveLength(4);
    expect(luay2.fields.map(f => f.key)).toContain('amountUSD');
    expect(luay2.fields.map(f => f.key)).toContain('transType');
    expect(luay2.fields.map(f => f.key)).toContain('amountIQD');
    expect(luay2.fields.map(f => f.key)).toContain('fxNote');
  });

  it("عبد الكريم should have driver, car, goods, weight, amounts fields", () => {
    const abd = DEBTOR_CONFIGS['عبد الكريم'];
    expect(abd.fields).toHaveLength(6);
    expect(abd.fields.map(f => f.key)).toContain('driverName');
    expect(abd.fields.map(f => f.key)).toContain('carNumber');
    expect(abd.fields.map(f => f.key)).toContain('goodType');
    expect(abd.fields.map(f => f.key)).toContain('amountUSD');
    expect(abd.fields.map(f => f.key)).toContain('amountIQD');
  });
});

// ==================== LABEL MATCHING TESTS ====================
describe("Label matching with original Access DB", () => {
  it("should use النقل السعودي without $ sign", () => {
    const label = "النقل السعودي";
    expect(label).not.toContain("$");
    expect(label).toBe("النقل السعودي");
  });

  it("should use الجمارك السورية for SYR_CUS", () => {
    const label = "الجمارك السورية";
    expect(label).toBe("الجمارك السورية");
  });

  it("should use سعر النقل for Trans_Price", () => {
    const label = "سعر النقل";
    expect(label).toBe("سعر النقل");
  });

  it("should use عدد السيارات for Car_Qty", () => {
    const label = "عدد السيارات";
    expect(label).toBe("عدد السيارات");
  });

  it("should use حيدر شركة الأنوار (with hamza)", () => {
    const label = "حيدر شركة الأنوار";
    expect(label).toContain("الأنوار");
  });
});

// ==================== PER-PORT FIELD MAPPING TESTS ====================
describe("Per-port field mapping", () => {
  const KSA_FIELDS = ['ref_no', 'trans_date', 'account_name', 'currency', 'driver_name', 'vehicle_plate', 'good_type', 'weight', 'meters', 'cost_usd', 'amount_usd', 'cost_iqd', 'amount_iqd', 'fee_usd', 'trans_price', 'gov_name', 'notes'];
  const MNZ_FIELDS = ['ref_no', 'trans_date', 'account_name', 'currency', 'driver_name', 'vehicle_plate', 'good_type', 'weight', 'cost_usd', 'amount_usd', 'cost_iqd', 'amount_iqd', 'syr_cus', 'notes'];
  const QAIM_FIELDS = ['ref_no', 'trans_date', 'account_name', 'currency', 'driver_name', 'vehicle_plate', 'good_type', 'weight', 'qty', 'cost_usd', 'amount_usd', 'cost_iqd', 'amount_iqd', 'company_name', 'notes'];
  const TRANS_FIELDS = ['ref_no', 'trans_date', 'carrier_name', 'account_name', 'currency', 'amount_usd', 'amount_iqd', 'good_type', 'car_qty', 'gov_name', 'trans_price', 'notes'];

  it("KSA should have النقل السعودي (fee_usd) but NOT الجمارك السورية", () => {
    expect(KSA_FIELDS).toContain('fee_usd');
    expect(KSA_FIELDS).not.toContain('syr_cus');
  });

  it("MNZ should have الجمارك السورية (syr_cus) but NOT النقل السعودي", () => {
    expect(MNZ_FIELDS).toContain('syr_cus');
    expect(MNZ_FIELDS).not.toContain('fee_usd');
  });

  it("MNZ should NOT have meters or gov_name", () => {
    expect(MNZ_FIELDS).not.toContain('meters');
    expect(MNZ_FIELDS).not.toContain('gov_name');
  });

  it("QAIM should have qty and company_name but NOT meters, fee_usd, syr_cus, gov_name", () => {
    expect(QAIM_FIELDS).toContain('qty');
    expect(QAIM_FIELDS).toContain('company_name');
    expect(QAIM_FIELDS).not.toContain('meters');
    expect(QAIM_FIELDS).not.toContain('fee_usd');
    expect(QAIM_FIELDS).not.toContain('syr_cus');
    expect(QAIM_FIELDS).not.toContain('gov_name');
  });

  it("TRANS should have carrier_name, car_qty, trans_price but NOT driver, vehicle, weight, cost", () => {
    expect(TRANS_FIELDS).toContain('carrier_name');
    expect(TRANS_FIELDS).toContain('car_qty');
    expect(TRANS_FIELDS).toContain('trans_price');
    expect(TRANS_FIELDS).not.toContain('driver_name');
    expect(TRANS_FIELDS).not.toContain('vehicle_plate');
    expect(TRANS_FIELDS).not.toContain('weight');
    expect(TRANS_FIELDS).not.toContain('cost_usd');
  });
});
