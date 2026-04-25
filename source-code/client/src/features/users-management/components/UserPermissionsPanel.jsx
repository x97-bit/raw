import { Check } from "lucide-react";
import {
  USER_ACTION_PERMISSIONS,
  USER_SECTION_PERMISSIONS,
} from "../usersManagementConfig";

function PermissionOption({ permission, selected, tone, onToggle }) {
  const selectedClasses =
    tone === "emerald"
      ? "bg-success/10 text-success"
      : "bg-primary/10 text-primary";
  const iconClasses =
    tone === "emerald"
      ? "bg-success text-success-foreground"
      : "bg-primary text-primary-foreground";
  const borderColor =
    tone === "emerald" ? "border-success/30" : "border-primary/30";

  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-lg p-2.5 text-sm transition-all border ${selected ? `${selectedClasses} ${borderColor}` : "bg-secondary/20 text-muted-foreground border-border hover:bg-secondary/40"}`}
    >
      <div
        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded transition-all ${selected ? iconClasses : "border border-border bg-background"}`}
      >
        {selected && <Check size={11} />}
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
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b border-border">
        <h3 className="text-sm font-bold text-foreground">{"الصلاحيات"}</h3>
        <div className="flex gap-1.5">
          <button
            onClick={onSelectAll}
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all bg-secondary/40 text-foreground hover:bg-secondary/60"
          >
            {"تحديد الكل"}
          </button>
          <button
            onClick={onClearAll}
            className="rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all bg-secondary/40 text-foreground hover:bg-secondary/60"
          >
            {"إلغاء الكل"}
          </button>
        </div>
      </div>

      <div className="border-b border-border p-4">
        <h4 className="mb-3 text-[11px] font-bold tracking-wide text-muted-foreground">
          {"الأقسام المسموح الوصول إليها"}
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {USER_SECTION_PERMISSIONS.map(permission => (
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
        <h4 className="mb-3 text-[11px] font-bold tracking-wide text-muted-foreground">
          {"العمليات المسموحة"}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {USER_ACTION_PERMISSIONS.map(permission => (
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
