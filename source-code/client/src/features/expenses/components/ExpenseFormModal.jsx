import { X } from "lucide-react";
import AutocompleteInput from "../../../components/AutocompleteInput";
import ModalPortal from "../../../components/ModalPortal";
import { EXPENSE_TARGET_OPTIONS, PORT_OPTIONS } from "../expensesConfig";

export default function ExpenseFormModal({
  accounts,
  form,
  editId,
  onClose,
  onSave,
  onChange,
}) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-3 sm:p-4"
        onMouseDown={event => event.target === event.currentTarget && onClose()}
      >
        <div
          className="animate-modal-in my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.15)] sm:max-h-[calc(100vh-2rem)]"
          onMouseDown={event => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-primary-900">
              {editId ? "تعديل مصروف" : "إضافة مصروف جديد"}
            </h2>
          </div>

          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  التاريخ
                </label>
                <input
                  type="date"
                  value={form.expenseDate || ""}
                  onChange={event =>
                    onChange("expenseDate", event.target.value)
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  القسم
                </label>
                <select
                  value={form.portId || "general"}
                  onChange={event => onChange("portId", event.target.value)}
                  className="input-field"
                >
                  {PORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  نوع التحميل
                </label>
                <select
                  value={form.chargeTarget || "port"}
                  onChange={event =>
                    onChange("chargeTarget", event.target.value)
                  }
                  className="input-field"
                >
                  {EXPENSE_TARGET_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  اسم التاجر
                </label>
                <AutocompleteInput
                  value={form.accountName || ""}
                  options={accounts}
                  labelKey="AccountName"
                  valueKey="AccountID"
                  onChange={text => {
                    onChange("accountName", text);
                    onChange("accountId", null);
                  }}
                  onSelect={account => {
                    onChange("accountName", account.AccountName);
                    onChange("accountId", account.AccountID);
                  }}
                  className="input-field"
                  placeholder="ابحث عن التاجر..."
                  disabled={(form.chargeTarget || "port") !== "trader"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  المبلغ ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.amountUSD || ""}
                  onChange={event => onChange("amountUSD", event.target.value)}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  المبلغ (د.ع)
                </label>
                <input
                  type="number"
                  step="any"
                  value={form.amountIQD || ""}
                  onChange={event => onChange("amountIQD", event.target.value)}
                  className="input-field"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                الوصف
              </label>
              <textarea
                value={form.description || ""}
                onChange={event => onChange("description", event.target.value)}
                className="input-field"
                rows="3"
                placeholder="وصف المصروف..."
              />
            </div>

            <div className="flex gap-3 border-t border-gray-100 pt-4">
              <button onClick={onSave} className="btn-primary flex-1">
                {editId ? "تحديث" : "حفظ"}
              </button>
              <button onClick={onClose} className="btn-outline">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
