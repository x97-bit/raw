import { useState, useMemo } from "react";
import { Search, Trash2 } from "lucide-react";
import ExportButtons from "../../../components/ExportButtons";
import PageHeader from "../../../components/PageHeader";
import PortAccountDateFilters from "./PortAccountDateFilters";
import PortSummaryCardsGrid from "./PortSummaryCardsGrid";
import { getPortStatementFooterCell } from "../portPageHelpers";

export default function PortStatementView({
  statement,
  portName,
  onBack,
  onHome,
  accounts,
  statementFilterAccountId,
  from,
  to,
  onAccountChange,
  onAddAccount,
  onDeleteAccount,
  onFromChange,
  onToChange,
  onReset,
  onRefresh,
  statementSummaryCards,
  statementSummaryGridClass,
  statementExportColumns,
  statementExportTemplates,
  selectedStatementTemplateId,
  onTemplateChange,
  sectionKey,
  activeStatementColumns,
  renderPortCell,
  onSelectTransaction,
  transactionModal,
  portViewLabels,
}) {
  const [localSearch, setLocalSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState({});
  const labels = portViewLabels || {};
  const statementTitle = `${labels.statementTitlePrefix || "كشف حساب"} - ${statement.account.AccountName}`;

  return (
    <div className="page-shell">
      <PageHeader
        title={statementTitle}
        subtitle={portName}
        onBack={onBack}
        onHome={onHome}
      >
        <div className="flex items-center gap-2">
          {statementFilterAccountId && onDeleteAccount && (
            <button
              onClick={() => onDeleteAccount(statementFilterAccountId)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/20 dark:hover:bg-red-900/40"
              title="حذف الحساب"
            >
              <Trash2 size={16} /> حذف الحساب
            </button>
          )}
          {statement.statement?.length > 0 && (
            <ExportButtons
              inHeader
              rows={statement.statement}
              columns={statementExportColumns}
              title={statementTitle}
              subtitle=""
              filename={`${labels.statementTitlePrefix || "كشف_حساب"}_${statement.account.AccountName}`}
              totalsRow={{
                AmountUSD: statement.totals?.balanceUSD,
                AmountIQD: statement.totals?.balanceIQD,
              }}
              templates={statementExportTemplates}
              selectedTemplateId={selectedStatementTemplateId}
              onTemplateChange={onTemplateChange}
              printStrategy="table"
              printContext={{
                accountName: statement.account.AccountName,
                fromDate: from,
                toDate: to,
                totals: statement.totals,
              }}
              sectionKey={sectionKey}
            />
          )}
        </div>
      </PageHeader>

      <div className="px-3 py-4 md:px-5 lg:px-6 xl:px-8 2xl:px-10">
        <div className="mb-5">
          <PortAccountDateFilters
            accounts={accounts}
            accountId={statementFilterAccountId}
            onAddAccount={onAddAccount}
            onDeleteAccount={onDeleteAccount}
            from={from}
            to={to}
            onAccountChange={onAccountChange}
            onFromChange={onFromChange}
            onToChange={onToChange}
            onReset={onReset}
            onStatement={onRefresh}
            statementDisabled={!statementFilterAccountId}
            resetLabel="مسح التواريخ"
            statementButtonLabel={
              labels.statementRefreshLabel || "تحديث كشف الحساب"
            }
          />
        </div>

        <PortSummaryCardsGrid
          cards={statementSummaryCards}
          className={statementSummaryGridClass}
        />

        <div className="surface-card overflow-hidden p-0">
          <div className="border-b border-panel-border p-3 md:p-4 bg-utility-soft-bg flex items-center justify-between">
            <div className="relative w-full md:w-1/3">
              <Search
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-utility-muted"
              />
              <input
                type="text"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="تصفية حسب التاجر أو الملاحظات..."
                className="input-field pr-10"
              />
              {(localSearch || Object.values(columnFilters).some(Boolean)) && (
                <button
                  onClick={() => {
                    setLocalSearch("");
                    setColumnFilters({});
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100"
                >
                  مسح
                </button>
              )}
            </div>
            <div className="text-sm font-medium text-utility-muted ml-2">
              تصفية الكشف
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full w-max text-sm lg:text-[0.95rem]">
              <thead>
                <tr className="bg-panel-border/20 border-b border-panel-border text-right">
                  {activeStatementColumns.map(column => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap px-3 py-3 text-panel-text align-top"
                    >
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[13px] font-semibold text-panel-text">{column.label}</span>
                        <div className={`flex items-center gap-1.5 rounded px-2 py-1 transition-colors focus-within:bg-utility-bg focus-within:ring-1 focus-within:ring-utility-active ${columnFilters[column.key] ? 'ring-1 ring-utility-active bg-utility-bg' : 'bg-panel-border/30 hover:bg-panel-border/50'}`}>
                          <Search size={12} className={columnFilters[column.key] ? 'text-utility-active' : 'text-utility-muted'} />
                          {column.key.toLowerCase() === "currency" || column.key === "TransTypeName" ? (
                            <select
                              value={columnFilters[column.key] || ""}
                              onChange={e => setColumnFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                              className="w-full min-w-[60px] bg-transparent text-[11px] font-normal text-panel-text outline-none cursor-pointer appearance-auto"
                              onClick={e => e.stopPropagation()}
                            >
                              <option value="">الكل</option>
                              {column.key.toLowerCase() === "currency" ? (
                                <>
                                  <option value="دولار">دولار</option>
                                  <option value="دينار">دينار</option>
                                  <option value="دولار ودينار">دولار ودينار</option>
                                </>
                              ) : (
                                <>
                                  <option value="قبض">سند قبض</option>
                                  <option value="فاتورة">فاتورة</option>
                                  <option value="إضافة">سند إضافة</option>
                                </>
                              )}
                            </select>
                          ) : column.key.toLowerCase() === "trans_date" || column.key === "TransDate" ? (
                            <input
                              type="date"
                              value={columnFilters[column.key] || ""}
                              onChange={e => setColumnFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                              className="w-full min-w-[60px] bg-transparent text-[11px] font-normal text-panel-text outline-none cursor-pointer"
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <input
                              type="text"
                              value={columnFilters[column.key] || ""}
                              onChange={e => setColumnFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                              placeholder="تصفية..."
                              className="w-full min-w-[60px] bg-transparent text-[11px] font-normal text-panel-text outline-none placeholder:text-utility-muted/70"
                              onClick={e => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {(statement.statement || [])
                  .filter(transaction => {
                    if (localSearch) {
                      const term = localSearch.toLowerCase();
                      const matchGlobal = String(transaction.TraderNote || "")
                        .toLowerCase()
                        .includes(term) ||
                      String(transaction.Notes || "")
                        .toLowerCase()
                        .includes(term) ||
                      String(transaction.RefNo || "")
                        .toLowerCase()
                        .includes(term);
                      if (!matchGlobal) return false;
                    }

                    for (const [key, value] of Object.entries(columnFilters)) {
                      if (!value) continue;
                      const term = value.toLowerCase();
                      
                      let rawVal = "";
                      const normalizedKey = key.toLowerCase();
                      
                      if (normalizedKey === "ref_no" || normalizedKey === "refno") rawVal = transaction.RefNo || transaction.ref_no;
                      else if (normalizedKey === "trans_type" || normalizedKey === "transtypename" || normalizedKey === "direction") {
                        const tn = String(transaction.TransTypeName || transaction.transTypeName || "");
                        const rt = String(transaction.RecordType || transaction.recordType || "");
                        rawVal = tn + " " + rt + (rt === "payment" ? " قبض دفع" : rt === "invoice" ? " فاتورة" : rt === "debit-note" ? " إضافة اضافة" : "");
                      }
                      else if (normalizedKey === "trans_date" || normalizedKey === "transdate") rawVal = transaction.TransDate || transaction.trans_date;
                      else if (normalizedKey === "currency") {
                        const cur = String(transaction.Currency || transaction.currency || "").toUpperCase();
                        rawVal = cur === "USD" ? "دولار" : cur === "IQD" ? "دينار" : cur === "BOTH" ? "دولار ودينار" : cur;
                      }
                      else if (normalizedKey === "driver_name" || normalizedKey === "drivername") rawVal = transaction.DriverName || transaction.driver_name;
                      else if (normalizedKey === "vehicle_plate" || normalizedKey === "vehicleplate") rawVal = transaction.VehiclePlate || transaction.vehicle_plate || transaction.CarNumber || transaction.car_number;
                      else if (normalizedKey === "good_type" || normalizedKey === "goodtypename") rawVal = transaction.GoodTypeName || transaction.goodTypeName;
                      else if (normalizedKey === "weight") rawVal = transaction.Weight || transaction.weight;
                      else if (normalizedKey === "meters") rawVal = transaction.Meters || transaction.meters;
                      else if (normalizedKey === "qty") rawVal = transaction.Qty || transaction.qty;
                      else if (normalizedKey === "cost_usd" || normalizedKey === "costusd") rawVal = transaction.CostUSD || transaction.costUsd;
                      else if (normalizedKey === "amount_usd" || normalizedKey === "amountusd") rawVal = transaction.AmountUSD || transaction.amountUsd;
                      else if (normalizedKey === "cost_iqd" || normalizedKey === "costiqd") rawVal = transaction.CostIQD || transaction.costIqd;
                      else if (normalizedKey === "amount_iqd" || normalizedKey === "amountiqd") rawVal = transaction.AmountIQD || transaction.amountIqd;
                      else if (normalizedKey === "notes") rawVal = transaction.Notes || transaction.notes;
                      else if (normalizedKey === "trader_note" || normalizedKey === "tradernote") rawVal = transaction.TraderNote || transaction.trader_note;
                      else rawVal = transaction[key] || "";

                      if (!String(rawVal || "").toLowerCase().includes(term)) {
                        return false;
                      }
                    }

                    return true;
                  })
                  .map((transaction, index) => {
                    let typeId = Number(
                      transaction.TransTypeID || transaction.transTypeId || 0
                    );
                    const rt = String(
                      transaction.RecordType || transaction.recordType || ""
                    ).toLowerCase();
                    const tn = String(
                      transaction.TransTypeName ||
                        transaction.transTypeName ||
                        ""
                    ).toLowerCase();

                    if (
                      rt === "invoice" ||
                      tn.includes("فاتورة") ||
                      tn.includes("استحقاق") ||
                      tn === "invoice"
                    )
                      typeId = 1;
                    else if (
                      rt === "payment" ||
                      tn.includes("قبض") ||
                      tn.includes("دفع") ||
                      tn === "payment"
                    )
                      typeId = 2;
                    else if (
                      rt === "debit-note" ||
                      tn.includes("إضافة") ||
                      tn.includes("اضافة")
                    )
                      typeId = 3;
                    else if (transaction.ShipID || transaction.shipment_id)
                      typeId = 1;

                    return (
                      <tr
                        key={transaction.TransID || index}
                        onClick={() => onSelectTransaction(transaction)}
                        className={`cursor-pointer border-b border-panel-border transition-colors ${
                          typeId === 1
                            ? "border-r-4 border-r-slate-500 hover:bg-utility-soft-bg-hover"
                            : typeId === 2
                              ? "border-r-4 border-r-red-500 !bg-red-50 hover:!bg-red-100 dark:!bg-red-900/20 dark:hover:!bg-red-900/40"
                              : typeId === 3
                                ? "border-r-4 border-r-green-600 hover:bg-utility-soft-bg-hover"
                                : "hover:bg-utility-soft-bg-hover"
                        }`}
                      >
                        {activeStatementColumns.map(column => (
                          <td
                            key={column.key}
                            className={`px-3 py-2 align-top ${column.type === "date" ? "whitespace-nowrap" : ""}`}
                          >
                            {renderPortCell(column, transaction)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
              </tbody>

              <tfoot>
                <tr className="border-t-2 border-panel-border bg-panel-border/10 font-bold text-panel-text">
                  {activeStatementColumns.map((column, index) => {
                    const footer = getPortStatementFooterCell(
                      column,
                      index,
                      statement.totals,
                      { sectionKey }
                    );
                    return (
                      <td key={column.key} className={footer.className}>
                        {footer.value}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {transactionModal}
      </div>
    </div>
  );
}
