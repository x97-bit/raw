export const IMPORT_CONFIRM_PHRASE = "IMPORT_BACKUP";

export function formatBytes(sizeBytes) {
  const bytes = Number(sizeBytes || 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDateTime(value) {
  if (!value) return "غير متوفر";

  try {
    return new Intl.DateTimeFormat("ar-IQ-u-nu-latn", {
      dateStyle: "medium",
      timeStyle: "short",
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

export async function downloadProtectedFile(authFetch, endpoint, fallbackName) {
  const response = await authFetch(endpoint, {
    method: "GET",
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { error: await response.text() };

    throw new Error(data?.error || "فشل تنزيل الملف.");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = extractFileName(
    response.headers.get("content-disposition"),
    fallbackName
  );

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);

  return link.download;
}

export function getBackupMessageClassName(messageType) {
  if (messageType === "success") {
    return "border-[#8eb8ad]/20 bg-[#8eb8ad]/[0.08] text-[#dceee8]";
  }

  if (messageType === "error") {
    return "border-[#b76169]/20 bg-[#b76169]/[0.08] text-[#f4d4d8]";
  }

  return "border-[#648ea9]/20 bg-[#648ea9]/[0.08] text-[#dbe7f0]";
}

export function buildBackupSummaryCards(status, icons) {
  if (!status) return [];

  const { Database, Save, Clock3, ArchiveRestore } = icons;

  return [
    {
      title: "الحسابات",
      value: status.tableCounts?.accounts ?? 0,
      hint: "إجمالي الحسابات داخل قاعدة البيانات",
      icon: Database,
      accent: "#648ea9",
    },
    {
      title: "المعاملات",
      value: status.tableCounts?.transactions ?? 0,
      hint: "كل الفواتير والسندات المصدرة",
      icon: Save,
      accent: "#7c6f63",
    },
    {
      title: "آخر نسخة يومية",
      value: status.dailyBackup?.latestBackup
        ? formatDateTime(status.dailyBackup.latestBackup.modifiedAt)
        : "غير موجودة",
      hint: status.dailyBackup?.healthy
        ? "النسخ اليومي يعمل بشكل طبيعي"
        : "يحتاج متابعة أو تفعيل",
      icon: Clock3,
      accent: status.dailyBackup?.healthy ? "#4f7d74" : "#b76169",
    },
    {
      title: "نسخ JSON المخزنة",
      value: status.latestBackups?.appGenerated?.length ?? 0,
      hint: "آخر النسخ التي أُنشئت من داخل النظام",
      icon: ArchiveRestore,
      accent: "#6f7a96",
    },
  ];
}
