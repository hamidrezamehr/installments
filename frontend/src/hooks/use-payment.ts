import { useState, useCallback } from "react";
import * as installmentApi from "../services/installment-api";
import { getApiErrorMessage } from "../lib/api-errors";

interface UsePaymentResult {
  storePayment: (
    installmentId: number,
    installmentNumber: number,
    paymentMethod: string,
    paymentDate: string,
    note?: string,
  ) => Promise<boolean>;
  deletePayment: (
    installmentId: number,
    installmentNumber: number,
  ) => Promise<boolean>;
  submitting: boolean;
  error: string;
  setError: (error: string) => void;
}

/** Hook for payment store/delete operations */
export function usePayment(): UsePaymentResult {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const storePayment = useCallback(
    async (
      installmentId: number,
      installmentNumber: number,
      paymentMethod: string,
      paymentDate: string,
      note?: string,
    ): Promise<boolean> => {
      if (submitting) return false;

      setSubmitting(true);
      setError("");

      try {
        await installmentApi.storePayment(
          installmentId,
          installmentNumber,
          paymentMethod,
          paymentDate,
          note,
        );
        return true;
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "خطا در ثبت پرداخت"));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [submitting],
  );

  const deletePaymentOp = useCallback(
    async (
      installmentId: number,
      installmentNumber: number,
    ): Promise<boolean> => {
      setSubmitting(true);
      setError("");

      try {
        await installmentApi.deletePayment(installmentId, installmentNumber);
        return true;
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "خطا در لغو پرداخت"));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return {
    storePayment,
    deletePayment: deletePaymentOp,
    submitting,
    error,
    setError,
  };
}
