import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  CircleDot,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { InstallmentPayment } from "../../../types/installment";
import PaymentForm from "./payment-form";
import PaymentAccordion from "./payment-accordion";

interface ScheduleItem {
  index: number;
  dueDateJalali: string;
  dueDateGregorian: string;
  due: boolean;
  paid: boolean;
  payment?: InstallmentPayment;
}

interface PaymentScheduleProps {
  schedule: ScheduleItem[];
  facilityId: number;
  paymentMethodOptions: { value: string; label: string }[];
  onPaymentStored: (payment: InstallmentPayment) => void;
  onPaymentDeleted: (installmentNumber: number) => void;
  onError: (message: string) => void;
}

export default function PaymentSchedule({
  schedule,
  facilityId,
  paymentMethodOptions,
  onPaymentStored,
  onPaymentDeleted,
  onError,
}: PaymentScheduleProps) {
  const [paymentFormOpen, setPaymentFormOpen] = useState<number | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<number | null>(
    null,
  );
  const [unpayConfirmOpen, setUnpayConfirmOpen] = useState<number | null>(
    null,
  );

  // Summary counts
  const totalCount = schedule.length;
  const dueCount = schedule.filter((s) => s.due && !s.paid).length;
  const paidCount = schedule.filter((s) => s.paid).length;
  const remainingCount = totalCount - paidCount;

  if (schedule.length === 0) return null;

  return (
    <div className="sticky top-0 z-10 mt-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Calendar className="h-4.5 w-4.5 text-indigo-500" />
        <h2 className="text-sm font-bold text-gray-900">
          برنامه پرداخت اقساط
        </h2>
      </div>

      {/* Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-gray-50 p-3 text-center">
          <p className="text-[11px] font-semibold text-gray-500">
            تعداد کل
          </p>
          <p className="mt-0.5 text-lg font-bold text-gray-900">
            {totalCount}
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 p-3 text-center">
          <p className="text-[11px] font-semibold text-amber-600">
            سررسید شده
          </p>
          <p className="mt-0.5 text-lg font-bold text-amber-700">
            {dueCount}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 text-center">
          <p className="text-[11px] font-semibold text-emerald-600">
            پرداخت شده
          </p>
          <p className="mt-0.5 text-lg font-bold text-emerald-700">
            {paidCount}
          </p>
        </div>
        <div className="rounded-xl bg-rose-50 p-3 text-center">
          <p className="text-[11px] font-semibold text-rose-600">
            باقی‌مانده
          </p>
          <p className="mt-0.5 text-lg font-bold text-rose-700">
            {remainingCount}
          </p>
        </div>
      </div>

      {/* Schedule list */}
      <div className="max-h-[50vh] space-y-2 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
        {schedule.map((item) => (
          <div key={item.index}>
            {/* Main installment row */}
            <div
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                item.paid
                  ? "border-emerald-200/60 bg-emerald-50/50"
                  : item.due
                    ? "border-amber-200/60 bg-amber-50/30"
                    : "border-black/5 bg-gray-50/50"
              }`}
            >
              {/* Checkbox */}
              {item.paid ? (
                <button
                  type="button"
                  onClick={() => setUnpayConfirmOpen(item.index)}
                  className="shrink-0 focus:outline-none"
                  aria-label={`لغو پرداخت قسط ${item.index}`}
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentFormOpen(item.index);
                    setExpandedAccordion(null);
                  }}
                  disabled={paymentFormOpen !== null}
                  className="shrink-0 focus:outline-none disabled:opacity-50"
                  aria-label={`پرداخت قسط ${item.index}`}
                >
                  {item.due ? (
                    <CircleDot className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </button>
              )}

              {/* Installment info */}
              <div className="flex flex-1 items-center justify-between gap-2">
                <span className="text-sm font-bold text-gray-900">
                  قسط {item.index}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    سررسید: {item.dueDateJalali}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.paid
                        ? "bg-emerald-100 text-emerald-700"
                        : item.due
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {item.paid
                      ? "پرداخت شده"
                      : item.due
                        ? "سررسید شده"
                        : "آینده"}
                  </span>
                  {item.paid && item.payment && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAccordion(
                          expandedAccordion === item.index ? null : item.index,
                        )
                      }
                      className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-600"
                    >
                      {expandedAccordion === item.index ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Accordion */}
            {item.paid && item.payment && expandedAccordion === item.index && (
              <PaymentAccordion payment={item.payment} />
            )}

            {/* Payment form */}
            {paymentFormOpen === item.index && (
              <PaymentForm
                installmentNumber={item.index}
                facilityId={facilityId}
                paymentMethodOptions={paymentMethodOptions}
                onStored={(payment) => {
                  onPaymentStored(payment);
                  setPaymentFormOpen(null);
                }}
                onCancel={() => setPaymentFormOpen(null)}
                onError={onError}
              />
            )}
          </div>
        ))}
      </div>

      {/* Unpay confirmation */}
      {unpayConfirmOpen !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/40 bg-white/90 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-[15px] font-bold text-gray-900">
              لغو پرداخت
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              آیا از لغو پرداخت قسط {unpayConfirmOpen} اطمینان دارید؟
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={async () => {
                  const success = await deletePayment(
                    facilityId,
                    unpayConfirmOpen,
                  );
                  if (success) {
                    onPaymentDeleted(unpayConfirmOpen);
                  }
                  setUnpayConfirmOpen(null);
                }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:bg-red-600"
              >
                بله، لغو شود
              </button>
              <button
                type="button"
                onClick={() => setUnpayConfirmOpen(null)}
                className="flex flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions used by the hook
async function deletePayment(
  facilityId: number,
  installmentNumber: number,
): Promise<boolean> {
  try {
    const { default: api } = await import("../../../lib/api");
    await api.delete(
      `/installments/${facilityId}/payments/${installmentNumber}`,
    );
    return true;
  } catch {
    return false;
  }
}
