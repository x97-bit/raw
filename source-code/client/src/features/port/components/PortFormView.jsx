import { Save } from 'lucide-react';
import PageHeader from '../../../components/PageHeader';
import PortFormSection from './PortFormSection';

export default function PortFormView({
  formType,
  portName,
  sectionKey,
  onBack,
  onHome,
  message,
  orderedFormSections,
  renderOrderedFormItem,
  canManageDefaults,
  form,
  saving,
  savingAccountDefaults,
  savingRouteDefaults,
  onSaveAccountDefaults,
  onSaveRouteDefaults,
  onSave,
  portViewLabels,
}) {
  const isTransport = sectionKey === 'transport-1';
  const isInvoice = formType === 1;
  const isDebitNote = formType === 3;
  const labels = portViewLabels || {};
  const title = isDebitNote
    ? (labels.debitLabel || 'سند إضافة')
    : (isInvoice ? (labels.invoiceLabel || 'فاتورة') : (labels.paymentLabel || 'سند قبض'));
  const intro = isDebitNote
    ? (labels.debitIntro || 'تسجيل سند إضافة جديد')
    : (isInvoice ? (labels.invoiceIntro || 'تسجيل فاتورة جديدة') : (labels.paymentIntro || 'تسجيل سند قبض جديد'));
  const hint = isDebitNote
    ? (labels.debitHint || 'أدخل بيانات سند الإضافة لتحميل مبلغ جديد على ذمة التاجر.')
    : (isInvoice ? (labels.invoiceHint || 'أدخل تفاصيل الفاتورة بنفس الثيم الموحد للنظام.') : (labels.paymentHint || 'أدخل بيانات سند القبض بشكل واضح ومتناسق.'));

  return (
    <div className="page-shell">
      <PageHeader title={`${title} - ${portName}`} onBack={onBack} onHome={onHome} />

      <div className="mx-auto max-w-5xl p-5 md:p-6">
        {message && (
          <div className="mb-4 rounded-[1.15rem] bg-[#c697a1]/[0.12] px-4 py-3 text-[#f0d7dd] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ring-1 ring-[#c697a1]/[0.18]">
            {message}
          </div>
        )}

        <div className="surface-card overflow-visible p-4 md:p-5 lg:p-6">
          <div className="mb-5 rounded-[1.35rem] bg-gradient-to-l from-white/[0.06] via-white/[0.04] to-white/[0.02] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_32px_rgba(0,0,0,0.16)] ring-1 ring-white/[0.06] md:px-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#eef3f7]">{intro}</h2>
                <p className="mt-1 text-sm text-[#91a0ad]">{hint}</p>
              </div>
              <div
                className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                  isTransport
                    ? 'bg-[#c697a1]/[0.16] text-[#f4dde2] ring-[#c697a1]/[0.24]'
                    : isDebitNote
                      ? 'bg-[#d6b36b]/[0.18] text-[#f6e7c2] ring-[#d6b36b]/[0.24]'
                    : isInvoice
                      ? 'bg-[#9ab6ca]/[0.16] text-[#dce8f2] ring-[#9ab6ca]/[0.24]'
                      : 'bg-[#8eb8ad]/[0.16] text-[#d8ece6] ring-[#8eb8ad]/[0.24]'
                }`}
              >
                {title}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {orderedFormSections.map((section) => {
              const gridClass = section.items.length <= 2
                ? 'grid-cols-1 md:grid-cols-2'
                : section.items.length === 3
                  ? 'grid-cols-1 md:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

              return (
                <PortFormSection key={section.title} title={section.title} subtitle={section.subtitle}>
                  <div className={`grid gap-4 ${gridClass}`}>
                    {section.items.map((item) => renderOrderedFormItem(item))}
                  </div>
                </PortFormSection>
              );
            })}

            <div className="rounded-[1.35rem] bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(0,0,0,0.16)] ring-1 ring-white/[0.05] md:p-5">
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={onBack} className="btn-outline w-full sm:w-auto">رجوع</button>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
                  {canManageDefaults && (
                    <>
                      <button
                        onClick={onSaveAccountDefaults}
                        disabled={savingAccountDefaults || !form.AccountID}
                        className="btn-outline flex w-full items-center justify-center gap-2 sm:w-auto"
                      >
                        <Save size={16} />
                        {savingAccountDefaults ? 'جار حفظ افتراضيات التاجر...' : 'حفظ افتراضيات التاجر'}
                      </button>

                      <button
                        onClick={onSaveRouteDefaults}
                        disabled={savingRouteDefaults || !form.GovID}
                        className="btn-outline flex w-full items-center justify-center gap-2 sm:w-auto"
                      >
                        <Save size={16} />
                        {savingRouteDefaults ? 'جار حفظ افتراضيات المسار...' : 'حفظ افتراضيات المسار'}
                      </button>
                    </>
                  )}

                  <button onClick={onSave} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 px-8 text-lg sm:w-auto">
                    <Save size={20} />
                    {saving ? 'جار الحفظ...' : 'حفظ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
