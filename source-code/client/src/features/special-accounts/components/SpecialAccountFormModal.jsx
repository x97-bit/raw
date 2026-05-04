import { Save, X } from "lucide-react";
import ModalPortal from "../../../components/ModalPortal";
import SpecialAccountFormField from "./SpecialAccountFormField";
import { getAccountAccentLineStyle } from "../specialAccountsTheme";

export default function SpecialAccountFormModal({
  account,
  activeLabel,
  editingRecord,
  formFields,
  form,
  saving,
  isPaymentMode,
  onClose,
  onSave,
  onFormChange,
}) {
  const accentLineStyle = getAccountAccentLineStyle(account);

  const displayFields = isPaymentMode
    ? formFields
        .filter(f =>
          ["date", "notes", "amountUSD", "amountIQD"].includes(f.key)
        )
        .map(f => {
          if (f.key === "amountUSD")
            return { ...f, label: "مبلغ التسديد دولار ($)" };
          if (f.key === "amountIQD")
            return { ...f, label: "مبلغ التسديد دينار (ع.د)" };
          return f;
        })
    : formFields;

  const gridClass =
    displayFields.length <= 2
      ? "grid-cols-1 md:grid-cols-2"
      : displayFields.length <= 4
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5";

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/65 p-3 sm:p-4"
        onMouseDown={event => event.target === event.currentTarget && onClose()}
      >
        <div
          className="relative my-auto max-h-[calc(100vh-1.5rem)] w-full max-w-[1600px] overflow-y-auto rounded-[30px] border border-border bg-card shadow-2xl sm:max-h-[calc(100vh-2rem)]"
          onMouseDown={event => event.stopPropagation()}
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px opacity-70"
            style={accentLineStyle}
          />
          <div
            className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full blur-3xl opacity-20"
            style={{ background: account.accent }}
          />

          <div className="relative flex items-center justify-between border-b border-border px-6 py-5 lg:px-8">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/50 text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary hover:text-foreground"
            >
              <X size={18} />
            </button>
            <div className="text-right">
              <h2 className="text-lg font-black text-foreground">
                {isPaymentMode
                  ? "سند قبض / تسديد"
                  : editingRecord
                    ? "تعديل سجل"
                    : "إضافة سجل جديد"}
              </h2>
              <p
                className="mt-1 text-xs font-semibold"
                style={{ color: account.accent }}
              >
                {activeLabel}
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6 lg:px-8">
            <div className={`grid gap-4 ${gridClass}`}>
              {displayFields.map(field => (
                <SpecialAccountFormField
                  key={field.key}
                  field={field}
                  value={form[field.key]}
                  onChange={onFormChange}
                  accent={account.accent}
                />
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 z-10 border-t border-border bg-card/95 px-6 py-4 backdrop-blur-sm lg:px-8">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={onClose}
                className="btn-outline w-full px-5 py-3 sm:w-auto"
              >
                إلغاء
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-3 sm:w-auto"
                style={{
                  background: account.accent,
                  color: "#ffffff",
                }}
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-r-white" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>
                      {editingRecord ? "حفظ التعديلات" : "إضافة السجل"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
