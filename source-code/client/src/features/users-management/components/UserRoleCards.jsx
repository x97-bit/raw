import { USER_ROLE_CONFIG } from "../usersManagementConfig";

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
            className={`flex items-center gap-2 rounded-xl p-3 text-sm transition-all border ${value === key ? "bg-primary/10 border-primary ring-2 ring-primary/30" : "bg-secondary/20 border-border hover:bg-secondary/40"}`}
          >
            <Icon
              size={16}
              className={
                value === key ? "text-primary" : "text-muted-foreground"
              }
            />
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">
                {config.label}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {config.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
