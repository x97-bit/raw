import { Upload } from "lucide-react";
import { formatBytes } from "../backupsPageHelpers";

export default function BackupImportPanel({
  selectedFile,
  fileInputKey,
  busyAction,
  onFileChange,
  onImport,
  onClear,
}) {
  return (
    <section className="surface-card space-y-4 p-5">
      <div className="text-right">
        <h3 className="text-lg font-black text-white">استيراد نسخة احتياطية</h3>
        <p className="mt-1 text-sm text-[#91a0ad]">
          اختر ملف JSON تم تصديره من النظام، وسيتم أخذ نسخة أمان قبل الاستبدال.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-[#cbd5df]">
          ملف النسخة
        </span>
        <input
          key={fileInputKey}
          type="file"
          accept=".json,application/json"
          onChange={event => onFileChange(event.target.files?.[0] || null)}
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
          "لم يتم اختيار ملف بعد."
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onImport}
          disabled={busyAction === "import" || !selectedFile}
          className="btn-primary flex items-center gap-2 disabled:opacity-60"
        >
          <Upload size={16} />
          <span>
            {busyAction === "import" ? "جارٍ الاستيراد..." : "استيراد النسخة"}
          </span>
        </button>
        <button onClick={onClear} className="btn-outline">
          تفريغ الحقل
        </button>
      </div>
    </section>
  );
}
