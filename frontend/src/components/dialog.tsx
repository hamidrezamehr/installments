import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Small square visual beside the title (optional). */
  icon?: ReactNode;
  children: ReactNode;
}

/**
 * General-purpose modal dialog: portal, backdrop click-outside, Escape to
 * close, and a clear close button. Renders as a bottom sheet on small
 * screens and a centered dialog on desktop. Complements ConfirmDialog,
 * which is specific to confirmation prompts.
 */
export default function Dialog({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
}: DialogProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-2xl shadow-black/10 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
          {icon}
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body — scrollable when content exceeds the max height */}
        <div className="overflow-y-auto px-5 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
