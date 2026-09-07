import { useState, useEffect } from "react";
import type { InstallmentRecord, InstallmentPayment } from "../types/installment";
import * as installmentApi from "../services/installment-api";
import { getApiErrorMessage } from "../lib/api-errors";

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
        setError(getApiErrorMessage(err, "خطا در دریافت اطلاعات قسط"));
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
