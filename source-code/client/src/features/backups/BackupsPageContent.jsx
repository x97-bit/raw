import { useEffect, useMemo, useState, useTransition } from "react";
import { trpc } from "../../utils/trpc";
import {
  ArchiveRestore,
  Clock3,
  Database,
  Download,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import BackupActionCard from "./components/BackupActionCard";
import BackupFileTable from "./components/BackupFileTable";
import BackupImportPanel from "./components/BackupImportPanel";
import BackupSummaryCard from "./components/BackupSummaryCard";
import DailyBackupPanel from "./components/DailyBackupPanel";
import {
  IMPORT_CONFIRM_PHRASE,
  buildBackupSummaryCards,
  downloadProtectedFile,
  getBackupMessageClassName,
} from "./backupsPageHelpers";

export default function BackupsPageContent({ onBack }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const messageClassName = useMemo(
    () => getBackupMessageClassName(messageType),
    [messageType]
  );

  const summaryCards = useMemo(
    () =>
      buildBackupSummaryCards(status, {
        Database,
        Save,
        Clock3,
        ArchiveRestore,
      }),
    [status]
  );

  const resetSelectedFile = () => {
    setSelectedFile(null);
    setFileInputKey(current => current + 1);
  };

  const loadStatus = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const response = await trpc.backups.status.query();
      setStatus(response);
    } catch (error) {
      setMessageType("error");
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

  const handleRefresh = () => {
    setBusyAction("refresh");
    startTransition(async () => {
      try {
        await loadStatus({ silent: true });
        setMessageType("success");
        setMessage("تم تحديث حالة النسخ الاحتياطي.");
      } finally {
        setBusyAction("");
      }
    });
  };

  const handleCreateServerBackup = () => {
    setBusyAction("create");
    startTransition(async () => {
      try {
        const result = await trpc.backups.create.mutate();
        await loadStatus({ silent: true });
        setMessageType("success");
        setMessage(
          `${result.message} ${result.file?.fileName ? `الملف: ${result.file.fileName}` : ""}`.trim()
        );
      } catch (error) {
        setMessageType("error");
        setMessage(error.message);
      } finally {
        setBusyAction("");
      }
    });
  };

  const handleExport = (actionKey, isTemplate = false) => {
    setBusyAction(actionKey);

    startTransition(async () => {
      try {
        const result = isTemplate
          ? await trpc.backups.template.mutate()
          : await trpc.backups.export.mutate();

        // Create a blob and trigger download manually since tRPC returns JSON
        const blob = new Blob([JSON.stringify(result.payload, null, 2)], {
          type: "application/json; charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = result.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setMessageType("success");
        setMessage(
          `تم تنزيل ${isTemplate ? "قالب القاعدة" : "النسخة الاحتياطية"}: ${result.fileName}`
        );
      } catch (error) {
        setMessageType("error");
        setMessage(error.message);
      } finally {
        setBusyAction("");
      }
    });
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessageType("error");
      setMessage("اختر ملف JSON أولاً.");
      return;
    }

    if (
      !window.confirm("سيتم أخذ نسخة أمان قبل الاستيراد. هل تريد المتابعة؟")
    ) {
      return;
    }

    setBusyAction("import");

    startTransition(async () => {
      try {
        const rawText = await selectedFile.text();
        const parsedBackup = JSON.parse(rawText);

        const result = await trpc.backups.import.mutate({
          backup: parsedBackup,
          sourceFileName: selectedFile.name,
          confirmPhrase: IMPORT_CONFIRM_PHRASE,
        });

        resetSelectedFile();
        await loadStatus({ silent: true });
        setMessageType("success");
        setMessage(
          `${result.message} ${result.preImportBackup?.fileName ? `نسخة الأمان: ${result.preImportBackup.fileName}` : ""}`.trim()
        );
      } catch (error) {
        const fallbackMessage =
          error instanceof SyntaxError
            ? "الملف المحدد ليس JSON صالحاً."
            : error.message;

        setMessageType("error");
        setMessage(fallbackMessage);
      } finally {
        setBusyAction("");
      }
    });
  };

  const handleCopyCron = async () => {
    const cronValue = status?.dailyBackup?.recommendedCron;
    if (!cronValue) return;

    try {
      await navigator.clipboard.writeText(cronValue);
      setMessageType("success");
      setMessage("تم نسخ أمر النسخ اليومي.");
    } catch {
      setMessageType("error");
      setMessage("تعذر نسخ الأمر تلقائياً. انسخه يدوياً من المربع أدناه.");
    }
  };

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
          <div
            className={`rounded-[22px] border px-4 py-3 text-sm font-semibold ${messageClassName}`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(loading ? new Array(4).fill(null) : summaryCards).map(
            (card, index) =>
              card ? (
                <BackupSummaryCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  hint={card.hint}
                  icon={card.icon}
                  accent={card.accent}
                />
              ) : (
                <div
                  key={`skeleton-${index}`}
                  className="surface-card h-[136px] shimmer rounded-[24px]"
                />
              )
          )}
        </div>

        <section className="surface-card space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-right">
              <h2 className="text-lg font-black text-white">
                أوامر النسخ والاستعادة
              </h2>
              <p className="mt-1 text-sm text-[#91a0ad]">
                تصدير نسخة كاملة، توليد قالب القاعدة، أو إنشاء نسخة داخل الخادم
                قبل أي عملية حساسة.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={busyAction === "refresh"}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw
                size={16}
                className={busyAction === "refresh" ? "animate-spin" : ""}
              />
              <span>
                {busyAction === "refresh" ? "جارٍ التحديث..." : "تحديث الحالة"}
              </span>
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <BackupActionCard
              title="إنشاء نسخة داخل الخادم"
              description="يحفظ ملف JSON جديد ضمن مجلد النسخ المحلية في السيرفر."
              icon={Save}
              accentBgClass="bg-[#648ea9]/[0.16]"
              accentTextClass="text-[#dbe7f0]"
              onClick={handleCreateServerBackup}
              disabled={busyAction === "create"}
            />

            <BackupActionCard
              title="تصدير نسخة كاملة"
              description="ينزّل نسخة JSON كاملة جاهزة للحفظ أو النقل أو الاسترجاع."
              icon={Download}
              accentBgClass="bg-[#4f7d74]/[0.16]"
              accentTextClass="text-[#dceee8]"
              onClick={() => handleExport("export", false)}
              disabled={busyAction === "export" || isPending}
            />

            <BackupActionCard
              title="تصدير قالب القاعدة"
              description="هيكل الجداول والحقول فقط بدون بيانات تشغيلية."
              icon={Database}
              accentBgClass="bg-[#7c6f63]/[0.16]"
              accentTextClass="text-[#ead8c8]"
              onClick={() => handleExport("template", true)}
              disabled={busyAction === "template" || isPending}
            />

            <BackupActionCard
              title="أمان الاستيراد"
              description="النظام ينشئ نسخة أمان تلقائية قبل الاستيراد، ويُبقي مستخدمي النظام الحاليين كما هم افتراضياً."
              icon={ShieldCheck}
              accentBgClass="bg-[#6f7a96]/[0.16]"
              accentTextClass="text-[#d9deeb]"
            />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <BackupImportPanel
            selectedFile={selectedFile}
            fileInputKey={fileInputKey}
            busyAction={busyAction}
            onFileChange={setSelectedFile}
            onImport={handleImport}
            onClear={resetSelectedFile}
          />

          <DailyBackupPanel status={status} onCopyCron={handleCopyCron} />
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
