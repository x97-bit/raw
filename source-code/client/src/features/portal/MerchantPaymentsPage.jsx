import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import { useState, useEffect, useMemo } from "react";
import { merchantTrpc } from "./merchantContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { CreditCard, Search, Calendar, FileText, CheckCircle2, ArrowDownLeft } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";


export default function MerchantPaymentsPage() {
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

  const payments = useMemo(() => {
    if (!data?.transactions) return [];
    let filtered = data.transactions.filter(t => {
      const dir = String(t.direction || "").trim().toUpperCase();
      return ["OUT", "CR", "2"].includes(dir) || t.TransTypeID === 2;
    });

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        (t.Notes && t.Notes.toLowerCase().includes(lower)) ||
        (t.RefNo && t.RefNo.toString().includes(lower)) ||
        (t.TransTypeName && t.TransTypeName.toLowerCase().includes(lower))
      );
    }

    return filtered;
  }, [data, searchTerm]);

  const totalPaymentsUSD = useMemo(() => payments.reduce((sum, t) => sum + Math.abs(Number(t.AmountUSD || 0)), 0), [payments]);
  const totalPaymentsIQD = useMemo(() => payments.reduce((sum, t) => sum + Math.abs(Number(t.AmountIQD || 0)), 0), [payments]);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-8 rounded-2xl border border-destructive/20 text-center">
        <p className="text-lg font-bold">تعذر تحميل المدفوعات</p>
        <p className="text-sm mt-2 opacity-70">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">المدفوعات والتسديدات</h2>
          <p className="text-sm text-muted-foreground mt-1">جميع سندات القبض والتسديدات المسجلة</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl">
          <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{payments.length} عملية تسديد</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {totalPaymentsUSD > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">إجمالي المدفوعات (دولار)</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
              <span className="text-emerald-400/60 dark:text-emerald-500/60 text-lg">$</span>{fmtNum(totalPaymentsUSD)}
            </p>
          </div>
        )}
        {totalPaymentsIQD > 0 && (
          <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">إجمالي المدفوعات (دينار)</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
              {fmtNum(totalPaymentsIQD)} <span className="text-emerald-400/60 dark:text-emerald-500/60 text-sm">د.ع</span>
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
            placeholder="ابحث في المدفوعات..."
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

      {/* Payments Timeline */}
      <div className="space-y-3">
        {payments.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <CreditCard size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-bold text-muted-foreground">لا توجد مدفوعات</p>
            <p className="text-sm text-muted-foreground/70 mt-1">لم يتم العثور على سندات قبض تطابق معايير البحث</p>
          </div>
        ) : (
          payments.map((payment, idx) => (
            <div
              key={payment.TransID || idx}
              className="bg-card rounded-2xl border border-border hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Payment Icon */}
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <ArrowDownLeft size={22} className="text-emerald-600 dark:text-emerald-400" />
                </div>

                {/* Payment Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">
                      {payment.RefNo ? `سند قبض #${payment.RefNo}` : "عملية تسديد"}
                    </span>
                    <span className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-medium">
                      {payment.TransTypeName || "تسديد"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{payment.TransDate?.split("T")[0]}</span>
                  </div>
                  {payment.Notes && (
                    <p className="text-xs text-muted-foreground/70 mt-1 truncate">{payment.Notes}</p>
                  )}
                </div>

                {/* Amount */}
                <div className="text-left flex-shrink-0" dir="ltr">
                  {Number(payment.AmountUSD) !== 0 && (
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      -${fmtNum(Math.abs(payment.AmountUSD))}
                    </p>
                  )}
                  {Number(payment.AmountIQD) !== 0 && (
                    <p className="text-sm font-semibold text-emerald-500 dark:text-emerald-400">
                      -{fmtNum(Math.abs(payment.AmountIQD))} د.ع
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
                    <CheckCircle2 size={12} />
                    مؤكد
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
