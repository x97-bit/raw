import { Plus } from "lucide-react";
import AutocompleteInput from "../../../components/AutocompleteInput";
import PageHeader from "../../../components/PageHeader";

export default function ReportsAddTraderView({
  activePort,
  allAccounts,
  traderForm,
  saving,
  onBack,
  onSave,
  onFieldChange,
}) {
  return (
    <div className="page-shell">
      <PageHeader
        title={`إضافة حساب - ${activePort?.name || ""}`}
        subtitle="التقارير"
        onBack={onBack}
      />

      <div className="mx-auto max-w-lg p-5">
        <div className="card border border-border shadow-sm space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
              اسم الحساب *
            </label>
            <AutocompleteInput
              value={traderForm.AccountName}
              options={allAccounts}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={text => onFieldChange("AccountName", text)}
              onSelect={account =>
                onFieldChange("AccountName", account.AccountName)
              }
              placeholder="ابدأ بكتابة اسم الحساب..."
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
              الهاتف
            </label>
            <input
              type="text"
              value={traderForm.Phone || ""}
              onChange={event => onFieldChange("Phone", event.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
              الشركة
            </label>
            <input
              type="text"
              value={traderForm.Company || ""}
              onChange={event => onFieldChange("Company", event.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <button
              onClick={onSave}
              disabled={saving}
              className="btn-primary flex flex-1 items-center justify-center gap-2"
            >
              <Plus size={18} /> {saving ? "جارِ الحفظ..." : "حفظ"}
            </button>
            <button onClick={onBack} className="btn-outline">
              رجوع
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
