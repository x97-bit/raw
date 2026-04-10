import { Trash2 } from 'lucide-react';

export default function DefaultsListRow({ active, title, badges, onSelect, onDelete }) {
  return (
    <div className={`flex items-start justify-between gap-3 px-5 py-4 transition-colors ${active ? 'bg-primary-50/60' : 'hover:bg-slate-50'}`}>
      <button type="button" onClick={onSelect} className="flex-1 text-right">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        <div className="mt-2 flex flex-wrap justify-end gap-2 text-[11px] font-semibold text-slate-500">
          {badges.filter(Boolean).map((badge, index) => (
            <span key={`${badge}-${index}`} className="rounded-full bg-slate-100 px-2 py-1">{badge}</span>
          ))}
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-xl bg-red-50 p-2 text-red-600 transition-colors hover:bg-red-100"
        title={'حذف'}
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
