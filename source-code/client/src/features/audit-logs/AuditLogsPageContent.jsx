import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import PageHeader from '../../components/PageHeader';
import AuditLogDetailModal from './components/AuditLogDetailModal';
import AuditLogsFiltersPanel from './components/AuditLogsFiltersPanel';
import AuditLogsStatsGrid from './components/AuditLogsStatsGrid';
import AuditLogsTable from './components/AuditLogsTable';
import {
  buildAuditLogsQuery,
  buildAuditStats,
  createAuditFilters,
} from './auditLogsHelpers';
import { useAuth } from '../../contexts/AuthContext';

export default function AuditLogsPage({ onBack }) {
  const { api } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState(() => createAuditFilters());

  const loadAuditLogs = useCallback(async (nextFilters = filters) => {
    setLoading(true);
    setMessage('');

    try {
      const queryString = buildAuditLogsQuery(nextFilters);
      const result = await api(`/audit-logs?${queryString}`);
      setRows(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setMessage(error.message || 'تعذر تحميل سجل العمليات.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  useEffect(() => {
    loadAuditLogs(filters);
  }, []);

  const stats = useMemo(() => buildAuditStats(rows), [rows]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="سجل العمليات"
        subtitle="إدارة النظام"
        onBack={onBack}
      >
        <button
          onClick={() => loadAuditLogs(filters)}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium transition-all hover:bg-white/20"
        >
          <RefreshCcw size={15} />
          تحديث
        </button>
      </PageHeader>

      <div className="space-y-4 p-5">
        {message && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {message}
          </div>
        )}

        <AuditLogsFiltersPanel
          filters={filters}
          onFieldChange={handleFilterChange}
          onApply={() => loadAuditLogs(filters)}
        />

        <AuditLogsStatsGrid stats={stats} />

        {loading ? (
          <LoadingSpinner label="جارٍ تحميل سجل العمليات..." />
        ) : (
          <AuditLogsTable rows={rows} onSelectLog={setSelectedLog} />
        )}
      </div>

      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
