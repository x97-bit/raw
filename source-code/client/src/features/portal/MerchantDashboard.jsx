import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import { useState, useEffect } from "react";
import { merchantTrpc, useMerchantAuth, useMerchantNavigation } from "./merchantContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight,
  ArrowDownLeft, FileText, CreditCard, Receipt, Clock,
  AlertCircle, CheckCircle2, Activity, MessageCircle
} from "lucide-react";


function StatCard({ title, value, currency, icon: Icon, color, subtitle }) {
  const colorMap = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    gold: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    red: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="bg-card rounded-xl p-3.5 shadow-sm border border-border hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-lg ${colorMap[color]} flex items-center justify-center`}>
          <Icon size={15} />
        </div>
        <p className="text-[11px] text-muted-foreground font-medium">{title}</p>
      </div>
      <p className="text-xl font-bold text-foreground tracking-tight" dir="ltr">
        {currency === "USD" && <span className="text-muted-foreground text-sm ml-0.5">$</span>}
        {fmtNum(value)}
        {currency === "IQD" && <span className="text-muted-foreground text-[11px] mr-0.5"> د.ع</span>}
      </p>
      {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2.5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-150 text-right w-full group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
        <Icon size={15} className="text-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-[12px] font-semibold text-foreground flex-1">{label}</span>
      <ArrowUpRight size={13} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
    </button>
  );
}

function RecentTransaction({ transaction }) {
  const isPayment = ["OUT", "CR", "2"].includes(String(transaction.direction || "").trim().toUpperCase());
  const amount = transaction.AmountUSD || transaction.AmountIQD;
  const currency = transaction.AmountUSD ? "USD" : "IQD";

  return (
    <div className="flex items-center gap-2.5 py-2 border-b border-border/40 last:border-0">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
        isPayment ? "bg-emerald-500/10" : "bg-blue-500/10"
      }`}>
        {isPayment ? (
          <ArrowDownLeft size={13} className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ArrowUpRight size={13} className="text-blue-600 dark:text-blue-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-foreground truncate">
          {transaction.Notes || transaction.TransTypeName || (isPayment ? "سند قبض" : "فاتورة")}
        </p>
        <p className="text-[10px] text-muted-foreground">{transaction.TransDate?.split("T")[0]}</p>
      </div>
      <div className="text-left" dir="ltr">
        <p className={`text-[12px] font-bold ${isPayment ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
          {isPayment ? "-" : "+"}{currency === "USD" ? "$" : ""}{fmtNum(Math.abs(amount))}
          {currency === "IQD" ? " د.ع" : ""}
        </p>
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  const { user } = useMerchantAuth();
  const { navigateTo } = useMerchantNavigation();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const result = await merchantTrpc.merchant.getStatement.query({
          limit: 10,
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
  }, []);

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 text-center">
        <AlertCircle size={36} className="mx-auto mb-3 opacity-50" />
        <p className="text-base font-bold">تعذر تحميل البيانات</p>
        <p className="text-xs mt-1 opacity-70">{error.message}</p>
      </div>
    );
  }

  const { accountName, transactions = [], globalTotals = {} } = data || {};
  const recentTransactions = transactions.slice(0, 5);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "صباح الخير";
    return "مساء الخير";
  })();

  return (
    <div className="space-y-4">
      {/* Welcome Header - Compact */}
      <div className="bg-primary rounded-2xl px-5 py-4 text-primary-foreground relative overflow-hidden">
        <div className="absolute -left-8 -top-8 w-28 h-28 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/60 text-[11px] font-medium">{greeting}</p>
            <h2 className="text-lg font-bold">{user?.fullName || user?.name || accountName}</h2>
            <p className="text-primary-foreground/50 text-[11px]">ملخص حسابك المالي</p>
          </div>
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-[10px] text-primary-foreground/70 font-medium">متصل</span>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {(globalTotals.totalInvoicesUSD > 0 || globalTotals.balanceUSD > 0) && (
          <>
            <StatCard title="الفواتير ($)" value={globalTotals.totalInvoicesUSD} currency="USD" icon={Receipt} color="blue" />
            <StatCard title="المدفوعات ($)" value={globalTotals.totalPaymentsUSD} currency="USD" icon={CreditCard} color="green" />
            <StatCard title="الرصيد ($)" value={globalTotals.balanceUSD} currency="USD" icon={Wallet} color="gold" subtitle={globalTotals.balanceUSD > 0 ? "مستحق" : "لصالحك"} />
          </>
        )}
        {(globalTotals.totalInvoicesIQD > 0 || globalTotals.balanceIQD > 0) && (
          <>
            <StatCard title="الفواتير (د.ع)" value={globalTotals.totalInvoicesIQD} currency="IQD" icon={Receipt} color="blue" />
            <StatCard title="المدفوعات (د.ع)" value={globalTotals.totalPaymentsIQD} currency="IQD" icon={CreditCard} color="green" />
            <StatCard title="الرصيد (د.ع)" value={globalTotals.balanceIQD} currency="IQD" icon={Wallet} color="gold" subtitle={globalTotals.balanceIQD > 0 ? "مستحق" : "لصالحك"} />
          </>
        )}
      </div>

      {/* Quick Actions + Recent Transactions - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Quick Actions */}
        <div className="lg:col-span-4 space-y-1.5">
          <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider mb-2">إجراءات سريعة</h3>
          <QuickAction icon={FileText} label="كشف الحساب" onClick={() => navigateTo("statement")} />
          <QuickAction icon={Receipt} label="الفواتير" onClick={() => navigateTo("invoices")} />
          <QuickAction icon={CreditCard} label="المدفوعات" onClick={() => navigateTo("payments")} />
          <QuickAction icon={MessageCircle} label="تواصل مع الإدارة" onClick={() => navigateTo("support")} />
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-8">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
              <h3 className="text-[12px] font-bold text-foreground">آخر الحركات</h3>
              <button
                onClick={() => navigateTo("statement")}
                className="text-[11px] font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                عرض الكل ←
              </button>
            </div>
            <div className="px-4 py-1.5">
              {recentTransactions.length === 0 ? (
                <div className="py-6 text-center">
                  <Activity size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">لا توجد حركات حديثة</p>
                </div>
              ) : (
                recentTransactions.map((t, idx) => (
                  <RecentTransaction key={t.TransID || idx} transaction={t} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
