import { Save } from "lucide-react";
import { useState, useEffect } from "react";
import AutocompleteInput from "../../../components/AutocompleteInput";
import PageHeader from "../../../components/PageHeader";

export default function ReportsEditTraderView({
  activePort,
  allAccounts,
  saving,
  onBack,
  onUpdate,
}) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");

  const [form, setForm] = useState({
    AccountName: "",
    Phone: "",
    Company: "",
  });

  const relevantAccounts = allAccounts.filter(
    (a) => String(a.DefaultPortID) === String(activePort?.id) || a.TypeID === (activePort?.id === "port-4" ? 3 : 1)
  );

  useEffect(() => {
    if (selectedAccountId) {
      const account = allAccounts.find(a => String(a.AccountID) === String(selectedAccountId));
      if (account) {
        setForm({
          AccountName: account.AccountName || "",
          Phone: account.Phone || "",
          Company: account.Company || account.Notes || "",
        });
      }
    } else {
      setForm({ AccountName: "", Phone: "", Company: "" });
    }
  }, [selectedAccountId, allAccounts]);

  const handleFieldChange = (field, value) => {
    setForm(current => ({ ...current, [field]: value }));
  };

  const handleUpdate = () => {
    if (!selectedAccountId) {
      window.alert("الرجاء تحديد الحساب المراد تعديله أولاً");
      return;
    }
    
    if (!form.AccountName.trim()) {
      window.alert("اسم الحساب مطلوب");
      return;
    }
    
    onUpdate(selectedAccountId, {
      AccountName: form.AccountName,
      Phone: form.Phone,
      Notes: form.Company, // Mapping company to notes, matching add behavior
    });
  };

  return (
    <div className="page-shell">
      <PageHeader
        title={`تعديل حساب - ${activePort?.name || ""}`}
        subtitle="التقارير"
        onBack={onBack}
      />

      <div className="mx-auto max-w-lg p-5">
        <div className="card border border-border shadow-sm space-y-4">
          <div className="pb-4 mb-2 border-b border-border">
            <label className="mb-1.5 block text-sm font-semibold text-utility-accent-text">
              اختر الحساب المراد تعديله
            </label>
            <AutocompleteInput
              value={selectedAccountName}
              options={relevantAccounts.length > 0 ? relevantAccounts : allAccounts}
              labelKey="AccountName"
              valueKey="AccountID"
              onChange={(text) => {
                setSelectedAccountName(text);
                if (!text.trim()) setSelectedAccountId("");
              }}
              onSelect={(account) => {
                setSelectedAccountName(account.AccountName);
                setSelectedAccountId(account.AccountID);
              }}
              placeholder="ابحث عن اسم الحساب..."
              className="input-field border-utility-accent-border ring-utility-accent-border"
            />
          </div>

          <div className={!selectedAccountId ? "opacity-50 pointer-events-none" : ""}>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
                  اسم الحساب الجديد *
                </label>
                <input
                  type="text"
                  value={form.AccountName}
                  onChange={event => handleFieldChange("AccountName", event.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
                  الهاتف
                </label>
                <input
                  type="text"
                  value={form.Phone}
                  onChange={event => handleFieldChange("Phone", event.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
                  الشركة / ملاحظات
                </label>
                <input
                  type="text"
                  value={form.Company}
                  onChange={event => handleFieldChange("Company", event.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-border pt-4 mt-4">
              <button
                onClick={handleUpdate}
                disabled={saving || !selectedAccountId}
                className="btn-primary flex flex-1 items-center justify-center gap-2"
              >
                <Save size={18} /> {saving ? "جارِ الحفظ..." : "حفظ التعديلات"}
              </button>
              <button onClick={onBack} className="btn-outline">
                رجوع
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
