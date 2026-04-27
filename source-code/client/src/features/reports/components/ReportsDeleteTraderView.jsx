import { Trash2 } from "lucide-react";
import { useState } from "react";
import AutocompleteInput from "../../../components/AutocompleteInput";
import PageHeader from "../../../components/PageHeader";

export default function ReportsDeleteTraderView({
  activePort,
  allAccounts,
  saving,
  onBack,
  onDelete,
}) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedAccountName, setSelectedAccountName] = useState("");

  // Filter accounts by DefaultPortID to only show accounts relevant to this port
  // or show all if we can't determine
  const relevantAccounts = allAccounts.filter(
    (a) => String(a.DefaultPortID) === String(activePort?.id) || a.TypeID === (activePort?.id === "port-4" ? 3 : 1)
  );

  const handleDelete = () => {
    if (!selectedAccountId) {
      window.alert("الرجاء تحديد التاجر المراد حذفه أولاً");
      return;
    }
    
    if (window.confirm(`هل أنت متأكد من حذف حساب التاجر: ${selectedAccountName}؟\nتنبيه: لا يمكن التراجع عن هذا الإجراء.`)) {
      onDelete(selectedAccountId);
    }
  };

  return (
    <div className="page-shell">
      <PageHeader
        title={`حذف حساب - ${activePort?.name || ""}`}
        subtitle="التقارير"
        onBack={onBack}
      />

      <div className="mx-auto max-w-lg p-5">
        <div className="card border border-red-100 shadow-sm space-y-4">
          <div className="rounded-lg bg-red-50 p-4 mb-4">
            <h3 className="text-sm font-bold text-red-800 mb-1">منطقة الخطر</h3>
            <p className="text-xs text-red-600">
              استخدم هذه الواجهة لحذف حسابات التجار أو النواقل. يرجى الملاحظة أنه لا يمكن حذف حساب إذا كان لديه حركات مالية مسجلة في النظام.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-muted-foreground">
              اختر الحساب المراد حذفه *
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
              placeholder="ابحث عن اسم الحساب لحذفه..."
              className="input-field border-red-200 focus:border-red-400 focus:ring-red-400"
            />
          </div>

          <div className="flex gap-3 border-t border-border pt-4">
            <button
              onClick={handleDelete}
              disabled={saving || !selectedAccountId}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} /> {saving ? "جارِ الحذف..." : "حذف التاجر"}
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
