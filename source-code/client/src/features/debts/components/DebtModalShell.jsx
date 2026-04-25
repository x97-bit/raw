import { X } from "lucide-react";
import ModalPortal from "../../../components/ModalPortal";

export default function DebtModalShell({
  title,
  subtitle,
  widthClass = "w-[min(80rem,calc(100vw-1.5rem))]",
  onClose,
  children,
}) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/45 p-3 sm:p-4"
        onMouseDown={event => event.target === event.currentTarget && onClose()}
      >
        <div
          className={`${widthClass} max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-2xl bg-white shadow-[0_10px_45px_rgba(15,23,42,0.18)] sm:max-h-[calc(100vh-2rem)]`}
          onMouseDown={event => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
            <div className="text-right">
              <h2 className="text-lg font-bold text-primary-900">{title}</h2>
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          {children}
        </div>
      </div>
    </ModalPortal>
  );
}
