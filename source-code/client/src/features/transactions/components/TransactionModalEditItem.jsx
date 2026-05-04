import AutocompleteInput from "../../../components/AutocompleteInput";
import {
  evaluateCustomFormula,
  sanitizeCustomFieldValue,
} from "../../../utils/customFields";
import { normalizeStringOptions } from "../../../utils/optionLists";
import {
  formatTransactionModalNumber,
  TRANSACTION_MODAL_BUILT_IN_FIELD_FALLBACKS,
  TRANSACTION_MODAL_BUILT_IN_FIELD_PLACEHOLDERS,
} from "../../../utils/transactionModalConfig";

function FieldShell({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}

function BuiltInAutocompleteField({
  label,
  value,
  options,
  labelKey,
  valueKey,
  onChange,
  onSelect,
  onAddNew,
  placeholder,
}) {
  return (
    <FieldShell label={label}>
      <AutocompleteInput
        value={value}
        options={options}
        labelKey={labelKey}
        valueKey={valueKey}
        onChange={onChange}
        onSelect={onSelect}
        onAddNew={onAddNew}
        dropdownSide="top"
        placeholder={placeholder}
        className="input-field"
      />
    </FieldShell>
  );
}

function placeholderFor(fieldKey, fallbackLabel) {
  return (
    TRANSACTION_MODAL_BUILT_IN_FIELD_PLACEHOLDERS[fieldKey] ||
    fallbackLabel ||
    ""
  );
}

function renderCustomFieldInput(field, editForm, setEditForm) {
  const value = editForm[field.fieldKey] ?? "";

  if (field.fieldType === "select") {
    return (
      <select
        value={value}
        onChange={event =>
          setEditForm(current => ({
            ...current,
            [field.fieldKey]: event.target.value,
          }))
        }
        className="input-field"
      >
        <option value="">اختر قيمة...</option>
        {normalizeStringOptions(field.options).map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  const isNumericField =
    field.fieldType === "number" || field.fieldType === "money";
  return (
    <input
      type={isNumericField ? "number" : "text"}
      step={field.fieldType === "money" ? "0.01" : "any"}
      value={value}
      onChange={event =>
        setEditForm(current => ({
          ...current,
          [field.fieldKey]: sanitizeCustomFieldValue(field, event.target.value),
        }))
      }
      className="input-field"
    />
  );
}

export default function TransactionModalEditItem({
  item,
  editForm,
  setEditForm,
  setField,
  setNumericField,
  traderText,
  setTraderText,
  localAccounts,
  driversOptions,
  vehiclesOptions,
  goodsOptions,
  govOptions,
  companyOptions,
  getBuiltInFieldLabel,
  onAddAccount,
}) {
  if (item.kind === "custom") {
    return (
      <FieldShell key={item.key} label={item.field.label}>
        {renderCustomFieldInput(item.field, editForm, setEditForm)}
      </FieldShell>
    );
  }

  if (item.kind === "formula") {
    const result = evaluateCustomFormula(item.field.formula, editForm);
    return (
      <div
        key={item.key}
        className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5"
      >
        <span className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-400">
          {item.field.label}
        </span>
        <p
          className={`font-semibold ${result === null ? "text-slate-400" : result < 0 ? "text-red-600" : "text-emerald-600"}`}
        >
          {result === null
            ? "-"
            : formatTransactionModalNumber(Math.round(result * 100) / 100)}
        </p>
      </div>
    );
  }

  if (item.kind !== "builtIn") {
    return null;
  }

  const fieldKey = item.field.key;
  const label = getBuiltInFieldLabel(
    fieldKey,
    TRANSACTION_MODAL_BUILT_IN_FIELD_FALLBACKS[fieldKey] || fieldKey
  );

  switch (fieldKey) {
    case "ref_no":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="text"
            value={editForm.RefNo || ""}
            onChange={event => setField("RefNo", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "trans_date":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="date"
            value={editForm.TransDate?.split(" ")[0] || ""}
            onChange={event => setField("TransDate", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "account_name":
      return (
        <BuiltInAutocompleteField
          key={fieldKey}
          label={label}
          value={
            traderText || editForm.AccountName || editForm.TraderName || ""
          }
          options={localAccounts}
          labelKey="AccountName"
          valueKey="AccountID"
          onChange={text => {
            setTraderText(text);
            setField("AccountID", null);
          }}
          onSelect={account => {
            setTraderText(account.AccountName);
            setEditForm(current => ({
              ...current,
              AccountID: account.AccountID,
              AccountName: account.AccountName,
            }));
          }}
          onAddNew={onAddAccount}
          placeholder={placeholderFor(fieldKey, "ابدأ بكتابة اسم التاجر...")}
        />
      );
    case "currency":
      return (
        <FieldShell key={fieldKey} label={label}>
          <select
            value={editForm.Currency || "USD"}
            onChange={event => setField("Currency", event.target.value)}
            className="input-field"
          >
            <option value="USD">دولار</option>
            <option value="IQD">دينار</option>
            <option value="BOTH">دولار ودينار</option>
          </select>
        </FieldShell>
      );
    case "driver_name":
      return (
        <BuiltInAutocompleteField
          key={fieldKey}
          label={label}
          value={editForm._driverText || ""}
          options={driversOptions}
          labelKey="DriverName"
          valueKey="DriverID"
          onChange={text => {
            setField("_driverText", text);
            setField("DriverID", null);
          }}
          onSelect={driver => {
            setField("_driverText", driver.DriverName);
            setField("DriverID", driver.DriverID);
          }}
          placeholder={placeholderFor(fieldKey, "اكتب اسم السائق...")}
        />
      );
    case "vehicle_plate":
      return (
        <BuiltInAutocompleteField
          key={fieldKey}
          label={label}
          value={editForm._vehicleText || ""}
          options={vehiclesOptions}
          labelKey="PlateNumber"
          valueKey="VehicleID"
          onChange={text => {
            setField("_vehicleText", text);
            setField("VehicleID", null);
          }}
          onSelect={vehicle => {
            setField("_vehicleText", vehicle.PlateNumber);
            setField("VehicleID", vehicle.VehicleID);
          }}
          onAddNew={text => {
            setField("_vehicleText", text);
            setField("VehicleID", null);
          }}
          addNewLabel="إضافة رقم سيارة جديد"
          placeholder={placeholderFor(fieldKey, "اكتب رقم السيارة...")}
        />
      );
    case "good_type":
      return (
        <BuiltInAutocompleteField
          key={fieldKey}
          label={label}
          value={editForm._goodText || ""}
          options={goodsOptions}
          labelKey="TypeName"
          valueKey="GoodTypeID"
          onChange={text => {
            setField("_goodText", text);
            setField("GoodTypeID", null);
          }}
          onSelect={good => {
            setField("_goodText", good.TypeName);
            setField("GoodTypeID", good.GoodTypeID);
          }}
          onAddNew={text => {
            setField("_goodText", text);
            setField("GoodTypeID", null);
          }}
          addNewLabel="إضافة نوع بضاعة جديد"
          placeholder={placeholderFor(fieldKey, "اكتب نوع البضاعة...")}
        />
      );
    case "gov_name":
      return (
        <BuiltInAutocompleteField
          key={fieldKey}
          label={label}
          value={editForm._govText || ""}
          options={govOptions}
          labelKey="GovName"
          valueKey="GovID"
          onChange={text => {
            setField("_govText", text);
            setField("GovID", null);
            setField("_newGovName", text);
          }}
          onSelect={gov => {
            setField("_govText", gov.GovName);
            setField("GovID", gov.GovID);
            setField("_newGovName", "");
          }}
          onAddNew={text => {
            setField("_govText", text);
            setField("GovID", null);
            setField("_newGovName", text);
          }}
          addNewLabel="إضافة محافظة جديدة"
          placeholder={placeholderFor(fieldKey, "اكتب اسم المحافظة...")}
        />
      );
    case "company_name":
      return (
        <BuiltInAutocompleteField
          key={fieldKey}
          label={label}
          value={editForm._companyText || ""}
          options={companyOptions}
          labelKey="CompanyName"
          valueKey="CompanyID"
          onChange={text => {
            setField("_companyText", text);
            setField("CompanyID", null);
          }}
          onSelect={company => {
            setField("_companyText", company.CompanyName);
            setField("CompanyID", company.CompanyID);
            setField("CompanyName", company.CompanyName);
          }}
          placeholder={placeholderFor(fieldKey, "اكتب اسم الشركة...")}
        />
      );
    case "carrier_name":
      return (
        <BuiltInAutocompleteField
          key={fieldKey}
          label={label}
          value={editForm._carrierText || ""}
          options={localAccounts}
          labelKey="AccountName"
          valueKey="AccountID"
          onChange={text => {
            setField("_carrierText", text);
            setField("CarrierID", null);
          }}
          onSelect={account => {
            setField("_carrierText", account.AccountName);
            setField("CarrierID", account.AccountID);
            setField("CarrierName", account.AccountName);
          }}
          onAddNew={
            onAddAccount
              ? async name => {
                  const created = await onAddAccount(name);
                  if (created) {
                    setField("_carrierText", created.AccountName);
                    setField("CarrierID", created.AccountID);
                    setField("CarrierName", created.AccountName);
                  }
                }
              : undefined
          }
          addNewLabel="إضافة ناقل جديد"
          placeholder={placeholderFor(fieldKey, "اكتب اسم الناقل...")}
        />
      );
    case "cost_usd":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="0.01"
            value={editForm.CostUSD ?? ""}
            onChange={event => setNumericField("CostUSD", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "amount_usd":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="0.01"
            value={editForm.AmountUSD ?? ""}
            onChange={event => setNumericField("AmountUSD", event.target.value)}
            className="input-field text-lg font-bold"
          />
        </FieldShell>
      );
    case "amount_iqd":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="any"
            value={editForm.AmountIQD ?? ""}
            onChange={event => setNumericField("AmountIQD", event.target.value)}
            className="input-field text-lg font-bold"
          />
        </FieldShell>
      );
    case "cost_iqd":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="any"
            value={editForm.CostIQD ?? ""}
            onChange={event => setNumericField("CostIQD", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "weight":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="any"
            value={editForm.Weight ?? ""}
            onChange={event => setNumericField("Weight", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "qty":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            value={editForm.Qty ?? ""}
            onChange={event =>
              setNumericField("Qty", event.target.value, value =>
                parseInt(value, 10)
              )
            }
            className="input-field"
          />
        </FieldShell>
      );
    case "meters":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="any"
            value={editForm.Meters ?? ""}
            onChange={event => setNumericField("Meters", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "fee_usd":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="0.01"
            value={editForm.FeeUSD ?? ""}
            onChange={event => setNumericField("FeeUSD", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "syr_cus":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="0.01"
            value={editForm.SyrCus ?? ""}
            onChange={event => setNumericField("SyrCus", event.target.value)}
            className="input-field"
          />
        </FieldShell>
      );
    case "car_qty":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            value={editForm.CarQty ?? ""}
            onChange={event =>
              setNumericField("CarQty", event.target.value, value =>
                parseInt(value, 10)
              )
            }
            className="input-field"
          />
        </FieldShell>
      );
    case "trans_price":
      return (
        <FieldShell key={fieldKey} label={label}>
          <input
            type="number"
            step="0.01"
            value={editForm.TransPrice ?? ""}
            onChange={event =>
              setNumericField("TransPrice", event.target.value)
            }
            className="input-field"
          />
        </FieldShell>
      );
    case "trader_note":
      return (
        <FieldShell key={fieldKey} label={label}>
          <textarea
            value={editForm.TraderNote || ""}
            onChange={event => setField("TraderNote", event.target.value)}
            className="input-field min-h-[110px] resize-y"
            rows="4"
          />
        </FieldShell>
      );
    case "notes":
      return (
        <FieldShell key={fieldKey} label={label}>
          <textarea
            value={editForm.Notes || ""}
            onChange={event => setField("Notes", event.target.value)}
            className="input-field min-h-[110px] resize-y"
            rows="4"
          />
        </FieldShell>
      );
    case "invoice_notes":
      return (
        <FieldShell key={fieldKey} label={label}>
          <textarea
            value={editForm.InvoiceNotes || ""}
            onChange={event => setField("InvoiceNotes", event.target.value)}
            className="input-field min-h-[110px] resize-y"
            rows="3"
            placeholder="ملاحظات تظهر فقط في الفاتورة المطبوعة..."
          />
        </FieldShell>
      );
    case "invoice_details":
      return (
        <FieldShell key={fieldKey} label={label}>
          <textarea
            value={editForm.InvoiceDetails || ""}
            onChange={event => setField("InvoiceDetails", event.target.value)}
            className="input-field min-h-[110px] resize-y"
            rows="3"
            placeholder="تفاصيل تظهر فقط في الفاتورة المطبوعة..."
          />
        </FieldShell>
      );
    default:
      return null;
  }
}
