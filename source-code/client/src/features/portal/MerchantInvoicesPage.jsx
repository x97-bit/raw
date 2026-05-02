import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import { useState, useEffect, useMemo } from "react";
import { merchantTrpc } from "./merchantContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Receipt, Search, Calendar, FileText, Eye, Download, ArrowUpRight } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import ExportButtons from "../../components/ExportButtons";


export default function MerchantInvoicesPage() {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    async function loadData() {
      try {
        const result = await merchantTrpc.merchant.getStatement.query({
          fromDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
          toDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
          _bust: Date.now(),
        });
        if (isMounted) setData(result);
      } catch (err) {
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [startDate, endDate]);

  const invoices = useMemo(() => {
    if (!data?.transactions) return [];
    let filtered = data.transactions.filter(t => {
      const dir = String(t.direction || "").trim().toUpperCase();
      return ["IN", "DR"].includes(dir) && t.TransTypeID !== 2;
    });

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.Notes && t.Notes.toLowerCase().includes(lower)) ||
        (t.RefNo && t.RefNo.toString().includes(lower)) ||
        (t.CompanyName && t.CompanyName.toLowerCase().includes(lower)) ||
        (t.DriverName && t.DriverName.toLowerCase().includes(lower)) ||
        (t.GoodTypeName && t.GoodTypeName.toLowerCase().includes(lower))
      );
    }

    return filtered;
  }, [data, searchTerm]);

  const totalInvoicesUSD = useMemo(() => invoices.reduce((sum, t) => sum + Math.abs(Number(t.AmountUSD || 0)), 0), [invoices]);
  const totalInvoicesIQD = useMemo(() => invoices.reduce((sum, t) => sum + Math.abs(Number(t.AmountIQD || 0)), 0), [invoices]);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-8 rounded-2xl border border-destructive/20 text-center">
        <p className="text-lg font-bold">تعذر تحميل الفواتير</p>
        <p className="text-sm mt-2 opacity-70">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">الفواتير</h2>
          <p className="text-sm text-muted-foreground mt-1">جميع الفواتير المسجلة على حسابك</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl">
          <Receipt size={18} className="text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{invoices.length} فاتورة</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {totalInvoicesUSD > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الفواتير (دولار)</p>
            <p className="text-2xl font-bold text-foreground" dir="ltr">
              <span className="text-muted-foreground text-lg">$</span>{fmtNum(totalInvoicesUSD)}
            </p>
          </div>
        )}
        {totalInvoicesIQD > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">إجمالي الفواتير (دينار)</p>
            <p className="text-2xl font-bold text-foreground" dir="ltr">
              {fmtNum(totalInvoicesIQD)} <span className="text-muted-foreground text-sm">د.ع</span>
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="ابحث برقم الوصل، الشركة، السائق..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-secondary/50 border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="relative w-full md:w-56">
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => setDateRange(update)}
            isClearable={true}
            placeholderText="تصفية حسب التاريخ"
            wrapperClassName="w-full"
            className="w-full pl-4 pr-12 py-3 bg-secondary/50 border border-border rounded-xl focus:bg-card focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm text-foreground placeholder:text-muted-foreground"
          />
          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={18} />
        </div>
      </div>

      {/* Invoices List */}
      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-bold text-muted-foreground">لا توجد فواتير</p>
            <p className="text-sm text-muted-foreground/70 mt-1">لم يتم العثور على فواتير تطابق معايير البحث</p>
          </div>
        ) : (
          invoices.map((invoice, idx) => (
            <div
              key={invoice.TransID || idx}
              className="bg-card rounded-2xl border border-border hover:border-primary/30 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Invoice Icon */}
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Receipt size={22} className="text-blue-600 dark:text-blue-400" />
                </div>

                {/* Invoice Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">
                      {invoice.RefNo ? `وصل #${invoice.RefNo}` : "فاتورة"}
                    </span>
                    <span className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                      {invoice.TransTypeName || "فاتورة"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{invoice.TransDate?.split("T")[0]}</span>
                    {invoice.CompanyName && <span>{invoice.CompanyName}</span>}
                    {invoice.DriverName && <span>{invoice.DriverName}</span>}
                    {invoice.GoodTypeName && <span>{invoice.GoodTypeName}</span>}
                  </div>
                  {invoice.Notes && (
                    <p className="text-xs text-muted-foreground/70 mt-1 truncate">{invoice.Notes}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-left flex-shrink-0" dir="ltr">
                  {Number(invoice.AmountUSD) > 0 && (
                    <p className="text-lg font-bold text-foreground">
                      ${fmtNum(Math.abs(invoice.AmountUSD))}
                    </p>
                  )}
                  {Number(invoice.AmountIQD) > 0 && (
                    <p className="text-sm font-semibold text-muted-foreground">
                      {fmtNum(Math.abs(invoice.AmountIQD))} د.ع
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
