import AutocompleteInput from '../../../components/AutocompleteInput';
import { isAllowedTransportTraderName, isTransportSectionScope } from '../portPageHelpers';

const INPUT_CLASS = 'input-field';
const TEXTAREA_CLASS = 'input-field min-h-[112px] resize-y';
const LABEL_CLASS = 'mb-1 block text-sm font-medium text-[#b7c3ce]';

export default function PortBuiltInField({
  field,
  type,
  label,
  form,
  setField,
  setNumericField,
  traderText,
  setTraderText,
  accounts,
  setAccounts,
  accountType,
  portId,
  drivers,
  vehicles,
  goods,
  govs,
  companies,
  setCompanies,
  api,
  setMsg,
}) {
  const addAccount = async (name) => {
    if (
      isTransportSectionScope({ portId, accountType })
      && !isAllowedTransportTraderName(name)
    ) {
      setMsg('في النقل، التجار المعتمدون حاليًا هم: ابراهيم سعد، عبدالعزيز، صباح اسماعيل');
      return;
    }

    try {
      const newAcc = await api('/accounts', {
        method: 'POST',
        body: JSON.stringify({
          AccountName: name,
          AccountTypeID: accountType || 1,
          DefaultPortID: portId || null,
        }),
      });

      if (newAcc.existing) {
        setTraderText(name);
        setField('AccountID', newAcc.id);
        setMsg(`التاجر موجود مسبقًا، تم اختياره: ${name}`);
        return;
      }

      const newAccount = { AccountID: newAcc.id, AccountName: name };
      setAccounts((prev) => [...prev, newAccount]);
      setTraderText(name);
      setField('AccountID', newAcc.id);
      setMsg(`تم إضافة التاجر بنجاح: ${name}`);
    } catch (error) {
      console.error(error);
      setMsg('حدث خطأ أثناء إضافة التاجر');
    }
  };

  const addCompany = async (name) => {
    try {
      const newCompany = await api('/lookups/companies', {
        method: 'POST',
        body: JSON.stringify({ CompanyName: name }),
      });
      const companyRow = { CompanyID: newCompany.id, CompanyName: newCompany.CompanyName };
      setCompanies((prev) => (prev.some((item) => item.CompanyID === companyRow.CompanyID) ? prev : [...prev, companyRow]));
      setField('_companyText', companyRow.CompanyName);
      setField('CompanyID', companyRow.CompanyID);
      setField('CompanyName', companyRow.CompanyName);
    } catch (error) {
      console.error(error);
      setMsg('حدث خطأ أثناء إضافة الشركة');
    }
  };

  switch (field.key) {
    case 'ref_no':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="text"
            value={form.RefNo || ''}
            placeholder={
              isTransportSectionScope({ portId, accountType })
                ? (type === 1 ? 'سيولد رقم استحقاق النقل تلقائيًا' : 'سيولد رقم سند الدفع تلقائيًا')
                : (type === 1 ? 'سيولد رقم الفاتورة تلقائيًا' : 'سيولد رقم سند القبض تلقائيًا')
            }
            className={`${INPUT_CLASS} bg-white/[0.03] text-[#91a0ad] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]`}
            disabled
          />
        </div>
      );

    case 'trans_date':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label} *</label>
          <input
            type="date"
            value={form.TransDate || ''}
            onChange={(event) => setField('TransDate', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'account_name':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label} *</label>
          <AutocompleteInput
            value={traderText}
            options={accounts}
            labelKey="AccountName"
            valueKey="AccountID"
            dropdownSide="top"
            addNewLabel="إضافة تاجر جديد"
            onChange={(text) => {
              setTraderText(text);
              setField('AccountID', null);
            }}
            onSelect={(account) => {
              setTraderText(account.AccountName);
              setField('AccountID', account.AccountID);
            }}
            onAddNew={addAccount}
            placeholder="اكتب اسم التاجر..."
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'currency':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <select
            value={form.Currency || 'USD'}
            onChange={(event) => setField('Currency', event.target.value)}
            className={INPUT_CLASS}
          >
            <option value="USD">دولار</option>
            <option value="IQD">دينار</option>
            <option value="BOTH">دولار ودينار</option>
          </select>
        </div>
      );

    case 'driver_name':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <AutocompleteInput
            value={form._driverText || ''}
            options={drivers.map((driver) => ({ AccountID: driver.DriverID, AccountName: driver.DriverName }))}
            labelKey="AccountName"
            valueKey="AccountID"
            dropdownSide="top"
            onChange={(text) => {
              setField('_driverText', text);
              setField('DriverID', null);
              setField('_newDriverName', text);
            }}
            onSelect={(driver) => {
              setField('_driverText', driver.AccountName);
              setField('DriverID', driver.AccountID);
              setField('_newDriverName', '');
            }}
            placeholder="اكتب اسم السائق..."
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'vehicle_plate':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <AutocompleteInput
            value={form._vehicleText || ''}
            options={vehicles.map((vehicle) => ({ AccountID: vehicle.VehicleID, AccountName: vehicle.PlateNumber }))}
            labelKey="AccountName"
            valueKey="AccountID"
            dropdownSide="top"
            onChange={(text) => {
              setField('_vehicleText', text);
              setField('VehicleID', null);
              setField('_newPlateNumber', text);
            }}
            onSelect={(vehicle) => {
              setField('_vehicleText', vehicle.AccountName);
              setField('VehicleID', vehicle.AccountID);
              setField('_newPlateNumber', '');
            }}
            placeholder="اكتب رقم السيارة..."
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'good_type':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <AutocompleteInput
            value={form._goodText || ''}
            options={goods.map((good) => ({ AccountID: good.GoodTypeID, AccountName: good.TypeName }))}
            labelKey="AccountName"
            valueKey="AccountID"
            dropdownSide="top"
            onChange={(text) => {
              setField('_goodText', text);
              setField('GoodTypeID', null);
              setField('_newGoodType', text);
            }}
            onSelect={(good) => {
              setField('_goodText', good.AccountName);
              setField('GoodTypeID', good.AccountID);
              setField('_newGoodType', '');
            }}
            placeholder="اكتب نوع البضاعة..."
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'carrier_name':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <AutocompleteInput
            value={form._carrierText || ''}
            options={accounts}
            labelKey="AccountName"
            valueKey="AccountID"
            dropdownSide="top"
            onChange={(text) => {
              setField('_carrierText', text);
              setField('CarrierID', null);
            }}
            onSelect={(account) => {
              setField('_carrierText', account.AccountName);
              setField('CarrierID', account.AccountID);
            }}
            placeholder="اكتب اسم الناقل..."
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'gov_name':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <AutocompleteInput
            value={form._govText || ''}
            options={govs.map((gov) => ({ AccountID: gov.GovID, AccountName: gov.GovName }))}
            labelKey="AccountName"
            valueKey="AccountID"
            dropdownSide="top"
            onChange={(text) => {
              setField('_govText', text);
              setField('GovID', null);
            }}
            onSelect={(gov) => {
              setField('_govText', gov.AccountName);
              setField('GovID', gov.AccountID);
            }}
            placeholder="اكتب الجهة الحكومية أو المحافظة..."
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'weight':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            value={form.Weight || ''}
            onChange={(event) => setNumericField('Weight', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'meters':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            value={form.Meters || ''}
            onChange={(event) => setNumericField('Meters', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'qty':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            value={form.Qty || ''}
            onChange={(event) => setNumericField('Qty', event.target.value, parseInt)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'cost_usd':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            step="0.01"
            value={form.CostUSD || ''}
            onChange={(event) => setNumericField('CostUSD', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'cost_iqd':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            step="0.01"
            value={form.CostIQD || ''}
            onChange={(event) => setNumericField('CostIQD', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'amount_usd':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label} *</label>
          <input
            type="number"
            step="0.01"
            value={form.AmountUSD || ''}
            onChange={(event) => setNumericField('AmountUSD', event.target.value)}
            className={`${INPUT_CLASS} text-xl font-bold`}
          />
        </div>
      );

    case 'amount_iqd':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            step="0.01"
            value={form.AmountIQD || ''}
            onChange={(event) => setNumericField('AmountIQD', event.target.value)}
            className={`${INPUT_CLASS} text-xl font-bold`}
          />
        </div>
      );

    case 'fee_usd':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            step="0.01"
            value={form.FeeUSD || ''}
            onChange={(event) => setNumericField('FeeUSD', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'syr_cus':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            step="0.01"
            value={form.SyrCus || ''}
            onChange={(event) => setNumericField('SyrCus', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'car_qty':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            value={form.CarQty || ''}
            onChange={(event) => setNumericField('CarQty', event.target.value, parseInt)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'trans_price':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <input
            type="number"
            step="0.01"
            value={form.TransPrice || ''}
            onChange={(event) => setNumericField('TransPrice', event.target.value)}
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'company_name':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <AutocompleteInput
            value={form._companyText || form.CompanyName || ''}
            options={companies}
            labelKey="CompanyName"
            valueKey="CompanyID"
            dropdownSide="top"
            addNewLabel="إضافة شركة جديدة"
            onChange={(text) => {
              setField('_companyText', text);
              setField('CompanyID', null);
              setField('CompanyName', text);
            }}
            onSelect={(company) => {
              setField('_companyText', company.CompanyName);
              setField('CompanyID', company.CompanyID);
              setField('CompanyName', company.CompanyName);
            }}
            onAddNew={addCompany}
            placeholder="اكتب اسم الشركة..."
            className={INPUT_CLASS}
          />
        </div>
      );

    case 'trader_note':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <textarea
            value={form.TraderNote || ''}
            onChange={(event) => setField('TraderNote', event.target.value)}
            className={TEXTAREA_CLASS}
            rows="4"
          />
        </div>
      );

    case 'notes':
      return (
        <div key={field.key}>
          <label className={LABEL_CLASS}>{label}</label>
          <textarea
            value={form.Notes || ''}
            onChange={(event) => setField('Notes', event.target.value)}
            className={TEXTAREA_CLASS}
            rows="4"
          />
        </div>
      );

    default:
      return null;
  }
}
