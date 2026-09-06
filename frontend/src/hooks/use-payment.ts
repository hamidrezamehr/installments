import { useState, useCallback } from "react";
import * as installmentApi from "../services/installment-api";

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
        let message = "خطا در ثبت پرداخت";
        if (
          typeof err === "object" &&
          err !== null &&
          "isAxiosError" in err &&
          typeof (err as { isAxiosError: Function }).isAxiosError === "function"
        ) {
          const axiosErr = err as {
            response?: { data?: { message?: string } };
          };
          if (axiosErr.response?.data?.message) {
            message = axiosErr.response.data.message;
          }
        }
        setError(message);
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
        let message = "خطا در لغو پرداخت";
        if (
          typeof err === "object" &&
          err !== null &&
          "isAxiosError" in err &&
          typeof (err as { isAxiosError: Function }).isAxiosError === "function"
        ) {
          const axiosErr = err as {
            response?: { data?: { message?: string } };
          };
          if (axiosErr.response?.data?.message) {
            message = axiosErr.response.data.message;
          }
        }
        setError(message);
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
