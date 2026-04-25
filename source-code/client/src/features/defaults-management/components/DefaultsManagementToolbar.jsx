import { MapPin, Search, User } from "lucide-react";

const ACTIVE_TAB_CLASS =
  "bg-white/10 text-[#eef3f7] shadow-[0_14px_24px_rgba(0,0,0,0.16)] ring-1 ring-white/10";
const IDLE_TAB_CLASS =
  "bg-white/6 text-[#91a0ad] hover:bg-white/10 hover:text-[#eef3f7]";

export default function DefaultsManagementToolbar({
  sectionOptions,
  selectedSection,
  onSectionChange,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
}) {
  return (
    <section className="surface-card grid gap-4 p-5 lg:grid-cols-[220px_1fr_auto]">
      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[#91a0ad]">
          القسم
        </label>
        <select
          value={selectedSection}
          onChange={event => onSectionChange(event.target.value)}
          className="input-field"
        >
          {sectionOptions.map(section => (
            <option key={section.key} value={section.key}>
              {section.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-[13px] font-semibold text-[#91a0ad]">
          بحث داخل السجلات
        </label>
        <div className="relative">
          <Search
            size={15}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91a0ad]"
          />
          <input
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            className="input-field pr-9"
            placeholder="ابحث باسم التاجر أو المحافظة..."
          />
        </div>
      </div>

      <div className="flex items-end gap-2">
        <button
          onClick={() => onTabChange("account")}
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === "account" ? ACTIVE_TAB_CLASS : IDLE_TAB_CLASS}`}
        >
          <User size={16} />
          افتراضيات التاجر
        </button>
        <button
          onClick={() => onTabChange("route")}
          className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${activeTab === "route" ? ACTIVE_TAB_CLASS : IDLE_TAB_CLASS}`}
        >
          <MapPin size={16} />
          افتراضيات المسار
        </button>
      </div>
    </section>
  );
}
