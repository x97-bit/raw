import MainDashboardCard from './MainDashboardCard';

function getItemGridClass(count) {
  if (count <= 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
}

export default function MainDashboardGroupSection({ group, onNavigate, startIndex, sectionIndex }) {
  return (
    <section
      className="surface-card surface-card-hover rounded-[26px] p-4"
      style={{
        animation: 'sectionIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        animationDelay: `${sectionIndex * 50}ms`,
      }}
    >
      <div
        className="mb-3 rounded-[20px] px-3.5 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className="inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
            style={{
              background: `${group.accent}16`,
              color: group.accent,
            }}
          >
            {group.items.length} تبويب
          </span>

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: group.accent }} />
              <h2 className="text-[15px] font-black tracking-tight text-[#f4f8fb]">{group.title}</h2>
            </div>
            <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#8f9daa]">{group.subtitle}</p>
          </div>
        </div>
      </div>

      <div className={`grid gap-3 ${getItemGridClass(group.items.length)}`}>
        {group.items.map((item, itemIndex) => (
          <MainDashboardCard
            key={item.id}
            item={item}
            onClick={() => onNavigate(item.id)}
            index={startIndex + itemIndex}
          />
        ))}
      </div>
    </section>
  );
}
