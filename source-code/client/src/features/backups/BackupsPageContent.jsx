import { useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  Clock3,
  Copy,
  Database,
  Download,
  RefreshCw,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';

const IMPORT_CONFIRM_PHRASE = 'IMPORT_BACKUP';

function formatBytes(sizeBytes) {
  const bytes = Number(sizeBytes || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / (1024 ** unitIndex);

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDateTime(value) {
  if (!value) return 'غير متوفر';

  try {
    return new Intl.DateTimeFormat('ar-IQ-u-nu-latn', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function extractFileName(dispositionHeader, fallbackName) {
  if (!dispositionHeader) return fallbackName;

  const utf8Match = dispositionHeader.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = dispositionHeader.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return fallbackName;
}

async function downloadProtectedFile(token, endpoint, fallbackName) {
  const response = await fetch(`/api${endpoint}`, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'same-origin',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : { error: await response.text() };

    throw new Error(data?.error || 'فشل تنزيل الملف.');
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = extractFileName(
    response.headers.get('content-disposition'),
    fallbackName,
  );

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);

  return link.download;
}

function SummaryCard({ title, value, hint, icon: Icon, accent = '#648ea9' }) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 text-right">
          <div className="text-xs font-bold tracking-wide text-[#91a0ad]">{title}</div>
          <div className="mt-2 text-[1.75rem] font-black tracking-tight text-white">{value}</div>
          <div className="mt-2 text-sm text-[#b7c3ce]">{hint}</div>
        </div>
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px]"
          style={{
            background: `${accent}22`,
            color: accent,
            boxShadow: `inset 0 1px 0 ${accent}22`,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function BackupFileTable({ title, subtitle, files, emptyLabel }) {
  return (
    <section className="surface-card overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div className="text-right">
          <h3 className="text-base font-black text-white">{title}</h3>
          <p className="mt-1 text-sm text-[#91a0ad]">{subtitle}</p>
        </div>
        <div className="rounded-full bg-white/[0.05] px-3 py-1 text-xs font-bold text-[#cbd5df]">
          {files.length}
        </div>
      </div>

      {files.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[#91a0ad]">{emptyLabel}</div>
      ) : (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>الملف</th>
                <th>الحجم</th>
                <th>آخر تحديث</th>
                <th>المسار</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.path}>
                  <td className="font-semibold text-white">{file.name}</td>
                  <td dir="ltr">{formatBytes(file.sizeBytes)}</td>
                  <td>{formatDateTime(file.modifiedAt)}</td>
                  <td dir="ltr" className="max-w-[18rem] truncate text-[#9fb0be]">{file.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function BackupsPageContent({ onBack }) {
  const { api, token } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const messageClassName = useMemo(() => {
    if (messageType === 'success') {
      return 'border-[#8eb8ad]/20 bg-[#8eb8ad]/[0.08] text-[#dceee8]';
    }

    if (messageType === 'error') {
      return 'border-[#b76169]/20 bg-[#b76169]/[0.08] text-[#f4d4d8]';
    }

    return 'border-[#648ea9]/20 bg-[#648ea9]/[0.08] text-[#dbe7f0]';
  }, [messageType]);

  const loadStatus = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await api('/backups/status');
      setStatus(response);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  const handleRefresh = async () => {
    setBusyAction('refresh');
    try {
      await loadStatus({ silent: true });
      setMessageType('success');
      setMessage('تم تحديث حالة النسخ الاحتياطي.');
    } finally {
      setBusyAction('');
    }
  };

  const handleCreateServerBackup = async () => {
    setBusyAction('create');
    try {
      const result = await api('/backups/create', { method: 'POST' });
      await loadStatus({ silent: true });
      setMessageType('success');
      setMessage(`${result.message} ${result.file?.fileName ? `الملف: ${result.file.fileName}` : ''}`.trim());
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const handleExport = async (endpoint, fallbackName, successLabel, actionKey) => {
    setBusyAction(actionKey);

    try {
      const fileName = await downloadProtectedFile(token, endpoint, fallbackName);
      setMessageType('success');
      setMessage(`${successLabel} ${fileName}`);
    } catch (error) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setBusyAction('');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessageType('error');
      setMessage('اختر ملف JSON أولاً.');
      return;
    }

    if (!window.confirm('سيتم أخذ نسخة أمان قبل الاستيراد. هل تريد المتابعة؟')) {
      return;
    }

    setBusyAction('import');

    try {
      const rawText = await selectedFile.text();
      const parsedBackup = JSON.parse(rawText);
      const result = await api('/backups/import', {
        method: 'POST',
        body: JSON.stringify({
          backup: parsedBackup,
          sourceFileName: selectedFile.name,
          confirmPhrase: IMPORT_CONFIRM_PHRASE,
        }),
      });

      setSelectedFile(null);
      setFileInputKey((current) => current + 1);
      await loadStatus({ silent: true });
      setMessageType('success');
      setMessage(
        `${result.message} ${result.preImportBackup?.fileName ? `نسخة الأمان: ${result.preImportBackup.fileName}` : ''}`.trim(),
      );
    } catch (error) {
      const fallbackMessage = error instanceof SyntaxError
        ? 'الملف المحدد ليس JSON صالحاً.'
        : error.message;

      setMessageType('error');
      setMessage(fallbackMessage);
    } finally {
      setBusyAction('');
    }
  };

  const handleCopyCron = async () => {
    const cronValue = status?.dailyBackup?.recommendedCron;
    if (!cronValue) return;

    try {
      await navigator.clipboard.writeText(cronValue);
      setMessageType('success');
      setMessage('تم نسخ أمر النسخ اليومي.');
    } catch {
      setMessageType('error');
      setMessage('تعذر نسخ الأمر تلقائياً. انسخه يدوياً من المربع أدناه.');
    }
  };

  const summaryCards = status ? [
    {
      title: 'الحسابات',
      value: status.tableCounts?.accounts ?? 0,
      hint: 'إجمالي الحسابات داخل قاعدة البيانات',
      icon: Database,
      accent: '#648ea9',
    },
    {
      title: 'المعاملات',
      value: status.tableCounts?.transactions ?? 0,
      hint: 'كل الفواتير والسندات المصدرة',
      icon: Save,
      accent: '#7c6f63',
    },
    {
      title: 'آخر نسخة يومية',
      value: status.dailyBackup?.latestBackup ? formatDateTime(status.dailyBackup.latestBackup.modifiedAt) : 'غير موجودة',
      hint: status.dailyBackup?.healthy ? 'النسخ اليومي يعمل بشكل طبيعي' : 'يحتاج متابعة أو تفعيل',
      icon: Clock3,
      accent: status.dailyBackup?.healthy ? '#4f7d74' : '#b76169',
    },
    {
      title: 'نسخ JSON المخزنة',
      value: status.latestBackups?.appGenerated?.length ?? 0,
      hint: 'آخر النسخ التي أُنشئت من داخل النظام',
      icon: ArchiveRestore,
      accent: '#6f7a96',
    },
  ] : [];

  return (
    <div className="page-shell">
      <PageHeader
        title="النسخ الاحتياطي"
        subtitle="استيراد وتصدير النسخ، قالب القاعدة، ومراقبة النسخ اليومي"
        onBack={onBack}
      >
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
          <ShieldCheck size={14} />
          <span>إدارة آمنة</span>
        </div>
      </PageHeader>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-5">
        {message && (
          <div className={`rounded-[22px] border px-4 py-3 text-sm font-semibold ${messageClassName}`}>
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(loading ? new Array(4).fill(null) : summaryCards).map((card, index) => (
            card ? (
              <SummaryCard
                key={card.title}
                title={card.title}
                value={card.value}
                hint={card.hint}
                icon={card.icon}
                accent={card.accent}
              />
            ) : (
              <div key={`skeleton-${index}`} className="surface-card h-[136px] shimmer rounded-[24px]" />
            )
          ))}
        </div>

        <section className="surface-card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-right">
              <h2 className="text-lg font-black text-white">أوامر النسخ والاستعادة</h2>
              <p className="mt-1 text-sm text-[#91a0ad]">
                تصدير نسخة كاملة، توليد قالب القاعدة، أو إنشاء نسخة داخل الخادم قبل أي عملية حساسة.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={busyAction === 'refresh'}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw size={16} className={busyAction === 'refresh' ? 'animate-spin' : ''} />
              <span>{busyAction === 'refresh' ? 'جارٍ التحديث...' : 'تحديث الحالة'}</span>
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <button
              onClick={handleCreateServerBackup}
              disabled={busyAction === 'create'}
              className="surface-card surface-card-hover flex min-h-[140px] flex-col items-start justify-between p-4 text-right disabled:opacity-60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#648ea9]/[0.16] text-[#dbe7f0]">
                <Save size={18} />
              </div>
              <div>
                <div className="text-base font-black text-white">إنشاء نسخة داخل الخادم</div>
                <div className="mt-1 text-sm leading-6 text-[#91a0ad]">يحفظ ملف JSON جديد ضمن مجلد النسخ المحلية في السيرفر.</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('/backups/export', 'alrawi-backup-export.json', 'تم تنزيل النسخة الاحتياطية:', 'export')}
              disabled={busyAction === 'export'}
              className="surface-card surface-card-hover flex min-h-[140px] flex-col items-start justify-between p-4 text-right disabled:opacity-60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#4f7d74]/[0.16] text-[#dceee8]">
                <Download size={18} />
              </div>
              <div>
                <div className="text-base font-black text-white">تصدير نسخة كاملة</div>
                <div className="mt-1 text-sm leading-6 text-[#91a0ad]">ينزّل نسخة JSON كاملة جاهزة للحفظ أو النقل أو الاسترجاع.</div>
              </div>
            </button>

            <button
              onClick={() => handleExport('/backups/template', 'alrawi-database-template.json', 'تم تنزيل قالب القاعدة:', 'template')}
              disabled={busyAction === 'template'}
              className="surface-card surface-card-hover flex min-h-[140px] flex-col items-start justify-between p-4 text-right disabled:opacity-60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#7c6f63]/[0.16] text-[#ead8c8]">
                <Database size={18} />
              </div>
              <div>
                <div className="text-base font-black text-white">تصدير قالب القاعدة</div>
                <div className="mt-1 text-sm leading-6 text-[#91a0ad]">هيكل الجداول والحقول فقط بدون بيانات تشغيلية.</div>
              </div>
            </button>

            <div className="surface-card flex min-h-[140px] flex-col items-start justify-between p-4 text-right">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#6f7a96]/[0.16] text-[#d9deeb]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="text-base font-black text-white">أمان الاستيراد</div>
                <div className="mt-1 text-sm leading-6 text-[#91a0ad]">
                  النظام ينشئ نسخة أمان تلقائية قبل الاستيراد، ويُبقي مستخدمي النظام الحاليين كما هم افتراضياً.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-card space-y-4 p-5">
            <div className="text-right">
              <h3 className="text-lg font-black text-white">استيراد نسخة احتياطية</h3>
              <p className="mt-1 text-sm text-[#91a0ad]">
                اختر ملف JSON تم تصديره من النظام، وسيتم أخذ نسخة أمان قبل الاستبدال.
              </p>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#cbd5df]">ملف النسخة</span>
              <input
                key={fileInputKey}
                type="file"
                accept=".json,application/json"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="input-field cursor-pointer pt-3"
              />
            </label>

            <div className="rounded-[22px] border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-[#b7c3ce]">
              {selectedFile ? (
                <div className="space-y-1">
                  <div className="font-semibold text-white">{selectedFile.name}</div>
                  <div dir="ltr">{formatBytes(selectedFile.size)}</div>
                </div>
              ) : (
                'لم يتم اختيار ملف بعد.'
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleImport}
                disabled={busyAction === 'import' || !selectedFile}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                <Upload size={16} />
                <span>{busyAction === 'import' ? 'جارٍ الاستيراد...' : 'استيراد النسخة'}</span>
              </button>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setFileInputKey((current) => current + 1);
                }}
                className="btn-outline"
              >
                تفريغ الحقل
              </button>
            </div>
          </section>

          <section className="surface-card space-y-4 p-5">
            <div className="text-right">
              <h3 className="text-lg font-black text-white">النسخ الاحتياطي اليومي</h3>
              <p className="mt-1 text-sm text-[#91a0ad]">
                متابعة النسخة اليومية على الخادم مع أمر الجدولة المقترح وملفات SQL المكتشفة.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] bg-white/[0.04] p-4">
                <div className="text-xs font-bold text-[#91a0ad]">الحالة</div>
                <div className="mt-2 text-sm font-bold text-white">
                  {status?.dailyBackup?.healthy ? 'سليم ويعمل' : 'يحتاج متابعة'}
                </div>
              </div>
              <div className="rounded-[22px] bg-white/[0.04] p-4">
                <div className="text-xs font-bold text-[#91a0ad]">آخر ملف SQL</div>
                <div className="mt-2 text-sm font-bold text-white">
                  {status?.dailyBackup?.latestBackup ? formatDateTime(status.dailyBackup.latestBackup.modifiedAt) : 'غير موجود'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-[#cbd5df]">أمر الجدولة المقترح</div>
              <div className="rounded-[22px] bg-[#0f141b] px-4 py-3 text-sm text-[#dbe7f0]" dir="ltr">
                {status?.dailyBackup?.recommendedCron || 'غير متوفر'}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleCopyCron} className="btn-outline flex items-center gap-2">
                  <Copy size={16} />
                  <span>نسخ الأمر</span>
                </button>
                <div className="rounded-full bg-white/[0.05] px-3 py-2 text-xs font-semibold text-[#9fb0be]">
                  الاحتفاظ الافتراضي: {status?.dailyBackup?.retentionDays ?? 14} يوم
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-[#b7c3ce]">
              <div dir="ltr">Script: {status?.dailyBackup?.scriptPath || 'غير متوفر'}</div>
              <div dir="ltr">SQL dir: {status?.directories?.dailySql || 'غير متوفر'}</div>
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <BackupFileTable
            title="نسخ JSON داخل النظام"
            subtitle="النسخ التي تم إنشاؤها وحفظها من خلال لوحة الإدارة"
            files={status?.latestBackups?.appGenerated || []}
            emptyLabel="لا توجد نسخ محفوظة داخل الخادم حتى الآن."
          />

          <BackupFileTable
            title="نسخ SQL اليومية"
            subtitle="الملفات المكتشفة في مجلد النسخ اليومي على الخادم"
            files={status?.latestBackups?.dailySql || []}
            emptyLabel="لم يتم العثور على نسخ SQL يومية بعد."
          />
        </div>
      </div>
    </div>
  );
}
