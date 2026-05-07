import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import { useState, useEffect, useMemo, useCallback } from "react";
import { merchantTrpc } from "./merchantContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Calendar, FileText, Printer, FileDown, Search, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import ExportButtons from "../../components/ExportButtons";
import { merchantExportInvoicePDF } from "./merchantPdfExport";


export default function MerchantStatementPage() {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'receipts'
  const [searchTerm, setSearchTerm] = useState("");
  const [exportingId, setExportingId] = useState(null);

  const handleExportPDF = useCallback(async (transaction) => {
    const id = transaction.TransID || transaction.RefNo;
    setExportingId(id);
    try {
      await merchantExportInvoicePDF(transaction, {
        sectionKey: transaction.sectionKey || transaction.PortID,
      });
    } catch (err) {
      console.error("[Merchant Statement PDF Error]:", err);
    } finally {
      setExportingId(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadData() {
      try {
        const result = await merchantTrpc.merchant.getStatement.query({
          fromDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          toDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        });
        if (isMounted) setData(result);
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  const { accountName, transactions = [], totals, globalTotals } = data || {};
  const activeGlobalTotals = globalTotals || totals || {};

  // Filter Logic
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Search Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        t => 
          (t.Notes && t.Notes.toLowerCase().includes(lowerSearch)) ||
          (t.RefNo && t.RefNo.toString().toLowerCase().includes(lowerSearch)) ||
          (t.RecordType && t.RecordType.toLowerCase().includes(lowerSearch)) ||
          (t.TransTypeName && t.TransTypeName.toLowerCase().includes(lowerSearch)) ||
          (t.CompanyName && t.CompanyName.toLowerCase().includes(lowerSearch)) ||
          (t.DriverName && t.DriverName.toLowerCase().includes(lowerSearch)) ||
          (t.VehiclePlate && t.VehiclePlate.toLowerCase().includes(lowerSearch)) ||
          (t.GoodTypeName && t.GoodTypeName.toLowerCase().includes(lowerSearch))
      );
    }

    // Tab Filter
    if (activeTab === "receipts_additions") {
      filtered = filtered.filter(t => {
        const typeName = t.TransTypeName || "";
        const recordType = t.RecordType || "";
        const notes = t.Notes || "";
        
        // Receipts & Payments (Decreasing Trader Balance)
        const isReceipt = (t.TransTypeID === 2) || 
                          recordType.includes("payment") ||
                          typeName.includes("قبض") || 
                          typeName.includes("تسديد") || 
                          typeName.includes("حوالة") ||
                          notes.includes("قبض") || 
                          notes.includes("تسديد") ||
                          Number(t.AmountUSD) < 0 || 
                          Number(t.AmountIQD) < 0;
                          
        // Additions & Debit Notes (Increasing Trader Balance)
        const isAddition = (t.TransTypeID === 3) ||
                           recordType.includes("debit-note") ||
                           recordType.includes("expense-charge") ||
                           typeName.includes("إضافة") ||
                           notes.includes("إضافة");
                           
        return isReceipt || isAddition;
      });
    }

    return filtered;
  }, [transactions, activeTab, searchTerm]);

  // Derived Totals for the current view
  const currentTotals = useMemo(() => {
    if (filteredTransactions.length > 0) {
      return {
        usd: filteredTransactions[0].runningUSD || 0,
        iqd: filteredTransactions[0].runningIQD || 0
      };
    }
    return {
      usd: activeGlobalTotals?.balanceUSD || 0,
      iqd: activeGlobalTotals?.balanceIQD || 0
    };
  }, [filteredTransactions, activeGlobalTotals]);

  const hasDateFilter = Boolean(startDate || endDate);

  const isPayment = (dir) => ["OUT", "CR", "2"].includes(String(dir || "").trim().toUpperCase());

  // Dynamic Columns Configuration
  const tableColumns = useMemo(() => {
    if (activeTab === "receipts_additions") {
      return [
        { key: "TransDate", label: "التاريخ", format: "date", getValue: r => r.TransDate?.split("T")[0] || "---" },
        { key: "RefNo", label: "رقم الوصل", getValue: r => r.RefNo || "---" },
        { 
          key: "TransTypeName", 
          label: "نوع السند", 
          getValue: r => r.TransTypeName || 
            (r.RecordType === "payment" ? "سند قبض / تسديد" : 
             r.RecordType === "debit-note" ? "سند إضافة" : 
             r.RecordType === "expense-charge" ? "مصروف محمل" : "---")
        },
        { key: "Notes", label: "التفاصيل / الملاحظات", getValue: r => r.Notes || "---" },
        { key: "DebitUSD", label: "المطلوب (دولار)", format: "money_usd_red", getValue: r => !isPayment(r.direction) ? r.AmountUSD : null },
        { key: "CreditUSD", label: "المسدد (دولار)", format: "money_usd_green", getValue: r => isPayment(r.direction) ? r.AmountUSD : null },
        { key: "DebitIQD", label: "المطلوب (دينار)", format: "money_iqd_red", getValue: r => !isPayment(r.direction) ? r.AmountIQD : null },
        { key: "CreditIQD", label: "المسدد (دينار)", format: "money_iqd_green", getValue: r => isPayment(r.direction) ? r.AmountIQD : null }
      ];
    }
    
    return [
      { key: "TransDate", label: "التاريخ", format: "date", getValue: r => r.TransDate?.split("T")[0] || "---" },
      { key: "RefNo", label: "رقم الوصل", getValue: r => r.RefNo || "---" },
      { key: "CompanyName", label: "الشركة", getValue: r => r.CompanyName || "---" },
      { key: "DriverName", label: "السائق", getValue: r => r.DriverName || "---" },
      { key: "VehiclePlate", label: "السيارة", getValue: r => r.VehiclePlate || "---" },
      { key: "GoodTypeName", label: "البضاعة", getValue: r => r.GoodTypeName || "---" },
      { key: "Notes", label: "التفاصيل / الملاحظات", getValue: r => r.Notes || r.TransTypeName || "---" },
      { key: "DebitUSD", label: "المطلوب (دولار)", format: "money_usd_red", getValue: r => !isPayment(r.direction) ? r.AmountUSD : null },
      { key: "CreditUSD", label: "المسدد (دولار)", format: "money_usd_green", getValue: r => isPayment(r.direction) ? r.AmountUSD : null },
      { key: "BalanceUSD", label: "الرصيد (دولار)", format: "money_usd_bold", getValue: r => r.runningUSD },
      { key: "DebitIQD", label: "المطلوب (دينار)", format: "money_iqd_red", getValue: r => !isPayment(r.direction) ? r.AmountIQD : null },
      { key: "CreditIQD", label: "المسدد (دينار)", format: "money_iqd_green", getValue: r => isPayment(r.direction) ? r.AmountIQD : null },
      { key: "BalanceIQD", label: "الرصيد (دينار)", format: "money_iqd_bold", getValue: r => r.runningIQD }
    ];
  }, [activeTab]);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 flex flex-col items-center justify-center text-center shadow-sm">
        <div className="text-2xl font-bold mb-3">تعذر تحميل الكشف</div>
        <div className="opacity-80 text-lg">Error: {error.message}</div>
        <div className="mt-4 text-xs font-mono text-red-400">Timestamp: {new Date().toISOString()}</div>
      </div>
    );
  }

  // Pre-process for Print Export
  const printData = filteredTransactions.map(t => {
    const row = {};
    tableColumns.forEach(col => {
      let val = col.getValue(t);
      if (col.format?.startsWith("money_usd") || col.format?.startsWith("money_iqd")) {
        val = val ? fmtNum(val) : "---";
      }
      row[col.label] = val;
    });
    return row;
  });
  
  const printTotals = {
    "المبلغ الكلي (دولار)": fmtNum(activeGlobalTotals?.totalInvoicesUSD),
    "المسدد (دولار)": fmtNum(activeGlobalTotals?.totalPaymentsUSD),
    "الرصيد المتبقي (دولار)": fmtNum(activeGlobalTotals?.balanceUSD),
    "المبلغ الكلي (دينار)": fmtNum(activeGlobalTotals?.totalInvoicesIQD),
    "المسدد (دينار)": fmtNum(activeGlobalTotals?.totalPaymentsIQD),
    "الرصيد المتبقي (دينار)": fmtNum(activeGlobalTotals?.balanceIQD),
  };
  
  // Filtered amounts are removed from print since we removed the cards

  return (
    <div className="space-y-8 pb-12 font-['Cairo','Tajawal',sans-serif]">
      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Name */}
        <div className="md:col-span-3 bg-gradient-to-br from-[#1c2b59] to-[#2a3f7a] rounded-3xl p-6 text-white shadow-xl shadow-blue-900/10 border border-blue-800/50 relative overflow-hidden group flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500"></div>
          <div className="relative z-10">
            <h3 className="text-blue-200 text-sm font-medium mb-1">الحساب الحالي</h3>
            <p className="text-3xl font-bold tracking-wide text-white">{accountName}</p>
          </div>
        </div>

        {/* Row 1: USD */}
        {(activeGlobalTotals?.totalInvoicesUSD !== 0 || activeGlobalTotals?.totalPaymentsUSD !== 0 || activeGlobalTotals?.balanceUSD !== 0 || (activeGlobalTotals?.totalInvoicesIQD === 0 && activeGlobalTotals?.totalPaymentsIQD === 0 && activeGlobalTotals?.balanceIQD === 0)) && (
          <>
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-1 h-full bg-[#1c2b59]"></div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">المبلغ الكلي (دولار)</h3>
          <p className="text-3xl font-bold text-[#1c2b59] tracking-tight" dir="ltr">
            <span className="text-[#9ab6ca] mr-1">$</span>
            {fmtNum(activeGlobalTotals?.totalInvoicesUSD)}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-1 h-full bg-[#8eb8ad]"></div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">المسدد (دولار)</h3>
          <p className="text-3xl font-bold text-[#1c2b59] tracking-tight" dir="ltr">
            <span className="text-[#8eb8ad] mr-1">$</span>
            {fmtNum(activeGlobalTotals?.totalPaymentsUSD)}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-[#D4AF37] to-[#AA8222]"></div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">الرصيد المتبقي (دولار)</h3>
              <p className="text-3xl font-bold text-[#1c2b59] tracking-tight" dir="ltr">
                <span className="text-[#D4AF37] mr-1">$</span>
                {fmtNum(activeGlobalTotals?.balanceUSD)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
              <ArrowUpRight className="text-[#D4AF37]" size={20} />
            </div>
          </div>
        </div>
          </>
        )}

        {/* Row 2: IQD */}
        {(activeGlobalTotals?.totalInvoicesIQD !== 0 || activeGlobalTotals?.totalPaymentsIQD !== 0 || activeGlobalTotals?.balanceIQD !== 0 || (activeGlobalTotals?.totalInvoicesUSD === 0 && activeGlobalTotals?.totalPaymentsUSD === 0 && activeGlobalTotals?.balanceUSD === 0)) && (
          <>
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-1 h-full bg-[#1c2b59]"></div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">المبلغ الكلي (دينار)</h3>
          <p className="text-3xl font-bold text-[#1c2b59] tracking-tight" dir="ltr">
            {fmtNum(activeGlobalTotals?.totalInvoicesIQD)}
            <span className="text-[#9ab6ca] text-lg ml-1">د.ع</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-1 h-full bg-[#8eb8ad]"></div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">المسدد (دينار)</h3>
          <p className="text-3xl font-bold text-[#1c2b59] tracking-tight" dir="ltr">
            {fmtNum(activeGlobalTotals?.totalPaymentsIQD)}
            <span className="text-[#8eb8ad] text-lg ml-1">د.ع</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/40 border border-gray-100 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-[#1c2b59] to-[#1c2b59]"></div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-500 text-sm font-medium mb-1">الرصيد المتبقي (دينار)</h3>
              <p className="text-3xl font-bold text-[#1c2b59] tracking-tight" dir="ltr">
                {fmtNum(activeGlobalTotals?.balanceIQD)}
                <span className="text-[#1c2b59] text-lg ml-1 opacity-75">د.ع</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ArrowDownLeft className="text-[#1c2b59]" size={20} />
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/30 border border-gray-100 overflow-hidden">
        
        {/* Toolbar: Tabs & Actions */}
        <div className="border-b border-gray-100 px-6 py-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gray-50/50">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === "all"
                  ? "bg-white text-[#1c2b59] shadow-sm ring-1 ring-gray-200/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              الكشف الشامل (الكل)
            </button>
            <button
              onClick={() => setActiveTab("receipts_additions")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                activeTab === "receipts_additions"
                  ? "bg-white text-[#1c2b59] shadow-sm ring-1 ring-gray-200/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
              }`}
            >
              سندات القبض والإضافة
            </button>
          </div>

          {/* Export & Print */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <ExportButtons 
              rows={filteredTransactions} 
              printRenderer="saudi-statement"
              filename={`كشف_حساب_${accountName}`}
              title={activeTab === "all" ? `كشف حساب - ${accountName}` : `سندات القبض والإضافة - ${accountName}`}
              totalsRow={{
                AmountUSD: currentTotals.usd,
                AmountIQD: currentTotals.iqd,
              }}
              columns={tableColumns}
              printContext={{
                accountName,
                fromDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
                toDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
                totals: totals || {},
                globalTotals: globalTotals || totals || {}
              }}
            />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-5 flex flex-col md:flex-row gap-4 items-center bg-white">
          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="ابحث في الملاحظات أو التفاصيل..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all text-sm"
            />
          </div>

          <div className="relative w-full md:w-64 flex-1 md:flex-none">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              isClearable={true}
              placeholderText="تصفية حسب التاريخ"
              wrapperClassName="w-full"
              className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] transition-all text-sm"
            />
            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-y border-gray-100 text-gray-500">
                <th className="px-3 py-4 font-bold text-sm whitespace-nowrap w-10">PDF</th>
                {tableColumns.map(col => (
                  <th key={col.key} className="px-4 py-4 font-bold text-sm whitespace-nowrap">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions?.length === 0 ? (
                <tr>
                  <td colSpan={tableColumns.length + 1} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                        <FileText size={32} className="text-gray-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-700">لا توجد حركات مسجلة</p>
                        <p className="text-sm text-gray-400">لم نتمكن من العثور على أي حركات تطابق خيارات التصفية الحالية.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions?.map((t, idx) => (
                  <tr key={t.TransID || idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => handleExportPDF(t)}
                        disabled={exportingId === (t.TransID || t.RefNo)}
                        title="تحميل فاتورة PDF"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 active:scale-90 transition-all disabled:opacity-50 disabled:cursor-wait"
                      >
                        {exportingId === (t.TransID || t.RefNo) ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileDown size={14} />
                        )}
                      </button>
                    </td>
                    {tableColumns.map(col => {
                      const val = col.getValue(t);
                      const isMoneyFormat = col.format?.startsWith("money_usd") || col.format?.startsWith("money_iqd");
                      if (isMoneyFormat) {
                        return (
                          <td key={col.key} className="px-4 py-4 text-sm font-bold text-left whitespace-nowrap" dir="ltr">
                            {val ? (
                              <span className={
                                col.format === "money_usd_red" || col.format === "money_iqd_red" ? "text-rose-600" :
                                col.format === "money_usd_green" || col.format === "money_iqd_green" ? "text-emerald-600" :
                                col.format === "money_usd_bold" || col.format === "money_iqd_bold" ? "text-[#1c2b59] bg-blue-50 px-2 py-1 rounded" :
                                "text-[#1c2b59]"
                              }>
                                {col.format?.startsWith("money_usd") ? "$" : ""}{fmtNum(Math.abs(val))}
                              </span>
                            ) : "---"}
                          </td>
                        );
                      }
                      
                      return (
                        <td key={col.key} className="px-4 py-4 text-sm font-medium text-gray-600 group-hover:text-[#1c2b59] transition-colors whitespace-nowrap">
                          {col.key === "Notes" ? (
                            <div className="truncate max-w-xs" title={val}>{val}</div>
                          ) : val}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
            {/* View Totals Footer */}
            {filteredTransactions?.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50/80 border-t border-gray-200">
                  <td colSpan={tableColumns.length + 1} className="px-6 py-6 text-sm font-bold text-gray-700 text-center">
                    الرصيد المعروض: 
                    <span className="mx-2 text-lg text-[#1c2b59] bg-blue-50 px-3 py-1 rounded" dir="ltr">${fmtNum(currentTotals.usd)}</span> 
                    | 
                    <span className="mx-2 text-lg text-[#1c2b59] bg-blue-50 px-3 py-1 rounded" dir="ltr">{fmtNum(currentTotals.iqd)} <span className="text-sm">د.ع</span></span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
