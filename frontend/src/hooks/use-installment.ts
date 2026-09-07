import { useState, useEffect } from "react";
import type { InstallmentRecord, InstallmentPayment } from "../types/installment";
import * as installmentApi from "../services/installment-api";

interface UseInstallmentResult {
  record: InstallmentRecord | null;
  payments: InstallmentPayment[];
  loading: boolean;
  error: string;
  setError: (error: string) => void;
}

/** Hook to fetch and manage a single installment's data */
export function useInstallment(id: string | undefined): UseInstallmentResult {
  const [record, setRecord] = useState<InstallmentRecord | null>(null);
  const [payments, setPayments] = useState<InstallmentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        const data = await installmentApi.getInstallment(Number(id));
        if (!cancelled) {
          setRecord(data);
          if (data.payments) {
            setPayments(data.payments);
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;

        let message = "خطا در دریافت اطلاعات قسط";

        if (
          typeof err === "object" &&
          err !== null &&
          "isAxiosError" in err &&
          typeof (err as { isAxiosError: Function }).isAxiosError === "function"
        ) {
          const axiosErr = err as {
            response?: {
              data?: { message?: string; detail?: string };
              status?: number;
              statusText?: string;
            };
          };
          const respData = axiosErr.response?.data;
          if (respData?.message) {
            message = respData.message;
            if (respData.detail) message += ` (${respData.detail})`;
          } else if (axiosErr.response?.status === 404) {
            message = "قسط مورد نظر یافت نشد";
          } else if (axiosErr.response?.status === 401) {
            message = "احراز هویت ناموفق. لطفاً دوباره وارد شوید.";
          } else if (axiosErr.response?.statusText) {
            message = `${axiosErr.response.status} - ${axiosErr.response.statusText}`;
          }
        } else if (err instanceof Error) {
          message = err.message;
        }

        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { record, payments, loading, error, setError };
}
