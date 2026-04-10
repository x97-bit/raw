import { USER_ROLE_CONFIG } from '../usersManagementConfig';

export default function UserRoleCards({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(USER_ROLE_CONFIG).map(([key, config]) => {
        const Icon = config.icon;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 rounded-xl p-3 text-sm transition-all ${value === key ? 'bg-accent-50 ring-2 ring-accent-500/30' : 'bg-gray-50 hover:bg-gray-100'}`}
            style={{ border: value === key ? '1px solid rgba(9,103,210,0.2)' : '1px solid rgba(0,0,0,0.04)' }}
          >
            <Icon size={16} className={value === key ? 'text-accent-600' : 'text-gray-400'} />
            <div className="text-right">
              <p className="text-sm font-bold">{config.label}</p>
              <p className="text-[11px] text-gray-400">{config.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
