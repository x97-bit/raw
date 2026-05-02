import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import { useState, useEffect, useMemo } from "react";
import { merchantTrpc } from "./merchantContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Bell, Receipt, CreditCard, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react";


function getRelativeTime(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "اليوم";
  if (diffDays === 1) return "أمس";
  if (diffDays < 7) return `قبل ${diffDays} أيام`;
  if (diffDays < 30) return `قبل ${Math.floor(diffDays / 7)} أسابيع`;
  return `قبل ${Math.floor(diffDays / 30)} أشهر`;
}

function isWithinDays(dateStr, days) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}

function NotificationCard({ type, title, description, amount, currency, date, isNew }) {
  const typeConfig = {
    invoice: {
      icon: Receipt,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      badge: "فاتورة جديدة",
      badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },
    payment: {
      icon: CreditCard,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      badge: "تسديد مسجل",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
  };

  const config = typeConfig[type] || typeConfig.invoice;
  const Icon = config.icon;

  return (
    <div className={`bg-card rounded-2xl border ${isNew ? "border-primary/30 ring-1 ring-primary/10" : "border-border"} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
      <div className="p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl ${config.color} flex items-center justify-center flex-shrink-0`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-bold text-foreground">{title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${config.badgeColor}`}>
              {config.badge}
            </span>
            {isNew && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {getRelativeTime(date)}
            </span>
            <span>{date?.split("T")[0]}</span>
          </div>
        </div>
        {amount && (
          <div className="text-left flex-shrink-0" dir="ltr">
            <p className={`text-base font-bold ${type === "payment" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
              {type === "payment" ? "-" : "+"}
              {currency === "USD" ? "$" : ""}{fmtNum(Math.abs(amount))}
              {currency === "IQD" ? " د.ع" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MerchantNotificationsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const result = await merchantTrpc.merchant.getStatement.query({
          limit: 50,
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

  const notifications = useMemo(() => {
    if (!data?.transactions) return [];

    let items = data.transactions.map(t => {
      const isPayment = ["OUT", "CR", "2"].includes(String(t.direction || "").trim().toUpperCase());
      const amount = Number(t.AmountUSD || 0) !== 0 ? Math.abs(t.AmountUSD) : Math.abs(t.AmountIQD || 0);
      const currency = Number(t.AmountUSD || 0) !== 0 ? "USD" : "IQD";

      return {
        id: t.TransID,
        type: isPayment ? "payment" : "invoice",
        title: isPayment
          ? (t.RefNo ? `سند قبض #${t.RefNo}` : "عملية تسديد")
          : (t.RefNo ? `فاتورة #${t.RefNo}` : "فاتورة جديدة"),
        description: t.Notes || t.TransTypeName || (isPayment ? "تم تسجيل عملية تسديد على حسابك" : "تم تسجيل فاتورة جديدة على حسابك"),
        amount,
        currency,
        date: t.TransDate,
        isNew: isWithinDays(t.TransDate, 3),
      };
    });

    if (filter === "invoices") items = items.filter(n => n.type === "invoice");
    if (filter === "payments") items = items.filter(n => n.type === "payment");

    return items;
  }, [data, filter]);

  const newCount = notifications.filter(n => n.isNew).length;

  if (isLoading) return <LoadingSpinner fullScreen />;
  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive p-8 rounded-2xl border border-destructive/20 text-center">
        <p className="text-lg font-bold">تعذر تحميل الإشعارات</p>
        <p className="text-sm mt-2 opacity-70">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">الإشعارات</h2>
          <p className="text-sm text-muted-foreground mt-1">تنبيهات الحركات المالية على حسابك</p>
        </div>
        {newCount > 0 && (
          <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl">
            <Bell size={18} className="text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{newCount} إشعار جديد</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-secondary p-1.5 rounded-2xl w-fit">
        {[
          { id: "all", label: "الكل" },
          { id: "invoices", label: "الفواتير" },
          { id: "payments", label: "المدفوعات" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              filter === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center">
            <Bell size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-bold text-muted-foreground">لا توجد إشعارات</p>
            <p className="text-sm text-muted-foreground/70 mt-1">ستظهر هنا التنبيهات عند تسجيل حركات جديدة</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationCard key={notification.id} {...notification} />
          ))
        )}
      </div>
    </div>
  );
}
