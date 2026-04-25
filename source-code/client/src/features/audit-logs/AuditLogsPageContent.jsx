import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";
import PageHeader from "../../components/PageHeader";
import AuditLogsFiltersPanel from "./components/AuditLogsFiltersPanel";
import AuditLogsStatsGrid from "./components/AuditLogsStatsGrid";
import AuditLogsTable from "./components/AuditLogsTable";
import {
  buildAuditLogsQuery,
  buildAuditStats,
  createAuditFilters,
} from "./auditLogsHelpers";
import { useAuth } from "../../contexts/AuthContext";

export default function AuditLogsPage({ onBack }) {
  const { api } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState(() => createAuditFilters());

  const loadAuditLogs = useCallback(
    async nextFilters => {
      setLoading(true);
      setMessage("");

      try {
        const queryString = buildAuditLogsQuery(nextFilters);
        const result = await api(`/audit-logs?${queryString}`);
        setRows(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Error loading audit logs:", error);
        setMessage(error.message || "تعذر تحميل سجل العمليات.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useEffect(() => {
    loadAuditLogs(filters);
  }, []);

  const stats = useMemo(() => buildAuditStats(rows), [rows]);

  const handleFilterChange = (key, value) => {
    setFilters(current => ({ ...current, [key]: value }));
  };

  const handleReset = () => {
    const fresh = createAuditFilters();
    setFilters(fresh);
    loadAuditLogs(fresh);
  };

  return (
    <div className="page-shell">
      <PageHeader title="سجل العمليات" subtitle="إدارة النظام" onBack={onBack}>
        <button
          onClick={() => loadAuditLogs(filters)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-white/20 disabled:opacity-50"
        >
          <RefreshCcw size={15} className={loading ? "animate-spin" : ""} />
          تحديث
        </button>
      </PageHeader>

      <div className="space-y-4 p-5">
        {message && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {message}
          </div>
        )}

        <AuditLogsStatsGrid stats={stats} />

        <AuditLogsFiltersPanel
          filters={filters}
          onFieldChange={handleFilterChange}
          onApply={() => loadAuditLogs(filters)}
          onReset={handleReset}
        />

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-white/[0.06] bg-[#0b1219] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <LoadingSpinner label="جارٍ تحميل سجل العمليات..." />
          </div>
        ) : (
          <AuditLogsTable rows={rows} />
        )}
      </div>
    </div>
  );
}
