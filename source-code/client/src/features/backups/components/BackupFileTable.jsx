import { formatBytes, formatDateTime } from '../backupsPageHelpers';

export default function BackupFileTable({ title, subtitle, files, emptyLabel }) {
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
