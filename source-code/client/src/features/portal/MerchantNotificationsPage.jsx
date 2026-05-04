import { fmtNum, fmtUSD, fmtIQD } from "../../utils/formatNumber";
import { useState, useEffect, useMemo } from "react";
import { merchantTrpc } from "./merchantContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import ModalPortal from "../../components/ModalPortal";
import { Bell, Receipt, CreditCard, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft, X, Calendar, Hash, FileText, DollarSign, Banknote } from "lucide-react";


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

// ── Notification Detail Dialog ──────────────────────────────────────────────
function NotificationDetailDialog({ notification, onClose }) {
  if (!notification) return null;

  const isPayment = notification.type === "payment";
  const accentColor = isPayment ? "emerald" : "blue";

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/50 backdrop-blur-sm p-3 sm:p-4"
        onMouseDown={e => e.target === e.currentTarget && onClose()}
      >
        <div
          className="my-auto w-full max-w-md overflow-hidden rounded-3xl bg-card border border-border shadow-2xl animate-modal-in"
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`relative px-6 py-5 bg-${accentColor}-500/10 border-b border-border`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-${accentColor}-500/15 flex items-center justify-center`}>
                  {isPayment ? (
                    <CreditCard size={22} className={`text-${accentColor}-600 dark:text-${accentColor}-400`} />
                  ) : (
                    <Receipt size={22} className={`text-${accentColor}-600 dark:text-${accentColor}-400`} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{notification.title}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold bg-${accentColor}-500/10 text-${accentColor}-700 dark:text-${accentColor}-300`}>
                    {isPayment ? "تسديد مسجل" : "فاتورة جديدة"}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Amount */}
            {notification.amount > 0 && (
              <div className="rounded-2xl bg-secondary/50 border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">المبلغ</p>
                <p className={`text-2xl font-black ${isPayment ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`} dir="ltr">
                  {isPayment ? "-" : "+"}
                  {notification.currency === "USD" ? "$" : ""}
                  {fmtNum(Math.abs(notification.amount))}
                  {notification.currency === "IQD" ? " د.ع" : ""}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="space-y-3">
              {notification.refNo && (
                <div className="flex items-center gap-3 rounded-xl bg-secondary/30 px-4 py-3">
                  <Hash size={16} className="text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">رقم المرجع</p>
                    <p className="text-sm font-bold text-foreground">{notification.refNo}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 rounded-xl bg-secondary/30 px-4 py-3">
                <Calendar size={16} className="text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground">التاريخ</p>
                  <p className="text-sm font-bold text-foreground">
                    {notification.date?.split("T")[0] || "-"}
                    <span className="text-xs text-muted-foreground mr-2">({getRelativeTime(notification.date)})</span>
                  </p>
                </div>
              </div>

              {notification.description && (
                <div className="flex items-start gap-3 rounded-xl bg-secondary/30 px-4 py-3">
                  <FileText size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">الملاحظات</p>
                    <p className="text-sm text-foreground">{notification.description}</p>
                  </div>
                </div>
              )}

              {notification.amountUSD > 0 && notification.amountIQD > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/30 px-3 py-3">
                    <DollarSign size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">دولار</p>
                      <p className="text-sm font-bold text-foreground" dir="ltr">${fmtNum(notification.amountUSD)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-secondary/30 px-3 py-3">
                    <Banknote size={14} className="text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">دينار</p>
                      <p className="text-sm font-bold text-foreground">{fmtNum(notification.amountIQD)} د.ع</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border">
            <button
              onClick={onClose}
              className="w-full btn-outline py-3 rounded-xl font-bold"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

// ── Notification Card ───────────────────────────────────────────────────────
function NotificationCard({ notification, onClick }) {
  const { type, title, description, amount, currency, date, isNew } = notification;

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
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-right bg-card rounded-2xl border ${isNew ? "border-primary/30 ring-1 ring-primary/10" : "border-border"} shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 overflow-hidden cursor-pointer`}
    >
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
        {amount > 0 && (
          <div className="text-left flex-shrink-0" dir="ltr">
            <p className={`text-base font-bold ${type === "payment" ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
              {type === "payment" ? "-" : "+"}
              {currency === "USD" ? "$" : ""}{fmtNum(Math.abs(amount))}
              {currency === "IQD" ? " د.ع" : ""}
            </p>
          </div>
        )}
      </div>
    </button>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function MerchantNotificationsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedNotification, setSelectedNotification] = useState(null);

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
      const amountUSD = Math.abs(Number(t.AmountUSD || 0));
      const amountIQD = Math.abs(Number(t.AmountIQD || 0));
      const amount = amountUSD !== 0 ? amountUSD : amountIQD;
      const currency = amountUSD !== 0 ? "USD" : "IQD";

      return {
        id: t.TransID,
        type: isPayment ? "payment" : "invoice",
        title: isPayment
          ? (t.RefNo ? `سند قبض #${t.RefNo}` : "عملية تسديد")
          : (t.RefNo ? `فاتورة #${t.RefNo}` : "فاتورة جديدة"),
        description: t.Notes || t.TransTypeName || (isPayment ? "تم تسجيل عملية تسديد على حسابك" : "تم تسجيل فاتورة جديدة على حسابك"),
        amount,
        amountUSD,
        amountIQD,
        currency,
        date: t.TransDate,
        refNo: t.RefNo || null,
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
          <p className="text-sm text-muted-foreground mt-1">تنبيهات الحركات المالية على حسابك — انقر على أي إشعار لعرض التفاصيل</p>
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
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => setSelectedNotification(notification)}
            />
          ))
        )}
      </div>

      {/* Notification Detail Dialog */}
      {selectedNotification && (
        <NotificationDetailDialog
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </div>
  );
}
