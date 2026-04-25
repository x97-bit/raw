import { Fragment, useState } from "react";
import { ChevronDown, User, Clock, Hash, Layers } from "lucide-react";
import EmptyTableRow from "../../../components/EmptyTableRow";
import {
  getAuditActionBadgeClass,
  getAuditActionLabel,
  getAuditEntityLabel,
} from "../auditLogsConfig";
import {
  formatAuditDateTime,
  parseAuditField,
  getAuditFieldLabel,
  formatAuditValue,
} from "../auditLogsHelpers";

function ChangesInline({ changes }) {
  const parsed = parseAuditField(changes);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Object.keys(parsed).length === 0
  ) {
    return <p className="text-sm text-panel-muted">لا توجد تغييرات تفصيلية.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-panel-border bg-panel shadow-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-panel-border/20 text-right">
            <th className="px-5 py-3 font-semibold text-panel-muted">الحقل</th>
            <th className="px-5 py-3 font-semibold text-panel-muted">
              القيمة السابقة
            </th>
            <th className="px-5 py-3 font-semibold text-panel-muted">
              القيمة الجديدة
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(parsed).map(([key, change]) => {
            const isBeforeAfter =
              change &&
              typeof change === "object" &&
              ("before" in change || "after" in change);
            return (
              <tr
                key={key}
                className="border-t border-panel-border transition-colors hover:bg-row-hover"
              >
                <td className="whitespace-nowrap px-5 py-3.5 font-bold text-panel-text">
                  {getAuditFieldLabel(key)}
                </td>
                {isBeforeAfter ? (
                  <>
                    <td className="px-5 py-3.5 text-danger-text line-through opacity-90">
                      {formatAuditValue(change.before)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-success-text">
                      {formatAuditValue(change.after)}
                    </td>
                  </>
                ) : (
                  <td colSpan={2} className="px-5 py-3.5 text-panel-text">
                    {formatAuditValue(change)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DataInline({ data }) {
  const parsed = parseAuditField(data);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    Object.keys(parsed).length === 0
  ) {
    return <p className="text-sm text-panel-muted">لا توجد بيانات.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(parsed).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 rounded-xl border border-panel-border bg-panel px-4 py-3 transition-colors hover:border-panel-border/60"
        >
          <span className="shrink-0 font-semibold text-panel-muted">
            {getAuditFieldLabel(key)}
          </span>
          <span
            className="truncate font-medium text-panel-text"
            title={String(formatAuditValue(value))}
          >
            {formatAuditValue(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h4 className="mb-4 border-r-[3px] border-primary pr-3 text-sm font-bold tracking-wide text-panel-text">
      {children}
    </h4>
  );
}

function ExpandedDetails({ row }) {
  const hasChanges =
    row.changes &&
    (typeof row.changes === "string"
      ? row.changes !== "{}" && row.changes !== "null"
      : Object.keys(row.changes || {}).length > 0);
  const hasBefore = row.beforeData;
  const hasAfter = row.afterData;
  const hasMeta = row.metadata;

  return (
    <div className="space-y-7 border-y border-panel-border bg-panel/30 px-5 py-7 shadow-inner sm:px-8">
      {hasChanges && (
        <section>
          <SectionTitle>الحقول التي تم تعديلها</SectionTitle>
          <ChangesInline changes={row.changes} />
        </section>
      )}

      {(hasBefore || hasAfter) && (
        <div className="grid gap-6 xl:grid-cols-2">
          {hasBefore && (
            <section>
              <SectionTitle>سجل البيانات (قبل التعديل)</SectionTitle>
              <DataInline data={row.beforeData} />
            </section>
          )}
          {hasAfter && (
            <section>
              <SectionTitle>سجل البيانات (بعد التعديل / الإضافة)</SectionTitle>
              <DataInline data={row.afterData} />
            </section>
          )}
        </div>
      )}

      {hasMeta && (
        <section>
          <SectionTitle>بيانات تعريفية إضافية (Metadata)</SectionTitle>
          <DataInline data={row.metadata} />
        </section>
      )}

      {!hasChanges && !hasBefore && !hasAfter && !hasMeta && (
        <p className="text-sm text-panel-muted">
          لا توجد تفاصيل إضافية مسجلة لهذه العملية.
        </p>
      )}
    </div>
  );
}

export default function AuditLogsTable({ rows }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggleRow = id => {
    setExpandedId(current => (current === id ? null : id));
  };

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-panel-border bg-panel shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel-border/20 text-right">
              <th className="w-12 px-3 py-4" />
              <th className="px-4 py-4 font-semibold text-panel-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={15} className="text-panel-muted" /> الوقت
                </span>
              </th>
              <th className="px-4 py-4 font-semibold text-panel-muted">
                <span className="inline-flex items-center gap-1.5">
                  <User size={15} className="text-panel-muted" /> المستخدم
                </span>
              </th>
              <th className="px-4 py-4 font-semibold text-panel-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Layers size={15} className="text-panel-muted" /> الكيان
                  المستهدف
                </span>
              </th>
              <th className="px-4 py-4 font-semibold text-panel-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Hash size={15} className="text-panel-muted" /> المعرف
                </span>
              </th>
              <th className="px-4 py-4 font-semibold text-panel-muted">
                نوع العملية
              </th>
              <th className="px-4 py-4 font-semibold text-panel-muted">
                وصف الملخص
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyTableRow
                colSpan={7}
                className="py-24 text-center text-lg"
                message="لا توجد سجلات مطابقة للفلاتر والبحث الحالي."
              />
            ) : (
              rows.map(row => {
                const isExpanded = expandedId === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr
                      onClick={() => toggleRow(row.id)}
                      className={`group cursor-pointer border-t border-panel-border transition-all hover:bg-row-hover ${
                        isExpanded ? "bg-row-hover" : ""
                      }`}
                    >
                      <td className="px-4 py-4 text-panel-muted transition-colors group-hover:text-primary">
                        <div
                          className={`transform transition-transform ${
                            isExpanded ? "rotate-180 text-primary" : ""
                          }`}
                        >
                          <ChevronDown size={18} />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-panel-text">
                        {formatAuditDateTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-4 font-bold text-panel-text">
                        {row.username || "-"}
                      </td>
                      <td className="px-4 py-4 font-medium text-panel-text">
                        {getAuditEntityLabel(row.entityType)}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs tracking-wider text-panel-muted">
                        {row.entityId || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold tracking-widest ${getAuditActionBadgeClass(row.action)} border border-panel-border shadow-sm`}
                        >
                          {getAuditActionLabel(row.action)}
                        </span>
                      </td>
                      <td className="min-w-[200px] px-4 py-4 leading-relaxed text-panel-text">
                        {row.summary || "-"}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <ExpandedDetails row={row} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
