import { RefreshCw } from 'lucide-react';

export default function DefaultsManagementListPanel({
  listTitle,
  listRows,
  loadingDefaults,
  emptyLabel,
  onReset,
  renderRow,
}) {
  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="text-right">
          <h2 className="text-sm font-bold text-slate-800">{listTitle}</h2>
          <p className="mt-1 text-xs text-slate-400">{listRows.length} {'سجل'}</p>
        </div>
        <button onClick={onReset} className="btn-outline flex items-center gap-2 text-xs">
          <RefreshCw size={14} />
          {'جديد'}
        </button>
      </div>

      <div className="max-h-[780px] overflow-y-auto">
        {loadingDefaults ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            {'جارٍ التحميل...'}
          </div>
        ) : (
          listRows.map(renderRow)
        )}

        {!loadingDefaults && listRows.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-slate-400">
            {emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}
