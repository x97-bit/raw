import { Copy } from 'lucide-react';
import { formatDateTime } from '../backupsPageHelpers';

export default function DailyBackupPanel({ status, onCopyCron }) {
  return (
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
          <button onClick={onCopyCron} className="btn-outline flex items-center gap-2">
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
  );
}
