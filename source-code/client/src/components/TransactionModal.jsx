import { useMemo, useState } from 'react';
import { FileDown, Pencil, Save, Trash2, X } from 'lucide-react';
import { exportInvoicePDF } from '../utils/exportUtils';
import AutocompleteInput from './AutocompleteInput';
import {
  evaluateCustomFormula,
  formatCustomFieldDisplayValue,
  getInitialCustomFieldValues,
  isEditableCustomField,
  sanitizeCustomFieldValue,
} from '../utils/customFields';

const formatNum = (n) => (n ? Number(n).toLocaleString('en-US') : '0');

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-[1.25rem] border border-slate-200/80 bg-white/85 p-4 md:p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.05)]">
      {(title || subtitle) && (
        <div className="mb-4 border-b border-slate-100 pb-3">
          {title && <h3 className="text-sm font-bold text-primary-900">{title}</h3>}
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function DetailTile({ label, value, badge = false, type, bold = false, color }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 transition-colors hover:bg-slate-50">
      <span className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-400">{label}</span>
      {badge ? (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${type === 1 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {value}
        </span>
      ) : (
        <p className={`break-words font-semibold ${bold ? 'text-base' : 'text-sm'} ${color || 'text-slate-800'}`}>{value}</p>
      )}
    </div>
  );
}

export default function TransactionModal({ transaction, accounts, customFields = [], onClose, onUpdate, onDelete, readOnly = false }) {
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [traderText, setTraderText] = useState('');

  if (!transaction) return null;

  const transactionLabel = transaction.TransTypeName || (transaction.TransTypeID === 1 ? 'له' : 'عليه');
  const amountUsd = transaction.AmountUSD ? `$${formatNum(transaction.AmountUSD)}` : '-';
  const amountIqd = transaction.AmountIQD ? formatNum(transaction.AmountIQD) : '-';
  const costUsd = transaction.CostUSD ? `$${formatNum(transaction.CostUSD)}` : '-';
  const accentTone = transaction.TransTypeID === 1
    ? 'from-blue-50 via-white to-sky-50 border-blue-100/80 text-blue-800'
    : 'from-emerald-50 via-white to-teal-50 border-emerald-100/80 text-emerald-800';
  const editableCustomFields = useMemo(
    () => customFields.filter((field) => isEditableCustomField(field) && (field.placement || 'transaction') === 'transaction'),
    [customFields],
  );
  const formulaCustomFields = useMemo(
    () => customFields.filter((field) => field.fieldType === 'formula'),
    [customFields],
  );
  const customDetailItems = useMemo(() => {
    const detailFields = [...editableCustomFields, ...formulaCustomFields];
    return detailFields
      .map((field) => {
        const value = field.fieldType === 'formula'
          ? evaluateCustomFormula(field.formula, transaction)
          : transaction[field.fieldKey];
        if (value === undefined || value === null || value === '') return null;
        return {
          label: field.label,
          value: field.fieldType === 'formula'
            ? formatNum(Math.round(value * 100) / 100)
            : formatCustomFieldDisplayValue(field, value),
        };
      })
      .filter(Boolean);
  }, [editableCustomFields, formulaCustomFields, transaction]);

  const detailItems = useMemo(() => ([
    { label: 'التاريخ', value: transaction.TransDate?.split(' ')[0] },
    { label: 'نوع المعاملة', value: transactionLabel, badge: true, type: transaction.TransTypeID },
    { label: 'التاجر', value: transaction.AccountName || transaction.TraderName, bold: true },
    { label: 'رقم الوصل', value: transaction.RefNo },
    { label: 'المبلغ ($)', value: amountUsd, color: (transaction.AmountUSD || 0) < 0 ? 'text-red-600' : 'text-emerald-600', bold: true },
    { label: 'المبلغ بالدينار', value: amountIqd },
    { label: 'التكلفة ($)', value: costUsd },
    { label: 'التكلفة بالدينار', value: transaction.CostIQD ? formatNum(transaction.CostIQD) : '-' },
    { label: 'نوع البضاعة', value: transaction.GoodTypeName || transaction.GoodType || '-' },
    { label: 'الوزن', value: transaction.Weight ? formatNum(transaction.Weight) : '-' },
    { label: 'الكمية', value: transaction.Qty || '-' },
    { label: 'الأمتار', value: transaction.Meters || '-' },
    { label: 'اسم السائق', value: transaction.DriverName || '-' },
    { label: 'رقم السيارة', value: transaction.PlateNumber || transaction.VehiclePlate || '-' },
    { label: 'الجهة الحكومية', value: transaction.GovName || '-' },
    { label: 'المنفذ', value: transaction.PortName || '-' },
    ...(transaction.ProfitUSD && transaction.TransTypeID === 1 ? [{ label: 'الربح ($)', value: `$${formatNum(transaction.ProfitUSD)}`, color: (transaction.ProfitUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600', bold: true }] : []),
    ...(transaction.runningUSD !== undefined ? [{ label: 'الرصيد التراكمي ($)', value: `$${formatNum(transaction.runningUSD)}`, color: (transaction.runningUSD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600', bold: true }] : []),
    ...(transaction.runningIQD !== undefined ? [{ label: 'الرصيد التراكمي (د.ع)', value: formatNum(transaction.runningIQD), color: (transaction.runningIQD || 0) >= 0 ? 'text-emerald-600' : 'text-red-600', bold: true }] : []),
    ...(transaction.SyrCus ? [{ label: 'الجمارك السورية', value: `$${formatNum(transaction.SyrCus)}` }] : []),
    ...(transaction.CarQty ? [{ label: 'عدد السيارات', value: transaction.CarQty }] : []),
    ...(transaction.TransPrice ? [{ label: 'سعر الترانزيت', value: formatNum(transaction.TransPrice) }] : []),
    ...(transaction.CarrierName ? [{ label: 'اسم الناقل', value: transaction.CarrierName }] : []),
    ...(transaction.CompanyName ? [{ label: 'الشركة', value: transaction.CompanyName }] : []),
    ...customDetailItems,
  ]), [amountIqd, amountUsd, costUsd, customDetailItems, transaction, transactionLabel]);

  const handleUpdate = async () => {
    if (!onUpdate) return;
    setSaving(true);
    await onUpdate(editForm);
    setSaving(false);
    setEditMode(false);
  };

  const renderCustomFieldInput = (field) => {
    const value = editForm[field.fieldKey] ?? '';

    if (field.fieldType === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => setEditForm((form) => ({ ...form, [field.fieldKey]: e.target.value }))}
          className="input-field"
        >
          <option value="">اختر...</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    const isNumericField = field.fieldType === 'number' || field.fieldType === 'money';
    return (
      <input
        type={isNumericField ? 'number' : 'text'}
        step={field.fieldType === 'money' ? '0.01' : 'any'}
        value={value}
        onChange={(e) => setEditForm((form) => ({
          ...form,
          [field.fieldKey]: sanitizeCustomFieldValue(field, e.target.value),
        }))}
        className="input-field"
      />
    );
  };

  const handleDelete = () => {
    if (!onDelete) return;
    if (!confirm('هل أنت متأكد من حذف هذه المعاملة؟')) return;
    onDelete(transaction.TransID);
  };

  const handleExportPDF = () => {
    exportInvoicePDF({
      transaction,
      title: transaction.TransTypeID === 1 ? 'له' : 'عليه',
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.04),0_24px_80px_rgba(15,23,42,0.22)] animate-modal-in">
        <div className="max-h-[92vh] overflow-y-auto">
          <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
            <div className={`border-b border-white/50 bg-gradient-to-r ${accentTone} px-5 py-5 md:px-6`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className={`mb-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${transaction.TransTypeID === 1 ? 'border-blue-200 bg-white/80 text-blue-700' : 'border-emerald-200 bg-white/80 text-emerald-700'}`}>
                    {transactionLabel}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 md:text-xl">
                    {editMode ? 'تعديل المعاملة' : 'معاينة المعاملة'}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">{transaction.RefNo || 'بدون رقم'}</span>
                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">{transaction.TransDate?.split(' ')[0] || '-'}</span>
                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-slate-200/70">{transaction.AccountName || transaction.TraderName || '-'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  {!editMode && (
                    <>
                      <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-50"
                      >
                        <FileDown size={14} /> PDF
                      </button>
                      {!readOnly && onUpdate && (
                        <button
                          onClick={() => {
                            setEditForm({ ...getInitialCustomFieldValues(editableCustomFields), ...transaction });
                            setTraderText(transaction.AccountName || transaction.TraderName || '');
                            setEditMode(true);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-700 transition-all hover:bg-primary-50"
                        >
                          <Pencil size={14} /> تعديل
                        </button>
                      )}
                      {!readOnly && onDelete && (
                        <button
                          onClick={handleDelete}
                          className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition-all hover:bg-red-50"
                        >
                          <Trash2 size={14} /> حذف
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => {
                      setEditMode(false);
                      onClose();
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {editMode ? (
            <div className="p-5 md:p-6">
              <div className="space-y-5">
                <SectionCard title="المعلومات الأساسية" subtitle="حدّث أهم تفاصيل الحركة قبل الحفظ">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">التاريخ</label>
                      <input type="date" value={editForm.TransDate?.split(' ')[0] || ''} onChange={(e) => setEditForm((f) => ({ ...f, TransDate: e.target.value }))} className="input-field" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">التاجر</label>
                      <AutocompleteInput
                        value={traderText || editForm.AccountName || editForm.TraderName || ''}
                        options={accounts || []}
                        labelKey="AccountName"
                        valueKey="AccountID"
                        onChange={(text) => {
                          setTraderText(text);
                          setEditForm((f) => ({ ...f, AccountID: null }));
                        }}
                        onSelect={(acc) => {
                          setTraderText(acc.AccountName);
                          setEditForm((f) => ({ ...f, AccountID: acc.AccountID, AccountName: acc.AccountName }));
                        }}
                        placeholder="ابدأ بكتابة اسم التاجر..."
                        className="input-field"
                      />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="القيم المالية" subtitle="عدّل مبالغ الحركة الأساسية">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">المبلغ ($)</label>
                      <input type="number" step="0.01" value={editForm.AmountUSD || ''} onChange={(e) => setEditForm((f) => ({ ...f, AmountUSD: parseFloat(e.target.value) }))} className="input-field text-lg font-bold" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">المبلغ (د.ع)</label>
                      <input type="number" value={editForm.AmountIQD || ''} onChange={(e) => setEditForm((f) => ({ ...f, AmountIQD: parseFloat(e.target.value) }))} className="input-field text-lg font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">التكلفة ($)</label>
                      <input type="number" step="0.01" value={editForm.CostUSD || ''} onChange={(e) => setEditForm((f) => ({ ...f, CostUSD: parseFloat(e.target.value) }))} className="input-field" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">الوزن</label>
                      <input type="number" value={editForm.Weight || ''} onChange={(e) => setEditForm((f) => ({ ...f, Weight: parseFloat(e.target.value) }))} className="input-field" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">الكمية</label>
                      <input type="number" value={editForm.Qty || ''} onChange={(e) => setEditForm((f) => ({ ...f, Qty: parseInt(e.target.value) }))} className="input-field" />
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="ملاحظات" subtitle="أي ملاحظة مرتبطة بالحركة">
                  <textarea value={editForm.Notes || ''} onChange={(e) => setEditForm((f) => ({ ...f, Notes: e.target.value }))} className="input-field min-h-[110px] resize-y" rows="4" />
                </SectionCard>

                {(editableCustomFields.length > 0 || formulaCustomFields.length > 0) && (
                  <SectionCard title="حقول إضافية" subtitle="حقول مخصصة مرتبطة بهذه المعاملة">
                    {editableCustomFields.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {editableCustomFields.map((field) => (
                          <div key={field.fieldKey}>
                            <label className="mb-1.5 block text-[13px] font-semibold text-gray-600">{field.label}</label>
                            {renderCustomFieldInput(field)}
                          </div>
                        ))}
                      </div>
                    )}

                    {formulaCustomFields.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {formulaCustomFields.map((field) => {
                          const result = evaluateCustomFormula(field.formula, editForm);
                          return (
                            <div key={field.fieldKey} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                              <span className="mb-1 block text-[11px] font-semibold tracking-wide text-slate-400">{field.label}</span>
                              <p className={`font-semibold ${result === null ? 'text-slate-400' : result < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {result === null ? '-' : formatNum(Math.round(result * 100) / 100)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </SectionCard>
                )}

                <div className="rounded-[1.25rem] border border-slate-200/80 bg-slate-50/85 p-4 md:p-5">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button onClick={() => setEditMode(false)} className="btn-outline w-full sm:w-auto">إلغاء</button>
                    <button onClick={handleUpdate} disabled={saving} className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto">
                      <Save size={15} /> {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 md:p-6">
              <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
                  <span className="text-xs font-semibold text-slate-500">المبلغ بالدولار</span>
                  <p className={`mt-2 text-2xl font-bold ${(transaction.AmountUSD || 0) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{amountUsd}</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
                  <span className="text-xs font-semibold text-slate-500">المبلغ بالدينار</span>
                  <p className="mt-2 text-2xl font-bold text-slate-800">{amountIqd}</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.05)]">
                  <span className="text-xs font-semibold text-slate-500">التكلفة بالدولار</span>
                  <p className="mt-2 text-2xl font-bold text-slate-800">{costUsd}</p>
                </div>
              </div>

              <SectionCard title="تفاصيل المعاملة" subtitle="عرض كل المعلومات المرتبطة بهذه الحركة">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {detailItems.map((item, i) => (
                    <DetailTile key={i} {...item} />
                  ))}
                </div>
              </SectionCard>

              {(transaction.Notes || transaction.TraderNote || transaction.CustomsNote) && (
                <div className="mt-5 rounded-[1.25rem] border border-amber-200/80 bg-amber-50/80 p-4 md:p-5">
                  <span className="mb-2 block text-xs font-bold tracking-wide text-amber-700">ملاحظات</span>
                  {transaction.Notes && <p className="text-sm text-slate-700">{transaction.Notes}</p>}
                  {transaction.TraderNote && <p className="mt-2 text-sm text-slate-600">ملاحظة التاجر: {transaction.TraderNote}</p>}
                  {transaction.CustomsNote && <p className="mt-2 text-sm text-slate-600">ملاحظة الكمارك: {transaction.CustomsNote}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
