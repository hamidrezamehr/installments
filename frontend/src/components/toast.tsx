import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export type ToastVariant = "success" | "error";

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

const TOAST_DURATION_MS = 3500;

/**
 * Minimal toast notification system.
 *
 * Returns a render hook for the toast container plus `notify`/`clearToast`
 * helpers. Toasts auto-dismiss; the UI reflects actual app state (no fake
 * delays or setTimeout-based state sync).
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearToast = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    setToast(null);
  }, []);

  const notify = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
      setToast({ id: Date.now(), message, variant });
      dismissTimer.current = setTimeout(() => {
        setToast(null);
        dismissTimer.current = null;
      }, TOAST_DURATION_MS);
    },
    [],
  );

  // Clear any pending timer when the component unmounts.
  useEffect(() => {
    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, []);

  const renderToast = () => {
    if (!toast) return null;

    return (
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
      >
        <div
          className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.variant === "success"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {toast.variant === "success" ? (
            <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          )}
          <span className="whitespace-normal">{toast.message}</span>
          <button
            type="button"
            onClick={clearToast}
            aria-label="بستن پیام"
            className="mr-1 shrink-0 rounded-md p-1 text-xs opacity-60 transition-opacity hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return { notify, clearToast, renderToast };
}