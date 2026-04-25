import { X } from "lucide-react";
import ModalPortal from "../../../components/ModalPortal";

export default function UserManagementModalShell({
  title,
  subtitle,
  maxWidth = "max-w-md",
  onClose,
  children,
}) {
  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4"
        onMouseDown={event => event.target === event.currentTarget && onClose()}
      >
        <div
          className={`my-auto w-full overflow-y-auto rounded-2xl bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_16px_48px_rgba(0,0,0,0.12),0_32px_80px_rgba(0,0,0,0.08)] ${maxWidth}`}
          onMouseDown={event => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition-all hover:bg-gray-100"
            >
              <X size={17} className="text-gray-400" />
            </button>
          </div>
          <div className="p-6">
            {subtitle && (
              <p className="mb-4 text-sm font-medium text-gray-400">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
