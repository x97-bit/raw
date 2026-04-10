import { Check } from 'lucide-react';
import {
  USER_ACTION_PERMISSIONS,
  USER_SECTION_PERMISSIONS,
} from '../usersManagementConfig';

function PermissionOption({ permission, selected, tone, onToggle }) {
  const selectedClasses = tone === 'emerald'
    ? 'bg-emerald-50 text-emerald-800'
    : 'bg-accent-50 text-accent-800';
  const iconClasses = tone === 'emerald' ? 'bg-emerald-600' : 'bg-accent-600';
  const borderColor = tone === 'emerald'
    ? '1px solid rgba(39,171,131,0.15)'
    : '1px solid rgba(9,103,210,0.2)';

  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg p-2.5 text-sm transition-all ${selected ? selectedClasses : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
      style={{ border: selected ? borderColor : '1px solid rgba(0,0,0,0.04)' }}
    >
      <div
        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded transition-all ${selected ? iconClasses : 'border border-gray-300'}`}
      >
        {selected && <Check size={11} className="text-white" />}
      </div>
      <span className="text-xs font-semibold">{permission.label}</span>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggle(permission.key)}
        className="hidden"
      />
    </label>
  );
}

export default function UserPermissionsPanel({
  permissions,
  onToggle,
  onSelectAll,
  onClearAll,
}) {
  return (
    <div className="overflow-hidden rounded-xl" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ background: 'linear-gradient(135deg, #102a43, #243b53)' }}>
        <h3 className="text-sm font-bold text-white">{'الصلاحيات'}</h3>
        <div className="flex gap-1.5">
          <button
            onClick={onSelectAll}
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
          >
            {'تحديد الكل'}
          </button>
          <button
            onClick={onClearAll}
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
          >
            {'إلغاء الكل'}
          </button>
        </div>
      </div>

      <div className="border-b border-gray-100 p-4">
        <h4 className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">
          {'الأقسام المسموح الوصول إليها'}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {USER_SECTION_PERMISSIONS.map((permission) => (
            <PermissionOption
              key={permission.key}
              permission={permission}
              selected={permissions.includes(permission.key)}
              tone="accent"
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>

      <div className="p-4">
        <h4 className="mb-3 text-[11px] font-bold tracking-wide text-gray-400">
          {'العمليات المسموحة'}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {USER_ACTION_PERMISSIONS.map((permission) => (
            <PermissionOption
              key={permission.key}
              permission={permission}
              selected={permissions.includes(permission.key)}
              tone="emerald"
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
