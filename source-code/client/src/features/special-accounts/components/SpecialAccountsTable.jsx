import { fmtNum } from "../../../utils/formatNumber";
import { Pencil, Trash2, Search, ChevronRight, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { isSpecialHaiderSettlementRow } from "../../../utils/specialHaiderMath";
import {
  getAccountAccentLineStyle,
  getAccountCardOutlineStyle,
  getAccountEditButtonStyle,
  getAccountSettlementRowStyle,
  getAccountTableFooterStyle,
  getAccountTableHeaderStyle,
} from "../specialAccountsTheme";

export default function SpecialAccountsTable({
  account,
  accountId,
  visibleColumns,
  rows,
  canEdit,
  deletingId,
  derivedTotals,
  getFooterValue,
  onEdit,
  onDelete,
}) {
  const [columnFilters, setColumnFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

  // Reset page when filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [columnFilters, rows]);
  const surfaceStyle = getAccountCardOutlineStyle(account, "12");
  const accentLineStyle = getAccountAccentLineStyle(account);
  const headerStyle = getAccountTableHeaderStyle(account);
  const editButtonStyle = getAccountEditButtonStyle(account);
  const footerStyle = getAccountTableFooterStyle(account);
  
  const isDateColumn = column =>
    column?.format === "date" ||
    column?.key === "trans_date" ||
    column?.dataKey === "TransDate";

  const filteredRows = rows.filter(row => {
    if (row.isDailySummary) return true;
    for (const [key, value] of Object.entries(columnFilters)) {
      if (!value) continue;
      const term = value.toLowerCase();
      const col = visibleColumns.find(c => c.key === key);
      if (!col) continue;
      
      const rawVal = row[col.dataKey] || "";
      if (!String(rawVal).toLowerCase().includes(term)) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const hasActiveFilters = Object.values(columnFilters).some(Boolean);

  return (
    <div
      className="surface-card relative overflow-hidden p-0"
      style={surfaceStyle}
    >
      <div
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={accentLineStyle}
      />
      
      {hasActiveFilters && (
        <div className="flex justify-end p-2 bg-panel-border/10 border-b border-panel-border/30">
           <button
             onClick={() => setColumnFilters({})}
             className="text-xs text-utility-muted hover:text-utility-active transition-colors flex items-center gap-1 px-3 py-1 bg-utility-bg rounded-md"
           >
             مسح التصفية
           </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-right" style={headerStyle}>
              {visibleColumns.map(column => (
                <th
                  key={column.key}
                  className={`px-4 py-3 align-top ${isDateColumn(column) ? "whitespace-nowrap min-w-[110px] text-center" : ""}`}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="font-semibold">{column.label}</span>
                    <div className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors focus-within:bg-utility-bg focus-within:ring-1 focus-within:ring-utility-active ${columnFilters[column.key] ? 'ring-1 ring-utility-active bg-utility-bg' : 'bg-black/10 hover:bg-black/20'}`}>
                      <Search size={12} className={columnFilters[column.key] ? 'text-utility-active' : 'opacity-50'} />
                      {isDateColumn(column) ? (
                        <input
                          type="date"
                          value={columnFilters[column.key] || ""}
                          onChange={e => setColumnFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                          className="w-full min-w-[60px] bg-transparent text-[11px] font-normal outline-none cursor-pointer"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : (
                        <input
                          type="text"
                          value={columnFilters[column.key] || ""}
                          onChange={e => setColumnFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                          placeholder="تصفية..."
                          className="w-full min-w-[60px] bg-transparent text-[11px] font-normal outline-none placeholder:opacity-50"
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </div>
                </th>
              ))}
              {canEdit && (
                <th className="w-24 px-4 py-3 font-semibold align-top">إجراءات</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={(visibleColumns.length || 1) + (canEdit ? 1 : 0)}
                  className="py-12 text-center text-[#8f9daa]"
                >
                  لا توجد نتائج مطابقة.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                if (row.isDailySummary) {
                  return (
                    <tr
                      key={row.id || `summary-${index}`}
                      className="bg-[#d18e4b] text-white font-bold"
                    >
                      <td
                        colSpan={
                          (visibleColumns.length || 1) + (canEdit ? 1 : 0)
                        }
                        className="px-4 py-3 text-center shadow-inner"
                      >
                        <div className="flex items-center justify-center gap-12 text-[15px]">
                          <span>
                            المبلغ عليه :{" "}
                            {Number(
                              row.totals?.totalAmountUSD || 0
                            ).toLocaleString("en-US")}
                          </span>
                          <span>
                            المبلغ له :{" "}
                            {Number(
                              row.totals?.totalPartnerUSD || 0
                            ).toLocaleString("en-US")}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const isSettlement =
                  accountId === "haider" && isSpecialHaiderSettlementRow(row);
                const settlementStyle = isSettlement
                  ? getAccountSettlementRowStyle(account)
                  : undefined;

                return (
                  <tr
                    key={row.id || `${accountId}-${index}`}
                    className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.035]"
                    style={settlementStyle}
                  >
                    {visibleColumns.map(column => (
                      <td
                        key={column.key}
                        className={`px-4 py-3 text-[#e6edf4] ${column.isBold ? "font-bold text-[#f4f8fb]" : ""} ${column.isMedium ? "font-semibold" : ""} ${column.colorFn ? column.colorFn(row[column.dataKey]) : ""} ${column.isNotes ? "max-w-[220px] truncate text-xs text-[#91a0ad]" : ""} ${isDateColumn(column) ? "whitespace-nowrap min-w-[110px] text-center" : ""}`}
                      >
                        {column.render(row[column.dataKey], row)}
                      </td>
                    ))}
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onEdit(row)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                            style={editButtonStyle}
                            title="تعديل"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => onDelete(row)}
                            disabled={deletingId === row.id}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#d8a2a8] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                            style={{
                              background: "rgba(183,97,105,0.12)",
                              border: "1px solid rgba(183,97,105,0.2)",
                            }}
                            title="حذف"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
          {derivedTotals && filteredRows.length > 0 && (
            <tfoot>
              <tr
                className="border-t border-white/[0.08] font-bold"
                style={footerStyle}
              >
                {visibleColumns.map((column, index) => {
                  const footerValue = getFooterValue(column.key, derivedTotals);

                  if (footerValue !== undefined) {
                    return (
                      <td key={column.key} className="px-4 py-3 text-[#eef3f7]">
                        {footerValue}
                      </td>
                    );
                  }

                  if (index === 0) {
                    return (
                      <td key={column.key} className="px-4 py-3 text-[#eef3f7]">
                        المجموع
                      </td>
                    );
                  }

                  return <td key={column.key} className="px-4 py-3" />;
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-white/[0.05] bg-black/10 px-4 py-3 text-sm text-[#8f9daa]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <ChevronLeft size={16} /> التالي
            </button>
            <span className="font-semibold text-[#e6edf4]">
              صفحة {currentPage} من {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded bg-white/5 px-3 py-1.5 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              السابق <ChevronRight size={16} />
            </button>
          </div>
          <div>
            إجمالي السجلات: <span className="font-semibold text-[#e6edf4]">{filteredRows.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
